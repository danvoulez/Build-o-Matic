# 🏛️ Build-O-Matic Architecture

## System Overview

Build-O-Matic is a **meta-system** that generates business tools on demand.

```
┌─────────────────────────────────────────────────────────────┐
│                        USER                                  │
│  Needs: GDPR compliance tool                                │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   BUILD-O-MATIC                              │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Question   │→ │  Generator   │→ │   Deployer   │     │
│  │    Engine    │  │              │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              GENERATED TOOL (Running)                        │
│                                                              │
│  Based on: Universal Business Ledger                        │
│  Customized for: GDPR compliance                            │
│  Deployed to: Railway.app                                   │
│  URL: https://acme-gdpr.up.railway.app                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Core Components

### 1. Question Engine

Purpose: Intelligently ask questions to understand user needs

Flow:
```
User selects template (e.g., "GDPR Compliance")
↓
Question Engine loads template's 5 questions
↓
Presents questions one by one
↓
Validates each answer
↓
Determines next question based on previous answers
↓
Returns complete answer set
```

Smart Features:
- Skip questions if answer is implied by previous answers
- Provide suggestions based on industry
- Validate answers in real-time
- Show preview of what will be generated

Example Questions for GDPR Template:
1. "What industry are you in?" → Affects default settings
2. "How many employees will use this?" → Affects pricing tier
3. "Which features do you need?" → Enables/disables code modules
4. "Which services should we integrate?" → Adds API connections
5. "Where should we deploy?" → Determines deployment strategy

---

### 2. Template System

Purpose: Library of pre-built tool configurations

Structure:
```
templates/
├── gdpr-compliance/
│   ├── config.ts              # Template metadata
│   ├── questions.ts           # The 5 questions
│   ├── schema.ts              # Ledger customization
│   ├── backend/               # Backend code templates
│   │   ├── routes.ts.template
│   │   ├── models.ts.template
│   │   └── services.ts.template
│   ├── frontend/              # Frontend code templates
│   │   ├── App.tsx.template
│   │   ├── Dashboard.tsx.template
│   │   └── components/
│   └── database/              # Database schema
│       └── schema.sql.template
```

Template Metadata (config.ts):
```typescript
export const gdprTemplate: Template = {
  id: 'gdpr-compliance',
  name: 'GDPR Compliance Engine',
  description: 'Track consent, manage data requests, audit access',
  category: 'Legal & Compliance',
  basePrice: 9900, // $99 in cents
  
  // Visual
  icon: '🔒',
  color: '#3B82F6',
  screenshots: ['...'],
  
  // Questions
  questions: [...], // Defined in questions.ts
  
  // Base configuration
  features: {
    available: ['consent-tracking', 'data-export', 'audit-log', ...],
    required: ['consent-tracking'], // Always enabled
  },
  
  // Integrations
  integrations: {
    available: ['slack', 'email', 'webhook'],
    recommended: ['email'],
  },
  
  // Technical
  technologies: {
    backend: 'TypeScript + Universal Ledger',
    frontend: 'React + shadcn/ui',
    database: 'PostgreSQL',
  },
  
  // Customization points
  customization: {
    // What can be customized via questions
    branding: true,
    features: true,
    integrations: true,
    workflows: true,
  },
};
```

Questions Definition (questions.ts):
```typescript
export const questions: TemplateQuestion[] = [
  {
    id: 'industry',
    question: 'What industry are you in?',
    type: 'single',
    required: true,
    options: [
      { value: 'ecommerce', label: 'E-commerce', icon: '🛒' },
      { value: 'healthcare', label: 'Healthcare', icon: '🏥' },
      { value: 'finance', label: 'Finance', icon: '💰' },
      { value: 'saas', label: 'SaaS', icon: '💻' },
      { value: 'other', label: 'Other', icon: '📦' },
    ],
    affects: {
      // This answer affects:
      features: ['industry-specific-templates'],
      config: ['default_settings'],
    },
    help: 'This helps us configure industry-specific compliance rules.',
  },
  
  {
    id: 'users',
    question: 'How many people will use this tool?',
    type: 'number',
    required: true,
    validation: {
      min: 1,
      max: 100000,
    },
    affects: {
      pricing: true, // Affects monthly cost
      config: ['rate_limits', 'database_size'],
    },
    help: 'We\'ll configure the system for optimal performance.',
  },
  
  {
    id: 'features',
    question: 'Which features do you need?',
    type: 'multiple',
    required: false,
    options: [
      { value: 'consent-tracking', label: 'Consent Management', recommended: true },
      { value: 'data-export', label: 'Data Export (GDPR Right to Access)' },
      { value: 'data-deletion', label: 'Data Deletion (Right to be Forgotten)' },
      { value: 'audit-log', label: 'Audit Trail' },
      { value: 'breach-notification', label: 'Breach Notification' },
      { value: 'dpo-dashboard', label: 'DPO Dashboard' },
    ],
    affects: {
      features: '*', // All features
      pricing: true, // Some features cost extra
    },
  },
  
  {
    id: 'integrations',
    question: 'Which services should we integrate?',
    type: 'multiple',
    required: false,
    options: [
      { value: 'slack', label: 'Slack', icon: '💬' },
      { value: 'email', label: 'Email notifications', icon: '📧' },
      { value: 'webhook', label: 'Webhooks', icon: '🔗' },
      { value: 'zapier', label: 'Zapier', icon: '⚡' },
    ],
    affects: {
      integrations: '*',
      config: ['notification_channels'],
    },
  },
  
  {
    id: 'deployment',
    question: 'Where should we deploy your tool?',
    type: 'single',
    required: true,
    options: [
      { 
        value: 'cloud',
        label: 'Ledger Cloud (Managed)',
        description: '$99/month, we handle everything',
        recommended: true,
      },
      {
        value: 'aws',
        label: 'Your AWS Account',
        description: '$199 one-time + your AWS costs',
      },
      {
        value: 'docker',
        label: 'Docker (Self-hosted)',
        description: '$499 one-time',
      },
    ],
    affects: {
      pricing: true,
      config: ['deployment_target'],
    },
  },
];
```

---

### 3. Generator Core

Purpose: Transform template + answers into deployable code

Process:
```
1. LOAD TEMPLATE
   ↓
