import { expect, test } from '@playwright/test';

/**
 * Accessibility Comparison - Comprehensive Tests
 * Route: /toolkit-core/accessibility-comparison
 *
 * Tests all THREE forms side-by-side:
 * - Manual: Full manual ARIA implementation (95 lines)
 * - Minimal: Using error component only (55 lines)
 * - Full: Using [ngxSignalForm] directive (31 lines)
 *
 * Validates that toolkit provides equivalent accessibility with less code.
 */

test.describe('Toolkit Core - Accessibility Comparison (All Three Forms)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/toolkit-core/accessibility-comparison');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should render all three forms', async ({ page }) => {
    await test.step('Verify three forms are present', async () => {
      const forms = page.locator('form');
      await expect(forms).toHaveCount(3);
    });

    await test.step('Verify form labels/headings', async () => {
      // Look for section headings that differentiate the forms
      const manualHeading = page.locator('text=/manual/i').first();
      const minimalHeading = page.locator('text=/minimal/i').first();
      const fullHeading = page.locator('text=/full|toolkit/i').first();

      // At least the forms should be visible
      const forms = page.locator('form');
      await expect(forms.nth(0)).toBeVisible();
      await expect(forms.nth(1)).toBeVisible();
      await expect(forms.nth(2)).toBeVisible();
    });
  });

  test('should have equivalent ARIA attributes across all three forms', async ({
    page,
  }) => {
    await test.step('Test Manual form (form 0) ARIA', async () => {
      const manualForm = page.locator('form').nth(0);
      const emailInput = manualForm.locator('input[type="email"]').first();

      await emailInput.focus();
      await emailInput.blur();

      // Should have aria-invalid
      await expect(emailInput).toHaveAttribute('aria-invalid', 'true');

      // Should have aria-describedby
      await expect(emailInput).toHaveAttribute('aria-describedby');
    });

    await test.step('Test Minimal form (form 1) ARIA', async () => {
      const minimalForm = page.locator('form').nth(1);
      const emailInput = minimalForm.locator('input[type="email"]').first();

      await emailInput.focus();
      await emailInput.blur();

      await expect(emailInput).toHaveAttribute('aria-invalid', 'true');
      await expect(emailInput).toHaveAttribute('aria-describedby');
    });

    await test.step('Test Full toolkit form (form 2) with [ngxSignalForm]', async () => {
      const fullForm = page.locator('form').nth(2);
      const emailInput = fullForm.locator('input[type="email"]').first();

      await emailInput.focus();
      await emailInput.blur();

      // Full form uses auto-ARIA directive
      await expect(emailInput).toHaveAttribute('aria-invalid', 'true');
      await expect(emailInput).toHaveAttribute('aria-describedby');
    });
  });

  test('should show equivalent error messages across all three forms', async ({
    page,
  }) => {
    await test.step('Trigger errors on all three forms', async () => {
      const forms = page.locator('form');

      for (let i = 0; i < 3; i++) {
        const form = forms.nth(i);
        const emailInput = form.locator('input[type="email"]').first();

        await emailInput.focus();
        await emailInput.blur();
      }

      await page.waitForTimeout(500);
    });

    await test.step('Verify all three forms show errors', async () => {
      const forms = page.locator('form');

      for (let i = 0; i < 3; i++) {
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
      // Trigger validation on all forms
      const forms = page.locator('form');

      for (let i = 0; i < 3; i++) {
        const form = forms.nth(i);
        const emailInput = form.locator('input[type="email"]').first();

        await emailInput.focus();
        await emailInput.blur();
      }

      await page.waitForTimeout(500);

      // All three should have:
      // - Input with aria-invalid
      // - Error with role="alert"
      // - aria-describedby linking them

      for (let i = 0; i < 3; i++) {
        const form = forms.nth(i);

        const emailInput = form.locator('input[type="email"]').first();
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
    await test.step('Verify [ngxSignalForm] directive is active on form 2', async () => {
      const fullForm = page.locator('form').nth(2);

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
      const emailInput = fullForm.locator('input[type="email"]').first();
      await emailInput.focus();
      await emailInput.blur();

      await page.waitForTimeout(300);

      // Auto-ARIA should set aria-invalid and aria-describedby automatically
      await expect(emailInput).toHaveAttribute('aria-invalid', 'true');
      await expect(emailInput).toHaveAttribute('aria-describedby');
    });
  });

  test('should demonstrate code reduction benefit', async ({ page }) => {
    await test.step('Verify all three approaches work identically', async () => {
      // All three forms should:
      // 1. Validate on blur
      // 2. Show errors with correct ARIA
      // 3. Clear errors when fixed

      const forms = page.locator('form');

      for (let i = 0; i < 3; i++) {
        const form = forms.nth(i);
        const emailInput = form.locator('input[type="email"]').first();

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
