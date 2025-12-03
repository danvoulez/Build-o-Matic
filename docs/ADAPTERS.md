# Industry-Standard Adapters

Overview
- Email (SMTP): adapters/email/smtp.ts
- Slack (Webhook): adapters/slack/webhook.ts
- Generic Webhook (HTTP): adapters/webhook/http.ts
- Database (Postgres): adapters/db/postgres.ts
- Queue (Redis): adapters/queue/redis.ts
- Storage (S3): adapters/storage/s3.ts

Usage
- Bootstrap: server/bootstrap/adapters.ts registers adapters found via env vars
- Access: in Express handlers, use req.app.locals.adapters.get('<adapter-id>')
  - email:smtp → SMTPEmailAdapter
  - slack:webhook → SlackWebhookAdapter
  - webhook:http → HttpWebhookAdapter
  - db:postgres → PostgresAdapter
  - queue:redis → RedisQueueAdapter
  - storage:s3 → S3StorageAdapter

Environment Variables
- SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, SMTP_FROM
- SLACK_WEBHOOK_URL
- WEBHOOK_BASE_URL, WEBHOOK_TOKEN
- DATABASE_URL, DATABASE_SSL, DB_POOL_MAX
- REDIS_URL, REDIS_PREFIX
- S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_BUCKET_DEFAULT

Examples
```ts
// Send email
const email = req.app.locals.adapters.get('email:smtp');
await email.send('user@example.com', 'Welcome', '<h1>Hello</h1>', 'Hello');

// Slack notify
const slack = req.app.locals.adapters.get('slack:webhook');
await slack.post({ text: 'New GDPR request received' });

// Webhook
const wh = req.app.locals.adapters.get('webhook:http');
await wh.send('tool.generated', { id: result.id });

// DB
const db = req.app.locals.adapters.get('db:postgres');
const rows = await db.query('SELECT * FROM tools WHERE status=$1', ['active']);

// Queue
const q = req.app.locals.adapters.get('queue:redis');
await q.enqueue('emails', { to: 'user@example.com', subject: 'Hello' });

// Storage
const s3 = req.app.locals.adapters.get('storage:s3');
await s3.put('my-bucket', 'reports/jan.csv', Buffer.from('id,amount\n1,100'));