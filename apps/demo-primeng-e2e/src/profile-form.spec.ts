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
  await page.getByRole('combobox', { name: /pick a role/i }).click();
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
    const roleCombobox = page.getByRole('combobox', { name: /pick a role/i });

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

  test('submits a completed form and reset returns it to its initial state', async ({
    page,
  }) => {
    const emailInput = page.locator('#profile-email');
    const roleCombobox = page.getByRole('combobox', { name: /pick a role/i });
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
