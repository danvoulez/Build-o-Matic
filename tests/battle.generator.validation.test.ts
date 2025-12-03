import { describe, it, expect } from 'vitest';
import { Generator } from '../generator/core';

describe('Battle: Generator Validation', () => {
  const generator = new Generator();

  it('rejects invalid feature values', async () => {
    await expect(
      generator.generate({
        templateId: 'gdpr-compliance',
        answers: {
          industry: 'saas',
          users: 10,
          features: ['non-existing-feature'],
          integrations: [],
          deployTarget: 'docker',
        },
        userId: 'user-x',
        deployTarget: 'docker',
      })
    ).rejects.toThrow(/Invalid value\(s\) for features/i);
  });

  it('rejects invalid single select option', async () => {
    await expect(
      generator.generate({
        templateId: 'gdpr-compliance',
        answers: {
          industry: 'not-a-valid-industry',
          users: 10,
          features: ['consent-tracking'],
          integrations: [],
          deployTarget: 'docker',
        },
        userId: 'user-x',
        deployTarget: 'docker',
      })
    ).rejects.toThrow(/Invalid value for industry/i);
  });

  it('rejects Slack integration without notifications feature', async () => {
    await expect(
      generator.generate({
        templateId: 'gdpr-compliance',
        answers: {
          industry: 'saas',
          users: 10,
          features: ['consent-tracking'],
          integrations: ['slack'],
          deployTarget: 'docker',
        },
        userId: 'user-x',
        deployTarget: 'docker',
      })
    ).rejects.toThrow(/Slack integration requires notifications feature/i);
  });

  it('supports extreme user counts within limits', async () => {
    const result = await generator.generate({
      templateId: 'gdpr-compliance',
      answers: {
        industry: 'saas',
        users: 100000,
        features: ['consent-tracking', 'audit-log'],
        integrations: [],
        deployTarget: 'docker',
      },
      userId: 'user-high',
      deployTarget: 'docker',
    });
    expect(result.metadata.estimatedCost).toBe(49900);
  });

  it('rejects numbers out of validation bounds', async () => {
    await expect(
      generator.generate({
        templateId: 'gdpr-compliance',
        answers: {
          industry: 'saas',
          users: 0, // min is 1
          features: ['consent-tracking'],
          integrations: [],
          deployTarget: 'docker',
        },
        userId: 'user-low',
        deployTarget: 'docker',
      })
    ).rejects.toThrow(/users must be >= 1/i);
  });
});