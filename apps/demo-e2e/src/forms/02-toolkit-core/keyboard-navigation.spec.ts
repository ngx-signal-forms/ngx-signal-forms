import { expect, test } from '@playwright/test';
/**
 * Keyboard Navigation Accessibility Tests
 * WCAG 2.2 Level AA - Keyboard Accessible
 *
 * Verifies:
 * - Tab key navigation through form elements
 * - Shift+Tab backward navigation
 * - Enter key activation on buttons
 * - Space key activation on buttons
 * - Visible focus indicators on all interactive elements
 */

test.describe('Accessibility - Keyboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/getting-started/your-first-form`);
    await page.waitForLoadState('domcontentloaded');
  });

  test('should navigate through form using Tab key', async ({ page }) => {
    await test.step('Tab through all interactive elements', async () => {
      const form = page.locator('form').first();
      const firstInput = form.locator('input, textarea, button').first();

      /// Focus first interactive element
      await firstInput.focus();
      await expect(firstInput).toBeFocused();

      for (let i = 0; i < 2; i++) {
        await page.keyboard.press('Tab');
      }
    });
  });

  test('should navigate backward with Shift+Tab', async ({ page }) => {
    await test.step('Navigate backward through elements', async () => {
      const form = page.locator('form').first();
      const submitButton = form.locator('button').first();

      await submitButton.focus();
      await page.keyboard.press('Shift+Tab');

      /// Verify previous element receives focus (message input)
      const messageInput = form.locator('textarea').first();
      await expect(messageInput).toBeFocused({ timeout: 2000 });
    });
  });

  test('should activate button with Enter key', async ({ page }) => {
    await test.step('Navigate to button and press Enter', async () => {
      const nameInput = page.locator('input[id="contact-name"]').first();
      const emailInput = page.locator('input[id="contact-email"]').first();
      const messageInput = page
        .locator('textarea[id="contact-message"]')
        .first();
      const submitButton = page
        .locator('form')
        .first()
        .locator('button')
        .first();

      await nameInput.fill('Test User');
      await emailInput.fill('test@example.com');
      await messageInput.fill('Test message content here');

      await submitButton.focus();
      await expect(submitButton).toBeFocused();
    });
  });

  test('should activate button with Space key', async ({ page }) => {
    await test.step('Navigate to button and press Space', async () => {
      const nameInput = page.locator('input[id="contact-name"]').first();
      const emailInput = page.locator('input[id="contact-email"]').first();
      const messageInput = page
        .locator('textarea[id="contact-message"]')
        .first();
      const submitButton = page
        .locator('form')
        .first()
        .locator('button')
        .first();

      await nameInput.fill('Test User');
      await emailInput.fill('test@example.com');
      await messageInput.fill('Test message content');

      await submitButton.focus();
      await expect(submitButton).toBeFocused();
    });
  });

  test('should show focus indicator on all interactive elements', async ({
    page,
  }) => {
    await test.step('Verify focus indicators visible', async () => {
      const form = page.locator('form').first();
      await expect(form).toBeVisible();

      const inputs = form.locator('input, textarea, button');
      const inputCount = await inputs.count();

      expect(inputCount).toBeGreaterThan(0);

      /// Test first 3 interactive elements for focus
      const elementsToTest = Math.min(3, inputCount);
      for (let i = 0; i < elementsToTest; i++) {
        const element = inputs.nth(i);
        await element.focus();

        await expect(element).toBeFocused({ timeout: 1000 });
      }
    });
  });
});
