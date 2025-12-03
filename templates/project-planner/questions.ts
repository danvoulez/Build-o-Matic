import { TemplateQuestion } from '../../generator/types';

export const questions: TemplateQuestion[] = [
  { id: 'industry', question: 'Setor?', type: 'single', required: true, options: ['ecommerce', 'finance', 'healthcare', 'saas'] },
  { id: 'users', question: 'Usuários?', type: 'number', required: true, validation: { min: 1, max: 100000 } },
  { id: 'features', question: 'Recursos?', type: 'multiple', required: true, options: ['projects', 'tasks', 'kanban', 'calendar', 'reports', 'notifications'] },
  { id: 'integrations', question: 'Integrações?', type: 'multiple', required: false, options: ['email', 'slack', 'webhook'] },
  { id: 'deployTarget', question: 'Deploy', type: 'single', required: true, options: ['railway', 'render', 'docker'] }
];