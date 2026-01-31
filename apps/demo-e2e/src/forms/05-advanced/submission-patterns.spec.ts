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
      // Submit button is disabled until the form is valid
      await expect(page.submitButton).toBeDisabled();

      // Trigger validation by touching a field
      const usernameInput = page.page.getByLabel(/username/i);
      await usernameInput.focus();
      await usernameInput.blur();

      // After blur, error message should be visible (on-touch strategy)
      const errorMessage = page.page.getByText('Username is required');
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
});
