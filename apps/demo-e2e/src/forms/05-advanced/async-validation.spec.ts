import { expect, test } from '@playwright/test';

import { ROLE_ALERT_SELECTOR } from '../../fixtures/aria-selectors';
/**
 * Async Validation - E2E Tests
 * Route: /advanced-scenarios/async-validation
 *
 * Tests async server-side validation with deterministic network mocking.
 */

test.describe('Advanced Scenarios - Async Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/advanced-scenarios/async-validation`);
    await page.waitForLoadState('domcontentloaded');
  });

  test('should display async validation form', async ({ page }) => {
    await expect(page.locator('form').first()).toBeVisible();

    const usernameInput = page.getByRole('textbox', { name: /username/i });
    await expect(usernameInput).toBeVisible();
  });

  test('should show loading state during async validation', async ({
    page,
  }) => {
    await page.route('**/fake-api/check-user/*', async (route) => {
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 800);
      });
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ username: 'testuser', available: true }),
      });
    });

    await test.step('Type in username field', async () => {
      const usernameInput = page.getByRole('textbox', { name: /username/i });
      const checkingIndicator = page.getByText('Checking...', { exact: true });

      await usernameInput.fill('testuser');
      await usernameInput.blur();

      await expect(checkingIndicator).toBeVisible();
      await expect(page.getByText('Pending: true')).toBeVisible();
      await expect(
        page.getByRole('button', { name: /Validating/i }),
      ).toBeDisabled();

      await expect(checkingIndicator).toBeHidden({ timeout: 5000 });
      await expect(page.getByText('Pending: false')).toBeVisible();
    });
  });

  test('should show error for "admin" username', async ({ page }) => {
    await page.route('**/fake-api/check-user/admin', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ username: 'admin', available: false }),
      });
    });

    await test.step('Type "admin" username', async () => {
      const usernameInput = page.getByRole('textbox', { name: /username/i });
      await usernameInput.fill('admin');
      await usernameInput.blur();

      const errorMessage = page.locator('[role="alert"]', {
        hasText: /username .* already taken/i,
      });
      await expect(errorMessage).toContainText(
        'The username "admin" is already taken',
      );
      await expect(usernameInput).toHaveAttribute('aria-invalid', 'true');
      await expect(page.getByText(/Pending: false/)).toBeVisible();
    });
  });

  test('should show success for unique username', async ({ page }) => {
    await page.route('**/fake-api/check-user/*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ username: 'uniqueUser123', available: true }),
      });
    });

    await test.step('Type unique username', async () => {
      const usernameInput = page.getByRole('textbox', { name: /username/i });
      await usernameInput.fill('uniqueUser123');
      await usernameInput.blur();

      await expect(
        page.locator('[role="alert"]', {
          hasText: /already taken|unavailable/i,
        }),
      ).toHaveCount(0);
      await expect(usernameInput).not.toHaveAttribute('aria-invalid', 'true');
      await expect(page.getByText('Valid: true')).toBeVisible();
      await expect(page.getByText('Errors: []')).toBeVisible();
    });
  });

  test('should reset field state after Reset button click', async ({
    page,
  }) => {
    // Deterministic: "admin" always reports unavailable.
    await page.route('**/fake-api/check-user/admin', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ username: 'admin', available: false }),
      });
    });

    const usernameInput = page.getByRole('textbox', { name: /username/i });
    const resetButton = page.getByRole('button', { name: /^Reset$/ });

    // Seed the field with a value that fails async validation.
    await usernameInput.fill('admin');
    await usernameInput.blur();

    const errorAlert = page.locator('[role="alert"]', {
      hasText: /already taken/i,
    });
    await expect(errorAlert).toBeVisible();
    await expect(usernameInput).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByText('Valid: false')).toBeVisible();

    // Reset clears the model and the field tree state.
    await resetButton.click();

    // Field is empty, no lingering async error alert, not marked invalid
    // (untouched field under on-touch strategy), and the async pipeline is
    // idle. The sync `required` validator will still populate errors() with
    // a required entry, so we assert the async-specific state specifically:
    // the `usernameTaken` kind is gone.
    await expect(usernameInput).toHaveValue('');
    await expect(errorAlert).toHaveCount(0);
    await expect(usernameInput).not.toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByText('Pending: false')).toBeVisible();
    await expect(page.getByText(/usernameTaken/)).toHaveCount(0);
  });

  test('should allow form submission after async validation passes', async ({
    page,
  }) => {
    await page.route('**/fake-api/check-user/*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ username: 'user_approved', available: true }),
      });
    });

    await test.step('Fill valid unique username', async () => {
      const usernameInput = page.getByRole('textbox', { name: /username/i });

      await usernameInput.fill('user_approved');
      await usernameInput.blur();

      const submitButton = page.getByRole('button', { name: /register/i });
      await expect(submitButton).toBeEnabled();
      await submitButton.click();

      await expect(page.locator(ROLE_ALERT_SELECTOR)).toHaveCount(0);
      await expect(page.getByText('Valid: true')).toBeVisible();
    });
  });
});
