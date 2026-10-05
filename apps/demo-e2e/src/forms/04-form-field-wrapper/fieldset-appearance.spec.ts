import { expect, test } from '@playwright/test';
import { DEMO_PATHS } from '@ngx-signal-forms/demo-shared';

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

test.describe('Focused fieldset examples', () => {
  for (const route of [
    DEMO_PATHS.fieldsetAppearance,
    DEMO_PATHS.groupedFeedback,
    DEMO_PATHS.fieldsetComposition,
  ]) {
    test(`keeps projected controls consistent with shared toggles in both themes (${route})`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.goto(route);
      const controls = page.getByRole('group', {
        name: 'Error display mode',
        exact: true,
      });
      await expect(controls).toBeVisible();

      for (const dark of [true, false]) {
        await page.evaluate(
          (theme) => {
            localStorage.setItem('color-theme', theme);
          },
          dark ? 'dark' : 'light',
        );
        await page.reload();
        await expect(controls).toBeVisible();
        await page.evaluate(() => document.fonts.ready);
        await expect(
          page.locator('ngx-fieldset-appearance-form form'),
        ).toHaveScreenshot(
          `${route.split('/').join('-')}-${dark ? 'dark' : 'light'}.png`,
          { maxDiffPixelRatio: 0.001 },
        );

        const cornerShape = (await page.evaluate(() =>
          CSS.supports('corner-shape', 'squircle'),
        ))
          ? /^(squircle|superellipse\(2\))$/
          : /^$/;
        const toggleGroups = page.locator(
          '.fieldset-appearance-form__control-group, [aria-label="Field appearance"], [aria-label="Field orientation"]',
        );
        for (const group of await toggleGroups.all()) {
          await expect(group).toHaveCSS('border-radius', '16px');
          await expect(group).toHaveCSS('corner-shape', cornerShape);
          await expect(group).toHaveCSS('overflow', 'visible');
          for (const button of await group.getByRole('button').all()) {
            await expect(button).toHaveCSS('border-radius', '12px');
            await expect(button).toHaveCSS('corner-shape', cornerShape);
          }
        }

        const reference = await page
          .getByRole('group', { name: 'Field appearance', exact: true })
          .evaluate((group) => ({
            background: getComputedStyle(group).backgroundColor,
            border: getComputedStyle(group).borderTopColor,
            selected: getComputedStyle(
              group.querySelector('[aria-pressed="true"]')!,
            ).backgroundColor,
            text: getComputedStyle(
              group.querySelector('[aria-pressed="false"]')!,
            ).color,
          }));

        const groups = page.locator('.fieldset-appearance-form__control-group');
        for (const group of await groups.all()) {
          await expect(group).toHaveCSS(
            'background-color',
            reference.background,
          );
          await expect(group).toHaveCSS('border-top-color', reference.border);
          const selected = group.locator('[aria-pressed="true"]');
          await expect(selected).toHaveCSS(
            'background-color',
            reference.selected,
          );
          await expect(selected).toHaveCSS(
            'color',
            dark ? 'rgb(147, 197, 253)' : 'rgb(0, 93, 150)',
          );
          await expect(
            group.locator('[aria-pressed="false"]').first(),
          ).toHaveCSS('color', reference.text);
        }
        await expect(controls).toHaveScreenshot(
          `error-mode-${route.split('/').join('-')}-${dark ? 'dark' : 'light'}.png`,
          { maxDiffPixelRatio: 0.001 },
        );
        if (route === DEMO_PATHS.fieldsetAppearance) {
          const tones = page.getByRole('group', {
            name: 'Fieldset surface tone',
            exact: true,
          });
          await expect(tones).toHaveScreenshot(
            `wrapped-surface-tone-${dark ? 'dark' : 'light'}.png`,
            { maxDiffPixelRatio: 0.001 },
          );
        }

        await page.setViewportSize({ width: 390, height: 844 });
        await page
          .getByRole('button', { name: 'Open display controls', exact: true })
          .click();
        await expect(controls).toBeVisible();
        await expect(controls).toHaveCSS(
          'background-color',
          reference.background,
        );
        await expect(controls).toHaveCSS('border-radius', '16px');
        await expect(controls).toHaveCSS('corner-shape', cornerShape);
        await page
          .getByRole('button', {
            name: 'Close configuration panel',
            exact: true,
          })
          .click();
        await page.setViewportSize({ width: 1440, height: 1000 });
      }
    });
  }

  test('starts appearance quietly and keeps composition on a separate page', async ({
    page,
  }) => {
    await page.goto(DEMO_PATHS.fieldsetAppearance);
    await expect(
      page.getByRole('heading', { name: 'Fieldset Appearance', exact: true }),
    ).toBeVisible();
    await expect(page.locator('fieldset[ngxFormFieldset]')).toHaveCount(1);
    await expect(
      page.getByRole('textbox', { name: 'Password', exact: true }),
    ).toHaveCount(0);
    await expect(page.getByRole('alert').filter({ hasText: /\S/ })).toHaveCount(
      0,
    );

    await page
      .getByRole('navigation', { name: 'Fieldset examples' })
      .getByRole('link', { name: 'Composition', exact: true })
      .click();
    await expect(
      page.getByRole('heading', {
        name: 'Fieldset Composition',
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole('textbox', { name: 'Street Address', exact: true }),
    ).toBeVisible();
  });

  test('reveals preview feedback on submit with padded panels and linked control errors', async ({
    page,
  }) => {
    const warnings: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'warning') warnings.push(message.text());
    });
    await page.goto(DEMO_PATHS.groupedFeedback);
    await page
      .getByRole('group', { name: 'Error display mode', exact: true })
      .getByRole('button', { name: 'On Submit', exact: true })
      .click();
    const street = page.getByRole('textbox', { name: 'Street', exact: true });
    const groupedError = page.locator('#placement-preview-address-error');
    await expect(groupedError).toHaveCount(0);
    await expect(street).toHaveAttribute('aria-invalid', 'false');

    await page
      .getByRole('button', { name: 'Validate preview', exact: true })
      .click();
    await expect(groupedError).toContainText('Street is required');
    await expect(street).toHaveAttribute('aria-invalid', 'true');
    await expect(street).toHaveAttribute(
      'aria-describedby',
      /placementPreviewStreet-error/,
    );
    await expect(groupedError).toHaveCSS('padding', '16px');
    await page.evaluate(() => document.fonts.ready);
    await expect(groupedError).toHaveScreenshot('notification-errors.png', {
      maxDiffPixelRatio: 0.001,
    });
    await expect(street).toBeFocused();
    expect(
      warnings.filter((message) => message.includes('submittedStatus')),
    ).toEqual([]);

    await page
      .getByRole('group', { name: 'Grouped message placement', exact: true })
      .getByRole('button', { name: 'Top', exact: true })
      .click();
    await expect(
      page.locator('[fieldsetid="placement-preview-address"]'),
    ).toHaveAttribute('data-error-placement', 'top');

    await page
      .getByRole('button', { name: 'Fill valid values', exact: true })
      .click();
    await expect(groupedError).toHaveCount(0);
    await expect(street).toHaveAttribute('aria-invalid', 'false');
    await page
      .getByRole('radio', {
        name: 'Express (1-2 business days)',
        exact: true,
      })
      .focus();
    await page.keyboard.press('Tab');
    const warning = page.locator('#placement-preview-delivery-warning');
    await expect(warning).toContainText(
      'Express delivery may incur extra fees',
    );
    await expect(warning).toHaveScreenshot('notification-warning.png', {
      maxDiffPixelRatio: 0.001,
    });
    await expect(warning).toHaveCSS('padding', '16px');
  });
});

