/**
 * Generator core with improved observability hooks and error classes.
 */
import { TemplateEngine } from './template-engine';
import { Customizer } from './customizer';
import { Packager } from './packager';
import { TemplateNotFoundError, ValidationError, GeneratorError } from './errors';
import { logger } from '../server/logger';
import { registerRealmInUBL, generateRealmId } from './ubl-integration';
import { SecurityValidator } from './security/validator';
import { globalRateLimiter } from './security/rate-limiter';
export class Generator {
    constructor() {
        this.templateEngine = new TemplateEngine();
        this.customizer = new Customizer();
        this.packager = new Packager();
    }
    async generate(input, onProgress) {
        const startTime = Date.now();
        const emit = (p, m) => onProgress?.({ progress: p, message: m });
        // SECURITY: Rate limiting
        const rateLimitKey = input.userId || 'anonymous';
        const rateLimitResult = globalRateLimiter.isAllowed(rateLimitKey);
        if (!rateLimitResult.allowed) {
            logger.warn('generate:rate-limit-exceeded', { userId: input.userId, error: rateLimitResult.error });
            throw new GeneratorError(rateLimitResult.error || 'Rate limit exceeded');
        }
        // SECURITY: Validar template ID
        const templateValidation = SecurityValidator.validateTemplateId(input.templateId);
        if (!templateValidation.valid) {
            logger.warn('generate:invalid-template-id', { templateId: input.templateId, error: templateValidation.error });
            throw new TemplateNotFoundError(templateValidation.error || 'Invalid template ID');
        }
        logger.info('generate:start', { templateId: input.templateId, userId: input.userId });
        emit(10, 'Loading template');
        const template = await this.templateEngine.load(templateValidation.sanitized);
        if (!template) {
            logger.warn('generate:template-not-found', { templateId: input.templateId });
            throw new TemplateNotFoundError(input.templateId);
        }
        emit(30, 'Validating answers');
        // SECURITY: Validar e sanitizar answers
        const answersValidation = SecurityValidator.validateAnswers(input.answers);
        if (!answersValidation.valid) {
            logger.warn('generate:invalid-answers', { errors: answersValidation.errors });
            throw new ValidationError(`Invalid answers: ${answersValidation.errors.join(', ')}`);
        }
        this.validateAnswers(template, answersValidation.sanitized);
        emit(50, 'Customizing code');
        // Usar answers sanitizadas
        const customized = await this.customizer.apply(template, answersValidation.sanitized);
        emit(75, 'Packaging');
        // Note: realmScopedKey will be passed via result object
        const packaged = await this.packager.package(customized, input.deployTarget, result.realmScopedKey);
        emit(95, 'Finalizing');
        const generationTime = Date.now() - startTime;
        const toolId = this.generateId();
        const result = {
            id: toolId,
            template: input.templateId,
            code: customized.code,
            config: customized.config,
            deployment: packaged,
            metadata: {
                generatedAt: new Date(),
                generationTime,
                estimatedCost: this.calculateCost(template, input.answers),
            },
        };
        // SAGA PATTERN: State tracking for transactional deployment
        let realmRegistered = false;
        let realmId = null;
        let deploymentStarted = false;
        try {
            // STATE 1: Register Realm in UBL
            emit(85, 'Registering Realm in UBL');
            realmId = generateRealmId(toolId);
            const realmRegistration = await registerRealmInUBL({
                id: realmId,
                name: input.answers.companyName || customized.config.settings?.companyName || 'Generated Tool',
                agreements: customized.code.agreements,
                metadata: {
                    toolId,
                    templateId: input.templateId,
                    generatedAt: result.metadata.generatedAt.toISOString()
                }
            });
            if (!realmRegistration.success) {
                throw new GeneratorError(`Realm registration failed: ${realmRegistration.error}`);
            }
            realmRegistered = true;
            logger.info('generate:realm-registered', { toolId, realmId: realmRegistration.realmId });
            // STATE 1.5: Get realm-scoped API key from UBL
            emit(87, 'Obtaining realm-scoped API key');
            const realmScopedKey = await this.getRealmScopedKey(realmRegistration.realmId);
            // Add realm ID and scoped key to config for deployment
            result.config.environment.REALM_ID = realmRegistration.realmId;
            result.config.secrets.UBL_API_KEY = realmScopedKey; // Store as secret, not env var
            result.realmId = realmRegistration.realmId;
            result.realmScopedKey = realmScopedKey; // Pass to packager
            // STATE 2: Deploy to Platform (if deployment is requested)
            if (input.deployTarget && input.deployTarget !== 'docker') {
                emit(90, 'Deploying to platform');
                deploymentStarted = true;
                // Note: Actual deployment integration would go here
                // For now, we just mark that deployment was attempted
                logger.info('generate:deployment-initiated', { toolId, target: input.deployTarget });
            }
            logger.info('generate:complete', { templateId: input.templateId, userId: input.userId, generationTime });
            emit(100, 'Complete');
            return result;
        }
        catch (error) {
            // COMPENSATION LOGIC (Saga Rollback)
            logger.error('generate:saga-error', {
                toolId,
                realmId,
                realmRegistered,
                deploymentStarted,
                error: error.message,
                stack: error.stack
            });
            emit(0, 'Rolling back due to error');
            const compensationErrors = [];
            // Rollback Realm registration if it succeeded
            if (realmRegistered && realmId) {
                logger.warn('generate:compensating-realm', { realmId });
                try {
                    await this.compensateRealmRegistration(realmId);
                    logger.info('generate:realm-compensated', { realmId });
                }
                catch (compensateError) {
                    compensationErrors.push(`Realm cleanup failed: ${compensateError.message}`);
                    logger.error('generate:compensation-failed', {
                        realmId,
                        originalError: error.message,
                        compensationError: compensateError.message
                    });
                }
            }
            // Rollback deployment if it was started
            if (deploymentStarted) {
                logger.warn('generate:compensating-deployment', { toolId, realmId });
                try {
                    // Note: Actual deployment rollback would go here
                    // For now, we just log that it needs manual cleanup
                    logger.info('generate:deployment-rollback-needed', { toolId, realmId });
                }
                catch (deployError) {
                    compensationErrors.push(`Deployment cleanup failed: ${deployError.message}`);
                }
            }
            // If compensation failed, wrap error with compensation info
            if (compensationErrors.length > 0) {
                const enhancedError = new GeneratorError(`${error.message}\n\nCompensation errors:\n${compensationErrors.join('\n')}\n\nManual cleanup may be required for realm: ${realmId}`);
                enhancedError.cause = error;
                throw enhancedError;
            }
            // Re-throw original error if compensation succeeded
            throw error;
        }
    }
    /**
     * Get realm-scoped API key from UBL delegation endpoint
     */
    async getRealmScopedKey(realmId) {
        const ublAntennaUrl = process.env.UBL_ANTENNA_URL || 'http://localhost:3000';
        const masterKey = process.env.UBL_MASTER_API_KEY || process.env.UBL_API_KEY;
        if (!masterKey) {
            logger.warn('generate:no-master-key', { realmId });
            // Fallback: return placeholder (will need manual configuration)
            return 'PLACEHOLDER_REALM_SCOPED_KEY';
        }
        try {
            const response = await fetch(`${ublAntennaUrl}/auth/delegate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${masterKey}`,
                },
                body: JSON.stringify({ realmId }),
            });
            if (!response.ok) {
                const error = await response.text();
                logger.warn('generate:delegation-failed', { realmId, error });
                throw new Error(`Failed to get realm-scoped key: ${error || response.statusText}`);
            }
            const data = await response.json();
            logger.info('generate:realm-scoped-key-obtained', { realmId });
            return data.token;
        }
        catch (error) {
            logger.error('generate:delegation-error', { realmId, error: error.message });
            // Don't fail generation if delegation fails - user can configure manually
            return 'PLACEHOLDER_REALM_SCOPED_KEY';
        }
    }
    /**
     * Compensate Realm registration by deleting the Realm from UBL
     * Called when deployment fails after Realm was created
     *
     * This ensures no "orphaned" realms are left if generation fails
     */
    async compensateRealmRegistration(realmId) {
        const ublAntennaUrl = process.env.UBL_ANTENNA_URL || 'http://localhost:3000';
        const masterKey = process.env.UBL_MASTER_API_KEY || process.env.UBL_API_KEY;
        if (!masterKey) {
            logger.warn('generate:no-master-key-for-cleanup', { realmId });
            throw new Error('Master API key not configured - cannot cleanup realm');
        }
        try {
            // Attempt to delete the realm
            const response = await fetch(`${ublAntennaUrl}/realms/${realmId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${masterKey}`
                },
                // Add timeout to prevent hanging
                signal: AbortSignal.timeout(10000) // 10s timeout
            });
            if (!response.ok) {
                // 404 is acceptable - realm might not exist or already deleted
                if (response.status === 404) {
                    logger.info('generate:realm-already-deleted', { realmId });
                    return;
                }
                const error = await response.text().catch(() => response.statusText);
                throw new Error(`Failed to delete Realm ${realmId}: ${error || response.statusText}`);
            }
            logger.info('generate:realm-deleted', { realmId });
        }
        catch (error) {
            // Don't throw if it's a timeout or network error - log for manual cleanup
            if (error.name === 'AbortError' || error.name === 'TimeoutError') {
                logger.error('generate:realm-deletion-timeout', { realmId });
                throw new Error(`Timeout deleting realm ${realmId} - manual cleanup required`);
            }
            logger.error('generate:realm-deletion-failed', { realmId, error: error.message });
            throw error;
        }
    }
    validateAnswers(template, answers) {
        const questions = template.questions;
        for (const q of questions) {
            const val = answers[q.id];
            if (q.required && (val === undefined || val === null || val === '')) {
                throw new ValidationError(`Missing required answer: ${q.id}`, { question: q });
            }
            if (val === undefined || val === null)
                continue;
            switch (q.type) {
                case 'single':
                    if (q.options && !q.options.includes(val)) {
                        throw new ValidationError(`Invalid value for ${q.id}. Allowed: ${q.options.join(', ')}`, { provided: val });
                    }
                    break;
                case 'multiple':
                    if (!Array.isArray(val))
                        throw new ValidationError(`Answer for ${q.id} must be an array`);
                    if (q.options) {
                        const invalid = val.filter(v => !q.options.includes(v));
                        if (invalid.length) {
                            throw new ValidationError(`Invalid value(s) for ${q.id}: ${invalid.join(', ')}`, { provided: val });
                        }
                    }
                    break;
                case 'number':
                    if (typeof val !== 'number' || Number.isNaN(val))
                        throw new ValidationError(`Answer for ${q.id} must be a number`);
                    if (q.validation?.min !== undefined && val < q.validation.min)
                        throw new ValidationError(`${q.id} must be >= ${q.validation.min}`);
                    if (q.validation?.max !== undefined && val > q.validation.max)
                        throw new ValidationError(`${q.id} must be <= ${q.validation.max}`);
                    break;
                case 'text':
                    if (typeof val !== 'string')
                        throw new ValidationError(`Answer for ${q.id} must be a string`);
                    if (q.validation?.pattern) {
                        const re = new RegExp(q.validation.pattern);
                        if (!re.test(val))
                            throw new ValidationError(`${q.id} does not match required pattern`);
                    }
                    break;
            }
        }
        // Example dependency checks
        const integrations = answers['integrations'] || [];
        const features = answers['features'] || [];
        if (Array.isArray(integrations) && integrations.includes('slack') && !(Array.isArray(features) && features.includes('notifications'))) {
            throw new ValidationError('Slack integration requires notifications feature');
        }
    }
    generateId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        return `tool-${timestamp}-${random}`;
    }
    calculateCost(template, answers) {
        let cost = 9900; // $99 in cents
        const users = answers.users || 0;
        if (users > 1000)
            cost = 49900;
        else if (users > 100)
            cost = 19900;
        const features = answers.features || [];
        // Template pricing impacts if defined
        const pricingMap = {};
        const available = template.features?.available || [];
        for (const f of available) {
            if (f.pricingImpact)
                pricingMap[f.id] = f.pricingImpact;
        }
        for (const f of features) {
            if (pricingMap[f])
                cost += pricingMap[f];
        }
        return cost;
    }
}
