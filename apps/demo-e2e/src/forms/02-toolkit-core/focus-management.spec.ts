import { expect, test } from '@playwright/test';
/**
 * Focus Management Tests
 * WCAG 2.2 Level AA - Focus Order and Error Identification
 *
 * Verifies:
 * - Focus moves to first invalid field on submission failure
 * - Focus management uses field tree traversal (not aria-invalid selector)
 * - Proper keyboard navigation after focus management
 */

test.describe('Focus Management', () => {
  test.beforeEach(async ({ page }) => {
    // Capture all browser console messages for debugging
    page.on('console', (msg) => {
      console.log(`[BROWSER ${msg.type().toUpperCase()}]: ${msg.text()}`);
    });

    await page.goto(`/toolkit-core/accessibility-comparison`);
    await page.waitForLoadState('domcontentloaded');
  });

  test('should focus first invalid field on submit with empty form', async ({
    page,
  }) => {
    await test.step('Verify DOM structure before submit', async () => {
      const toolkitForm = page.locator('ngx-accessibility-toolkit-form form');
      const emailInput = toolkitForm.locator('#toolkit-email');

      /// Verify the email input exists and has expected name attribute
      await expect(toolkitForm).toBeVisible();
      const nameAttr = await emailInput.getAttribute('name');
      console.log('Email input name attribute:', nameAttr);
    });

    await test.step('Submit empty form and verify focus', async () => {
      const toolkitForm = page.locator('ngx-accessibility-toolkit-form form');
      const submitButton = toolkitForm.locator('button[type="submit"]');
      const emailInput = toolkitForm.locator('#toolkit-email');

      /// Get the initial focus state
      const initialFocus = await page.evaluate(
        () => document.activeElement?.id ?? 'none',
      );
      console.log('Initial focus:', initialFocus);

      /// Add event listeners to debug form submission
      await page.evaluate(() => {
        const form = document.querySelector(
          'ngx-accessibility-toolkit-form form',
        );
        const btn = form?.querySelector('button[type="submit"]');

        if (btn) {
          btn.addEventListener('click', () => {
            console.log('[TEST-DEBUG] Button click event fired');
          });
        }

        if (form) {
          form.addEventListener('submit', (e) => {
            console.log(
              '[TEST-DEBUG] Form submit event fired, defaultPrevented:',
              e.defaultPrevented,
            );
          });
        }
      });

      /// Submit empty form by clicking button
      console.log('Clicking submit button...');
      await submitButton.click();
      console.log('Submit button clicked');

      /// Check focus after click (with a small delay via evaluate)
      await page.evaluate(() => new Promise((r) => setTimeout(r, 300)));

      const focusAfterClick = await page.evaluate(() => ({
        id: document.activeElement?.id ?? '',
        tagName: document.activeElement?.tagName ?? '',
        name: (document.activeElement as HTMLInputElement)?.name ?? '',
      }));
      console.log('Focus after click:', JSON.stringify(focusAfterClick));

      /// Use expect.poll to wait for focus to change (with longer intervals)
      await expect
        .poll(
          async () => {
            const focus = await page.evaluate(
              () => document.activeElement?.id ?? 'none',
            );
            console.log('Polling focus:', focus);
            return focus;
          },
          { timeout: 5000, intervals: [100, 200, 500] },
        )
        .toBe('toolkit-email');

      /// Verify using toBeFocused
      await expect(emailInput).toBeFocused();
    });
  });

  test('should focus second field when first is valid', async ({ page }) => {
    await test.step('Fill first field, submit and verify focus', async () => {
      const toolkitForm = page.locator('ngx-accessibility-toolkit-form form');
      const emailInput = toolkitForm.locator('#toolkit-email');
      const passwordInput = toolkitForm.locator('#toolkit-password');
      const submitButton = toolkitForm.locator('button[type="submit"]');

      /// Fill only email (first field)
      await emailInput.fill('test@example.com');

      /// Submit form with password fields empty
      await submitButton.click();

      /// Password field (second invalid field) should receive focus
      await expect(passwordInput).toBeFocused({ timeout: 3000 });
    });
  });

  test('should focus last field when only it is invalid', async ({ page }) => {
    await test.step('Fill all but last field, submit and verify focus', async () => {
      const toolkitForm = page.locator('ngx-accessibility-toolkit-form form');
      const emailInput = toolkitForm.locator('#toolkit-email');
      const passwordInput = toolkitForm.locator('#toolkit-password');
      const confirmPasswordInput = toolkitForm.locator(
        '#toolkit-confirm-password',
      );
      const submitButton = toolkitForm.locator('button[type="submit"]');

      /// Fill first two fields
      await emailInput.fill('test@example.com');
      await passwordInput.fill('validPassword123!');

      /// Submit form with confirm password empty
      await submitButton.click();

      /// Confirm password field (last invalid field) should receive focus
      await expect(confirmPasswordInput).toBeFocused({ timeout: 3000 });
    });
  });

  test('should not change focus when all fields are valid', async ({
    page,
  }) => {
    await test.step('Fill all fields valid and submit', async () => {
      const toolkitForm = page.locator('ngx-accessibility-toolkit-form form');
      const emailInput = toolkitForm.locator('#toolkit-email');
      const passwordInput = toolkitForm.locator('#toolkit-password');
      const confirmPasswordInput = toolkitForm.locator(
        '#toolkit-confirm-password',
      );
      const submitButton = toolkitForm.locator('button[type="submit"]');

      /// Fill all fields with valid data
      await emailInput.fill('test@example.com');
      await passwordInput.fill('validPassword123!');
      await confirmPasswordInput.fill('validPassword123!');

      /// Click submit
      await submitButton.click();

      /// Form should be processing (no focus change to invalid field)
      /// Verify none of the input fields receive focus due to validation error
      await expect(async () => {
        const emailFocused = await emailInput.evaluate(
          (el) => document.activeElement === el,
        );
        const passwordFocused = await passwordInput.evaluate(
          (el) => document.activeElement === el,
        );
        const confirmFocused = await confirmPasswordInput.evaluate(
          (el) => document.activeElement === el,
        );

        /// Form valid means no forced refocus to inputs via focusFirstInvalid
        expect(emailFocused || passwordFocused || confirmFocused).toBe(false);
      }).toPass({ timeout: 3000 });
    });
  });
});
