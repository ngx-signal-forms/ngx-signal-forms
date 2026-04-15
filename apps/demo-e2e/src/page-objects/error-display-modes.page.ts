import { DEMO_PATHS } from '@ngx-signal-forms/demo-shared';
import { expect, Locator, Page } from '@playwright/test';
import { ErrorStrategyFormPage } from './base-form.page';
/**
 * Page Object for "Error Display Modes" demo
 * Route: /toolkit-core/error-display-modes
 */
export class ErrorDisplayModesPage extends ErrorStrategyFormPage {
  #strategyValue(
    mode: 'immediate' | 'onTouch' | 'onSubmit',
  ): 'immediate' | 'on-touch' | 'on-submit' {
    switch (mode) {
      case 'immediate':
        return 'immediate';
      case 'onSubmit':
        return 'on-submit';
      case 'onTouch':
        return 'on-touch';
      default:
        mode satisfies never;
        return 'on-touch';
    }
  }

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
    await this.page.goto(DEMO_PATHS.errorDisplayModes);
    await this.waitForReady();
  }

  override async selectErrorMode(
    mode: 'immediate' | 'onTouch' | 'onSubmit',
  ): Promise<void> {
    await super.selectErrorMode(mode);
    await expect(this.page.locator('ngx-error-display-helpers')).toContainText(
      `Strategy: ${this.#strategyValue(mode)}`,
    );
    await expect(this.nameInput).toHaveValue('');
    await expect(this.emailInput).toHaveValue('');
    await expect(this.productSelect).toHaveValue('');
    await expect(this.ratingInput).toHaveValue('0');
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
    await expect(this.nameInput).toHaveValue(formData.name);
    await this.emailInput.fill(formData.email);
    await expect(this.emailInput).toHaveValue(formData.email);
    await this.productSelect.selectOption(formData.product);
    await expect(this.productSelect).toHaveValue(formData.product);
    await this.ratingInput.fill(formData.rating);
    await expect(this.ratingInput).toHaveValue(formData.rating);
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
