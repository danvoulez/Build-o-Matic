import { TemplateQuestion } from '../../generator/types';

export const questions: TemplateQuestion[] = [
  { id: 'industry', question: 'Qual é o seu setor?', type: 'single', required: true, options: ['ecommerce', 'finance', 'healthcare', 'saas'] },
  { id: 'users', question: 'Quantos usuários?', type: 'number', required: true, validation: { min: 1, max: 100000 } },
  { id: 'features', question: 'Recursos desejados?', type: 'multiple', required: true, options: ['items', 'stock-levels', 'warehouses', 'purchase-orders', 'audit-log', 'reports'] },
  { id: 'integrations', question: 'Integrações?', type: 'multiple', required: false, options: ['email', 'slack', 'webhook'] },
  { id: 'deployTarget', question: 'Deploy Target', type: 'single', required: true, options: ['railway', 'render', 'docker'] }
];