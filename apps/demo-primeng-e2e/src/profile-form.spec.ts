import { expect, test } from '@playwright/test';

/**
 * Single E2E spec for the PrimeNG reference demo.
 *
 * Covers the fill → blur → observe-error path called out in issue #49.
 * The spec asserts ARIA wiring on the rendered Prime markup so any seam
 * regression (auto-aria selector miss, hint registry mismatch, renderer
 * token misroute) shows up here without needing component-level instrumentation.
 */

test.describe('demo-primeng — profile form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('fill → blur → observe error renders Prime idiom with correct ARIA', async ({
    page,
  }) => {
    const emailInput = page.locator('#profile-email');

    // Initial render: aria-invalid is unset (or 'false') because the field
    // has not been touched and on-touch is the default error strategy.
    await expect(emailInput).toBeVisible();

    // Tab into the field, then tab away to trigger touched().
    await emailInput.focus();
    await emailInput.blur();

    // (1) the Prime error element is visible — it is the
    //     `<small class="p-error">` rendered by PrimeFieldErrorComponent.
    const errorEl = page.getByTestId('prime-error').first();
    await expect(errorEl).toBeVisible();
    await expect(errorEl).toHaveText(/required/i);
    await expect(errorEl).toHaveAttribute('id', 'profile-email-error');

    // (2) auto-aria writes aria-invalid="true" on the bound control once the
    //     error becomes visible.
    await expect(emailInput).toHaveAttribute('aria-invalid', 'true');

    // (3) aria-describedby chain points at the rendered error element.
    const describedBy = await emailInput.getAttribute('aria-describedby');
    expect(describedBy).not.toBeNull();
    expect(describedBy?.split(/\s+/)).toContain('profile-email-error');
  });

  test('warning idiom renders for the personal-email heuristic', async ({
    page,
  }) => {
    const emailInput = page.locator('#profile-email');

    await emailInput.fill('alex@gmail.com');
    await emailInput.blur();

    // The warning renderer emits <small class="p-warn"> with the
    // {fieldName}-warning id. Errors should be cleared (the value is a valid
    // email), so only the warning element should be present.
    const warningEl = page.getByTestId('prime-warning').first();
    await expect(warningEl).toBeVisible();
    await expect(warningEl).toHaveAttribute('id', 'profile-email-warning');
    await expect(warningEl).toHaveText(/personal email/i);
  });
});
