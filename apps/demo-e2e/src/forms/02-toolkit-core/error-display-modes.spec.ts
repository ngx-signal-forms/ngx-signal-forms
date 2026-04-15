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

      // After submit, the submission-error alert appears via computed signal.
      // Playwright's auto-retrying assertion handles change detection timing
      // directly - no blur nudge needed.
      await expect(formPage.page.locator('#submission-error')).toBeVisible();
    });
  });

  test('"on-submit" toggles error visibility synchronously on submit', async () => {
    await test.step('Errors stay hidden until submit, then flip in one tick', async () => {
      await formPage.selectErrorMode('onSubmit');

      // Touch name + email with invalid values. On-submit must keep errors
      // suppressed and helpers must report "no visible errors".
      await formPage.nameInput.focus();
      await formPage.nameInput.blur();
      await formPage.emailInput.fill('not-an-email');
      await formPage.emailInput.blur();

      const helpers = formPage.page.locator('ngx-error-display-helpers');
      await expect(helpers).toContainText('Name errors visible: no');
      await expect(helpers).toContainText('Email errors visible: no');
      await expect(formPage.errorAlerts).toHaveCount(0);

      await formPage.submit();

      // Single-tick flip: helpers report visible errors AND the submission
      // alert appears without any extra focus/blur nudge.
      await expect(helpers).toContainText('Name errors visible: yes');
      await expect(helpers).toContainText('Email errors visible: yes');
      await expect(formPage.page.locator('#submission-error')).toBeVisible();
      await expect(formPage.nameInput).toHaveAttribute('aria-invalid', 'true');
      await expect(formPage.emailInput).toHaveAttribute('aria-invalid', 'true');
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
});
