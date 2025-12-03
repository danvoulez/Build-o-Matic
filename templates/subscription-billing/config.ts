import { Template } from '../../generator/types';
import { questions } from './questions';

const backendTemplate = `
// Subscription Billing Backend (Express)
import express from 'express';
const app = express();
app.use(express.json());

// FEATURE:plans START
app.get('/billing/plans', (_req, res) => res.json({ plans: [] }));
app.post('/billing/plans', (_req, res) => res.json({ ok: true, id: Date.now() }));
// FEATURE:plans END

// FEATURE:subscriptions START
app.post('/billing/subscribe', (_req, res) => res.json({ ok: true, subscriptionId: Date.now() }));
// FEATURE:subscriptions END

// FEATURE:coupons START
app.post('/billing/coupons/apply', (_req, res) => res.json({ ok: true, discount: 10 }));
// FEATURE:coupons END

// FEATURE:invoices START
app.get('/billing/invoices', (_req, res) => res.json({ invoices: [] }));
// FEATURE:invoices END

// FEATURE:reports START
app.get('/billing/reports/mrr', (_req, res) => res.json({ mrr: 0 }));
// FEATURE:reports END

// FEATURE:webhooks START
app.post('/billing/webhook', (_req, res) => res.json({ ok: true }));
// FEATURE:webhooks END

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.listen(3000, () => console.log('Subscription billing backend running on 3000'));
`;

const frontendTemplate = `import React from 'react';
export default function App() {
  return (
    <div>
      <h1>Subscription Billing - {{companyName}}</h1>
      {/* FEATURE:plans START */}
      <section><h2>Planos</h2><button>Novo plano</button></section>
      {/* FEATURE:plans END */}
      {/* FEATURE:subscriptions START */}
      <section><h2>Assinaturas</h2><button>Criar assinatura</button></section>
      {/* FEATURE:subscriptions END */}
      {/* FEATURE:invoices START */}
      <section><h2>Faturas</h2><p>Lista de faturas</p></section>
      {/* FEATURE:invoices END */}
      {/* FEATURE:reports START */}
      <section><h2>MRR</h2><p>Receita recorrente</p></section>
      {/* FEATURE:reports END */}
    </div>
  );
}
`;

const databaseTemplate = `-- Subscription Billing Schema
-- FEATURE:plans START
CREATE TABLE IF NOT EXISTS plans ( id SERIAL PRIMARY KEY, name TEXT, price NUMERIC(12,2), interval TEXT );
-- FEATURE:plans END
-- FEATURE:subscriptions START
CREATE TABLE IF NOT EXISTS subscriptions ( id SERIAL PRIMARY KEY, user_id TEXT, plan_id INT REFERENCES plans(id), status TEXT, created_at TIMESTAMP DEFAULT NOW() );
-- FEATURE:subscriptions END
-- FEATURE:invoices START
CREATE TABLE IF NOT EXISTS invoices ( id SERIAL PRIMARY KEY, subscription_id INT REFERENCES subscriptions(id), amount NUMERIC(12,2), status TEXT, created_at TIMESTAMP DEFAULT NOW() );
-- FEATURE:invoices END
`;

const template: Template = {
  id: 'subscription-billing',
  name: 'Subscription Billing',
  tagline: 'Planos, assinaturas, faturas e relatórios',
  description: `Implemente cobrança recorrente com gestão de planos, assinaturas e faturas.`,
  category: 'Finance',
  icon: '💳',
  color: '#7C3AED',
  screenshots: ['/screenshots/subscription-billing.png'],
  basePrice: 14900,
  pricingTiers: [
    { name: 'Basic', price: 14900, maxUsers: 100, features: ['plans', 'subscriptions'] },
    { name: 'Pro', price: 29900, maxUsers: 1000, features: ['plans', 'subscriptions', 'invoices', 'reports'] },
    { name: 'Enterprise', price: 69900, maxUsers: Infinity, features: '*' }
  ],
  questions,
  features: {
    required: ['plans'],
    available: [
      { id: 'plans', name: 'Planos', included: true },
      { id: 'subscriptions', name: 'Assinaturas' },
      { id: 'coupons', name: 'Cupons' },
      { id: 'invoices', name: 'Faturas' },
      { id: 'reports', name: 'Relatórios' },
      { id: 'webhooks', name: 'Webhooks' }
    ]
  },
  integrations: { available: [{ id: 'email', name: 'Email' }, { id: 'webhook', name: 'Webhook' }] },
  technologies: {
    backend: { language: 'TypeScript', framework: 'Express' },
    frontend: { language: 'TypeScript', framework: 'React' },
    database: { type: 'PostgreSQL', version: '15+' }
  },
  environmentVariables: { required: ['DATABASE_URL', 'JWT_SECRET', 'NODE_ENV'] },
  dependencies: { backend: ['express', 'pg', 'dotenv'], frontend: ['react', 'react-dom', 'react-router-dom'] },
  customization: { branding: { enabled: true, fields: ['company_name'] }, features: { enabled: true, toggleable: true } },
  generation: { steps: ['load_base_ledger','customize_schema','generate_backend','generate_frontend','configure_database','package_deployment'], estimatedTime: 7000 },
  codePaths: { backend: './backend/', frontend: './frontend/', database: './database/', config: './config/' },
  validation: { checks: ['has_plans_table','has_subscriptions_table'] },
  documentation: { readme: './README.md' },
  examples: [{ name: 'SaaS', configuration: { industry: 'saas', users: 100, features: ['plans','subscriptions','invoices'], integrations: ['email'] } }],
  aiHints: { focusAreas: ['Cobrança recorrente', 'Faturamento'] },
  codeTemplates: { backend: backendTemplate, frontend: frontendTemplate, database: databaseTemplate },
  config: {
    features: [
      { id: 'plans', name: 'Planos' },
      { id: 'subscriptions', name: 'Assinaturas' },
      { id: 'coupons', name: 'Cupons' },
      { id: 'invoices', name: 'Faturas' },
      { id: 'reports', name: 'Relatórios' },
      { id: 'webhooks', name: 'Webhooks' }
    ],
    integrations: [{ id: 'email', name: 'Email' }, { id: 'webhook', name: 'Webhook' }],
    defaultSettings: { currency: 'USD' },
    dependencies: ['express','pg']
  }
};

export default template;