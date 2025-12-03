import { TemplateQuestion } from '../../generator/types';

export const questions: TemplateQuestion[] = [
  { id: 'industry', question: 'Qual é o seu setor?', type: 'single', required: true, options: ['ecommerce', 'finance', 'healthcare', 'saas'] },
  { id: 'users', question: 'Quantos usuários vão usar?', type: 'number', required: true, validation: { min: 1, max: 100000 } },
  { id: 'features', question: 'Quais recursos você precisa?', type: 'multiple', required: true, options: ['asset-register', 'assignments', 'maintenance', 'qr-labels', 'audit-log'] },
  { id: 'integrations', question: 'Integrações desejadas?', type: 'multiple', required: false, options: ['email', 'slack', 'webhook'] },
  { id: 'deployTarget', question: 'Onde fazer deploy?', type: 'single', required: true, options: ['railway', 'render', 'docker'] }
];