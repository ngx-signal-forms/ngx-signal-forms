import { expect, test } from '@playwright/test';

import { FieldsetAppearancePage } from '../../page-objects/fieldset-appearance.page';

function requireValue<T>(value: T | null, label: string): T {
  if (value === null) {
    throw new Error(`Expected ${label} to be available.`);
  }

  return value;
}

function getMessagePlacement(
  fieldset: Parameters<FieldsetAppearancePage['getGroupedMessages']>[0],
): Promise<'top' | 'bottom' | 'missing'> {
  return fieldset.evaluate((host) => {
    const layoutRoot =
      host.querySelector('.ngx-signal-form-fieldset__surface') ?? host;
    const messageContainer = layoutRoot.querySelector(
      ':scope > .ngx-signal-form-fieldset__messages',
    );
    const contentContainer = layoutRoot.querySelector(
      ':scope > .ngx-signal-form-fieldset__content',
    );
    const children = Array.from(layoutRoot.children);
    const contentIndex = children.findIndex(
      (child) => child === contentContainer,
    );
    const messageIndex = children.findIndex(
      (child) => child === messageContainer,
    );

    if (contentIndex === -1 || messageIndex === -1) {
      return 'missing';
    }

    return messageIndex < contentIndex ? 'top' : 'bottom';
  });
}

