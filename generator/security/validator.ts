/**
 * SECURITY VALIDATOR - Hardening de Segurança
 * 
 * Validação e sanitização de inputs para prevenir ataques.
 */

// Lista de palavras ofensivas e reservadas (simplificada)
const OFFENSIVE_WORDS = [
  'admin', 'root', 'superuser', 'system', 'default', 'test', 'demo',
  'localhost', 'undefined', 'null', 'void', 'delete'
];

// Limite de tamanho de payload JSON (em bytes)
const MAX_JSON_PAYLOAD_SIZE = 100000; // 100KB

export class SecurityValidator {
  /**
   * Valida tamanho de payload JSON para evitar DoS
   */
  static validateJsonPayloadSize(payload: any): { valid: boolean; size: number; error?: string } {
    try {
      const jsonString = JSON.stringify(payload);
      const sizeInBytes = new TextEncoder().encode(jsonString).length;
      
      if (sizeInBytes > MAX_JSON_PAYLOAD_SIZE) {
        return {
          valid: false,
          size: sizeInBytes,
          error: `Payload exceeds maximum size (${MAX_JSON_PAYLOAD_SIZE} bytes). Current size: ${sizeInBytes} bytes`
        };
      }
      
      return { valid: true, size: sizeInBytes };
    } catch (error) {
      return { valid: false, size: 0, error: 'Invalid JSON payload' };
    }
  }

  /**
   * Valida se o texto contém palavras ofensivas ou reservadas
   */
  static validateOffensiveWords(text: string): { valid: boolean; sanitized: string; error?: string } {
    if (!text || typeof text !== 'string') {
      return { valid: false, sanitized: '', error: 'Text is required' };
    }

    const lowerText = text.toLowerCase().trim();
    const foundOffensiveWords: string[] = [];

    // Usar word boundaries para detectar palavras completas
    for (const word of OFFENSIVE_WORDS) {
      const wordRegex = new RegExp(`\\b${word}\\b`, 'i');
      if (wordRegex.test(lowerText)) {
        foundOffensiveWords.push(word);
      }
    }

    if (foundOffensiveWords.length > 0) {
      return {
        valid: false,
        sanitized: text,
        error: `Contains reserved or offensive words: ${foundOffensiveWords.join(', ')}`
      };
    }

    return { valid: true, sanitized: text };
  }

  /**
   * Sanitiza HTML/Markdown para prevenir XSS persistente
   */
  static sanitizeHtml(html: string): { sanitized: string; hadDangerousContent: boolean } {
    if (!html || typeof html !== 'string') {
      return { sanitized: '', hadDangerousContent: false };
    }

    let sanitized = html;
    let hadDangerousContent = false;

    // Remover scripts
    const scriptRegex = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
    if (scriptRegex.test(sanitized)) {
      hadDangerousContent = true;
      sanitized = sanitized.replace(scriptRegex, '');
    }

    // Remover event handlers (onclick, onerror, onload, etc.)
    const eventHandlerRegex = /\s*on\w+\s*=\s*["'][^"']*["']/gi;
    if (eventHandlerRegex.test(sanitized)) {
      hadDangerousContent = true;
      sanitized = sanitized.replace(eventHandlerRegex, '');
    }

    // Remover javascript: URLs
    const jsUrlRegex = /javascript\s*:/gi;
    if (jsUrlRegex.test(sanitized)) {
      hadDangerousContent = true;
      sanitized = sanitized.replace(jsUrlRegex, '');
    }

    // Remover data: URLs suspeitos
    const dataUrlRegex = /data:text\/html/gi;
    if (dataUrlRegex.test(sanitized)) {
      hadDangerousContent = true;
      sanitized = sanitized.replace(dataUrlRegex, '');
    }

    // Remover iframes
    const iframeRegex = /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi;
    if (iframeRegex.test(sanitized)) {
      hadDangerousContent = true;
      sanitized = sanitized.replace(iframeRegex, '');
    }

    // Remover objetos e embeds
    const objectRegex = /<(object|embed)\b[^<]*(?:(?!<\/\1>)<[^<]*)*<\/\1>/gi;
    if (objectRegex.test(sanitized)) {
      hadDangerousContent = true;
      sanitized = sanitized.replace(objectRegex, '');
    }

    return { sanitized, hadDangerousContent };
  }

