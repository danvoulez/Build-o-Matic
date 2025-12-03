import { Template } from '../../generator/types';
import { questions } from './questions';

const backendTemplate = `
// Procurement Manager Backend (Express)
import express from 'express';
const app = express();
app.use(express.json());

// FEATURE:vendors START
app.get('/vendors', (_req, res) => res.json({ vendors: [] }));
// FEATURE:vendors END

// FEATURE:rfq START
app.post('/rfq', (_req, res) => res.json({ ok: true, rfqId: Date.now() }));
// FEATURE:rfq END

// FEATURE:purchase-requests START
app.post('/pr', (_req, res) => res.json({ ok: true, prId: Date.now() }));
// FEATURE:purchase-requests END

// FEATURE:purchase-orders START
app.post('/po', (_req, res) => res.json({ ok: true, poId: Date.now() }));
// FEATURE:purchase-orders END

// FEATURE:approvals START
app.post('/po/:id/approve', (_req, res) => res.json({ ok: true }));
// FEATURE:approvals END

// FEATURE:reports START
app.get('/reports/procurement', (_req, res) => res.json({ spend: 0 }));
// FEATURE:reports END

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.listen(3000, () => console.log('Procurement manager backend running on 3000'));
`;

const frontendTemplate = `import React from 'react';
export default function App() {
  return (
    <div>
      <h1>Procurement Manager - {{companyName}}</h1>
      {/* FEATURE:vendors START */}
      <section><h2>Fornecedores</h2><button>Novo fornecedor</button></section>
      {/* FEATURE:vendors END */}
      {/* FEATURE:rfq START */}
      <section><h2>RFQ</h2><button>Criar RFQ</button></section>
      {/* FEATURE:rfq END */}
      {/* FEATURE:purchase-requests START */}
      <section><h2>Solicitações de Compra</h2><button>Criar PR</button></section>
      {/* FEATURE:purchase-requests END */}
      {/* FEATURE:purchase-orders START */}
      <section><h2>Ordens de Compra</h2><button>Criar PO</button></section>
      {/* FEATURE:purchase-orders END */}
      {/* FEATURE:approvals START */}
      <section><h2>Aprovações</h2><button>Enviar para aprovação</button></section>
      {/* FEATURE:approvals END */}
      {/* FEATURE:reports START */}
      <section><h2>Relatórios</h2><p>Gasto total</p></section>
      {/* FEATURE:reports END */}
    </div>
  );
}
`;

const databaseTemplate = `-- Procurement Manager Schema
-- FEATURE:vendors START
CREATE TABLE IF NOT EXISTS vendors ( id SERIAL PRIMARY KEY, name TEXT, contact TEXT, created_at TIMESTAMP DEFAULT NOW() );
-- FEATURE:vendors END
-- FEATURE:purchase-requests START
CREATE TABLE IF NOT EXISTS purchase_requests ( id SERIAL PRIMARY KEY, requester TEXT, status TEXT, created_at TIMESTAMP DEFAULT NOW() );
-- FEATURE:purchase-requests END
-- FEATURE:purchase-orders START
CREATE TABLE IF NOT EXISTS purchase_orders ( id SERIAL PRIMARY KEY, vendor_id INT REFERENCES vendors(id), status TEXT, created_at TIMESTAMP DEFAULT NOW() );
-- FEATURE:purchase-orders END
`;

const template: Template = {
  id: 'procurement-manager',
  name: 'Procurement Manager',
  tagline: 'RFQ, PR, PO com aprovações e relatórios',
  description: `Centralize compras com fornecedores, RFQ, PR/PO e aprovações.`,
  category: 'Operations',
  icon: '🛒',
  color: '#F43F5E',
  screenshots: ['/screenshots/procurement.png'],
  basePrice: 9900,
  pricingTiers: [
    { name: 'Basic', price: 9900, maxUsers: 100, features: ['vendors', 'purchase-requests'] },
    { name: 'Pro', price: 19900, maxUsers: 1000, features: ['vendors', 'purchase-requests', 'purchase-orders', 'approvals', 'reports'] },
    { name: 'Enterprise', price: 49900, maxUsers: Infinity, features: '*' }
  ],
  questions,
  features: {
    required: ['vendors'],
    available: [
      { id: 'vendors', name: 'Fornecedores', included: true },
      { id: 'rfq', name: 'RFQ' },
      { id: 'purchase-requests', name: 'Solicitações de compra' },
      { id: 'purchase-orders', name: 'Ordens de compra' },
      { id: 'approvals', name: 'Aprovações' },
      { id: 'reports', name: 'Relatórios' }
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
  validation: { checks: ['has_vendors_table', 'has_purchase_orders'] },
  documentation: { readme: './README.md' },
  examples: [{ name: 'Manufatura', configuration: { industry: 'saas', users: 25, features: ['vendors', 'purchase-orders', 'approvals'], integrations: ['email'] } }],
  aiHints: { focusAreas: ['Compras', 'Operações'] },
  codeTemplates: { backend: backendTemplate, frontend: frontendTemplate, database: databaseTemplate },
  config: {
    features: [
      { id: 'vendors', name: 'Fornecedores' },
      { id: 'rfq', name: 'RFQ' },
      { id: 'purchase-requests', name: 'Solicitações de compra' },
      { id: 'purchase-orders', name: 'Ordens de compra' },
      { id: 'approvals', name: 'Aprovações' },
      { id: 'reports', name: 'Relatórios' }
    ],
    integrations: [{ id: 'email', name: 'Email' }, { id: 'slack', name: 'Slack' }, { id: 'webhook', name: 'Webhook' }],
    defaultSettings: { region: 'us' },
    dependencies: ['express', 'pg']
  }
};

export default template;