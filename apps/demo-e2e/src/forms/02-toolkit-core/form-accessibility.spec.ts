import { expect, test } from '@playwright/test';

import { ROLE_STATUS_SELECTOR } from '../../fixtures/aria-selectors';
test.describe('Accessibility - Form Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/getting-started/your-first-form`);
    await page.waitForLoadState('domcontentloaded');
  });

  test('exposes required fields by label and uses an email input', async ({
    page,
  }) => {
    const name = page.getByRole('textbox', { name: 'Name *' });
    const email = page.getByRole('textbox', { name: 'Email *' });
    const message = page.getByRole('textbox', { name: 'Message *' });

    await expect(name).toHaveAttribute('aria-required', 'true');
    await expect(email).toHaveAttribute('aria-required', 'true');
    await expect(email).toHaveAttribute('type', 'email');
    await expect(message).toHaveAttribute('aria-required', 'true');
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

      const status = page.locator(ROLE_STATUS_SELECTOR).first();
      await expect(status).toBeVisible({ timeout: 3000 });
    });

    await test.step('Assert no redundant aria attrs', async () => {
      const status = page.locator(ROLE_STATUS_SELECTOR).first();
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

      await expect(page.locator(ROLE_STATUS_SELECTOR).first()).toBeVisible({
        timeout: 3000,
      });
    });

    await test.step('Verify describedby contains warning id', async () => {
      const describedBy = await passwordInput.getAttribute('aria-describedby');
      expect(describedBy).toContain('password-warning');
    });
  });
});
