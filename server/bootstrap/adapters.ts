import { AdapterRegistry } from '../../adapters';
// Core adapters that are always needed
import { PostgresAdapter } from '../../adapters/db/postgres';
import { SlackWebhookAdapter } from '../../adapters/slack/webhook';
import { HttpWebhookAdapter } from '../../adapters/webhook/http';

export async function bootstrapAdapters() {
  const registry = new AdapterRegistry();

  // Optional adapters - loaded conditionally
  let WinstonLoggingAdapter: any;
  try {
    const winston = await import('../../adapters/logging/winston');
    WinstonLoggingAdapter = winston.WinstonLoggingAdapter;
    registry.register(new WinstonLoggingAdapter(process.env.LOG_LEVEL as any));
  } catch (e) {
    console.warn('Winston adapter not available, skipping logging adapter');
  }

  // Email: SMTP
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const { SMTPEmailAdapter } = await import('../../adapters/email/smtp');
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
    } catch (e) {
      console.warn('SMTP adapter not available');
    }
  }

  // Email: SendGrid
  if (process.env.SENDGRID_API_KEY) {
    try {
      const { SendGridEmailAdapter } = await import('../../adapters/email/sendgrid');
      registry.register(new SendGridEmailAdapter({ apiKey: process.env.SENDGRID_API_KEY!, from: process.env.SENDGRID_FROM }));
    } catch (e) {
      console.warn('SendGrid adapter not available');
    }
  }

  // Email: SES
  if (process.env.SES_REGION && process.env.SES_ACCESS_KEY_ID && process.env.SES_SECRET_ACCESS_KEY && process.env.SES_FROM) {
    try {
      const { SESEmailAdapter } = await import('../../adapters/email/ses');
      registry.register(
        new SESEmailAdapter({
          region: process.env.SES_REGION!,
          accessKeyId: process.env.SES_ACCESS_KEY_ID!,
          secretAccessKey: process.env.SES_SECRET_ACCESS_KEY!,
          from: process.env.SES_FROM!,
        })
      );
    } catch (e) {
      console.warn('SES adapter not available');
    }
  }

  // SMS: Twilio
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM) {
    try {
      const { TwilioSmsAdapter } = await import('../../adapters/sms/twilio');
      registry.register(
        new TwilioSmsAdapter({
          accountSid: process.env.TWILIO_ACCOUNT_SID!,
          authToken: process.env.TWILIO_AUTH_TOKEN!,
          from: process.env.TWILIO_FROM!,
        })
      );
    } catch (e) {
      console.warn('Twilio adapter not available');
    }
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
    try {
      const { RedisQueueAdapter } = await import('../../adapters/queue/redis');
      registry.register(new RedisQueueAdapter({ url: process.env.REDIS_URL!, prefix: process.env.REDIS_PREFIX || 'bom' }));
    } catch (e) {
      console.warn('Redis adapter not available');
    }
  }

  // Storage (S3)
  if (process.env.S3_REGION && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY) {
    try {
      const { S3StorageAdapter } = await import('../../adapters/storage/s3');
      registry.register(
        new S3StorageAdapter({
          region: process.env.S3_REGION!,
          accessKeyId: process.env.S3_ACCESS_KEY_ID!,
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
          bucketDefault: process.env.S3_BUCKET_DEFAULT,
        })
      );
    } catch (e) {
      console.warn('S3 adapter not available');
    }
  }

  // Observability: Datadog
  if (process.env.DATADOG_API_KEY) {
    try {
      const { DatadogAdapter } = await import('../../adapters/observability/datadog');
      registry.register(new DatadogAdapter({ apiKey: process.env.DATADOG_API_KEY!, host: process.env.DATADOG_HOST, prefix: 'bom.' }));
    } catch (e) {
      console.warn('Datadog adapter not available');
    }
  }

  // Payments: Stripe
  if (process.env.STRIPE_API_KEY) {
    try {
      const { StripePaymentsAdapter } = await import('../../adapters/payments/stripe');
      registry.register(new StripePaymentsAdapter(process.env.STRIPE_API_KEY!));
    } catch (e) {
      console.warn('Stripe adapter not available');
    }
  }

  await registry.initAll();
  return registry;
}
