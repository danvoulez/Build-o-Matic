import { Template } from '../../generator/types';
import { questions } from './questions';

const backendTemplate = `
// Expense Manager Backend (Express)
import express from 'express';
const app = express();
app.use(express.json());

// FEATURE:expenses START
app.post('/expenses', (_req, res) => res.json({ ok: true, id: Date.now() }));
app.get('/expenses', (_req, res) => res.json({ expenses: [] }));
// FEATURE:expenses END

// FEATURE:categories START
app.get('/expense-categories', (_req, res) => res.json({ categories: [] }));
// FEATURE:categories END

// FEATURE:approvals START
app.post('/expenses/:id/approve', (_req, res) => res.json({ ok: true }));
// FEATURE:approvals END

// FEATURE:reimbursements START
app.post('/expenses/:id/reimburse', (_req, res) => res.json({ ok: true }));
// FEATURE:reimbursements END

// FEATURE:reports START
app.get('/expenses/reports', (_req, res) => res.json({ total: 0 }));
// FEATURE:reports END

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.listen(3000, () => console.log('Expense manager backend running on 3000'));
`;

const frontendTemplate = `import React from 'react';
export default function App() {
  return (
    <div>
      <h1>Expense Manager - {{companyName}}</h1>
      {/* FEATURE:expenses START */}
      <section><h2>Despesas</h2><button>Novo lançamento</button></section>
      {/* FEATURE:expenses END */}
      {/* FEATURE:categories START */}
      <section><h2>Categorias</h2><p>Lista</p></section>
      {/* FEATURE:categories END */}
      {/* FEATURE:approvals START */}
      <section><h2>Aprovações</h2><button>Enviar aprovação</button></section>
      {/* FEATURE:approvals END */}
      {/* FEATURE:reimbursements START */}
      <section><h2>Reembolsos</h2><button>Solicitar reembolso</button></section>
      {/* FEATURE:reimbursements END */}
      {/* FEATURE:reports START */}
      <section><h2>Relatórios</h2><p>Total gasto</p></section>
      {/* FEATURE:reports END */}
    </div>
  );
}
`;

const databaseTemplate = `-- Expense Manager Schema
-- FEATURE:expenses START
CREATE TABLE IF NOT EXISTS expenses ( id SERIAL PRIMARY KEY, user_id TEXT, category TEXT, amount NUMERIC(12,2), status TEXT, created_at TIMESTAMP DEFAULT NOW() );
-- FEATURE:expenses END
-- FEATURE:reimbursements START
CREATE TABLE IF NOT EXISTS reimbursements ( id SERIAL PRIMARY KEY, expense_id INT REFERENCES expenses(id), amount NUMERIC(12,2), status TEXT, created_at TIMESTAMP DEFAULT NOW() );
-- FEATURE:reimbursements END
`;

const template: Template = {
  id: 'expense-manager',
  name: 'Expense Manager',
  tagline: 'Gestão de despesas com aprovações e reembolsos',
  description: `Controle despesas, aprovações e reembolsos com relatórios.`,
  category: 'Finance',
  icon: '🧾',
  color: '#14B8A6',
  screenshots: ['/screenshots/expense-manager.png'],
  basePrice: 9900,
  pricingTiers: [
    { name: 'Basic', price: 9900, maxUsers: 100, features: ['expenses','categories'] },
    { name: 'Pro', price: 19900, maxUsers: 1000, features: ['expenses','categories','approvals','reimbursements','reports'] },
    { name: 'Enterprise', price: 49900, maxUsers: Infinity, features: '*' }
  ],
  questions,
  features: {
    required: ['expenses'],
    available: [
      { id: 'expenses', name: 'Despesas', included: true },
      { id: 'categories', name: 'Categorias' },
      { id: 'approvals', name: 'Aprovações' },
      { id: 'reimbursements', name: 'Reembolsos' },
      { id: 'reports', name: 'Relatórios' }
    ]
  },
  integrations: { available: [{ id: 'email', name: 'Email' }, { id: 'webhook', name: 'Webhook' }] },
  technologies: {
    backend: { language: 'TypeScript', framework: 'Express' },
    frontend: { language: 'TypeScript', framework: 'React' },
    database: { type: 'PostgreSQL', version: '15+' }
  },
  environmentVariables: { required: ['DATABASE_URL','JWT_SECRET','NODE_ENV'] },
  dependencies: { backend: ['express','pg','dotenv'], frontend: ['react','react-dom','react-router-dom'] },
  customization: { branding: { enabled: true, fields: ['company_name'] }, features: { enabled: true, toggleable: true } },
  generation: { steps: ['load_base_ledger','customize_schema','generate_backend','generate_frontend','configure_database','package_deployment'], estimatedTime: 7000 },
  codePaths: { backend:'./backend/', frontend:'./frontend/', database:'./database/', config:'./config/' },
  validation: { checks: ['has_expenses_table'] },
  documentation: { readme: './README.md' },
  examples: [{ name: 'Consultoria', configuration: { industry:'saas', users: 25, features:['expenses','approvals','reimbursements'], integrations:['email'] } }],
  aiHints: { focusAreas: ['Financeiro','Operações'] },
  codeTemplates: { backend: backendTemplate, frontend: frontendTemplate, database: databaseTemplate },
  config: {
    features: [
      { id: 'expenses', name: 'Despesas' },
      { id: 'categories', name: 'Categorias' },
      { id: 'approvals', name: 'Aprovações' },
      { id: 'reimbursements', name: 'Reembolsos' },
      { id: 'reports', name: 'Relatórios' }
    ],
    integrations: [{ id: 'email', name: 'Email' }, { id: 'webhook', name: 'Webhook' }],
    defaultSettings: { region: 'us' },
    dependencies: ['express','pg']
  }
};

export default template;