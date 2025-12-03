import { Template } from '../../generator/types';
import { questions } from './questions';

// Backend removed - using UBL instead

const frontendTemplate = `import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ledger } from './ledger-client';
import ReactMarkdown from 'react-markdown';

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

/**
 * Hook para chat com agente IA
 */
function useChat(realmId: string) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string; timestamp: number }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (text: string, affordanceClick?: any) => {
    if (!text.trim() && !affordanceClick) return;

    setLoading(true);
    setError(null);

    try {
      // Add user message
      if (text) {
        setMessages(prev => [...prev, {
          role: 'user',
          content: text,
          timestamp: Date.now()
        }]);
      }

      // Send to agent
      const response = await ledger.chat(text || '', sessionId || undefined);
      
      // Update session
      if (response.sessionId) {
        setSessionId(response.sessionId);
      }

      // Add assistant response
      const markdown = response.response?.markdown || response.response?.content || response.markdown || '';
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: markdown,
        timestamp: Date.now()
      }]);

      return response;
    } catch (err: any) {
      const errorMsg = err.message || 'Erro ao enviar mensagem';
      setError(errorMsg);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: \`❌ Erro: \${errorMsg}\`,
        timestamp: Date.now()
      }]);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [sessionId, realmId]);

  return { messages, sendMessage, loading, error, sessionId };
}

/**
 * Hook para queries ao UBL
 */
function useQuery<T = any>(queryType: string, filters: Record<string, any> = {}) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await ledger.query({ type: queryType, filters });
      setData(result.data || []);
      return result;
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar dados');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [queryType, JSON.stringify(filters)]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}

/**
 * Hook para executar intents
 */
function useIntent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (intent: string, payload: Record<string, any> = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await ledger.intend(intent, payload);
      return result;
    } catch (err: any) {
      setError(err.message || 'Erro ao executar intent');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { execute, loading, error };
}

// ============================================================================
// COMPONENTS
// ============================================================================

/**
 * Componente de Chat
 */
function ChatInterface({ onMessage }: { onMessage: (text: string) => void }) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onMessage(input);
      setInput('');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Pergunte algo ou peça uma ação..."
        style={{ flex: 1, padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }}
      />
      <button
        type="submit"
        style={{ padding: '0.75rem 1.5rem', background: '#3B82F6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
      >
        Enviar
      </button>
    </form>
  );
}

/**
 * Componente de Affordances (Botões de Ação)
 */
function Affordances({ affordances, onAffordanceClick }: { affordances: any[]; onAffordanceClick: (aff: any) => void }) {
  if (!affordances || affordances.length === 0) return null;

  return (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
      {affordances.map((aff, i) => (
        <button
          key={i}
          onClick={() => onAffordanceClick(aff)}
          style={{
            padding: '0.5rem 1rem',
            background: aff.style === 'primary' ? '#3B82F6' : '#f3f4f6',
            color: aff.style === 'primary' ? 'white' : '#1f2937',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {aff.label || aff.action}
        </button>
      ))}
    </div>
  );
}

/**
 * Componente de Loading
 */
function LoadingSpinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem' }}>
      <div style={{ width: '20px', height: '20px', border: '2px solid #f3f4f6', borderTop: '2px solid #3B82F6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <span>Carregando...</span>
    </div>
  );
}

/**
 * Componente de Erro
 */
function ErrorMessage({ error, onRetry }: { error: string; onRetry?: () => void }) {
  return (
    <div style={{ padding: '1rem', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '4px', color: '#991b1b' }}>
      <p style={{ margin: 0, fontWeight: 'bold' }}>❌ Erro</p>
      <p style={{ margin: '0.5rem 0 0 0' }}>{error}</p>
      {onRetry && (
        <button onClick={onRetry} style={{ marginTop: '0.5rem', padding: '0.5rem 1rem', background: '#dc2626', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Tentar Novamente
        </button>
      )}
    </div>
  );
}

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================

export default function App() {
  const realmId = '{{realmId}}' || 'default-realm';
  const { messages, sendMessage, loading: chatLoading } = useChat(realmId);
  const { execute: executeIntent, loading: intentLoading } = useIntent();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle affordance clicks
  const handleAffordance = useCallback(async (aff: any) => {
    try {
      if (aff.intent) {
        await executeIntent(aff.intent, aff.prefilled || {});
      } else {
        await sendMessage('', aff);
      }
    } catch (err) {
      console.error('Error handling affordance:', err);
    }
  }, [executeIntent, sendMessage]);

  // Feature-specific data queries
  {{#if features.includes('{{featureId}}')}}
  const { data: {{featureData}}, loading: {{featureLoading}}, refetch: {{featureRefetch}} } = useQuery('agreements', {
    agreementType: '{{AgreementType}}'
  });
  {{/if}}

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#f9fafb',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <header style={{ 
        background: 'white', 
        borderBottom: '1px solid #e5e7eb', 
        padding: '1rem 2rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>
          Time Tracking - {{companyName}}
        </h1>
        <p style={{ margin: '0.5rem 0 0 0', color: '#6b7280', fontSize: '0.875rem' }}>
          Setor: {{industry}}
        </p>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        {/* Feature Sections */}
        {{#each features}}
        {{#if this.enabled}}
        {/* FEATURE:{{this.id}} START */}
        <section style={{ 
          background: 'white', 
          borderRadius: '8px', 
          padding: '1.5rem', 
          marginBottom: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', fontWeight: '600', color: '#1f2937' }}>
            {{this.name}}
          </h2>
          
          {{#if this.actions}}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            {{#each this.actions}}
            <button
              onClick={async () => {
                try {
                  await executeIntent('{{this.intent}}', {{this.payload}});
                  {{#if this.refetch}}
                  await {{this.refetch}}();
                  {{/if}}
                } catch (err) {
                  console.error('Error:', err);
                }
              }}
              disabled={intentLoading}
              style={{
                padding: '0.5rem 1rem',
                background: '#3B82F6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: intentLoading ? 'not-allowed' : 'pointer',
                opacity: intentLoading ? 0.6 : 1
              }}
            >
              {intentLoading ? 'Processando...' : '{{this.label}}'}
            </button>
            {{/each}}
          </div>
          {{/if}}

          {{#if this.data}}
          <div>
            {{{this.data}}.length === 0 ? (
              <p style={{ color: '#6b7280', fontStyle: 'italic' }}>Nenhum item ainda. Crie um novo!</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {{{this.data}}}.map((item: any, i: number) => (
                  <li key={i} style={{ 
                    padding: '0.75rem', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '4px', 
                    marginBottom: '0.5rem',
                    background: '#f9fafb'
                  }}>
                    {JSON.stringify(item, null, 2)}
                  </li>
                ))}
              </ul>
            )}
          </div>
          {{/if}}
        </section>
        {/* FEATURE:{{this.id}} END */}
        {{/if}}
        {{/each}}

        {/* Chat Interface */}
        <section style={{ 
          background: 'white', 
          borderRadius: '8px', 
          padding: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.125rem', fontWeight: '600' }}>
            🤖 Assistente IA
          </h3>

          {/* Messages */}
          <div style={{ 
            maxHeight: '400px', 
            overflowY: 'auto', 
            marginBottom: '1rem',
            padding: '1rem',
            background: '#f9fafb',
            borderRadius: '4px'
          }}>
            {messages.length === 0 ? (
              <p style={{ color: '#6b7280', fontStyle: 'italic', textAlign: 'center' }}>
                Comece uma conversa com o assistente...
              </p>
            ) : (
              messages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    marginBottom: '1rem',
                    padding: '0.75rem',
                    background: msg.role === 'user' ? '#dbeafe' : 'white',
                    borderRadius: '4px',
                    border: '1px solid #e5e7eb'
                  }}
                >
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                    {msg.role === 'user' ? '👤 Você' : '🤖 Assistente'}
                  </div>
                  {msg.role === 'assistant' ? (
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  ) : (
                    <p style={{ margin: 0 }}>{msg.content}</p>
                  )}
                </div>
              ))
            )}
            {chatLoading && <LoadingSpinner />}
            <div ref={messagesEndRef} />
          </div>

          <ChatInterface onMessage={sendMessage} />
        </section>
      </main>

      {/* Global Styles */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}`;
