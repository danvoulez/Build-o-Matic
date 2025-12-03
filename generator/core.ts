/**
 * Generator core with improved observability hooks and error classes.
 */
import { TemplateEngine } from './template-engine';
import { Customizer } from './customizer';
import { Packager } from './packager';
import { TemplateNotFoundError, ValidationError, GeneratorError } from './errors';
import { logger } from '../server/logger';
import { registerRealmInUBL, generateRealmId, checkUBLAvailability } from './ubl-integration';
import { SecurityValidator } from './security/validator';
import { globalRateLimiter } from './security/rate-limiter';

export interface GenerationInput {
  templateId: string;
  answers: Record<string, any>;
  userId: string;
  deployTarget: 'railway' | 'render' | 'docker';
}

export interface GeneratedTool {
  id: string;
  template: string;
  code: { 
      frontend: string; 
      intents: string; 
      agreements: string;
    };
  config: {
    environment: Record<string, string>;
    secrets: Record<string, string>;
    dependencies: string[];
    settings?: Record<string, any>;
  };
  deployment: {
    type: string;
    package: Buffer | null;
    instructions: string;
    url?: string;
  };
  metadata: {
    generatedAt: Date;
    generationTime: number;
    estimatedCost: number;
  };
}

type ProgressEvent = { progress: number; message: string };

export class Generator {
  private templateEngine: TemplateEngine;
  private customizer: Customizer;
  private packager: Packager;

  constructor() {
    this.templateEngine = new TemplateEngine();
    this.customizer = new Customizer();
    this.packager = new Packager();
  }

  async generate(input: GenerationInput, onProgress?: (evt: ProgressEvent) => void): Promise<GeneratedTool> {
    const startTime = Date.now();
    const emit = (p: number, m: string) => onProgress?.({ progress: p, message: m });

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
    const customized = await this.customizer.apply(template as any, answersValidation.sanitized);

    emit(75, 'Packaging');
    const packaged = await this.packager.package(customized, input.deployTarget);

    emit(95, 'Finalizing');
    const generationTime = Date.now() - startTime;
    const toolId = this.generateId();
    const result: GeneratedTool = {
      id: toolId,
      template: input.templateId,
      code: customized.code,
      config: customized.config,
      deployment: packaged,
      metadata: {
        generatedAt: new Date(),
        generationTime,
        estimatedCost: this.calculateCost(template as any, input.answers),
      },
    };

    // SAGA PATTERN: State tracking for transactional deployment
    let realmRegistered = false;
    let realmId: string | null = null;
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
        throw new GeneratorError(
          `Realm registration failed: ${realmRegistration.error}`
        );
      }

      realmRegistered = true;
      logger.info('generate:realm-registered', { toolId, realmId: realmRegistration.realmId });

      // Add realm ID to config for deployment
      result.config.environment.REALM_ID = realmRegistration.realmId;
      (result as any).realmId = realmRegistration.realmId;

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

    } catch (error: any) {
      // COMPENSATION LOGIC (Saga Rollback)
      logger.error('generate:saga-error', {
        toolId,
        realmId,
        realmRegistered,
        deploymentStarted,
        error: error.message
      });
      emit(0, 'Rolling back due to error');

      // Rollback Realm registration if it succeeded
      if (realmRegistered && realmId) {
        logger.warn('generate:compensating-realm', { realmId });
        try {
          await this.compensateRealmRegistration(realmId);
          logger.info('generate:realm-compensated', { realmId });
        } catch (compensateError: any) {
          // Compensation failed - log for manual intervention
          logger.error('generate:compensation-failed', {
            realmId,
            originalError: error.message,
            compensationError: compensateError.message
          });
          // TODO: Push to dead-letter queue for ops team
        }
      }

      // Re-throw original error
      throw error;
    }
  }

  /**
   * Compensate Realm registration by deleting the Realm from UBL
   * Called when deployment fails after Realm was created
   */
  private async compensateRealmRegistration(realmId: string): Promise<void> {
    const ublAntennaUrl = process.env.UBL_ANTENNA_URL || 'http://localhost:3000';

    try {
      const response = await fetch(`${ublAntennaUrl}/realms/${realmId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.UBL_API_KEY && {
            'Authorization': `Bearer ${process.env.UBL_API_KEY}`
          })
        }
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to delete Realm ${realmId}: ${error || response.statusText}`);
      }

      logger.info('generate:realm-deleted', { realmId });
    } catch (error: any) {
      logger.error('generate:realm-deletion-failed', { realmId, error: error.message });
      throw error;
    }
  }

  private validateAnswers(template: any, answers: Record<string, any>): void {
    const questions = template.questions;
    for (const q of questions) {
      const val = answers[q.id];
      if (q.required && (val === undefined || val === null || val === '')) {
        throw new ValidationError(`Missing required answer: ${q.id}`, { question: q });
      }
      if (val === undefined || val === null) continue;
      switch (q.type) {
        case 'single':
          if (q.options && !q.options.includes(val)) {
            throw new ValidationError(`Invalid value for ${q.id}. Allowed: ${q.options.join(', ')}`, { provided: val });
          }
          break;
        case 'multiple':
          if (!Array.isArray(val)) throw new ValidationError(`Answer for ${q.id} must be an array`);
          if (q.options) {
            const invalid = (val as string[]).filter(v => !q.options!.includes(v));
            if (invalid.length) {
              throw new ValidationError(`Invalid value(s) for ${q.id}: ${invalid.join(', ')}`, { provided: val });
            }
          }
          break;
        case 'number':
          if (typeof val !== 'number' || Number.isNaN(val)) throw new ValidationError(`Answer for ${q.id} must be a number`);
          if (q.validation?.min !== undefined && val < q.validation.min) throw new ValidationError(`${q.id} must be >= ${q.validation.min}`);
          if (q.validation?.max !== undefined && val > q.validation.max) throw new ValidationError(`${q.id} must be <= ${q.validation.max}`);
          break;
        case 'text':
          if (typeof val !== 'string') throw new ValidationError(`Answer for ${q.id} must be a string`);
          if (q.validation?.pattern) {
            const re = new RegExp(q.validation.pattern);
            if (!re.test(val)) throw new ValidationError(`${q.id} does not match required pattern`);
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

  private generateId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `tool-${timestamp}-${random}`;
  }

  private calculateCost(template: any, answers: Record<string, any>): number {
    let cost = 9900; // $99 in cents
    const users = answers.users || 0;
    if (users > 1000) cost = 49900;
    else if (users > 100) cost = 19900;

    const features: string[] = answers.features || [];
    // Template pricing impacts if defined
    const pricingMap: Record<string, number> = {};
    const available = template.features?.available || [];
    for (const f of available) {
      if (f.pricingImpact) pricingMap[f.id] = f.pricingImpact;
    }
    for (const f of features) {
      if (pricingMap[f]) cost += pricingMap[f];
    }
    return cost;
  }
}