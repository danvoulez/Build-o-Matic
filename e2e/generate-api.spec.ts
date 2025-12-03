import { test, expect, request } from '@playwright/test';

test.describe('Generate API', () => {
  test('POST /api/generate with active subscription header returns result', async ({ request }) => {
    const res = await request.post('http://localhost:4000/api/generate', {
      headers: { 'Content-Type': 'application/json', 'x-subscription-active': 'true' },
      data: {
        templateId: 'gdpr-compliance',
        answers: {
          industry: 'ecommerce',
          users: 50,
          features: ['consent-tracking', 'data-export', 'audit-log'],
          integrations: [],
          deployTarget: 'docker',
          companyName: 'Acme Corp'
        },
        userId: 'e2e-user',
        deployTarget: 'docker'
      }
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.result.id).toMatch(/^tool-/);
  });

  test('POST /api/generate/stream SSE completes', async ({ request }) => {
    const res = await request.post('http://localhost:4000/api/generate/stream', {
      headers: { 'Content-Type': 'application/json', 'x-subscription-active': 'true' },
      data: {
        templateId: 'invoice-manager',
        answers: {
          industry: 'saas',
          users: 10,
          features: ['invoicing', 'payments'],
          integrations: [],
          deployTarget: 'docker'
        },
        userId: 'e2e-user',
        deployTarget: 'docker'
      }
    });
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain('"type":"complete"');
  });
});