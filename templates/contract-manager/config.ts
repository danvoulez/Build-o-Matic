import { Template } from '../../generator/types';
import { questions } from './questions';

const backendTemplate = `
// Contract Manager Backend (Express)
import express from 'express';
const app = express();
app.use(express.json());

export const COMPANY = "{{companyName}}";
export const INDUSTRY = "{{industry}}";

// FEATURE:drafting START
app.post('/contracts/draft', (_req, res) => res.json({ ok: true, contractId: Date.now() }));
// FEATURE:drafting END

// FEATURE:approval-flow START
app.post('/contracts/:id/approve', (_req, res) => res.json({ ok: true }));
// FEATURE:approval-flow END

// FEATURE:signatures START
app.post('/contracts/:id/sign', (_req, res) => res.json({ ok: true }));
// FEATURE:signatures END

// FEATURE:repository START
app.get('/contracts', (_req, res) => res.json({ contracts: [] }));
// FEATURE:repository END

// FEATURE:renewals START
app.post('/contracts/:id/renew', (_req, res) => res.json({ ok: true }));
// FEATURE:renewals END

// FEATURE:audit-log START
app.use((req, _res, next) => { console.log('[AUDIT]', req.method, req.url); next(); });
// FEATURE:audit-log END

// INTEGRATION:email START
function sendContractEmail(to: string, subject: string) { /* ... */ }
// INTEGRATION:email END

// INTEGRATION:slack START
function notifySlack(msg: string) { /* ... */ }
// INTEGRATION:slack END

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.listen(3000, () => console.log('Contract manager backend running on 3000'));
`;

const frontendTemplate = `import React from 'react';
export default function App() {
  return (
    <div>
      <h1>Contract Manager - {{companyName}}</h1>
      <p>Setor: {{industry}}</p>

      {/* FEATURE:drafting START */}
      <section>
        <h2>Redigir Contrato</h2>
        <button>Novo Rascunho</button>
      </section>
      {/* FEATURE:drafting END */}

      {/* FEATURE:approval-flow START */}
      <section>
        <h2>Fluxo de Aprovação</h2>
        <button>Enviar para Aprovação</button>
      </section>
      {/* FEATURE:approval-flow END */}

      {/* FEATURE:signatures START */}
      <section>
        <h2>Assinaturas</h2>
        <button>Assinar</button>
      </section>
      {/* FEATURE:signatures END */}

      {/* FEATURE:repository START */}
      <section>
        <h2>Repositório</h2>
        <p>Listagem de contratos</p>
      </section>
      {/* FEATURE:repository END */}

      {/* FEATURE:renewals START */}
      <section>
        <h2>Renovações</h2>
        <button>Renovar</button>
      </section>
      {/* FEATURE:renewals END */}

      {/* FEATURE:audit-log START */}
      <section>
        <h2>Auditoria</h2>
        <p>Log de ações</p>
      </section>
      {/* FEATURE:audit-log END */}
    </div>
  );
}
`;

const databaseTemplate = `-- Contract Manager Schema
-- FEATURE:repository START
CREATE TABLE IF NOT EXISTS contracts (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  status VARCHAR(32) DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT NOW()
);
-- FEATURE:repository END

-- FEATURE:approval-flow START
CREATE TABLE IF NOT EXISTS approvals (
  id SERIAL PRIMARY KEY,
  contract_id INT REFERENCES contracts(id),
  approver TEXT,
  status VARCHAR(32) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);
-- FEATURE:approval-flow END

-- FEATURE:renewals START
CREATE TABLE IF NOT EXISTS renewals (
  id SERIAL PRIMARY KEY,
  contract_id INT REFERENCES contracts(id),
  renewal_date DATE,
  created_at TIMESTAMP DEFAULT NOW()
);
-- FEATURE:renewals END

-- FEATURE:audit-log START
CREATE TABLE IF NOT EXISTS contract_audit (
  id SERIAL PRIMARY KEY,
  action TEXT,
  actor TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
-- FEATURE:audit-log END
`;

const template: Template = {
  id: 'contract-manager',
  name: 'Contract Manager',
  tagline: 'Criação, aprovação e assinatura de contratos',
  description: `Gerencie contratos do rascunho à assinatura, com repositório e renovações.`,
  category: 'Legal',
  icon: '📃',
  color: '#EF4444',
  screenshots: ['/screenshots/contract-manager.png'],
  basePrice: 9900,
  pricingTiers: [
    { name: 'Basic', price: 9900, maxUsers: 100, features: ['drafting', 'repository'] },
    { name: 'Pro', price: 19900, maxUsers: 1000, features: ['drafting', 'repository', 'approval-flow', 'signatures'] },
    { name: 'Enterprise', price: 49900, maxUsers: Infinity, features: '*' }
  ],
  questions,
  features: {
    required: ['repository'],
    available: [
      { id: 'drafting', name: 'Redação de Contratos' },
      { id: 'approval-flow', name: 'Fluxo de Aprovação' },
      { id: 'signatures', name: 'Assinaturas' },
      { id: 'repository', name: 'Repositório', included: true },
      { id: 'renewals', name: 'Renovações' },
      { id: 'audit-log', name: 'Auditoria', pricingImpact: 1000 }
    ]
  },
  integrations: { available: [{ id: 'email', name: 'Email' }, { id: 'slack', name: 'Slack' }, { id: 'webhook', name: 'Webhook' }] },
  technologies: {
    backend: { language: 'TypeScript', framework: 'Express' },
    frontend: { language: 'TypeScript', framework: 'React' },
    database: { type: 'PostgreSQL', version: '15+' }
  },
  environmentVariables: { required: ['DATABASE_URL', 'JWT_SECRET', 'NODE_ENV'] },
  dependencies: { backend: ['express', 'pg', 'jsonwebtoken', 'dotenv'], frontend: ['react', 'react-dom', 'react-router-dom'] },
  customization: { branding: { enabled: true, fields: ['company_name'] }, features: { enabled: true, toggleable: true } },
  generation: { steps: ['load_base_ledger', 'customize_schema', 'generate_backend', 'generate_frontend', 'configure_database', 'package_deployment'], estimatedTime: 7000 },
  codePaths: { backend: './backend/', frontend: './frontend/', database: './database/', config: './config/' },
  validation: { checks: ['has_contracts_table', 'has_approval_flow'] },
  documentation: { readme: './README.md' },
  examples: [{ name: 'Agência', configuration: { industry: 'saas', users: 20, features: ['drafting', 'approval-flow', 'signatures'], integrations: ['email'] } }],
  aiHints: { focusAreas: ['Jurídico', 'Fluxos de aprovação'] },
  codeTemplates: { backend: backendTemplate, frontend: frontendTemplate, database: databaseTemplate },
  config: {
    features: [
      { id: 'drafting', name: 'Redação' },
      { id: 'approval-flow', name: 'Aprovação' },
      { id: 'signatures', name: 'Assinaturas' },
      { id: 'repository', name: 'Repositório' },
      { id: 'renewals', name: 'Renovações' },
      { id: 'audit-log', name: 'Auditoria' }
    ],
    integrations: [{ id: 'email', name: 'Email' }, { id: 'slack', name: 'Slack' }, { id: 'webhook', name: 'Webhook' }],
    defaultSettings: { region: 'us' },
    dependencies: ['express', 'pg']
  }
};

export default template;