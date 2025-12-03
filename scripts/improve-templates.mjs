#!/usr/bin/env node

/**
 * 🔧 SCRIPT DE MELHORIA DOS TEMPLATES
 * 
 * Melhora a qualidade dos templates após integração UBL:
 * 1. Frontend: Integra com ledger client, hooks, chamadas reais
 * 2. Intents: Define intents específicos para cada template
 * 3. Agreements: Define agreements específicos para cada template
 * 4. Remove referências obsoletas
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🎨 Melhorando qualidade dos templates...\n');

// ============================================================================
// TEMPLATES ESPECÍFICOS POR DOMÍNIO
// ============================================================================

const templateImprovements = {
  'invoice-manager': {
    frontend: `import React, { useState, useEffect } from 'react';
import { ledger } from './ledger-client';
import ReactMarkdown from 'react-markdown';

export default function App() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatResponse, setChatResponse] = useState(null);

  // Load invoices via UBL query
  useEffect(() => {
    loadInvoices();
  }, []);

  async function loadInvoices() {
    try {
      const result = await ledger.query({
        type: 'agreements',
        filters: { agreementType: 'Invoice' }
      });
      setInvoices(result.data || []);
    } catch (error) {
      console.error('Error loading invoices:', error);
    }
  }

  async function handleCreateInvoice() {
    setLoading(true);
    try {
      await ledger.intend('propose:agreement', {
        agreementType: 'Invoice',
        payload: {
          type: 'Invoice',
          amount: 0,
          status: 'draft'
        }
      });
      await loadInvoices();
    } catch (error) {
      console.error('Error creating invoice:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleChat() {
    if (!chatMessage.trim()) return;
    setLoading(true);
    try {
      const response = await ledger.chat(chatMessage);
      setChatResponse(response);
      setChatMessage('');
      await loadInvoices(); // Refresh after action
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Invoice Manager - {{companyName}}</h1>
      <p>Setor: {{industry}}</p>

      {/* FEATURE:invoicing START */}
      <section style={{ marginTop: '2rem' }}>
        <h2>Faturas</h2>
        <button 
          onClick={handleCreateInvoice} 
          disabled={loading}
          style={{ padding: '0.5rem 1rem', marginBottom: '1rem' }}
        >
          {loading ? 'Criando...' : 'Criar Fatura'}
        </button>
        <div>
          {invoices.length === 0 ? (
            <p>Nenhuma fatura ainda. Crie uma nova!</p>
          ) : (
            <ul>
              {invoices.map((inv, i) => (
                <li key={i}>
                  Fatura #{inv.id} - {inv.payload?.amount || 0} - {inv.status || 'draft'}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
      {/* FEATURE:invoicing END */}

      {/* FEATURE:payments START */}
      <section style={{ marginTop: '2rem' }}>
        <h2>Pagamentos</h2>
        <button 
          onClick={() => ledger.intend('propose:agreement', {
            agreementType: 'Payment',
            payload: { type: 'Payment' }
          })}
          disabled={loading}
        >
          Registrar Pagamento
        </button>
      </section>
      {/* FEATURE:payments END */}

      {/* FEATURE:reports START */}
      <section style={{ marginTop: '2rem' }}>
        <h2>Relatórios</h2>
        <button 
          onClick={async () => {
            const response = await ledger.chat('mostre o relatório de receita mensal');
            setChatResponse(response);
          }}
        >
          Gerar Relatório
        </button>
        {chatResponse && (
          <div style={{ marginTop: '1rem', padding: '1rem', background: '#f5f5f5' }}>
            <ReactMarkdown>{chatResponse.response?.markdown || chatResponse.response?.content || ''}</ReactMarkdown>
          </div>
        )}
      </section>
      {/* FEATURE:reports END */}

      {/* Chat Interface */}
      <section style={{ marginTop: '2rem', padding: '1rem', border: '1px solid #ddd' }}>
        <h3>Assistente IA</h3>
        <div style={{ marginBottom: '1rem' }}>
          <input
            type="text"
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleChat()}
            placeholder="Pergunte sobre faturas, pagamentos..."
            style={{ width: '100%', padding: '0.5rem' }}
          />
          <button onClick={handleChat} disabled={loading || !chatMessage.trim()}>
            Enviar
          </button>
        </div>
        {chatResponse && (
          <div style={{ padding: '1rem', background: '#f9f9f9' }}>
            <ReactMarkdown>{chatResponse.response?.markdown || chatResponse.response?.content || ''}</ReactMarkdown>
          </div>
        )}
      </section>
    </div>
  );
}`,
    intents: `/**
 * Invoice Manager - Intents Específicos
 * 
 * Intents customizados para gerenciamento de faturas e pagamentos.
 */

export const invoiceIntents = {
  // Criar fatura
  'create:invoice': {
    intent: 'propose:agreement',
    agreementType: 'Invoice',
    schema: {
      type: 'object',
      properties: {
        clientId: { type: 'string', description: 'ID do cliente' },
        amount: { type: 'number', description: 'Valor da fatura' },
        dueDate: { type: 'string', format: 'date', description: 'Data de vencimento' },
        description: { type: 'string', description: 'Descrição' },
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              description: { type: 'string' },
              quantity: { type: 'number' },
              price: { type: 'number' }
            }
          }
        }
      },
      required: ['clientId', 'amount']
    }
  },

  // Registrar pagamento
  'register:payment': {
    intent: 'propose:agreement',
    agreementType: 'Payment',
    schema: {
      type: 'object',
      properties: {
        invoiceId: { type: 'string', description: 'ID da fatura' },
        amount: { type: 'number', description: 'Valor pago' },
        method: { type: 'string', enum: ['cash', 'card', 'transfer', 'check'], description: 'Método de pagamento' },
        date: { type: 'string', format: 'date', description: 'Data do pagamento' }
      },
      required: ['invoiceId', 'amount']
    }
  },

  // Marcar fatura como paga
  'fulfill:invoice': {
    intent: 'fulfill',
    schema: {
      type: 'object',
      properties: {
        invoiceId: { type: 'string' },
        paymentId: { type: 'string' }
      },
      required: ['invoiceId']
    }
  }
};`,
    agreements: `/**
 * Invoice Manager - Agreements Configuration
 * 
 * Define os tipos de agreements e suas estruturas.
 */

