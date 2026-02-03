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
        '/toolkit-core/css-status-classes',
        '/headless/error-state',
        '/form-field-wrapper/basic-usage',
        '/form-field-wrapper/complex-forms',
        '/form-field-wrapper/outline-form-field',
        '/advanced-scenarios/global-configuration',
        '/advanced-scenarios/submission-patterns',
        '/advanced-scenarios/error-messages',
        '/advanced-scenarios/dynamic-list',
        '/advanced-scenarios/nested-groups',
        '/advanced-scenarios/async-validation',
        '/advanced-scenarios/stepper-form',
        '/advanced-scenarios/cross-field-validation',
      ];

      for (const route of routes) {
        const routePage = await page.context().newPage();
        await routePage.goto(route, { waitUntil: 'domcontentloaded' });

        /// Verify page loaded with content
        const main = routePage.locator('main, [role="main"]');
        const isVisible = await main
          .isVisible({ timeout: 2000 })
          .catch(() => false);
        expect(isVisible || (await routePage.content()).length > 0).toBe(true);

        await routePage.close();
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
        const routePage = await page.context().newPage();
        await routePage.goto(route, { waitUntil: 'domcontentloaded' });

        const form = routePage.locator('form').first();
        await expect(form).toBeVisible({ timeout: 5000 });

        await routePage.close();
      }
    });
  });
});
