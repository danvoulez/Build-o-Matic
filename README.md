# Build-O-Matic — Business Tool Vending Machine

Generate custom business tools in 10 seconds from templates based on the Universal Business Ledger. Answer 5 questions → get a tailored tool → auto-deploy → pay $99/month → start using immediately.

## Highlights

- Tool generator platform with modular templates
- Auto-deployment (Railway, Render, Docker)
- Beautiful UI with a 5-question wizard
- Stripe billing integration
- Extensive documentation for AI and devs

## Repository Structure

```
build-o-matic/
├── docs/                      # Documentation for AI continuation and devs
├── generator/                 # Core generation engine
├── templates/                 # Tool templates (GDPR, HR, Invoice, etc.)
├── deployer/                  # Deployment integrations
├── billing/                   # Stripe integration
└── frontend/                  # React app for user-facing flows
```

## Quick Start

1. Read QUICKSTART.md
2. Read docs/AI_INSTRUCTIONS.md
3. Install dependencies: `npm install`
4. Run dev server and frontend: `npm run dev`

## MVP Phases

- Phase 1: Generator + Template System
- Phase 2: Auto-deploy Infrastructure
- Phase 3: UI/UX + Billing + Launch

See docs/ARCHITECTURE.md for system details.

## Templates

- GDPR Compliance (complete example)
- HR Onboarding (planned)
- Invoice Manager (planned)

## Pricing

- Single Tool: $99/month
- 3-Tool Bundle: $249/month
- Unlimited: $999/month
- Self-Hosted: $999 one-time

## Documentation

- docs/AI_INSTRUCTIONS.md — Detailed guide for AI (12-week plan)
- docs/ARCHITECTURE.md — Architecture, APIs, schema, security
- docs/TEMPLATE_GUIDE.md — Template authoring guide
- docs/DEPLOYMENT_GUIDE.md — Deployment details

## License

MIT (with attribution). Based on Universal Business Ledger by Daniel Voulez.