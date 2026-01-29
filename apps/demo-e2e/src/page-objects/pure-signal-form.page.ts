import type { Locator } from '@playwright/test';
import { BaseFormPage } from './base-form.page';
/**
 * Page Object for Pure Signal Form (Baseline)
 * Route: /signal-forms-only/pure-signal-form
 *
 * Tests Angular Signal Forms without toolkit enhancements.
 * This baseline demonstrates what developers must implement manually:
 * - ARIA attributes
 * - Touch state tracking
 * - Error visibility logic
 */
export class PureSignalFormPage extends BaseFormPage {
  async goto(): Promise<void> {
    await this.page.goto(`/signal-forms-only/pure-signal-form`);
    await this.waitForReady();
  }

  // Field locators
  get emailInput(): Locator {
    return this.getInputById('pure-email');
  }

  get passwordInput(): Locator {
    return this.getInputById('pure-password');
  }

  get confirmPasswordInput(): Locator {
    return this.getInputById('pure-confirm-password');
  }

  // Error message locators
  get emailError(): Locator {
    return this.page.locator('#pure-email-error');
  }

  get passwordError(): Locator {
    return this.page.locator('#pure-password-error');
  }

  get confirmPasswordError(): Locator {
    return this.page.locator('#pure-confirm-password-error');
  }

  // Submit button
  get submitButton(): Locator {
    return this.getSubmitButton(/Sign Up/i);
  }

  // Helper methods
  async fillEmail(email: string): Promise<void> {
    await this.emailInput.fill(email);
  }

  async fillPassword(password: string): Promise<void> {
    await this.passwordInput.fill(password);
  }

  async fillConfirmPassword(password: string): Promise<void> {
    await this.confirmPasswordInput.fill(password);
  }

  async fillValidData(): Promise<void> {
    await this.fillEmail('test@example.com');
    await this.fillPassword('password123');
    await this.fillConfirmPassword('password123');
  }

  async submitForm(): Promise<void> {
    await this.submitButton.click();
  }
}
