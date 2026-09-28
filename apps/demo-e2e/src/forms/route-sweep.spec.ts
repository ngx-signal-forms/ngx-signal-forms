import { expect, test } from '@playwright/test';

const DEMO_ROUTES = [
  '/',
  '/getting-started/your-first-form',
  '/toolkit-core/error-display-modes',
  '/toolkit-core/warning-support',
  '/headless/fieldset-utilities',
  '/headless/error-message-signal',
  '/form-field-wrapper/complex-forms',
  '/form-field-wrapper/fieldset-appearance',
  '/form-field-wrapper/custom-controls',
  '/form-field-wrapper/labelless-fields',
  '/form-field-wrapper/field-identity',
  '/form-field-wrapper/field-marking',
  '/form-field-wrapper/brand-theming',
  '/validation/zod-validation',
  '/validation/vest-validation',
  '/validation/zod-vest-validation',
  '/advanced-scenarios/global-configuration',
  '/advanced-scenarios/submission-patterns',
  '/advanced-scenarios/advanced-wizard',
  '/advanced-scenarios/single-model-wizard',
  '/advanced-scenarios/async-validation',
  '/advanced-scenarios/field-state-patterns',
  '/advanced-scenarios/cross-field-validation',
  '/advanced-scenarios/store-binding',
  '/advanced-scenarios/server-integration',
  '/advanced-scenarios/autosave',
  '/advanced-scenarios/i18n',
] as const;

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
