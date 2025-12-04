/**
 * PACKAGER — now includes minimal platform config files.
 * Security: Path traversal protection and file path validation.
 */
import * as zlib from 'zlib';
import * as tar from 'tar-stream';
import { SecurityValidator } from './security/validator';
import { DocsEngine } from './docs-engine';

export class Packager {
  async package(customized: any, deployTarget: string, realmScopedKey?: string) {
    switch (deployTarget) {
      case 'railway':
        return this.packageForRailway(customized, realmScopedKey);
      case 'render':
        return this.packageForRender(customized, realmScopedKey);
      case 'docker':
        return this.packageForDocker(customized, realmScopedKey);
      default:
        throw new Error(`Unknown deploy target: ${deployTarget}`);
    }
  }

  private async packageForRailway(customized: any, realmScopedKey?: string) {
    const realmId = customized.config.environment?.REALM_ID || `realm-${customized.config.settings?.toolId || Date.now()}`;
    const files = this.basicFiles(customized, 'railway', realmId, realmScopedKey);
    files['railway.json'] = JSON.stringify({
      services: [
        { name: 'backend', startCommand: 'npm start', env: { NODE_ENV: 'production' } },
        { name: 'frontend', startCommand: 'npm start', env: { NODE_ENV: 'production' } }
      ]
    }, null, 2);
    const artifact = await this.createTarGz(files);

    return {
      type: 'railway',
      package: artifact,
      instructions: 'Import artifact into Railway or push via CLI; set env vars accordingly.',
      url: '', // will be set by deployer
    };
  }

  private async packageForRender(customized: any, realmScopedKey?: string) {
    const realmId = customized.config.environment?.REALM_ID || `realm-${customized.config.settings?.toolId || Date.now()}`;
    const files = this.basicFiles(customized, 'render', realmId, realmScopedKey);
    files['render.yaml'] = `
services:
  - type: web
    name: backend
    env: node
    plan: starter
    buildCommand: "npm install && npm run build"
    startCommand: "npm start"
  - type: web
    name: frontend
    env: node
    plan: starter
    buildCommand: "npm install && npm run build"
    startCommand: "npm start"
`.trim();
    const artifact = await this.createTarGz(files);

    return {
      type: 'render',
      package: artifact,
      instructions: 'Create services in Render and upload artifact via deploy hook.',
      url: '',
    };
  }

  private async packageForDocker(customized: any, realmScopedKey?: string) {
    const realmId = customized.config.environment?.REALM_ID || `realm-${customized.config.settings?.toolId || Date.now()}`;
    const files = this.basicFiles(customized, 'docker', realmId, realmScopedKey);
    files['Dockerfile'] = this.generateDockerfile(customized);
    files['docker-compose.yml'] = `
version: "3.9"
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      DATABASE_URL: \${DATABASE_URL}
`.trim();
    const artifact = await this.createTarGz(files);

    return {
      type: 'docker',
      package: artifact,
      instructions: 'docker build -t buildomatic-tool . && docker run -p 3000:3000 buildomatic-tool',
      url: '',
    };
  }

