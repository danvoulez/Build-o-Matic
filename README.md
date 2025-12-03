# Build-O-Matic

Generate business tools in seconds from curated templates. Answer 5 questions, and Build-O-Matic produces backend, frontend, database schema, packages for deployment, and optionally deploys to your platform of choice (Railway, Render, Docker, AWS, GCP). Subscriptions are managed via Stripe; monitoring and error tracking are wired with Prometheus + Grafana and Sentry.

> **📚 [Documentação Completa](./docs/README.md)** - Navegue toda a documentação organizada por categoria.

Highlights:
- Templates catalog for common business needs (GDPR Compliance, HR Onboarding, Invoice Manager, Asset Tracker, Contract Manager, Time Tracking, CRM Lite, Helpdesk, OKRs Manager, Inventory Manager, Procurement Manager, Project Planner, Knowledge Base).
- Generator produces typed code from template `codeTemplates` using feature/integration toggles.
- Deployer supports Railway, Render, Docker, AWS (Elastic Beanstalk/ECS Fargate), and GCP (Cloud Run).
- PostgreSQL-backed persistence for tools and billing status.
- CI/CD pipelines for unit/integration/e2e tests and Cloud deploys.
- Observability via structured logs, Prometheus metrics, Grafana dashboards, and Sentry tracing/errors.
- Industry-standard adapters: SMTP/SendGrid/SES, Slack, HTTP Webhooks, Postgres, Redis queue, S3 storage, Datadog, Stripe payments, Twilio SMS.

## Quick Start

Prerequisites:
- Node.js 18+
- Docker (optional for local Postgres)
- pnpm/npm
- Stripe test keys (optional)
- Railway token (optional for deploy)

Setup:
1. Clone and install
   ```
   npm ci
   ```
2. Configure environment
   - Copy `.env.example` to `.env` and fill values as needed
   - Copy `frontend/.env.example` to `frontend/.env`
3. Start Postgres locally (one option)
   ```
   docker-compose up -d db
   ```
4. Run backend and frontend
   ```
   npm run dev
   ```
   - API at http://localhost:4000
   - Frontend at http://localhost:5173

Generate a tool:
- Open the app, visit Templates, pick one.
- Answer 5 questions; click "Gerar Ferramenta".
- Watch SSE progress; obtain deployment artifact and URL (if auto-deploy enabled).

## Project Structure

- `server/`: Express API, routes, models, migrations, monitoring, Stripe webhook
- `generator/`: core generation, customizer, packager, template engine
- `templates/`: template catalog (each with `questions.ts`, `config.ts`, optional `schema.ts`)
- `frontend/`: React + Vite app with Tailwind, framer-motion, react-query, Sentry
- `deployer/`: deploy orchestrator and providers (Railway, Render, Docker, AWS, GCP)
- `billing/`: Stripe clients and subscriptions utilities
- `adapters/`: industry adapters (email, sms, db, queue, storage, observability, payments)
- `docs/`: guides for environment, CI/CD, monitoring, adapters, deploy, API, user guide, FAQ
- `tests/`: unit/integration/battle tests; `e2e/` Playwright tests
- `.github/workflows/`: CI, E2E, deploy pipelines

## Templates

Available templates include:
- GDPR Compliance
- HR Onboarding
- Invoice Manager
- Asset Tracker
- Contract Manager
- Time Tracking
- CRM Lite
- Helpdesk
- OKRs Manager
- Inventory Manager
- Procurement Manager
- Project Planner
- Knowledge Base

Each template:
- Exactly 5 questions
- `codeTemplates`: backend, frontend, database
- Feature/integration blocks with toggles:
  - `// FEATURE:<id> START … // FEATURE:<id> END`
  - `// INTEGRATION:<id> START … // INTEGRATION:<id> END`
- Pricing tiers and validations

Add templates:
- See [docs/TEMPLATE_GUIDE.md](docs/TEMPLATE_GUIDE.md)

## API

Base URL: `http://localhost:4000`

- Templates
  - GET `/api/templates`
  - GET `/api/templates/:id`
- Generation
  - POST `/api/generate` (requires subscription header or BILLING_BYPASS)
  - POST `/api/generate/stream` (SSE)
- Tools
  - GET `/api/tools?email=:email`
  - POST `/api/tools`
  - GET `/api/tools/:id`
  - POST `/api/tools/:id/suspend`
  - POST `/api/tools/:id/resume`
  - POST `/api/tools/:id/deployment`
- Billing
  - POST `/api/billing/subscribe`
  - POST `/api/stripe/webhook` (raw body)
- Monitoring
  - GET `/metrics` (Prometheus)
  - GET `/health`

Full details: [docs/API_DOCS.md](docs/API_DOCS.md)

