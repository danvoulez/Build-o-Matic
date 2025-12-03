#!/usr/bin/env node

/**
 * 🔧 SCRIPT DE INTEGRAÇÃO UBL + BUILD-O-MATIC
 * 
 * Automatiza a integração do Universal Business Ledger
 * como protagonista do Build-o-Matic.
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
  
  fs.mkdirSync(srcDir, { recursive: true });
  
  const packageJson = {
    name: '@build-o-matic/ubl-client',
    version: '0.1.0',
    type: 'module',
    main: 'dist/index.js',
    types: 'dist/index.d.ts',
    exports: { '.': './dist/index.js' },
    dependencies: {},
    scripts: {
      build: 'tsc',
      dev: 'tsc --watch'
    }
  };
  
  fs.writeFileSync(
    path.join(clientDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );
  
  const clientCode = `/**
 * UBL Client for Build-o-Matic Generated Tools
 */

export interface LedgerClientConfig {
  url: string;
  realm: string;
  apiKey?: string;
}

export interface IntentRequest {
  intent: string;
  agreementType?: string;
  parties?: Array<{ entityId: string; role: string }>;
  terms?: Record<string, any>;
  payload?: Record<string, any>;
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

  async query(type: string, filters?: Record<string, any>) {
    const response = await fetch(\`\${this.baseUrl}/query\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.apiKey && { 'Authorization': \`Bearer \${this.config.apiKey}\` })
      },
      body: JSON.stringify({
        type,
        filters,
        realm: this.config.realm
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
}

export function createLedgerClient(config: LedgerClientConfig): LedgerClient {
  return new LedgerClient(config);
}
`;

  fs.writeFileSync(path.join(srcDir, 'index.ts'), clientCode);
  
  const tsconfig = {
    compilerOptions: {
      target: 'ES2022',
      module: 'ESNext',
      lib: ['ES2022', 'DOM'],
      outDir: './dist',
      rootDir: './src',
      strict: false,
      esModuleInterop: true,
      skipLibCheck: true,
      moduleResolution: 'node',
      declaration: true
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
      let changed = false;
      
      // Remover backend template
      if (content.includes('backendTemplate')) {
        content = content.replace(
          /const backendTemplate = `[\s\S]*?`;/g,
          '// Backend removed - using UBL instead'
        );
        changed = true;
      }
      
      // Remover database template
      if (content.includes('databaseTemplate')) {
        content = content.replace(
          /const databaseTemplate = `[\s\S]*?`;/g,
          '// Database removed - using UBL event store instead'
        );
        changed = true;
      }
      
      // Adicionar intents e agreements se não existirem
      if (!content.includes('intentsTemplate')) {
        const intentsCode = '\nconst intentsTemplate = `// Intents específicos\n`;';
        const frontendMatch = content.match(/const frontendTemplate = `[\s\S]*?`;/);
        if (frontendMatch) {
          const pos = frontendMatch.index + frontendMatch[0].length;
          content = content.slice(0, pos) + intentsCode + content.slice(pos);
          changed = true;
        }
      }
      
      if (!content.includes('agreementsTemplate')) {
        const agreementsCode = '\nconst agreementsTemplate = `// Agreements específicos\n`;';
        const intentsMatch = content.match(/const intentsTemplate = `[\s\S]*?`;/);
        if (intentsMatch) {
          const pos = intentsMatch.index + intentsMatch[0].length;
          content = content.slice(0, pos) + agreementsCode + content.slice(pos);
        } else {
          const frontendMatch = content.match(/const frontendTemplate = `[\s\S]*?`;/);
          if (frontendMatch) {
            const pos = frontendMatch.index + frontendMatch[0].length;
            content = content.slice(0, pos) + agreementsCode + content.slice(pos);
          }
        }
        changed = true;
      }
      
      // Atualizar codeTemplates
      if (content.includes('codeTemplates:')) {
        content = content.replace(
          /codeTemplates:\s*\{[^}]*backend:[^,]*,[^}]*frontend:[^,]*,[^}]*database:[^}]*\}/s,
          `codeTemplates: {
    frontend: frontendTemplate,
    intents: intentsTemplate,
    agreements: agreementsTemplate
  }`
        );
        changed = true;
      }
      
