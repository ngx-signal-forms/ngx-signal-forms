import { Locator, Page } from '@playwright/test';
import { BaseFormPage } from './base-form.page';

/**
 * Page Object for "Advanced - Submission Patterns" demo
 * Route: /advanced/submission-patterns
 *
 * Demonstrates async form submission patterns
 */
export class SubmissionPatternsPage extends BaseFormPage {
  readonly submitButton: Locator;
  readonly stateIndicator: Locator;

  constructor(page: Page) {
    super(page);
    this.submitButton = this.getSubmitButton(/Create Account/i);
    this.stateIndicator = this.page.locator('text=Submission State').first();
  }

  async goto(): Promise<void> {
    await this.page.goto('/advanced/submission-patterns');
    await this.waitForReady();
  }

  /**
   * Submit the form
   */
  async submit(): Promise<void> {
    await this.submitButton.click();
  }
}
