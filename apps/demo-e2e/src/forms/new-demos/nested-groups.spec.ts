import { expect, test } from '@playwright/test';

/**
 * Nested Groups - E2E Tests
 * Route: /new-demos/nested-groups
 *
 * Tests deeply nested form structures and path resolution.
 */

test.describe('New Demos - Nested Groups', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/new-demos/nested-groups');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should display nested groups form', async ({ page }) => {
    await expect(page.locator('form').first()).toBeVisible();
  });

  test('should interact with deeply nested fields', async ({ page }) => {
    await test.step('Find and interact with nested field', async () => {
      // Look for common nested patterns like address.city or profile.contact.email
      const inputs = page.locator('input');
      await expect(inputs.first()).toBeVisible();

      const count = await inputs.count();
      for (let i = 0; i < Math.min(count, 3); i++) {
        await inputs.nth(i).focus();
        await inputs.nth(i).blur();
      }
    });
  });

  test('should validate nested fields correctly', async ({ page }) => {
    await test.step('Trigger validation on nested required field', async () => {
      const requiredInputs = page.locator(
        'input[required], input[aria-required="true"]',
      );
      const input = requiredInputs.first();
      await expect(input).toBeVisible();
      await input.focus();
      await input.blur();

      const errors = page.locator('[role="alert"]');
      await expect(errors.first()).toBeVisible({ timeout: 2000 });
    });
  });

  test('should display errors with correct nested path', async ({ page }) => {
    await test.step('Verify error paths reflect nesting', async () => {
      // Trigger validation
      const inputs = page.locator('input[required]').or(page.locator('input'));
      const input = inputs.first();
      await expect(input).toBeVisible();
      await input.focus();
      await input.blur();

      const errors = page.locator('[role="alert"]');
      await expect(errors.first()).toBeVisible({ timeout: 2000 });
      await expect(errors.first()).toHaveAttribute('id');
    });
  });

  test('should show nested validation in error summary', async ({ page }) => {
    await test.step('Submit form and check error summary', async () => {
      // Try to submit empty/invalid form
      const submitButton = page.getByRole('button', { name: /save profile/i });
      await submitButton.click();

      // Touch some fields to trigger errors
      const inputs = page.locator('input');
      const count = await inputs.count();
      for (let i = 0; i < Math.min(count, 3); i++) {
        await inputs.nth(i).focus();
        await inputs.nth(i).blur();
      }

      // Look for error summary (common pattern at top of form)
      const validationPanel = page.getByText('Validation Errors').first();
      await expect(validationPanel).toBeVisible({ timeout: 2000 });
    });
  });
});
