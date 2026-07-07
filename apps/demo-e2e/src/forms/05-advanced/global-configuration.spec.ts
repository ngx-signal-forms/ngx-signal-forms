import { expect, test } from '@playwright/test';

import { ROLE_ALERT_SELECTOR } from '../../fixtures/aria-selectors';
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

  test('should render the debugger and display controls for the config demo', async ({
    page: playwrightPage,
  }) => {
    await test.step('Verify debugger is rendered with its status badges', async () => {
      await expect(
        playwrightPage.getByRole('heading', {
          name: 'Form State & Validation',
          level: 3,
        }),
      ).toBeVisible();

      await expect(
        playwrightPage.getByText(/Validation Errors \d+\/\d+/),
      ).toBeVisible();
    });

    await test.step('Verify the page configuration panel is present', async () => {
      await expect(
        playwrightPage.getByRole('complementary', {
          name: 'Page configuration',
        }),
      ).toBeVisible();
    });
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

      const errors = playwrightPage.locator(ROLE_ALERT_SELECTOR);
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

  test('should set aria-invalid on touched invalid fields', async ({
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

  test.describe('Message and Label Providers', () => {
    test('should display the component-scoped required message override from provideErrorMessages', async ({
      page: playwrightPage,
    }) => {
      await test.step('Touch the email field without entering a value', async () => {
        const emailInput = playwrightPage.locator('#userEmail');
        await emailInput.focus();
        await emailInput.blur();
      });

      await test.step('Verify the overridden required message is shown', async () => {
        const errors = playwrightPage.locator(ROLE_ALERT_SELECTOR);
        await expect(errors.first()).toBeVisible({ timeout: 2000 });
        await expect(errors.first()).toContainText(
          'This field is required — we use it to personalise your experience.',
        );
      });
    });

    test('should show custom label "Email Address" in error summary via provideFieldLabels', async ({
      page: playwrightPage,
    }) => {
      await test.step('Submit the empty form to trigger on-submit errors', async () => {
        const submitButton = playwrightPage.getByRole('button', {
          name: /Submit Form/i,
        });
        await submitButton.click();
      });

      await test.step('Verify the error summary appears', async () => {
        const summary = playwrightPage.locator(
          '[data-testid="global-config-error-summary"] [role="alert"]',
        );
        await expect(summary).toBeVisible({ timeout: 3000 });
      });

      await test.step('Verify the summary uses the custom label "Email Address" from provideFieldLabels', async () => {
        const summary = playwrightPage.locator(
          '[data-testid="global-config-error-summary"] [role="alert"]',
        );
        // provideFieldLabels maps userEmail → 'Email Address'
        // If the label resolver is wired correctly the entry reads "Email Address: ..."
        // rather than the humanized fallback "User Email: ..."
        await expect(summary).toContainText('Email Address');
        await expect(summary).not.toContainText('User Email');
      });
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
      const errors = wrapper.locator(ROLE_ALERT_SELECTOR);
      await expect(errors.first()).toBeVisible({ timeout: 3000 });
    });
  });
});
