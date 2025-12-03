import { Template } from '../../generator/types';
import { questions } from './questions';

const backendTemplate = `
// HR Performance Backend
import express from 'express';
const app = express();
app.use(express.json());

// FEATURE:reviews START
app.post('/performance/reviews', (_req, res) => res.json({ ok: true }));
// FEATURE:reviews END

// FEATURE:goals START
app.post('/performance/goals', (_req, res) => res.json({ ok: true }));
// FEATURE:goals END

// FEATURE:feedback START
app.post('/performance/feedback', (_req, res) => res.json({ ok: true }));
// FEATURE:feedback END

// FEATURE:calibration START
app.post('/performance/calibration', (_req, res) => res.json({ ok: true }));
// FEATURE:calibration END

// FEATURE:reports START
app.get('/performance/reports', (_req, res) => res.json({ score: 0 }));
// FEATURE:reports END

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.listen(3000, () => console.log('HR Performance backend running on 3000'));
`;

const frontendTemplate = `import React from 'react';
export default function App() {
  return (
    <div>
      <h1>HR Performance - {{companyName}}</h1>
      <section><h2>Avaliações</h2><button>Novo ciclo</button></section>
      <section><h2>Metas</h2><button>Nova meta</button></section>
      <section><h2>Feedback</h2><button>Enviar feedback</button></section>
      <section><h2>Calibração</h2><button>Iniciar</button></section>
      <section><h2>Relatórios</h2><p>Score médio</p></section>
    </div>
  );
}
`;

const databaseTemplate = `-- HR Performance Schema
CREATE TABLE IF NOT EXISTS reviews ( id SERIAL PRIMARY KEY, employee TEXT, period TEXT, status TEXT, created_at TIMESTAMP DEFAULT NOW() );
CREATE TABLE IF NOT EXISTS goals ( id SERIAL PRIMARY KEY, employee TEXT, title TEXT, status TEXT, created_at TIMESTAMP DEFAULT NOW() );
CREATE TABLE IF NOT EXISTS feedback ( id SERIAL PRIMARY KEY, employee TEXT, note TEXT, created_at TIMESTAMP DEFAULT NOW() );
`;

const template: Template = {
  id: 'hr-performance',
  name: 'HR Performance',
  tagline: 'Ciclos de avaliação, metas e feedback',
  description: `Gerencie performance com avaliações, metas, feedback e relatórios.`,
  category: 'HR',
  icon: '📈',
  color: '#0EA5E9',
  screenshots: ['/screenshots/hr-performance.png'],
  basePrice: 9900,
  pricingTiers: [
    { name: 'Basic', price: 9900, maxUsers: 100, features: ['reviews','goals'] },
    { name: 'Pro', price: 19900, maxUsers: 1000, features: ['reviews','goals','feedback','calibration','reports'] },
    { name: 'Enterprise', price: 49900, maxUsers: Infinity, features: '*' }
  ],
  questions,
  features: {
    required: ['reviews'],
    available: [
      { id: 'reviews', name: 'Avaliações', included: true },
      { id: 'goals', name: 'Metas' },
      { id: 'feedback', name: 'Feedback' },
      { id: 'calibration', name: 'Calibração' },
      { id: 'reports', name: 'Relatórios' },
      { id: 'notifications', name: 'Notificações' }
    ]
  },
  integrations: { available: [{ id: 'email', name: 'Email' }, { id: 'slack', name: 'Slack' }] },
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
  validation: { checks: ['has_reviews_table'] },
  documentation: { readme: './README.md' },
  examples: [{ name: 'Startup', configuration: { industry:'saas', users: 30, features:['reviews','goals','feedback'], integrations:['email'] } }],
  aiHints: { focusAreas: ['RH','Performance'] },
  codeTemplates: { backend: backendTemplate, frontend: frontendTemplate, database: databaseTemplate },
  config: {
    features: [
      { id: 'reviews', name: 'Avaliações' },
      { id: 'goals', name: 'Metas' },
      { id: 'feedback', name: 'Feedback' },
      { id: 'calibration', name: 'Calibração' },
      { id: 'reports', name: 'Relatórios' },
      { id: 'notifications', name: 'Notificações' }
    ],
    integrations: [{ id: 'email', name: 'Email' }, { id: 'slack', name: 'Slack' }],
    defaultSettings: { region: 'us' },
    dependencies: ['express','pg']
  }
};

export default template;