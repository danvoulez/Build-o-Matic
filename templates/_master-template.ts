/**
 * 🎯 MASTER TEMPLATE - Build-o-Matic
 * 
 * Template de referência de alta qualidade para todos os templates.
 * Este template demonstra as melhores práticas para:
 * - Frontend React com UBL
 * - Intents bem estruturados
 * - Agreements completos
 * - Integração real-time
 * - UI moderna e responsiva
 */

// ============================================================================
// FRONTEND TEMPLATE - MASTER
// ============================================================================

export const masterFrontendTemplate = `import React, { useState, useEffect, useCallback, useRef } from 'react';
import Layout from './Layout';
import { ledger } from './ledger-client';
import ReactMarkdown from 'react-markdown';
import { Send, Search, Plus, Filter, X, ChevronDown } from 'lucide-react';
import AutoForm from './components/AutoForm';
import DataGrid from './components/DataGrid';
import { DashboardWidget } from './components/DashboardWidgets';

/**
 * ⚠️ SECURITY NOTE: API Keys in Frontend
 * 
 * This frontend uses VITE_UBL_API_KEY which is visible in the browser.
 * 
 * For production:
 * - Use Realm-scoped public keys (limited to this Realm only)
 * - OR implement user authentication (JWT) where users log in
 * - Never use admin/root API keys in frontend code
 */

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
 * Componente de Chat (Tailwind)
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
    <form onSubmit={handleSubmit} className="flex gap-2 mt-4 relative">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Pergunte algo ou peça uma ação..."
        className="input pr-12 shadow-sm"
      />
      <button
        type="submit"
        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-primary hover:bg-primary/10 rounded-full transition-colors"
      >
        <Send size={18} />
      </button>
    </form>
  );
}

/**
 * Componente de Affordances (Botões de Ação) - Tailwind
 */
function Affordances({ affordances, onAffordanceClick }: { affordances: any[]; onAffordanceClick: (aff: any) => void }) {
  if (!affordances || affordances.length === 0) return null;

  return (
    <div className="flex gap-2 flex-wrap mt-4 animate-fade-in">
      {affordances.map((aff, i) => (
        <button
          key={i}
          onClick={() => onAffordanceClick(aff)}
          className={\`btn \${aff.style === 'primary' ? 'btn-primary' : 'btn-secondary'} text-sm flex items-center gap-2\`}
        >
          {aff.icon === 'search' && <Search size={14} />}
          {aff.icon === 'plus' && <Plus size={14} />}
          {aff.label || aff.action}
        </button>
      ))}
    </div>
  );
}

/**
 * Componente de Loading - Tailwind
 */
function LoadingSpinner() {
  return (
    <div className="flex items-center gap-2 p-4 text-muted justify-center">
      <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      <span className="text-sm animate-pulse">Processando...</span>
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
    <Layout>
      {/* Main Content - Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Coluna Principal: Dados e Features */}
        <div className="lg:col-span-2 space-y-6">
          {/* Feature Sections */}
          {{#each features}}
          {{#if this.enabled}}
          {/* FEATURE:{{this.id}} START */}
          <section className="card hover:shadow-lg transition-shadow duration-300">
            <div className="flex justify-between items-center mb-4 border-b border-border pb-2">
              <h2 className="text-lg font-bold text-primary flex items-center gap-2">
                {{this.name}}
              </h2>
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">Active</span>
            </div>
            
            {{#if this.analytics}}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {{#each this.analytics}}
              <DashboardWidget 
                title="{{this.title}}" 
                type="{{this.type}}"
                data={{{this.data}}}
                config={{ xKey: '{{this.xKey}}', yKey: '{{this.yKey}}', groupKey: '{{this.groupKey}}' }}
              />
              {{/each}}
            </div>
            {{/if}}

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* ESQUERDA: Lista de Dados (Data Grid) */}
              <div className="xl:col-span-2">
                {{#if this.data}}
                <DataGrid 
                  data={{{this.data}}} 
                  columns={[
                    { key: 'id', label: 'ID', type: 'text' },
                    { key: 'status', label: 'Status', type: 'status' },
                    { key: 'createdAt', label: 'Data', type: 'date' }
                  ]}
                  onRowClick={(row: any) => {
                    sendMessage(\`Ver detalhes de \${row.id}\`);
                  }}
                />
                {{/if}}
              </div>

              {/* DIREITA: Ações Rápidas (Smart Forms) */}
              <div className="xl:col-span-1 space-y-4">
                <div className="bg-background rounded-token p-4 border border-border">
                  <h3 className="font-semibold mb-4 text-sm uppercase text-muted">Ações Rápidas</h3>
                  
                  {{#if this.actions}}
                    {{#each this.actions}}
                    <div className="mb-4 last:mb-0">
                      <details className="group">
                        <summary className="flex justify-between items-center font-medium cursor-pointer list-none text-primary hover:text-primary-dark">
                          <span>{{this.label}}</span>
                          <span className="transition group-open:rotate-180">
                            <ChevronDown size={16} />
                          </span>
                        </summary>
                        <div className="mt-4 text-sm">
                          <AutoForm 
                            schema={ {{this.schema}} } 
                            onSubmit={async (data) => {
                              await executeIntent('{{this.intent}}', data);
                              {{#if this.refetch}}await {{this.refetch}}();{{/if}}
                            }}
                            loading={intentLoading}
                            submitLabel="{{this.label}}"
                          />
                        </div>
                      </details>
                    </div>
                    {{/each}}
                  {{/if}}
                </div>
              </div>
            </div>
          </section>
          {/* FEATURE:{{this.id}} END */}
          {{/if}}
          {{/each}}
        </div>

        {/* Coluna Lateral: Chat AI */}
        <div className="lg:col-span-1">
          <section className="card h-[600px] flex flex-col sticky top-4">
            <div className="mb-4 border-b border-border pb-2">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <span>✨</span> Assistente
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-muted opacity-60">
                  <div className="text-4xl mb-2">👋</div>
                  <p>Como posso ajudar com {{templateName}} hoje?</p>
                </div>
              ) : (
                messages.map((msg, i) => (
                  <div
                    key={i}
                    className={\`p-3 rounded-lg max-w-[90%] text-sm \${
                      msg.role === 'user' 
                        ? 'bg-primary text-white ml-auto rounded-br-none' 
                        : 'bg-background border border-border mr-auto rounded-bl-none'
                    }\`}
                  >
                    {msg.role === 'assistant' ? (
                      <ReactMarkdown className="prose prose-sm prose-invert max-w-none">
                        {msg.content}
                      </ReactMarkdown>
                    ) : (
                      msg.content
                    )}
                  </div>
                ))
              )}
              {chatLoading && <LoadingSpinner />}
              <div ref={messagesEndRef} />
            </div>

            <ChatInterface onMessage={sendMessage} />
          </section>
        </div>
      </div>
    </Layout>
  );
}`;

