
import { Generator } from './generator/core.js';
import { selectTheme } from './generator/themes.js';
import { selectLayout } from './generator/layouts.js';
import * as fs from 'fs';
import * as path from 'path';

const generator = new Generator();

const testConfig = {
  "templateId": "invoice-manager",
  "answers": {
    "toolId": "test-invoice-1764730279552",
    "companyName": "Finance Corp",
    "industry": "finance",
    "users": 50,
    "features": [
      "invoicing",
      "payments",
      "reports"
    ],
    "integrations": [],
    "deployTarget": "docker"
  },
  "userId": "test-user-123",
  "deployTarget": "docker"
};

async function run() {
  console.log('🎨 Selecionando tema e layout...');
  const theme = selectTheme(testConfig.answers.industry);
  const layout = selectLayout(testConfig.templateId);
  
  console.log(`   ✅ Tema: ${theme.name} (${theme.id})`);
  console.log(`   ✅ Layout: ${layout}`);
  console.log(`   🎨 Cores: Primary=${theme.colors.primary}, Background=${theme.colors.background}`);
  console.log(`   🔤 Fonte: ${theme.fontFamily}
`);
  
  console.log('⚙️  Gerando ferramenta...');
  
  const result = await generator.generate({
    templateId: testConfig.templateId,
    answers: testConfig.answers,
    userId: testConfig.userId,
    deployTarget: testConfig.deployTarget
  }, (progress) => {
    process.stdout.write(`\r   📈 ${progress.progress}% - ${progress.message}`);
  });
  
  console.log('\n\n✅ Geração concluída!\n');
  
  // Salvar resultado
  const outputDir = path.join(process.cwd(), 'test-output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Salvar package
  const packageFile = path.join(outputDir, `tool-${result.id}.tar.gz`);
  fs.writeFileSync(packageFile, result.deployment.package);
  
  // Salvar código para inspeção
  const codeDir = path.join(outputDir, `tool-${result.id}-code`);
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
  console.log(`   ${hasTailwind ? '✅' : '❌'} Tailwind CSS (className)`);
  console.log(`   ${hasLayout ? '✅' : '❌'} Componente Layout`);
  console.log(`   ${hasThemeColors ? '✅' : '❌'} Classes de tema`);
  
  console.log(`\n📦 Arquivos salvos:`);
  console.log(`   Package: ${packageFile}`);
  console.log(`   Código: ${codeDir}`);
  console.log(`\n🎉 Ferramenta gerada com sucesso!`);
  console.log(`   Tema aplicado: ${theme.name}`);
  console.log(`   Layout: ${layout}`);
}

run().catch(console.error);
