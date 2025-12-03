import { Template } from '../../generator/types';
import { questions } from './questions';

const backendTemplate = `
// Proposal Manager Backend (Express)
import express from 'express';
const app = express();
app.use(express.json());

// FEATURE:templates START
app.post('/proposals/templates', (_req, res) => res.json({ ok: true }));
// FEATURE:templates END

// FEATURE:pricing START
app.post('/proposals/:id/pricing', (_req, res) => res.json({ ok: true }));
// FEATURE:pricing END

// FEATURE:approvals START
app.post('/proposals/:id/approve', (_req, res) => res.json({ ok: true }));
// FEATURE:approvals END

// FEATURE:signatures START
app.post('/proposals/:id/sign', (_req, res) => res.json({ ok: true }));
// FEATURE:signatures END

// FEATURE:repository START
app.get('/proposals', (_req, res) => res.json({ proposals: [] }));
// FEATURE:repository END

// FEATURE:reports START
app.get('/proposals/reports', (_req, res) => res.json({ winRate: 0 }));
// FEATURE:reports END

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.listen(3000, () => console.log('Proposal manager backend running on 3000'));
`;

const frontendTemplate = `import React from 'react';
export default function App() {
  return (
    <div>
      <h1>Proposal Manager - {{companyName}}</h1>
      {/* FEATURE:templates START */}
      <section><h2>Modelos</h2><button>Novo modelo</button></section>
      {/* FEATURE:templates END */}
      {/* FEATURE:pricing START */}
      <section><h2>Preços</h2><button>Definir preço</button></section>
      {/* FEATURE:pricing END */}
      {/* FEATURE:approvals START */}
      <section><h2>Aprovações</h2><button>Enviar para aprovação</button></section>
      {/* FEATURE:approvals END */}
      {/* FEATURE:signatures START */}
      <section><h2>Assinaturas</h2><button>Assinar</button></section>
      {/* FEATURE:signatures END */}
      {/* FEATURE:repository START */}
      <section><h2>Repositório</h2><p>Lista de propostas</p></section>
      {/* FEATURE:repository END */}
      {/* FEATURE:reports START */}
      <section><h2>Relatórios</h2><p>Taxa de fechamento</p></section>
      {/* FEATURE:reports END */}
    </div>
  );
}
`;

const databaseTemplate = `-- Proposal Manager Schema
-- FEATURE:repository START
CREATE TABLE IF NOT EXISTS proposals ( id SERIAL PRIMARY KEY, title TEXT, status TEXT, created_at TIMESTAMP DEFAULT NOW() );
-- FEATURE:repository END
-- FEATURE:templates START
CREATE TABLE IF NOT EXISTS proposal_templates ( id SERIAL PRIMARY KEY, name TEXT, content TEXT );
-- FEATURE:templates END
`;

const template: Template = {
  id: 'proposal-manager',
  name: 'Proposal Manager',
  tagline: 'Modelos, preços, aprovações e assinaturas',
  description: `Organize propostas com templates, aprovação e relatórios.`,
  category: 'Sales',
  icon: '📑',
  color: '#F59E0B',
  screenshots: ['/screenshots/proposal-manager.png'],
  basePrice: 9900,
  pricingTiers: [
    { name: 'Basic', price: 9900, maxUsers: 100, features: ['templates', 'repository'] },
    { name: 'Pro', price: 19900, maxUsers: 1000, features: ['templates', 'repository', 'pricing', 'approvals', 'signatures'] },
    { name: 'Enterprise', price: 49900, maxUsers: Infinity, features: '*' }
  ],
  questions,
  features: {
    required: ['repository'],
    available: [
      { id: 'templates', name: 'Modelos' },
      { id: 'pricing', name: 'Preços' },
      { id: 'approvals', name: 'Aprovações' },
      { id: 'signatures', name: 'Assinaturas' },
      { id: 'repository', name: 'Repositório', included: true },
      { id: 'reports', name: 'Relatórios' }
    ]
  },
  integrations: { available: [{ id: 'email', name: 'Email' }, { id: 'webhook', name: 'Webhook' }] },
  technologies: {
    backend: { language: 'TypeScript', framework: 'Express' },
    frontend: { language: 'TypeScript', framework: 'React' },
    database: { type: 'PostgreSQL', version: '15+' }
  },
  environmentVariables: { required: ['DATABASE_URL', 'JWT_SECRET', 'NODE_ENV'] },
  dependencies: { backend: ['express', 'pg', 'dotenv'], frontend: ['react','react-dom','react-router-dom'] },
  customization: { branding: { enabled: true, fields: ['company_name'] }, features: { enabled: true, toggleable: true } },
  generation: { steps: ['load_base_ledger','customize_schema','generate_backend','generate_frontend','configure_database','package_deployment'], estimatedTime: 7000 },
  codePaths: { backend:'./backend/', frontend:'./frontend/', database:'./database/', config:'./config/' },
  validation: { checks: ['has_proposals_table'] },
  documentation: { readme: './README.md' },
  examples: [{ name: 'Agência', configuration: { industry: 'saas', users: 15, features: ['templates','pricing','approvals','signatures'], integrations: ['email'] } }],
  aiHints: { focusAreas: ['Vendas', 'Propostas'] },
  codeTemplates: { backend: backendTemplate, frontend: frontendTemplate, database: databaseTemplate },
  config: {
    features: [
      { id: 'templates', name: 'Modelos' },
      { id: 'pricing', name: 'Preços' },
      { id: 'approvals', name: 'Aprovações' },
      { id: 'signatures', name: 'Assinaturas' },
      { id: 'repository', name: 'Repositório' },
      { id: 'reports', name: 'Relatórios' }
    ],
    integrations: [{ id: 'email', name: 'Email' }, { id: 'webhook', name: 'Webhook' }],
    defaultSettings: { region: 'us' },
    dependencies: ['express','pg']
  }
};

export default template;