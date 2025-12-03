import { Template } from '../../generator/types';
import { questions } from './questions';

const backendTemplate = `
// Time Tracking Backend (Express)
import express from 'express';
const app = express();
app.use(express.json());

export const COMPANY = "{{companyName}}";
export const INDUSTRY = "{{industry}}";

// FEATURE:timesheets START
app.post('/timesheets', (_req, res) => res.json({ ok: true, id: Date.now() }));
app.get('/timesheets', (_req, res) => res.json({ entries: [] }));
// FEATURE:timesheets END

// FEATURE:projects START
app.post('/projects', (_req, res) => res.json({ ok: true, id: Date.now() }));
// FEATURE:projects END

// FEATURE:approvals START
app.post('/timesheets/:id/approve', (_req, res) => res.json({ ok: true }));
// FEATURE:approvals END

// FEATURE:reports START
app.get('/reports/hours', (_req, res) => res.json({ hours: 0 }));
// FEATURE:reports END

// INTEGRATION:email START
function sendTimesheetEmail(to: string, subject: string) { /* ... */ }
// INTEGRATION:email END

// INTEGRATION:slack START
function notifySlack(msg: string) { /* ... */ }
// INTEGRATION:slack END

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.listen(3000, () => console.log('Time tracking backend running on 3000'));
`;

const frontendTemplate = `import React from 'react';
export default function App() {
  return (
    <div>
      <h1>Time Tracking - {{companyName}}</h1>
      <p>Setor: {{industry}}</p>

      {/* FEATURE:timesheets START */}
      <section>
        <h2>Timesheets</h2>
        <button>Registrar horas</button>
      </section>
      {/* FEATURE:timesheets END */}

      {/* FEATURE:projects START */}
      <section>
        <h2>Projetos</h2>
        <button>Criar projeto</button>
      </section>
      {/* FEATURE:projects END */}

      {/* FEATURE:approvals START */}
      <section>
        <h2>Aprovações</h2>
        <button>Enviar para aprovação</button>
      </section>
      {/* FEATURE:approvals END */}

      {/* FEATURE:reports START */}
      <section>
        <h2>Relatórios</h2>
        <p>Horas totais: 0</p>
      </section>
      {/* FEATURE:reports END */}
    </div>
  );
}
`;

const databaseTemplate = `-- Time Tracking Schema
-- FEATURE:timesheets START
CREATE TABLE IF NOT EXISTS timesheets (
  id SERIAL PRIMARY KEY,
  user_id TEXT,
  project TEXT,
  hours NUMERIC(6,2),
  created_at TIMESTAMP DEFAULT NOW()
);
-- FEATURE:timesheets END

-- FEATURE:projects START
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
-- FEATURE:projects END
`;

const template: Template = {
  id: 'time-tracking',
  name: 'Time Tracking',
  tagline: 'Controle de horas por projeto e relatórios',
  description: `Registre timesheets, aprove horas e gere relatórios.`,
  category: 'Operations',
  icon: '⏱️',
  color: '#22C55E',
  screenshots: ['/screenshots/time-tracking.png'],
  basePrice: 9900,
  pricingTiers: [
    { name: 'Basic', price: 9900, maxUsers: 100, features: ['timesheets', 'projects'] },
    { name: 'Pro', price: 19900, maxUsers: 1000, features: ['timesheets', 'projects', 'approvals', 'reports'] },
    { name: 'Enterprise', price: 49900, maxUsers: Infinity, features: '*' }
  ],
  questions,
  features: {
    required: ['timesheets'],
    available: [
      { id: 'timesheets', name: 'Timesheets', included: true },
      { id: 'projects', name: 'Projetos' },
      { id: 'approvals', name: 'Aprovações' },
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
  validation: { checks: ['has_timesheets_table', 'has_projects_table'] },
  documentation: { readme: './README.md' },
  examples: [{ name: 'Consultoria', configuration: { industry: 'saas', users: 15, features: ['timesheets', 'projects', 'reports'], integrations: ['email'] } }],
  aiHints: { focusAreas: ['Operações', 'Produtividade'] },
  codeTemplates: { backend: backendTemplate, frontend: frontendTemplate, database: databaseTemplate },
  config: {
    features: [
      { id: 'timesheets', name: 'Timesheets' },
      { id: 'projects', name: 'Projetos' },
      { id: 'approvals', name: 'Aprovações' },
      { id: 'reports', name: 'Relatórios' },
      { id: 'notifications', name: 'Notificações' }
    ],
    integrations: [{ id: 'email', name: 'Email' }, { id: 'slack', name: 'Slack' }, { id: 'webhook', name: 'Webhook' }],
    defaultSettings: { region: 'us' },
    dependencies: ['express', 'pg']
  }
};

export default template;