export const invoiceAgreements = {
  // Fatura (Invoice)
  Invoice: {
    parties: [
      { role: 'Issuer', description: 'Quem emite a fatura' },
      { role: 'Client', description: 'Cliente que recebe a fatura' }
    ],
    obligations: [
      {
        id: 'pay',
        description: 'Cliente deve pagar a fatura',
        dueDate: '{{dueDate}}',
        amount: '{{amount}}'
      }
    ],
    assets: [
      {
        id: 'invoice-amount',
        type: 'Money',
        amount: '{{amount}}',
        currency: '{{currency}}'
      }
    ],
    terms: {
      currency: 'BRL',
      paymentTerms: 'net30',
      lateFee: 0.02
    }
  },

  // Pagamento (Payment)
  Payment: {
    parties: [
      { role: 'Payer', description: 'Quem paga' },
      { role: 'Payee', description: 'Quem recebe' }
    ],
    obligations: [
      {
        id: 'confirm',
        description: 'Confirmar recebimento do pagamento'
      }
    ],
    assets: [
      {
        id: 'payment-amount',
        type: 'Money',
        amount: '{{amount}}',
        currency: '{{currency}}'
      }
    ],
    terms: {
      method: '{{method}}',
      reference: '{{invoiceId}}'
    }
  }
};`
  },

  'hr-onboarding': {
    frontend: `import React, { useState, useEffect } from 'react';
import { ledger } from './ledger-client';
import ReactMarkdown from 'react-markdown';

