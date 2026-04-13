import { DEMO_PATHS } from '@ngx-signal-forms/demo-shared';
import { Locator, Page } from '@playwright/test';
import { ErrorStrategyFormPage } from './base-form.page';

/**
 * Page Object for "Advanced - Submission Patterns" demo
 * Route: /advanced-scenarios/submission-patterns
 *
 * Demonstrates async form submission patterns
 */
export class SubmissionPatternsPage extends ErrorStrategyFormPage {
  readonly submitButton: Locator;
  readonly stateIndicator: Locator;

  constructor(page: Page) {
    super(page);
    this.submitButton = this.getSubmitButton(/Create Account/i);
    this.stateIndicator = this.page.locator('text=Submission State').first();
  }

  async goto(): Promise<void> {
    await this.page.goto(DEMO_PATHS.submissionPatterns);
    await this.waitForReady();
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  /** The styled error summary box (only present in DOM when visible) */
  get errorSummary(): Locator {
    return this.page.locator('ngx-form-field-error-summary [role="alert"]');
  }

  /** Individual clickable entries inside the error summary */
  get errorSummaryEntries(): Locator {
    return this.page.locator('.ngx-form-field-error-summary__link');
  }
}
