import { expect, test } from '@playwright/test';

test.describe('CSS Status Classes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/toolkit-core/css-status-classes');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should display native behavior (immediate classes)', async ({
    page,
  }) => {
    await test.step('Verify immediate invalid class on typing', async () => {
      const form = page.locator('.native-strategy');
      const emailInput = form.getByLabel('Email Address');

      // Initially valid (empty) or invalid depending on required?
      // Required is true. But pristine.
      // Angular adds ng-invalid immediately if invalid.
      // Our demo bindings: [class.demo-invalid]="nativeClasses().invalid"

      // Type invalid email
      await emailInput.fill('invalid-email');

      // Should satisfy required, but fail email.
      // "nativeClasses().invalid" should be true immediately.
      await expect(emailInput).toHaveClass(/demo-invalid/);

      // Verify hint text
      await expect(
        form.getByText('Pure Angular (immediate classes)'),
      ).toBeVisible();
    });
  });

  test('should display toolkit immediate strategy behavior', async ({
    page,
  }) => {
    await test.step('Verify immediate invalid class on typing', async () => {
      const emailInput = page.locator('#immediate-email');

      // Type invalid email
      await emailInput.fill('invalid-email');

      // Should have demo-invalid class immediately
      await expect(emailInput).toHaveClass(/demo-invalid/);

      // Verify hint
      await expect(
        page
          .locator('.immediate-strategy')
          .getByText('Red border appears instantly'),
      ).toBeVisible();
    });

    await test.step('Verify valid class when corrected', async () => {
      const emailInput = page.locator('#immediate-email');

      await emailInput.fill('valid@example.com');
      await expect(emailInput).toHaveClass(/demo-valid/);
      await expect(emailInput).not.toHaveClass(/demo-invalid/);
    });
  });

  test('should display toolkit on-touch strategy behavior', async ({
    page,
  }) => {
    await test.step('Verify NO invalid class on typing initially', async () => {
      const emailInput = page.locator('#on-touch-email');

      // Type invalid email
      await emailInput.fill('invalid-email');

      // Should NOT have demo-invalid class yet (not touched/blurred)
      // Note: playwright .fill() focuses, types, but doesn't necessarily blur unless we click away or tab.
      await expect(emailInput).not.toHaveClass(/demo-invalid/);

      // Verify hint
      await expect(
        page
          .locator('.on-touch-strategy')
          .getByText('Red border appears after blur'),
      ).toBeVisible();
    });

    await test.step('Verify invalid class appears AFTER blur', async () => {
      const emailInput = page.locator('#on-touch-email');

      // Blur the field
      await emailInput.blur();

      // Now it should have demo-invalid
      await expect(emailInput).toHaveClass(/demo-invalid/);
    });

    await test.step('Verify valid class appears AFTER blur', async () => {
      const emailInput = page.locator('#on-touch-email');

      // Correct the email
      await emailInput.fill('valid@example.com');

      // It might be valid immediately in model, but our class binding check:
      // [class.demo-valid]="onTouchClasses().valid && onTouchClasses().touched"
      // It is already touched from previous step. So valid should appear immediately on typing *if* touched is true.
      // Wait, binding is: valid && touched.
      // If we type, it is still touched. So it should show valid immediately?
      // Let's verify.

      await expect(emailInput).toHaveClass(/demo-valid/);
      await expect(emailInput).not.toHaveClass(/demo-invalid/);
    });
  });
});
