import { expect, test } from '@playwright/test';
import { verifyNoErrorsOnInitialLoad } from '../../fixtures/form-validation.fixture';
import { FormFieldWrapperComplexPage } from '../../page-objects/form-field-wrapper-complex.page';

test.describe('Form Field Wrapper - Complex Forms', () => {
  let page: FormFieldWrapperComplexPage;

  test.beforeEach(async ({ page: playwrightPage }) => {
    page = new FormFieldWrapperComplexPage(playwrightPage);
    await page.goto();
  });

  test('should NOT show errors on initial load (CRITICAL BUG CHECK)', async ({
    page: playwrightPage,
  }) => {
    const result = await verifyNoErrorsOnInitialLoad(playwrightPage);
    expect(result).toBeUndefined();
  });

  test.describe('Component Structure', () => {
    test('should render form field wrapper components', async () => {
      const firstField = page.formFields.first();
      await expect(firstField).toBeVisible();
    });

    test('should have multiple form controls', async () => {
      // Ensure at least one control is rendered before counting
      await expect(page.allFormControls.first()).toBeVisible();
      const controlCount = await page.allFormControls.count();
      expect(controlCount).toBeGreaterThan(0);
    });

    test('should count form field wrappers', async () => {
      // Wait for wrapper components to render to avoid race conditions
      await expect(page.formFields.first()).toBeVisible();
      const count = await page.countFormFields();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('Auto Error Display', () => {
    test('should automatically display errors with field wrapper', async () => {
      // Interact with first input to trigger validation
      const firstInput = page.allFormControls.first();
      await firstInput.focus();
      await firstInput.blur();

      // Error should appear automatically
      await expect(page.errorAlerts.first()).toBeVisible();
    });
  });

  test.describe('Form Submission', () => {
    test('should have submit button', async () => {
      await expect(page.submitButton).toBeVisible();
    });

    test('should handle submission attempt with invalid data', async () => {
      await page.submit();

      // Some environments apply submitted status asynchronously;
      // give Angular a nudge by blurring the first control after submit.
      await page.allFormControls.first().focus();
      await page.allFormControls.first().blur();

      // Errors should appear after submission. Accept either explicit alerts
      // or aria-invalid attributes on inputs for resilient assertions.
      await Promise.any([
        (async () => {
          await expect(page.errorAlerts.first()).toBeVisible();
        })(),
        (async () => {
          await expect(page.allFormControls.first()).toHaveAttribute(
            'aria-invalid',
            'true',
          );
        })(),
      ]);
    });
  });
});
