import { describe, it, expect } from 'vitest';
import { Customizer } from '../generator/customizer';

describe('Battle: Security Placeholder Replacement', () => {
  const customizer = new Customizer() as any;

  it('does not accidentally inject placeholders that look like templates', async () => {
    const src = `
const MSG = "{{message}}";
const SQL = "SELECT * FROM users WHERE name='{{name}}'";
`;
    const answers = { message: 'Hello', name: "O'Reilly" };
    const out = customizer.replacePlaceholders(src, answers);
    expect(out).toContain('Hello');
    // Note: This test doesn't sanitize SQL; generation should leave sanitization to runtime libs.
    expect(out).toContain("O'Reilly");
  });

  it('feature blocks are removed when not enabled', async () => {
    const src = `
// FEATURE:alpha START
console.log('alpha enabled');
// FEATURE:alpha END
// FEATURE:beta START
console.log('beta enabled');
// FEATURE:beta END
`;
    const out = customizer.applyFeatureBlocks(src, ['beta']);
    expect(out).toContain('beta enabled');
    expect(out).not.toContain('alpha enabled');
  });

  it('integration blocks match only declared ids', async () => {
    const src = `
// INTEGRATION:slack START
console.log('slack');
// INTEGRATION:slack END
// INTEGRATION:email START
console.log('email');
// INTEGRATION:email END
`;
    const out = customizer.applyIntegrationBlocks(src, ['email']);
    expect(out).toContain('email');
    expect(out).not.toContain('slack');
  });
});