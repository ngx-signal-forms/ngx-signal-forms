import { expect, test } from '@playwright/test';
/**
 * Async Validation - E2E Tests
 * Route: /advanced-scenarios/async-validation
 *
 * Tests async server-side validation with loading states.
 * Note: Requires MSW (Mock Service Worker) for deterministic testing.
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

  test.fixme('should show loading state during async validation (requires slower async)', async ({
    page,
  }) => {
    // Loading state happens too fast in demo (instant validation)
    // Would need to add artificial delay or MSW mock with delay to test reliably
    await test.step('Type in username field', async () => {
      const usernameInput = page.getByRole('textbox', { name: /username/i });
      await usernameInput.fill('testuser');
      await usernameInput.blur();

      await expect
        .poll(async () => {
          const hasLoadingSpinner =
            (await page.locator('[role="status"]').count()) > 0;
          const hasAriaBusy =
            (await usernameInput.getAttribute('aria-busy')) === 'true';
          const hasLoadingText =
            (await page
              .locator('text=/validating|checking|loading/i')
              .count()) > 0;

          return hasLoadingSpinner || hasAriaBusy || hasLoadingText;
        })
        .toBe(true);
    });
  });

  test.fixme('should show error for "admin" username (requires MSW)', async ({
    page,
  }) => {
    // TODO: Set up MSW to mock API response
    // MSW should intercept /api/check-username and return { available: false } for "admin"

    await test.step('Type "admin" username', async () => {
      const usernameInput = page.getByRole('textbox', { name: /username/i });
      await usernameInput.fill('admin');
      await usernameInput.blur();

      // Should show "Username is already taken" error
      const errorMessage = page.locator('[role="alert"]', {
        hasText: /already taken|unavailable/i,
      });
      await expect(errorMessage).toBeVisible({ timeout: 3000 });
    });
  });

  test.fixme('should show success for unique username (requires MSW)', async ({
    page,
  }) => {
    // TODO: Set up MSW to mock API response
    // MSW should intercept /api/check-username and return { available: true } for other usernames

    await test.step('Type unique username', async () => {
      const usernameInput = page.getByRole('textbox', { name: /username/i });
      await usernameInput.fill('uniqueUser123');
      await usernameInput.blur();

      // Should NOT show error
      const errors = page.locator('[role="alert"]');
      await expect(errors).toHaveCount(0);

      // Field should be valid
      await expect(usernameInput).not.toHaveAttribute('aria-invalid', 'true');
    });
  });

  test('should allow form submission after async validation passes', async ({
    page,
  }) => {
    await test.step('Fill valid unique username', async () => {
      const usernameInput = page.getByRole('textbox', { name: /username/i });

      // Use a username that's unlikely to conflict
      await usernameInput.fill(`user_${Date.now()}`);
      await usernameInput.blur();

      // Try to submit
      const submitButton = page.getByRole('button', { name: /register/i });
      await expect(submitButton).toBeEnabled();
      await submitButton.click();

      // Form should process (no blocking errors)
      // Exact behavior depends on implementation
    });
  });
});
