import { Generator, TemplateNotFoundError, ValidationError } from './core';
import { TemplateEngine } from './template-engine';

// Basic Jest tests. Ensure you have jest configured with ts-jest or similar.
describe('Generator', () => {
  const generator = new Generator();

  it('should throw error for invalid template', async () => {
    const input = {
      templateId: 'nonexistent',
      answers: {},
      userId: 'user-123',
      deployTarget: 'railway' as const,
    };
    await expect(generator.generate(input)).rejects.toThrow(TemplateNotFoundError);
  });

  it('should validate required answers', async () => {
    const input = {
      templateId: 'gdpr-compliance',
      answers: {
        // missing some required fields like industry, users, features, deployTarget
      },
      userId: 'user-123',
      deployTarget: 'railway' as const,
    };
    await expect(generator.generate(input)).rejects.toThrow(ValidationError);
  });

  it('should generate tool from valid input (mocked)', async () => {
    const input = {
      templateId: 'gdpr-compliance',
      answers: {
        industry: 'ecommerce',
        users: 50,
        features: ['consent-tracking', 'data-export', 'audit-logs'],
        integrations: ['Slack'],
        deployTarget: 'railway',
        companyName: 'Acme Corp',
      },
      userId: 'user-123',
      deployTarget: 'railway' as const,
    };

    const result = await generator.generate(input);
    expect(result.id).toBeDefined();
    expect(result.template).toBe('gdpr-compliance');
    expect(result.code.backend).toContain('GDPR backend');
    expect(result.code.frontend).toContain('GDPR Compliance Dashboard');
    expect(result.code.database).toContain('GDPR Schema');
    expect(result.metadata.generationTime).toBeLessThan(10000);
    expect(result.config.environment.NODE_ENV).toBe('production');
    expect(result.deployment.instructions).toBeDefined();
  });
});