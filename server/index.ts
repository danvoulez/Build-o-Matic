import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import bodyParser from 'body-parser';
import { config } from './config';
import { logger } from './logger';
import { Generator } from '../generator/core';
import { generateSSE } from './generate-stream';
import { billingRouter } from './routes/billing';
import { stripeWebhookRouter } from './routes/stripe-webhook';
import { templatesRouter } from './routes/templates';
import { dockerRouter } from './routes/docker';
import { gateRouter } from './routes/gate';
import { toolsRouter } from './routes/tools';
import { migrate } from './models/db';

const app = express();
app.use(cors());
app.use(helmet());
app.use(bodyParser.json({ type: 'application/json' }));

const generator = new Generator();

function requireActiveSubscription(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (config.billingBypass || req.headers['x-subscription-active'] === 'true') return next();
  return res.status(402).json({ ok: false, error: 'Subscription required' });
}

// Non-stream generation
app.post('/api/generate', requireActiveSubscription, async (req, res) => {
  try {
    const { templateId, answers, userId, deployTarget } = req.body || {};
    const result = await generator.generate({ templateId, answers, userId, deployTarget });
    res.json({ ok: true, result });
  } catch (error: any) {
    res.status(400).json({ ok: false, error: error?.message ?? 'Unknown error' });
  }
});

// Stream generation
app.post('/api/generate/stream', requireActiveSubscription, generateSSE);

// Templates
app.use('/api/templates', templatesRouter());

// Billing and webhook
app.use('/api/billing', billingRouter());
app.use('/api/stripe', stripeWebhookRouter());

// Gate and Docker
app.use('/api/gate', gateRouter());
app.use('/api/docker', dockerRouter());

// Tools
app.use('/api/tools', toolsRouter());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

migrate()
  .then(() => {
    app.listen(config.serverPort, () => logger.info('server:started', { port: config.serverPort, env: config.env }));
  })
  .catch((err) => {
    logger.error('server:migrate_failed', { error: err.message });
    process.exit(1);
  });