import { Generator } from './core';

describe('Generator Performance', () => {
  const generator = new Generator();

  it('should generate in under 10 seconds', async () => {
    const start = Date.now();
    const input = {
      templateId: 'gdpr-compliance',
      answers: {
        industry: 'ecommerce',
        users: 250,
        features: ['consent-tracking', 'data-export', 'audit-logs'],
        integrations: ['Slack'],
        deployTarget: 'docker',
        companyName: 'Acme Corp',
      },
      userId: 'perf-user',
      deployTarget: 'docker' as const,
    };
    const result = await generator.generate(input);
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(10_000);
    expect(result.metadata.generationTime).toBeLessThan(10_000);
  }, 15_000);
});