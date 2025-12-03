import { TemplateQuestion } from '../../generator/types';

export const questions: TemplateQuestion[] = [
  { id: 'industry', question: 'Setor?', type: 'single', required: true, options: ['saas', 'ecommerce', 'finance', 'healthcare'] },
  { id: 'users', question: 'Usuários?', type: 'number', required: true, validation: { min: 1, max: 100000 } },
  { id: 'features', question: 'Recursos?', type: 'multiple', required: true, options: ['reviews', 'goals', 'feedback', 'calibration', 'reports', 'notifications'] },
  { id: 'integrations', question: 'Integrações?', type: 'multiple', required: false, options: ['email', 'slack'] },
  { id: 'deployTarget', question: 'Deploy', type: 'single', required: true, options: ['railway', 'render', 'docker'] }
];