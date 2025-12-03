/**
 * Generator core with improved observability hooks and error classes.
 */
import { TemplateEngine } from './template-engine';
import { Customizer } from './customizer';
import { Packager } from './packager';
import { TemplateNotFoundError, ValidationError, GeneratorError } from './errors';
import { logger } from '../server/logger';

export interface GenerationInput {
  templateId: string;
  answers: Record<string, any>;
  userId: string;
  deployTarget: 'railway' | 'render' | 'docker';
}

export interface GeneratedTool {
  id: string;
  template: string;
  code: { backend: string; frontend: string; database: string };
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

    logger.info('generate:start', { templateId: input.templateId, userId: input.userId });
    emit(10, 'Loading template');

    const template = await this.templateEngine.load(input.templateId);
    if (!template) {
      logger.warn('generate:template-not-found', { templateId: input.templateId });
      throw new TemplateNotFoundError(input.templateId);
    }

    emit(30, 'Validating answers');
    this.validateAnswers(template, input.answers);

    emit(50, 'Customizing code');
    const customized = await this.customizer.apply(template as any, input.answers);

    emit(75, 'Packaging');
    const packaged = await this.packager.package(customized, input.deployTarget);

    emit(95, 'Finalizing');
    const generationTime = Date.now() - startTime;
    const result: GeneratedTool = {
      id: this.generateId(),
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

    logger.info('generate:complete', { templateId: input.templateId, userId: input.userId, generationTime });
    emit(100, 'Complete');
    return result;
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