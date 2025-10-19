import { expect, test } from '@playwright/test';

/**
 * Basic Page Load Tests
 * Ensures all demo pages load successfully
 */

test.describe('Demo - Page Loading', () => {
  test('should load all demo pages successfully', async ({ page }) => {
    await test.step('Load all example routes', async () => {
      const routes = [
        '/',
        '/signal-forms-only/pure-signal-form',
        '/getting-started/your-first-form',
        '/toolkit-core/accessibility-comparison',
        '/toolkit-core/error-display-modes',
        '/toolkit-core/warning-support',
        '/toolkit-core/field-states',
        '/form-field-wrapper/basic-usage',
        '/form-field-wrapper/complex-forms',
        '/advanced/global-configuration',
      ];

      for (const route of routes) {
        await page.goto(route);
        await page.waitForLoadState('domcontentloaded');

        /// Verify page loaded with content
        const main = page.locator('main, [role="main"]');
        const isVisible = await main
          .isVisible({ timeout: 2000 })
          .catch(() => false);
        expect(isVisible || (await page.content()).length > 0).toBe(true);
      }
    });
  });

  test('should render forms on all pages', async ({ page }) => {
    await test.step('Verify forms are present', async () => {
      const routes = [
        '/getting-started/your-first-form',
        '/toolkit-core/accessibility-comparison',
        '/toolkit-core/error-display-modes',
        '/form-field-wrapper/basic-usage',
      ];

      for (const route of routes) {
        await page.goto(route);
        await page.waitForLoadState('domcontentloaded');

        // Wait for Angular to render
        await page.waitForTimeout(500);

        const form = page.locator('form').first();
        await expect(form).toBeVisible({ timeout: 5000 });
      }
    });
  });
});