    private basicFiles(customized: any, target: string, realmId: string, realmScopedKey?: string) {
    // UBL Client code - embedded directly (no NPM dependency needed)
    const ledgerClientCode = this.getEmbeddedUBLClient(realmId);
    
    // Theme from customized object
    const theme = customized.theme || {
      colors: {
        primary: '#6366f1',
        secondary: '#a855f7',
        accent: '#ec4899',
        background: '#ffffff',
        surface: '#f9fafb',
        text: '#111827'
      },
      borderRadius: '0.75rem',
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      componentStyle: 'shadow'
    };

    // Generate Tailwind config
    const tailwindConfig = this.generateTailwindConfig(theme);
    
    // Generate global CSS
    const globalCss = this.generateGlobalCSS(theme);
    
    // Generate Layout component
    const layoutCode = customized.code.layout || 'export default function Layout({ children }: { children: React.ReactNode }) { return <div>{children}</div>; }';
    
    // Generate advanced components
    const autoFormCode = this.generateAutoForm();
    const dashboardWidgetsCode = this.generateDashboardWidgets();
    const dataGridCode = this.generateDataGrid();

    // Generate personalized documentation
    const docsEngine = new DocsEngine();
    const userGuide = docsEngine.generate({
      template: {
        id: customized.template?.id || 'unknown',
        name: customized.template?.name || 'Generated Tool',
        description: customized.template?.description || '',
        questions: customized.template?.questions || [],
        features: customized.template?.features || {}
      },
      answers: customized.answers || {},
      metadata: {
        deploymentUrl: customized.config.environment?.DEPLOYMENT_URL,
        realmId: realmId,
        generatedAt: new Date().toISOString()
      }
    });

    return {
      'frontend/App.tsx': customized.code.frontend,
      'frontend/Layout.tsx': layoutCode,
      'frontend/main.tsx': this.generateMainTsx(),
      'frontend/ledger-client.ts': ledgerClientCode,
      'frontend/components/AutoForm.tsx': autoFormCode,
      'frontend/components/DashboardWidgets.tsx': dashboardWidgetsCode,
      'frontend/components/DataGrid.tsx': dataGridCode,
      'frontend/index.css': globalCss,
      'tailwind.config.js': tailwindConfig,
      'postcss.config.js': 'module.exports = { plugins: { tailwindcss: {}, autoprefixer: {} } }',
      'intents/index.ts': customized.code.intents,
      'agreements/config.ts': customized.code.agreements,
      'realm/config.json': JSON.stringify({
        id: realmId,
        name: customized.config.settings?.companyName || 'Generated Tool'
      }, null, 2),
      'USER_GUIDE.md': userGuide,
      'index.html': this.generateIndexHtml(customized.config.settings?.companyName || 'Generated Tool', theme),
      'package.json': JSON.stringify({
        name: 'buildomatic-generated-tool',
        version: '1.0.0',
        type: 'module',
        scripts: {
          dev: 'vite',
          build: 'vite build',
          preview: 'vite preview'
        },
        dependencies: {
          'react': '18.2.0',
          'react-dom': '18.2.0',
          'react-markdown': '9.0.1',
          'react-hook-form': '7.48.2',
          'recharts': '2.10.3',
          'lucide-react': '0.263.1',
          'framer-motion': '10.16.16'
        },
        devDependencies: {
          '@vitejs/plugin-react': '4.2.1',
          'vite': '5.0.8',
          'typescript': '5.3.3',
          '@types/react': '18.2.43',
          '@types/react-dom': '18.2.17',
          'tailwindcss': '3.3.6',
          'autoprefixer': '10.4.16',
          'postcss': '8.4.32'
        }
      }, null, 2),
      'vite.config.ts': `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true
  }
});
`,
      '.env.example': `# UBL Antenna URL (backend)
VITE_UBL_ANTENNA_URL=http://localhost:3000

# Realm ID (injected at generation time)
VITE_REALM_ID=${realmId}

# ⚠️ SECURITY WARNING: API keys in frontend are visible in browser
# This is a Realm-scoped key with LIMITED permissions (read/write only to this Realm)
# Generated automatically - DO NOT use master/admin keys here
VITE_UBL_API_KEY=${realmScopedKey || 'your-realm-scoped-api-key-here'}
`,
      'README.md': `# Generated Tool

Uses Universal Business Ledger as backend.

## Configuration

1. Copy \`.env.example\` to \`.env\`
2. Set \`VITE_UBL_ANTENNA_URL\` to your UBL Antenna URL
3. Set \`VITE_UBL_API_KEY\` (see security warning below)

## Security

⚠️ **Important**: API keys in frontend code are visible in the browser.

- For development: Use a test key with limited permissions
- For production: 
  - Use Realm-scoped public keys (read/write only to this Realm)
  - OR implement user authentication (JWT) where users log in and use tokens

## Development

\`\`\`bash
npm install
npm run dev
\`\`\`

## Build

\`\`\`bash
npm run build
\`\`\`
`
    };
  }

