#!/usr/bin/env node

/**
 * 🔧 SCRIPT DE INTEGRAÇÃO UBL + BUILD-O-MATIC
 * 
 * Este script automatiza a integração do Universal Business Ledger
 * como protagonista do Build-o-Matic.
 * 
 * O que faz:
 * 1. Cria UBL client package
 * 2. Adapta templates (remove backend/database, adiciona intents/agreements)
 * 3. Modifica generator para usar UBL
 * 4. Adapta packager para incluir UBL client
 * 5. Adapta deployer para deploy apenas frontend
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🚀 Iniciando integração UBL + Build-o-Matic...\n');

// ============================================================================
// 1. CRIAR UBL CLIENT PACKAGE
// ============================================================================

function createUBLClient() {
  console.log('📦 1/5: Criando UBL Client Package...');
  
  const clientDir = path.join(rootDir, 'packages', 'ubl-client');
  const srcDir = path.join(clientDir, 'src');
  
  // Criar diretórios
  fs.mkdirSync(srcDir, { recursive: true });
  
  // package.json
  const packageJson = {
    name: '@build-o-matic/ubl-client',
    version: '0.1.0',
    type: 'module',
    main: 'dist/index.js',
    types: 'dist/index.d.ts',
    exports: {
      '.': './dist/index.js'
    },
    dependencies: {
      '@universal-business-ledger/client': 'file:../../Universal-Business-Ledger'
    },
    scripts: {
      build: 'tsc',
      dev: 'tsc --watch'
    }
  };
  
  fs.writeFileSync(
    path.join(clientDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );
  
  // index.ts
  const clientCode = `/**
 * UBL Client for Build-o-Matic Generated Tools
 * 
 * Wrapper around Universal Business Ledger client
 */

import type { EntityId, ActorReference } from '@universal-business-ledger/core';

export interface LedgerClientConfig {
  url: string;
  realm: EntityId;
  apiKey?: string;
}

export interface IntentRequest {
  intent: string;
  agreementType?: string;
  parties?: Array<{ entityId: EntityId; role: string }>;
  terms?: Record<string, any>;
  payload?: Record<string, any>;
}

export interface QueryRequest {
  type: 'entities' | 'agreements' | 'events';
  filters?: Record<string, any>;
  realm?: EntityId;
}

export class LedgerClient {
  private config: LedgerClientConfig;
  private baseUrl: string;

  constructor(config: LedgerClientConfig) {
    this.config = config;
    this.baseUrl = config.url.replace(/\\/$/, '');
  }

