# User Guide

Welcome to Build-O-Matic!

Steps to generate a tool:
1. Open the app and go to Templates
2. Pick a template (e.g., GDPR Compliance)
3. Answer 5 questions
4. Click "Gerar Ferramenta"
5. Wait for the SSE progress to reach 100%
6. Copy the deployment URL and credentials

Managing tools:
- List your tools: GET /api/tools?email=you@example.com
- Suspend: POST /api/tools/:id/suspend
- Resume: POST /api/tools/:id/resume

Billing:
- Subscribe: POST /api/billing/subscribe
- Webhook: POST /api/billing/webhook (server-side)
- Trial mode: Enabled by default until subscription active

Troubleshooting:
- If generation fails, verify answers and required fields
- If deploy fails, check logs and environment variables
- For billing issues, ensure Stripe keys are correct and webhooks configured