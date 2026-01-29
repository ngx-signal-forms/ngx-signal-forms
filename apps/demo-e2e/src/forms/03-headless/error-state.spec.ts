import { expect, test } from '@playwright/test';
/**
 * Headless Error State - E2E Tests
 * Route: /headless/error-state
 */

test.describe('Headless - Error State', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/headless/error-state`);
    // Wait for Angular to fully load - the form should be present and interactive
    await expect(page.locator('form').first()).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
  });

  test('should render headless form fields', async ({ page }) => {
    await test.step('Verify form and inputs are visible', async () => {
      await expect(page.locator('form').first()).toBeVisible();
      await expect(page.getByLabel('Email')).toBeVisible();
      await expect(page.getByLabel('Bio')).toBeVisible();
    });
  });

  test('should show error after blur on empty email', async ({ page }) => {
    await test.step('Trigger email error with blur', async () => {
      const emailInput = page.getByLabel('Email');
      await emailInput.focus();
      await emailInput.blur();

      // Wait for aria-invalid to be set (validation has triggered)
      await expect(emailInput).toHaveAttribute('aria-invalid', 'true');

      // Then check for error message
      const alert = page.locator('[role="alert"]').filter({
        hasText: 'Email is required',
      });
      await expect(alert).toBeVisible();
    });
  });

  test('should update character count while typing', async ({ page }) => {
    await test.step('Type into bio and verify count', async () => {
      const bioInput = page.getByLabel('Bio');
      await bioInput.fill('Hello');

      // Wait for the character count to update to the expected value
      await expect(page.getByText(/5\s*\/\s*160/)).toBeVisible();
    });
  });
});
