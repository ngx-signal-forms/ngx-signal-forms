import { DEMO_PATHS } from '@ngx-signal-forms/demo-shared';
import { Locator, Page } from '@playwright/test';
import { BaseFormPage } from './base-form.page';
/**
 * Page Object for "Form Field Wrapper" demo
 * Route: /form-field-wrapper/basic-usage
 */
export class FormFieldWrapperPage extends BaseFormPage {
  readonly nameInput: Locator;
  readonly formFieldComponents: Locator;

  constructor(page: Page) {
    super(page);
    this.nameInput = this.getInputById('name');
    this.formFieldComponents = this.page.locator(
      'ngx-signal-form-field-wrapper',
    );
  }

  async goto(): Promise<void> {
    await this.page.goto(DEMO_PATHS.basicUsage);
    await this.waitForReady();
  }

  /**
   * Navigate to complex forms variant
   */
  async gotoComplexForms(): Promise<void> {
    await this.page.goto(DEMO_PATHS.complexForms);
    await this.waitForReady();
  }

  /**
   * Get all form inputs (input, textarea, select)
   */
  get allInputs(): Locator {
    return this.form.locator('input, textarea, select');
  }
}
