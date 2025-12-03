import { Template } from '../../generator/types';
import { questions } from './questions';

const backendTemplate = `
// Inventory Manager Backend (Express)
import express from 'express';
const app = express();
app.use(express.json());

// FEATURE:items START
app.get('/items', (_req, res) => res.json({ items: [] }));
app.post('/items', (_req, res) => res.json({ ok: true, id: Date.now() }));
// FEATURE:items END

// FEATURE:stock-levels START
app.get('/stock', (_req, res) => res.json({ stock: [] }));
// FEATURE:stock-levels END

// FEATURE:warehouses START
app.get('/warehouses', (_req, res) => res.json({ warehouses: [] }));
// FEATURE:warehouses END

// FEATURE:purchase-orders START
app.post('/po', (_req, res) => res.json({ ok: true, poId: Date.now() }));
// FEATURE:purchase-orders END

// FEATURE:reports START
app.get('/reports/inventory', (_req, res) => res.json({ turnover: 0 }));
// FEATURE:reports END

// FEATURE:audit-log START
app.use((req, _res, next) => { console.log('[AUDIT]', req.method, req.url); next(); });
// FEATURE:audit-log END

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.listen(3000, () => console.log('Inventory manager backend running on 3000'));
`;

const frontendTemplate = `import React from 'react';
export default function App() {
  return (
    <div>
      <h1>Inventory Manager - {{companyName}}</h1>
      {/* FEATURE:items START */}
      <section><h2>Itens</h2><button>Novo item</button></section>
      {/* FEATURE:items END */}
      {/* FEATURE:stock-levels START */}
      <section><h2>Níveis de estoque</h2><p>Resumo</p></section>
      {/* FEATURE:stock-levels END */}
      {/* FEATURE:warehouses START */}
      <section><h2>Armazéns</h2><button>Novo armazém</button></section>
      {/* FEATURE:warehouses END */}
      {/* FEATURE:purchase-orders START */}
      <section><h2>Ordens de compra</h2><button>Criar PO</button></section>
      {/* FEATURE:purchase-orders END */}
      {/* FEATURE:reports START */}
      <section><h2>Relatórios</h2><p>Giro de estoque</p></section>
      {/* FEATURE:reports END */}
    </div>
  );
}
`;

const databaseTemplate = `-- Inventory Manager Schema
-- FEATURE:items START
CREATE TABLE IF NOT EXISTS items ( id SERIAL PRIMARY KEY, sku TEXT, name TEXT, created_at TIMESTAMP DEFAULT NOW() );
-- FEATURE:items END
-- FEATURE:stock-levels START
CREATE TABLE IF NOT EXISTS stock_levels ( id SERIAL PRIMARY KEY, item_id INT REFERENCES items(id), qty INT DEFAULT 0 );
-- FEATURE:stock-levels END
-- FEATURE:warehouses START
CREATE TABLE IF NOT EXISTS warehouses ( id SERIAL PRIMARY KEY, name TEXT, location TEXT );
-- FEATURE:warehouses END
-- FEATURE:purchase-orders START
CREATE TABLE IF NOT EXISTS purchase_orders ( id SERIAL PRIMARY KEY, supplier TEXT, status TEXT, created_at TIMESTAMP DEFAULT NOW() );
-- FEATURE:purchase-orders END
`;

const template: Template = {
  id: 'inventory-manager',
  name: 'Inventory Manager',
  tagline: 'Controle total de estoque e armazéns',
  description: `Gerencie itens, estoque, armazéns e ordens de compra com relatórios.`,
  category: 'Operations',
  icon: '📦',
  color: '#8B5CF6',
  screenshots: ['/screenshots/inventory.png'],
  basePrice: 9900,
  pricingTiers: [
    { name: 'Basic', price: 9900, maxUsers: 100, features: ['items', 'stock-levels'] },
    { name: 'Pro', price: 19900, maxUsers: 1000, features: ['items', 'stock-levels', 'warehouses', 'purchase-orders', 'reports'] },
    { name: 'Enterprise', price: 49900, maxUsers: Infinity, features: '*' }
  ],
  questions,
  features: {
    required: ['items'],
    available: [
      { id: 'items', name: 'Itens', included: true },
      { id: 'stock-levels', name: 'Níveis de estoque' },
      { id: 'warehouses', name: 'Armazéns' },
      { id: 'purchase-orders', name: 'Ordens de compra' },
      { id: 'reports', name: 'Relatórios' },
      { id: 'audit-log', name: 'Auditoria', pricingImpact: 1000 }
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
  validation: { checks: ['has_items_table', 'has_stock_levels'] },
  documentation: { readme: './README.md' },
  examples: [{ name: 'Loja online', configuration: { industry: 'ecommerce', users: 12, features: ['items', 'stock-levels', 'reports'], integrations: ['email'] } }],
  aiHints: { focusAreas: ['Operações', 'Logística'] },
  codeTemplates: { backend: backendTemplate, frontend: frontendTemplate, database: databaseTemplate },
  config: {
    features: [
      { id: 'items', name: 'Itens' },
      { id: 'stock-levels', name: 'Níveis de estoque' },
      { id: 'warehouses', name: 'Armazéns' },
      { id: 'purchase-orders', name: 'Ordens de compra' },
      { id: 'reports', name: 'Relatórios' },
      { id: 'audit-log', name: 'Auditoria' }
    ],
    integrations: [{ id: 'email', name: 'Email' }, { id: 'slack', name: 'Slack' }, { id: 'webhook', name: 'Webhook' }],
    defaultSettings: { region: 'us' },
    dependencies: ['express', 'pg']
  }
};

export default template;