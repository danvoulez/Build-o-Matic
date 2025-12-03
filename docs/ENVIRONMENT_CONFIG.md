# Environment Configuration

Required variables:
- DATABASE_URL: PostgreSQL connection string
- STRIPE_API_KEY: Billing API key
- STRIPE_WEBHOOK_SECRET: Webhook signature verification
- RAILWAY_API_TOKEN: Railway deploy token
- SENTRY_DSN: Sentry project DSN
- BILLING_BYPASS: true for local dev

Frontend Vite:
- VITE_SENTRY_DSN
- VITE_SENTRY_ENVIRONMENT

Environments:
- development: local dev
- staging: preview deploys
- production: main branch deploys

Examples:
See .env.example and frontend/.env.example