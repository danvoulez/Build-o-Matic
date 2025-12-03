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
    question: 'Quantas pessoas usarão esta ferramenta?',
    type: 'number',
    required: true,
    validation: { min: 1, max: 100000 }
  },
  {
    id: 'features',
    question: 'Selecione os recursos necessários',
    type: 'multiple',
    required: true,
    options: ['invoicing', 'payments', 'reports', 'notifications']
  },
  {
    id: 'integrations',
    question: 'Quais integrações você precisa?',
    type: 'multiple',
    required: false,
    options: ['email']
  },
  {
    id: 'deployTarget',
    question: 'Destino de deploy',
    type: 'single',
    required: true,
    options: ['railway', 'render', 'docker']
  }
];