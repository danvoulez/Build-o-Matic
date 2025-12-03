import { describe, it, expect } from 'vitest';
import { Generator } from '../generator/core';

describe('Concurrent Generations', () => {
  const generator = new Generator();

  it('handles multiple concurrent generations', async () => {
    const inputs = Array.from({ length: 5 }).map((_, i) => ({
      templateId: i % 2 === 0 ? 'gdpr-compliance' : 'invoice-manager',
      answers: {
        industry: 'saas',
        users: 50 + i,
        features: ['consent-tracking', 'data-export', 'audit-log'].slice(0, 2),
        integrations: [],
        deployTarget: 'docker',
        companyName: `Co ${i}`,
      },
      userId: `user-${i}`,
      deployTarget: 'docker' as const,
    }));

    const results = await Promise.all(inputs.map(inp => generator.generate(inp)));
    expect(results.length).toBe(5);
    for (const r of results) {
      expect(r.id).toMatch(/^tool-/);
      expect(r.code.backend.length).toBeGreaterThan(10);
    }
  }, 20_000);
});