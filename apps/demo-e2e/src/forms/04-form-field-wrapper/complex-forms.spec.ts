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
      await expect(page.allFormControls.first()).toBeVisible();
      const controlCount = await page.allFormControls.count();
      expect(controlCount).toBeGreaterThan(0);
    });

    test('should count form field wrappers', async () => {
      await expect(page.formFields.first()).toBeVisible();
      const count = await page.countFormFields();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('Fieldset Grouping', () => {
    test('should render all fieldset sections', async () => {
      await expect(page.personalInfoFieldset).toBeVisible();
      await expect(page.addressInfoFieldset).toBeVisible();
      await expect(page.skillsFieldset).toBeVisible();
      await expect(page.contactsFieldset).toBeVisible();
      await expect(page.preferencesFieldset).toBeVisible();
    });

    test('should have exactly 6 fieldsets', async () => {
      await expect(page.fieldsets.first()).toBeVisible();
      const count = await page.countFieldsets();
      expect(count).toBe(6);
    });

    test('should render contact method radio group in preferences', async () => {
      await expect(page.preferencesContactRadios).toHaveCount(3);
    });

    test('should display aggregated errors in fieldset after submit', async () => {
      await page.submit();

      // Touch a field to trigger error display
      await page.allFormControls.first().focus();
      await page.allFormControls.first().blur();

      // Check that fieldset displays aggregated errors
      await expect(
        page.getFieldsetErrorsByLegend(/Personal Information/i).first(),
      ).toBeVisible({ timeout: 5000 });
    });

    test('fieldsets should have proper accessibility structure', async () => {
      // Check fieldset component renders content including a legend
      const legend = page.personalInfoFieldset.locator('legend');
      await expect(legend).toBeVisible();
      await expect(legend).toContainText('Personal Information');
    });
  });

  test.describe('Auto Error Display', () => {
    test('should automatically display errors with field wrapper', async () => {
      const firstInput = page.allFormControls.first();
      await firstInput.focus();
      await firstInput.blur();

      await expect(page.errorAlerts.first()).toBeVisible();
    });

    test('should show preference contact method errors after touch', async () => {
      await page.preferencesContactRadios.first().focus();
      await page.preferencesContactRadios.first().blur();

      await expect(
        page.getFieldsetErrorsByLegend(/Preferred contact method/i).first(),
      ).toBeVisible();
    });
  });

  test.describe('Form Submission', () => {
    test('should have submit button', async () => {
      await expect(page.submitButton).toBeVisible();
    });

    test('should handle submission attempt with invalid data', async () => {
      await page.submit();

      await page.allFormControls.first().focus();
      await page.allFormControls.first().blur();

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
