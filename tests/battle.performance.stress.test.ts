import { describe, it, expect } from 'vitest';
import { Generator } from '../generator/core';

describe('Battle: Performance Stress', () => {
  const generator = new Generator();

  it('handles 20 parallel generations under 30 seconds', async () => {
    const makeInput = (i: number) => ({
      templateId: i % 3 === 0 ? 'gdpr-compliance' : i % 3 === 1 ? 'hr-onboarding' : 'invoice-manager',
      answers: {
        industry: 'saas',
        users: 50 + i,
        features: ['consent-tracking', 'audit-log', 'data-export'].slice(0, 2),
        integrations: [],
        deployTarget: 'docker',
        companyName: `StressCo ${i}`,
      },
      userId: `stress-${i}`,
      deployTarget: 'docker' as const,
    });

    const start = Date.now();
    const results = await Promise.all(Array.from({ length: 20 }, (_, i) => generator.generate(makeInput(i))));
    const duration = Date.now() - start;

    expect(results.length).toBe(20);
    expect(duration).toBeLessThan(30_000);
  }, 40_000);
});