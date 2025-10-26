import { expect, test } from '@playwright/test';
import { verifyNoErrorsOnInitialLoad } from '../../fixtures/form-validation.fixture';
import { FormFieldWrapperPage } from '../../page-objects/form-field-wrapper.page';

/**
 * Tests for "Form Field Wrapper" demo
 * Route: /form-field-wrapper/basic-usage
 */
test.describe('Form Field Wrapper', () => {
  let formPage: FormFieldWrapperPage;

  test.beforeEach(async ({ page }) => {
    formPage = new FormFieldWrapperPage(page);
    await formPage.goto();
  });

  test('should NOT show errors on initial page load', async ({ page }) => {
    await verifyNoErrorsOnInitialLoad(page);
  });

  test('should render form field wrapper component', async () => {
    await test.step('Verify form field wrapper is present', async () => {
      await expect(formPage.form).toBeVisible();
      await expect(formPage.formFieldComponents.first()).toBeVisible();
    });
  });

  test('should auto-display errors with field wrapper', async () => {
    await test.step('Verify automatic error display', async () => {
      await formPage.nameInput.focus();
      await formPage.nameInput.blur();

      const errorInForm = formPage.form.locator('[role="alert"]').first();
      await expect(errorInForm).toBeVisible();
    });
  });

  test('should handle complex forms with nested fields', async () => {
    await formPage.gotoComplexForms();

    await test.step('Verify complex form structure', async () => {
      await expect(formPage.form).toBeVisible();
      await expect(formPage.allInputs.first()).toBeVisible();
    });
  });
});