  private getEmbeddedUBLClient(realmId: string): string {
    // Embedded UBL Client - no NPM dependency needed
    return `/**
 * UBL Client - Embedded (no external dependency)
 * 
 * This client is embedded directly in the generated tool.
 * No need to publish @build-o-matic/ubl-client to NPM.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface LedgerClientConfig {
  url: string;
  realm: string;
  apiKey?: string;
}

export interface ChatRequest {
  message: string;
  sessionId?: string;
  startSession?: {
    realmId: string;
    actor: { type: string; [key: string]: any };
  };
}

export interface ChatResponse {
  sessionId: string;
  response: {
    markdown?: string;
    content?: string;
    affordances?: Array<{ id: string; label: string; action: string }>;
  };
}

export interface QueryRequest {
  type: string;
  filters?: Record<string, any>;
}

export interface QueryResponse {
  data: any[];
  meta?: Record<string, any>;
}

export interface IntentRequest {
  intent: string;
  payload?: Record<string, any>;
}

export interface IntentResponse {
  success: boolean;
  result?: any;
  error?: string;
}

// ============================================================================
// CLIENT IMPLEMENTATION
// ============================================================================

class LedgerClient {
  private config: LedgerClientConfig;

  constructor(config: LedgerClientConfig) {
    this.config = {
      url: config.url.replace(/\/$/, ''), // Remove trailing slash
      realm: config.realm,
      apiKey: config.apiKey,
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = \`\${this.config.url}\${endpoint}\`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.config.apiKey) {
      headers['Authorization'] = \`Bearer \${this.config.apiKey}\`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.text().catch(() => response.statusText);
      throw new Error(\`UBL API Error: \${response.status} - \${error}\`);
    }

    return response.json();
  }

  /**
   * Chat with AI agent
   */
  async chat(
    message: string,
    sessionId?: string
  ): Promise<ChatResponse> {
    const body: ChatRequest = {
      message,
      sessionId,
    };

    if (!sessionId) {
      body.startSession = {
        realmId: this.config.realm,
        actor: { type: 'Anonymous' },
      };
    }

    return this.request<ChatResponse>('/chat', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  /**
   * Query UBL data
   */
  async query(request: QueryRequest): Promise<QueryResponse> {
    return this.request<QueryResponse>('/query', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Execute intent
   */
  async intend(intent: string, payload?: Record<string, any>): Promise<IntentResponse> {
    return this.request<IntentResponse>('/intent', {
      method: 'POST',
      body: JSON.stringify({
        intent,
        realm: this.config.realm,
        payload: payload || {},
      }),
    });
  }

  /**
   * Get available affordances
   */
  async getAffordances(): Promise<Array<{ id: string; label: string; action: string }>> {
    return this.request<Array<{ id: string; label: string; action: string }>>(
      \`/affordances?realm=\${this.config.realm}\`
    );
  }
}

// ============================================================================
// FACTORY
// ============================================================================

export function createLedgerClient(config: LedgerClientConfig): LedgerClient {
  return new LedgerClient(config);
}

// ============================================================================
// DEFAULT INSTANCE (using Vite env vars)
// ============================================================================

/**
 * Default ledger client instance.
 * 
 * Uses Vite environment variables:
 * - VITE_UBL_ANTENNA_URL: UBL Antenna URL (default: http://localhost:3000)
 * - VITE_REALM_ID: Realm ID (injected at generation time)
 * - VITE_UBL_API_KEY: API key (⚠️ visible in browser - use Realm-scoped keys)
 */
export const ledger = createLedgerClient({
  url: import.meta.env.VITE_UBL_ANTENNA_URL || 'http://localhost:3000',
  realm: import.meta.env.VITE_REALM_ID || '${realmId}',
  apiKey: import.meta.env.VITE_UBL_API_KEY,
});
`;
  }

  private dependenciesObject(deps: string[] = []) {
    const out: Record<string, string> = {};
    for (const d of deps) out[d] = 'latest';
    return out;
  }

  private async createTarGz(files: Record<string, string>): Promise<Buffer> {
    const pack = tar.pack();
    for (const [filepath, content] of Object.entries(files)) {
      // SECURITY: Validar e sanitizar caminho do arquivo
      const pathValidation = SecurityValidator.sanitizeFilePath(filepath);
      if (!pathValidation.valid) {
        throw new Error(`Invalid file path: ${filepath} - ${pathValidation.error}`);
      }
      
      // SECURITY: Validar tamanho do conteúdo (limitar a 10MB por arquivo)
      const maxFileSize = 10 * 1024 * 1024; // 10MB
      if (content.length > maxFileSize) {
        throw new Error(`File ${filepath} exceeds maximum size of ${maxFileSize} bytes`);
      }
      
      pack.entry({ name: pathValidation.sanitized }, content);
    }
    pack.finalize();

    const chunks: Buffer[] = [];
    const gzip = zlib.createGzip();
    return await new Promise<Buffer>((resolve, reject) => {
      pack.pipe(gzip)
        .on('data', chunk => chunks.push(chunk))
        .on('end', () => resolve(Buffer.concat(chunks)))
        .on('error', reject);
    });
  }

  private generateDockerfile(_customized: any): string {
    return `
FROM node:18
WORKDIR /app
COPY package.json .
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
    `.trim();
  }

