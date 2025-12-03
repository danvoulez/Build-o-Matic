# Monitoring & Observability

Components:
- Logging: server/logger.ts (JSON structured logs)
- Metrics: Prometheus/OpenTelemetry (future)
- Tracing: Sentry Distributed Tracing (server and client)
- Error Tracking: Sentry

Setup:
1. Set SENTRY_DSN and SENTRY_ENVIRONMENT in .env
2. Server: imports server/monitoring/sentry.ts and uses middlewares
3. Frontend: VITE_SENTRY_DSN + initSentry in src/monitoring/sentry.client.ts

Dashboards:
- Logs: Cloud provider or ELK (optional)
- Metrics: Grafana (planned)
- Alerts: PagerDuty (planned)

Sampling:
- tracesSampleRate: default 0.1–0.2
- profilesSampleRate: default 0.1–0.2