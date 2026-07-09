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

  // Regression coverage for #194: ProfileFormComponent's own docblock lists
  // createOnInvalidHandler's submit-time focus behaviour as one of five
  // contracts this reference exercises, but nothing asserted it end-to-end —
  // schema declaration order is email, then role (profile-form.schema.ts),
  // so an empty submit should focus email first, and a submit with only
  // email fixed should move focus on to the role combobox.
  test('createOnInvalidHandler focuses the first invalid control on submit, then the next', async ({
    page,
  }) => {
    const emailInput = page.locator('#profile-email');
    const roleCombobox = page.getByRole('combobox', { name: /^role$/i });
    const submitButton = page.getByTestId('submit-button');

    await test.step('submitting the empty form focuses email (first in schema order)', async () => {
      await submitButton.click();
      await expect(emailInput).toBeFocused({ timeout: 3000 });
    });

    await test.step('fixing email and resubmitting focuses role next', async () => {
      await emailInput.fill('team@company.com');
      await submitButton.click();
      await expect(roleCombobox).toBeFocused({ timeout: 3000 });
    });

    await test.step('a fully valid form does not steal focus on submit', async () => {
      await selectRole(page, 'Designer');
      const newsletterCheckbox = page.getByRole('checkbox', {
        name: /subscribe to the release notes/i,
      });

      await submitButton.click();
      await expect(page.getByTestId('submission-summary')).toBeVisible();
      await expect(emailInput).not.toBeFocused();
      await expect(roleCombobox).not.toBeFocused();
      await expect(newsletterCheckbox).not.toBeFocused();
    });
  });

  // Regression coverage for #194: PrimeSelectControlComponent exists
  // specifically to bridge a bespoke ARIA combobox onto Signal Forms, but the
  // suite never drove it with anything but mouse clicks (selectRole() above).
  // p-select supports the standard listbox keyboard contract — this exercises
  // that surface without ever calling .click() on the trigger or an option.
  test('the role combobox is fully operable from the keyboard', async ({
    page,
  }) => {
    const roleCombobox = page.getByRole('combobox', { name: /^role$/i });

    await test.step('Tab onto the combobox and open it with the keyboard', async () => {
      await page.locator('#profile-email').focus();
      await page.keyboard.press('Tab');
      await expect(roleCombobox).toBeFocused();

      await roleCombobox.press('Enter');
      await expect(
        page.getByRole('option', { name: 'Frontend developer' }),
      ).toBeVisible();
    });

    await test.step('arrow down to a later option and select it with Enter', async () => {
      // Opening highlights nothing yet — the first ArrowDown highlights
      // "Frontend developer" (index 0), so three presses land on
      // "Designer" (index 2).
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');

      await expect(roleCombobox).toHaveText('Designer');
      await expect(page.getByRole('option')).toHaveCount(0);
    });

    await test.step('reopen and select the first option with Home + Enter', async () => {
      await roleCombobox.press('Enter');
      await expect(
        page.getByRole('option', { name: 'Frontend developer' }),
      ).toBeVisible();

      await page.keyboard.press('Home');
      await page.keyboard.press('Enter');

      await expect(roleCombobox).toHaveText('Frontend developer');
    });

    await test.step('Escape closes the overlay without changing the selection', async () => {
      await roleCombobox.press('Enter');
      await expect(
        page.getByRole('option', { name: 'Designer' }),
      ).toBeVisible();

      await page.keyboard.press('Escape');
      await expect(page.getByRole('option')).toHaveCount(0);
      await expect(roleCombobox).toHaveText('Frontend developer');
    });
  });
});
