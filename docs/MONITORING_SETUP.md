# Monitoring Setup (Prometheus + Grafana + Sentry)

Prometheus:
- Add /metrics endpoint (server/monitoring/prometheus.ts).
- Scrape target in Prometheus config:
  - job_name: buildomatic
  - metrics_path: /metrics
  - static_configs: [{ targets: ['your-host:4000'] }]

Grafana:
- Import grafana/dashboard-buildomatic.json.
- Connect to Prometheus datasource.
- Panels include HTTP requests, generation duration p95, success rate.

Sentry:
- Set SENTRY_DSN and environment in .env and frontend/.env.
- Server: init via server/monitoring/sentry.ts (error + tracing + profiling).
- Frontend: init via src/monitoring/sentry.client.ts (browser tracing).

Alerts (optional):
- Configure Grafana alerting on p95 > 10s or success rate < 95%.
- Integrate PagerDuty or Slack webhook.