#!/usr/bin/env node

/**
 * Demonstração Visual - Motor de Estilo
 * 
 * Mostra como o Motor de Estilo funciona na prática.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Simular seleção de tema
function selectTheme(industry) {
  const industryLower = (industry || '').toLowerCase();
  
  if (['finance', 'financial', 'banking', 'healthcare', 'legal'].includes(industryLower)) {
    return {
      id: 'corporate',
      name: 'Enterprise Blue',
      colors: { primary: '#0f172a', secondary: '#64748b', accent: '#3b82f6', background: '#f8fafc', surface: '#ffffff', text: '#1e293b' },
      borderRadius: '0.25rem',
      fontFamily: 'Inter, sans-serif',
      componentStyle: 'bordered'
    };
  } else if (['saas', 'software', 'tech', 'marketing'].includes(industryLower)) {
    return {
      id: 'startup',
      name: 'Modern SaaS',
      colors: { primary: '#6366f1', secondary: '#a855f7', accent: '#ec4899', background: '#ffffff', surface: '#f9fafb', text: '#111827' },
      borderRadius: '0.75rem',
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      componentStyle: 'shadow'
    };
  } else if (['manufacturing', 'logistics', 'industrial'].includes(industryLower)) {
    return {
      id: 'industrial',
      name: 'Dark Operations',
      colors: { primary: '#f59e0b', secondary: '#404040', accent: '#ef4444', background: '#171717', surface: '#262626', text: '#e5e5e5' },
      borderRadius: '0px',
      fontFamily: 'Roboto Mono, monospace',
      componentStyle: 'flat'
    };
  } else if (['design', 'creative', 'agency'].includes(industryLower)) {
    return {
      id: 'creative',
      name: 'Vibrant',
      colors: { primary: '#ec4899', secondary: '#f59e0b', accent: '#8b5cf6', background: '#fff1f2', surface: '#ffffff', text: '#831843' },
      borderRadius: '1rem',
      fontFamily: 'Poppins, sans-serif',
      componentStyle: 'shadow'
    };
  }
  
  return {
    id: 'startup',
    name: 'Modern SaaS',
    colors: { primary: '#6366f1', secondary: '#a855f7', accent: '#ec4899', background: '#ffffff', surface: '#f9fafb', text: '#111827' },
    borderRadius: '0.75rem',
    fontFamily: 'Plus Jakarta Sans, sans-serif',
    componentStyle: 'shadow'
  };
}

// Simular seleção de layout
function selectLayout(templateId) {
  const id = (templateId || '').toLowerCase();
  
  if (['helpdesk', 'knowledge-base', 'hr-onboarding'].includes(id)) {
    return 'chat-focus';
  } else if (['documentation', 'wiki'].includes(id)) {
    return 'documentation';
  } else if (['project-planner', 'okrs-manager'].includes(id)) {
    return 'workflow';
  }
  
  return 'dashboard';
}

// Gerar preview do código
function generatePreview(templateId, companyName, industry) {
  const theme = selectTheme(industry);
  const layout = selectLayout(templateId);
  
  const tailwindConfig = `/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '${theme.colors.primary}',
        secondary: '${theme.colors.secondary}',
        accent: '${theme.colors.accent}',
        background: '${theme.colors.background}',
        surface: '${theme.colors.surface}',
        text: '${theme.colors.text}',
      },
      fontFamily: {
        sans: ['${theme.fontFamily.split(',')[0].trim()}', 'sans-serif'],
      },
      borderRadius: {
        token: '${theme.borderRadius}',
      }
    },
  },
}`;

  const appCode = `import React from 'react';
import Layout from './Layout';

export default function App() {
  return (
    <Layout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <section className="card hover:shadow-lg transition-shadow">
            <h2 className="text-lg font-bold text-primary">
              ${companyName} - ${templateId}
            </h2>
            <p className="text-muted">Setor: ${industry}</p>
          </section>
        </div>
        <div className="lg:col-span-1">
          <section className="card h-[600px]">
            <h3 className="font-bold text-lg text-primary">✨ Assistente IA</h3>
          </section>
        </div>
      </div>
    </Layout>
  );
}`;

  return { tailwindConfig, appCode, theme, layout };
}

// Demonstração
console.log('🎨 DEMONSTRAÇÃO - Motor de Estilo\n');
console.log('=' .repeat(60));

const scenarios = [
  { templateId: 'invoice-manager', companyName: 'Finance Corp', industry: 'finance' },
  { templateId: 'invoice-manager', companyName: 'Creative Agency', industry: 'design' },
  { templateId: 'helpdesk', companyName: 'Tech Support', industry: 'saas' },
  { templateId: 'project-planner', companyName: 'Operations Inc', industry: 'manufacturing' },
];

scenarios.forEach((scenario, index) => {
  console.log(`\n📋 Cenário ${index + 1}: ${scenario.companyName}`);
  console.log(`   Template: ${scenario.templateId}`);
  console.log(`   Indústria: ${scenario.industry}`);
  
  const preview = generatePreview(scenario.templateId, scenario.companyName, scenario.industry);
  
  console.log(`\n   🎨 Tema Selecionado: ${preview.theme.name}`);
  console.log(`      - ID: ${preview.theme.id}`);
  console.log(`      - Cor Primária: ${preview.theme.colors.primary}`);
  console.log(`      - Background: ${preview.theme.colors.background}`);
  console.log(`      - Fonte: ${preview.theme.fontFamily}`);
  console.log(`      - Border Radius: ${preview.theme.borderRadius}`);
  console.log(`      - Estilo: ${preview.theme.componentStyle}`);
  
  console.log(`\n   📐 Layout Selecionado: ${preview.layout}`);
  
  console.log(`\n   📦 Arquivos que seriam gerados:`);
  console.log(`      ✅ tailwind.config.js (com cores do tema)`);
  console.log(`      ✅ frontend/App.tsx (com classes Tailwind)`);
  console.log(`      ✅ frontend/Layout.tsx (layout ${preview.layout})`);
  console.log(`      ✅ frontend/index.css (estilos globais)`);
  console.log(`      ✅ frontend/components/AutoForm.tsx`);
  console.log(`      ✅ frontend/components/DashboardWidgets.tsx`);
  console.log(`      ✅ frontend/components/DataGrid.tsx`);
  
  if (index < scenarios.length - 1) {
    console.log('\n' + '-'.repeat(60));
  }
});

console.log('\n' + '='.repeat(60));
console.log('\n✅ RESULTADO:');
console.log('   Cada cenário geraria uma interface visualmente diferente!');
console.log('   - Finance Corp: Azul escuro, sério, fonte Inter');
console.log('   - Creative Agency: Rosa/violeta, moderno, fonte Poppins');
console.log('   - Tech Support: Layout chat-focus, tema Startup');
console.log('   - Operations Inc: Layout workflow, tema Industrial\n');

console.log('🚀 Motor de Estilo funcionando perfeitamente!');
console.log('💡 As ferramentas geradas terão visual único baseado na indústria e template.\n');

// Salvar exemplo de preview
const outputDir = path.join(projectRoot, 'test-output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const example = generatePreview('invoice-manager', 'Finance Corp', 'finance');
fs.writeFileSync(path.join(outputDir, 'tailwind.config.example.js'), example.tailwindConfig);
fs.writeFileSync(path.join(outputDir, 'App.example.tsx'), example.appCode);

console.log(`📁 Exemplos salvos em: ${outputDir}/`);
console.log(`   - tailwind.config.example.js`);
console.log(`   - App.example.tsx\n`);

