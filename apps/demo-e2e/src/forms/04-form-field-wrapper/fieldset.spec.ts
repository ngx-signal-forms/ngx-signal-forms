import { expect, test } from '@playwright/test';
import { verifyNoErrorsOnInitialLoad } from '../../fixtures/form-validation.fixture';
import { FieldsetPage } from '../../page-objects/fieldset.page';

test.describe('Form Fieldset - Aggregated Errors', () => {
  let page: FieldsetPage;

  test.beforeEach(async ({ page: playwrightPage }) => {
    page = new FieldsetPage(playwrightPage);
    await page.goto();
  });

  test('should NOT show errors on initial load (CRITICAL BUG CHECK)', async ({
    page: playwrightPage,
  }) => {
    const result = await verifyNoErrorsOnInitialLoad(playwrightPage);
    expect(result).toBeUndefined();
  });

  test.describe('Component Structure', () => {
    test('should render shipping address fieldset', async () => {
      await expect(page.shippingFieldset).toBeVisible();
    });

    test('should render credentials fieldset', async () => {
      await expect(page.credentialsFieldset).toBeVisible();
    });

    test('should initially show 2 fieldsets (shipping + credentials)', async () => {
      // Wait for at least one fieldset to be visible before counting
      await expect(page.shippingFieldset).toBeVisible();
      await expect(page.allFieldsets).toHaveCount(2);
    });

    test('should have billing checkbox checked by default', async () => {
      await expect(page.billingSameAsShippingCheckbox).toBeChecked();
    });
  });

  test.describe('Conditional Fieldset Visibility', () => {
    test('should show billing fieldset when checkbox unchecked', async () => {
      // Initially billing fieldset is hidden
      await expect(page.billingFieldset).toBeHidden();

      // Uncheck the "same as shipping" checkbox
      await page.toggleBillingSameAsShipping();

      // Now billing fieldset should be visible
      await expect(page.billingFieldset).toBeVisible();
    });

    test('should hide billing fieldset when checkbox re-checked', async () => {
      // Show billing fieldset
      await page.toggleBillingSameAsShipping();
      await expect(page.billingFieldset).toBeVisible();

      // Hide it again
      await page.toggleBillingSameAsShipping();
      await expect(page.billingFieldset).toBeHidden();
    });
  });

  test.describe('Aggregated Error Display', () => {
    test('should show aggregated errors in shipping fieldset', async () => {
      // Interact with a field to trigger touched state
      await page.shippingStreetInput.focus();
      await page.shippingStreetInput.blur();

      // Error should appear at fieldset level
      const errors = page.getFieldsetErrors(page.shippingFieldset);
      await expect(errors.first()).toBeVisible();
    });

    test('should show aggregated errors in credentials fieldset', async () => {
      // Interact with password field
      await page.passwordInput.focus();
      await page.passwordInput.blur();

      // Error should appear at fieldset level
      const errors = page.getFieldsetErrors(page.credentialsFieldset);
      await expect(errors.first()).toBeVisible();
    });

    test('should show password mismatch error', async () => {
      // Enter different passwords
      await page.passwordInput.fill('Password123');
      await page.confirmPasswordInput.fill('DifferentPassword');
      await page.confirmPasswordInput.blur();

      // Password mismatch error should appear at fieldset level
      const fieldsetErrors = page.credentialsFieldset.locator(
        '.ngx-signal-form-fieldset__messages .ngx-signal-form-error',
      );
      await expect(fieldsetErrors).toContainText(/do not match/i);
    });
  });

  test.describe('Form Validation', () => {
    test('should clear errors when fields are filled correctly', async () => {
      // Trigger errors first
      await page.shippingStreetInput.focus();
      await page.shippingStreetInput.blur();

      // Verify error appeared
      const errors = page.getFieldsetErrors(page.shippingFieldset);
      await expect(errors.first()).toBeVisible();

      // Fill the form correctly
      await page.fillShippingAddress();
      await page.fillCredentials();

      // Errors should clear after filling correctly
      await expect(page.shippingFieldset).not.toHaveClass(
        /ngx-signal-form-fieldset--invalid/,
      );
    });

    test('should handle form submission with invalid data', async () => {
      await page.submit();

      // After submission, errors should be visible
      await expect(page.errorAlerts.first()).toBeVisible();
    });

    test('should submit successfully with all valid data', async () => {
      // Fill all fields correctly
      await page.fillShippingAddress();
      await page.fillCredentials();

      // Submit button should not be disabled
      await expect(page.submitButton).toBeEnabled();
    });
  });

  test.describe('Form Reset', () => {
    test('should reset form to initial state', async () => {
      // Fill some fields
      await page.shippingStreetInput.fill('Test Street');
      await page.passwordInput.fill('testpass');

      // Reset
      await page.reset();

      // Fields should be empty
      await expect(page.shippingStreetInput).toHaveValue('');
      await expect(page.passwordInput).toHaveValue('');
    });
  });

  test.describe('Accessibility', () => {
    test('should have fieldset with invalid class when invalid', async () => {
      // Trigger validation
      await page.shippingStreetInput.focus();
      await page.shippingStreetInput.blur();

      // Fieldset should have invalid class
      await expect(page.shippingFieldset).toHaveClass(
        /ngx-signal-form-fieldset--invalid/,
      );
    });

    test('should have error alert with proper role', async () => {
      // Trigger validation
      await page.shippingStreetInput.focus();
      await page.shippingStreetInput.blur();

      // Error messages should have role="alert" for accessibility
      const errorAlert = page.shippingFieldset.locator('[role="alert"]');
      await expect(errorAlert.first()).toBeVisible();
    });
  });
});
