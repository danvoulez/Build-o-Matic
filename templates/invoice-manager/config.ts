import { Template } from '../../generator/types';
import { questions } from './questions';

const backendTemplate = `
// Invoice Manager Backend (Express)
import express from 'express';
const app = express();
app.use(express.json());

export const COMPANY = "{{companyName}}";
export const INDUSTRY = "{{industry}}";

// FEATURE:invoicing START
app.post('/invoices', (req, res) => {
  res.json({ ok: true, invoiceId: Date.now() });
});
app.get('/invoices', (req, res) => {
  res.json({ invoices: [] });
});
// FEATURE:invoicing END

// FEATURE:payments START
app.post('/payments', (req, res) => {
  res.json({ ok: true, paymentId: Date.now() });
});
app.get('/payments', (req, res) => {
  res.json({ payments: [] });
});
// FEATURE:payments END

// FEATURE:reports START
app.get('/reports/revenue', (req, res) => {
  res.json({ revenue: 0 });
});
// FEATURE:reports END

// INTEGRATION:email START
function sendInvoiceEmail(email: string) { /* ... */ }
// INTEGRATION:email END

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.listen(3000, () => console.log('Invoice manager backend running on 3000'));
`;

const frontendTemplate = `import React from 'react';
export default function App() {
  return (
    <div>
      <h1>Invoice Manager - {{companyName}}</h1>
      <p>Setor: {{industry}}</p>

      {/* FEATURE:invoicing START */}
      <section>
        <h2>Faturas</h2>
        <button>Criar Fatura</button>
      </section>
      {/* FEATURE:invoicing END */}

      {/* FEATURE:payments START */}
      <section>
        <h2>Pagamentos</h2>
        <button>Registrar Pagamento</button>
      </section>
      {/* FEATURE:payments END */}

      {/* FEATURE:reports START */}
      <section>
        <h2>Relatórios</h2>
        <p>Receita mensal: 0</p>
      </section>
      {/* FEATURE:reports END */}
    </div>
  );
}
`;

const databaseTemplate = `-- Invoice Manager Schema
-- FEATURE:invoicing START
CREATE TABLE IF NOT EXISTS invoices (
  id SERIAL PRIMARY KEY,
  customer_id VARCHAR(64),
  amount NUMERIC(12,2),
  status VARCHAR(32),
  created_at TIMESTAMP DEFAULT NOW()
);
-- FEATURE:invoicing END

-- FEATURE:payments START
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  invoice_id INT REFERENCES invoices(id),
  amount NUMERIC(12,2),
  created_at TIMESTAMP DEFAULT NOW()
);
-- FEATURE:payments END
`;

const template: Template = {
  id: 'invoice-manager',
  name: 'Invoice Manager',
  tagline: 'Faturamento e pagamentos simplificados',
  description: `
    Gerencie faturas, pagamentos e relatórios com facilidade.
    Integre notificações por email e garanta organização financeira.
  `,
  category: 'Finance',
  icon: '💸',
  color: '#F59E0B',
  screenshots: ['/screenshots/invoice-dashboard.png'],
  basePrice: 9900,
  pricingTiers: [
    { name: 'Basic', price: 9900, maxUsers: 100, features: ['invoicing'] },
    { name: 'Pro', price: 19900, maxUsers: 1000, features: ['invoicing', 'payments', 'reports'] },
    { name: 'Enterprise', price: 49900, maxUsers: Infinity, features: '*' }
  ],
  questions,
  features: {
    required: ['invoicing'],
    available: [
      { id: 'invoicing', name: 'Faturamento', description: 'Criação e gestão de faturas', included: true },
      { id: 'payments', name: 'Pagamentos', description: 'Registro e conciliação de pagamentos' },
      { id: 'reports', name: 'Relatórios', description: 'Indicadores financeiros' },
      { id: 'notifications', name: 'Notificações', description: 'Alertas via email' }
    ]
  },
  integrations: {
    available: [
      { id: 'email', name: 'Email', description: 'Envio de faturas por email', recommended: true, config: { required: ['smtp_host', 'smtp_user', 'smtp_pass'] } }
    ]
  },
  technologies: {
    backend: { language: 'TypeScript', framework: 'Express' },
    frontend: { language: 'TypeScript', framework: 'React' },
    database: { type: 'PostgreSQL', version: '15+' }
  },
  environmentVariables: {
    required: ['DATABASE_URL', 'JWT_SECRET', 'NODE_ENV'],
    optional: ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS']
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
    notes: 'Pagamentos e relatórios podem ser expandidos com integrações de gateways.'
  },
  codePaths: { backend: './backend/', frontend: './frontend/', database: './database/', config: './config/' },
  validation: { checks: ['has_invoices_table', 'has_payments_table', 'has_invoicing_routes'] },
  documentation: { readme: './README.md' },
  examples: [
    { name: 'Loja online', configuration: { industry: 'ecommerce', users: 10, features: ['invoicing', 'payments'], integrations: ['email'] } }
  ],
  aiHints: { focusAreas: ['Financeiro', 'Faturamento'] },
  codeTemplates: { backend: backendTemplate, frontend: frontendTemplate, database: databaseTemplate },
  config: {
    features: [
      { id: 'invoicing', name: 'Faturamento' },
      { id: 'payments', name: 'Pagamentos' },
      { id: 'reports', name: 'Relatórios' },
      { id: 'notifications', name: 'Notificações' }
    ],
    integrations: [
      { id: 'email', name: 'Email' }
    ],
    defaultSettings: { currency: 'BRL' },
    dependencies: ['express', 'pg']
  }
};

export default template;