# CI/CD Pipeline

Stages:
- test: unit/integration with Postgres service
- e2e: Playwright UI tests
- build-docker: builds Docker image
- deploy-preview: Railway preview deployment (develop and PR branches)
- deploy-production: Railway production deployment (main branch)

Secrets:
- RAILWAY_TOKEN: Railway CLI token
- PREVIEW_DATABASE_URL: Preview DB connection
- PROD_DATABASE_URL: Production DB connection
- SENTRY_DSN: Error tracking

Environment Injection:
- railway variables set DATABASE_URL="$DATABASE_URL" SENTRY_DSN="$SENTRY_DSN"

Future:
- Add Render deploy job
- Add GitHub Releases with artifacts
- Add canary deploy and blue/green strategy