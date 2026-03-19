import { expect, type Locator, test } from '@playwright/test';
import { FieldsetGroupingPage } from '../../page-objects/fieldset-grouping.page';

async function getY(locator: Locator) {
  const box = await locator.boundingBox();

  if (!box) {
    throw new Error('Expected locator to have a bounding box.');
  }

  return box.y;
}

test.describe('Form Field Wrapper - Fieldset Grouping + Errors', () => {
  let page: FieldsetGroupingPage;

  test.beforeEach(async ({ page: playwrightPage }) => {
    page = new FieldsetGroupingPage(playwrightPage);
    await page.goto();
  });

  test('should render the dedicated fieldset grouping page structure', async () => {
    await expect(
      page.page.getByRole('heading', { name: /Fieldset Grouping \+ Errors/i }),
    ).toBeVisible();
    await expect(page.errorPlacementGroup).toBeVisible();
    await expect(page.placementPlayground).toBeVisible();
    await expect(page.form).toBeVisible();
  });

  test('should keep the main grouped form free of errors on initial load', async () => {
    await page.shippingStreetInput.waitFor({ state: 'visible' });
    await expect(page.form.locator('[role="alert"]')).toHaveCount(0);
  });

  test('should intentionally show sandbox alerts on initial load', async () => {
    await expect(page.placementPlayground.getByRole('alert')).toHaveCount(3);
    await expect(page.wrapperPreviewAlert).toContainText('Email is required');
    await expect(page.addressPreviewAlert).toContainText('Street is required');
    await expect(page.deliveryPreviewAlert).toContainText(
      'Delivery method is required',
    );
  });

  test('should render the documented default placements for wrapper and grouped fieldsets', async () => {
    await expect(page.wrapperPreviewHost).toHaveAttribute(
      'data-error-placement',
      'top',
    );
    await expect(page.addressPreviewFieldset).toHaveAttribute(
      'data-error-placement',
      'top',
    );
    await expect(page.deliveryPreviewFieldset).toHaveAttribute(
      'data-error-placement',
      'top',
    );

    expect(await getY(page.wrapperPreviewAlert)).toBeLessThan(
      await getY(page.wrapperPreview),
    );
    expect(await getY(page.addressPreviewAlert)).toBeLessThan(
      await getY(page.addressPreviewInput),
    );
    expect(await getY(page.deliveryPreviewAlert)).toBeLessThan(
      await getY(page.deliveryPreviewRadio),
    );
  });

  test('should move wrapper, grouped fieldset, and radio-group messages together when toggled', async () => {
    await test.step('Switch the shared placement control', async () => {
      await page.errorPlacementGroup
        .getByRole('radio', { name: 'Bottom' })
        .check();
    });

    await expect(page.wrapperPreviewHost).toHaveAttribute(
      'data-error-placement',
      'bottom',
    );
    await expect(page.addressPreviewFieldset).toHaveAttribute(
      'data-error-placement',
      'bottom',
    );
    await expect(page.deliveryPreviewFieldset).toHaveAttribute(
      'data-error-placement',
      'bottom',
    );

    expect(await getY(page.wrapperPreviewAlert)).toBeGreaterThan(
      await getY(page.wrapperPreview),
    );
    expect(await getY(page.addressPreviewAlert)).toBeGreaterThan(
      await getY(page.addressPreviewInput),
    );
    expect(await getY(page.deliveryPreviewAlert)).toBeGreaterThan(
      await getY(page.deliveryPreviewRadio),
    );
  });

  test('should reset sandbox values without changing the shared placement choice', async () => {
    await page.errorPlacementGroup
      .getByRole('radio', { name: 'Bottom' })
      .check();

    await page.deliveryPreviewFieldset
      .getByRole('radio', { name: /Express \(1-2 business days\)/i })
      .check();
    await expect(page.deliveryPreviewAlert).toHaveCount(0);

    await page.resetSandboxButton.click();

    await expect(page.wrapperPreviewHost).toHaveAttribute(
      'data-error-placement',
      'bottom',
    );
    await expect(page.addressPreviewFieldset).toHaveAttribute(
      'data-error-placement',
      'bottom',
    );
    await expect(page.deliveryPreviewFieldset).toHaveAttribute(
      'data-error-placement',
      'bottom',
    );

    await expect(
      page.errorPlacementGroup.getByRole('radio', { name: 'Bottom' }),
    ).toBeChecked();
    await expect(page.deliveryPreviewAlert).toBeVisible();
  });

  test('should reveal grouped fieldset errors after submit in on-touch mode', async () => {
    await page.submit();
    await page.shippingStreetInput.focus();
    await page.shippingStreetInput.blur();

    await expect(page.shippingStreetError).toBeVisible();
    await expect(page.shippingStreetInput).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  });

  test('should keep submit-mode errors hidden until submit and then focus the first invalid field', async () => {
    await page.errorModeRadios.onSubmit.check();

    await page.shippingStreetInput.focus();
    await page.shippingStreetInput.blur();
    await expect(page.form.locator('[role="alert"]')).toHaveCount(0);

    await page.submit();

    await expect(page.shippingStreetInput).toBeFocused();
  });

  test('should reveal billing address fieldset when the shipping toggle is unchecked', async () => {
    await expect(page.billingAddressFieldset).toHaveCount(0);
    await page.billingSameAsShippingCheckbox.uncheck();
    await expect(page.billingAddressFieldset).toBeVisible();

    await page.submit();
    await page.billingStreetInput.focus();
    await page.billingStreetInput.blur();

    await expect(
      page.getFieldsetErrorsByLegend(/Billing Address/i).first(),
    ).toBeVisible();
  });

  test('should show sandbox radio-group summary when no delivery option is selected and clear it when selected', async () => {
    await expect(page.deliveryPreviewAlert).toBeVisible();

    await page.deliveryPreviewFieldset
      .getByRole('radio', { name: /Express \(1-2 business days\)/i })
      .check();

    await expect(page.deliveryPreviewAlert).toHaveCount(0);
  });

  test('should mirror the radio-group placement toggle in the main form fieldset state', async () => {
    await expect(page.deliveryMethodOptionsFieldset).toHaveAttribute(
      'data-error-placement',
      'top',
    );

    await page.errorPlacementGroup
      .getByRole('radio', { name: 'Bottom' })
      .check();

    await expect(page.deliveryMethodOptionsFieldset).toHaveAttribute(
      'data-error-placement',
      'bottom',
    );
  });

  test('should show the credentials fieldset error for mismatched passwords', async () => {
    await page.passwordInput.fill('Password123!');
    await page.confirmPasswordInput.fill('DifferentPassword123!');
    await page.confirmPasswordInput.blur();

    await expect(
      page.getFieldsetErrorsByLegend(/Account Credentials/i).first(),
    ).toBeVisible();
  });

  test('should toggle appearance for the main grouped form', async () => {
    await expect(page.appearanceButtons.outline).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await page.appearanceButtons.standard.click();
    const shippingWrapper = page.shippingStreetInput.locator(
      'xpath=ancestor::ngx-signal-form-field-wrapper[1]',
    );
    await expect(shippingWrapper).not.toHaveClass(/ngx-signal-forms-outline/);

    await page.appearanceButtons.outline.click();
    await expect(shippingWrapper).toHaveClass(/ngx-signal-forms-outline/);
  });
});
