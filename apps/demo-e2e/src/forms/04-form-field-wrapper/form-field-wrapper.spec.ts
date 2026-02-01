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
      // Name field has search icon prefix (SVG icon)
      const namePrefix = formPage.form.locator('svg[prefix]').first();
      await expect(namePrefix).toBeAttached();
    });

    await test.step('Verify email field has icon prefix', async () => {
      // Email field has envelope icon prefix wrapped in span
      // Use nth(0) since we're looking at spans with prefix containing SVG (skips direct svg[prefix])
      const emailPrefix = formPage.form
        .locator('span[prefix]')
        .filter({ has: formPage.page.locator('svg') })
        .first();
      await expect(emailPrefix).toBeAttached();
    });

    await test.step('Verify website field has globe icon prefix', async () => {
      // Website field has globe icon prefix wrapped in span
      const websitePrefix = formPage.form
        .locator('span[prefix]')
        .filter({ has: formPage.page.locator('svg') })
        .nth(1);
      await expect(websitePrefix).toBeAttached();
    });
  });

  test('should render contextual icons in complex forms', async () => {
    await formPage.gotoComplexForms();

    await test.step('Verify email icon prefix', async () => {
      // Email field has SVG icon prefix
      const emailPrefix = formPage.form.locator('svg[prefix]').first();
      await expect(emailPrefix).toBeVisible();
    });

    await test.step('Verify location icon prefix for street', async () => {
      // Street field has SVG icon prefix
      const streetPrefix = formPage.form.locator('svg[prefix]').nth(1);
      await expect(streetPrefix).toBeVisible();
    });

    await test.step('Verify years suffix for age field', async () => {
      // Age field has "years" suffix text (aria-hidden="true" for decorative text)
      const ageSuffix = formPage.form
        .locator('[suffix]')
        .filter({ hasText: 'years' });
      await ageSuffix.scrollIntoViewIfNeeded();
      // Use toBeAttached() instead of toBeVisible() since aria-hidden elements
      // are considered hidden by Playwright's visibility checks
      await expect(ageSuffix).toBeAttached();
      await expect(ageSuffix).toHaveText('years');
    });
  });

  test('should have correct default label spacing (wrapper check)', async () => {
    console.log('Running updated label spacing test');

    await test.step('Verify default label spacing', async () => {
      // The CSS applies padding-inline-start: 2px to the label wrapper
      const labelWrapper = formPage.form
        .locator('.ngx-signal-form-field-wrapper__label')
        .first();
      await expect(labelWrapper).toHaveCSS('padding-inline-start', '2px');
    });
  });

  test('should handle interactive suffix buttons', async () => {
    await formPage.gotoComplexForms();

    await test.step('Verify remove button suffix in skills section', async () => {
      // Skills section has remove buttons as suffix
      const removeButton = formPage.form
        .getByRole('button', { name: /Remove skill/ })
        .first();

      // Scroll the button into view first
      await removeButton.scrollIntoViewIfNeeded();

      // Verify the button exists and has suffix attribute
      await expect(removeButton).toHaveAttribute('suffix', '');

      // Verify button is interactive (can be clicked)
      // Using toHaveCount ensures the element exists in the DOM
      await expect(removeButton).toHaveCount(1);
    });

    await test.step('Verify remove button suffix in contacts section', async () => {
      // Contacts section has remove buttons as suffix
      const removeButton = formPage.form
        .getByRole('button', { name: /Remove contact/ })
        .first();

      await removeButton.scrollIntoViewIfNeeded();

      // Verify the button exists and has suffix attribute
      await expect(removeButton).toHaveAttribute('suffix', '');
      await expect(removeButton).toHaveCount(1);
    });
  });

  test('should auto-derive fieldName from input id for ARIA attributes', async ({
    page,
  }) => {
    await test.step('Trigger error by blurring empty required field', async () => {
      // Name field has id="name" - fieldName should be auto-derived
      await formPage.nameInput.focus();
      await formPage.nameInput.blur();
    });

    await test.step('Verify error element has correct id derived from input id', async () => {
      // Error element should have id="name-error" (derived from input id="name")
      const errorElement = formPage.form.locator('#name-error');
      await expect(errorElement).toBeVisible();
    });

    await test.step('Verify input has aria-describedby linking to error', async () => {
      // Input should have aria-describedby pointing to the error element
      await expect(formPage.nameInput).toHaveAttribute(
        'aria-describedby',
        /name-error/,
      );
    });

    await test.step('Verify aria-invalid is set correctly', async () => {
      // Input should have aria-invalid="true" when invalid and touched
      await expect(formPage.nameInput).toHaveAttribute('aria-invalid', 'true');
    });
  });

  test('should work without explicit fieldName attribute', async () => {
    await test.step('Verify form works with auto-derived fieldName', async () => {
      // Fill in valid data
      await formPage.nameInput.fill('John Doe');
      await formPage.nameInput.blur();

      // Verify no error shown (field is valid)
      await expect(formPage.nameInput).not.toHaveAttribute(
        'aria-invalid',
        'true',
      );
    });

    await test.step('Verify multiple fields all derive fieldName correctly', async () => {
      // Email field has id="email" - fieldName should be auto-derived
      const emailInput = formPage.form.locator('#email');
      await emailInput.focus();
      await emailInput.blur();

      // Error should appear with correct id
      const emailError = formPage.form.locator('#email-error');
      await expect(emailError).toBeVisible();
    });
  });
});
