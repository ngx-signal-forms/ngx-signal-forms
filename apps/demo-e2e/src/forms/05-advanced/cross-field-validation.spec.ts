import { expect, test } from '@playwright/test';
/**
 * Cross-Field Validation - E2E Tests
 * Route: /advanced-scenarios/cross-field-validation
 *
 * Tests validation that depends on multiple field values.
 */

test.describe('Advanced Scenarios - Cross-Field Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/advanced-scenarios/cross-field-validation`);
    await page.waitForLoadState('domcontentloaded');
  });

  test('should display cross-field validation form', async ({ page }) => {
    await expect(page.locator('form').first()).toBeVisible();
  });

  test('should validate fields depend on each other', async ({ page }) => {
    await test.step('Find date or password fields for cross-validation', async () => {
      const checkInInput = page.getByLabel('Check-In');
      const checkOutInput = page.getByLabel('Check-Out');

      await expect(checkInInput).toBeVisible();
      await expect(checkOutInput).toBeVisible();
    });
  });

  test('should show error when cross-field validation fails', async ({
    page,
  }) => {
    await test.step('Test date range validation OR password mismatch', async () => {
      const checkInInput = page.getByLabel('Check-In');
      const checkOutInput = page.getByLabel('Check-Out');

      await checkInInput.fill('2025-01-20');
      await checkOutInput.fill('2025-01-10');
      await checkOutInput.blur();

      const errorText = page.locator(
        'text=/check-out must be after check-in/i',
      );
      await expect(errorText.first()).toBeVisible({ timeout: 3000 });
    });
  });

  test('should clear error when cross-field validation passes', async ({
    page,
  }) => {
    await test.step('Fix validation by matching fields', async () => {
      const checkInInput = page.getByLabel('Check-In');
      const checkOutInput = page.getByLabel('Check-Out');

      await checkInInput.fill('2025-01-10');
      await checkOutInput.fill('2025-01-20');
      await checkOutInput.blur();

      const errorText = page.locator('[role="alert"]', {
        hasText: /check-out must be after check-in/i,
      });
      await expect(errorText).toHaveCount(0);
    });
  });

  test('should show promo-code error when guest count exceeds the offer limit', async ({
    page,
  }) => {
    await test.step('enter a promo code that depends on the guest field', async () => {
      await page.getByLabel('Guests').fill('5');
      await page.getByLabel('Promo Code').fill('SMALLGROUP');
      await page.getByLabel('Promo Code').blur();
    });

    await test.step('verify the dependent promo-code validation message', async () => {
      const errorText = page.locator('[role="alert"]', {
        hasText: /promo valid only for small groups/i,
      });

      await expect(errorText).toBeVisible();
    });

    await test.step('reduce the group size and verify the error clears', async () => {
      await page.getByLabel('Guests').fill('4');
      await page.getByLabel('Guests').blur();

      const errorText = page.locator('[role="alert"]', {
        hasText: /promo valid only for small groups/i,
      });

      await expect(errorText).toHaveCount(0);
    });
  });
});
