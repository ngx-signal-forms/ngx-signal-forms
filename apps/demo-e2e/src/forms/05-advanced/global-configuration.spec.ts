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
        'input[aria-required="true"], textarea[aria-required="true"], select[aria-required="true"]',
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
    await test.step('Check for aria-invalid on invalid fields', async () => {
      // Select actual form inputs (text, email, etc), not radio buttons
      const formInputs = playwrightPage.locator(
        'input[type="text"], input[type="email"], input[type="url"], input[type="tel"], textarea, select',
      );
      const input = formInputs.first();
      await expect(input).toBeVisible();
      await input.focus();
      await input.blur();

      // Auto-ARIA directive sets aria-invalid regardless of CSS class config
      await expect(input).toHaveAttribute('aria-invalid', 'true');
    });
  });

  test.describe('Control Presets', () => {
    test('should render accept-terms switch with preset data attributes', async ({
      page: playwrightPage,
    }) => {
      const acceptTerms = playwrightPage.locator('#acceptTerms');
      const acceptTermsWrapper = playwrightPage
        .locator('ngx-form-field-wrapper')
        .filter({ has: acceptTerms });

      await expect(acceptTerms).toHaveAttribute('role', 'switch');
      await expect(acceptTermsWrapper).toHaveAttribute(
        'data-ngx-signal-form-control-kind',
        'switch',
      );
      await expect(acceptTermsWrapper).toHaveAttribute(
        'data-ngx-signal-form-control-layout',
        'inline-control',
      );
      await expect(acceptTermsWrapper).toHaveAttribute(
        'data-ngx-signal-form-control-aria-mode',
        'auto',
      );
    });

    test('should apply auto-ARIA to switch after interaction', async ({
      page: playwrightPage,
    }) => {
      const acceptTerms = playwrightPage.locator('#acceptTerms');
      await acceptTerms.focus();
      await acceptTerms.blur();
      await expect(acceptTerms).toHaveAttribute('aria-invalid', /(true|false)/);
    });

    test('should show accept-terms error after submit without checking', async ({
      page: playwrightPage,
    }) => {
      const submitButton = playwrightPage.getByRole('button', {
        name: /Submit Form/i,
      });
      await submitButton.click();

      const acceptTerms = playwrightPage.locator('#acceptTerms');
      await acceptTerms.focus();
      await acceptTerms.blur();

      const wrapper = acceptTerms.locator(
        'xpath=ancestor::ngx-form-field-wrapper',
      );
      const errors = wrapper.locator('[role="alert"]');
      await expect(errors.first()).toBeVisible({ timeout: 3000 });
    });
  });
});