  /**
   * Generate Tailwind config based on theme
   */
  private generateTailwindConfig(theme: any): string {
    const surfaceHover = this.addOpacity(theme.colors.surface, 0.8);
    const fontFamily = theme.fontFamily.split(',')[0].trim();
    
    return `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./frontend/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '${theme.colors.primary}',
        secondary: '${theme.colors.secondary}',
        accent: '${theme.colors.accent}',
        background: '${theme.colors.background}',
        surface: '${theme.colors.surface}',
        'surface-hover': '${surfaceHover}',
        text: '${theme.colors.text}',
        muted: '#94a3b8',
        border: '#e2e8f0',
      },
      fontFamily: {
        sans: ['${fontFamily}', 'sans-serif'],
      },
      borderRadius: {
        token: '${theme.borderRadius}',
      }
    },
  },
  plugins: [],
}
`;
  }

  /**
   * Generate global CSS with Tailwind and component classes
   */
  private generateGlobalCSS(theme: any): string {
    const shadowClass = theme.componentStyle === 'shadow' ? 'shadow-md' : '';
    const borderClass = theme.componentStyle === 'bordered' ? 'border border-border' : '';
    
    return `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  background-color: ${theme.colors.background};
  color: ${theme.colors.text};
  font-family: ${theme.fontFamily};
}

/* Component Classes (Abstrações) */
@layer components {
  .btn {
    @apply px-4 py-2 rounded-token font-medium transition-all duration-200 active:scale-95;
  }
  .btn-primary {
    @apply bg-primary text-white hover:opacity-90 shadow-lg shadow-primary/20;
  }
  .btn-secondary {
    @apply bg-surface ${borderClass} text-text hover:bg-gray-50;
  }
  .btn-ghost {
    @apply text-muted hover:text-primary hover:bg-primary/5;
  }
  
  .input {
    @apply w-full px-3 py-2 bg-surface ${borderClass} rounded-token focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all;
  }
  
  .card {
    @apply bg-surface ${borderClass} rounded-token p-4 ${shadowClass};
  }

  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: ${theme.colors.primary}40;
    border-radius: 3px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: ${theme.colors.primary}60;
  }
}

/* Animations */
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-out;
}
`;
  }

  /**
   * Generate AutoForm component
   */
  private generateAutoForm(): string {
    return `import React from 'react';
import { useForm } from 'react-hook-form';
import { Send } from 'lucide-react';

interface SchemaProperty {
  type: string;
  description?: string;
  enum?: string[];
  format?: string;
}

interface AutoFormProps {
  schema: {
    properties: Record<string, SchemaProperty>;
    required?: string[];
  };
  onSubmit: (data: any) => Promise<void>;
  loading?: boolean;
  submitLabel?: string;
}

export default function AutoForm({ schema, onSubmit, loading, submitLabel = 'Salvar' }: AutoFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm();
  
  // Ordenar campos: obrigatórios primeiro
  const fields = Object.entries(schema.properties).sort(([keyA], [keyB]) => {
    const isReqA = schema.required?.includes(keyA);
    const isReqB = schema.required?.includes(keyB);
    return (isReqA === isReqB) ? 0 : isReqA ? -1 : 1;
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map(([key, prop]) => {
          const isRequired = schema.required?.includes(key);
          const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());

          return (
            <div key={key} className="flex flex-col gap-1">
              <label className="text-sm font-medium text-text flex gap-1">
                {label}
                {isRequired && <span className="text-red-500">*</span>}
              </label>
              
              {prop.enum ? (
                <select
                  {...register(key, { required: isRequired })}
                  className="input bg-surface"
                >
                  <option value="">Selecione...</option>
                  {prop.enum.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : prop.type === 'number' ? (
                <input
                  type="number"
                  {...register(key, { required: isRequired, valueAsNumber: true })}
                  className="input"
                  placeholder={prop.description}
                />
              ) : prop.format === 'date' ? (
                 <input
                  type="date"
                  {...register(key, { required: isRequired })}
                  className="input"
                />
              ) : (
                <input
                  type="text"
                  {...register(key, { required: isRequired })}
                  className="input"
                  placeholder={prop.description}
                />
              )}
              
              {errors[key] && (
                <span className="text-xs text-red-500">Campo obrigatório</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-end pt-4">
        <button type="submit" disabled={loading} className="btn btn-primary flex items-center gap-2">
           {loading ? 'Processando...' : <>{submitLabel} <Send size={16} /></>}
        </button>
      </div>
    </form>
  );
}
`;
  }

