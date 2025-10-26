import { Locator, Page } from '@playwright/test';
import { BaseFormPage } from './base-form.page';

/**
 * Page Object for "Form Field Wrapper - Complex Forms" demo
 * Route: /form-field-wrapper/complex-forms
 *
 * Demonstrates complex form structures with nested fields
 */
export class FormFieldWrapperComplexPage extends BaseFormPage {
  readonly submitButton: Locator;

  constructor(page: Page) {
    super(page);
    this.submitButton = this.getSubmitButton(/Submit/i);
  }

  async goto(): Promise<void> {
    await this.page.goto('/form-field-wrapper/complex-forms');
    await this.waitForReady();
  }

  /**
   * Get all form field wrapper components
   */
  get formFields(): Locator {
    return this.page.locator('ngx-signal-form-field');
  }

  /**
   * Get all inputs, textareas, and selects within the form
   */
  get allFormControls(): Locator {
    return this.form.locator('input, textarea, select');
  }

  /**
   * Submit the form
   */
  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Count visible form field wrappers
   */
  async countFormFields(): Promise<number> {
    return await this.formFields.count();
  }
}
