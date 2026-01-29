import { Locator, Page } from '@playwright/test';
import { ErrorStrategyFormPage } from './base-form.page';
/**
 * Page Object for "Warning Support" demo
 * Route: /toolkit-core/warning-support
 *
 * Demonstrates non-blocking warnings vs. blocking errors
 */
export class WarningSupportPage extends ErrorStrategyFormPage {
  readonly usernameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    super(page);
    this.usernameInput = this.getInputById('username');
    this.emailInput = this.getInputById('email');
    this.passwordInput = this.getInputById('password');
    this.submitButton = this.getSubmitButton(/Create Account/i);
  }

  async goto(): Promise<void> {
    await this.page.goto(`/toolkit-core/warning-support`);
    await this.waitForReady();
  }

  /**
   * Fill the form with valid data
   */
  async fillValidData(data?: {
    username?: string;
    email?: string;
    password?: string;
  }): Promise<void> {
    const defaults = {
      username: 'testuser123', // Long enough to avoid warnings
      email: 'test@example.com',
      password: 'StrongPassword123!', // Strong password - no warnings
    };

    const formData = { ...defaults, ...data };

    await this.usernameInput.fill(formData.username);
    await this.emailInput.fill(formData.email);
    await this.passwordInput.fill(formData.password);
  }

  /**
   * Fill the form with data that triggers warnings but is still valid.
   * - Short username (3-5 chars): triggers warning
   * - Weak password (8-11 chars): triggers warning
   */
  async fillWithWarnings(): Promise<void> {
    await this.usernameInput.fill('user'); // 4 chars - triggers warning
    await this.emailInput.fill('test@example.com');
    await this.passwordInput.fill('Short123'); // 8 chars - triggers warning
  }

  /**
   * Fill the form with weak password to trigger warning.
   * @deprecated Use fillWithWarnings() instead for more comprehensive warning testing
   */
  async fillWithWeakPassword(): Promise<void> {
    await this.usernameInput.fill('testuser');
    await this.emailInput.fill('test@example.com');
    await this.passwordInput.fill('weak123!'); // Short but valid
  }

  /**
   * Submit the form
   */
  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Get success message element
   */
  get successMessage(): Locator {
    return this.page
      .locator('[role="status"]')
      .filter({ hasText: /created successfully/i });
  }
}
