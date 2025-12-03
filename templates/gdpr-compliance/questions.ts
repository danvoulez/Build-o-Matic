/**
 * 5 Questions required by the generator for GDPR template.
 */
import { TemplateQuestion } from '../../generator/types';

export const questions: TemplateQuestion[] = [
  {
    id: 'industry',
    question: 'What is your industry?',
    type: 'single',
    required: true,
    options: ['ecommerce', 'finance', 'healthcare', 'saas'],
  },
  {
    id: 'users',
    question: 'How many employees will use this?',
    type: 'number',
    required: true,
    validation: { min: 1, max: 100000 },
  },
  {
    id: 'features',
    question: 'Which features do you need?',
    type: 'multiple',
    required: true,
    options: [
      'consent-tracking',
      'data-export',
      'data-deletion',
      'audit-log',
      'breach-notification',
      'dpo-dashboard',
    ],
  },
  {
    id: 'integrations',
    question: 'Which integrations do you need?',
    type: 'multiple',
    required: false,
    options: ['email', 'slack', 'webhook'],
  },
  {
    id: 'deployTarget',
    question: 'Where should we deploy?',
    type: 'single',
    required: true,
    options: ['railway', 'render', 'docker'],
  },
];