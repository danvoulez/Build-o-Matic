import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import bodyParser from 'body-parser';
import { templatesRouter } from '../server/routes/templates';

describe('Server Templates Router', () => {
  const app = express();
  app.use(bodyParser.json());
  app.use('/api/templates', templatesRouter());

  it('lists templates', async () => {
    const res = await request(app).get('/api/templates');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    const ids = res.body.templates.map((t: any) => t.id);
    expect(ids).toEqual(expect.arrayContaining(['gdpr-compliance', 'hr-onboarding', 'invoice-manager']));
  });

  it('gets template by id', async () => {
    const res = await request(app).get('/api/templates/gdpr-compliance');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.template.id).toBe('gdpr-compliance');
    expect(res.body.template.questions.length).toBe(5);
  });
});