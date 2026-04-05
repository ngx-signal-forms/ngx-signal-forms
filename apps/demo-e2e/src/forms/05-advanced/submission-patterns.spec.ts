import { expect, test } from '@playwright/test';
import { SubmissionPatternsPage } from '../../page-objects/submission-patterns.page';

test.describe('Advanced - Submission Patterns', () => {
  let page: SubmissionPatternsPage;

  test.beforeEach(async ({ page: playwrightPage }) => {
    page = new SubmissionPatternsPage(playwrightPage);
    await page.goto();
  });

  test.describe('Page Structure', () => {
    test('should display form', async () => {
      await expect(page.form).toBeVisible();
    });

    test('should display submission state indicator', async () => {
      await expect(page.stateIndicator).toBeVisible();
    });

    test('should have submit button', async () => {
      await expect(page.submitButton).toBeVisible();
    });
  });

  test.describe('Submission Failures', () => {
    test('should show validation errors on submit of empty form', async () => {
      // Trigger validation by trying to submit the empty form
      await page.submitButton.click();

      // After submit, error message should be visible
      const errorMessage = page.page
        .locator('[role="alert"]')
        .filter({ hasText: 'Username is required' })
        .first();
      await expect(errorMessage).toBeVisible();
    });
  });

  test.describe('Successful Submission', () => {
    test('should show success message on valid submission', async () => {
      // Fill form with valid data
      await page.fillField('username', 'valid_user');
      await page.fillField('password', 'password123');
      await page.fillField('confirmPassword', 'password123');

      // Submit
      await page.submit();

      // Should show "Submitting..." state then success
      // We can wait for success message
      const successMessage = page.page.locator('[role="status"]', {
        hasText: 'Registration Successful',
      });
      await expect(successMessage).toBeVisible({ timeout: 5000 }); // simulate delay
    });
  });

  test.describe('Server Error Simulation', () => {
    test('should show server error when simulated', async () => {
      // Fill form
      await page.fillField('username', 'taken_user');
      await page.fillField('password', 'password123');
      await page.fillField('confirmPassword', 'password123');

      // Check simulate server error checkbox
      // Label: "Simulate server error (for testing)"
      const checkbox = page.page.getByLabel('Simulate server error');
      await checkbox.check();

      // Submit
      await page.submit();

      // Should show server error alert
      const errorAlert = page.page
        .locator('[role="alert"]')
        .filter({ hasText: 'Submission Failed' });
      await expect(errorAlert).toBeVisible({ timeout: 5000 });
      await expect(errorAlert).toContainText('already taken');
    });
  });

  test.describe('Error Summary (GOV.UK Pattern)', () => {
    test('should NOT display error summary on initial page load', async () => {
      await expect(page.errorSummary).not.toBeVisible();
    });

    test('should display error summary after submitting empty form', async () => {
      await test.step('Submit empty form', async () => {
        await page.submit();
      });

      await test.step('Verify error summary is visible', async () => {
        await expect(page.errorSummary).toBeVisible();
      });
    });

    test('should display configured summary label', async () => {
      await page.submit();

      await expect(page.errorSummary).toContainText(
        'Please fix the following errors before submitting:',
      );
    });

    test('should list field errors as clickable entries', async () => {
      await page.submit();

      await expect(page.errorSummaryEntries).not.toHaveCount(0);

      // Each required field error should be present
      await expect(page.errorSummary).toContainText('Username is required');
      await expect(page.errorSummary).toContainText('Password is required');
      await expect(page.errorSummary).toContainText(
        'Please confirm your password',
      );
    });

    test('should focus the corresponding field when an entry is clicked', async () => {
      await test.step('Trigger errors', async () => {
        await page.submit();
        await expect(page.errorSummary).toBeVisible();
      });

      await test.step('Click username error entry', async () => {
        const usernameEntry = page.errorSummaryEntries.filter({
          hasText: 'Username is required',
        });
        await usernameEntry.click();
      });

      await test.step('Username input should be focused', async () => {
        await expect(page.page.locator('#username')).toBeFocused();
      });
    });

    test('should hide error summary once all errors are resolved', async () => {
      await test.step('Trigger errors via submit', async () => {
        await page.submit();
        await expect(page.errorSummary).toBeVisible();
      });

      await test.step('Fill in valid data', async () => {
        await page.fillField('username', 'valid_user');
        await page.fillField('password', 'password123');
        await page.fillField('confirmPassword', 'password123');
      });

      await test.step('Error summary should disappear', async () => {
        await expect(page.errorSummary).not.toBeVisible();
      });
    });

    test('should respect on-submit strategy — hidden until submit attempt', async () => {
      await test.step('Switch to on-submit strategy', async () => {
        await page.selectErrorMode('onSubmit');
      });

      await test.step('Blur fields without submitting', async () => {
        await page.page.locator('#username').focus();
        await page.page.locator('#username').blur();
        await page.page.locator('#password').focus();
        await page.page.locator('#password').blur();
      });

      await test.step('Error summary should still be hidden', async () => {
        await expect(page.errorSummary).not.toBeVisible();
      });

      await test.step('Submit to trigger errors', async () => {
        await page.submit();
      });

      await test.step('Error summary should now be visible', async () => {
        await expect(page.errorSummary).toBeVisible();
      });
    });

    test('should respect immediate strategy — visible as soon as field is touched', async () => {
      await test.step('Switch to immediate strategy', async () => {
        await page.selectErrorMode('immediate');
      });

      await test.step('Error summary visible immediately (no submit needed)', async () => {
        // With immediate strategy, errors show without any interaction required
        await expect(page.errorSummary).toBeVisible();
      });
    });
  });
});
