import { test, expect } from '@playwright/test';

test.describe('Templates API and Home rendering', () => {
  test('lists templates and renders ToolSelector', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Build-O-Matic')).toBeVisible();

    // Should render cards from /api/templates
    await expect(page.getByText(/GDPR Compliance|HR Onboarding|Invoice Manager/i)).toBeVisible();
  });
});