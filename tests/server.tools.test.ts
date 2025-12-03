import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import bodyParser from 'body-parser';
import { toolsRouter } from '../server/routes/tools';
import { migrate } from '../server/models/db';

describe('Server Tools Router', () => {
  const app = express();
  app.use(bodyParser.json());
  app.use('/api/tools', toolsRouter());

  beforeAll(async () => {
    await migrate();
  });

  const email = 'test@example.com';

  it('creates tool record', async () => {
    const res = await request(app)
      .post('/api/tools')
      .send({
        email,
        template_id: 'gdpr-compliance',
        name: 'Acme GDPR',
        configuration: {
          industry: 'ecommerce',
          users: 50,
          features: ['consent-tracking'],
          integrations: [],
          deployTarget: 'docker',
        },
      });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.tool.id).toBeDefined();
    expect(res.body.tool.status).toBe('generating');
  });

  it('lists tools for user', async () => {
    const res = await request(app).get(`/api/tools?email=${encodeURIComponent(email)}`);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(Array.isArray(res.body.tools)).toBe(true);
    expect(res.body.tools.length).toBeGreaterThan(0);
  });
});