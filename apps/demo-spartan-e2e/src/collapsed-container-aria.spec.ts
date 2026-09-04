import { expect, test } from '@playwright/test';

/**
 * Regression cover for #406 and #409 — `aria-invalid` going stale on a
 * control that has lost its layout box.
 *
 * `NgxSpartanFormField` does not write `aria-invalid` itself: Brain's
 * `BrnSelectTrigger` / `HlmSelectTrigger` own that attribute on the real
 * `role="combobox"` button. #406 fixed the toolkit-owned surface: the
 * wrapper's `data-spartan-invalid` mirror — the attribute
 * `createAriaInvalidSignal` actually drives in this reference. #409 closed
 * the remaining gap: `HlmSelectTrigger` now gates its own imperative
 * `aria-invalid` write on the trigger button's own layout (via the
 * platform's `checkVisibility()` — see `hlm-select-trigger.ts`), so the
 * attribute an assistive-technology user actually hears drops too. Both are
 * asserted below on the same interaction.
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
      await expect(trigger).not.toHaveAttribute('aria-invalid', 'true');

      await trigger.click();
      await page.keyboard.press('Escape');
      await page.locator('#display-name').click();

      await expect(planField).toHaveAttribute('data-spartan-invalid', 'true');
      await expect(trigger).toHaveAttribute('aria-invalid', 'true');
    });

    await test.step('collapsing removes the attribute rather than freezing it', async () => {
      await summary.click();
      await expect(details).not.toHaveJSProperty('open', true);

      await expect(planField).not.toHaveAttribute(
        'data-spartan-invalid',
        /.*/u,
      );
      // The real attribute `HlmSelectTrigger` writes onto the trigger button
      // itself must drop too — this is the #409 gap #406 left open.
      await expect(trigger).not.toHaveAttribute('aria-invalid', /.*/u);
    });

    await test.step('reopening brings it back', async () => {
      await summary.click();
      await expect(details).toHaveJSProperty('open', true);

      await expect(planField).toHaveAttribute('data-spartan-invalid', 'true');
      await expect(trigger).toHaveAttribute('aria-invalid', 'true');
    });
  });
});
