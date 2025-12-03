import { describe, it, expect } from 'vitest';
import { TemplateEngine } from '../generator/template-engine';

describe('Template Engine', () => {
  const engine = new TemplateEngine();

  it('lists all templates', async () => {
    const templates = await engine.listAll();
    const ids = templates.map((t: any) => t.id);
    expect(ids).toContain('gdpr-compliance');
    expect(ids).toContain('hr-onboarding');
    expect(ids).toContain('invoice-manager');
  });

  it('loads a template by ID', async () => {
    const tpl = await engine.load('gdpr-compliance');
    expect(tpl).not.toBeNull();
    expect((tpl as any).id).toBe('gdpr-compliance');
    expect((tpl as any).questions.length).toBe(5);
    expect((tpl as any).codeTemplates.backend.length).toBeGreaterThan(10);
  });

  it('searches templates by category and features', async () => {
    const results = await engine.search({ category: 'Finance', features: ['invoicing'] });
    expect(results.length).toBeGreaterThan(0);
    expect(results.map((t: any) => t.id)).toContain('invoice-manager');
  });
});