  async proposeIntent(request: IntentRequest) {
    const response = await fetch(\`\${this.baseUrl}/intend\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.apiKey && { 'Authorization': \`Bearer \${this.config.apiKey}\` })
      },
      body: JSON.stringify({
        intent: request.intent,
        realm: this.config.realm,
        payload: {
          agreementType: request.agreementType,
          parties: request.parties,
          terms: request.terms,
          ...request.payload
        }
      })
    });

    if (!response.ok) {
      throw new Error(\`Intent failed: \${response.statusText}\`);
    }

    return await response.json();
  }

  async query(request: QueryRequest) {
    const response = await fetch(\`\${this.baseUrl}/query\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.apiKey && { 'Authorization': \`Bearer \${this.config.apiKey}\` })
      },
      body: JSON.stringify({
        ...request,
        realm: request.realm || this.config.realm
      })
    });

    if (!response.ok) {
      throw new Error(\`Query failed: \${response.statusText}\`);
    }

    return await response.json();
  }

  async chat(message: string, sessionId?: string) {
    const response = await fetch(\`\${this.baseUrl}/chat\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.apiKey && { 'Authorization': \`Bearer \${this.config.apiKey}\` })
      },
      body: JSON.stringify({
        message,
        sessionId,
        startSession: !sessionId
      })
    });

    if (!response.ok) {
      throw new Error(\`Chat failed: \${response.statusText}\`);
    }

    return await response.json();
  }

  createWebSocket(onMessage: (data: any) => void) {
    const wsUrl = this.baseUrl.replace('http', 'ws') + '/subscribe';
    const ws = new WebSocket(wsUrl);
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (e) {
        console.error('WebSocket parse error:', e);
      }
    };

    return ws;
  }
}

export function createLedgerClient(config: LedgerClientConfig): LedgerClient {
  return new LedgerClient(config);
}

// Convenience exports
export const ledger = {
  intents: {
    propose: async (client: LedgerClient, request: IntentRequest) => {
      return await client.proposeIntent({
        intent: 'propose:agreement',
        ...request
      });
    },
    execute: async (client: LedgerClient, request: IntentRequest) => {
      return await client.proposeIntent(request);
    }
  },
  query: async (client: LedgerClient, request: QueryRequest) => {
    return await client.query(request);
  },
  chat: async (client: LedgerClient, message: string, sessionId?: string) => {
    return await client.chat(message, sessionId);
  }
};
`;

  fs.writeFileSync(path.join(srcDir, 'index.ts'), clientCode);
  
  // tsconfig.json
  const tsconfig = {
    compilerOptions: {
      target: 'ES2022',
      module: 'ESNext',
      lib: ['ES2022', 'DOM'],
      outDir: './dist',
      rootDir: './src',
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      moduleResolution: 'node',
      resolveJsonModule: true,
      declaration: true,
      declarationMap: true
    },
    include: ['src/**/*'],
    exclude: ['node_modules', 'dist']
  };
  
  fs.writeFileSync(
    path.join(clientDir, 'tsconfig.json'),
    JSON.stringify(tsconfig, null, 2)
  );
  
  console.log('   ✅ UBL Client package criado\n');
}

// ============================================================================
// 2. ADAPTAR TEMPLATES
// ============================================================================

function adaptTemplates() {
  console.log('📝 2/5: Adaptando templates...');
  
  const templatesDir = path.join(rootDir, 'templates');
  const templateDirs = fs.readdirSync(templatesDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);
  
  let adapted = 0;
  
  for (const templateId of templateDirs) {
    const templateDir = path.join(templatesDir, templateId);
    const configPath = path.join(templateDir, 'config.ts');
    
    if (!fs.existsSync(configPath)) continue;
    
    try {
      let content = fs.readFileSync(configPath, 'utf-8');
      
      // Remover backend template
      content = content.replace(
        /const backendTemplate = `[\s\S]*?`;/g,
        '// Backend removed - using UBL instead'
      );
      
      // Remover database template
      content = content.replace(
        /const databaseTemplate = `[\s\S]*?`;/g,
        '// Database removed - using UBL event store instead'
      );
      
      // Adicionar intents template se não existir
      if (!content.includes('intentsTemplate')) {
        const intentsTemplate = `
const intentsTemplate = \`// Intents específicos para ${templateId}
export const ${templateId}Intents = {
  // Adicione seus intents aqui
  // Exemplo:
  // 'create:item': {
  //   agreementType: 'Item',
  //   schema: { ... }
  // }
};
\`;`;
        
        // Inserir após frontendTemplate
        const frontendMatch = content.match(/const frontendTemplate = `[\s\S]*?`;/);
        if (frontendMatch) {
          const insertPos = frontendMatch.index + frontendMatch[0].length;
          content = content.slice(0, insertPos) + intentsTemplate + content.slice(insertPos);
        }
      }
      
      // Adicionar agreements template se não existir
      if (!content.includes('agreementsTemplate')) {
        const agreementsTemplate = `
const agreementsTemplate = \`// Agreements específicos para ${templateId}
export const ${templateId}Agreements = {
  // Configure seus agreements aqui
  // Exemplo:
  // Item: {
  //   parties: ['Owner', 'Creator'],
  //   obligations: [...],
  //   assets: [...]
  // }
};
\`;`;
        
        // Inserir após intentsTemplate
        const intentsMatch = content.match(/const intentsTemplate = `[\s\S]*?`;/);
        if (intentsMatch) {
          const insertPos = intentsMatch.index + intentsMatch[0].length;
          content = content.slice(0, insertPos) + agreementsTemplate + content.slice(insertPos);
        } else {
          // Se não tem intents, inserir após frontend
          const frontendMatch = content.match(/const frontendTemplate = `[\s\S]*?`;/);
          if (frontendMatch) {
            const insertPos = frontendMatch.index + frontendMatch[0].length;
            content = content.slice(0, insertPos) + agreementsTemplate + content.slice(insertPos);
          }
        }
      }
      
      // Atualizar codeTemplates no template object
      content = content.replace(
        /codeTemplates:\s*\{[^}]*backend:[^,]*,[^}]*frontend:[^,]*,[^}]*database:[^}]*\}/s,
        `codeTemplates: {
    // Frontend que conecta ao UBL
    frontend: frontendTemplate,
    // Intents específicos (lógicas de negócio)
    intents: intentsTemplate,
    // Configuração de Agreements
    agreements: agreementsTemplate
  }`
      );
      
