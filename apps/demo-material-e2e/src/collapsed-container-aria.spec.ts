import { expect, test } from '@playwright/test';

/**
 * Regression cover for #406 — `aria-invalid` going stale on a control that
 * has lost its layout box.
 *
 * `MatFormFieldWrapper` opts every projected control into `ariaMode="manual"`
 * (Material owns the real `aria-invalid` on `<input matInput>` /
 * `<mat-select>` through its `ErrorStateMatcher`), so the toolkit-owned
 * surface here is the wrapper's `data-ngx-mat-invalid` mirror — the attribute
 * `createAriaInvalidSignal` actually drives in this reference. That mirror is
 * what a consumer reads when they compose the primitive themselves, so it is
 * what this spec asserts.
 *
 * The `<details>` is bound to Angular state on purpose: a bare `<details>`
 * toggles in the browser without running change detection, so no layout probe
 * would ever re-read and the test would pass for the wrong reason.
 */
test.describe('demo-material — aria state inside a collapsed container', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('drops the invalid mirror while collapsed and restores it on reopen', async ({
    page,
  }) => {
    const details = page.getByTestId('topic-details');
    const summary = details.locator('> summary');
    const topicField = details.locator('mat-form-field');
    const topic = page.getByRole('combobox', { name: 'Topic' });

    await test.step('touch the required topic select so it reports invalid', async () => {
      // Opening and dismissing the panel is what marks `mat-select` touched;
      // the demo runs the on-touch strategy, so nothing is invalid before.
      await expect(topicField).toHaveAttribute('data-ngx-mat-invalid', 'false');

      await topic.click();
      await page.keyboard.press('Escape');
      await expect(topicField).toHaveAttribute('data-ngx-mat-invalid', 'true');
    });

    await test.step('collapsing removes the attribute rather than freezing it', async () => {
      await summary.click();
      await expect(details).not.toHaveJSProperty('open', true);

      await expect(topicField).not.toHaveAttribute(
        'data-ngx-mat-invalid',
        /.*/u,
      );
    });

    await test.step('reopening brings it back', async () => {
      await summary.click();
      await expect(details).toHaveJSProperty('open', true);

      await expect(topicField).toHaveAttribute('data-ngx-mat-invalid', 'true');
    });
  });
});