## Deployment

Targets:
- Railway (recommended for MVP)
- Render
- Docker (self-hosted)
- AWS: Elastic Beanstalk, ECS Fargate
- GCP: Cloud Run

Orchestrator:
- `deployer/orchestrator.ts` supports targets: `railway`, `render`, `docker`, `aws-eb`, `aws-ecs`, `gcp-cloudrun`

CI/CD:
- Unit + Integration + E2E: `.github/workflows/ci-cd.yml`
- Manual deploy (dispatch): `.github/workflows/deploy-aws-gcp.yml`

Guides:
- [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)
- [docs/DEPLOY_AWS_GCP.md](docs/DEPLOY_AWS_GCP.md)
- [docs/DEPLOY_AWS_GCP_AUTOMATION.md](docs/DEPLOY_AWS_GCP_AUTOMATION.md)
- [docs/DEPLOY_SECRETS.md](docs/DEPLOY_SECRETS.md)

## Monitoring & Error Tracking

- Structured logs via `server/logger.ts` or Winston adapter
- Prometheus metrics: `/metrics` via `server/monitoring/prometheus.ts`
- Grafana dashboard: `grafana/dashboard-buildomatic.json`
- Sentry:
  - Server: `server/monitoring/sentry.ts` (errors + tracing + profiling)
  - Frontend: `frontend/src/monitoring/sentry.client.ts`
- Optional Datadog adapter: `adapters/observability/datadog.ts`

Setup:
- See [docs/MONITORING.md](docs/MONITORING.md) and [docs/MONITORING_SETUP.md](docs/MONITORING_SETUP.md)

## Industry Adapters

Providers:
- Email: SMTP, SendGrid, SES
- SMS: Twilio
- Chat: Slack webhook
- Webhooks: HTTP generic
- DB: Postgres adapter
- Queue: Redis (basic)
- Storage: S3
- Observability: Datadog
- Payments: Stripe

Bootstrap:
- `server/bootstrap/adapters.ts` auto-registers adapters based on env
- Access via `req.app.locals.adapters.get('<adapter-id>')`

Docs:
- [docs/ADAPTERS.md](docs/ADAPTERS.md)
- [docs/ADAPTERS_PROVIDER_MATRIX.md](docs/ADAPTERS_PROVIDER_MATRIX.md)

## Development

Scripts:
- `npm run dev`: run backend and frontend locally
- `npm run build`: build server and frontend
- `npm test`: unit/integration tests (Vitest)
- `npm run e2e`: Playwright E2E tests
- `npm run lint`: ESLint
- `npm run format`: Prettier

Frontend:
- React + Vite + Tailwind
- Dark mode toggle, framer-motion animations, glass cards
- Pages: Home, Templates, Question Flow, Generation (SSE), Deployed, Pricing, FAQ

## Testing

- Vitest unit/integration tests across generator, template engine, packager, server routes, billing, performance/stress, concurrency.
- Playwright E2E:
  - `e2e/wizard.spec.ts`: full flow
  - `e2e/templates.spec.ts`: listing and rendering
  - `e2e/generate-api.spec.ts`: SSE and generate endpoint

CI:
- `.github/workflows/ci-cd.yml` runs tests and e2e on PRs and pushes.

## Security

- Secrets via environment variables; avoid hardcoding
- Stripe webhook with raw body verification
- Helmet for basic HTTP security headers
- Future: JWT auth for protected endpoints (e.g., tools management)

## Documentation

- Final docs: [docs/README_DOCS_FINAL.md](docs/README_DOCS_FINAL.md)
- User guide: [docs/USER_GUIDE.md](docs/USER_GUIDE.md)
- API docs: [docs/API_DOCS.md](docs/API_DOCS.md)
- Video tutorials: [docs/VIDEO_TUTORIALS.md](docs/VIDEO_TUTORIALS.md)
- FAQ: [docs/FAQ.md](docs/FAQ.md)
- CI/CD: [docs/CI_CD.md](docs/CI_CD.md)
- Environment configs: [docs/ENVIRONMENT_CONFIG.md](docs/ENVIRONMENT_CONFIG.md)

## Roadmap

- AuthN/AuthZ (JWT + RBAC)
- BullMQ for robust queueing
- Real Railway/Render API integrations
- Expanded template marketplace
- Live preview builders
- Managed secrets (Vault, Secrets Manager)
- Multi-region deployments
- More cloud adapters (Azure, Fly.io, Heroku)

## Contributing

We welcome contributions!
- Read [CONTRIBUTING.md](CONTRIBUTING.md)
- Strict TypeScript, tests before large changes
- No secrets in code; use env vars
- Use feature/integration block conventions in templates

## License

MIT (or your chosen license). Please review and update this section accordingly.