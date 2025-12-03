import { describe, it, expect } from 'vitest';
import { Generator } from '../generator/core';

function randomString(len = 8) {
  return Math.random().toString(36).substring(2, 2 + len);
}

describe('Battle: Fuzz Answers', () => {
  const generator = new Generator();

  it('handles random text inputs safely', async () => {
    const result = await generator.generate({
      templateId: 'hr-onboarding',
      answers: {
        industry: 'saas',
        users: 5,
        features: ['checklist', 'documents'],
        integrations: [],
        deployTarget: 'docker',
        companyName: randomString(20),
      },
      userId: 'u',
      deployTarget: 'docker',
    });
    expect(result.code.backend).toContain('HR onboarding backend');
    expect(result.config.environment.COMPANY_NAME.length).toBeGreaterThan(0);
  });

  it('rejects invalid array types', async () => {
    await expect(
      generator.generate({
        templateId: 'invoice-manager',
        answers: {
          industry: 'finance',
          users: 5,
          // features must be array; provide string to trigger validation
          features: 'invoicing' as any,
          integrations: [],
          deployTarget: 'docker',
        },
        userId: 'u',
        deployTarget: 'docker',
      })
    ).rejects.toThrow(/must be an array/i);
  });
});