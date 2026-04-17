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

      // `role="alert"` implies `aria-live="assertive"` + `aria-atomic="true"`
      // per the ARIA spec — asserting the role alone is sufficient for SR
      // announcement and avoids double-announce bugs on NVDA+Firefox that
      // setting the explicit attributes would trigger.
      const errorArea = form.locator('[role="alert"]').first();
      await expect(errorArea).toBeVisible({ timeout: 3000 });
    });
  });

  test('role="alert" should NOT carry redundant aria-live / aria-atomic', async ({
    page,
  }) => {
    // PR #17 hardening: `role="alert"` already implies `aria-live="assertive"`
    // and `aria-atomic="true"` per ARIA. Setting them explicitly causes
    // double-announce on NVDA + Firefox, so v1 exposes only the role.
    await test.step('Trigger a visible alert', async () => {
      const form = page.locator('form').first();
      const nameInput = form.locator('input[id="contact-name"]').first();
      await nameInput.focus();
      await nameInput.blur();

      const alert = form.locator('[role="alert"]').first();
      await expect(alert).toBeVisible({ timeout: 3000 });
    });

    await test.step('Assert no redundant aria attrs', async () => {
      const alert = page.locator('form [role="alert"]').first();
      await expect(alert).not.toHaveAttribute('aria-live', /.*/);
      await expect(alert).not.toHaveAttribute('aria-atomic', /.*/);
    });
  });

  test('role="status" (warning) should NOT carry redundant aria-live', async ({
    page,
  }) => {
    // Same hardening, applied to non-blocking warnings. `role="status"`
    // implies `aria-live="polite"` + `aria-atomic="true"`.
    await page.goto('/toolkit-core/warning-support');
    await page.waitForLoadState('domcontentloaded');

    await test.step('Trigger a visible warning', async () => {
      const usernameInput = page.locator('#username');
      const emailInput = page.locator('#email');
      const passwordInput = page.locator('#password');

      await usernameInput.fill('testuser');
      await emailInput.fill('test@example.com');
      // 8 chars meets minLength but triggers the weak-password warning.
      await passwordInput.fill('Short123');
      await passwordInput.blur();

      const status = page.locator('[role="status"]').first();
      await expect(status).toBeVisible({ timeout: 3000 });
    });

    await test.step('Assert no redundant aria attrs', async () => {
      const status = page.locator('[role="status"]').first();
      await expect(status).not.toHaveAttribute('aria-live', /.*/);
      await expect(status).not.toHaveAttribute('aria-atomic', /.*/);
    });
  });

  test('aria-describedby should include warning ID when warning is visible', async ({
    page,
  }) => {
    // PR #17: auto-ARIA appends warning IDs to aria-describedby independently
    // of error IDs so screen readers surface non-blocking guidance too.
    await page.goto('/toolkit-core/warning-support');
    await page.waitForLoadState('domcontentloaded');

    const passwordInput = page.locator('#password');

    await test.step('Fill to trigger weak-password warning', async () => {
      await page.locator('#username').fill('testuser');
      await page.locator('#email').fill('test@example.com');
      await passwordInput.fill('Short123');
      await passwordInput.blur();

      await expect(page.locator('[role="status"]').first()).toBeVisible({
        timeout: 3000,
      });
    });

    await test.step('Verify describedby contains warning id', async () => {
      const describedBy = await passwordInput.getAttribute('aria-describedby');
      expect(describedBy).toContain('password-warning');
    });
  });
});
