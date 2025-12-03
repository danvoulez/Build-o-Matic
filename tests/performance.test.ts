import { describe, it, expect } from 'vitest';
import { Generator } from '../generator/core';

describe('Performance', () => {
  const generator = new Generator();

  it('generates in under 10 seconds', async () => {
    const start = Date.now();
    const result = await generator.generate({
      templateId: 'gdpr-compliance',
      answers: {
        industry: 'ecommerce',
        users: 250,
        features: ['consent-tracking', 'data-export', 'audit-log'],
        integrations: [],
        deployTarget: 'docker',
        companyName: 'Acme Corp',
      },
      userId: 'perf-user',
      deployTarget: 'docker',
    });
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(10_000);
    expect(result.metadata.generationTime).toBeLessThan(10_000);
  }, 15_000);
});