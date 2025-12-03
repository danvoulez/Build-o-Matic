import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import bodyParser from 'body-parser';
import { config } from '../server/config';
import { Generator } from '../generator/core';

describe('Server Generate Endpoint', () => {
  const app = express();
  app.use(cors());
  app.use(helmet());
  app.use(bodyParser.json({ type: 'application/json' }));

  const generator = new Generator();
  function requireActiveSubscription(req: express.Request, res: express.Response, next: express.NextFunction) {
    if (config.billingBypass || req.headers['x-subscription-active'] === 'true') return next();
    return res.status(402).json({ ok: false, error: 'Subscription required' });
  }

  app.post('/api/generate', requireActiveSubscription, async (req, res) => {
    try {
      const { templateId, answers, userId, deployTarget } = req.body || {};
      const result = await generator.generate({ templateId, answers, userId, deployTarget });
      res.json({ ok: true, result });
    } catch (error: any) {
      res.status(400).json({ ok: false, error: error?.message ?? 'Unknown error' });
    }
  });

  it('requires subscription by default', async () => {
    process.env.BILLING_BYPASS = 'false';
    const res = await request(app).post('/api/generate').send({
      templateId: 'gdpr-compliance',
      answers: { industry: 'ecommerce', users: 50, features: ['consent-tracking'], deployTarget: 'docker' },
      userId: 'user-x',
      deployTarget: 'docker',
    });
    expect(res.status).toBe(402);
  });

  it('generates when subscription active header is present', async () => {
    const res = await request(app)
      .post('/api/generate')
      .set('x-subscription-active', 'true')
      .send({
        templateId: 'gdpr-compliance',
        answers: { industry: 'ecommerce', users: 50, features: ['consent-tracking'], deployTarget: 'docker' },
        userId: 'user-x',
        deployTarget: 'docker',
      });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.result.id).toMatch(/^tool-/);
  });
});