export default function App() {
  const [checklist, setChecklist] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatResponse, setChatResponse] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const checklistResult = await ledger.query({
        type: 'agreements',
        filters: { agreementType: 'OnboardingChecklist' }
      });
      setChecklist(checklistResult.data || []);

      const tasksResult = await ledger.query({
        type: 'agreements',
        filters: { agreementType: 'OnboardingTask' }
      });
      setTasks(tasksResult.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  async function handleCreateTask() {
    setLoading(true);
    try {
      await ledger.intend('propose:agreement', {
        agreementType: 'OnboardingTask',
        payload: { type: 'OnboardingTask', title: 'Nova tarefa', status: 'pending' }
      });
      await loadData();
    } finally {
      setLoading(false);
    }
  }

  async function handleChat() {
    if (!chatMessage.trim()) return;
    setLoading(true);
    try {
      const response = await ledger.chat(chatMessage);
      setChatResponse(response);
      setChatMessage('');
      await loadData();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>HR Onboarding - {{companyName}}</h1>
      <p>Setor: {{industry}}</p>

      {/* FEATURE:checklist START */}
      <section style={{ marginTop: '2rem' }}>
        <h2>Checklist de Onboarding</h2>
        <ul>
          {checklist.map((item, i) => (
            <li key={i}>
              <input type="checkbox" checked={item.status === 'completed'} readOnly />
              {item.payload?.title || item.id}
            </li>
          ))}
        </ul>
      </section>
      {/* FEATURE:checklist END */}

      {/* FEATURE:documents START */}
      <section style={{ marginTop: '2rem' }}>
        <h2>Documentos</h2>
        <button onClick={() => ledger.intend('propose:agreement', {
          agreementType: 'DocumentUpload',
          payload: { type: 'DocumentUpload' }
        })}>
          Enviar Documento
        </button>
      </section>
      {/* FEATURE:documents END */}

      {/* FEATURE:tasks START */}
      <section style={{ marginTop: '2rem' }}>
        <h2>Tarefas</h2>
        <button onClick={handleCreateTask} disabled={loading}>
          Criar Tarefa
        </button>
        <ul>
          {tasks.map((task, i) => (
            <li key={i}>{task.payload?.title || task.id}</li>
          ))}
        </ul>
      </section>
      {/* FEATURE:tasks END */}

      {/* Chat */}
      <section style={{ marginTop: '2rem', padding: '1rem', border: '1px solid #ddd' }}>
        <h3>Assistente IA</h3>
        <input
          type="text"
          value={chatMessage}
          onChange={(e) => setChatMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleChat()}
          placeholder="Pergunte sobre onboarding..."
          style={{ width: '100%', padding: '0.5rem' }}
        />
        {chatResponse && (
          <div style={{ marginTop: '1rem', padding: '1rem', background: '#f9f9f9' }}>
            <ReactMarkdown>{chatResponse.response?.markdown || chatResponse.response?.content || ''}</ReactMarkdown>
          </div>
        )}
      </section>
    </div>
  );
}`,
    intents: `/**
 * HR Onboarding - Intents Específicos
 */

export const onboardingIntents = {
  'create:checklist': {
    intent: 'propose:agreement',
    agreementType: 'OnboardingChecklist',
    schema: {
      type: 'object',
      properties: {
        employeeId: { type: 'string' },
        items: {
          type: 'array',
          items: { type: 'string' }
        }
      }
    }
  },
  'create:task': {
    intent: 'propose:agreement',
    agreementType: 'OnboardingTask',
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        assigneeId: { type: 'string' },
        dueDate: { type: 'string', format: 'date' }
      }
    }
  }
};`,
    agreements: `/**
 * HR Onboarding - Agreements Configuration
 */

export const onboardingAgreements = {
  OnboardingChecklist: {
    parties: [
      { role: 'Employee', description: 'Novo colaborador' },
      { role: 'HR', description: 'Equipe de RH' }
    ],
    obligations: [
      { id: 'complete-checklist', description: 'Completar checklist de onboarding' }
    ]
  },
  OnboardingTask: {
    parties: [
      { role: 'Assignee', description: 'Responsável pela tarefa' },
      { role: 'Creator', description: 'Quem criou a tarefa' }
    ],
    obligations: [
      { id: 'complete-task', description: 'Completar tarefa', dueDate: '{{dueDate}}' }
    ]
  }
};`
  }
};

// Template genérico para outros
const genericFrontend = `import React, { useState, useEffect } from 'react';
import { ledger } from './ledger-client';
import ReactMarkdown from 'react-markdown';

