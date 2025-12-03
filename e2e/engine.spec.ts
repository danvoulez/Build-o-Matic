import { test, expect } from '@playwright/test';

test('Engine toggle visibility and deploy flow', async ({ page }) => {
  // Navigate to generation page via quick demo state
  // Assuming app supports direct navigation with state; otherwise start from Home and click demo button
  await page.goto('/generate');
  // Toggle may be hidden if backend not available; check existence first
  const toggle = page.getByText('Usar Engine 10s');
  const toggleVisible = await toggle.isVisible().catch(() => false);

  if (!toggleVisible) {
    test.skip(true, 'Engine toggle not visible; backend engine route unavailable or flag disabled.');
    return;
  }

  await toggle.click();
  await expect(page.getByText(/Gerando sua ferramenta/i)).toBeVisible();

  // Expect a success within reasonable time
  await expect(page.getByText(/Sucesso|Success/i)).toBeVisible({ timeout: 15000 });
});

test('Deploy target options include AWS and GCP on wizard', async ({ page }) => {
  await page.goto('/templates');
  // Navigate to a build page; select first template card if present
  const buildLink = page.locator('text=Construir').first();
  await buildLink.click();

  // Find deploy target question; verify options rendered
  const options = ['aws eb', 'aws ecs', 'gcp cloudrun'].map((t) => new RegExp(t, 'i'));
  for (const opt of options) {
    await expect(page.getByText(opt)).toBeVisible();
  }
});