test.describe('Form Field Wrapper - Fieldset Appearance', () => {
  let page: FieldsetAppearancePage;

  test.beforeEach(async ({ page: playwrightPage }) => {
    page = new FieldsetAppearancePage(playwrightPage);
    await page.goto();
  });

  test('should render the fieldset demo with the default grouped control state', async () => {
    await expect(page.form).toBeVisible();
    await expect(page.errorAlerts).toHaveCount(0);
    await expect(page.borderedShellButton).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(page.standardWrapperButton).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(page.outlineWrapperButton).toBeVisible();
    await expect(page.plainWrapperButton).toBeVisible();
    await expect(page.verticalOrientationButton).toHaveAttribute(
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
  });

  test('should switch the individual wrapper appearance to outline', async () => {
    await page.showOutlineWrapper();

    await expect(page.outlineWrapperButton).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(page.shippingStreetWrapper).toHaveClass(
      /ngx-signal-forms-outline/,
    );
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
        .locator('.ngx-form-field-error__list li'),
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
      groupedMessages.locator(
        'ngx-form-field-error[data-presentation="panel"]',
      ),
    ).toHaveCount(0);

    await page.showNotificationFeedback();
    await page.hideNotificationTitle();
    await expect(page.credentialsFieldset).toHaveAttribute(
      'data-feedback-appearance',
      'notification',
    );
    await expect(
      groupedMessages.locator(
        'ngx-form-field-error[data-presentation="panel"]',
      ),
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

    const alertBox = await page
      .getGroupedAlert(page.credentialsFieldset)
      .boundingBox();

    expect(
      requireValue(alertBox, 'credentials grouped alert bounding box').height,
    ).toBeGreaterThan(0);
  });
});
