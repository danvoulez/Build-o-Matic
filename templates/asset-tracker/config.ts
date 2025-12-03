import { Template } from '../../generator/types';
import { questions } from './questions';

const backendTemplate = `
// Asset Tracker Backend (Express)
import express from 'express';
const app = express();
app.use(express.json());

export const COMPANY = "{{companyName}}";
export const INDUSTRY = "{{industry}}";

// FEATURE:asset-register START
app.get('/assets', (_req, res) => res.json({ assets: [] }));
app.post('/assets', (_req, res) => res.json({ ok: true, id: Date.now() }));
// FEATURE:asset-register END

// FEATURE:assignments START
app.post('/assets/:id/assign', (_req, res) => res.json({ ok: true }));
// FEATURE:assignments END

// FEATURE:maintenance START
app.post('/assets/:id/maintenance', (_req, res) => res.json({ ok: true }));
// FEATURE:maintenance END

// FEATURE:qr-labels START
app.get('/assets/:id/qr', (_req, res) => res.json({ qr: 'data:image/png;base64,...' }));
// FEATURE:qr-labels END

// FEATURE:audit-log START
app.use((req, _res, next) => { console.log('[AUDIT]', req.method, req.url); next(); });
// FEATURE:audit-log END

// INTEGRATION:email START
function sendAssetEmail(to: string, subject: string) { /* ... */ }
// INTEGRATION:email END

// INTEGRATION:slack START
function notifySlack(msg: string) { /* ... */ }
// INTEGRATION:slack END

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.listen(3000, () => console.log('Asset tracker backend running on 3000'));
`;

const frontendTemplate = `import React from 'react';
export default function App() {
  return (
    <div>
      <h1>Asset Tracker - {{companyName}}</h1>
      <p>Setor: {{industry}}</p>

      {/* FEATURE:asset-register START */}
      <section>
        <h2>Registro de Ativos</h2>
        <button>Adicionar Ativo</button>
      </section>
      {/* FEATURE:asset-register END */}

      {/* FEATURE:assignments START */}
      <section>
        <h2>Atribuições</h2>
        <button>Atribuir Ativo</button>
      </section>
      {/* FEATURE:assignments END */}

      {/* FEATURE:maintenance START */}
      <section>
        <h2>Manutenção</h2>
        <button>Registrar Manutenção</button>
      </section>
      {/* FEATURE:maintenance END */}

      {/* FEATURE:qr-labels START */}
      <section>
        <h2>Etiquetas QR</h2>
        <button>Gerar QR</button>
      </section>
      {/* FEATURE:qr-labels END */}

      {/* FEATURE:audit-log START */}
      <section>
        <h2>Auditoria</h2>
        <p>Log de ações do sistema</p>
      </section>
      {/* FEATURE:audit-log END */}
    </div>
  );
}
`;

const databaseTemplate = `-- Asset Tracker Schema
-- FEATURE:asset-register START
CREATE TABLE IF NOT EXISTS assets (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  serial TEXT,
  status VARCHAR(32) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);
-- FEATURE:asset-register END

-- FEATURE:assignments START
CREATE TABLE IF NOT EXISTS asset_assignments (
  id SERIAL PRIMARY KEY,
  asset_id INT REFERENCES assets(id),
  assignee TEXT,
  assigned_at TIMESTAMP DEFAULT NOW()
);
-- FEATURE:assignments END

-- FEATURE:maintenance START
CREATE TABLE IF NOT EXISTS asset_maintenance (
  id SERIAL PRIMARY KEY,
  asset_id INT REFERENCES assets(id),
  note TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
-- FEATURE:maintenance END

-- FEATURE:audit-log START
CREATE TABLE IF NOT EXISTS asset_audit (
  id SERIAL PRIMARY KEY,
  action TEXT,
  actor TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
-- FEATURE:audit-log END
`;

const template: Template = {
  id: 'asset-tracker',
  name: 'Asset Tracker',
  tagline: 'Controle total dos seus ativos',
  description: `
    Registre, atribua e mantenha ativos com etiquetas QR e auditoria.
  `,
  category: 'Operations',
  icon: '📦',
  color: '#6366F1',
  screenshots: ['/screenshots/asset-tracker.png'],
  basePrice: 9900,
  pricingTiers: [
    { name: 'Basic', price: 9900, maxUsers: 100, features: ['asset-register', 'assignments'] },
    { name: 'Pro', price: 19900, maxUsers: 1000, features: ['asset-register', 'assignments', 'maintenance', 'qr-labels'] },
    { name: 'Enterprise', price: 49900, maxUsers: Infinity, features: '*' }
  ],
  questions,
  features: {
    required: ['asset-register'],
    available: [
      { id: 'asset-register', name: 'Registro de Ativos', included: true },
      { id: 'assignments', name: 'Atribuições' },
      { id: 'maintenance', name: 'Manutenção' },
      { id: 'qr-labels', name: 'Etiquetas QR' },
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
  customization: {
    branding: { enabled: true, fields: ['company_name', 'logo_url', 'primary_color'] },
    features: { enabled: true, toggleable: true },
    integrations: { enabled: true, configurable: true },
    workflows: { enabled: false }
  },
  generation: {
    steps: ['load_base_ledger', 'customize_schema', 'generate_backend', 'generate_frontend', 'configure_database', 'package_deployment'],
    estimatedTime: 7000
  },
  codePaths: { backend: './backend/', frontend: './frontend/', database: './database/', config: './config/' },
  validation: { checks: ['has_assets_table', 'has_assignments', 'has_qr_labels'] },
  documentation: { readme: './README.md' },
  examples: [{ name: 'Fábrica', configuration: { industry: 'saas', users: 50, features: ['asset-register', 'maintenance'], integrations: ['email'] } }],
  aiHints: { focusAreas: ['Operações', 'Controle de ativos'] },
  codeTemplates: { backend: backendTemplate, frontend: frontendTemplate, database: databaseTemplate },
  config: {
    features: [
      { id: 'asset-register', name: 'Registro de Ativos' },
      { id: 'assignments', name: 'Atribuições' },
      { id: 'maintenance', name: 'Manutenção' },
      { id: 'qr-labels', name: 'Etiquetas QR' },
      { id: 'audit-log', name: 'Auditoria' }
    ],
    integrations: [{ id: 'email', name: 'Email' }, { id: 'slack', name: 'Slack' }, { id: 'webhook', name: 'Webhook' }],
    defaultSettings: { region: 'us' },
    dependencies: ['express', 'pg']
  }
};

export default template;