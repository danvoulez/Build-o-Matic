#!/usr/bin/env node

/**
 * Script de Teste - Motor de Estilo
 * 
 * Gera uma ferramenta de teste para validar o sistema de temas e layouts.
 */

import { Generator } from '../generator/core.js';
import { selectTheme } from '../generator/themes.js';
import { selectLayout } from '../generator/layouts.js';
import fs from 'fs';
import path from 'path';

const generator = new Generator();

// Dados de teste
const testAnswers = {
  toolId: 'test-theme-' + Date.now(),
  companyName: 'Test Company',
  industry: 'finance', // Vai gerar tema Corporate
  users: 10,
  features: ['invoicing', 'payments'],
  integrations: [],
  deployTarget: 'docker'
};

async function testGeneration() {
  console.log('🧪 TESTE DE GERAÇÃO - Motor de Estilo\n');
  
  // 1. Verificar seleção de tema
  console.log('1️⃣ Testando seleção de tema...');
  const theme = selectTheme(testAnswers.industry);
  console.log(`   ✅ Tema selecionado: ${theme.name} (${theme.id})`);
  console.log(`   📊 Cores: Primary=${theme.colors.primary}, Background=${theme.colors.background}`);
  console.log(`   🔤 Fonte: ${theme.fontFamily}`);
  console.log(`   📐 Border Radius: ${theme.borderRadius}`);
  console.log(`   🎨 Estilo: ${theme.componentStyle}\n`);

  // 2. Verificar seleção de layout
  console.log('2️⃣ Testando seleção de layout...');
  const layoutType = selectLayout('invoice-manager');
  console.log(`   ✅ Layout selecionado: ${layoutType}\n`);

  // 3. Gerar ferramenta
  console.log('3️⃣ Gerando ferramenta de teste...');
  try {
    const result = await generator.generate({
      templateId: 'invoice-manager',
      answers: testAnswers,
      userId: 'test-user',
      deployTarget: 'docker'
    }, (progress) => {
      process.stdout.write(`\r   📈 Progresso: ${progress.progress}% - ${progress.message}`);
    });
    
    console.log('\n\n   ✅ Geração concluída!');
    console.log(`   📦 Tool ID: ${result.id}`);
    console.log(`   🎨 Tema aplicado: ${result.config.settings?.theme?.name || 'N/A'}`);
    console.log(`   📐 Layout: ${result.config.settings?.layoutType || 'N/A'}\n`);

    // 4. Verificar arquivos gerados
    console.log('4️⃣ Verificando arquivos gerados...');
    const packageBuffer = result.deployment.package;
    console.log(`   ✅ Package gerado: ${(packageBuffer.length / 1024).toFixed(2)} KB`);
    
    // Salvar package para inspeção
    const outputDir = path.join(process.cwd(), 'test-output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const outputFile = path.join(outputDir, `test-tool-${result.id}.tar.gz`);
    fs.writeFileSync(outputFile, packageBuffer);
    console.log(`   💾 Package salvo em: ${outputFile}\n`);

    // 5. Verificar estrutura do código
    console.log('5️⃣ Verificando estrutura do código...');
    if (result.code.frontend) {
      const hasTailwind = result.code.frontend.includes('className');
      const hasLayout = result.code.frontend.includes('Layout');
      const hasLucide = result.code.frontend.includes('lucide-react');
      
      console.log(`   ${hasTailwind ? '✅' : '❌'} Tailwind CSS (className)`);
      console.log(`   ${hasLayout ? '✅' : '❌'} Componente Layout`);
      console.log(`   ${hasLucide ? '✅' : '❌'} Ícones Lucide`);
    }
    
    if (result.code.layout) {
      console.log(`   ✅ Layout gerado: ${result.code.layout.length} caracteres`);
    }

    console.log('\n✅ TESTE CONCLUÍDO COM SUCESSO!\n');
    console.log('📋 Resumo:');
    console.log(`   - Tema: ${theme.name}`);
    console.log(`   - Layout: ${layoutType}`);
    console.log(`   - Package: ${outputFile}`);
    console.log(`   - Tamanho: ${(packageBuffer.length / 1024).toFixed(2)} KB\n`);

  } catch (error) {
    console.error('\n❌ Erro na geração:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Executar teste
testGeneration().catch(console.error);

