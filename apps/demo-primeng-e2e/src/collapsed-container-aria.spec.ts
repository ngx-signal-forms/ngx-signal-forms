import { expect, test } from '@playwright/test';

/**
 * Regression cover for #406 — `aria-invalid` going stale on a control that
 * has lost its layout box.
 *
 * The PrimeNG reference is the one demo where all three composition shapes
 * live inside a single collapsible container:
 *
 * - `<prime-form-field>` mirrors the toolkit's view of validity as
 *   `data-invalid` on its own host,
 * - `prime-select-control` writes the real `aria-invalid` onto the inner
 *   `[role="combobox"]` element,
 * - `prime-checkbox-control` writes it onto the native `<input
 *   type="checkbox">` inside `p-checkbox`.
 *
 * Each probes the element it writes to, so all three must drop the attribute
 * while the container is closed.
 *
 * The `<details>` is bound to Angular state on purpose: a bare `<details>`
 * toggles in the browser without running change detection, so no layout probe
 * would ever re-read and the test would pass for the wrong reason.
 */
test.describe('demo-primeng — aria state inside a collapsed container', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('drops aria-invalid on every surface while collapsed, and restores it', async ({
    page,
  }) => {
    const details = page.getByTestId('preferences-details');
    const summary = details.locator('> summary');

    const roleWrapper = details.locator(
      'prime-form-field[data-field-name="profile-role"]',
    );
    const combobox = details.locator('[role="combobox"]');
    const checkbox = details.locator('input[type="checkbox"]');

    await test.step('touch the required role select so it reports invalid', async () => {
      await expect(combobox).toHaveAttribute('aria-invalid', 'false');

      // `prime-select-control` emits `touch` from `p-select`'s `onBlur`, so
      // the field only goes invalid once focus actually leaves the control.
      await combobox.click();
      await page.keyboard.press('Escape');
      await page.locator('#profile-email').click();

      await expect(roleWrapper).toHaveAttribute('data-invalid', 'true');
      await expect(combobox).toHaveAttribute('aria-invalid', 'true');
    });

    await test.step('collapsing removes the attributes rather than freezing them', async () => {
      await summary.click();
      await expect(details).not.toHaveJSProperty('open', true);

      await expect(roleWrapper).not.toHaveAttribute('data-invalid', /.*/u);
      await expect(combobox).not.toHaveAttribute('aria-invalid', /.*/u);
      await expect(checkbox).not.toHaveAttribute('aria-invalid', /.*/u);
    });

    await test.step('reopening brings them back', async () => {
      await summary.click();
      await expect(details).toHaveJSProperty('open', true);

      await expect(roleWrapper).toHaveAttribute('data-invalid', 'true');
      await expect(combobox).toHaveAttribute('aria-invalid', 'true');
      // The checkbox is optional, so it comes back as an explicit "valid"
      // rather than being left off — the distinction the third
      // `createAriaInvalidSignal` argument exists to preserve.
      await expect(checkbox).toHaveAttribute('aria-invalid', 'false');
    });
  });
});
