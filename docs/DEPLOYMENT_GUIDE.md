# Deployment Guide

Supported targets:
- Railway (recommended)
- Render
- Docker (self-hosted)

Steps:
1. Generate tool with Generator.generate()
2. Use deployer/orchestrator to deploy to target
3. Inject environment variables (see config/env.json)
4. Save deployment URL and credentials in tools table
5. Monitor deployment status through platform APIs

Railway:
- Requires RAILWAY_API_TOKEN
- Create project, add Postgres, create backend/frontend services, set envs, wait for success

Render:
- Use render.yaml included in package
- Create two web services (backend/frontend)
- Connect to repo or upload artifact via deploy hook

Docker:
- Build with Dockerfile
- run docker-compose.yml
- Set DATABASE_URL and JWT_SECRET

Troubleshooting:
- Ensure DATABASE_URL points to provisioned DB
- Check logs from services
- Use BILLING_BYPASS for local testing