import { Template } from '../../generator/types';
import { questions } from './questions';

const backendTemplate = `
// Project Planner Backend (Express)
import express from 'express';
const app = express();
app.use(express.json());

// FEATURE:projects START
app.post('/projects', (_req, res) => res.json({ ok: true, id: Date.now() }));
app.get('/projects', (_req, res) => res.json({ projects: [] }));
// FEATURE:projects END

// FEATURE:tasks START
app.post('/tasks', (_req, res) => res.json({ ok: true, id: Date.now() }));
// FEATURE:tasks END

// FEATURE:kanban START
app.get('/kanban', (_req, res) => res.json({ columns: [] }));
// FEATURE:kanban END

// FEATURE:calendar START
app.get('/calendar/events', (_req, res) => res.json({ events: [] }));
// FEATURE:calendar END

// FEATURE:reports START
app.get('/reports/project', (_req, res) => res.json({ progress: 0 }));
// FEATURE:reports END

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.listen(3000, () => console.log('Project planner backend running on 3000'));
`;

const frontendTemplate = `import React from 'react';
export default function App() {
  return (
    <div>
      <h1>Project Planner - {{companyName}}</h1>
      {/* FEATURE:projects START */}
      <section><h2>Projetos</h2><button>Novo projeto</button></section>
      {/* FEATURE:projects END */}
      {/* FEATURE:tasks START */}
      <section><h2>Tarefas</h2><button>Criar tarefa</button></section>
      {/* FEATURE:tasks END */}
      {/* FEATURE:kanban START */}
      <section><h2>Kanban</h2><p>Quadro</p></section>
      {/* FEATURE:kanban END */}
      {/* FEATURE:calendar START */}
      <section><h2>Calendário</h2><p>Eventos</p></section>
      {/* FEATURE:calendar END */}
      {/* FEATURE:reports START */}
      <section><h2>Relatórios</h2><p>Progresso</p></section>
      {/* FEATURE:reports END */}
    </div>
  );
}
`;

const databaseTemplate = `-- Project Planner Schema
-- FEATURE:projects START
CREATE TABLE IF NOT EXISTS projects ( id SERIAL PRIMARY KEY, name TEXT NOT NULL, created_at TIMESTAMP DEFAULT NOW() );
-- FEATURE:projects END
-- FEATURE:tasks START
CREATE TABLE IF NOT EXISTS tasks ( id SERIAL PRIMARY KEY, project_id INT REFERENCES projects(id), title TEXT, status TEXT, created_at TIMESTAMP DEFAULT NOW() );
-- FEATURE:tasks END
`;

const template: Template = {
  id: 'project-planner',
  name: 'Project Planner',
  tagline: 'Planejamento de projetos com tarefas e kanban',
  description: `Organize projetos, tarefas e calendário com relatórios.`,
  category: 'Management',
  icon: '📅',
  color: '#3B82F6',
  screenshots: ['/screenshots/project-planner.png'],
  basePrice: 9900,
  pricingTiers: [
    { name: 'Basic', price: 9900, maxUsers: 100, features: ['projects', 'tasks'] },
    { name: 'Pro', price: 19900, maxUsers: 1000, features: ['projects', 'tasks', 'kanban', 'calendar', 'reports'] },
    { name: 'Enterprise', price: 49900, maxUsers: Infinity, features: '*' }
  ],
  questions,
  features: {
    required: ['projects'],
    available: [
      { id: 'projects', name: 'Projetos', included: true },
      { id: 'tasks', name: 'Tarefas' },
      { id: 'kanban', name: 'Kanban' },
      { id: 'calendar', name: 'Calendário' },
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
  validation: { checks: ['has_projects_table', 'has_tasks_table'] },
  documentation: { readme: './README.md' },
  examples: [{ name: 'Agência Digital', configuration: { industry: 'saas', users: 18, features: ['projects', 'tasks', 'kanban'], integrations: ['email'] } }],
  aiHints: { focusAreas: ['Gestão', 'Planejamento'] },
  codeTemplates: { backend: backendTemplate, frontend: frontendTemplate, database: databaseTemplate },
  config: {
    features: [
      { id: 'projects', name: 'Projetos' },
      { id: 'tasks', name: 'Tarefas' },
      { id: 'kanban', name: 'Kanban' },
      { id: 'calendar', name: 'Calendário' },
      { id: 'reports', name: 'Relatórios' },
      { id: 'notifications', name: 'Notificações' }
    ],
    integrations: [{ id: 'email', name: 'Email' }, { id: 'slack', name: 'Slack' }, { id: 'webhook', name: 'Webhook' }],
    defaultSettings: { region: 'us' },
    dependencies: ['express', 'pg']
  }
};

export default template;