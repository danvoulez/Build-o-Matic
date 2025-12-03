import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { billingRouter } from './routes/billing';

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(bodyParser.json({ type: '*/*' })); // needed for Stripe raw body if you adapt
  app.use('/api/billing', billingRouter());
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  return app;
}