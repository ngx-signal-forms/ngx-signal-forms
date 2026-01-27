import { expect, test } from '@playwright/test';
import {
  switchErrorMode,
  verifyErrorsAfterBlur,
  verifyNoErrorsOnInitialLoad,
} from '../../fixtures/form-validation.fixture';
import { YourFirstFormPage } from '../../page-objects/your-first-form.page';

/**
 * Tests for "Your First Form with Toolkit" demo
 * Route: /getting-started/your-first-form
 *
 * This example demonstrates the POM (Page Object Model) pattern with fixtures
 * for reusable test logic across the demo application.
 */
test.describe('Your First Form with Toolkit (POM Example)', () => {
  let formPage: YourFirstFormPage;

  test.beforeEach(async ({ page }) => {
    /// Capture console messages
    page.on('console', (msg) => {
      const text = msg.text();
      if (
        text.includes('[FormProvider]') ||
        text.includes('[FormError]') ||
        text.includes('[computeShowErrors]') ||
        text.includes('🐛')
      ) {
        console.log(`[BROWSER CONSOLE] ${msg.type()}: ${text}`);
      }
    });

    formPage = new YourFirstFormPage(page);
    await formPage.goto();
  });

  test('should NOT show errors on initial page load with on-touch strategy', async ({
    page,
  }) => {
    // Wait a bit for debug logs to accumulate
    await page.waitForTimeout(500);

    await verifyNoErrorsOnInitialLoad(page, {
      visibleFieldSelectors: ['input#contact-name', 'input#contact-email'],
    });

    /// Verify error mode selector is visible
    await expect(formPage.errorModeRadios.onTouch).toBeVisible();
  });

  test('should display error mode selector', async () => {
    await test.step('Verify all error mode radio buttons exist', async () => {
      await expect(formPage.errorModeRadios.immediate).toBeVisible();
      await expect(formPage.errorModeRadios.onTouch).toBeVisible();
      await expect(formPage.errorModeRadios.onSubmit).toBeVisible();
    });
  });

  test('should apply "on-touch" error strategy', async () => {
    await formPage.selectErrorMode('onTouch');
    await expect(formPage.errorModeRadios.onTouch).toBeChecked();
  });

  test('should apply "immediate" error strategy and show errors', async ({
    page,
  }) => {
    await test.step('Switch to immediate mode', async () => {
      await formPage.selectErrorMode('immediate');

      /// Errors should appear immediately for empty required fields
      await expect(formPage.errorAlerts.first()).toBeVisible();
    });
  });

  test('should apply "on-submit" error strategy', async ({ page }) => {
    await switchErrorMode(page, 'On Submit');
    await expect(formPage.errorModeRadios.onSubmit).toBeChecked();
  });

  test('should show validation errors after blur (on-touch mode)', async ({
    page,
  }) => {
    await verifyErrorsAfterBlur(page, 'input#contact-name', /required/i);
    await expect(formPage.errorAlerts.first()).toBeVisible();
  });

  test('should submit form with valid data', async () => {
    await test.step('Fill form and submit', async () => {
      await formPage.fillValidData();
      await formPage.submit();

      /// After successful submission, form should reset
      await expect(formPage.nameInput).toHaveValue('');
      await expect(formPage.emailInput).toHaveValue('');
    });
  });

  test('should prevent submission with invalid data', async ({ page }) => {
    /// With on-touch strategy: errors show after fields are touched (blurred)
    /// Touch all fields by focusing and blurring each one
    await formPage.nameInput.focus();
    await formPage.nameInput.blur();
    await formPage.emailInput.focus();
    await formPage.emailInput.blur();
    await formPage.messageInput.focus();
    await formPage.messageInput.blur();

    /// Form should still be visible (not submitted because invalid)
    await expect(formPage.form).toBeVisible();

    /// After touching fields, errors should be visible with 'on-touch' strategy
    await expect(async () => {
      const errorCount = await formPage.errorAlerts.count();
      expect(errorCount).toBeGreaterThan(0);
    }).toPass({ timeout: 5000 });
  });

  test('should validate email format', async () => {
    await test.step('Enter invalid email and verify error', async () => {
      await formPage.emailInput.fill('not-an-email');
      await formPage.emailInput.blur();

      /// Get the error associated with the email field specifically
      const emailError = formPage.page.locator('#contact-email-error');
      await expect(emailError).toBeVisible();
      await expect(emailError).toContainText(/email|valid/i);
    });
  });

  test('should clear error when valid data is entered', async () => {
    await test.step('Fix validation error with valid input', async () => {
      /// First trigger error
      await formPage.nameInput.focus();
      await formPage.nameInput.blur();
      await expect(formPage.errorAlerts.first()).toBeVisible();

      /// Then fix it
      await formPage.nameInput.fill('John Doe');
      await formPage.nameInput.blur();

      /// Field should not have aria-invalid
      await expect(formPage.nameInput).not.toHaveAttribute(
        'aria-invalid',
        'true',
      );
    });
  });

  test('should handle multiple field errors after user interaction', async () => {
    await test.step('Interact with fields to trigger validation', async () => {
      /// Touch each field (click and blur) to trigger on-touch error display
      await formPage.nameInput.focus();
      await formPage.nameInput.blur();

      await formPage.emailInput.focus();
      await formPage.emailInput.blur();

      /// Now with on-touch strategy, errors should be visible
      const errorCount = await formPage.errorAlerts.count();
      expect(errorCount).toBeGreaterThanOrEqual(2); /// At least name and email errors
    });
  });
});
