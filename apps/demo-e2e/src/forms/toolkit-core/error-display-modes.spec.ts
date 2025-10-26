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
  });

  test('should allow switching between all 4 modes', async () => {
    await test.step('Switch through all error display modes', async () => {
      const modes = ['immediate', 'onTouch', 'onSubmit', 'manual'] as const;

      for (const mode of modes) {
        await formPage.selectErrorMode(mode);
        await expect(formPage.errorModeRadios[mode]).toBeChecked();
      }
    });
  });

  test('"on-submit" mode should hide errors until submit', async () => {
    await test.step('Interact with form without errors appearing', async () => {
      await formPage.selectErrorMode('onSubmit');

      const inputs = formPage.textAndEmailInputs;
      const count = await inputs.count();

      for (let i = 0; i < count; i++) {
        const input = inputs.nth(i);
        await input.focus();
        await input.blur();
      }

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
        await formPage.emailInput.blur();

        /// Valid fields should not have aria-invalid="true"
        await expect(formPage.nameInput).not.toHaveAttribute(
          'aria-invalid',
          'true',
        );
        await expect(formPage.emailInput).not.toHaveAttribute(
          'aria-invalid',
          'true',
        );

        /// Clear form for next iteration by reloading page
        await formPage.page.reload();
        await formPage.waitForReady();
      }
    });
  });
});
