import { expect, test } from '@playwright/test';

/**
 * Headless createErrorMessageSignal - E2E Tests
 * Route: /headless/error-message-signal
 *
 * Smoke coverage for the createErrorMessageSignal primitive:
 *  - structural rendering of all three includeWarnings modes
 *  - aria-describedby chain wired via ResolvedFieldError.id
 *  - reactive registry swap re-resolves messages without further input
 */
test.describe('Headless - createErrorMessageSignal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/headless/error-message-signal');
    await expect(page.getByTestId('password-input')).toBeVisible();
  });

  test('should render all three includeWarnings sections', async ({ page }) => {
    await expect(page.getByTestId('section-blocking')).toBeVisible();
    await expect(page.getByTestId('section-all')).toBeVisible();
    await expect(page.getByTestId('section-warnings')).toBeVisible();
    await expect(page.getByTestId('toggle-registry')).toBeVisible();
  });

  test.describe('Blocking errors + aria-describedby wiring', () => {
    test('should expose required error id via aria-describedby after blur', async ({
      page,
    }) => {
      const input = page.getByTestId('password-input');

      await test.step('Touch and leave empty', async () => {
        await input.focus();
        await input.blur();
      });

      await test.step('Required entry rendered in blocking section', async () => {
        const requiredError = page.getByTestId('blocking-error-required');
        await expect(requiredError).toBeVisible();
        await expect(requiredError).toContainText(/required/iu);
      });

      await test.step('aria-describedby on input resolves to the rendered error', async () => {
        const expectedErrorId = 'password-error-required';
        const describedBy = input;
        await expect(describedBy).toHaveAttribute(
          'aria-describedby',
          expectedErrorId,
        );
        const describedByError = page.locator(`#${expectedErrorId}`);
        await expect(describedByError).toHaveCount(1);
        await expect(describedByError).toHaveAttribute(
          'data-testid',
          'blocking-error-required',
        );
        await expect(input).toHaveAttribute('aria-invalid', 'true');
      });
    });

    test('should clear aria-describedby once the field becomes valid', async ({
      page,
    }) => {
      const input = page.getByTestId('password-input');

      await input.focus();
      await input.blur();
      await expect(page.getByTestId('blocking-error-required')).toBeVisible();

      await input.fill('Password!2345');
      await input.blur();

      await expect(page.getByTestId('blocking-error-required')).toBeHidden();
      await expect(input).not.toHaveAttribute('aria-invalid', 'true');
      const describedBy = await input.getAttribute('aria-describedby');
      expect(describedBy).toBeNull();
    });
  });

  test.describe('includeWarnings modes', () => {
    test('should partition entries across blocking, all, and warnings sections', async ({
      page,
    }) => {
      const input = page.getByTestId('password-input');

      // 5 chars, no symbols → 1 blocking (minLength) + 2 warnings (weak-password, no-special-chars)
      await input.fill('abcde');
      await input.blur();

      await test.step('Blocking section shows only the blocking error', async () => {
        const blocking = page.getByTestId('section-blocking');
        await expect(
          blocking.getByTestId('blocking-error-minLength'),
        ).toBeVisible();
        await expect(
          blocking.locator('[data-testid^="blocking-error-warn:"]'),
        ).toHaveCount(0);
      });

      await test.step('All section shows blocking + warnings in order', async () => {
        const all = page.getByTestId('section-all');
        await expect(all.getByTestId('all-error-minLength')).toBeVisible();
        await expect(
          all.getByTestId('all-error-warn:weak-password'),
        ).toBeVisible();
        await expect(
          all.getByTestId('all-error-warn:no-special-chars'),
        ).toBeVisible();
      });

      await test.step('Warnings-only section shows only warnings', async () => {
        const warnings = page.getByTestId('section-warnings');
        await expect(
          warnings.getByTestId('warning-warn:weak-password'),
        ).toBeVisible();
        await expect(
          warnings.getByTestId('warning-warn:no-special-chars'),
        ).toBeVisible();
        await expect(
          warnings.locator('[data-testid="warning-minLength"]'),
        ).toHaveCount(0);
      });
    });
  });

  test.describe('Reactive registry swap', () => {
    test('should re-resolve messages when the registry signal changes', async ({
      page,
    }) => {
      const input = page.getByTestId('password-input');

      await input.fill('abcde');
      await input.blur();

      const blockingMinLength = page.getByTestId('blocking-error-minLength');

      await test.step('Verbose registry message rendered', async () => {
        await expect(blockingMinLength).toContainText(
          'Password must be at least 8 characters long',
        );
      });

      await test.step('Toggle to terse registry — message swaps without further input', async () => {
        await page.getByTestId('toggle-registry').click();
        await expect(blockingMinLength).toContainText('Min 8 chars');
        await expect(blockingMinLength).not.toContainText(
          'Password must be at least 8 characters long',
        );
      });

      await test.step('aria-describedby still resolves to the (re-resolved) error', async () => {
        const expectedErrorId = 'password-error-minLength';
        const describedBy = input;
        await expect(describedBy).toHaveAttribute(
          'aria-describedby',
          expectedErrorId,
        );
        const describedByError = page.locator(`#${expectedErrorId}`);
        await expect(describedByError).toHaveCount(1);
        await expect(describedByError).toHaveAttribute(
          'data-testid',
          'blocking-error-minLength',
        );
      });
    });
  });
});
