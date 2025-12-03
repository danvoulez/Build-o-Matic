import { describe, it, expect } from 'vitest';
import { loadAllTemplates, getTemplateById } from '../templates/index';

describe('Template Registry', () => {
  it('loads all templates from directory', async () => {
    const all = await loadAllTemplates();
    expect(all.length).toBeGreaterThanOrEqual(3);
    const ids = all.map(t => t.id);
    expect(ids).toEqual(expect.arrayContaining(['gdpr-compliance', 'hr-onboarding', 'invoice-manager']));
  });

  it('gets template by id', async () => {
    const tpl = await getTemplateById('hr-onboarding');
    expect(tpl?.id).toBe('hr-onboarding');
    expect(tpl?.questions?.length).toBe(5);
  });
});