import { expect, test } from '@playwright/test';
import { FieldIdentityPage } from '../../page-objects/field-identity.page';

/**
 * Covers the two behaviors the field-identity page exists to show:
 *
 * 1. A custom wrapper composing `NgxFieldIdentityProvider` declares a field
 *    name that is not the bound control's `id`, and every generated message
 *    id follows the declared name.
 * 2. `aria-invalid` is removed while the control has no layout box, and comes
 *    back on reopen — rather than going stale.
 *
 * Plus the channel split: the wrapper owns only the name, so hints and
 * display timing keep resolving through their registries.
 */
test.describe('Field Identity (custom wrapper)', () => {
  let page: FieldIdentityPage;

  test.beforeEach(async ({ page: playwrightPage }) => {
    page = new FieldIdentityPage(playwrightPage);
    await page.goto();
  });

  test('the control id is the widget-generated one, not the field name', async () => {
    await expect(page.emailControl).toHaveAttribute('id', /^demo-widget-\d+$/u);
    await expect(page.emailControl).not.toHaveAttribute('id', 'emailAddress');
  });

  test('generated message ids follow the declared field name', async () => {
    await expect(page.emailWrapper.locator('#emailAddress-error')).toHaveCount(
      1,
    );
    // The id the toolkit would have minted from the control's `id` must not
    // exist anywhere — that is the whole failure mode this page demonstrates.
    const controlId = await page.emailControl.getAttribute('id');
    await expect(page.page.locator(`#${controlId}-error`)).toHaveCount(0);

    // And the control must actually point at the rendered element. Without
    // the identity seam the wrapper still *renders* `#emailAddress-error`
    // (it binds `fieldName` on the error surface itself), while auto-aria
    // writes `${controlId}-error` into `aria-describedby` — a reference to
    // an element that does not exist.
    await expect(page.emailControl).toHaveAttribute(
      'aria-describedby',
      /(^|\s)emailAddress-error(\s|$)/u,
    );
  });

  test('every aria-describedby token resolves to an element that exists', async () => {
    const tokens = await page.describedByTokens(page.emailControl);

    expect(tokens.length).toBeGreaterThan(0);
    expect(tokens.every((token) => token.id.startsWith('emailAddress'))).toBe(
      true,
    );
    expect(tokens.filter((token) => !token.resolves)).toEqual([]);
  });

  test('hints reach aria-describedby while the wrapper owns the field name', async () => {
    // Fill in a valid address so the error id drops out and only the hint
    // channel is left — proving hints travel independently of errors.
    await page.emailControl.fill('someone@example.com');
    await page.emailControl.blur();

    await expect(page.emailWrapper.locator('#emailAddress-error')).toHaveCount(
      0,
    );

    const tokens = await page.describedByTokens(page.emailControl);
    expect(tokens.length).toBeGreaterThan(0);
    expect(tokens.filter((token) => !token.resolves)).toEqual([]);

    const hintId = await page.emailWrapper
      .locator('ngx-form-field-hint')
      .getAttribute('id');
    expect(hintId).not.toBeNull();
    expect(tokens.map((token) => token.id)).toContain(hintId);
  });

  test('aria-invalid is removed while collapsed and restored on reopen', async () => {
    await expect(page.deliveryControl).toHaveAttribute('aria-invalid', 'true');

    await page.setDeliveryExpanded(false);
    await expect(page.deliveryControl).not.toHaveAttribute(
      'aria-invalid',
      /.*/u,
    );

    await page.setDeliveryExpanded(true);
    await expect(page.deliveryControl).toHaveAttribute('aria-invalid', 'true');
  });

  test('no aria-describedby token dangles in either the collapsed or expanded state', async () => {
    for (const expanded of [true, false, true]) {
      await page.setDeliveryExpanded(expanded);

      const tokens = await page.describedByTokens(page.deliveryControl);
      expect(
        tokens.filter((token) => !token.resolves),
        `dangling ids while ${expanded ? 'expanded' : 'collapsed'}`,
      ).toEqual([]);
    }
  });

  test('display timing still resolves through the visibility registry', async () => {
    // The wrapper publishes only the field name. Switching the error display
    // mode must still move the error id in and out of `aria-describedby`.
    await page.onTouchModeRadio.check();

    await expect(page.emailWrapper.locator('#emailAddress-error')).toHaveCount(
      0,
    );

    await page.emailControl.click();
    await page.emailControl.blur();

    await expect(page.emailWrapper.locator('#emailAddress-error')).toHaveCount(
      1,
    );
    const tokens = await page.describedByTokens(page.emailControl);
    expect(tokens.map((token) => token.id)).toContain('emailAddress-error');
  });

  test('the readout mirrors the control state so the page is legible without DevTools', async () => {
    await expect(
      page.emailProbe.locator('[data-probe="field-name"]'),
    ).toHaveText('emailAddress');
    await expect(
      page.emailProbe.locator('[data-probe="control-id"]'),
    ).toHaveText(/^\s*demo-widget-\d+\s*$/u);
    await expect(
      page.emailProbe.locator(
        '[data-probe="aria-describedby"] [data-resolves]',
      ),
    ).not.toHaveCount(0);
    await expect(
      page.emailProbe.locator(
        '[data-probe="aria-describedby"] [data-resolves="false"]',
      ),
    ).toHaveCount(0);
  });
});
