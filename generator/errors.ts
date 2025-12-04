export class GeneratorError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'GeneratorError';
  }
}

export class TemplateNotFoundError extends GeneratorError {
  constructor(templateId: string) {
    super(`Template not found: ${templateId}`, 'TEMPLATE_NOT_FOUND');
    this.name = 'TemplateNotFoundError';
  }
}

export class ValidationError extends GeneratorError {
  constructor(message: string, public field?: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

