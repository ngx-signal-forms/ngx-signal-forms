import { expect, test } from '@playwright/test';

/**
 * Regression cover for #406 — `aria-invalid` going stale on a control that
 * has lost its layout box.
 *
 * `NgxSpartanFormField` does not write `aria-invalid` itself: Brain's
 * `BrnSelectTrigger` / `HlmSelectTrigger` own that attribute on the real
 * `role="combobox"` button. The toolkit-owned surface here is the wrapper's
 * `data-spartan-invalid` mirror — the attribute `createAriaInvalidSignal`
 * actually drives in this reference, and the one a consumer reads when they
 * compose the primitive themselves.
 *
 * The `<details>` is bound to Angular state on purpose: a bare `<details>`
 * toggles in the browser without running change detection, so the wrapper's
 * layout probe would never re-read and the test would pass for the wrong
 * reason.
 */
test.describe('demo-spartan — aria state inside a collapsed container', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('drops the invalid mirror while collapsed and restores it on reopen', async ({
    page,
  }) => {
    const details = page.getByTestId('plan-details');
    const summary = details.locator('> summary');
    const planField = details.locator('spartan-form-field');
    const trigger = page.locator('#plan-trigger');

    await test.step('touch the required plan select so it reports invalid', async () => {
      await expect(planField).toHaveAttribute('data-spartan-invalid', 'false');

      await trigger.click();
      await page.keyboard.press('Escape');
      await page.locator('#display-name').click();

      await expect(planField).toHaveAttribute('data-spartan-invalid', 'true');
    });

    await test.step('collapsing removes the attribute rather than freezing it', async () => {
      await summary.click();
      await expect(details).not.toHaveJSProperty('open', true);

      await expect(planField).not.toHaveAttribute(
        'data-spartan-invalid',
        /.*/u,
      );
    });

    await test.step('reopening brings it back', async () => {
      await summary.click();
      await expect(details).toHaveJSProperty('open', true);

      await expect(planField).toHaveAttribute('data-spartan-invalid', 'true');
    });
  });
});
