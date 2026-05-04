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
    // Asserting the attribute directly implies the element is in the DOM,
    // so we skip a redundant visibility check.
    await expect(emailInput).not.toHaveAttribute('aria-invalid', 'true');

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
    await expect(warningEl).toHaveAttribute('role', 'status');
    await expect(warningEl).toHaveText(/personal email/i);
  });

  test('select required error surfaces on blur and the combobox stays linked to its assistive text', async ({
    page,
  }) => {
    const roleCombobox = page.getByRole('combobox', { name: /pick a role/i });
    await roleCombobox.focus();
    await page.keyboard.press('Tab');

    // (1) the Prime-flavoured error renders for the role field with the
    //     {fieldName}-error id convention.
    const roleError = page.locator('#profile-role-error');
    await expect(roleError).toBeVisible();
    await expect(roleError).toHaveText(/role is required/i);
    await expect(roleError).toHaveAttribute('role', 'alert');

    // (2) the wrapper surfaces its toolkit-derived view of validity on
    //     the host attribute, useful for tests / debug overlays / styling.
    //     This works regardless of PrimeNG's host-component ARIA model.
    const roleField = page.locator(
      'prime-form-field[data-field-name="profile-role"]',
    );
    await expect(roleField).toHaveAttribute('data-invalid', 'true');

    // (3) the accessible combobox keeps the wrapper-managed hint and error
    //     IDs in its `aria-describedby` chain.
    await expect(roleCombobox).toHaveAttribute(
      'aria-describedby',
      /profile-role-hint/,
    );
    await expect(roleCombobox).toHaveAttribute(
      'aria-describedby',
      /profile-role-error/,
    );
    await expect(roleCombobox).toHaveAttribute('aria-invalid', 'true');
    await expect(roleCombobox).toHaveAttribute('aria-required', 'true');
  });

  test('checkbox wrapper exposes resolved field name on the host attribute', async ({
    page,
  }) => {
    // `[ngxPrimeFormField]` resolves the field name and surfaces it on the
    // wrapper host so styling / tests / debug overlays can correlate the
    // wrapper to the bound field without DOM walking. Same boundary
    // applies as for `<p-select>`: auto-aria writes land on `<p-checkbox>`,
    // not its inner input.
    const newsletterField = page.locator(
      'prime-form-field[data-field-name="profile-newsletter"]',
    );
    await expect(newsletterField).toBeVisible();
  });
});