      if (changed) {
        fs.writeFileSync(configPath, content);
        adapted++;
        console.log(`   ✅ ${templateId} adaptado`);
      }
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
  
  // Remover backend e database
  customizer = customizer.replace(
    /const backend = this\.customizeAndTrim\(template\.codeTemplates\.backend, answers\);/g,
    '// Backend removed - using UBL'
  );
  customizer = customizer.replace(
    /const database = this\.customizeAndTrim\(template\.codeTemplates\.database, answers\);/g,
    '// Database removed - using UBL event store'
  );
  
  // Adicionar intents e agreements
  if (!customizer.includes('const intents =')) {
    customizer = customizer.replace(
      /const frontend = this\.customizeAndTrim\(template\.codeTemplates\.frontend, answers\);/,
      `const frontend = this.customizeAndTrim(template.codeTemplates.frontend, answers);
    const intents = this.customizeAndTrim(template.codeTemplates.intents || '', answers);
    const agreements = this.customizeAndTrim(template.codeTemplates.agreements || '', answers);`
    );
  }
  
  // Atualizar retorno
  customizer = customizer.replace(
    /return \{\s*code: \{ backend, frontend, database \},/,
    `return {
      code: { frontend, intents, agreements },`
  );
  
  // Atualizar env vars
  customizer = customizer.replace(
    /DATABASE_URL: '{{DATABASE_URL}}',/,
    `UBL_ANTENNA_URL: process.env.UBL_ANTENNA_URL || 'http://localhost:3000',
      REALM_ID: \`realm-\${answers.toolId || 'default'}\`,`
  );
  
  fs.writeFileSync(customizerPath, customizer);
  console.log('   ✅ Customizer adaptado');
  
  // Core
  const corePath = path.join(rootDir, 'generator', 'core.ts');
  let core = fs.readFileSync(corePath, 'utf-8');
  
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
  const newBasicFiles = `  private basicFiles(customized: any, target: string, realmId: string) {
    const ledgerClientCode = \`import { createLedgerClient } from '@build-o-matic/ubl-client';

export const ledger = createLedgerClient({
  url: process.env.UBL_ANTENNA_URL || 'http://localhost:3000',
  realm: '\${realmId}',
  apiKey: process.env.UBL_API_KEY
});
\`;

    return {
      'frontend/App.tsx': customized.code.frontend,
      'frontend/ledger-client.ts': ledgerClientCode,
      'intents/index.ts': customized.code.intents,
      'agreements/config.ts': customized.code.agreements,
      'realm/config.json': JSON.stringify({
        id: realmId,
        name: customized.config.settings?.companyName || 'Generated Tool'
      }, null, 2),
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
          'react-dom': '^18.0.0'
        },
        devDependencies: {
          '@vitejs/plugin-react': '^4.0.0',
          'vite': '^5.0.0',
          'typescript': '^5.0.0'
        }
      }, null, 2),
      '.env.example': \`UBL_ANTENNA_URL=http://localhost:3000
REALM_ID=\${realmId}
UBL_API_KEY=your-api-key-here
\`,
      'README.md': \`# Generated Tool

Uses Universal Business Ledger as backend.
Configure UBL_ANTENNA_URL in .env file.
\`
    };
  }`;
  
  packager = packager.replace(
    /private basicFiles\(customized: any, target: string\) \{[\s\S]*?\};/,
    newBasicFiles
  );
  
  // Atualizar chamadas
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
    
    // Adicionar comentário sobre UBL
    if (!orchestrator.includes('UBL')) {
      orchestrator = `// NOTE: This deployer now deploys frontend-only tools
// Backend is provided by Universal Business Ledger (UBL)
// UBL should be deployed separately and shared across all tools
\n${orchestrator}`;
    }
    
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

