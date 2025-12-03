import { Template } from '../../generator/types';
import { questions } from './questions';

const backendTemplate = `
// Helpdesk Backend
import express from 'express';
const app = express();
app.use(express.json());

// FEATURE:tickets START
app.post('/tickets', (_req, res) => res.json({ ok: true, id: Date.now() }));
app.get('/tickets', (_req, res) => res.json({ tickets: [] }));
// FEATURE:tickets END

// FEATURE:sla START
app.get('/sla', (_req, res) => res.json({ sla: { response: '4h', resolution: '24h' } }));
// FEATURE:sla END

// FEATURE:knowledge-base START
app.get('/kb', (_req, res) => res.json({ articles: [] }));
// FEATURE:knowledge-base END

// FEATURE:reports START
app.get('/reports', (_req, res) => res.json({ metrics: {} }));
// FEATURE:reports END

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.listen(3000, () => console.log('Helpdesk backend running on 3000'));
`;

const frontendTemplate = `import React from 'react';
export default function App() {
  return (
    <div>
      <h1>Helpdesk - {{companyName}}</h1>

      {/* FEATURE:tickets START */}
      <section>
        <h2>Tickets</h2>
        <button>Novo ticket</button>
      </section>
      {/* FEATURE:tickets END */}

      {/* FEATURE:sla START */}
      <section>
        <h2>SLA</h2>
        <p>Resposta: 4h / Resolução: 24h</p>
      </section>
      {/* FEATURE:sla END */}

      {/* FEATURE:knowledge-base START */}
      <section>
        <h2>Base de Conhecimento</h2>
        <button>Novo artigo</button>
      </section>
      {/* FEATURE:knowledge-base END */}

      {/* FEATURE:reports START */}
      <section>
        <h2>Relatórios</h2>
        <p>Métricas de suporte</p>
      </section>
      {/* FEATURE:reports END */}
    </div>
  );
}
`;

const databaseTemplate = `-- Helpdesk Schema
-- FEATURE:tickets START
CREATE TABLE IF NOT EXISTS tickets ( id SERIAL PRIMARY KEY, subject TEXT, status TEXT, created_at TIMESTAMP DEFAULT NOW() );
-- FEATURE:tickets END
-- FEATURE:knowledge-base START
CREATE TABLE IF NOT EXISTS kb_articles ( id SERIAL PRIMARY KEY, title TEXT, content TEXT, created_at TIMESTAMP DEFAULT NOW() );
-- FEATURE:knowledge-base END
`;

const template: Template = {
  id: 'helpdesk',
  name: 'Helpdesk',
  tagline: 'Atendimento com tickets, SLA e base de conhecimento',
  description: `Receba, organize e resolva tickets com SLA e relatórios.`,
  category: 'Support',
  icon: '🆘',
  color: '#06B6D4',
  screenshots: ['/screenshots/helpdesk.png'],
  basePrice: 9900,
  pricingTiers: [
    { name: 'Basic', price: 9900, maxUsers: 100, features: ['tickets'] },
    { name: 'Pro', price: 19900, maxUsers: 1000, features: ['tickets', 'sla', 'knowledge-base', 'reports'] },
    { name: 'Enterprise', price: 49900, maxUsers: Infinity, features: '*' }
  ],
  questions,
  features: {
    required: ['tickets'],
    available: [
      { id: 'tickets', name: 'Tickets', included: true },
      { id: 'sla', name: 'SLA' },
      { id: 'knowledge-base', name: 'Base de Conhecimento' },
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
  validation: { checks: ['has_tickets_table', 'has_kb'] },
  documentation: { readme: './README.md' },
  examples: [{ name: 'Suporte SaaS', configuration: { industry: 'saas', users: 30, features: ['tickets', 'sla', 'reports'], integrations: ['email'] } }],
  aiHints: { focusAreas: ['Suporte', 'SLA'] },
  codeTemplates: { backend: backendTemplate, frontend: frontendTemplate, database: databaseTemplate },
  config: {
    features: [
      { id: 'tickets', name: 'Tickets' },
      { id: 'sla', name: 'SLA' },
      { id: 'knowledge-base', name: 'Base de Conhecimento' },
      { id: 'reports', name: 'Relatórios' },
      { id: 'notifications', name: 'Notificações' }
    ],
    integrations: [{ id: 'email', name: 'Email' }, { id: 'slack', name: 'Slack' }, { id: 'webhook', name: 'Webhook' }],
    defaultSettings: { region: 'us' },
    dependencies: ['express', 'pg']
  }
};

export default template;