import { Template } from '../../generator/types';
import { questions } from './questions';

const backendTemplate = `
// HR Onboarding Backend (Express)
import express from 'express';
const app = express();
app.use(express.json());

export const COMPANY = "{{companyName}}";
export const INDUSTRY = "{{industry}}";

// FEATURE:checklist START
app.get('/onboarding/checklist', (req, res) => {
  res.json({ checklist: ['Documentos', 'Contas', 'Equipamentos'] });
});
// FEATURE:checklist END

// FEATURE:documents START
app.post('/documents/upload', (req, res) => {
  res.json({ ok: true, message: 'Documento armazenado' });
});
// FEATURE:documents END

// FEATURE:tasks START
app.post('/tasks', (req, res) => {
  res.json({ ok: true, taskId: Date.now() });
});
app.get('/tasks', (req, res) => {
  res.json({ tasks: [] });
});
// FEATURE:tasks END

// INTEGRATION:email START
function sendWelcomeEmail(email: string) { /* ... */ }
// INTEGRATION:email END

// INTEGRATION:slack START
function notifySlack(message: string) { /* ... */ }
// INTEGRATION:slack END

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.listen(3000, () => console.log('HR onboarding backend running on 3000'));
`;

const frontendTemplate = `import React from 'react';
export default function App() {
  return (
    <div>
      <h1>HR Onboarding - {{companyName}}</h1>
      <p>Setor: {{industry}}</p>

      {/* FEATURE:checklist START */}
      <section>
        <h2>Checklist de Onboarding</h2>
        <ul>
          <li>Documentos</li>
          <li>Contas</li>
          <li>Equipamentos</li>
        </ul>
      </section>
      {/* FEATURE:checklist END */}

      {/* FEATURE:documents START */}
      <section>
        <h2>Documentos</h2>
        <button>Enviar Documento</button>
      </section>
      {/* FEATURE:documents END */}

      {/* FEATURE:tasks START */}
      <section>
        <h2>Tarefas</h2>
        <button>Criar Tarefa</button>
      </section>
      {/* FEATURE:tasks END */}
    </div>
  );
}
`;

const databaseTemplate = `-- HR Onboarding Schema
-- FEATURE:documents START
CREATE TABLE IF NOT EXISTS documents (
  id SERIAL PRIMARY KEY,
  employee_id VARCHAR(64),
  name TEXT,
  stored_at TIMESTAMP DEFAULT NOW()
);
-- FEATURE:documents END

-- FEATURE:tasks START
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  assignee VARCHAR(128),
  status VARCHAR(32) DEFAULT 'open',
  created_at TIMESTAMP DEFAULT NOW()
);
-- FEATURE:tasks END
`;

const template: Template = {
  id: 'hr-onboarding',
  name: 'HR Onboarding',
  tagline: 'Padronize e agilize a integração de novos colaboradores',
  description: `
    Automatize onboarding com checklists, documentos e tarefas.
    Integre email/slack para notificações e mantenha tudo organizado.
  `,
  category: 'HR',
  icon: '👋',
  color: '#10B981',
  screenshots: ['/screenshots/hr-dashboard.png'],
  basePrice: 9900,
  pricingTiers: [
    { name: 'Basic', price: 9900, maxUsers: 100, features: ['checklist', 'documents'] },
    { name: 'Pro', price: 19900, maxUsers: 1000, features: ['checklist', 'documents', 'tasks', 'notifications'] },
    { name: 'Enterprise', price: 49900, maxUsers: Infinity, features: '*' }
  ],
  questions,
  features: {
    required: ['checklist'],
    available: [
      { id: 'checklist', name: 'Checklist', description: 'Etapas essenciais de onboarding', included: true },
      { id: 'documents', name: 'Documentos', description: 'Coleta e armazenamento de documentos' },
      { id: 'tasks', name: 'Tarefas', description: 'Gestão de tarefas de onboarding' },
      { id: 'notifications', name: 'Notificações', description: 'Alertas de progresso e pendências' }
    ]
  },
  integrations: {
    available: [
      { id: 'email', name: 'Email', description: 'Envio de emails de boas-vindas', recommended: true, config: { required: ['smtp_host', 'smtp_user', 'smtp_pass'] } },
      { id: 'slack', name: 'Slack', description: 'Notificações no Slack', recommended: false, config: { required: ['slack_webhook_url'] } }
    ]
  },
  technologies: {
    backend: { language: 'TypeScript', framework: 'Express' },
    frontend: { language: 'TypeScript', framework: 'React' },
    database: { type: 'PostgreSQL', version: '15+' }
  },
  environmentVariables: {
    required: ['DATABASE_URL', 'JWT_SECRET', 'NODE_ENV'],
    optional: ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'SLACK_WEBHOOK_URL']
  },
  dependencies: {
    backend: ['express', 'pg', 'jsonwebtoken', 'bcrypt', 'zod', 'dotenv'],
    frontend: ['react', 'react-dom', 'react-router-dom', '@tanstack/react-query', 'axios']
  },
  customization: {
    branding: { enabled: true, fields: ['company_name', 'logo_url', 'primary_color'] },
    features: { enabled: true, toggleable: true },
    integrations: { enabled: true, configurable: true },
    workflows: { enabled: false }
  },
  generation: {
    steps: ['load_base_ledger', 'customize_schema', 'generate_backend', 'generate_frontend', 'configure_database', 'package_deployment'],
    estimatedTime: 7000,
    notes: 'Checklists e tarefas devem ser configuráveis por equipe.'
  },
  codePaths: { backend: './backend/', frontend: './frontend/', database: './database/', config: './config/' },
  validation: { checks: ['has_documents_table', 'has_tasks_table', 'has_checklist_route'] },
  documentation: { readme: './README.md' },
  examples: [
    { name: 'Startup SaaS', configuration: { industry: 'saas', users: 20, features: ['checklist', 'documents', 'tasks'], integrations: ['email'] } }
  ],
  aiHints: { focusAreas: ['Processos de RH', 'Automação de tarefas'] },
  codeTemplates: { backend: backendTemplate, frontend: frontendTemplate, database: databaseTemplate },
  config: {
    features: [
      { id: 'checklist', name: 'Checklist' },
      { id: 'documents', name: 'Documentos' },
      { id: 'tasks', name: 'Tarefas' },
      { id: 'notifications', name: 'Notificações' }
    ],
    integrations: [
      { id: 'email', name: 'Email' },
      { id: 'slack', name: 'Slack' }
    ],
    defaultSettings: { region: 'us' },
    dependencies: ['express']
  }
};

export default template;