import { expect, test } from '@playwright/test';
/**
 * Form Accessibility Tests
 * WCAG 2.2 Level AA - Forms
 *
 * Verifies:
 * - Required fields marked with aria-required or required attribute
 * - Appropriate input type attributes (email, tel, url, etc.)
 * - Screen reader error announcements (aria-live)
 */

test.describe('Accessibility - Form Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/getting-started/your-first-form`);
    await page.waitForLoadState('domcontentloaded');
  });

  test('should have required fields marked with aria-required', async ({
    page,
  }) => {
    await test.step('Verify aria-required="true" on mandatory fields', async () => {
      const form = page.locator('form').first();
      await expect(form).toBeVisible();

      // Auto-ARIA directive sets aria-required="true" based on validators
      const inputs = form.locator(
        'input[aria-required="true"], textarea[aria-required="true"], select[aria-required="true"]',
      );

      const count = await inputs.count();
      expect(count).toBeGreaterThan(0);

      // Verify first required field has aria-required
      const firstInput = inputs.first();
      await expect(firstInput).toHaveAttribute('aria-required', 'true');
    });
  });

  test('should have input type attributes for better UX', async ({ page }) => {
    await test.step('Verify input types are specified', async () => {
      const form = page.locator('form').first();
      await expect(form).toBeVisible();

      const inputs = form.locator('input');

      const count = await inputs.count();
      expect(count).toBeGreaterThan(0);

      /// Verify at least first input has a valid type attribute
      const firstInput = inputs.first();
      await expect(firstInput).toHaveAttribute(
        'type',
        /text|email|password|number|tel|url/,
      );
    });
  });

  test('should announce errors to screen readers', async ({ page }) => {
    await test.step('Verify error announcement', async () => {
      const form = page.locator('form').first();
      const nameInput = form.locator('input[id="contact-name"]').first();

      await nameInput.focus();
      await nameInput.blur();

      /// Error area should appear with aria-live assertive
      const errorArea = form.locator('[role="alert"]').first();
      await expect(errorArea).toHaveAttribute('aria-live', 'assertive', {
        timeout: 3000,
      });
    });
  });
});
