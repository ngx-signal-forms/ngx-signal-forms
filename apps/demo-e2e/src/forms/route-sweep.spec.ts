import { DEMO_PATHS } from '@ngx-signal-forms/demo-shared';
import { expect, test } from '@playwright/test';

const DEMO_ROUTES = ['/', ...Object.values(DEMO_PATHS)] as const;

test.describe('Demo route smoke sweep', () => {
  for (const route of DEMO_ROUTES) {
    test(`${route} renders without runtime errors`, async ({ page }) => {
      const consoleErrors: string[] = [];
      const pageErrors: string[] = [];

      page.on('console', (message) => {
        if (message.type() === 'error') {
          consoleErrors.push(message.text());
        }
      });
      page.on('pageerror', (error) => pageErrors.push(error.message));

      await page.goto(route);
      await expect(page.getByRole('main')).toBeVisible({ timeout: 15_000 });
      await expect(page.locator('h1')).toBeVisible({ timeout: 15_000 });

      expect(consoleErrors).toEqual([]);
      expect(pageErrors).toEqual([]);
    });
  }
});
