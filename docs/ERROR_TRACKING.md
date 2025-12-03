# Error Tracking (Sentry)

Server:
- Initialize Sentry via server/monitoring/sentry.ts
- Request handler + tracing + error handler
- Configure sample rates with env vars

Frontend:
- Initialize in src/monitoring/sentry.client.ts
- Browser tracing and route monitoring
- Wrap router with Sentry

Best Practices:
- Avoid logging secrets
- Add context (user id, tool id) when applicable
- Use breadcrumbs for important actions
- Review issues weekly and prioritize high-impact errors