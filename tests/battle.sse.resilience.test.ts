import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import bodyParser from 'body-parser';
import { generateSSE } from '../server/generate-stream';

describe('Battle: SSE Resilience', () => {
  const app = express();
  app.use(bodyParser.json());
  app.post('/api/generate/stream', generateSSE);

  it('returns error event when validation fails', async () => {
    const res = await request(app)
      .post('/api/generate/stream')
      .send({
        templateId: 'gdpr-compliance',
        answers: {
          industry: 'invalid',
          users: 10,
          features: ['consent-tracking'],
          deployTarget: 'docker',
        },
        userId: 'u',
        deployTarget: 'docker',
      });

    expect(res.status).toBe(200);
    expect(res.type).toMatch(/text\/event-stream/);
    expect(res.text).toContain('"type":"error"');
  });

  it('streams multiple progress events', async () => {
    const res = await request(app)
      .post('/api/generate/stream')
      .send({
        templateId: 'invoice-manager',
        answers: {
          industry: 'saas',
          users: 5,
          features: ['invoicing', 'payments'],
          deployTarget: 'docker',
        },
        userId: 'u',
        deployTarget: 'docker',
      });
    expect(res.status).toBe(200);
    const occurrences = (res.text.match(/"type":"progress"/g) || []).length;
    expect(occurrences).toBeGreaterThanOrEqual(3);
    expect(res.text).toContain('"type":"complete"');
  });
});