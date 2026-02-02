import { Locator, Page } from '@playwright/test';
import { BaseFormPage } from './base-form.page';

/**
 * Page Object for "Form Field Wrapper - Outline Form Field" demo
 * Route: /form-field-wrapper/outline-form-field
 */
export class OutlineFormFieldPage extends BaseFormPage {
  readonly route = '/form-field-wrapper/outline-form-field';

  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.page.goto(this.getFullUrl(this.route));
    await this.waitForReady();
  }

  get pleegdatumInput(): Locator {
    return this.page.getByLabel('Pleegdatum', { exact: true });
  }
}
