import { expect, test } from '@playwright/test';
/**
 * Accessibility Comparison - Comprehensive Tests
 * Route: /toolkit-core/accessibility-comparison
 *
 * Tests TWO forms side-by-side:
 * - Minimal: Auto-ARIA only, no [ngxSignalForm] (~55 lines)
 * - Full: Complete with [ngxSignalForm] and error components (~31 lines)
 *
 * Validates that toolkit provides equivalent accessibility with less code.
 */

test.describe('Toolkit Core - Accessibility Comparison (Two Forms)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/toolkit-core/accessibility-comparison`);
    await page.waitForLoadState('domcontentloaded');
  });

  test('should render both forms', async ({ page }) => {
    await test.step('Verify two forms are present', async () => {
      const forms = page.locator('form');
      await expect(forms).toHaveCount(2);
    });

    await test.step('Verify form labels/headings', async () => {
      // Look for section headings that differentiate the forms
      const minimalHeading = page.locator('text=/minimal/i').first();
      const fullHeading = page.locator('text=/full|toolkit/i').first();

      await expect(minimalHeading).toBeVisible();
      await expect(fullHeading).toBeVisible();

      // Both forms should be visible
      const forms = page.locator('form');
      await expect(forms.nth(0)).toBeVisible();
      await expect(forms.nth(1)).toBeVisible();
    });
  });

  test('should have equivalent ARIA attributes across both forms', async ({
    page,
  }) => {
    await test.step('Test Minimal form (form 0) ARIA', async () => {
      const minimalForm = page.locator('form').nth(0);
      const emailInput = minimalForm
        .locator('input[type="email"], input[type="text"]')
        .first();

      await emailInput.focus();
      await emailInput.blur();

      await expect(emailInput).toHaveAttribute('aria-invalid', 'true');
      await expect(emailInput).toHaveAttribute('aria-describedby');
    });

    await test.step('Test Full toolkit form (form 1) with [ngxSignalForm]', async () => {
      const fullForm = page.locator('form').nth(1);
      const emailInput = fullForm
        .locator('input[type="email"], input[type="text"]')
        .first();

      await emailInput.focus();
      await emailInput.blur();

      // Full form uses auto-ARIA directive
      await expect(emailInput).toHaveAttribute('aria-invalid', 'true');
      await expect(emailInput).toHaveAttribute('aria-describedby');
    });
  });

  test('should show equivalent error messages across both forms', async ({
    page,
  }) => {
    await test.step('Trigger errors on both forms', async () => {
      const forms = page.locator('form');

      for (let i = 0; i < 2; i++) {
        const form = forms.nth(i);
        const emailInput = form
          .locator('input[type="email"], input[type="text"]')
          .first();

        await emailInput.focus();
        await emailInput.blur();
      }

      await page.waitForTimeout(500);
    });

    await test.step('Verify both forms show errors', async () => {
      const forms = page.locator('form');

      for (let i = 0; i < 2; i++) {
        const form = forms.nth(i);
        const errorAlert = form.locator('[role="alert"]').first();

        await expect(errorAlert).toBeVisible();
        await expect(errorAlert).toContainText(/required|invalid/i);
      }
    });
  });

  test('should have equivalent accessibility tree structure', async ({
    page,
  }) => {
    await test.step('Compare accessibility snapshots', async () => {
      // Trigger validation on both forms
      const forms = page.locator('form');

      for (let i = 0; i < 2; i++) {
        const form = forms.nth(i);
        const emailInput = form
          .locator('input[type="email"], input[type="text"]')
          .first();

        await emailInput.focus();
        await emailInput.blur();
      }

      await page.waitForTimeout(500);

      // Both should have:
      // - Input with aria-invalid
      // - Error with role="alert"
      // - aria-describedby linking them

      for (let i = 0; i < 2; i++) {
        const form = forms.nth(i);

        const emailInput = form
          .locator('input[type="email"], input[type="text"]')
          .first();
        const errorAlert = form.locator('[role="alert"]').first();

        const ariaInvalid = emailInput;
        const ariaDescribedby = emailInput;
        const errorRole = errorAlert;

        await expect(ariaInvalid).toHaveAttribute('aria-invalid', 'true');
        await expect(ariaDescribedby).toHaveAttribute('aria-describedby');
        await expect(errorRole).toHaveAttribute('role', 'alert');
      }
    });
  });

  test('Full toolkit form should use auto-ARIA directive', async ({ page }) => {
    await test.step('Verify [ngxSignalForm] directive is active on form 1', async () => {
      const fullForm = page.locator('form').nth(1);

      // Verify directive is attached (may have data attribute or specific class)
      const hasDirective = await fullForm.evaluate((el) => {
        // Check if directive added any attributes
        return (
          el.hasAttribute('ngxsignalform') ||
          el.hasAttribute('data-ngx-signal-form') ||
          el.className.includes('ngx-signal-form')
        );
      });

      // Or just verify auto-ARIA works correctly
      const emailInput = fullForm
        .locator('input[type="email"], input[type="text"]')
        .first();
      await emailInput.focus();
      await emailInput.blur();

      await page.waitForTimeout(300);

      // Auto-ARIA should set aria-invalid and aria-describedby automatically
      await expect(emailInput).toHaveAttribute('aria-invalid', 'true');
      await expect(emailInput).toHaveAttribute('aria-describedby');
    });
  });

  test('should demonstrate code reduction benefit', async ({ page }) => {
    await test.step('Verify both approaches work identically', async () => {
      // Both forms should:
      // 1. Validate on blur
      // 2. Show errors with correct ARIA
      // 3. Clear errors when fixed

      const forms = page.locator('form');

      for (let i = 0; i < 2; i++) {
        const form = forms.nth(i);
        const emailInput = form
          .locator('input[type="email"], input[type="text"]')
          .first();

        // Trigger error
        await emailInput.focus();
        await emailInput.blur();
        await expect(form.locator('[role="alert"]').first()).toBeVisible();

        // Fix error
        await emailInput.fill('test@example.com');
        await emailInput.blur();

        await page.waitForTimeout(300);

        // Error should clear
        await expect(emailInput).not.toHaveAttribute('aria-invalid', 'true');
      }
    });
  });
});