      // Adicionar import do UBL client no frontend template
      content = content.replace(
        /const frontendTemplate = `/,
        'const frontendTemplate = `import { createLedgerClient } from \'@build-o-matic/ubl-client\';\n\nconst ledger = createLedgerClient({\n  url: process.env.UBL_ANTENNA_URL || \'http://localhost:3000\',\n  realm: process.env.REALM_ID || \'default-realm\'\n});\n\n'
      );
      
      fs.writeFileSync(configPath, content);
      adapted++;
      console.log(`   ✅ ${templateId} adaptado`);
    } catch (error) {
      console.error(`   ⚠️  Erro ao adaptar ${templateId}:`, error.message);
    }
  }
  
  console.log(`   ✅ ${adapted} templates adaptados\n`);
}

// ============================================================================
// 3. MODIFICAR GENERATOR
// ============================================================================

function adaptGenerator() {
  console.log('⚙️  3/5: Adaptando generator...');
  
  // Customizer
  const customizerPath = path.join(rootDir, 'generator', 'customizer.ts');
  let customizer = fs.readFileSync(customizerPath, 'utf-8');
  
  // Remover processamento de backend e database
  customizer = customizer.replace(
    /const backend = this\.customizeAndTrim\(template\.codeTemplates\.backend, answers\);/g,
    '// Backend removed - using UBL'
  );
  customizer = customizer.replace(
    /const database = this\.customizeAndTrim\(template\.codeTemplates\.database, answers\);/g,
    '// Database removed - using UBL event store'
  );
  
  // Adicionar processamento de intents e agreements
  customizer = customizer.replace(
    /const frontend = this\.customizeAndTrim\(template\.codeTemplates\.frontend, answers\);/,
    `const frontend = this.customizeAndTrim(template.codeTemplates.frontend, answers);
    const intents = this.customizeAndTrim(template.codeTemplates.intents || '', answers);
    const agreements = this.customizeAndTrim(template.codeTemplates.agreements || '', answers);`
  );
  
  // Atualizar retorno
  customizer = customizer.replace(
    /return \{\s*code: \{ backend, frontend, database \},/,
    `return {
      code: { frontend, intents, agreements },`
  );
  
  // Atualizar generateConfig para incluir UBL_URL
  customizer = customizer.replace(
    /const env = \{[\s\S]*?\};/,
    `const env = {
      NODE_ENV: 'production',
      TOOL_ID: answers.toolId ?? '',
      COMPANY_NAME: answers.companyName ?? 'Company',
      UBL_ANTENNA_URL: process.env.UBL_ANTENNA_URL || 'http://localhost:3000',
      REALM_ID: `realm-${answers.toolId || 'default'}`,
    };`
  );
  
  fs.writeFileSync(customizerPath, customizer);
  console.log('   ✅ Customizer adaptado');
  
  // Core
  const corePath = path.join(rootDir, 'generator', 'core.ts');
  let core = fs.readFileSync(corePath, 'utf-8');
  
  // Atualizar interface GeneratedTool
  core = core.replace(
    /code: \{ backend: string; frontend: string; database: string \};/,
    `code: { 
      frontend: string; 
      intents: string; 
      agreements: string;
    };`
  );
  
  fs.writeFileSync(corePath, core);
  console.log('   ✅ Core adaptado\n');
}

// ============================================================================
// 4. ADAPTAR PACKAGER
// ============================================================================

function adaptPackager() {
  console.log('📦 4/5: Adaptando packager...');
  
  const packagerPath = path.join(rootDir, 'generator', 'packager.ts');
  let packager = fs.readFileSync(packagerPath, 'utf-8');
  
  // Substituir basicFiles
  const newBasicFiles = `
  private basicFiles(customized: any, target: string, realmId: string) {
    return {
      // Frontend que conecta ao UBL
      'frontend/App.tsx': customized.code.frontend,
      'frontend/ledger-client.ts': `import { createLedgerClient } from '@build-o-matic/ubl-client';\n\nexport const ledger = createLedgerClient({\n  url: process.env.UBL_ANTENNA_URL || 'http://localhost:3000',\n  realm: '${realmId}',\n  apiKey: process.env.UBL_API_KEY\n});\n`,
      // Intents específicos
      'intents/index.ts': customized.code.intents,
      // Configuração de Agreements
      'agreements/config.ts': customized.code.agreements,
      // Configuração do Realm
      'realm/config.json': JSON.stringify({
        id: realmId,
        name: customized.config.settings?.companyName || 'Generated Tool',
        agreements: 'See agreements/config.ts'
      }, null, 2),
      // package.json com dependência do UBL
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
          '@build-o-matic/ubl-client': '^0.1.0',
          'react': '^18.0.0',
          'react-dom': '^18.0.0',
          ...(customized.config.dependencies || [])
            .filter(d => d.startsWith('react') || d.startsWith('@'))
            .reduce((acc, dep) => {
              const [name, version] = dep.includes('@') ? dep.split('@') : [dep, 'latest'];
              acc[name] = version || 'latest';
              return acc;
            }, {})
        },
        devDependencies: {
          '@vitejs/plugin-react': '^4.0.0',
          'vite': '^5.0.0',
          'typescript': '^5.0.0'
        }
      }, null, 2),
      // vite.config.ts
      'vite.config.ts': `import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\n\nexport default defineConfig({\n  plugins: [react()],\n  server: {\n    port: 5173,\n    proxy: {\n      '/api': {\n        target: process.env.UBL_ANTENNA_URL || 'http://localhost:3000',\n        changeOrigin: true\n      }\n    }\n  }\n});\n`,
      // .env.example
      '.env.example': `UBL_ANTENNA_URL=http://localhost:3000\nREALM_ID=${realmId}\nUBL_API_KEY=your-api-key-here\n`,
      // README.md
      'README.md': `# Generated Tool\n\nThis tool was generated by Build-o-Matic and uses Universal Business Ledger as its backend.\n\n## Setup\n\n1. Install dependencies:\n   \`\`\`bash\n   npm install\n   \`\`\`\n\n2. Configure environment:\n   \`\`\`bash\n   cp .env.example .env\n   # Edit .env with your UBL Antenna URL\n   \`\`\`\n\n3. Run development server:\n   \`\`\`bash\n   npm run dev\n   \`\`\`\n\n## Backend\n\nThis tool uses Universal Business Ledger (UBL) as its backend.\nThe UBL Antenna should be running at the URL specified in \`.env\`.\n\n## Deployment\n\nDeploy as a static site (Netlify, Vercel, etc.) and configure the UBL_ANTENNA_URL environment variable.\n`
    };
  }`;
  
  packager = packager.replace(
    /private basicFiles\(customized: any, target: string\) \{[\s\S]*?\};/,
    newBasicFiles
  );
  
  // Atualizar chamadas para basicFiles para incluir realmId
  packager = packager.replace(
    /const files = this\.basicFiles\(customized, 'railway'\);/g,
    'const realmId = `realm-${customized.config.settings?.toolId || Date.now()}`;\n    const files = this.basicFiles(customized, \'railway\', realmId);'
  );
  packager = packager.replace(
    /const files = this\.basicFiles\(customized, 'render'\);/g,
    'const realmId = `realm-${customized.config.settings?.toolId || Date.now()}`;\n    const files = this.basicFiles(customized, \'render\', realmId);'
  );
  packager = packager.replace(
    /const files = this\.basicFiles\(customized, 'docker'\);/g,
    'const realmId = `realm-${customized.config.settings?.toolId || Date.now()}`;\n    const files = this.basicFiles(customized, \'docker\', realmId);'
  );
  
  // Remover referências a backend e database
  packager = packager.replace(
    /'backend\/index\.ts': customized\.code\.backend,/g,
    '// Backend removed - using UBL'
  );
  packager = packager.replace(
    /'database\/schema\.sql': customized\.code\.database,/g,
    '// Database removed - using UBL event store'
  );
  
  fs.writeFileSync(packagerPath, packager);
  console.log('   ✅ Packager adaptado\n');
}

// ============================================================================
// 5. ADAPTAR DEPLOYER
// ============================================================================

function adaptDeployer() {
  console.log('🚀 5/5: Adaptando deployer...');
  
  const orchestratorPath = path.join(rootDir, 'deployer', 'orchestrator.ts');
  
  if (fs.existsSync(orchestratorPath)) {
    let orchestrator = fs.readFileSync(orchestratorPath, 'utf-8');
    
    // Adicionar função para registrar Realm no UBL
    const registerRealmFunction = `
  /**
   * Register Realm in UBL
   */
  private async registerRealm(realmId: string, realmName: string, agreements: string, ublUrl: string): Promise<void> {
    try {
      const response = await fetch(`${ublUrl}/realms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: realmId,
          name: realmName,
          agreements: agreements
        })
      });
      
      if (!response.ok) {
        console.warn(`Failed to register realm ${realmId}, but continuing...`);
      }
    } catch (error) {
      console.warn(`Error registering realm ${realmId}:`, error);
      // Não falhar o deploy se o registro falhar
    }
  }
`;
    
    // Inserir função antes do método deploy
    const deployMatch = orchestrator.match(/(async\s+deploy\s*\([^)]*\)\s*\{)/);
    if (deployMatch) {
      const insertPos = deployMatch.index;
      orchestrator = orchestrator.slice(0, insertPos) + registerRealmFunction + '\n' + orchestrator.slice(insertPos);
    }
    
    // Modificar deploy para registrar realm
    orchestrator = orchestrator.replace(
      /(async\s+deploy\s*\([^)]*\)\s*\{[\s\S]*?)(\/\/ Deploy backend|const backendUrl)/,
      `$1      // Register realm in UBL
      const ublUrl = process.env.UBL_ANTENNA_URL || 'http://localhost:3000';
      const realmId = tool.realm?.id || `realm-${tool.id}`;
      await this.registerRealm(realmId, tool.realm?.name || 'Generated Tool', tool.code.agreements, ublUrl);
      
      // Deploy frontend only (UBL is already deployed)
      // $2`
    );
    
    fs.writeFileSync(orchestratorPath, orchestrator);
    console.log('   ✅ Orchestrator adaptado');
  }
  
  console.log('   ✅ Deployer adaptado\n');
}

// ============================================================================
// EXECUTAR
// ============================================================================

try {
  createUBLClient();
  adaptTemplates();
  adaptGenerator();
  adaptPackager();
  adaptDeployer();
  
  console.log('✅ Integração UBL concluída com sucesso!');
  console.log('\n📋 Próximos passos:');
  console.log('   1. Instalar dependências: npm install');
  console.log('   2. Buildar UBL client: cd packages/ubl-client && npm run build');
  console.log('   3. Testar geração de uma ferramenta');
  console.log('   4. Verificar se frontend conecta ao UBL');
  console.log('\n🎉 Build-o-Matic agora usa UBL como protagonista!');
} catch (error) {
  console.error('❌ Erro durante integração:', error);
  process.exit(1);
}

