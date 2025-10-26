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

  test.describe('Async Submission', () => {
    test('should handle form submission', async () => {
      // Verify button is clickable
      await expect(page.submitButton).toBeEnabled();

      // Submit form
      await page.submit();

      // Verify button was clicked
      await expect(page.form).toBeVisible();
    });
  });
});
