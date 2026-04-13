import { expect, test } from '@playwright/test';
import { verifyNoErrorsOnInitialLoad } from '../../fixtures/form-validation.fixture';
import { ErrorDisplayModesPage } from '../../page-objects/error-display-modes.page';

/**
 * Tests for "Error Display Modes" demo
 * Route: /toolkit-core/error-display-modes
 */
test.describe('Error Display Modes', () => {
  let formPage: ErrorDisplayModesPage;

  test.beforeEach(async ({ page }) => {
    formPage = new ErrorDisplayModesPage(page);
    await formPage.goto();
  });

  test('should NOT show errors on initial page load', async ({ page }) => {
    await verifyNoErrorsOnInitialLoad(page);
    await expect(formPage.form).toBeVisible();
  });

  test('should allow switching between all 3 modes', async () => {
    await test.step('Switch through all error display modes', async () => {
      const modes = ['immediate', 'onTouch', 'onSubmit'] as const;

      for (const mode of modes) {
        await formPage.selectErrorMode(mode);
        await expect(formPage.errorModeRadios[mode]).toBeChecked();
      }
    });
  });

  test('"on-submit" mode should hide errors until submit', async () => {
    await test.step('Interact with form without errors appearing', async () => {
      // Reload page to ensure clean state before switching mode
      await formPage.page.reload();
      await formPage.waitForReady();
      await formPage.selectErrorMode('onSubmit');
      await expect(formPage.errorModeRadios.onSubmit).toBeChecked();

      await expect(formPage.errorAlerts).toHaveCount(0);

      const inputs = formPage.textAndEmailInputs;
      const count = await inputs.count();

      for (let i = 0; i < count; i++) {
        const input = inputs.nth(i);
        await input.focus();
        await input.blur();
      }

      // With on-submit strategy, errors should still be hidden after blur
      await expect(formPage.errorAlerts).toHaveCount(0);

      await formPage.submit();

      // Nudge Angular change detection by blurring a field after submit,
      // which helps environments where aria-invalid updates land on blur.
      await formPage.nameInput.focus();
      await formPage.nameInput.blur();

      /// After submit, verify errors are displayed via accessible means
      /// Check that at least one error feedback mechanism is present
      await expect(async () => {
        const hasErrorAlerts = (await formPage.errorAlerts.count()) > 0;
        const nameHasAriaInvalid =
          (await formPage.nameInput.getAttribute('aria-invalid')) === 'true';
        const emailHasAriaInvalid =
          (await formPage.emailInput.getAttribute('aria-invalid')) === 'true';
        const hasSubmissionError = await formPage.page
          .locator('#submission-error')
          .isVisible();

        const hasAccessibleErrors =
          hasErrorAlerts ||
          nameHasAriaInvalid ||
          emailHasAriaInvalid ||
          hasSubmissionError;

        expect(hasAccessibleErrors).toBe(true);
      }).toPass({ timeout: 5000 });
    });
  });

  test('valid data should not show errors in any mode', async () => {
    await test.step('Fill with valid data across all modes', async () => {
      const modes = ['immediate', 'onTouch', 'onSubmit'] as const;

      for (const mode of modes) {
        await formPage.selectErrorMode(mode);

        await formPage.fillValidData();

        // Move focus away from the last filled field (rating) to trigger
        // blur events and Angular change detection, flushing the computed
        // signal chain (model → validators → errors → ariaInvalid → DOM).
        await formPage.page.keyboard.press('Tab');

        await expect(formPage.nameInput).toHaveAttribute(
          'aria-invalid',
          'false',
        );
        await expect(formPage.emailInput).toHaveAttribute(
          'aria-invalid',
          'false',
        );

        /// Clear form for next iteration by reloading page
        await formPage.page.reload();
        await formPage.waitForReady();
      }
    });
  });

  test.describe('Snapshot Regression', () => {
    test('should match aria structure in default mode', async () => {
      await expect(formPage.errorModeRadios.onTouch).toBeChecked();
      await expect(formPage.form).toMatchAriaSnapshot();
    });

    test('should capture visual baseline in default mode', async () => {
      await expect(formPage.errorModeRadios.onTouch).toBeChecked();

      await expect(formPage.form).toHaveScreenshot(
        'error-display-modes-default.png',
        {
          animations: 'disabled',
          caret: 'hide',
        },
      );
    });

    test('should capture visual baseline after submit in on-submit mode', async () => {
      await formPage.selectErrorMode('onSubmit');
      await formPage.submit();

      await formPage.nameInput.focus();
      await formPage.nameInput.blur();

      await expect(formPage.page.locator('#submission-error')).toBeVisible();

      await expect(formPage.form).toHaveScreenshot(
        'error-display-modes-on-submit.png',
        {
          animations: 'disabled',
          caret: 'hide',
        },
      );
    });
  });
});