test.describe('Form Field Wrapper - Fieldset Appearance', () => {
  let page: FieldsetAppearancePage;

  test.beforeEach(async ({ page: playwrightPage }) => {
    page = new FieldsetAppearancePage(playwrightPage);
    await page.goto();
  });

  test('should render the fieldset demo with the default grouped control state', async () => {
    await expect(page.form).toBeVisible();
    await expect(page.errorAlerts).toHaveCount(3);
    await expect(page.borderedShellButton).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(page.autoFeedbackButton).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(page.bottomPlacementButton).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(page.includeNestedButton).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(page.shippingAddressFieldset).toHaveAttribute(
      'data-appearance',
      'outline',
    );
    await expect(page.shippingAddressFieldset).toHaveAttribute(
      'data-surface-tone',
      'default',
    );
    await expect(page.shippingAddressFieldset).toHaveAttribute(
      'data-error-placement',
      'bottom',
    );
    await expect(page.errorAlerts.first()).toBeVisible();
  });

  test('should switch the shipping fieldset shell between bordered and semantic-only', async () => {
    const borderedSurface = page.getFieldsetSurface(
      page.shippingAddressFieldset,
    );

    await expect(page.shippingAddressFieldset.locator('legend')).toContainText(
      'Shipping Address',
    );
    await expect(page.shippingAddressFieldset).toHaveAttribute(
      'data-appearance',
      'outline',
    );

    const borderedStyles = await Promise.all([
      page.shippingAddressFieldset.evaluate((fieldset) => {
        const style = getComputedStyle(fieldset);
        return {
          borderTopWidth: style.borderTopWidth,
          backgroundColor: style.backgroundColor,
        };
      }),
      borderedSurface.evaluate((surface) => getComputedStyle(surface).padding),
    ]);

    expect(borderedStyles[0].borderTopWidth).toBe('1px');
    expect(Number.parseFloat(borderedStyles[1])).toBeGreaterThan(0);

    await page.showSemanticOnlyShell();

    await expect(page.semanticOnlyShellButton).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(page.shippingAddressFieldset).toHaveAttribute(
      'data-appearance',
      'plain',
    );

    const plainStyles = await Promise.all([
      page.shippingAddressFieldset.evaluate((fieldset) => {
        const style = getComputedStyle(fieldset);
        return {
          borderTopWidth: style.borderTopWidth,
          backgroundColor: style.backgroundColor,
        };
      }),
      borderedSurface.evaluate((surface) => getComputedStyle(surface).padding),
    ]);

    expect(plainStyles[0].borderTopWidth).toBe('0px');
    expect(plainStyles[0].backgroundColor).toBe('rgba(0, 0, 0, 0)');
    expect(plainStyles[1]).toBe('0px');
  });

  test('should respect includeNestedErrors when nested shipping fields become invalid', async () => {
    await page.showGroupOnlyAggregation();
    await expect(page.groupOnlyButton).toHaveAttribute('aria-pressed', 'true');

    await page.triggerShippingStreetTouchedError();

    await expect(
      page.getGroupedAlert(page.shippingAddressFieldset),
    ).toHaveCount(0);

    await page.showIncludeNestedAggregation();
    await page.triggerShippingStreetTouchedError();

    const groupedAlert = page.getGroupedAlert(page.shippingAddressFieldset);
    await expect(groupedAlert).toBeVisible();
    await expect(groupedAlert).toContainText(/shipping street is required/i);
    await expect(
      page
        .getGroupedMessages(page.shippingAddressFieldset)
        .locator('.ngx-form-field-notification__list li'),
    ).toHaveCount(4);
  });

  test('should switch grouped credentials feedback between plain and notification title modes', async () => {
    await page.triggerCredentialsMismatch();
    const groupedMessages = page.getGroupedMessages(page.credentialsFieldset);

    await page.showPlainFeedback();
    await expect(page.credentialsFieldset).toHaveAttribute(
      'data-feedback-appearance',
      'plain',
    );
    await expect(
      groupedMessages.locator('ngx-form-field-error').first(),
    ).toBeVisible();
    await expect(
      groupedMessages.locator('ngx-form-field-notification'),
    ).toHaveCount(0);

    await page.showNotificationFeedback();
    await page.hideNotificationTitle();
    await expect(page.credentialsFieldset).toHaveAttribute(
      'data-feedback-appearance',
      'notification',
    );
    await expect(
      groupedMessages.locator('ngx-form-field-notification'),
    ).toBeVisible();
    await expect(
      page.getNotificationTitle(page.credentialsFieldset),
    ).toHaveCount(0);

    await page.showNotificationTitleToggle();
    await expect(
      page.getNotificationTitle(page.credentialsFieldset),
    ).toContainText('Review the grouped fields below');
  });

  test('should move grouped delivery-method feedback between bottom and top placement', async () => {
    await expect(page.deliveryMethodOptionsFieldset).toHaveAttribute(
      'data-error-placement',
      'bottom',
    );

    await page.triggerDeliveryMethodRequiredError();
    await expect(
      page.getGroupedAlert(page.deliveryMethodOptionsFieldset),
    ).toBeVisible();
    expect(await getMessagePlacement(page.deliveryMethodOptionsFieldset)).toBe(
      'bottom',
    );

    await page.showTopPlacement();
    await expect(page.topPlacementButton).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(page.deliveryMethodOptionsFieldset).toHaveAttribute(
      'data-error-placement',
      'top',
    );
    expect(await getMessagePlacement(page.deliveryMethodOptionsFieldset)).toBe(
      'top',
    );
  });

  test('should tint the credentials fieldset surface when validationSurface is enabled', async () => {
    await page.showSuccessTone();
    await page.showTintSurface();

    const baseBackground = await page.credentialsFieldset.evaluate(
      (fieldset) => getComputedStyle(fieldset).backgroundColor,
    );

    await page.triggerCredentialsMismatch();

    await expect(page.successToneButton).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(page.tintSurfaceButton).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(page.credentialsFieldset).toHaveAttribute(
      'data-surface-tone',
      'success',
    );
    await expect(page.credentialsFieldset).toHaveAttribute(
      'data-validation-surface',
      'always',
    );
    await expect(page.credentialsFieldset).toHaveClass(
      /ngx-signal-form-fieldset--surface-invalid/,
    );

    const [fieldsetBackground, alertBox] = await Promise.all([
      page.credentialsFieldset.evaluate(
        (fieldset) => getComputedStyle(fieldset).backgroundColor,
      ),
      page.getGroupedAlert(page.credentialsFieldset).boundingBox(),
    ]);

    expect(fieldsetBackground).not.toBe('rgba(0, 0, 0, 0)');
    expect(fieldsetBackground).not.toBe(baseBackground);
    expect(
      requireValue(alertBox, 'credentials grouped alert bounding box').height,
    ).toBeGreaterThan(0);
  });
});
