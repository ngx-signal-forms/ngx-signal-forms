import { expect, test } from '@playwright/test';

/**
 * Single Playwright spec for the Material reference demo.
 *
 * Covers the issue's required E2E path: **fill → blur → observe error**.
 *
 * Asserts that:
 * - Material's `<mat-error>` content appears after the user types garbage
 *   into the email field and tabs away.
 * - The bound `<input matInput>` ends up with `aria-invalid="true"` and an
 *   `aria-describedby` that points to the rendered `<mat-error>`'s ID.
 *
 * The smoke spec (jsdom) covers the "empty required field" branch; this
 * Playwright spec exercises the same flow in a real browser to catch any
 * timing or layout issue jsdom doesn't surface.
 */
test.describe('Material reference contact form (E2E)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('renders mat-error and wires Material aria-describedby on blur', async ({
    page,
  }) => {
    const email = page.locator('input#contact-email');
    await expect(email).toBeVisible();

    await test.step('fill the email field with an invalid value, then blur', async () => {
      await email.click();
      await email.fill('not-an-email');
      await email.blur();
    });

    await test.step('mat-error renders the toolkit-driven error message', async () => {
      // Single mat-error inside the email field's mat-form-field.
      const matError = page
        .locator('mat-form-field', { has: email })
        .locator('mat-error');

      await expect(matError).toBeVisible();
      await expect(matError).toContainText(/valid email/i);
      await expect(matError).toHaveAttribute('id', /.+/);
    });

    await test.step('aria-invalid is "true" and aria-describedby resolves to <mat-error>', async () => {
      await expect(email).toHaveAttribute('aria-invalid', 'true');

      const describedBy = await email.getAttribute('aria-describedby');
      expect(describedBy, 'aria-describedby should be present').toBeTruthy();

      const ids = (describedBy ?? '').split(/\s+/).filter(Boolean);
      expect(
        ids.length,
        'aria-describedby should list at least one id',
      ).toBeGreaterThan(0);

      // At least one of the referenced IDs must resolve to a <mat-error> element.
      let foundMatError = false;
      for (const id of ids) {
        const node = page.locator(`#${id}`);
        const tag = await node.evaluate((el) => el.tagName.toLowerCase());
        if (tag === 'mat-error') {
          foundMatError = true;
          break;
        }
      }
      expect(
        foundMatError,
        'aria-describedby should reference a rendered <mat-error>',
      ).toBe(true);
    });
  });
});
