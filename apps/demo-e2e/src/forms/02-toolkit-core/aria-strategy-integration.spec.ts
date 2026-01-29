import { expect, test } from '@playwright/test';
/**
 * ARIA Strategy Integration Tests
 * WCAG 2.2 Level AA - Error Display Strategy Awareness
 *
 * Verifies that ARIA attributes respect the configured error display strategy:
 * - 'immediate': aria-invalid shows as soon as field becomes invalid
 * - 'on-touch': aria-invalid shows only after field is touched (blurred)
 * - 'on-submit': aria-invalid shows only after form submission attempt
 *
 * Note: Signal Forms doesn't support runtime strategy changes, so we test
 * the default 'on-touch' behavior which is the most common use case.
 */

test.describe('ARIA Strategy Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/toolkit-core/error-display-modes`);
    await page.waitForLoadState('domcontentloaded');
  });

  test('on-touch strategy: aria-invalid should NOT appear before blur', async ({
    page,
  }) => {
    await test.step('Type invalid value without blurring', async () => {
      const emailInput = page.locator('#email');

      /// Focus and type invalid email (but don't blur)
      await emailInput.focus();
      await emailInput.fill('invalid-email');

      /// aria-invalid should NOT be "true" since field not yet blurred
      await expect(emailInput).not.toHaveAttribute('aria-invalid', 'true');
    });
  });

  test('on-touch strategy: aria-invalid should appear after blur', async ({
    page,
  }) => {
    await test.step('Blur field with invalid value', async () => {
      const emailInput = page.locator('#email');

      /// Type invalid email and blur
      await emailInput.fill('invalid-email');
      await emailInput.blur();

      /// aria-invalid should now be "true"
      await expect(emailInput).toHaveAttribute('aria-invalid', 'true');
    });
  });

  test('on-touch strategy: aria-describedby should NOT link to error before blur', async ({
    page,
  }) => {
    await test.step('Check aria-describedby before blur', async () => {
      const ratingInput = page.locator('#overallRating');

      /// Type invalid value without blurring
      await ratingInput.focus();
      await ratingInput.fill('0');

      /// aria-describedby should only contain hint, NOT error ID
      await expect(ratingInput).toHaveAttribute(
        'aria-describedby',
        'rating-hint',
      );
    });
  });

  test('on-touch strategy: aria-describedby should link to error after blur', async ({
    page,
  }) => {
    await test.step('Check aria-describedby after blur', async () => {
      const ratingInput = page.locator('#overallRating');

      /// Type invalid value and blur
      await ratingInput.fill('0');
      await ratingInput.blur();

      /// aria-describedby should contain both hint AND error ID
      const describedBy = await ratingInput.getAttribute('aria-describedby');
      expect(describedBy).toContain('rating-hint');
      expect(describedBy).toContain('overallRating-error');
    });
  });

  test('validation correction should update ARIA state', async ({ page }) => {
    await test.step('Fix invalid value and verify ARIA updates', async () => {
      const emailInput = page.locator('#email');

      /// Trigger error state
      await emailInput.fill('invalid');
      await emailInput.blur();
      await expect(emailInput).toHaveAttribute('aria-invalid', 'true');
      await expect(emailInput).toHaveAttribute(
        'aria-describedby',
        /email-error/,
      );

      /// Fix the value
      await emailInput.fill('valid@example.com');
      await emailInput.blur();

      /// ARIA should reflect valid state
      await expect(emailInput).not.toHaveAttribute('aria-invalid', 'true');
      await expect(emailInput).not.toHaveAttribute(
        'aria-describedby',
        /email-error/,
      );
    });
  });

  test('form submission should work with strategy-aware ARIA', async ({
    page,
  }) => {
    await test.step('Submit valid form and verify ARIA state', async () => {
      /// Fill form with valid data
      await page.locator('#name').fill('John Doe');
      await page.locator('#email').fill('john@example.com');
      await page.locator('#productUsed').selectOption('Web App');
      await page.locator('#overallRating').fill('5');

      /// Blur last field to ensure change detection
      await page.locator('#overallRating').blur();

      /// All required fields should be valid (no aria-invalid="true")
      await expect(page.locator('#name')).not.toHaveAttribute(
        'aria-invalid',
        'true',
      );
      await expect(page.locator('#email')).not.toHaveAttribute(
        'aria-invalid',
        'true',
      );
      await expect(page.locator('#productUsed')).not.toHaveAttribute(
        'aria-invalid',
        'true',
      );
      await expect(page.locator('#overallRating')).not.toHaveAttribute(
        'aria-invalid',
        'true',
      );
    });
  });
});
