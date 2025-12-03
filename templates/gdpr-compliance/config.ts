/**
 * GDPR COMPLIANCE TEMPLATE
 * 
 * A complete GDPR compliance tracking system.
 * 
 * FEATURES:
 * - Consent management
 * - Data subject requests (access, deletion)
 * - Audit trail
 * - Breach notification
 * - DPO dashboard
 * 
 * BASED ON:
 * Universal Business Ledger with GDPR-specific customization
 */

import { Template } from '../../generator/types';
import { questions } from './questions';

export const gdprTemplate: Template = {
  // ============================================================================
  // METADATA
  // ============================================================================
  
  id: 'gdpr-compliance',
  name: 'GDPR Compliance Engine',
  tagline: 'Track consent, manage data requests, maintain compliance',
  description: `
    A complete GDPR compliance system that helps you:
    - Track and manage user consent
    - Handle data subject access requests (DSAR)
    - Process right-to-be-forgotten requests
    - Maintain immutable audit logs
    - Generate compliance reports
    - Notify authorities of breaches
  `,
  
  category: 'Legal & Compliance',
  
  // Visual
  icon: '🔒',
  color: '#3B82F6',
  screenshots: [
    '/screenshots/gdpr-dashboard.png',
    '/screenshots/gdpr-consent.png',
    '/screenshots/gdpr-requests.png',
  ],
  
  // Pricing
  basePrice: 9900, // $99/month in cents
  pricingTiers: [
    {
      name: 'Basic',
      price: 9900,
      maxUsers: 100,
      features: ['consent-tracking', 'data-export', 'audit-log'],
    },
    {
      name: 'Pro',
      price: 19900,
      maxUsers: 1000,
      features: ['consent-tracking', 'data-export', 'data-deletion', 'audit-log', 'breach-notification'],
    },
    {
      name: 'Enterprise',
      price: 49900,
      maxUsers: Infinity,
      features: '*', // All features
    },
  ],
  
  // ============================================================================
  // QUESTIONS
  // ============================================================================
  
  questions, // Imported from questions.ts
  
  // ============================================================================
  // FEATURES
  // ============================================================================
  
  features: {
    // Always enabled
    required: [
      'consent-tracking',
    ],
    
    // Can be enabled via questions
    available: [
      {
        id: 'consent-tracking',
        name: 'Consent Management',
        description: 'Track and manage user consent for data processing',
        included: true,
      },
      {
        id: 'data-export',
        name: 'Data Export (Right to Access)',
        description: 'Allow users to export all their data',
        included: false,
        pricingImpact: 0,
      },
      {
        id: 'data-deletion',
        name: 'Data Deletion (Right to be Forgotten)',
        description: 'Process data deletion requests',
        included: false,
        pricingImpact: 0,
      },
      {
        id: 'audit-log',
        name: 'Immutable Audit Trail',
        description: 'Track all data access and modifications',
        included: false,
        pricingImpact: 0,
      },
      {
        id: 'breach-notification',
        name: 'Breach Notification',
        description: 'Automated breach reporting workflow',
        included: false,
        pricingImpact: 1000, // +$10/month
      },
      {
        id: 'dpo-dashboard',
        name: 'DPO Dashboard',
        description: 'Data Protection Officer overview dashboard',
        included: false,
        pricingImpact: 2000, // +$20/month
      },
    ],
  },
  
  // ============================================================================
  // INTEGRATIONS
  // ============================================================================
  
  integrations: {
    available: [
      {
        id: 'email',
        name: 'Email Notifications',
        description: 'Send emails for consent requests, etc.',
        recommended: true,
        config: {
          required: ['smtp_host', 'smtp_user', 'smtp_pass'],
        },
      },
      {
        id: 'slack',
        name: 'Slack',
        description: 'Notify team of new requests via Slack',
        recommended: true,
        config: {
          required: ['slack_webhook_url'],
        },
      },
      {
        id: 'webhook',
        name: 'Webhooks',
        description: 'Send events to your systems',
        recommended: false,
        config: {
          required: ['webhook_url'],
        },
      },
    ],
  },
  
  // ============================================================================
  // TECHNICAL CONFIGURATION
  // ============================================================================
  
  technologies: {
    backend: {
      language: 'TypeScript',
      framework: 'Express',
      base: 'Universal Business Ledger',
    },
    frontend: {
      language: 'TypeScript',
      framework: 'React',
      ui: 'shadcn/ui + Tailwind',
    },
    database: {
      type: 'PostgreSQL',
      version: '15+',
    },
  },
  
  // Environment variables needed
  environmentVariables: {
    required: [
      'DATABASE_URL',
      'JWT_SECRET',
      'NODE_ENV',
    ],
    optional: [
      'SMTP_HOST',
      'SMTP_USER',
      'SMTP_PASS',
      'SLACK_WEBHOOK_URL',
      'WEBHOOK_URL',
    ],
  },
  
  // NPM dependencies
  dependencies: {
    backend: [
      'express',
      'pg',
      'jsonwebtoken',
      'bcrypt',
      'zod',
      'dotenv',
    ],
    frontend: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'axios',
    ],
  },
  
  // ============================================================================
  // CUSTOMIZATION RULES
  // ============================================================================
  
  customization: {
    // What can be customized
    branding: {
      enabled: true,
      fields: ['company_name', 'logo_url', 'primary_color'],
    },
    
    features: {
      enabled: true,
      toggleable: true, // Features can be turned on/off
    },
    
    integrations: {
      enabled: true,
      configurable: true,
    },
    
    workflows: {
      enabled: false, // Not customizable in this template
    },
  },
  
  // ============================================================================
  // GENERATION INSTRUCTIONS
  // ============================================================================
  
  generation: {
    // Order of operations
    steps: [
      'load_base_ledger',
      'customize_schema',
      'generate_backend',
      'generate_frontend',
      'configure_database',
      'package_deployment',
    ],
    
    // Estimated time
    estimatedTime: 8000, // 8 seconds
    
    // Special instructions for AI
    notes: `
      GDPR-specific customizations:
      
      1. SCHEMA: Add tables for consent records, data requests
      2. BACKEND: Add routes for GDPR-specific operations
      3. FRONTEND: Add UI for consent management, request handling
      4. WORKFLOWS: Configure GDPR-specific workflows (consent, deletion)
      5. COMPLIANCE: Enable immutable audit logging
      
      CRITICAL: All data modifications must be logged to audit trail.
    `,
  },
  
  // ============================================================================
  // CODE TEMPLATE PATHS
  // ============================================================================
  
  codePaths: {
    backend: './backend/',
    frontend: './frontend/',
    database: './database/',
    config: './config/',
  },
  
  // ============================================================================
  // VALIDATION
  // ============================================================================
  
  validation: {
    // Validate that generated tool meets requirements
    checks: [
      'has_consent_table',
      'has_audit_log',
      'has_data_export_endpoint',
      'has_frontend_consent_ui',
    ],
  },
  
  // ============================================================================
  // DOCUMENTATION
  // ============================================================================
  
  documentation: {
    readme: './README.md',
    setup: './SETUP.md',
    userGuide: './USER_GUIDE.md',
    apiDocs: './API.md',
  },
  
  // ============================================================================
  // EXAMPLES
  // ============================================================================
  
  examples: [
    {
      name: 'E-commerce store',
      description: 'GDPR compliance for online retail',
      configuration: {
        industry: 'ecommerce',
        users: 50,
        features: ['consent-tracking', 'data-export', 'audit-log'],
        integrations: ['email'],
      },
    },
    {
      name: 'Healthcare provider',
      description: 'GDPR + HIPAA compliance',
      configuration: {
        industry: 'healthcare',
        users: 200,
        features: ['consent-tracking', 'data-export', 'data-deletion', 'audit-log', 'breach-notification'],
        integrations: ['email', 'slack'],
      },
    },
  ],
  
  // ============================================================================
  // METADATA FOR AI GENERATION
  // ============================================================================
  
  aiHints: {
    // Hints for AI generating this template
    focusAreas: [
      'Data protection and privacy',
      'Compliance tracking',
      'Audit trail',
      'User rights management',
    ],
    
    mustHave: [
      'Immutable audit log using ledger',
      'Consent tracking with timestamps',
      'Data export in machine-readable format',
      'Secure deletion with verification',
    ],
    
    niceToHave: [
      'Multi-language support',
      'Mobile responsive design',
      'Real-time notifications',
      'Advanced analytics',
    ],
  },

  // Legacy fields for compatibility with current generator:
  // Provide minimal codeTemplates so Phase 1 generator can produce artifacts.
  codeTemplates: {
    backend: `
// GDPR Backend (Express)
// FEATURE:audit-log START
function auditLogger(req, res, next) {
  console.log('[AUDIT]', req.method, req.url, Date.now());
  next();
}
// FEATURE:audit-log END

// INTEGRATION:slack START
const slackWebhook = process.env.SLACK_WEBHOOK_URL || '';
function notifySlack(message: string) {
  if (!slackWebhook) return;
  // send to Slack...
}
// INTEGRATION:slack END

export const COMPANY = "{{companyName}}";
export const INDUSTRY = "{{industry}}";

import express from 'express';
const app = express();
app.use(express.json());

// FEATURE:consent-tracking START
app.post('/consents', (req, res) => {
  res.json({ ok: true });
});
// FEATURE:consent-tracking END

// FEATURE:data-export START
app.get('/export', (req, res) => {
  res.json({ data: [] });
});
// FEATURE:data-export END

// FEATURE:data-deletion START
app.post('/delete', (req, res) => {
  res.json({ ok: true, status: 'scheduled' });
});
// FEATURE:data-deletion END

// FEATURE:breach-notification START
app.post('/breach', (req, res) => {
  res.json({ ok: true, notified: true });
});
// FEATURE:breach-notification END

// FEATURE:dpo-dashboard START
app.get('/dpo', (_req, res) => {
  res.json({ ok: true, metrics: {} });
});
// FEATURE:dpo-dashboard END

// FEATURE:audit-log START
app.use(auditLogger);
// FEATURE:audit-log END

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.listen(3000, () => console.log('GDPR backend running on 3000'));
    `.trim(),
    frontend: `
import React from 'react';
export default function App() {
  return (
    <div>
      <h1>GDPR Compliance Dashboard - {{companyName}}</h1>
      <p>Industry: {{industry}}</p>

      {/* FEATURE:consent-tracking START */}
      <section>
        <h2>Consent Tracking</h2>
        <button>Record Consent</button>
      </section>
      {/* FEATURE:consent-tracking END */}

      {/* FEATURE:data-export START */}
      <section>
        <h2>Data Export</h2>
        <button>Export User Data</button>
      </section>
      {/* FEATURE:data-export END */}

      {/* FEATURE:data-deletion START */}
      <section>
        <h2>Data Deletion</h2>
        <button>Request Deletion</button>
      </section>
      {/* FEATURE:data-deletion END */}

      {/* FEATURE:audit-log START */}
      <section>
        <h2>Audit Logs</h2>
        <p>Viewing audit logs...</p>
      </section>
      {/* FEATURE:audit-log END */}

      {/* FEATURE:breach-notification START */}
      <section>
        <h2>Breach Notifications</h2>
        <p>Configure breach responses</p>
      </section>
      {/* FEATURE:breach-notification END */}

      {/* FEATURE:dpo-dashboard START */}
      <section>
        <h2>DPO Dashboard</h2>
        <p>Overview metrics for compliance</p>
      </section>
      {/* FEATURE:dpo-dashboard END */}
    </div>
  );
}
    `.trim(),
    database: `
-- GDPR Schema
-- FEATURE:consent-tracking START
CREATE TABLE IF NOT EXISTS consents (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  consent_type VARCHAR(64) NOT NULL,
  granted_at TIMESTAMP NOT NULL DEFAULT NOW()
);
-- FEATURE:consent-tracking END

-- FEATURE:audit-log START
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  action VARCHAR(128) NOT NULL,
  actor VARCHAR(128),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
-- FEATURE:audit-log END

-- FEATURE:data-deletion START
CREATE TABLE IF NOT EXISTS deletion_requests (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  status VARCHAR(32) NOT NULL,
  requested_at TIMESTAMP NOT NULL DEFAULT NOW()
);
-- FEATURE:data-deletion END
    `.trim(),
  },

  // Back-compat config for generator
  config: {
    features: [
      { id: 'consent-tracking', name: 'Consent Tracking' },
      { id: 'data-export', name: 'Data Export' },
      { id: 'data-deletion', name: 'Data Deletion' },
      { id: 'audit-log', name: 'Audit Trail' },
      { id: 'breach-notification', name: 'Breach Notification' },
      { id: 'dpo-dashboard', name: 'DPO Dashboard' },
    ],
    integrations: [
      { id: 'email', name: 'Email' },
      { id: 'slack', name: 'Slack' },
      { id: 'webhook', name: 'Webhook' },
    ],
    defaultSettings: {
      retentionDays: 365,
      region: 'eu',
    },
    dependencies: ['express', 'pg'],
  },
};

export default gdprTemplate;

/**
 * USAGE FOR AI:
 * 
 * When generating a tool from this template:
 * 
 * 1. Load this config
 * 2. Load questions.ts
 * 3. Present questions to user
 * 4. Get answers
 * 5. Use answers to customize code templates
 * 6. Generate final tool
 * 
 * EXAMPLE:
 * 
 * const template = await loadTemplate('gdpr-compliance');
 * const answers = await askQuestions(template.questions);
 * const tool = await generateTool(template, answers);
 * const deployed = await deployTool(tool);
 * 
 * console.log(`Tool ready at: ${deployed.url}`);
 */