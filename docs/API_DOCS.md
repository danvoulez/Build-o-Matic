# API Docs

Base URL: http://localhost:4000

Templates
- GET /api/templates
- GET /api/templates/:id

Generation
- POST /api/generate
- POST /api/generate/stream (SSE over POST)

Tools
- GET /api/tools?email=:email
- POST /api/tools
- GET /api/tools/:id
- POST /api/tools/:id/suspend
- POST /api/tools/:id/resume
- POST /api/tools/:id/deployment

Billing
- POST /api/billing/subscribe
- POST /api/stripe/webhook

Gate
- POST /api/gate/check

Docker Runner (local demo)
- POST /api/docker/run

Request/Response examples:
- See tests/generate-api.spec.ts (Playwright) and server/tests/*.ts