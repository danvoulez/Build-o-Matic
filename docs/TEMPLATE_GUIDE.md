# Template Guide

Structure:
- templates/<template-id>/
  - config.ts: Template object
  - questions.ts: Five questions
  - schema.ts: Compose schema helpers (optional)
  - backend/, frontend/, database/: optional richer file templates

Conventions:
- Placeholders: {{key}}
- Feature blocks: // FEATURE:<id> START ... // FEATURE:<id> END
- Integration blocks: // INTEGRATION:<id> START ... // INTEGRATION:<id> END

Validation:
- Exactly 5 questions
- Provide codeTemplates for backend, frontend, database
- Include config.defaultSettings and config.features

Testing:
- Add generator tests targeting your template