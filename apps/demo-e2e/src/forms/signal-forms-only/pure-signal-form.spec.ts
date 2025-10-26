import { expect, test } from '@playwright/test';
import { verifyNoErrorsOnInitialLoad } from '../../fixtures/form-validation.fixture';
import { PureSignalFormPage } from '../../page-objects/pure-signal-form.page';

/**
 * Pure Signal Form (Baseline) - E2E Tests
 *
 * Tests Angular Signal Forms without toolkit enhancements.
 * This baseline demonstrates:
 * - Manual ARIA attribute management
 * - Manual touch state tracking
 * - Manual error visibility logic
 * - Pure Signal Forms validation
 *
 * Compare with toolkit-enhanced forms to see productivity gains.
 */

test.describe('Pure Signal Form (Baseline)', () => {
  let formPage: PureSignalFormPage;

  test.beforeEach(async ({ page }) => {
    formPage = new PureSignalFormPage(page);
    await formPage.goto();
  });

  test('should NOT show errors on initial load (CRITICAL BUG CHECK)', async ({
    page,
  }) => {
    await test.step('Verify no errors visible on page load', async () => {
      const result = await verifyNoErrorsOnInitialLoad(page, {
        visibleFieldSelectors: [
          'input#pure-email',
          'input#pure-password',
          'input#pure-confirm-password',
        ],
      });

      expect(result).toBeUndefined();
    });
  });

  test('should display form with all required fields', async () => {
    await test.step('Verify form structure', async () => {
      await expect(formPage.form).toBeVisible();
      await expect(formPage.emailInput).toBeVisible();
      await expect(formPage.passwordInput).toBeVisible();
      await expect(formPage.confirmPasswordInput).toBeVisible();
      await expect(formPage.submitButton).toBeVisible();
    });

    await test.step('Verify field labels', async () => {
      const emailLabel = formPage.page.locator('label[for="pure-email"]');
      const passwordLabel = formPage.page.locator('label[for="pure-password"]');
      const confirmPasswordLabel = formPage.page.locator(
        'label[for="pure-confirm-password"]',
      );

      await expect(emailLabel).toContainText(/Email Address/i);
      await expect(passwordLabel).toContainText(/^Password/i);
      await expect(confirmPasswordLabel).toContainText(/Confirm Password/i);
    });
  });

  test('should show validation errors after blur', async () => {
    await test.step('Touch email field and verify error appears', async () => {
      await formPage.emailInput.focus();
      await formPage.emailInput.blur();

      await expect(formPage.emailError).toBeVisible();
      await expect(formPage.emailInput).toHaveAttribute('aria-invalid', 'true');
      await expect(formPage.emailInput).toHaveAttribute(
        'aria-describedby',
        'pure-email-error',
      );
    });

    await test.step('Touch password field and verify error appears', async () => {
      await formPage.passwordInput.focus();
      await formPage.passwordInput.blur();

      await expect(formPage.passwordError).toBeVisible();
      await expect(formPage.passwordInput).toHaveAttribute(
        'aria-invalid',
        'true',
      );
    });
  });

  test('should validate email format', async () => {
    await test.step('Enter invalid email and verify error message', async () => {
      await formPage.fillEmail('not-an-email');
      await formPage.emailInput.blur();

      await expect(formPage.emailError).toBeVisible();
      await expect(formPage.emailError).toContainText(/email|invalid/i);
    });

    await test.step('Enter valid email and verify error clears', async () => {
      await formPage.fillEmail('test@example.com');
      await formPage.emailInput.blur();

      await expect(formPage.emailError).toBeHidden();
      await expect(formPage.emailInput).not.toHaveAttribute(
        'aria-invalid',
        'true',
      );
    });
  });

  test('should clear error when valid email is entered', async () => {
    await test.step('Start with invalid email', async () => {
      await formPage.fillEmail('invalid');
      await formPage.emailInput.blur();
      await expect(formPage.emailError).toBeVisible();
    });

    await test.step('Enter valid email and verify error clears', async () => {
      await formPage.fillEmail('valid@example.com');
      await formPage.emailInput.blur();

      await expect(formPage.emailError).toBeHidden();
      await expect(formPage.emailInput).not.toHaveAttribute(
        'aria-invalid',
        'true',
      );
      await expect(formPage.emailInput).not.toHaveAttribute('aria-describedby');
    });
  });

  test('should validate password requirements', async () => {
    await test.step('Enter short password and verify error', async () => {
      await formPage.fillPassword('short');
      await formPage.passwordInput.blur();

      await expect(formPage.passwordError).toBeVisible();
      await expect(formPage.passwordError).toContainText(/at least 8/i);
    });

    await test.step('Enter valid password and verify error clears', async () => {
      await formPage.fillPassword('password123');
      await formPage.passwordInput.blur();

      await expect(formPage.passwordError).toBeHidden();
    });
  });

  test('should validate password confirmation matches', async () => {
    await test.step('Fill password and mismatched confirmation', async () => {
      await formPage.fillPassword('password123');
      await formPage.fillConfirmPassword('different');
      await formPage.confirmPasswordInput.blur();
      // Cross-field mismatch is a ROOT-LEVEL error in this baseline form.
      // Assert the visible feedback mentions the mismatch. Use a specific
      // paragraph locator to avoid strict mode ambiguity.
      const rootErrorText = formPage.page.locator('p', {
        hasText: /Passwords do not match/i,
      });
      await expect(rootErrorText).toBeVisible();
    });

    await test.step('Fix confirmation and verify error clears', async () => {
      await formPage.fillConfirmPassword('password123');
      await formPage.confirmPasswordInput.blur();

      // Root-level mismatch should be resolved
      const rootErrorText = formPage.page.locator('p', {
        hasText: /Passwords do not match/i,
      });
      await expect(rootErrorText).toHaveCount(0);
    });
  });

  test('should submit valid form successfully', async () => {
    await test.step('Fill form with valid data', async () => {
      await formPage.fillValidData();
      await formPage.submitForm();

      // After successful submission, form should reset
      await expect(formPage.emailInput).toHaveValue('');
      await expect(formPage.passwordInput).toHaveValue('');
      await expect(formPage.confirmPasswordInput).toHaveValue('');
    });
  });

  test('should prevent submission with invalid data and show errors', async () => {
    await test.step('Submit empty form', async () => {
      await formPage.submitForm();

      // Baseline Signal Forms do not auto-mark fields touched on submit.
      // Manually blur fields to surface required errors.
      await formPage.emailInput.focus();
      await formPage.emailInput.blur();
      await formPage.passwordInput.focus();
      await formPage.passwordInput.blur();
      await formPage.confirmPasswordInput.focus();
      await formPage.confirmPasswordInput.blur();

      await expect(formPage.emailError).toBeVisible();
      await expect(formPage.passwordError).toBeVisible();
      await expect(formPage.confirmPasswordError).toBeVisible();
    });

    await test.step('Form should still be present (not submitted)', async () => {
      await expect(formPage.form).toBeVisible();
      await expect(formPage.submitButton).toBeVisible();
    });
  });

  test('should track touched state independently per field', async () => {
    await test.step('Touch only email field', async () => {
      await formPage.emailInput.focus();
      await formPage.emailInput.blur();

      await expect(formPage.emailError).toBeVisible();
      await expect(formPage.passwordError).toBeHidden();
      await expect(formPage.confirmPasswordError).toBeHidden();
    });

    await test.step('Touch password field', async () => {
      await formPage.passwordInput.focus();
      await formPage.passwordInput.blur();

      await expect(formPage.emailError).toBeVisible();
      await expect(formPage.passwordError).toBeVisible();
      await expect(formPage.confirmPasswordError).toBeHidden();
    });
  });
});
