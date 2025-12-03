/**
 * Customizer: now includes safer placeholder replacement and trimming.
 */
import crypto from 'crypto';
import { Template } from './template-engine-types-fallback';

export class Customizer {
  async apply(template: Template, answers: Record<string, any>) {
    const backend = this.customizeAndTrim(template.codeTemplates.backend, answers);
    const frontend = this.customizeAndTrim(template.codeTemplates.frontend, answers);
    const database = this.customizeAndTrim(template.codeTemplates.database, answers);

    const config = this.generateConfig(template, answers);

    return {
      code: { backend, frontend, database },
      config,
    };
  }

  private customizeAndTrim(source: string, answers: Record<string, any>): string {
    let out = this.replacePlaceholders(source, answers);
    out = this.applyFeatureBlocks(out, answers.features || []);
    out = this.applyIntegrationBlocks(out, answers.integrations || []);
    return out.trim();
  }

  private replacePlaceholders(source: string, answers: Record<string, any>): string {
    let out = source;
    Object.entries(answers).forEach(([key, value]) => {
      const placeholder = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      const strVal = Array.isArray(value) ? JSON.stringify(value) : String(value);
      out = out.replace(placeholder, strVal);
    });
    return out;
  }

  private applyFeatureBlocks(code: string, enabled: string[]): string {
    return code.replace(
      /\/\/\s*FEATURE:([a-zA-Z0-9-_]+)\s*START[\s\S]*?\/\/\s*FEATURE:\1\s*END/g,
      (match, featureId) => (enabled.includes(featureId) ? match : '')
    );
  }

  private applyIntegrationBlocks(code: string, enabled: string[]): string {
    return code.replace(
      /\/\/\s*INTEGRATION:([a-zA-Z0-9-_]+)\s*START[\s\S]*?\/\/\s*INTEGRATION:\1\s*END/g,
      (match, integrationId) => (enabled.includes(integrationId) ? match : '')
    );
  }

  private generateConfig(template: any, answers: Record<string, any>) {
    const env = {
      NODE_ENV: 'production',
      TOOL_ID: answers.toolId ?? '',
      COMPANY_NAME: answers.companyName ?? 'Company',
      DATABASE_URL: '{{DATABASE_URL}}', // to be injected by deployer
    };

    const secrets = {
      JWT_SECRET: this.generateSecret(48),
      API_KEY: this.generateApiKey(),
    };

    const dependencies = template.config?.dependencies || [];
    const mergedDefaults = {
      ...(template.config?.defaultSettings || {}),
      industry: answers.industry,
      users: answers.users,
      features: answers.features,
      integrations: answers.integrations,
      deployTarget: answers.deployTarget,
    };

    return {
      environment: env,
      secrets,
      dependencies,
      settings: mergedDefaults,
    };
  }

  private generateSecret(length = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  private generateApiKey(): string {
    return `bom_${crypto.randomBytes(24).toString('hex')}`;
  }
}