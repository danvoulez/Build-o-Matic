import { Template } from '../../generator/types';
import { questions } from './questions';

const backendTemplate = `
// CRM Lite Backend
import express from 'express';
const app = express();
app.use(express.json());

// FEATURE:contacts START
app.get('/contacts', (_req, res) => res.json({ contacts: [] }));
// FEATURE:contacts END

// FEATURE:leads START
app.get('/leads', (_req, res) => res.json({ leads: [] }));
// FEATURE:leads END

// FEATURE:pipeline START
app.get('/pipeline', (_req, res) => res.json({ stages: [] }));
// FEATURE:pipeline END

// FEATURE:email-campaigns START
app.post('/campaigns', (_req, res) => res.json({ ok: true }));
// FEATURE:email-campaigns END

// FEATURE:reports START
app.get('/reports', (_req, res) => res.json({ metrics: {} }));
// FEATURE:reports END

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.listen(3000, () => console.log('CRM Lite backend running on 3000'));
`;

const frontendTemplate = `import React from 'react';
export default function App() {
  return (
    <div>
      <h1>CRM Lite - {{companyName}}</h1>

      {/* FEATURE:contacts START */}
      <section>
        <h2>Contatos</h2>
        <button>Novo contato</button>
      </section>
      {/* FEATURE:contacts END */}

      {/* FEATURE:leads START */}
      <section>
        <h2>Leads</h2>
        <button>Novo lead</button>
      </section>
      {/* FEATURE:leads END */}

      {/* FEATURE:pipeline START */}
      <section>
        <h2>Pipeline</h2>
        <p>Etapas</p>
      </section>
      {/* FEATURE:pipeline END */}

      {/* FEATURE:email-campaigns START */}
      <section>
        <h2>Campanhas de Email</h2>
        <button>Criar campanha</button>
      </section>
      {/* FEATURE:email-campaigns END */}

      {/* FEATURE:reports START */}
      <section>
        <h2>Relatórios</h2>
        <p>Métricas gerais</p>
      </section>
      {/* FEATURE:reports END */}
    </div>
  );
}
`;

const databaseTemplate = `-- CRM Lite Schema
-- FEATURE:contacts START
CREATE TABLE IF NOT EXISTS contacts ( id SERIAL PRIMARY KEY, name TEXT, email TEXT, created_at TIMESTAMP DEFAULT NOW() );
-- FEATURE:contacts END
-- FEATURE:leads START
CREATE TABLE IF NOT EXISTS leads ( id SERIAL PRIMARY KEY, source TEXT, status TEXT, created_at TIMESTAMP DEFAULT NOW() );
-- FEATURE:leads END
-- FEATURE:pipeline START
CREATE TABLE IF NOT EXISTS pipeline_stages ( id SERIAL PRIMARY KEY, name TEXT, position INT );
-- FEATURE:pipeline END
`;

const template: Template = {
  id: 'crm-lite',
  name: 'CRM Lite',
  tagline: 'Contatos, leads e pipeline simples',
  description: `Um CRM leve para operações essenciais.`,
  category: 'Sales',
  icon: '🤝',
  color: '#F97316',
  screenshots: ['/screenshots/crm.png'],
  basePrice: 9900,
  pricingTiers: [
    { name: 'Basic', price: 9900, maxUsers: 100, features: ['contacts', 'leads'] },
    { name: 'Pro', price: 19900, maxUsers: 1000, features: ['contacts', 'leads', 'pipeline', 'reports'] },
    { name: 'Enterprise', price: 49900, maxUsers: Infinity, features: '*' }
  ],
  questions,
  features: {
    required: ['contacts'],
    available: [
      { id: 'contacts', name: 'Contatos', included: true },
      { id: 'leads', name: 'Leads' },
      { id: 'pipeline', name: 'Pipeline' },
      { id: 'email-campaigns', name: 'Campanhas de Email' },
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
  validation: { checks: ['has_contacts_table', 'has_leads_table'] },
  documentation: { readme: './README.md' },
  examples: [{ name: 'Agência de Marketing', configuration: { industry: 'saas', users: 10, features: ['contacts', 'leads', 'pipeline'], integrations: ['email'] } }],
  aiHints: { focusAreas: ['Vendas', 'Operações comerciais'] },
  codeTemplates: { backend: backendTemplate, frontend: frontendTemplate, database: databaseTemplate },
  config: {
    features: [
      { id: 'contacts', name: 'Contatos' },
      { id: 'leads', name: 'Leads' },
      { id: 'pipeline', name: 'Pipeline' },
      { id: 'email-campaigns', name: 'Campanhas de Email' },
      { id: 'reports', name: 'Relatórios' }
    ],
    integrations: [{ id: 'email', name: 'Email' }, { id: 'slack', name: 'Slack' }, { id: 'webhook', name: 'Webhook' }],
    defaultSettings: { region: 'us' },
    dependencies: ['express', 'pg']
  }
};

export default template;