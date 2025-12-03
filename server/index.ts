import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import bodyParser from 'body-parser';
import { config } from './config';
import { logger } from './logger';
import { initSentry, sentryMiddleware, sentryErrorHandler } from './monitoring/sentry';
import { Generator } from '../generator/core';
import { generateSSE } from './generate-stream';
import { billingRouter } from './routes/billing';
import { stripeWebhookRouter } from './routes/stripe-webhook';
import { templatesRouter } from './routes/templates';
import { dockerRouter } from './routes/docker';
import { gateRouter } from './routes/gate';
import { toolsRouter } from './routes/tools';
import { migrate } from './models/db';
import { metricsMiddleware, metricsHandler } from './monitoring/prometheus';
import { deployEngineRouter } from './routes/deploy-engine';

initSentry();

const app = express();
app.use(...sentryMiddleware());
app.use(cors());
app.use(helmet());
app.use(bodyParser.json({ type: 'application/json' }));
app.use(metricsMiddleware()); // record request metrics

// Prometheus metrics endpoint
app.get('/metrics', metricsHandler);

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
    logger.error('generate:error', { error: error?.message });
    res.status(400).json({ ok: false, error: error?.message ?? 'Unknown error' });
  }
});

app.post('/api/generate/stream', requireActiveSubscription, generateSSE);
app.use('/api/templates', templatesRouter());
app.use('/api/billing', billingRouter());
app.use('/api/stripe', stripeWebhookRouter());
app.use('/api/gate', gateRouter());
app.use('/api/docker', dockerRouter());
app.use('/api/tools', toolsRouter());

// Engine deploy route gated behind subscription as well
app.use('/api/deploy', requireActiveSubscription, deployEngineRouter());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Sentry error handler must be last
app.use(sentryErrorHandler());

migrate()
  .then(() => {
    app.listen(config.serverPort, () => logger.info('server:started', { port: config.serverPort, env: config.env }));
  })
  .catch((err) => {
    logger.error('server:migrate_failed', { error: err.message });
    process.exit(1);
  });