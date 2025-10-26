import { Locator, Page } from '@playwright/test';
import { BaseFormPage } from './base-form.page';

/**
 * Page Object for "Field States" demo
 * Route: /toolkit-core/field-states
 */
export class FieldStatesPage extends BaseFormPage {
  readonly emailInput: Locator;
  readonly debuggerComponent: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = this.getInputById('email');
    this.debuggerComponent = this.page.locator('ngx-signal-form-debugger');
  }

  async goto(): Promise<void> {
    await this.page.goto('/toolkit-core/field-states');
    await this.waitForReady();
  }

  /**
   * Fill email field
   */
  async fillEmail(email: string): Promise<void> {
    await this.emailInput.fill(email);
  }

  /**
   * Interact with email field (focus, fill, blur)
   */
  async interactWithEmail(email = 'test@example.com'): Promise<void> {
    await this.emailInput.focus();
    await this.emailInput.fill(email);
    await this.emailInput.blur();
  }
}
