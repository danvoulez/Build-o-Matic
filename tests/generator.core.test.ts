import { describe, it, expect } from 'vitest';
import { Generator } from '../generator/core';

describe('Generator Core', () => {
  const generator = new Generator();

  it('throws for missing template', async () => {
    await expect(
      generator.generate({
        templateId: 'nonexistent',
        answers: {},
        userId: 'user-x',
        deployTarget: 'docker',
      })
    ).rejects.toThrow(/Template not found/);
  });

  it('validates required answers', async () => {
    await expect(
      generator.generate({
        templateId: 'gdpr-compliance',
        answers: {
          // Missing required: industry, users, features, deployTarget
        },
        userId: 'user-req',
        deployTarget: 'docker',
      })
    ).rejects.toThrow(/Missing required answer/);
  });

  it('generates with valid GDPR input', async () => {
    const result = await generator.generate({
      templateId: 'gdpr-compliance',
      answers: {
        industry: 'ecommerce',
        users: 50,
        features: ['consent-tracking', 'data-export', 'audit-log'],
        integrations: ['email'],
        deployTarget: 'docker',
        companyName: 'Acme Corp',
      },
      userId: 'user-123',
      deployTarget: 'docker',
    });

    expect(result.id).toMatch(/^tool-/);
    expect(result.template).toBe('gdpr-compliance');
    expect(result.code.backend).toContain('GDPR backend');
    expect(result.code.frontend).toContain('GDPR Compliance Dashboard');
    expect(result.code.database).toContain('GDPR Schema');
    expect(result.metadata.generationTime).toBeLessThan(10000);
  });

  it('progress callback receives events', async () => {
    const events: Array<{ progress: number; message: string }> = [];
    await generator.generate(
      {
        templateId: 'gdpr-compliance',
        answers: {
          industry: 'saas',
          users: 120,
          features: ['consent-tracking'],
          integrations: [],
          deployTarget: 'docker',
          companyName: 'Test Co',
        },
        userId: 'user-evt',
        deployTarget: 'docker',
      },
      (evt) => events.push(evt)
    );

    expect(events.length).toBeGreaterThan(0);
    const last = events[events.length - 1];
    expect(last.progress).toBe(100);
  });

  it('applies pricing impacts from features', async () => {
    const result = await generator.generate({
      templateId: 'gdpr-compliance',
      answers: {
        industry: 'saas',
        users: 50,
        features: ['consent-tracking', 'breach-notification', 'dpo-dashboard'],
        integrations: [],
        deployTarget: 'docker',
        companyName: 'Price Co',
      },
      userId: 'user-price',
      deployTarget: 'docker',
    });
    // base $99 + breach ($10) + dpo ($20) = $129
    expect(result.metadata.estimatedCost).toBe(12900);
  });
});