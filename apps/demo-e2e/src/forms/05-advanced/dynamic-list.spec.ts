import { expect, test } from '@playwright/test';

/**
 * Dynamic Form Arrays (Dynamic Lists) - E2E Tests
 * Route: /advanced-scenarios/dynamic-list
 *
 * Tests dynamic addition/removal of form array items
 * and proper field name resolution for ARIA attributes.
 */

test.describe('Advanced Scenarios - Dynamic Form Arrays', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/advanced-scenarios/dynamic-list');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should display dynamic list form', async ({ page }) => {
    await expect(page.locator('form').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /add/i })).toBeVisible();
  });

  test('should add new items to the list', async ({ page }) => {
    await test.step('Click Add button', async () => {
      const items = page.locator(
        '[data-test*="item"], .list-item, form > div > div',
      );
      const initialItemCount = await items.count();

      const addButton = page.getByRole('button', { name: /add/i }).first();
      await addButton.click();

      await expect
        .poll(async () => items.count())
        .toBeGreaterThan(initialItemCount);
    });
  });

  test('should remove items from the list', async ({ page }) => {
    await test.step('Add items and then remove one', async () => {
      const addButton = page.getByRole('button', { name: /add/i }).first();

      // Add 2 items so we can verify removal
      await addButton.click();

      const removeButtons = page.getByRole('button', {
        name: /remove|delete/i,
      });

      // Wait for buttons to appear after adding
      await expect
        .poll(async () => removeButtons.count())
        .toBeGreaterThanOrEqual(2);

      const countBeforeRemoval = await removeButtons.count();

      // Remove first item
      await removeButtons.first().click();

      // Verify count decreased
      await expect
        .poll(async () => removeButtons.count())
        .toBe(countBeforeRemoval - 1);
    });
  });

  test('should validate all items on submit', async ({ page }) => {
    await test.step('Add items and submit without filling', async () => {
      // Add a couple items
      const addButton = page.getByRole('button', { name: /add/i }).first();
      const inputs = page.locator('input[type="text"]');
      const initialInputCount = await inputs.count();

      await addButton.click();
      await addButton.click();

      await expect
        .poll(async () => inputs.count())
        .toBeGreaterThan(initialInputCount);

      // Try to submit
      const submitButton = page.getByRole('button', { name: /save tasks/i });
      await submitButton.click();

      // Touch fields to trigger validation display
      const count = await inputs.count();
      for (let i = 0; i < Math.min(count, 3); i++) {
        await inputs.nth(i).focus();
        await inputs.nth(i).blur();
      }

      // Errors should appear
      const errors = page.locator('[role="alert"]');
      await expect(errors.first()).toBeVisible({ timeout: 2000 });
    });
  });

  test('new items should have pristine validation state', async ({ page }) => {
    await test.step('Add new item and verify no immediate errors', async () => {
      const addButton = page.getByRole('button', { name: /add/i }).first();
      const inputs = page.locator('input[type="text"]');
      const initialInputCount = await inputs.count();
      await addButton.click();

      await expect
        .poll(async () => inputs.count())
        .toBeGreaterThan(initialInputCount);

      // New items should not show errors immediately (pristine state)
      // They should only show errors after being touched
      const lastInput = inputs.last();

      // Should not have aria-invalid="true" before interaction
      const ariaInvalid = lastInput;
      await expect(ariaInvalid).not.toHaveAttribute('aria-invalid', 'true');
    });
  });

  test.fixme('should NOT log field name resolution errors to console', async ({
    page,
  }) => {
    // REGRESSION CHECK for "Could not resolve field name" warnings
    const consoleWarnings: string[] = [];

    page.on('console', (msg) => {
      if (
        msg.type() === 'warning' &&
        msg.text().includes('Could not resolve field name')
      ) {
        consoleWarnings.push(msg.text());
      }
    });

    await test.step('Add and interact with dynamic items', async () => {
      const addButton = page.getByRole('button', { name: /add/i }).first();

      const inputs = page.locator('input');
      const initialInputCount = await inputs.count();

      await addButton.click();
      await addButton.click();

      await expect
        .poll(async () => inputs.count())
        .toBeGreaterThan(initialInputCount);

      // Interact with inputs to trigger field resolution
      const count = await inputs.count();
      for (let i = 0; i < Math.min(count, 3); i++) {
        await inputs.nth(i).focus();
        await inputs.nth(i).blur();
      }
    });

    // Verify no field resolution warnings
    expect(consoleWarnings).toHaveLength(0);
  });
});