export default function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatResponse, setChatResponse] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const result = await ledger.query({
        type: 'agreements',
        filters: {}
      });
      setData(result.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  async function handleChat() {
    if (!chatMessage.trim()) return;
    setLoading(true);
    try {
      const response = await ledger.chat(chatMessage);
      setChatResponse(response);
      setChatMessage('');
      await loadData();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>{{templateName}} - {{companyName}}</h1>
      <p>Setor: {{industry}}</p>

      <section style={{ marginTop: '2rem' }}>
        <h2>Dados</h2>
        <ul>
          {data.map((item, i) => (
            <li key={i}>{JSON.stringify(item)}</li>
          ))}
        </ul>
      </section>

      <section style={{ marginTop: '2rem', padding: '1rem', border: '1px solid #ddd' }}>
        <h3>Assistente IA</h3>
        <input
          type="text"
          value={chatMessage}
          onChange={(e) => setChatMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleChat()}
          placeholder="Pergunte algo..."
          style={{ width: '100%', padding: '0.5rem' }}
        />
        {chatResponse && (
          <div style={{ marginTop: '1rem', padding: '1rem', background: '#f9f9f9' }}>
            <ReactMarkdown>{chatResponse.response?.markdown || chatResponse.response?.content || ''}</ReactMarkdown>
          </div>
        )}
      </section>
    </div>
  );
}`;

const genericIntents = `/**
 * {{templateName}} - Intents Específicos
 * 
 * Defina aqui os intents customizados para este template.
 */

export const {{templateId}}Intents = {
  // Exemplo:
  // 'create:item': {
  //   intent: 'propose:agreement',
  //   agreementType: 'Item',
  //   schema: {
  //     type: 'object',
  //     properties: {
  //       name: { type: 'string' },
  //       description: { type: 'string' }
  //     }
  //   }
  // }
};`;

const genericAgreements = `/**
 * {{templateName}} - Agreements Configuration
 * 
 * Defina aqui os tipos de agreements e suas estruturas.
 */

export const {{templateId}}Agreements = {
  // Exemplo:
  // Item: {
  //   parties: [
  //     { role: 'Owner', description: 'Proprietário do item' },
  //     { role: 'Creator', description: 'Quem criou o item' }
  //   ],
  //   obligations: [
  //     { id: 'maintain', description: 'Manter o item atualizado' }
  //   ],
  //   assets: []
  // }
};`;

// ============================================================================
// FUNÇÃO PRINCIPAL
// ============================================================================

function improveTemplates() {
  console.log('📝 Melhorando templates...\n');
  
  const templatesDir = path.join(rootDir, 'templates');
  const templateDirs = fs.readdirSync(templatesDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);
  
  let improved = 0;
  
  for (const templateId of templateDirs) {
    const templateDir = path.join(templatesDir, templateId);
    const configPath = path.join(templateDir, 'config.ts');
    
    if (!fs.existsSync(configPath)) continue;
    
    try {
      let content = fs.readFileSync(configPath, 'utf-8');
      let changed = false;
      
      // Obter melhorias específicas ou usar genérico
      const improvements = templateImprovements[templateId] || {
        frontend: genericFrontend.replace(/\{\{templateName\}\}/g, templateId).replace(/\{\{templateId\}\}/g, templateId),
        intents: genericIntents.replace(/\{\{templateName\}\}/g, templateId).replace(/\{\{templateId\}\}/g, templateId),
        agreements: genericAgreements.replace(/\{\{templateName\}\}/g, templateId).replace(/\{\{templateId\}\}/g, templateId)
      };
      
      // Substituir frontend template se estiver muito básico
      if (content.includes('const frontendTemplate = `import React') && 
          !content.includes('ledger') && 
          !content.includes('useState') && 
          !content.includes('useEffect')) {
        const frontendMatch = content.match(/const frontendTemplate = `[\s\S]*?`;/);
        if (frontendMatch) {
          content = content.replace(frontendMatch[0], `const frontendTemplate = \`${improvements.frontend}\`;`);
          changed = true;
        }
      }
      
      // Substituir intents template se estiver vazio
      if (content.includes('const intentsTemplate = `// Intents específicos') ||
          content.includes('const intentsTemplate = `// Intents específicos\n`')) {
        content = content.replace(
          /const intentsTemplate = `[\s\S]*?`;/,
          `const intentsTemplate = \`${improvements.intents}\`;`
        );
        changed = true;
      }
      
      // Substituir agreements template se estiver vazio
      if (content.includes('const agreementsTemplate = `// Agreements específicos') ||
          content.includes('const agreementsTemplate = `// Agreements específicos\n`')) {
        content = content.replace(
          /const agreementsTemplate = `[\s\S]*?`;/,
          `const agreementsTemplate = \`${improvements.agreements}\`;`
        );
        changed = true;
      }
      
      // Remover referências obsoletas
      if (content.includes('backend: { language:') || content.includes('database: { type:')) {
        content = content.replace(
          /technologies:\s*\{[\s\S]*?backend:[\s\S]*?database:[\s\S]*?\},/,
          `technologies: {
    frontend: { language: 'TypeScript', framework: 'React' },
    backend: { base: 'Universal Business Ledger' }
  },`
        );
        changed = true;
      }
      
      if (content.includes('DATABASE_URL') && !content.includes('UBL_ANTENNA_URL')) {
        content = content.replace(
          /environmentVariables:\s*\{[\s\S]*?required:[\s\S]*?DATABASE_URL[\s\S]*?\},/,
          `environmentVariables: {
    required: ['UBL_ANTENNA_URL', 'REALM_ID'],
    optional: ['UBL_API_KEY']
  },`
        );
        changed = true;
      }
      
      if (content.includes('dependencies:') && content.includes('backend: [')) {
        content = content.replace(
          /dependencies:\s*\{[\s\S]*?backend:[\s\S]*?\},/,
          `dependencies: {
    frontend: ['react', 'react-dom', '@build-o-matic/ubl-client', 'react-markdown']
  },`
        );
        changed = true;
      }
      
      if (changed) {
        fs.writeFileSync(configPath, content);
        improved++;
        console.log(`   ✅ ${templateId} melhorado`);
      } else {
        console.log(`   ⏭️  ${templateId} já está bom`);
      }
    } catch (error) {
      console.error(`   ⚠️  Erro ao melhorar ${templateId}:`, error.message);
    }
  }
  
  console.log(`\n✅ ${improved} templates melhorados\n`);
}

// ============================================================================
// EXECUTAR
// ============================================================================

try {
  improveTemplates();
  console.log('🎉 Melhoria dos templates concluída!');
} catch (error) {
  console.error('❌ Erro:', error);
  process.exit(1);
}