  /**
   * Generate DashboardWidgets component
   */
  private generateDashboardWidgets(): string {
    return `import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Helper para agrupar dados para gráficos
const processData = (data: any[], config: any) => {
  if (!data || data.length === 0) return [];

  if (config.type === 'pie') {
    const grouped = data.reduce((acc: any, curr: any) => {
      const key = curr[config.groupKey] || 'Outros';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  }

  if (config.type === 'bar') {
    return data.map(item => ({
      ...item,
      [config.xKey]: new Date(item[config.xKey]).toLocaleDateString()
    })).slice(0, 10);
  }
  return data;
};

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const DashboardWidget = ({ title, type, data, config }: any) => {
  const chartData = useMemo(() => processData(data, config), [data, config]);

  return (
    <div className="card h-[300px] flex flex-col">
      <h3 className="text-lg font-semibold text-primary mb-4">{title}</h3>
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          {type === 'bar' ? (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey={config.xKey} style={{ fontSize: 12 }} />
              <YAxis style={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} 
              />
              <Bar dataKey={config.yKey} fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : (
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {chartData.map((entry: any, index: number) => (
                  <Cell key={\`cell-\${index}\`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
`;
  }

  /**
   * Generate DataGrid component
   */
  private generateDataGrid(): string {
    return `import React, { useState } from 'react';
import { Search, ChevronRight } from 'lucide-react';

interface Column {
  key: string;
  label: string;
  type?: 'text' | 'currency' | 'date' | 'status';
}

export default function DataGrid({ data, columns, onRowClick }: any) {
  const [search, setSearch] = useState('');

  const filteredData = data.filter((item: any) => 
    Object.values(item).some(val => 
      String(val).toLowerCase().includes(search.toLowerCase())
    )
  );

  const formatValue = (val: any, type?: string) => {
    if (!val) return '-';
    if (type === 'currency') return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    if (type === 'date') return new Date(val).toLocaleDateString();
    if (type === 'status') {
      const colors: any = { active: 'bg-green-100 text-green-800', pending: 'bg-yellow-100 text-yellow-800', draft: 'bg-gray-100 text-gray-800' };
      const color = colors[String(val).toLowerCase()] || 'bg-blue-100 text-blue-800';
      return <span className={\`px-2 py-1 rounded-full text-xs font-medium \${color}\`}>{val}</span>;
    }
    return val;
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
        <input 
          type="text" 
          placeholder="Buscar..." 
          className="input pl-10"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      
      <div className="overflow-hidden border border-border rounded-token bg-surface shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-background text-muted uppercase text-xs font-semibold">
            <tr>
              {columns.map((col: Column) => (
                <th key={col.key} className="px-6 py-3">{col.label}</th>
              ))}
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredData.map((row: any, i: number) => (
              <tr 
                key={i} 
                onClick={() => onRowClick && onRowClick(row)}
                className="hover:bg-surface-hover cursor-pointer transition-colors"
              >
                {columns.map((col: Column) => (
                  <td key={col.key} className="px-6 py-4 whitespace-nowrap text-text">
                    {formatValue(row[col.key], col.type)}
                  </td>
                ))}
                <td className="px-6 py-4 text-right text-muted">
                   <ChevronRight size={16} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredData.length === 0 && (
          <div className="p-8 text-center text-muted">Nenhum dado encontrado</div>
        )}
      </div>
    </div>
  );
}
`;
  }

  /**
   * Generate main.tsx entry point
   */
  private generateMainTsx(): string {
    return `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
`;
  }

  /**
   * Generate index.html with font imports
   */
  private generateIndexHtml(title: string, theme: any): string {
    // Map font families to Google Fonts URLs
    const fontMap: Record<string, string> = {
      'Inter': 'Inter:wght@400;600',
      'Plus Jakarta Sans': 'Plus+Jakarta+Sans:wght@400;600',
      'Roboto Mono': 'Roboto+Mono:wght@400',
      'Merriweather': 'Merriweather:wght@400;700',
      'Poppins': 'Poppins:wght@400;600',
    };
    
    const fontFamily = theme.fontFamily.split(',')[0].trim();
    const fontUrl = fontMap[fontFamily] || 'Inter:wght@400;600';
    const fontLink = 'https://fonts.googleapis.com/css2?family=' + fontUrl + '&display=swap';
    
    const htmlContent = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <!-- Font imports based on theme -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="${fontLink}" rel="stylesheet">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/frontend/main.tsx"></script>
  </body>
</html>`;
    return htmlContent;
  }

  /**
   * Helper to add opacity to hex color
   */
  private addOpacity(hex: string, opacity: number): string {
    // Simple implementation - assumes hex color
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + opacity + ')';
  }
}