2. VALIDATE ANSWERS
   ↓
3. CUSTOMIZE BACKEND
   - Replace {{placeholders}}
   - Enable/disable features
   - Configure integrations
   ↓
4. CUSTOMIZE FRONTEND
   - Apply branding
   - Enable feature UI
   - Configure routes
   ↓
5. CUSTOMIZE DATABASE
   - Add/remove tables
   - Configure indexes
   - Set up migrations
   ↓
6. GENERATE CONFIG
   - Environment variables
   - Secrets
   - Dependencies
   ↓
7. PACKAGE FOR DEPLOYMENT
   - Create Dockerfile
   - Generate docker-compose.yml
   - Platform-specific configs
   ↓
8. RETURN GENERATED TOOL
```

Customization Techniques:

1. String Interpolation (Simple):
```typescript
// Template:
const COMPANY_NAME = '{{company_name}}';
const MAX_USERS = {{max_users}};

// After customization:
const COMPANY_NAME = 'Acme Corp';
const MAX_USERS = 50;
```

2. Conditional Compilation (Features):
```typescript
// Template:
{{#if features.includes('audit-log')}}
import { AuditLogger } from './audit';
const logger = new AuditLogger();
{{/if}}

// After customization (if enabled):
import { AuditLogger } from './audit';
const logger = new AuditLogger();

// After customization (if disabled):
// (code removed)
```

3. Template Functions (Complex):
```typescript
// Template:
{{generateRoutes(features)}}

// Generator function:
function generateRoutes(features: string[]): string {
  const routes = features.map(feature => {
    return `app.use('/api/${feature}', ${feature}Router);`;
  });
  return routes.join('\n');
}
```

4. AST Manipulation (Advanced):
```typescript
// For complex code changes, parse into AST, modify, regenerate

import { parse, generate } from '@babel/core';

const ast = parse(templateCode);
// Modify AST nodes
const newCode = generate(ast);
```

---

### 4. Deployment System

Purpose: Take generated code and deploy it automatically

Supported Platforms:

1. Railway.app (Recommended)
   - Best for managed deployment
   - Automatic PostgreSQL
   - Simple environment variable management
   - Great free tier

2. Render.com (Alternative)
   - Similar to Railway
   - Good for static sites + API
   - PostgreSQL included

3. Docker (Self-hosted)
   - For users who want full control
   - Provides docker-compose.yml
   - User deploys themselves

Deployment Flow (Railway):
```
1. CREATE PROJECT
   POST /projects
   ↓
2. ADD POSTGRESQL
   POST /projects/{id}/plugins
   type: postgresql
   ↓
3. CREATE BACKEND SERVICE
   POST /projects/{id}/services
   source: generated backend code
   ↓
4. CREATE FRONTEND SERVICE
   POST /projects/{id}/services
   source: generated frontend code
   ↓
5. CONFIGURE ENVIRONMENT
   POST /projects/{id}/variables
   DATABASE_URL, JWT_SECRET, etc.
   ↓
6. DEPLOY
   POST /projects/{id}/deployments
   ↓
7. WAIT FOR SUCCESS
   Poll: GET /deployments/{id}
   ↓
8. RETURN URLS
   frontend: https://xxx.up.railway.app
   backend: https://yyy.up.railway.app
```

Environment Configuration:
```typescript
// Generated .env for Railway
DATABASE_URL={{POSTGRESQL_URL}}  // Railway provides this
JWT_SECRET={{GENERATED_SECRET}}
API_KEY={{GENERATED_API_KEY}}
NODE_ENV=production

// User-specific
COMPANY_NAME={{user_answers.company_name}}
MAX_USERS={{user_answers.max_users}}
FEATURES={{user_answers.features.join(',')}}

// Integrations
{{#if integrations.includes('slack')}}
SLACK_WEBHOOK_URL={{user_provided}}
{{/if}}
```

---

### 5. Billing System

Purpose: Handle payments and subscriptions

Stripe Integration:

Products & Prices:
```
Product: Business Tool Subscription
├── Price: Basic ($99/month)
├── Price: Pro ($199/month)
└── Price: Enterprise ($499/month)
```

Subscription Flow:
```
1. User completes generation
   ↓
2. Tool is deployed but in "trial" mode
   (7 days free, watermarked)
   ↓
3. User enters payment method
   ↓
4. Create Stripe Customer
   ↓
5. Create Subscription
   ↓
6. On payment success:
   - Remove watermark
   - Enable full features
   - Send credentials
   ↓
7. On payment failure:
   - Notify user
   - Suspend tool after grace period
```

Webhook Handling:
```typescript
// Handle Stripe webhooks
app.post('/webhooks/stripe', async (req, res) => {
  const event = stripe.webhooks.constructEvent(
    req.body,
    req.headers['stripe-signature'],
    WEBHOOK_SECRET
  );
  
  switch (event.type) {
    case 'payment_intent.succeeded':
      // Activate tool
      await activateTool(event.data.object.metadata.toolId);
      break;
      
    case 'payment_intent.failed':
      // Notify user, grace period
      await notifyPaymentFailed(event.data.object.metadata.toolId);
      break;
      
    case 'customer.subscription.deleted':
      // Suspend tool
      await suspendTool(event.data.object.metadata.toolId);
      break;
  }
  
  res.json({ received: true });
});
```

---

## Data Flow

Complete User Journey
```
1. USER VISITS BUILD.LEDGER.DEV
   └→ Home page shows template catalog
   
2. USER SELECTS "GDPR Compliance Tool"
   └→ QuestionFlow page loads
   
3. USER ANSWERS 5 QUESTIONS
   Industry: E-commerce
   Users: 50
   Features: [Consent, Export, Audit]
   Integrations: [Email, Slack]
   Deploy: Cloud
   └→ POST /api/generate
   
4. GENERATOR PROCESSES
   └→ Load template: gdpr-compliance
   └→ Validate answers: ✓
   └→ Customize backend: ✓
   └→ Customize frontend: ✓
   └→ Generate config: ✓
   └→ Package: ✓
   
5. DEPLOYER RUNS
   └→ Create Railway project
   └→ Add PostgreSQL
   └→ Deploy backend
   └→ Deploy frontend
   └→ Configure env vars
   └→ Wait for deployment
   └→ URLs ready!
   
6. BILLING ACTIVATES
   └→ Create Stripe checkout
   └→ User enters payment
   └→ Subscription created
   └→ Tool activated
   
7. USER RECEIVES:
   - Tool URL: https://acme-gdpr.up.railway.app
   - Admin credentials
   - API keys
   - Documentation
   
8. USER STARTS USING TOOL
   └→ Log in
   └→ Configure company settings
   └→ Invite team members
   └→ Start tracking GDPR compliance!
```

---

## Database Schema

Build-O-Matic Internal Database
```sql
-- Users who use the generator
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Generated tools
CREATE TABLE tools (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  template_id VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL, -- generating, deployed, active, suspended
  
  -- Answers from questions
  configuration JSONB NOT NULL,
  
  -- Deployment info
  deployment_type VARCHAR(50),
  deployment_url VARCHAR(500),
  
  -- Billing
  subscription_id VARCHAR(255),
  billing_status VARCHAR(50),
  
  created_at TIMESTAMP DEFAULT NOW(),
  deployed_at TIMESTAMP,
  last_active TIMESTAMP
);

-- Deployment logs
CREATE TABLE deployments (
  id UUID PRIMARY KEY,
  tool_id UUID REFERENCES tools(id),
  status VARCHAR(50), -- pending, deploying, success, failed
  logs TEXT,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Billing transactions
CREATE TABLE transactions (
  id UUID PRIMARY KEY,
  tool_id UUID REFERENCES tools(id),
  stripe_payment_id VARCHAR(255),
  amount INTEGER NOT NULL,
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## API Endpoints

Public API (for frontend)
```
POST   /api/templates              List available templates
GET    /api/templates/:id          Get template details
POST   /api/generate                Start generation
GET    /api/generate/:id/status    Check generation status
GET    /api/generate/:id/stream    SSE stream for live updates

POST   /api/billing/checkout       Create Stripe checkout
POST   /api/billing/portal         Customer portal link

GET    /api/tools                  List user's tools
GET    /api/tools/:id              Get tool details
DELETE /api/tools/:id              Delete tool
POST   /api/tools/:id/suspend      Suspend tool
POST   /api/tools/:id/resume       Resume tool
```

Internal API (for generated tools)
```
POST   /api/internal/health        Health check
POST   /api/internal/metrics       Report metrics
POST   /api/internal/logs          Send logs
```

---

## Security

### Generated Tools

Each generated tool has:
1. Unique JWT secret - For authentication
2. Unique API key - For API access
3. Database credentials - Isolated database
4. Rate limiting - Based on subscription tier

### Build-O-Matic Platform

1. Authentication: Auth0 or similar
2. Authorization: User can only access their tools
3. API rate limiting: Prevent abuse
4. Webhook signature verification: Stripe webhooks
5. Input validation: All user inputs sanitized

---

## Performance

Targets
- Generation time: < 10 seconds
- Deployment time: < 60 seconds
- Total time to deployed tool: < 90 seconds

Optimization Strategies
1. Template caching: Load templates once, keep in memory
2. Parallel generation: Generate backend/frontend simultaneously
3. Async deployment: Deploy while showing progress
4. Code minification: Smaller deployments = faster
5. CDN: Static assets served from CDN

---

## Monitoring

Metrics to Track
1. Generation metrics:
   - Generation time (p50, p95, p99)
   - Success rate
   - Template usage distribution

2. Deployment metrics:
   - Deployment time
   - Success rate
   - Failure reasons

3. Business metrics:
   - Tools generated per day
   - Conversion rate (generated → paid)
   - Churn rate
   - MRR growth

4. System metrics:
   - API response times
   - Error rates
   - Database query times

Tools
- Logging: Winston or Pino
- Metrics: Prometheus
- Tracing: OpenTelemetry
- Dashboards: Grafana
- Alerts: PagerDuty

---

## Scalability

Growth Projections
```
Month 1:  10 tools/day  = 300 tools/month
Month 3:  50 tools/day  = 1,500 tools/month
Month 6:  200 tools/day = 6,000 tools/month
Year 1:   1000 tools/day = 30,000 tools/month
```

Infrastructure Needs

Phase 1 (0-1000 tools):
- Single server (Build-O-Matic)
- Railway for generated tools
- Stripe for billing
- PostgreSQL database

Phase 2 (1000-10,000 tools):
- Load balancer
- Multiple generator workers
- Redis for caching
- Separate database for each subsystem

Phase 3 (10,000+ tools):
- Kubernetes cluster
- Dedicated deployment workers
- Multi-region deployment
- Dedicated support team

---

## Future Enhancements

Phase 4 (Post-MVP)
1. AI Customization:
   - "Build me a GDPR tool that looks like Stripe"
   - Claude generates custom UI based on description
2. Template Marketplace:
   - Users can create and sell templates
   - 70% revenue share
   - Curated quality
3. White-label:
   - Agencies can resell Build-O-Matic
   - Custom branding
   - Revenue share model
4. Advanced Features:
   - Multi-language support
   - Advanced integrations
   - Custom workflows
   - Role-based access control

---

## Conclusion

Build-O-Matic is a tool generation platform that:
- Makes creating business tools trivial
- Removes all technical barriers
- Enables rapid experimentation
- Scales automatically
- Generates predictable revenue

Core insight: Most business tools are variations on the same patterns. Instead of building each one from scratch, generate them from templates customized with user answers.

Success metric: 10,000 generated tools running in production within 12 months.