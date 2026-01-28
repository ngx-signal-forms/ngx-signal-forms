import { expect, test } from '@playwright/test';

test.describe('Error Messages - 3-Tier Priority', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/advanced-scenarios/error-messages');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should display Tier 1 (Validator) error message', async ({ page }) => {
    await test.step('Verify email validator message takes priority', async () => {
      const emailInput = page.getByLabel('Email (Validator Message - Tier 1)');

      // Type invalid email to trigger email validator
      await emailInput.fill('invalid-email');
      await emailInput.blur();

      // Expect the message defined in schema: { message: 'Valid email required' }
      const error = page
        .locator('[role="alert"]')
        .filter({ hasText: 'Valid email required' });
      await expect(error).toBeVisible();
    });
  });

  test('should display Tier 2 (Registry) error message', async ({ page }) => {
    await test.step('Verify password registry message is used', async () => {
      const passwordInput = page.getByLabel(
        'Password (Registry Override - Tier 2)',
      );

      // Type short password to trigger minLength validator
      await passwordInput.fill('short');
      await passwordInput.blur();

      // Expect the message defined in component provider: "Minimum 8 characters required"
      const error = page
        .locator('[role="alert"]')
        .filter({ hasText: 'Minimum 8 characters required' });
      await expect(error).toBeVisible();
    });
  });

  test('should display Tier 2 (Registry) for Bio required', async ({
    page,
  }) => {
    await test.step('Verify bio registry message is used', async () => {
      const bioInput = page.getByLabel('Bio (Default Fallback - Tier 3)');

      // Focus and blur to trigger required (if empty)
      await bioInput.focus();
      await bioInput.blur();

      // Select the alert that is specifically for this field
      // We can find the alert that follows the bio input or use a more specific container scope if available.
      // Since IDs might be dynamic, we filter by the text AND ensure it's the one associated with our field.
      // A robust way in this specific demo layout is to look for the alert within the same generic container
      // or simply rely on the fact that it matches 'This field is required' AND is the 3rd one? No, that's brittle.

      const fieldGroup = page.locator('ngx-signal-form-field-wrapper', {
        has: bioInput,
      });

      const specificError = fieldGroup
        .locator('[role="alert"]')
        .filter({ hasText: 'This field is required' });
      await expect(specificError).toBeVisible();
    });
  });
});
