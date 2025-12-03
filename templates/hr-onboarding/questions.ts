import { TemplateQuestion } from '../../generator/types';

export const questions: TemplateQuestion[] = [
  {
    id: 'industry',
    question: 'Qual é o seu setor?',
    type: 'single',
    required: true,
    options: ['ecommerce', 'finance', 'healthcare', 'saas']
  },
  {
    id: 'users',
    question: 'Quantos colaboradores vão usar a ferramenta?',
    type: 'number',
    required: true,
    validation: { min: 1, max: 100000 }
  },
  {
    id: 'features',
    question: 'Quais recursos você precisa?',
    type: 'multiple',
    required: true,
    options: ['checklist', 'documents', 'tasks', 'notifications']
  },
  {
    id: 'integrations',
    question: 'Quais integrações você quer habilitar?',
    type: 'multiple',
    required: false,
    options: ['email', 'slack']
  },
  {
    id: 'deployTarget',
    question: 'Onde devemos fazer o deploy?',
    type: 'single',
    required: true,
    options: ['railway', 'render', 'docker']
  }
];