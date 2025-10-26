import { Locator, Page } from '@playwright/test';
import { ErrorStrategyFormPage } from './base-form.page';

/**
 * Page Object for "Error Display Modes" demo
 * Route: /toolkit-core/error-display-modes
 */
export class ErrorDisplayModesPage extends ErrorStrategyFormPage {
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly productSelect: Locator;
  readonly ratingInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    super(page);
    this.nameInput = this.getInputById('name');
    this.emailInput = this.getInputById('email');
    this.productSelect = this.getSelectById('productUsed');
    this.ratingInput = this.getInputById('overallRating');
    this.submitButton = this.getSubmitButton(/Submit Feedback/i);
  }

  async goto(): Promise<void> {
    await this.page.goto('/toolkit-core/error-display-modes');
    await this.waitForReady();
  }

  /**
   * Fill the form with valid data
   */
  async fillValidData(data?: {
    name?: string;
    email?: string;
    product?: string;
    rating?: string;
  }): Promise<void> {
    const defaults = {
      name: 'John Doe',
      email: 'test@example.com',
      product: 'Web App',
      rating: '5',
    };

    const formData = { ...defaults, ...data };

    await this.nameInput.fill(formData.name);
    await this.emailInput.fill(formData.email);
    await this.productSelect.selectOption(formData.product);
    await this.ratingInput.fill(formData.rating);
  }

  /**
   * Submit the form
   */
  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Get all text and email inputs for bulk operations
   */
  get textAndEmailInputs(): Locator {
    return this.page.locator(
      'form input[type="text"], form input[type="email"]',
    );
  }
}
