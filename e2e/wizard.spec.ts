import { test, expect } from '@playwright/test';

test.describe('Build-O-Matic Wizard Flow', () => {
  test('home → select template → answer 5 questions → generate (SSE)', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/Build-O-Matic/i)).toBeVisible();

    // Ensure template cards are present
    await expect(page.getByText(/GDPR Compliance|HR Onboarding|Invoice Manager/i)).toBeVisible();

    // Click first "Construir"/"Build" button
    const buildButtons = await page.locator('button:has-text("Construir"), button:has-text("Build")').all();
    await buildButtons[0].click();

    // Question 1: industry
    const industryOption = page.getByLabel(/ecommerce|E-commerce/i);
    await industryOption.check();
    await page.getByRole('button', { name: /Próximo|Next/i }).click();

    // Question 2: users
    await page.getByRole('spinbutton').fill('50');
    await page.getByRole('button', { name: /Próximo|Next/i }).click();

    // Question 3: features
    const features = ['consent-tracking', 'data-export', 'audit-log'];
    for (const f of features) {
      const cb = page.getByLabel(new RegExp(f, 'i'));
      if (await cb.isVisible()) await cb.check();
    }
    await page.getByRole('button', { name: /Próximo|Next/i }).click();

    // Question 4: integrations (optional)
    const emailCheckbox = page.getByLabel(/email/i);
    if (await emailCheckbox.isVisible()) await emailCheckbox.check();
    await page.getByRole('button', { name: /Próximo|Next/i }).click();

    // Question 5: deploy target
    const target = page.getByLabel(/railway|render|docker/i).first();
    await target.check();
    await page.getByRole('button', { name: /Gerar Ferramenta|Generate Tool/i }).click();

    // Generation page shows progress and success
    await expect(page.getByText(/Building your tool|Gerando/i)).toBeVisible();
    await expect(page.getByText(/Success|Sucesso/i)).toBeVisible({ timeout: 20000 });
  });
});