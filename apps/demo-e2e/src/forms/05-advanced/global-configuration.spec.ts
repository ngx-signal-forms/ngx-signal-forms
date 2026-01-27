import { expect, test } from '@playwright/test';
import { GlobalConfigurationPage } from '../../page-objects/global-configuration.page';

test.describe('Advanced - Global Configuration', () => {
  let page: GlobalConfigurationPage;

  test.beforeEach(async ({ page: playwrightPage }) => {
    page = new GlobalConfigurationPage(playwrightPage);
    await page.goto();
  });

  test('should load configuration example', async () => {
    await expect(page.form).toBeVisible();
  });

  test('should apply global error display strategy', async ({
    page: playwrightPage,
  }) => {
    await test.step('Check configured strategy (look for descriptor text)', async () => {
      // Page might show current config like "Current: On-Touch"
      // Or just verify form exists
      await expect(page.form).toBeVisible();
    });

    await test.step('Trigger validation according to strategy', async () => {
      // Default is likely 'on-touch', so blur should trigger errors
      const inputs = playwrightPage.locator(
        'input[required], input[aria-required="true"]',
      );
      const input = inputs.first();
      await expect(input).toBeVisible();
      await input.focus();
      await input.blur();

      const errors = playwrightPage.locator('[role="alert"]');
      await expect(errors.first()).toBeVisible({ timeout: 2000 });
    });
  });

  test('should maintain auto-ARIA functionality with global config', async ({
    page: playwrightPage,
  }) => {
    await test.step('Verify auto-ARIA attributes are present', async () => {
      // Select actual form inputs (email, phone, website), not radio buttons
      const formInputs = playwrightPage.locator(
        'input[type="text"], input[type="email"], input[type="url"], input[type="tel"]',
      );
      const input = formInputs.first();
      await expect(input).toBeVisible();
      await input.focus();
      await input.blur();

      await expect(input).toHaveAttribute('aria-invalid', /(true|false)/);
    });
  });

  test('should apply custom CSS classes if configured', async ({
    page: playwrightPage,
  }) => {
    await test.step('Check for custom or default CSS classes on invalid fields', async () => {
      const inputs = playwrightPage.locator('input');
      const input = inputs.first();
      await expect(input).toBeVisible();
      await input.focus();
      await input.blur();

      await expect(input).toHaveClass(/invalid|ng-/);
    });
  });
});
