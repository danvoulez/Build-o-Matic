import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import bodyParser from 'body-parser';
import { generateSSE } from '../server/generate-stream';

describe('Server Generate SSE', () => {
  const app = express();
  app.use(bodyParser.json());
  app.post('/api/generate/stream', generateSSE);

  it('streams progress and completes', async () => {
    const res = await request(app)
      .post('/api/generate/stream')
      .send({
        templateId: 'gdpr-compliance',
        answers: {
          industry: 'ecommerce',
          users: 50,
          features: ['consent-tracking', 'data-export', 'audit-log'],
          integrations: [],
          deployTarget: 'docker',
          companyName: 'Acme Corp',
        },
        userId: 'test-user',
        deployTarget: 'docker',
      });

    expect(res.status).toBe(200);
    expect(res.type).toMatch(/text\/event-stream/);
    expect(res.text).toContain('"type":"complete"');
  });

  it('returns error for missing templateId', async () => {
    const res = await request(app).post('/api/generate/stream').send({ deployTarget: 'docker' });
    expect(res.status).toBe(200);
    expect(res.text).toContain('"type":"error"');
  });
});