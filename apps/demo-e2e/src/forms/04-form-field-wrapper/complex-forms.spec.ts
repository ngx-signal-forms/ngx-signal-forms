import { expect, test } from '@playwright/test';
import { FormFieldWrapperComplexPage } from '../../page-objects/form-field-wrapper-complex.page';

async function getY(locator: Parameters<typeof expect>[0]) {
  const box = await locator.boundingBox();

  if (!box) {
    throw new Error('Expected locator to have a bounding box.');
  }

  return box.y;
}

test.describe('Form Field Wrapper - Complex Forms', () => {
  let page: FormFieldWrapperComplexPage;

  test.beforeEach(async ({ page: playwrightPage }) => {
    page = new FormFieldWrapperComplexPage(playwrightPage);
    await page.goto();
  });

  test('should keep the main complex form free of errors on initial load', async ({
    page: playwrightPage,
  }) => {
    await playwrightPage.waitForLoadState('domcontentloaded');
    await page.form.locator('#shippingStreet').waitFor({ state: 'visible' });
    await expect(page.form.locator('[role="alert"]')).toHaveCount(0);
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

  test.describe('Placement playground', () => {
    test('should render the filled-state design preview with outline styling', async ({
      page: playwrightPage,
    }) => {
      const dateInput = playwrightPage.locator('#placementDesignPreviewDate');
      const dateWrapper = dateInput.locator(
        'xpath=ancestor::ngx-signal-form-field-wrapper[1]',
      );
      const deliveryFieldset = playwrightPage.locator(
        '[fieldsetid="placement-design-preview-delivery"]',
      );

      await expect(dateInput).toHaveValue('12-03-2026');
      await expect(dateWrapper).toHaveClass(/ngx-signal-forms-outline/);
      await expect(dateWrapper.locator('[suffix]')).toBeVisible();
      await expect(
        playwrightPage.locator('#placementDesignPreviewStreet'),
      ).toHaveValue('Keizersgracht 120');
      await expect(
        playwrightPage.locator('#placementDesignPreviewCity'),
      ).toHaveValue('Amsterdam');
      await expect(
        deliveryFieldset.getByRole('radio', {
          name: /Express \(1-2 business days\)/i,
        }),
      ).toBeChecked();
    });

    test('should intentionally show sandbox alerts on initial load', async ({
      page: playwrightPage,
    }) => {
      const playground = playwrightPage.getByRole('region', {
        name: /Placement playground/i,
      });

      await expect(playground.getByRole('alert')).toHaveCount(3);
      await expect(playground.getByRole('alert').nth(0)).toContainText(
        'Email is required',
      );
      await expect(playground.getByRole('alert').nth(1)).toContainText(
        'Street is required',
      );
      await expect(playground.getByRole('alert').nth(2)).toContainText(
        'Delivery method is required',
      );
    });

    test('should render the documented default placements', async ({
      page: playwrightPage,
    }) => {
      const playground = playwrightPage.getByRole('region', {
        name: /Placement playground/i,
      });
      const wrapperPreview = playwrightPage.locator('#placementPreviewEmail');
      const wrapperHost = wrapperPreview.locator(
        'xpath=ancestor::ngx-signal-form-field-wrapper[1]',
      );
      const wrapperAlert = playground.getByRole('alert').filter({
        hasText: 'Email is required',
      });

      const addressFieldset = playwrightPage.locator(
        '[fieldsetid="placement-preview-address"]',
      );
      const addressAlert = addressFieldset.getByRole('alert');
      const addressInput = playwrightPage.locator('#placementPreviewStreet');

      const deliveryFieldset = playwrightPage.locator(
        '[fieldsetid="placement-preview-delivery"]',
      );
      const deliveryAlert = deliveryFieldset.getByRole('alert');
      const deliveryRadio = deliveryFieldset.getByRole('radio', {
        name: /Standard \(3-5 business days\)/i,
      });

      await expect(playground).toBeVisible();
      await expect(wrapperHost).toHaveAttribute(
        'data-error-placement',
        'bottom',
      );
      await expect(addressFieldset).toHaveAttribute(
        'data-error-placement',
        'top',
      );
      await expect(deliveryFieldset).toHaveAttribute(
        'data-error-placement',
        'top',
      );

      expect(await getY(wrapperAlert)).toBeGreaterThan(
        await getY(wrapperPreview),
      );
      expect(await getY(addressAlert)).toBeLessThan(await getY(addressInput));
      expect(await getY(deliveryAlert)).toBeLessThan(await getY(deliveryRadio));
    });

    test('should move wrapper, fieldset, and radio-group messages when toggled', async ({
      page: playwrightPage,
    }) => {
      const wrapperToggle = playwrightPage.getByRole('group', {
        name: /Form-field wrapper/i,
      });
      const fieldsetToggle = playwrightPage.getByRole('group', {
        name: /Grouped fieldset/i,
      });
      const radioToggle = playwrightPage.getByRole('group', {
        name: /Radio-button group/i,
      });

      const wrapperPreview = playwrightPage.locator('#placementPreviewEmail');
      const wrapperHost = wrapperPreview.locator(
        'xpath=ancestor::ngx-signal-form-field-wrapper[1]',
      );
      const wrapperAlert = playwrightPage.getByRole('alert').filter({
        hasText: 'Email is required',
      });

      const addressFieldset = playwrightPage.locator(
        '[fieldsetid="placement-preview-address"]',
      );
      const addressAlert = addressFieldset.getByRole('alert');
      const addressInput = playwrightPage.locator('#placementPreviewStreet');

      const deliveryFieldset = playwrightPage.locator(
        '[fieldsetid="placement-preview-delivery"]',
      );
      const deliveryAlert = deliveryFieldset.getByRole('alert');
      const deliveryRadio = deliveryFieldset.getByRole('radio', {
        name: /Standard \(3-5 business days\)/i,
      });

      await test.step('Switch placements', async () => {
        await wrapperToggle.getByRole('button', { name: 'Top' }).click();
        await fieldsetToggle.getByRole('button', { name: 'Bottom' }).click();
        await radioToggle.getByRole('button', { name: 'Bottom' }).click();
      });

      await expect(wrapperHost).toHaveAttribute('data-error-placement', 'top');
      await expect(addressFieldset).toHaveAttribute(
        'data-error-placement',
        'bottom',
      );
      await expect(deliveryFieldset).toHaveAttribute(
        'data-error-placement',
        'bottom',
      );

      expect(await getY(wrapperAlert)).toBeLessThan(await getY(wrapperPreview));
      expect(await getY(addressAlert)).toBeGreaterThan(
        await getY(addressInput),
      );
      expect(await getY(deliveryAlert)).toBeGreaterThan(
        await getY(deliveryRadio),
      );
    });

    test('should restore documented defaults when the sandbox is reset', async ({
      page: playwrightPage,
    }) => {
      const wrapperToggle = playwrightPage.getByRole('group', {
        name: /Form-field wrapper/i,
      });
      const fieldsetToggle = playwrightPage.getByRole('group', {
        name: /Grouped fieldset/i,
      });
      const radioToggle = playwrightPage.getByRole('group', {
        name: /Radio-button group/i,
      });

      const wrapperPreview = playwrightPage.locator('#placementPreviewEmail');
      const wrapperHost = wrapperPreview.locator(
        'xpath=ancestor::ngx-signal-form-field-wrapper[1]',
      );
      const addressFieldset = playwrightPage.locator(
        '[fieldsetid="placement-preview-address"]',
      );
      const deliveryFieldset = playwrightPage.locator(
        '[fieldsetid="placement-preview-delivery"]',
      );

      await wrapperToggle.getByRole('button', { name: 'Top' }).click();
      await fieldsetToggle.getByRole('button', { name: 'Bottom' }).click();
      await radioToggle.getByRole('button', { name: 'Bottom' }).click();

      await playwrightPage
        .getByRole('button', { name: /Reset placement sandbox/i })
        .click();

      await expect(wrapperHost).toHaveAttribute(
        'data-error-placement',
        'bottom',
      );
      await expect(addressFieldset).toHaveAttribute(
        'data-error-placement',
        'top',
      );
      await expect(deliveryFieldset).toHaveAttribute(
        'data-error-placement',
        'top',
      );

      await expect(
        wrapperToggle.getByRole('button', { name: 'Bottom' }),
      ).toHaveAttribute('aria-pressed', 'true');
      await expect(
        fieldsetToggle.getByRole('button', { name: 'Top' }),
      ).toHaveAttribute('aria-pressed', 'true');
      await expect(
        radioToggle.getByRole('button', { name: 'Top' }),
      ).toHaveAttribute('aria-pressed', 'true');

      await expect(
        playwrightPage.locator('#placementPreviewEmail-error'),
      ).toContainText('Email is required');
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
