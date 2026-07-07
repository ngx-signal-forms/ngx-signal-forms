import { expect, test, type Page } from '@playwright/test';

/**
 * Single E2E spec for the PrimeNG reference demo.
 *
 * Covers the fill → blur → observe-error path called out in issue #49.
 * The spec asserts ARIA wiring on the rendered Prime markup so any seam
 * regression (auto-aria selector miss, hint registry mismatch, renderer
 * token misroute) shows up here without needing component-level instrumentation.
 */

async function selectRole(page: Page, optionName: string): Promise<void> {
  // The combobox's accessible name is "Role" (from the visible <label> via
  // aria-labelledby), not the transient "Pick a role" placeholder text —
  // see the dedicated accessible-name regression test below.
  await page.getByRole('combobox', { name: /^role$/i }).click();
  await page.getByRole('option', { name: optionName }).click();
}

test.describe('demo-primeng — profile form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('fill → blur → observe error renders Prime idiom with correct ARIA', async ({
    page,
  }) => {
    const emailInput = page.locator('#profile-email');

    await test.step('blur the untouched email field', async () => {
      // Initial render: aria-invalid is unset (or 'false') because the field
      // has not been touched and on-touch is the default error strategy.
      await expect(emailInput).not.toHaveAttribute('aria-invalid', 'true');

      await emailInput.focus();
      await emailInput.blur();
    });

    await test.step('show the Prime error idiom and connect ARIA', async () => {
      const errorEl = page.getByTestId('prime-error').first();
      await expect(errorEl).toBeVisible();
      await expect(errorEl).toHaveText(/required/i);
      await expect(errorEl).toHaveAttribute('id', 'profile-email-error');

      await expect(emailInput).toHaveAttribute('aria-invalid', 'true');

      await expect(emailInput).toHaveAttribute(
        'aria-describedby',
        /profile-email-error/,
      );
    });
  });

  test('warning idiom renders for the personal-email heuristic', async ({
    page,
  }) => {
    const emailInput = page.locator('#profile-email');

    await test.step('enter a personal email address', async () => {
      await emailInput.fill('alex@gmail.com');
      await emailInput.blur();
    });

    await test.step('render the warning without a blocking error', async () => {
      const warningEl = page.getByTestId('prime-warning').first();
      await expect(warningEl).toBeVisible();
      await expect(warningEl).toHaveAttribute('id', 'profile-email-warning');
      await expect(warningEl).toHaveAttribute('role', 'status');
      await expect(warningEl).toHaveText(/personal email/i);
    });
  });

  test('select required error surfaces on blur and the combobox stays linked to its assistive text', async ({
    page,
  }) => {
    const roleCombobox = page.getByRole('combobox', { name: /^role$/i });

    await test.step('blur the untouched role control', async () => {
      await roleCombobox.focus();
      await page.keyboard.press('Tab');
    });

    await test.step('render the role error and wire the combobox ARIA', async () => {
      const roleError = page.locator('#profile-role-error');
      await expect(roleError).toBeVisible();
      await expect(roleError).toHaveText(/role is required/i);
      await expect(roleError).toHaveAttribute('role', 'alert');

      const roleField = page.locator(
        'prime-form-field[data-field-name="profile-role"]',
      );
      await expect(roleField).toHaveAttribute('data-invalid', 'true');

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
  });

  test("the role combobox's accessible name comes from the visible label, not placeholder/selected-value content", async ({
    page,
  }) => {
    // Regression test for the audit #147 blocker: PrimeSelectControlComponent
    // put `inputId` on the non-labelable inner <span role="combobox">, so
    // `<label for="profile-role">Role</label>` never established a
    // programmatic label association and the accessible name fell back to
    // the "Pick a role" placeholder (or the selected option's label once
    // chosen). getByRole computing an accessible name of exactly "Role" in
    // both states is the whole point of this assertion.
    const roleCombobox = page.getByRole('combobox', { name: /^role$/i });
    await expect(roleCombobox).toHaveAttribute(
      'aria-labelledby',
      'profile-role-label',
    );

    await selectRole(page, 'Designer');

    // Even after a selection changes the visible content to "Designer", the
    // accessible name (driven by aria-labelledby) must stay "Role".
    await expect(
      page.getByRole('combobox', { name: /^role$/i }),
    ).toHaveAttribute('aria-labelledby', 'profile-role-label');
  });

  test('checkbox ARIA (describedby/invalid/required) is wired onto the real native input, not the <p-checkbox> host', async ({
    page,
  }) => {
    // Regression test for the audit #147 blocker: NgxSignalFormAutoAria's
    // selector catch-all wrote aria-describedby/aria-invalid/aria-required
    // onto the <p-checkbox> host element instead of the real focusable
    // native <input type="checkbox">, so the newsletter hint was never
    // linked for assistive tech.
    const newsletterCheckbox = page.getByRole('checkbox', {
      name: /subscribe to the release notes/i,
    });

    await expect(newsletterCheckbox).toHaveJSProperty('tagName', 'INPUT');
    await expect(newsletterCheckbox).toHaveAttribute(
      'aria-describedby',
      /profile-newsletter-hint/,
    );
  });

  test('submits a completed form and reset returns it to its initial state', async ({
    page,
  }) => {
    const emailInput = page.locator('#profile-email');
    const roleCombobox = page.getByRole('combobox', { name: /^role$/i });
    const newsletterCheckbox = page.getByRole('checkbox', {
      name: /subscribe to the release notes/i,
    });
    const submitButton = page.getByTestId('submit-button');
    const resetButton = page.getByRole('button', { name: /reset/i });

    await test.step('complete the form and submit it', async () => {
      await emailInput.fill('team@company.com');
      await selectRole(page, 'Designer');
      await newsletterCheckbox.click();

      await expect(newsletterCheckbox).toBeChecked();
      await submitButton.click();

      const summary = page.getByTestId('submission-summary');
      await expect(summary).toBeVisible();
      await expect(summary).toContainText('"email": "team@company.com"');
      await expect(summary).toContainText('"role": "designer"');
      await expect(summary).toContainText('"newsletter": true');
    });

    await test.step('reset the form back to its initial state', async () => {
      await resetButton.click();

      await expect(page.getByTestId('submission-summary')).toBeHidden();
      await expect(emailInput).toHaveValue('');
      await expect(newsletterCheckbox).not.toBeChecked();
      await expect(roleCombobox).toHaveText('Pick a role');
      await expect(page.locator('#profile-role-error')).toBeHidden();
    });
  });
});
