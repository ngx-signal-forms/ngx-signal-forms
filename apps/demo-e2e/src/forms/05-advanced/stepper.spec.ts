import { expect, test } from '@playwright/test';
/**
 * Stepper / Multi-step Form - E2E Tests
 * Route: /advanced-scenarios/stepper-form
 *
 * Tests multi-step form navigation with validation gates.
 */

test.describe('Advanced Scenarios - Stepper Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/advanced-scenarios/stepper-form`);
    await page.waitForLoadState('domcontentloaded');
  });

  test('should display stepper form', async ({ page }) => {
    await expect(page.locator('form').first()).toBeVisible();

    // Should have navigation buttons
    const nextButton = page.getByRole('button', { name: /next/i });
    await expect(nextButton).toBeVisible();
  });

  test('should block navigation when step validation fails', async ({
    page,
  }) => {
    await test.step('Try to click Next without filling Step 1', async () => {
      const nextButton = page.getByRole('button', { name: /next/i });
      await nextButton.click();

      await expect(
        page.getByRole('heading', { name: 'Account Details' }),
      ).toBeVisible();
    });
  });

  test('should allow navigation when step is valid', async ({ page }) => {
    await test.step('Fill Step 1 and proceed to Step 2', async () => {
      // Find and fill inputs in step 1
      await page.getByLabel(/Email Address/i).fill('test@example.com');
      await page.getByLabel(/Password/i).fill('Test Value');

      // Click Next
      const nextButton = page.getByRole('button', { name: /next/i });
      await nextButton.click();

      await expect(
        page.getByRole('heading', { name: 'Personal Profile' }),
      ).toBeVisible();

      await expect(
        page.getByRole('heading', { name: 'Personal Profile' }),
      ).toBeFocused();
    });
  });

  test('should preserve state between steps', async ({ page }) => {
    await test.step('Fill step 1, go to step 2, go back, verify data persists', async () => {
      const testValue = 'test@example.com';
      const emailInput = page.getByLabel(/Email Address/i);
      await emailInput.fill(testValue);

      // Fill password to make step valid
      await page.getByLabel(/Password/i).fill('ValidPassword123');

      const nextButton = page.getByRole('button', { name: /next/i });
      await nextButton.click();

      // Wait for step 2 to appear
      await expect(
        page.getByRole('heading', { name: 'Personal Profile' }),
      ).toBeVisible();

      const backButton = page.getByRole('button', { name: /back|previous/i });
      await backButton.click();

      // Wait for step 1 to appear again
      await expect(
        page.getByRole('heading', { name: 'Account Details' }),
      ).toBeVisible();

      await expect(emailInput).toHaveValue(testValue);
    });
  });

  test('should indicate current step visually', async ({ page }) => {
    await test.step('Verify step indicator shows active step', async () => {
      const stepperHeader = page.getByRole('heading', {
        name: 'Multi-Step Registration',
      });
      const stepperRegion = stepperHeader.locator('..');

      await expect(
        stepperRegion.getByText('Account', { exact: true }),
      ).toBeVisible();
      await expect(
        stepperRegion.getByText('Profile', { exact: true }),
      ).toBeVisible();
      await expect(
        stepperRegion.getByText('Review', { exact: true }),
      ).toBeVisible();
      await expect(stepperRegion.locator('.bg-blue-600').first()).toBeVisible();
    });
  });

  test('should focus step heading on back navigation', async ({ page }) => {
    await page.getByLabel(/Email Address/i).fill('test@example.com');
    await page.getByLabel(/Password/i).fill('ValidPassword123');

    await page.getByRole('button', { name: /next/i }).click();

    await expect(
      page.getByRole('heading', { name: 'Personal Profile' }),
    ).toBeFocused();

    await page.getByRole('button', { name: /back|previous/i }).click();

    await expect(
      page.getByRole('heading', { name: 'Account Details' }),
    ).toBeFocused();
  });

  test('should show terms error when unchecked', async ({ page }) => {
    await page.getByLabel(/Email Address/i).fill('test@example.com');
    await page.getByLabel(/Password/i).fill('ValidPassword123');
    await page.getByRole('button', { name: /next/i }).click();

    await page.getByLabel(/Full Name/i).fill('Test Person');
    await page.getByLabel(/Phone Number/i).fill('555-0100');
    await page.getByRole('button', { name: /next/i }).click();

    await expect(
      page.getByRole('heading', { name: 'Review & Terms' }),
    ).toBeVisible();

    await page.getByRole('button', { name: /Complete Registration/i }).click();

    await expect(
      page.getByText('You must accept the terms and conditions'),
    ).toBeVisible();
  });
});
