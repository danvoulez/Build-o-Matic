# Frontend Adjustments for 10-Second Deployment Engine

Changes included:
- Engine toggle on Generation page, gated by environment flag and backend availability:
  - Env flag: `VITE_ENGINE_ENABLED=true` (frontend)
  - Health probe: `OPTIONS /api/deploy/engine` to auto-hide toggle if unavailable
- Extended deploy target options in the wizard:
  - `railway`, `render`, `docker`, `aws-eb`, `aws-ecs`, `gcp-cloudrun`
- API client:
  - `deployViaEngine(payload)` to call the engine route
  - `checkEngineAvailable()` to probe backend route
- Backend:
  - `POST /api/deploy/engine` to invoke TenSecondDeploymentEngine
  - `OPTIONS /api/deploy/engine` as availability probe
  - Route gated behind subscription check
- E2E:
  - `e2e/engine.spec.ts` covers toggle visibility and engine deploy success
  - Validates AWS/GCP target options in wizard

How to enable:
1. Set `VITE_ENGINE_ENABLED=true` in `frontend/.env` (or `.env.example`).
2. Ensure backend route `/api/deploy/engine` is mounted and subscription header is provided.
3. Restart frontend and server.

Notes:
- The engine toggle is hidden unless both the env flag is true and the route responds to OPTIONS with 200.
- For production, you can additionally gate the toggle behind billing status or feature flags.