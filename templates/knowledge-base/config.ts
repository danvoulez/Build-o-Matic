import { Template } from '../../generator/types';
import { questions } from './questions';

const backendTemplate = `
// Knowledge Base Backend (Express)
import express from 'express';
const app = express();
app.use(express.json());

// FEATURE:articles START
app.get('/kb/articles', (_req, res) => res.json({ articles: [] }));
app.post('/kb/articles', (_req, res) => res.json({ ok: true, id: Date.now() }));
// FEATURE:articles END

// FEATURE:categories START
app.get('/kb/categories', (_req, res) => res.json({ categories: [] }));
// FEATURE:categories END

// FEATURE:search START
app.get('/kb/search', (_req, res) => res.json({ results: [] }));
// FEATURE:search END

// FEATURE:feedback START
app.post('/kb/articles/:id/feedback', (_req, res) => res.json({ ok: true }));
// FEATURE:feedback END

// FEATURE:reports START
app.get('/kb/reports', (_req, res) => res.json({ views: 0 }));
// FEATURE:reports END

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.listen(3000, () => console.log('Knowledge base backend running on 3000'));
`;

const frontendTemplate = `import React from 'react';
export default function App() {
  return (
    <div>
      <h1>Knowledge Base - {{companyName}}</h1>
      {/* FEATURE:articles START */}
      <section><h2>Artigos</h2><button>Novo artigo</button></section>
      {/* FEATURE:articles END */}
      {/* FEATURE:categories START */}
      <section><h2>Categorias</h2><p>Organização</p></section>
      {/* FEATURE:categories END */}
      {/* FEATURE:search START */}
      <section><h2>Busca</h2><input placeholder="Buscar..." /></section>
      {/* FEATURE:search END */}
      {/* FEATURE:feedback START */}
      <section><h2>Feedback</h2><p>Avaliações de artigos</p></section>
      {/* FEATURE:feedback END */}
      {/* FEATURE:reports START */}
      <section><h2>Relatórios</h2><p>Visualizações</p></section>
      {/* FEATURE:reports END */}
    </div>
  );
}
`;

const databaseTemplate = `-- Knowledge Base Schema
-- FEATURE:articles START
CREATE TABLE IF NOT EXISTS kb_articles ( id SERIAL PRIMARY KEY, title TEXT, content TEXT, views INT DEFAULT 0, created_at TIMESTAMP DEFAULT NOW() );
-- FEATURE:articles END
-- FEATURE:categories START
CREATE TABLE IF NOT EXISTS kb_categories ( id SERIAL PRIMARY KEY, name TEXT );
-- FEATURE:categories END
-- FEATURE:feedback START
CREATE TABLE IF NOT EXISTS kb_feedback ( id SERIAL PRIMARY KEY, article_id INT REFERENCES kb_articles(id), rating INT, note TEXT, created_at TIMESTAMP DEFAULT NOW() );
-- FEATURE:feedback END
`;

const template: Template = {
  id: 'knowledge-base',
  name: 'Knowledge Base',
  tagline: 'Central de artigos com busca e feedback',
  description: `Organize conhecimento com artigos, categorias, busca e relatórios.`,
  category: 'Support',
  icon: '📚',
  color: '#0EA5E9',
  screenshots: ['/screenshots/knowledge-base.png'],
  basePrice: 9900,
  pricingTiers: [
    { name: 'Basic', price: 9900, maxUsers: 100, features: ['articles', 'categories'] },
    { name: 'Pro', price: 19900, maxUsers: 1000, features: ['articles', 'categories', 'search', 'feedback', 'reports'] },
    { name: 'Enterprise', price: 49900, maxUsers: Infinity, features: '*' }
  ],
  questions,
  features: {
    required: ['articles'],
    available: [
      { id: 'articles', name: 'Artigos', included: true },
      { id: 'categories', name: 'Categorias' },
      { id: 'search', name: 'Busca' },
      { id: 'feedback', name: 'Feedback' },
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
  validation: { checks: ['has_kb_articles', 'has_search'] },
  documentation: { readme: './README.md' },
  examples: [{ name: 'SaaS suporte', configuration: { industry: 'saas', users: 20, features: ['articles', 'search', 'feedback'], integrations: ['email'] } }],
  aiHints: { focusAreas: ['Suporte', 'Conhecimento'] },
  codeTemplates: { backend: backendTemplate, frontend: frontendTemplate, database: databaseTemplate },
  config: {
    features: [
      { id: 'articles', name: 'Artigos' },
      { id: 'categories', name: 'Categorias' },
      { id: 'search', name: 'Busca' },
      { id: 'feedback', name: 'Feedback' },
      { id: 'reports', name: 'Relatórios' }
    ],
    integrations: [{ id: 'email', name: 'Email' }, { id: 'slack', name: 'Slack' }, { id: 'webhook', name: 'Webhook' }],
    defaultSettings: { region: 'us' },
    dependencies: ['express', 'pg']
  }
};

export default template;