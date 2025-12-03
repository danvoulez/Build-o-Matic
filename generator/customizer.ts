/**
 * Customizer: now includes safer placeholder replacement and trimming.
 * Enhanced with Theme and Layout selection.
 * Security: Input validation and sanitization.
 */
import crypto from 'crypto';
import { Template } from './template-engine-types-fallback';
import { selectTheme, ThemeConfig } from './themes';
import { selectLayout, LAYOUTS, LayoutType } from './layouts';
import { SecurityValidator } from './security/validator';

export class Customizer {
  async apply(template: Template, answers: Record<string, any>) {
    // SECURITY: Validar e sanitizar inputs
    const validation = SecurityValidator.validateAnswers(answers);
    if (!validation.valid) {
      throw new Error(`Invalid input: ${validation.errors.join(', ')}`);
    }
    const sanitizedAnswers = validation.sanitized;

    // SECURITY: Validar template ID
    const templateValidation = SecurityValidator.validateTemplateId(template.id);
    if (!templateValidation.valid) {
      throw new Error(templateValidation.error || 'Invalid template ID');
    }

    // 1. Selecionar Tema e Layout baseados nas respostas (sanitizadas)
    const theme = selectTheme(sanitizedAnswers.industry || '');
    const layoutType = selectLayout(template.id);
    
    // SECURITY: Validar layout type
    const layoutValidation = SecurityValidator.validateLayoutType(layoutType);
    if (!layoutValidation.valid) {
      throw new Error(layoutValidation.error || 'Invalid layout type');
    }
    const safeLayoutType = layoutValidation.sanitized as LayoutType;
    const layoutCode = LAYOUTS[safeLayoutType];

    // 2. Preparar variáveis de substituição estendidas (usando dados sanitizados)
    const enhancedAnswers = {
      ...sanitizedAnswers,
      themeId: theme.id,
      themeName: theme.name,
      layoutType: safeLayoutType,
      primaryColor: theme.colors.primary,
      secondaryColor: theme.colors.secondary,
      accentColor: theme.colors.accent,
      backgroundColor: theme.colors.background,
      surfaceColor: theme.colors.surface,
      textColor: theme.colors.text,
      borderRadius: theme.borderRadius,
      fontFamily: theme.fontFamily,
      componentStyle: theme.componentStyle,
    };

    // 3. Customizar Frontend (agora inclui injeção de Layout)
    const frontend = this.customizeAndTrim(template.codeTemplates.frontend, enhancedAnswers);
    const intents = this.customizeAndTrim(template.codeTemplates.intents || '', enhancedAnswers);
    const agreements = this.customizeAndTrim(template.codeTemplates.agreements || '', enhancedAnswers);
    
    // 4. Customizar Layout
    const layout = this.customizeAndTrim(layoutCode, enhancedAnswers);

    // 5. Gerar Config (agora inclui tema)
    const config = this.generateConfig(template, answers, theme);

    return {
      code: { 
        frontend, 
        intents, 
        agreements,
        layout // Layout gerado
      },
      config,
      theme, // Passar tema para o packager
      layoutType, // Passar tipo de layout para o packager
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
      // SECURITY: Validar chave do placeholder
      if (!/^[a-zA-Z0-9_]+$/.test(key)) {
        throw new Error(`Invalid placeholder key: ${key}`);
      }

      const placeholder = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      
      // SECURITY: Sanitizar valor antes de substituir
      let strVal: string;
      if (Array.isArray(value)) {
        strVal = JSON.stringify(value);
      } else if (typeof value === 'object' && value !== null) {
        strVal = JSON.stringify(value);
      } else {
        strVal = String(value);
        // Escapar caracteres perigosos
        strVal = strVal.replace(/[<>\"'&]/g, '');
      }
      
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

  private generateConfig(template: any, answers: Record<string, any>, theme: ThemeConfig) {
    const env = {
      NODE_ENV: 'production',
      TOOL_ID: answers.toolId ?? '',
      COMPANY_NAME: answers.companyName ?? 'Company',
      UBL_ANTENNA_URL: process.env.UBL_ANTENNA_URL || 'http://localhost:3000',
      REALM_ID: `realm-${answers.toolId || 'default'}`, // to be injected by deployer
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
      theme: theme, // Salvar tema nas settings
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