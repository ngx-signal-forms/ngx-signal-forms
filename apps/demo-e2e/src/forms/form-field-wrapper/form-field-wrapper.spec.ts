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

  test('should render prefix and suffix elements', async () => {
    await test.step('Verify prefix elements are visible', async () => {
      // Name field has search icon prefix (🔍)
      const namePrefix = formPage.form
        .locator('[prefix]')
        .filter({ hasText: '🔍' });
      await expect(namePrefix).toBeVisible();
    });

    await test.step('Verify suffix elements are visible', async () => {
      // Age field has "years" suffix
      const ageSuffix = formPage.form
        .locator('[suffix]')
        .filter({ hasText: 'years' });
      await expect(ageSuffix).toBeVisible();
    });

    await test.step('Verify website field has https:// prefix', async () => {
      const websitePrefix = formPage.form
        .locator('[prefix]')
        .filter({ hasText: 'https://' });
      await expect(websitePrefix).toBeVisible();
    });
  });

  test('should render contextual icons in complex forms', async () => {
    await formPage.gotoComplexForms();

    await test.step('Verify email icon prefix', async () => {
      const emailPrefix = formPage.form
        .locator('[prefix]')
        .filter({ hasText: '📧' })
        .first();
      await expect(emailPrefix).toBeVisible();
    });

    await test.step('Verify location icon prefix for street', async () => {
      const streetPrefix = formPage.form
        .locator('[prefix]')
        .filter({ hasText: '📍' });
      await expect(streetPrefix).toBeVisible();
    });

    await test.step('Verify years suffix for age', async () => {
      const ageSuffix = formPage.form
        .locator('[suffix]')
        .filter({ hasText: 'years' });
      await expect(ageSuffix).toBeVisible();
    });
  });

  test('should handle interactive suffix buttons', async () => {
    await formPage.gotoComplexForms();

    await test.step('Verify remove button suffix in skills section', async () => {
      // Skills section has remove buttons as suffix
      // Button itself has [suffix] attribute
      const removeButton = formPage.form
        .getByRole('button', { name: /Remove skill/ })
        .first();

      await expect(removeButton).toBeVisible();
      await expect(removeButton).toHaveAttribute('suffix');
    });

    await test.step('Verify remove button suffix in contacts section', async () => {
      // Contacts section has remove buttons as suffix
      const removeButton = formPage.form
        .getByRole('button', { name: /Remove contact/ })
        .first();

      await expect(removeButton).toBeVisible();
      await expect(removeButton).toHaveAttribute('suffix');
    });
  });
});
