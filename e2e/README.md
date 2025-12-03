# E2E Tests (Playwright)

This folder contains Playwright tests for Build-O-Matic:

- wizard.spec.ts: Full user flow from Home → QuestionFlow → Generation (SSE)
- templates.spec.ts: Template listing and rendering on Home
- generate-api.spec.ts: Backend API tests for /api/generate and /api/generate/stream

How to run locally:
1. Start DB (docker-compose up -d db) or have local Postgres
2. Ensure BILLING_BYPASS=true in .env
3. Run: npm run e2e
4. For headed mode: npm run e2e:headed

CI:
- .github/workflows/ci.yml runs unit + e2e on push/PR
- Playwright browsers are installed via `npx playwright install --with-deps`
- The dev servers (API and Frontend) are auto-started by Playwright config `webServer` entries