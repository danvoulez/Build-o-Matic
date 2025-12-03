#!/usr/bin/env node

/**
 * 🎯 SCRIPT PARA APLICAR MASTER TEMPLATE
 * 
 * Aplica o master template de alta qualidade a todos os templates,
 * customizando baseado no domínio e features de cada um.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🎯 Aplicando Master Template...\n');

// ============================================================================
// CARREGAR MASTER TEMPLATE
// ============================================================================

const masterTemplatePath = path.join(rootDir, 'templates', '_master-template.ts');
const masterTemplate = fs.readFileSync(masterTemplatePath, 'utf-8');

// Extrair templates do master
const frontendMatch = masterTemplate.match(/export const masterFrontendTemplate = `([\s\S]*?)`;/);
const intentsMatch = masterTemplate.match(/export const masterIntentsTemplate = `([\s\S]*?)`;/);
const agreementsMatch = masterTemplate.match(/export const masterAgreementsTemplate = `([\s\S]*?)`;/);

const masterFrontend = frontendMatch ? frontendMatch[1] : '';
const masterIntents = intentsMatch ? intentsMatch[1] : '';
const masterAgreements = agreementsMatch ? agreementsMatch[1] : '';

if (!masterFrontend || !masterIntents || !masterAgreements) {
  console.error('❌ Erro ao carregar master template');
  process.exit(1);
}

// ============================================================================
// DOMAIN-SPECIFIC CUSTOMIZATIONS
// ============================================================================

const domainCustomizations = {
  'invoice-manager': {
    intents: [
      {
        id: 'create:invoice',
        intent: 'propose:agreement',
        agreementType: 'Invoice',
        schema: {
          properties: {
            clientId: { type: 'string', description: 'ID do cliente' },
            amount: { type: 'number', description: 'Valor da fatura' },
            dueDate: { type: 'string', format: 'date', description: 'Data de vencimento' },
            description: { type: 'string', description: 'Descrição' }
          },
          required: ['clientId', 'amount']
        },
        description: 'Criar nova fatura',
        examples: [
          { description: 'Fatura básica', payload: { clientId: 'client-123', amount: 1000 } }
        ]
      },
      {
        id: 'register:payment',
        intent: 'propose:agreement',
        agreementType: 'Payment',
        schema: {
          properties: {
            invoiceId: { type: 'string', description: 'ID da fatura' },
            amount: { type: 'number', description: 'Valor pago' },
            method: { type: 'string', enum: ['cash', 'card', 'transfer'], description: 'Método de pagamento' }
          },
          required: ['invoiceId', 'amount']
        },
        description: 'Registrar pagamento',
        examples: []
      }
    ],
    agreements: [
      {
        id: 'Invoice',
        name: 'Fatura',
        description: 'Fatura comercial',
        parties: [
          { role: 'Issuer', description: 'Quem emite', required: true },
          { role: 'Client', description: 'Cliente', required: true }
        ],
        obligations: [
          { id: 'pay', description: 'Cliente deve pagar', party: 'Client', amount: '{{amount}}', currency: '{{currency}}' }
        ],
        assets: [
          { id: 'invoice-amount', type: 'Money', amount: '{{amount}}', currency: '{{currency}}' }
        ],
        terms: { currency: 'BRL', paymentTerms: 'net30' },
        lifecycle: {
          states: ['draft', 'sent', 'paid', 'overdue'],
          initialState: 'draft',
          transitions: [
            { from: 'draft', to: 'sent', trigger: 'send' },
            { from: 'sent', to: 'paid', trigger: 'payment' },
            { from: 'sent', to: 'overdue', trigger: 'expire' }
          ]
        }
      }
    ]
  }
};

// ============================================================================
// FUNÇÃO PARA CUSTOMIZAR TEMPLATE
// ============================================================================

function customizeTemplate(templateId, templateConfig) {
  const customizations = domainCustomizations[templateId] || {};
  
  // Customizar frontend
  let frontend = masterFrontend
    .replace(/\{\{templateName\}\}/g, templateConfig.name || templateId)
    .replace(/\{\{companyName\}\}/g, '{{companyName}}')
    .replace(/\{\{industry\}\}/g, '{{industry}}')
    .replace(/\{\{realmId\}\}/g, '{{realmId}}');

  // Adicionar queries específicas baseadas em features
  const features = templateConfig.features?.available || [];
  const featureQueries = features.map(f => {
    const agreementType = f.id.charAt(0).toUpperCase() + f.id.slice(1);
    return `  const { data: ${f.id}Data, loading: ${f.id}Loading, refetch: ${f.id}Refetch } = useQuery('agreements', {
    agreementType: '${agreementType}'
  });`;
  }).join('\n');

  frontend = frontend.replace(
    /\/\/ Feature-specific data queries[\s\S]*?\{\{#\/if\}\}/,
    `// Feature-specific data queries\n${featureQueries || '  // No features configured'}`
  );

  // Customizar intents
  let intents = masterIntents
    .replace(/\{\{templateName\}\}/g, templateConfig.name || templateId)
    .replace(/\{\{templateId\}\}/g, templateId);

  if (customizations.intents && customizations.intents.length > 0) {
    const intentsList = customizations.intents.map(intent => {
      const props = Object.entries(intent.schema.properties || {}).map(([key, val]) => {
        return `        ${key}: {
          type: '${val.type}',
          ${val.description ? `description: '${val.description}',` : ''}
          ${val.enum ? `enum: [${val.enum.map(e => `'${e}'`).join(', ')}],` : ''}
          ${val.format ? `format: '${val.format}',` : ''}
        }`;
      }).join(',\n');
      
      return `  '${intent.id}': {
    intent: '${intent.intent}',
    agreementType: '${intent.agreementType}',
    schema: {
      type: 'object',
      properties: {
${props}
      },
      required: [${intent.schema.required.map(r => `'${r}'`).join(', ')}]
    },
    description: '${intent.description}',
    examples: [${intent.examples.map(e => `{ description: '${e.description}', payload: ${JSON.stringify(e.payload)} }`).join(', ')}]
  }`;
    }).join(',\n');

    intents = intents.replace(
      /export const \{\{templateId\}\}Intents = \{[\s\S]*?\};/,
      `export const ${templateId}Intents = {\n${intentsList}\n};`
    );
  } else {
    // Template genérico
    intents = intents.replace(
      /export const \{\{templateId\}\}Intents = \{[\s\S]*?\};/,
      `export const ${templateId}Intents = {
  // Adicione seus intents aqui
  // Exemplo:
  // 'create:item': {
  //   intent: 'propose:agreement',
  //   agreementType: 'Item',
  //   schema: { ... }
  // }
};`
    );
  }

  // Customizar agreements
  let agreements = masterAgreements
    .replace(/\{\{templateName\}\}/g, templateConfig.name || templateId)
    .replace(/\{\{templateId\}\}/g, templateId);

  if (customizations.agreements && customizations.agreements.length > 0) {
    const agreementsList = customizations.agreements.map(agreement => {
      const parties = agreement.parties.map(p => {
        return `      {
        role: '${p.role}',
        description: '${p.description}',
        ${p.required ? 'required: true,' : ''}
      }`;
      }).join(',\n');

      const obligations = agreement.obligations.map(o => {
        return `      {
        id: '${o.id}',
        description: '${o.description}',
        ${o.party ? `party: '${o.party}',` : ''}
        ${o.amount ? `amount: '${o.amount}',` : ''}
        ${o.currency ? `currency: '${o.currency}',` : ''}
      }`;
      }).join(',\n');

      const assets = agreement.assets.map(a => {
        return `      {
        id: '${a.id}',
        type: '${a.type}',
        ${a.amount ? `amount: '${a.amount}',` : ''}
        ${a.currency ? `currency: '${a.currency}',` : ''}
      }`;
      }).join(',\n');

      const terms = Object.entries(agreement.terms || {}).map(([key, val]) => {
        return `      ${key}: ${typeof val === 'string' ? `'${val}'` : val}`;
      }).join(',\n');

      const transitions = agreement.lifecycle.transitions.map(t => {
        return `      {
        from: '${t.from}',
        to: '${t.to}',
        trigger: '${t.trigger}'
      }`;
      }).join(',\n');

      return `  ${agreement.id}: {
    name: '${agreement.name}',
    description: '${agreement.description}',
    parties: [
${parties}
    ],
    obligations: [
${obligations}
    ],
    assets: [
${assets}
    ],
    terms: {
${terms}
    },
    lifecycle: {
      states: [${agreement.lifecycle.states.map(s => `'${s}'`).join(', ')}],
      initialState: '${agreement.lifecycle.initialState}',
      transitions: [
${transitions}
      ]
    }
  }`;
    }).join(',\n');

    agreements = agreements.replace(
      /export const \{\{templateId\}\}Agreements: Record<string, AgreementDefinition> = \{[\s\S]*?\};/,
      `export const ${templateId}Agreements: Record<string, AgreementDefinition> = {\n${agreementsList}\n};`
    );
  } else {
    // Template genérico
    agreements = agreements.replace(
      /export const \{\{templateId\}\}Agreements: Record<string, AgreementDefinition> = \{[\s\S]*?\};/,
      `export const ${templateId}Agreements: Record<string, AgreementDefinition> = {
  // Adicione seus agreements aqui
  // Exemplo:
  // Item: {
  //   name: 'Item',
  //   description: '...',
  //   parties: [...],
  //   obligations: [...],
  //   assets: [...]
  // }
};`
    );
  }

  return { frontend, intents, agreements };
}

// ============================================================================
// APLICAR A TODOS OS TEMPLATES
// ============================================================================

function applyMasterTemplate() {
  console.log('📝 Aplicando master template...\n');
  
  const templatesDir = path.join(rootDir, 'templates');
  const templateDirs = fs.readdirSync(templatesDir, { withFileTypes: true })
    .filter(d => d.isDirectory() && !d.name.startsWith('_'))
    .map(d => d.name);
  
  let applied = 0;
  
  for (const templateId of templateDirs) {
    const templateDir = path.join(templatesDir, templateId);
    const configPath = path.join(templateDir, 'config.ts');
    
    if (!fs.existsSync(configPath)) continue;
    
    try {
      // Ler config atual
      const configContent = fs.readFileSync(configPath, 'utf-8');
      
      // Extrair template config (metadata)
      const templateMatch = configContent.match(/const template: Template = \{([\s\S]*?)\};/);
      if (!templateMatch) continue;
      
      // Parse básico do config (simplificado)
      const templateConfig = {
        name: configContent.match(/name:\s*['"]([^'"]+)['"]/)?.[1] || templateId,
        features: {
          available: (configContent.match(/available:\s*\[([\s\S]*?)\]/)?.[1] || '')
            .split(/\{/).filter(Boolean).map(f => {
              const idMatch = f.match(/id:\s*['"]([^'"]+)['"]/);
              return idMatch ? { id: idMatch[1] } : null;
            }).filter(Boolean)
        }
      };
      
      // Customizar templates
      const { frontend, intents, agreements } = customizeTemplate(templateId, templateConfig);
      
      // Substituir no config
      let newContent = configContent;
      
      // Substituir frontend
      const frontendRegex = /const frontendTemplate = `[\s\S]*?`;/;
      if (frontendRegex.test(newContent)) {
        newContent = newContent.replace(frontendRegex, `const frontendTemplate = \`${frontend}\`;`);
      }
      
      // Substituir intents
      const intentsRegex = /const intentsTemplate = `[\s\S]*?`;/;
      if (intentsRegex.test(newContent)) {
        newContent = newContent.replace(intentsRegex, `const intentsTemplate = \`${intents}\`;`);
      }
      
      // Substituir agreements
      const agreementsRegex = /const agreementsTemplate = `[\s\S]*?`;/;
      if (agreementsRegex.test(newContent)) {
        newContent = newContent.replace(agreementsRegex, `const agreementsTemplate = \`${agreements}\`;`);
      }
      
      // Salvar
      fs.writeFileSync(configPath, newContent);
      applied++;
      console.log(`   ✅ ${templateId} atualizado`);
    } catch (error) {
      console.error(`   ⚠️  Erro ao atualizar ${templateId}:`, error.message);
    }
  }
  
  console.log(`\n✅ ${applied} templates atualizados com master template\n`);
}

// ============================================================================
// EXECUTAR
// ============================================================================

try {
  applyMasterTemplate();
  console.log('🎉 Master template aplicado com sucesso!');
} catch (error) {
  console.error('❌ Erro:', error);
  process.exit(1);
}