  /**
   * Validação XSS mais agressiva
   */
  static validateXSS(input: string): { valid: boolean; sanitized: string; threats: string[] } {
    const threats: string[] = [];
    let sanitized = input;

    // Padrões de XSS comuns
    const xssPatterns = [
      { pattern: /<script/gi, threat: 'script tag' },
      { pattern: /javascript:/gi, threat: 'javascript protocol' },
      { pattern: /on\w+\s*=/gi, threat: 'event handler' },
      { pattern: /<iframe/gi, threat: 'iframe tag' },
      { pattern: /<object/gi, threat: 'object tag' },
      { pattern: /<embed/gi, threat: 'embed tag' },
      { pattern: /eval\(/gi, threat: 'eval function' },
      { pattern: /expression\(/gi, threat: 'expression function' },
      { pattern: /vbscript:/gi, threat: 'vbscript protocol' },
      { pattern: /data:text\/html/gi, threat: 'data URL HTML' },
      { pattern: /<svg.*onload/gi, threat: 'SVG onload' },
      { pattern: /<img.*onerror/gi, threat: 'IMG onerror' }
    ];

    // Remove todas as instâncias de cada padrão usando while loop
    for (const { pattern, threat } of xssPatterns) {
      let found = false;
      while (pattern.test(sanitized)) {
        found = true;
        sanitized = sanitized.replace(pattern, '');
        // Reset regex lastIndex for global patterns
        pattern.lastIndex = 0;
      }
      if (found) {
        threats.push(threat);
      }
    }

    // Remover tags HTML perigosas de forma mais robusta
    // Remove tags com atributos malformados
    sanitized = sanitized.replace(/<[^>]*>/g, (match) => {
      // Permitir apenas tags seguras específicas se necessário
      // Por ora, remove todas as tags
      return '';
    });

    return {
      valid: threats.length === 0,
      sanitized,
      threats
    };
  }
  /**
   * Valida e sanitiza nome de empresa
   */
  static validateCompanyName(name: string): { valid: boolean; sanitized: string; error?: string } {
    if (!name || typeof name !== 'string') {
      return { valid: false, sanitized: '', error: 'Company name is required' };
    }

    // Remover caracteres perigosos
    let sanitized = name.trim();
    
    // Limitar tamanho
    if (sanitized.length > 100) {
      sanitized = sanitized.substring(0, 100);
    }

    // Validação XSS agressiva
    const xssResult = this.validateXSS(sanitized);
    if (!xssResult.valid) {
      return {
        valid: false,
        sanitized: xssResult.sanitized,
        error: `Company name contains XSS threats: ${xssResult.threats.join(', ')}`
      };
    }
    sanitized = xssResult.sanitized;

    // Remover caracteres especiais perigosos
    sanitized = sanitized.replace(/[<>\"'&]/g, '');
    
    // Validar formato básico (apenas letras, números, espaços, hífens, underscores)
    if (!/^[a-zA-Z0-9\s\-_]+$/.test(sanitized)) {
      return { valid: false, sanitized: '', error: 'Company name contains invalid characters' };
    }

    if (sanitized.length < 1) {
      return { valid: false, sanitized: '', error: 'Company name is too short' };
    }

    // Validar palavras ofensivas/reservadas
    const offensiveResult = this.validateOffensiveWords(sanitized);
    if (!offensiveResult.valid) {
      return {
        valid: false,
        sanitized: '',
        error: offensiveResult.error
      };
    }

    return { valid: true, sanitized };
  }

  /**
   * Valida e sanitiza industry
   */
  static validateIndustry(industry: string): { valid: boolean; sanitized: string; error?: string } {
    if (!industry || typeof industry !== 'string') {
      return { valid: false, sanitized: 'saas', error: 'Industry is required, defaulting to saas' };
    }

    const sanitized = industry.toLowerCase().trim();
    
    // Whitelist de indústrias válidas
    const validIndustries = [
      'finance', 'financial', 'banking', 'healthcare', 'legal', 'law',
      'saas', 'software', 'tech', 'technology', 'marketing', 'advertising',
      'manufacturing', 'logistics', 'operations', 'industrial',
      'design', 'creative', 'agency', 'art',
      'education', 'wellness', 'sustainability'
    ];

    if (!validIndustries.includes(sanitized)) {
      return { valid: false, sanitized: 'saas', error: `Invalid industry, defaulting to saas` };
    }

    return { valid: true, sanitized };
  }

  /**
   * Valida e sanitiza template ID
   */
  static validateTemplateId(templateId: string): { valid: boolean; sanitized: string; error?: string } {
    if (!templateId || typeof templateId !== 'string') {
      return { valid: false, sanitized: '', error: 'Template ID is required' };
    }

    const sanitized = templateId.toLowerCase().trim();
    
    // Whitelist de templates válidos
    const validTemplates = [
      'invoice-manager', 'asset-tracker', 'contract-manager', 'crm-lite',
      'expense-manager', 'gdpr-compliance', 'helpdesk', 'hr-onboarding',
      'hr-performance', 'inventory-manager', 'knowledge-base', 'okrs-manager',
      'procurement-manager', 'project-planner', 'proposal-manager',
      'subscription-billing', 'time-tracking'
    ];

    if (!validTemplates.includes(sanitized)) {
      return { valid: false, sanitized: '', error: `Invalid template ID: ${templateId}` };
    }

    // Proteção contra path traversal
    if (sanitized.includes('..') || sanitized.includes('/') || sanitized.includes('\\')) {
      return { valid: false, sanitized: '', error: 'Template ID contains invalid characters' };
    }

    return { valid: true, sanitized };
  }

  /**
   * Valida e sanitiza features
   */
  static validateFeatures(features: any): { valid: boolean; sanitized: string[]; error?: string } {
    if (!Array.isArray(features)) {
      return { valid: false, sanitized: [], error: 'Features must be an array' };
    }

    // Whitelist de features válidas
    const validFeatures = [
      'invoicing', 'payments', 'reports', 'analytics', 'notifications',
      'user-management', 'permissions', 'audit-log', 'export', 'import',
      'integrations', 'api-access', 'webhooks', 'custom-fields'
    ];

    const sanitized = features
      .filter(f => typeof f === 'string')
      .map(f => f.toLowerCase().trim())
      .filter(f => validFeatures.includes(f));

    // Limitar número de features
    if (sanitized.length > 20) {
      return { valid: false, sanitized: sanitized.slice(0, 20), error: 'Too many features, limited to 20' };
    }

    return { valid: true, sanitized };
  }

  /**
   * Valida e sanitiza número de usuários
   */
  static validateUserCount(users: any): { valid: boolean; sanitized: number; error?: string } {
    if (typeof users !== 'number' && typeof users !== 'string') {
      return { valid: false, sanitized: 1, error: 'User count must be a number' };
    }

    const num = typeof users === 'string' ? parseInt(users, 10) : users;

    if (isNaN(num) || num < 1) {
      return { valid: false, sanitized: 1, error: 'User count must be at least 1' };
    }

    if (num > 1000000) {
      return { valid: false, sanitized: 1000000, error: 'User count exceeds maximum (1,000,000)' };
    }

    return { valid: true, sanitized: Math.floor(num) };
  }

  /**
   * Valida e sanitiza deploy target
   */
  static validateDeployTarget(target: any): { valid: boolean; sanitized: string; error?: string } {
    if (!target || typeof target !== 'string') {
      return { valid: false, sanitized: 'docker', error: 'Deploy target is required, defaulting to docker' };
    }

    const sanitized = target.toLowerCase().trim();
    const validTargets = ['railway', 'render', 'docker'];

    if (!validTargets.includes(sanitized)) {
      return { valid: false, sanitized: 'docker', error: `Invalid deploy target, defaulting to docker` };
    }

    return { valid: true, sanitized };
  }

  /**
   * Valida e sanitiza tool ID
   */
  static validateToolId(toolId: any): { valid: boolean; sanitized: string; error?: string } {
    if (!toolId || typeof toolId !== 'string') {
      return { valid: false, sanitized: '', error: 'Tool ID is required' };
    }

    let sanitized = toolId.trim();
    
    // Limitar tamanho
    if (sanitized.length > 100) {
      sanitized = sanitized.substring(0, 100);
    }

    // Apenas alfanuméricos, hífens e underscores
    if (!/^[a-zA-Z0-9\-_]+$/.test(sanitized)) {
      return { valid: false, sanitized: '', error: 'Tool ID contains invalid characters' };
    }

    // Proteção contra path traversal
    if (sanitized.includes('..') || sanitized.includes('/') || sanitized.includes('\\')) {
      return { valid: false, sanitized: '', error: 'Tool ID contains invalid characters' };
    }

    return { valid: true, sanitized };
  }

  /**
   * Valida e sanitiza realm ID
   */
  static validateRealmId(realmId: string): { valid: boolean; sanitized: string; error?: string } {
    if (!realmId || typeof realmId !== 'string') {
      return { valid: false, sanitized: 'default-realm', error: 'Realm ID is required, defaulting to default-realm' };
    }

    let sanitized = realmId.trim();
    
    // Limitar tamanho
    if (sanitized.length > 100) {
      sanitized = sanitized.substring(0, 100);
    }

    // Apenas alfanuméricos, hífens e underscores
    if (!/^[a-zA-Z0-9\-_]+$/.test(sanitized)) {
      return { valid: false, sanitized: 'default-realm', error: 'Realm ID contains invalid characters, defaulting to default-realm' };
    }

    // Proteção contra path traversal
    if (sanitized.includes('..') || sanitized.includes('/') || sanitized.includes('\\')) {
      return { valid: false, sanitized: 'default-realm', error: 'Realm ID contains invalid characters, defaulting to default-realm' };
    }

    return { valid: true, sanitized };
  }

  /**
   * Valida tema ID
   */
  static validateThemeId(themeId: string): { valid: boolean; sanitized: string; error?: string } {
    if (!themeId || typeof themeId !== 'string') {
      return { valid: false, sanitized: 'startup', error: 'Theme ID is required, defaulting to startup' };
    }

    const sanitized = themeId.toLowerCase().trim();
    const validThemes = ['corporate', 'startup', 'industrial', 'elegant', 'creative'];

    if (!validThemes.includes(sanitized)) {
      return { valid: false, sanitized: 'startup', error: `Invalid theme ID, defaulting to startup` };
    }

    return { valid: true, sanitized };
  }

  /**
   * Valida layout type
   */
  static validateLayoutType(layoutType: string): { valid: boolean; sanitized: string; error?: string } {
    if (!layoutType || typeof layoutType !== 'string') {
      return { valid: false, sanitized: 'dashboard', error: 'Layout type is required, defaulting to dashboard' };
    }

    const sanitized = layoutType.toLowerCase().trim();
    const validLayouts = ['dashboard', 'chat-focus', 'documentation', 'workflow'];

    if (!validLayouts.includes(sanitized)) {
      return { valid: false, sanitized: 'dashboard', error: `Invalid layout type, defaulting to dashboard` };
    }

    return { valid: true, sanitized };
  }

  /**
   * Sanitiza caminho de arquivo (proteção contra path traversal)
   */
  static sanitizeFilePath(filePath: string): { valid: boolean; sanitized: string; error?: string } {
    if (!filePath || typeof filePath !== 'string') {
      return { valid: false, sanitized: '', error: 'File path is required' };
    }

    // Proteção contra path traversal
    if (filePath.includes('..') || filePath.includes('~')) {
      return { valid: false, sanitized: '', error: 'Path traversal detected' };
    }

    // Remover barras no início (normalizar)
    let sanitized = filePath.replace(/^\/+/, '');

    // Validar caracteres permitidos
    if (!/^[a-zA-Z0-9\/\-_.]+$/.test(sanitized)) {
      return { valid: false, sanitized: '', error: 'File path contains invalid characters' };
    }

    return { valid: true, sanitized };
  }

  /**
   * Valida objeto de respostas completo
   */
  static validateAnswers(answers: any): { valid: boolean; sanitized: any; errors: string[] } {
    const errors: string[] = [];
    const sanitized: any = {};

    // Validar tamanho do payload JSON
    const payloadSizeResult = this.validateJsonPayloadSize(answers);
    if (!payloadSizeResult.valid) {
      errors.push(payloadSizeResult.error || 'Payload too large');
      return { valid: false, sanitized: {}, errors };
    }

    // Validar companyName
    const companyNameResult = this.validateCompanyName(answers.companyName);
    if (!companyNameResult.valid) {
      errors.push(companyNameResult.error || 'Invalid company name');
    }
    sanitized.companyName = companyNameResult.sanitized;

    // Validar industry
    const industryResult = this.validateIndustry(answers.industry);
    if (!industryResult.valid && industryResult.error) {
      errors.push(industryResult.error);
    }
    sanitized.industry = industryResult.sanitized;

    // Validar users
    const usersResult = this.validateUserCount(answers.users);
    if (!usersResult.valid && usersResult.error) {
      errors.push(usersResult.error);
    }
    sanitized.users = usersResult.sanitized;

    // Validar features
    const featuresResult = this.validateFeatures(answers.features);
    if (!featuresResult.valid && featuresResult.error) {
      errors.push(featuresResult.error);
    }
    sanitized.features = featuresResult.sanitized;

    // Validar toolId (se fornecido)
    if (answers.toolId) {
      const toolIdResult = this.validateToolId(answers.toolId);
      if (!toolIdResult.valid) {
        errors.push(toolIdResult.error || 'Invalid tool ID');
      }
      sanitized.toolId = toolIdResult.sanitized;
    }

    // Validar deployTarget
    const deployTargetResult = this.validateDeployTarget(answers.deployTarget);
    if (!deployTargetResult.valid && deployTargetResult.error) {
      errors.push(deployTargetResult.error);
    }
    sanitized.deployTarget = deployTargetResult.sanitized;

    return {
      valid: errors.length === 0,
      sanitized,
      errors
    };
  }
}

