import request from 'supertest';
import express from 'express';
import bodyParser from 'body-parser';
import { generateSSE } from '../generate-stream';

describe('Generate SSE', () => {
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
          features: ['consent-tracking', 'data-export', 'audit-logs'],
          integrations: [],
          deployTarget: 'docker',
          companyName: 'Acme Corp',
        },
        userId: 'test-user',
        deployTarget: 'docker',
      });

    // Since SSE returns streamed body and ends, we just assert 200 OK
    expect(res.status).toBe(200);
    expect(res.type).toMatch(/text\/event-stream/);
  });
});