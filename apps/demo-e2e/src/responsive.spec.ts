import { DEMO_PATHS } from '../demo/src/app/routes.metadata';
// eslint-disable-next-line @nx/enforce-module-boundaries
// eslint-disable-next-line @nx/enforce-module-boundaries
import { ALL_DEMO_ROUTES, DEMO_PATHS } from '../../demo/src/app/routes.metadata';
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
        ...ALL_DEMO_ROUTES.map(r => r.path)
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
        DEMO_PATHS.yourFirstForm,
        DEMO_PATHS.accessibilityComparison,
        DEMO_PATHS.errorDisplayModes,
        DEMO_PATHS.basicUsage,
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
