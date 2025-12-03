import { Template } from '../../generator/types';
import { questions } from './questions';

const backendTemplate = `
// OKRs Manager Backend
import express from 'express';
const app = express();
app.use(express.json());

// FEATURE:objectives START
app.post('/okrs/objectives', (_req, res) => res.json({ ok: true }));
// FEATURE:objectives END

// FEATURE:key-results START
app.post('/okrs/key-results', (_req, res) => res.json({ ok: true }));
// FEATURE:key-results END

// FEATURE:check-ins START
app.post('/okrs/check-ins', (_req, res) => res.json({ ok: true }));
// FEATURE:check-ins END

// FEATURE:reports START
app.get('/okrs/reports', (_req, res) => res.json({ score: 0 }));
// FEATURE:reports END

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.listen(3000, () => console.log('OKRs Manager backend running on 3000'));
`;

const frontendTemplate = `import React from 'react';
export default function App() {
  return (
    <div>
      <h1>OKRs Manager - {{companyName}}</h1>
      {/* FEATURE:objectives START */}
      <section><h2>Objetivos</h2><button>Novo objetivo</button></section>
      {/* FEATURE:objectives END */}
      {/* FEATURE:key-results START */}
      <section><h2>Resultados-chave</h2><button>Novo KR</button></section>
      {/* FEATURE:key-results END */}
      {/* FEATURE:check-ins START */}
      <section><h2>Check-ins</h2><button>Novo check-in</button></section>
      {/* FEATURE:check-ins END */}
      {/* FEATURE:reports START */}
      <section><h2>Relatórios</h2><p>Score atual: 0</p></section>
      {/* FEATURE:reports END */}
    </div>
  );
}
`;

const databaseTemplate = `-- OKRs Manager Schema
-- FEATURE:objectives START
CREATE TABLE IF NOT EXISTS objectives ( id SERIAL PRIMARY KEY, title TEXT, owner TEXT, created_at TIMESTAMP DEFAULT NOW() );
-- FEATURE:objectives END
-- FEATURE:key-results START
CREATE TABLE IF NOT EXISTS key_results ( id SERIAL PRIMARY KEY, objective_id INT REFERENCES objectives(id), metric TEXT, target NUMERIC(12,2) );
-- FEATURE:key-results END
-- FEATURE:check-ins START
CREATE TABLE IF NOT EXISTS check_ins ( id SERIAL PRIMARY KEY, objective_id INT REFERENCES objectives(id), note TEXT, created_at TIMESTAMP DEFAULT NOW() );
-- FEATURE:check-ins END
`;

const template: Template = {
  id: 'okrs-manager',
  name: 'OKRs Manager',
  tagline: 'Objetivos e resultados com check-ins e relatórios',
  description: `Organize OKRs com check-ins e relatórios de progresso.`,
  category: 'Management',
  icon: '🎯',
  color: '#10B981',
  screenshots: ['/screenshots/okrs.png'],
  basePrice: 9900,
  pricingTiers: [
    { name: 'Basic', price: 9900, maxUsers: 100, features: ['objectives', 'key-results'] },
    { name: 'Pro', price: 19900, maxUsers: 1000, features: ['objectives', 'key-results', 'check-ins', 'reports'] },
    { name: 'Enterprise', price: 49900, maxUsers: Infinity, features: '*' }
  ],
  questions,
  features: {
    required: ['objectives'],
    available: [
      { id: 'objectives', name: 'Objetivos', included: true },
      { id: 'key-results', name: 'Resultados-chave' },
      { id: 'check-ins', name: 'Check-ins' },
      { id: 'reports', name: 'Relatórios' },
      { id: 'notifications', name: 'Notificações', pricingImpact: 1000 }
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
  validation: { checks: ['has_objectives_table', 'has_key_results'] },
  documentation: { readme: './README.md' },
  examples: [{ name: 'Startup', configuration: { industry: 'saas', users: 15, features: ['objectives', 'key-results', 'check-ins'], integrations: ['email'] } }],
  aiHints: { focusAreas: ['Gestão', 'Produtividade'] },
  codeTemplates: { backend: backendTemplate, frontend: frontendTemplate, database: databaseTemplate },
  config: {
    features: [
      { id: 'objectives', name: 'Objetivos' },
      { id: 'key-results', name: 'Resultados-chave' },
      { id: 'check-ins', name: 'Check-ins' },
      { id: 'reports', name: 'Relatórios' },
      { id: 'notifications', name: 'Notificações' }
    ],
    integrations: [{ id: 'email', name: 'Email' }, { id: 'slack', name: 'Slack' }, { id: 'webhook', name: 'Webhook' }],
    defaultSettings: { region: 'us' },
    dependencies: ['express', 'pg']
  }
};

export default template;