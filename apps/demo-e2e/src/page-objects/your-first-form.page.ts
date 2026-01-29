import { Locator, Page } from '@playwright/test';
import { ErrorStrategyFormPage } from './base-form.page';
/**
 * Page Object for "Your First Form with Toolkit" demo
 * Route: /getting-started/your-first-form
 */
export class YourFirstFormPage extends ErrorStrategyFormPage {
  /// Form field locators
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly messageInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    super(page);
    this.nameInput = this.getInputById('contact-name');
    this.emailInput = this.getInputById('contact-email');
    this.messageInput = this.getTextareaById('contact-message');
    this.submitButton = this.getSubmitButton(/Send Message/i);
  }

  async goto(): Promise<void> {
    await this.page.goto(`/getting-started/your-first-form`);
    await this.waitForReady();
  }

  /**
   * Fill the form with valid data
   */
  async fillValidData(data?: {
    name?: string;
    email?: string;
    message?: string;
  }): Promise<void> {
    const defaults = {
      name: 'John Doe',
      email: 'john@example.com',
      message: 'Test message',
    };

    const formData = { ...defaults, ...data };

    await this.nameInput.fill(formData.name);
    await this.emailInput.fill(formData.email);
    await this.messageInput.fill(formData.message);
  }

  /**
   * Submit the form
   */
  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Get field by name (for generic access)
   */
  getField(fieldName: 'name' | 'email' | 'message'): Locator {
    switch (fieldName) {
      case 'name':
        return this.nameInput;
      case 'email':
        return this.emailInput;
      case 'message':
        return this.messageInput;
    }
  }
}
