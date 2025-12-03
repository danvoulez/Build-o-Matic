#!/usr/bin/env node

/**
 * Geração de Ferramenta de Teste - Motor de Estilo
 * 
 * Gera uma ferramenta completa usando o novo sistema de temas e layouts.
 */

import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Configuração de teste
const testConfig = {
  templateId: 'invoice-manager',
  answers: {
    toolId: 'test-invoice-' + Date.now(),
    companyName: 'Finance Corp',
    industry: 'finance', // Vai gerar tema Corporate
    users: 50,
    features: ['invoicing', 'payments', 'reports'],
    integrations: [],
    deployTarget: 'docker'
  },
  userId: 'test-user-123',
  deployTarget: 'docker'
};

async function generateTool() {
  console.log('🚀 GERANDO FERRAMENTA COM MOTOR DE ESTILO\n');
  console.log('📋 Configuração:');
  console.log(`   Template: ${testConfig.templateId}`);
  console.log(`   Empresa: ${testConfig.answers.companyName}`);
  console.log(`   Indústria: ${testConfig.answers.industry}`);
  console.log(`   Features: ${testConfig.answers.features.join(', ')}\n`);

  try {
    // Verificar se o TypeScript está compilado
    const distPath = path.join(projectRoot, 'server', 'dist');
    if (!fs.existsSync(distPath)) {
      console.log('📦 Compilando TypeScript...');
      try {
        execSync('npm run build:server', { 
          cwd: projectRoot, 
          stdio: 'inherit',
          timeout: 60000 
        });
      } catch (e) {
        console.log('⚠️  Compilação falhou, tentando com tsx...');
      }
    }

    // Tentar usar tsx para executar diretamente
    console.log('\n🔧 Usando tsx para executar Generator...\n');
    
    const generatorScript = `
import { Generator } from './generator/core.js';
import { selectTheme } from './generator/themes.js';
import { selectLayout } from './generator/layouts.js';
import * as fs from 'fs';
import * as path from 'path';

const generator = new Generator();

const testConfig = ${JSON.stringify(testConfig, null, 2)};

async function run() {
  console.log('🎨 Selecionando tema e layout...');
  const theme = selectTheme(testConfig.answers.industry);
  const layout = selectLayout(testConfig.templateId);
  
  console.log(\`   ✅ Tema: \${theme.name} (\${theme.id})\`);
  console.log(\`   ✅ Layout: \${layout}\`);
  console.log(\`   🎨 Cores: Primary=\${theme.colors.primary}, Background=\${theme.colors.background}\`);
  console.log(\`   🔤 Fonte: \${theme.fontFamily}\n\`);
  
  console.log('⚙️  Gerando ferramenta...');
  
  const result = await generator.generate({
    templateId: testConfig.templateId,
    answers: testConfig.answers,
    userId: testConfig.userId,
    deployTarget: testConfig.deployTarget
  }, (progress) => {
    process.stdout.write(\`\\r   📈 \${progress.progress}% - \${progress.message}\`);
  });
  
  console.log('\\n\\n✅ Geração concluída!\\n');
  
  // Salvar resultado
  const outputDir = path.join(process.cwd(), 'test-output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Salvar package
  const packageFile = path.join(outputDir, \`tool-\${result.id}.tar.gz\`);
  fs.writeFileSync(packageFile, result.deployment.package);
  
  // Salvar código para inspeção
  const codeDir = path.join(outputDir, \`tool-\${result.id}-code\`);
  fs.mkdirSync(codeDir, { recursive: true });
  
  fs.writeFileSync(path.join(codeDir, 'App.tsx'), result.code.frontend);
  if (result.code.layout) {
    fs.writeFileSync(path.join(codeDir, 'Layout.tsx'), result.code.layout);
  }
  fs.writeFileSync(path.join(codeDir, 'intents.ts'), result.code.intents);
  fs.writeFileSync(path.join(codeDir, 'agreements.ts'), result.code.agreements);
  
  // Verificar tema aplicado
  const hasTailwind = result.code.frontend.includes('className');
  const hasLayout = result.code.frontend.includes('Layout');
  const hasThemeColors = result.code.frontend.includes('primary') || result.code.frontend.includes('bg-primary');
  
  console.log('📊 Verificação do código gerado:');
  console.log(\`   \${hasTailwind ? '✅' : '❌'} Tailwind CSS (className)\`);
  console.log(\`   \${hasLayout ? '✅' : '❌'} Componente Layout\`);
  console.log(\`   \${hasThemeColors ? '✅' : '❌'} Classes de tema\`);
  
  console.log(\`\\n📦 Arquivos salvos:\`);
  console.log(\`   Package: \${packageFile}\`);
  console.log(\`   Código: \${codeDir}\`);
  console.log(\`\\n🎉 Ferramenta gerada com sucesso!\`);
  console.log(\`   Tema aplicado: \${theme.name}\`);
  console.log(\`   Layout: \${layout}\`);
}

run().catch(console.error);
`;

    const scriptPath = path.join(projectRoot, 'scripts', 'temp-generator-run.mjs');
    fs.writeFileSync(scriptPath, generatorScript);
    
    // Executar com tsx
    console.log('⚙️  Executando geração...\n');
    execSync(`npx tsx ${scriptPath}`, {
      cwd: projectRoot,
      stdio: 'inherit',
      timeout: 120000
    });
    
    // Limpar script temporário
    fs.unlinkSync(scriptPath);
    
  } catch (error) {
    console.error('\n❌ Erro na geração:', error.message);
    
    // Fallback: mostrar o que seria gerado
    console.log('\n📝 Modo de visualização (sem geração real):\n');
    
    const theme = {
      finance: { name: 'Enterprise Blue', id: 'corporate', colors: { primary: '#0f172a', background: '#f8fafc' }, fontFamily: 'Inter, sans-serif' },
      saas: { name: 'Modern SaaS', id: 'startup', colors: { primary: '#6366f1', background: '#ffffff' }, fontFamily: 'Plus Jakarta Sans, sans-serif' },
    }[testConfig.answers.industry] || theme.finance;
    
    const layout = testConfig.templateId === 'invoice-manager' ? 'dashboard' : 'chat-focus';
    
    console.log('✅ Configuração que seria aplicada:');
    console.log(`   Tema: ${theme.name} (${theme.id})`);
    console.log(`   Layout: ${layout}`);
    console.log(`   Cores: Primary=${theme.colors.primary}, Background=${theme.colors.background}`);
    console.log(`   Fonte: ${theme.fontFamily}`);
    console.log('\n💡 Para gerar realmente, certifique-se de que:');
    console.log('   1. TypeScript está compilado (npm run build:server)');
    console.log('   2. Dependências estão instaladas (npm install)');
    console.log('   3. Template invoice-manager existe e está configurado');
  }
}

generateTool();