// ============================================================================
// INTENTS TEMPLATE - MASTER
// ============================================================================

export const masterIntentsTemplate = `/**
 * {{templateName}} - Intents Específicos
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

export interface {{templateId}}Intent extends IntentRequest {
  intent: string;
  agreementType?: string;
  payload?: Record<string, any>;
}

/**
 * Intents disponíveis
 */
export const {{templateId}}Intents = {
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
export async function execute{{templateId}}Intent(
  intentId: keyof typeof {{templateId}}Intents,
  payload: Record<string, any>
): Promise<any> {
  const intent = {{templateId}}Intents[intentId];
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
export const {{templateId}}IntentHelpers = {
  {{#each intents}}
  {{#if this.helper}}
  /**
   * {{this.description}}
   */
  {{this.helper.name}}: async ({{this.helper.params}}) => {
    return execute{{templateId}}Intent('{{this.id}}', {
      {{#each this.helper.mapping}}
      {{@key}}: {{this}},
      {{/each}}
    });
  }{{#unless @last}},{{/unless}}
  {{/if}}
  {{/each}}
};`;

// ============================================================================
// AGREEMENTS TEMPLATE - MASTER
// ============================================================================

export const masterAgreementsTemplate = `/**
 * {{templateName}} - Agreements Configuration
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
export const {{templateId}}Agreements: Record<string, AgreementDefinition> = {
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
export function create{{templateId}}Agreement(
  type: keyof typeof {{templateId}}Agreements,
  data: Record<string, any>
): AgreementDefinition {
  const agreement = {{templateId}}Agreements[type];
  if (!agreement) {
    throw new Error(\`Agreement type "\${type}" não encontrado\`);
  }

  // Aplicar dados aos placeholders
  const processed = JSON.parse(
    JSON.stringify(agreement)
      .replace(/\\{\\{([^}]+)\\}\\}/g, (_, key) => {
        return data[key] || \`{{\${key}}}\`;
      })
  );

  return processed;
}

/**
 * Validação de agreements
 */
export function validate{{templateId}}Agreement(
  type: keyof typeof {{templateId}}Agreements,
  data: Record<string, any>
): { valid: boolean; errors: string[] } {
  const agreement = {{templateId}}Agreements[type];
  if (!agreement) {
    return { valid: false, errors: [\`Tipo de agreement "\${type}" não encontrado\`] };
  }

  const errors: string[] = [];

  // Validar parties obrigatórias
  const requiredParties = agreement.parties.filter(p => p.required);
  for (const party of requiredParties) {
    if (!data.parties || !data.parties.find((p: any) => p.role === party.role)) {
      errors.push(\`Parte obrigatória faltando: \${party.role}\`);
    }
  }

  // Validar obrigações com campos obrigatórios
  for (const obligation of agreement.obligations) {
    if (obligation.amount && !data.obligations?.find((o: any) => o.id === obligation.id && o.amount)) {
      errors.push(\`Obrigação "\${obligation.id}" requer amount\`);
    }
  }

  return { valid: errors.length === 0, errors };
}`;

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  frontend: masterFrontendTemplate,
  intents: masterIntentsTemplate,
  agreements: masterAgreementsTemplate
};

