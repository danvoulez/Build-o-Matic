# Provider Matrix

Email
- SMTP: adapters/email/smtp.ts
- SendGrid: adapters/email/sendgrid.ts
- SES: adapters/email/ses.ts

SMS
- Twilio: adapters/sms/twilio.ts

Chat
- Slack (Webhook): adapters/slack/webhook.ts

Webhooks
- Generic HTTP: adapters/webhook/http.ts

Database
- Postgres: adapters/db/postgres.ts

Queue
- Redis (basic): adapters/queue/redis.ts
  - Note: upgrade to BullMQ for production-scale queues

Storage
- AWS S3: adapters/storage/s3.ts

Observability
- Datadog metrics: adapters/observability/datadog.ts
- Prometheus: server/monitoring/prometheus.ts

Payments
- Stripe: adapters/payments/stripe.ts

How to select providers:
- Set env variables for the provider you want
- bootstrapAdapters auto-registers detected providers
- Access via req.app.locals.adapters.get('<adapter-id>')
- Provide fallbacks for missing providers in your business logic