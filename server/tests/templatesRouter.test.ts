/**
 * Basic supertest-based tests for templates router
 */
import request from 'supertest';
import express from 'express';
import { templatesRouter } from '../routes/templates';

describe('Templates Router', () => {
  const app = express();
  app.use('/api/templates', templatesRouter());

  it('lists templates', async () => {
    const res = await request(app).get('/api/templates');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(Array.isArray(res.body.templates)).toBe(true);
    // Should include gdpr-compliance, hr-onboarding, invoice-manager
    const ids = res.body.templates.map((t: any) => t.id);
    expect(ids).toEqual(expect.arrayContaining(['gdpr-compliance', 'hr-onboarding', 'invoice-manager']));
  });

  it('returns specific template', async () => {
    const res = await request(app).get('/api/templates/gdpr-compliance');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.template.id).toBe('gdpr-compliance');
    expect(res.body.template.questions.length).toBe(5);
  });
});