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
import { checkUBLAvailability } from '../generator/ubl-integration';

initSentry();

/**
 * CORS Configuration - Dynamic Whitelist
 * Permite domínios Vercel, Netlify e localhost para desenvolvimento
 */
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Lista de padrões permitidos
    const allowedPatterns = [
      /^https?:\/\/localhost(:\d+)?$/, // localhost (dev)
      /^https?:\/\/127\.0\.0\.1(:\d+)?$/, // localhost IP
      /^https:\/\/.*\.vercel\.app$/, // Vercel deploys
      /^https:\/\/.*\.netlify\.app$/, // Netlify deploys
      /^https:\/\/.*\.railway\.app$/, // Railway deploys
      /^https:\/\/.*\.render\.com$/, // Render deploys
    ];

    // Permitir requisições sem origin (ex: Postman, mobile apps)
    if (!origin) {
      callback(null, true);
      return;
    }

    // Verificar se o origin corresponde a algum padrão permitido
    const isAllowed = allowedPatterns.some(pattern => pattern.test(origin));

    if (isAllowed) {
      callback(null, true);
    } else {
      // Log de tentativa de acesso não autorizado
      logger.warn('cors:blocked', { origin });
      callback(new Error(`Origin ${origin} not allowed by CORS policy`));
    }
  },
  credentials: true, // Permitir cookies e autenticação
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Subscription-Active'],
  maxAge: 86400 // Cache preflight por 24 horas
};

const app = express();
app.use(...sentryMiddleware());
app.use(cors(corsOptions));
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
    // Check UBL availability before generating
    const ublCheck = await checkUBLAvailability();
    if (!ublCheck.available) {
      logger.warn('generate:ubl-unavailable', { error: ublCheck.error });
      return res.status(503).json({ 
        ok: false, 
        error: 'UBL não está disponível no momento',
        details: ublCheck.error,
        suggestion: 'Verifique se o UBL Antenna está rodando e acessível'
      });
    }

    const { templateId, answers, userId, deployTarget, toolId } = req.body || {};
    const result = await generator.generate({ templateId, answers, userId, deployTarget });
    
    // Save realm_id to database if tool record exists
    if ((result as any).realmId && toolId) {
      try {
        const { setToolRealmId } = await import('./models/tools');
        await setToolRealmId(toolId, (result as any).realmId);
        logger.info('generate:realm-id-saved', { toolId, realmId: (result as any).realmId });
      } catch (e) {
        // Ignore if toolId not provided or error
        logger.debug('generate:realm-id-not-saved', { error: (e as any)?.message });
      }
    }
    
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