const intentsTemplate = `/**
 * Time Tracking - Intents Específicos
 * 
 * Intents customizados para este template, seguindo o padrão UBL.
 * 
 * Estrutura:
 * - intent: Tipo de intent UBL (propose:agreement, register:entity, etc.)
 * - agreementType: Tipo de agreement (se aplicável)
 * - schema: Validação JSON Schema
 * - description: Descrição humana
 * - examples: Exemplos de uso
 */

import type { IntentRequest } from '@build-o-matic/ubl-client';

export interface time-trackingIntent extends IntentRequest {
  intent: string;
  agreementType?: string;
  payload?: Record<string, any>;
}

/**
 * Intents disponíveis
 */
export const time-trackingIntents = {
  {{#each intents}}
  /**
   * {{this.description}}
   * 
   * @example
   * await ledger.intend('{{this.id}}', {
   *   {{#each this.examplePayload}}
   *   {{@key}}: {{this}},
   *   {{/each}}
   * });
   */
  '{{this.id}}': {
    intent: '{{this.intent}}',
    agreementType: '{{this.agreementType}}',
    schema: {
      type: 'object',
      properties: {
        {{#each this.schema.properties}}
        {{@key}}: {
          type: '{{this.type}}',
          {{#if this.description}}description: '{{this.description}}',{{/if}}
          {{#if this.enum}}enum: [{{#each this.enum}}'{{this}}'{{#unless @last}}, {{/unless}}{{/each}}],{{/if}}
          {{#if this.format}}format: '{{this.format}}',{{/if}}
        },
        {{/each}}
      },
      required: [{{#each this.schema.required}}'{{this}}'{{#unless @last}}, {{/unless}}{{/each}}]
    },
    description: '{{this.description}}',
    examples: [
      {{#each this.examples}}
      {
        description: '{{this.description}}',
        payload: {{JSON.stringify this.payload}}
      }{{#unless @last}},{{/unless}}
      {{/each}}
    ]
  }{{#unless @last}},{{/unless}}
  {{/each}}
};

/**
 * Helper para executar intents com validação
 */
export async function executetime-trackingIntent(
  intentId: keyof typeof time-trackingIntents,
  payload: Record<string, any>
): Promise<any> {
  const intent = time-trackingIntents[intentId];
  if (!intent) {
    throw new Error(\`Intent "\${intentId}" não encontrado\`);
  }

  // Validação básica (pode usar biblioteca como zod)
  const required = intent.schema.required || [];
  for (const field of required) {
    if (!payload[field]) {
      throw new Error(\`Campo obrigatório faltando: \${field}\`);
    }
  }

  return {
    intent: intent.intent,
    agreementType: intent.agreementType,
    payload: {
      ...payload,
      ...intent.payload
    }
  };
}

/**
 * Type-safe helpers
 */
export const time-trackingIntentHelpers = {
  {{#each intents}}
  {{#if this.helper}}
  /**
   * {{this.description}}
   */
  {{this.helper.name}}: async ({{this.helper.params}}) => {
    return executetime-trackingIntent('{{this.id}}', {
      {{#each this.helper.mapping}}
      {{@key}}: {{this}},
      {{/each}}
    });
  }{{#unless @last}},{{/unless}}
  {{/if}}
  {{/each}}
};`;
const agreementsTemplate = `/**
 * Time Tracking - Agreements Configuration
 * 
 * Define os tipos de agreements e suas estruturas no UBL.
 * 
 * Estrutura de um Agreement:
 * - parties: Partes envolvidas (roles)
 * - obligations: Obrigações de cada parte
 * - assets: Ativos envolvidos
 * - terms: Termos e condições
 * - lifecycle: Estados e transições
 */

import type { AgreementDefinition } from '@universal-business-ledger/core';

/**
 * Agreements disponíveis
 */
export const time-trackingAgreements: Record<string, AgreementDefinition> = {
  {{#each agreements}}
  /**
   * {{this.name}}
   * 
   * {{this.description}}
   */
  {{this.id}}: {
    name: '{{this.name}}',
    description: '{{this.description}}',
    
    // Partes envolvidas
    parties: [
      {{#each this.parties}}
      {
        role: '{{this.role}}',
        description: '{{this.description}}',
        {{#if this.required}}required: true,{{/if}}
        {{#if this.multiple}}multiple: true,{{/if}}
      }{{#unless @last}},{{/unless}}
      {{/each}}
    ],

    // Obrigações
    obligations: [
      {{#each this.obligations}}
      {
        id: '{{this.id}}',
        description: '{{this.description}}',
        {{#if this.party}}party: '{{this.party}}',{{/if}}
        {{#if this.dueDate}}dueDate: '{{this.dueDate}}',{{/if}}
        {{#if this.amount}}amount: {{this.amount}},{{/if}}
        {{#if this.currency}}currency: '{{this.currency}}',{{/if}}
        {{#if this.autoFulfill}}autoFulfill: {{this.autoFulfill}},{{/if}}
      }{{#unless @last}},{{/unless}}
      {{/each}}
    ],

    // Ativos
    assets: [
      {{#each this.assets}}
      {
        id: '{{this.id}}',
        type: '{{this.type}}',
        {{#if this.amount}}amount: {{this.amount}},{{/if}}
        {{#if this.currency}}currency: '{{this.currency}}',{{/if}}
        {{#if this.description}}description: '{{this.description}}',{{/if}}
      }{{#unless @last}},{{/unless}}
      {{/each}}
    ],

    // Termos
    terms: {
      {{#each this.terms}}
      {{@key}}: {{#if (eq this.type 'string')}}'{{this.value}}'{{else}}{{this.value}}{{/if}}{{#unless @last}},{{/unless}}
      {{/each}}
    },

    // Lifecycle
    lifecycle: {
      states: [{{#each this.lifecycle.states}}'{{this}}'{{#unless @last}}, {{/unless}}{{/each}}],
      initialState: '{{this.lifecycle.initialState}}',
      transitions: [
        {{#each this.lifecycle.transitions}}
        {
          from: '{{this.from}}',
          to: '{{this.to}}',
          trigger: '{{this.trigger}}',
          {{#if this.conditions}}conditions: {{JSON.stringify this.conditions}},{{/if}}
        }{{#unless @last}},{{/unless}}
        {{/each}}
      ]
    }
  }{{#unless @last}},{{/unless}}
  {{/each}}
};

/**
 * Helper para criar agreements
 */
export function createtime-trackingAgreement(
  type: keyof typeof time-trackingAgreements,
  data: Record<string, any>
): AgreementDefinition {
  const agreement = time-trackingAgreements[type];
  if (!agreement) {
    throw new Error(\`Agreement type "\${type}" não encontrado\`);
  }

  // Aplicar dados aos placeholders
  const processed = JSON.parse(
    JSON.stringify(agreement)
      .replace(/\\{\\{([^}]+)\\}\\}/g, (_, key) => {
        return data[key] || \`{{\${key}}}\`;

// Database removed - using UBL event store instead

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
    frontend: { language: 'TypeScript', framework: 'React' },
    backend: { base: 'Universal Business Ledger' }
  },
  environmentVariables: {
    required: ['UBL_ANTENNA_URL', 'REALM_ID'],
    optional: ['UBL_API_KEY']
  },
  dependencies: {
    frontend: ['react', 'react-dom', '@build-o-matic/ubl-client', 'react-markdown']
  },
  customization: { branding: { enabled: true, fields: ['company_name'] }, features: { enabled: true, toggleable: true } },
  generation: { steps: ['load_base_ledger', 'customize_schema', 'generate_backend', 'generate_frontend', 'configure_database', 'package_deployment'], estimatedTime: 7000 },
  codePaths: { backend: './backend/', frontend: './frontend/', database: './database/', config: './config/' },
  validation: { checks: ['has_timesheets_table', 'has_projects_table'] },
  documentation: { readme: './README.md' },
  examples: [{ name: 'Consultoria', configuration: { industry: 'saas', users: 15, features: ['timesheets', 'projects', 'reports'], integrations: ['email'] } }],
  aiHints: { focusAreas: ['Operações', 'Produtividade'] },
  codeTemplates: {
    frontend: frontendTemplate,
    intents: intentsTemplate,
    agreements: agreementsTemplate
  },
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