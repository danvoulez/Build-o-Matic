/**
 * Centralized configuration with validation and defaults.
 */
import dotenv from 'dotenv';

dotenv.config();

type Config = {
  env: 'development' | 'test' | 'production';
  serverPort: number;
  databaseUrl: string;
  databaseSsl: boolean;
  stripeApiKey?: string;
  stripeWebhookSecret?: string;
  railwayToken?: string;
  billingBypass: boolean;
};

function required(name: string, val: string | undefined, allowEmpty = false) {
  if (!val && !allowEmpty) throw new Error(`Missing required env var: ${name}`);
  return val!;
}

export const config: Config = {
  env: (process.env.NODE_ENV as any) || 'development',
  serverPort: Number(process.env.PORT || 4000),
  databaseUrl: required('DATABASE_URL', process.env.DATABASE_URL, true) || 'postgresql://user:pass@localhost:5432/buildomatic',
  databaseSsl: process.env.DATABASE_SSL === 'true',
  stripeApiKey: process.env.STRIPE_API_KEY,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  railwayToken: process.env.RAILWAY_API_TOKEN,
  billingBypass: process.env.BILLING_BYPASS === 'true',
};