import { AdapterRegistry } from '../../adapters';
import { SMTPEmailAdapter } from '../../adapters/email/smtp';
import { SendGridEmailAdapter } from '../../adapters/email/sendgrid';
import { SESEmailAdapter } from '../../adapters/email/ses';
import { SlackWebhookAdapter } from '../../adapters/slack/webhook';
import { HttpWebhookAdapter } from '../../adapters/webhook/http';
import { PostgresAdapter } from '../../adapters/db/postgres';
import { RedisQueueAdapter } from '../../adapters/queue/redis';
import { S3StorageAdapter } from '../../adapters/storage/s3';
import { DatadogAdapter } from '../../adapters/observability/datadog';
import { WinstonLoggingAdapter } from '../../adapters/logging/winston';
import { StripePaymentsAdapter } from '../../adapters/payments/stripe';
import { TwilioSmsAdapter } from '../../adapters/sms/twilio';

export async function bootstrapAdapters() {
  const registry = new AdapterRegistry();

  // Logging
  registry.register(new WinstonLoggingAdapter(process.env.LOG_LEVEL as any));

  // Email: SMTP
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    registry.register(
      new SMTPEmailAdapter({
        host: process.env.SMTP_HOST!,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true',
        user: process.env.SMTP_USER!,
        pass: process.env.SMTP_PASS!,
        from: process.env.SMTP_FROM || process.env.SMTP_USER!,
      })
    );
  }
  // Email: SendGrid
  if (process.env.SENDGRID_API_KEY) {
    registry.register(new SendGridEmailAdapter({ apiKey: process.env.SENDGRID_API_KEY!, from: process.env.SENDGRID_FROM }));
  }
  // Email: SES
  if (process.env.SES_REGION && process.env.SES_ACCESS_KEY_ID && process.env.SES_SECRET_ACCESS_KEY && process.env.SES_FROM) {
    registry.register(
      new SESEmailAdapter({
        region: process.env.SES_REGION!,
        accessKeyId: process.env.SES_ACCESS_KEY_ID!,
        secretAccessKey: process.env.SES_SECRET_ACCESS_KEY!,
        from: process.env.SES_FROM!,
      })
    );
  }

  // SMS: Twilio
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM) {
    registry.register(
      new TwilioSmsAdapter({
        accountSid: process.env.TWILIO_ACCOUNT_SID!,
        authToken: process.env.TWILIO_AUTH_TOKEN!,
        from: process.env.TWILIO_FROM!,
      })
    );
  }

  // Slack
  if (process.env.SLACK_WEBHOOK_URL) {
    registry.register(new SlackWebhookAdapter(process.env.SLACK_WEBHOOK_URL!));
  }

  // Generic Webhook
  if (process.env.WEBHOOK_BASE_URL) {
    registry.register(
      new HttpWebhookAdapter({
        baseUrl: process.env.WEBHOOK_BASE_URL!,
        headers: { Authorization: `Bearer ${process.env.WEBHOOK_TOKEN || ''}` },
      })
    );
  }

  // DB (Postgres)
  if (process.env.DATABASE_URL) {
    registry.register(
      new PostgresAdapter({
        connectionString: process.env.DATABASE_URL!,
        ssl: process.env.DATABASE_SSL === 'true',
        max: Number(process.env.DB_POOL_MAX || 10),
      })
    );
  }

  // Queue (Redis)
  if (process.env.REDIS_URL) {
    registry.register(new RedisQueueAdapter({ url: process.env.REDIS_URL!, prefix: process.env.REDIS_PREFIX || 'bom' }));
  }

  // Storage (S3)
  if (process.env.S3_REGION && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY) {
    registry.register(
      new S3StorageAdapter({
        region: process.env.S3_REGION!,
        accessKeyId: process.env.S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
        bucketDefault: process.env.S3_BUCKET_DEFAULT,
      })
    );
  }

  // Observability: Datadog
  if (process.env.DATADOG_API_KEY) {
    registry.register(new DatadogAdapter({ apiKey: process.env.DATADOG_API_KEY!, host: process.env.DATADOG_HOST, prefix: 'bom.' }));
  }

  // Payments: Stripe
  if (process.env.STRIPE_API_KEY) {
    registry.register(new StripePaymentsAdapter(process.env.STRIPE_API_KEY!));
  }

  await registry.initAll();
  return registry;
}