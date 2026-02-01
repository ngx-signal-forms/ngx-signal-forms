import type { Locator, Page } from '@playwright/test';
import { BaseFormPage } from './base-form.page';

/**
 * Page Object for Custom Controls demo page.
 * Route: /form-field-wrapper/custom-controls
 */
export class CustomControlsPage extends BaseFormPage {
  readonly route = '/form-field-wrapper/custom-controls';

  // Form wrapper locators
  readonly formFieldWrappers: Locator;

  // Native input fields
  readonly productNameInput: Locator;
  readonly feedbackTextarea: Locator;

  // Custom rating controls
  readonly ratingControl: Locator;
  readonly serviceRatingControl: Locator;
  readonly wouldRecommendControl: Locator;

  constructor(page: Page) {
    super(page);

    // Form field wrappers
    this.formFieldWrappers = this.form.locator('ngx-signal-form-field-wrapper');

    // Native inputs
    this.productNameInput = this.form.locator('#productName');
    this.feedbackTextarea = this.form.locator('#feedback');

    // Custom rating controls (by id)
    this.ratingControl = this.form.locator('#rating');
    this.serviceRatingControl = this.form.locator('#serviceRating');
    this.wouldRecommendControl = this.form.locator('#wouldRecommend');
  }

  /**
   * Get the submit button.
   */
  get submitButton(): Locator {
    return this.getSubmitButton(/submit/i);
  }

  /**
   * Navigate to the custom controls demo page.
   */
  override async goto(): Promise<void> {
    const url = this.route.startsWith('/')
      ? (process.env['BASE_URL'] ?? 'http://localhost:4200') + this.route
      : this.route;
    await this.page.goto(url);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get stars within a rating control.
   */
  getStars(ratingControl: Locator): Locator {
    return ratingControl.locator('.star');
  }

  /**
   * Get filled stars within a rating control.
   */
  getFilledStars(ratingControl: Locator): Locator {
    return ratingControl.locator('.star--filled');
  }

  /**
   * Click a specific star in a rating control.
   * @param ratingControl The rating control locator
   * @param starNumber The star number to click (1-based)
   */
  async selectStar(ratingControl: Locator, starNumber: number): Promise<void> {
    const star = ratingControl.locator(`[data-star="${starNumber}"]`);
    await star.click();
  }

  /**
   * Get the current value of a rating control.
   */
  async getRatingValue(ratingControl: Locator): Promise<number> {
    const valuenow = await ratingControl.getAttribute('aria-valuenow');
    return parseInt(valuenow ?? '0', 10);
  }

  /**
   * Get the error element for a field by id.
   */
  getErrorById(fieldId: string): Locator {
    return this.form.locator(`#${fieldId}-error`);
  }

  /**
   * Fill the entire form with valid data.
   */
  async fillValidForm(): Promise<void> {
    await this.productNameInput.fill('Test Product');
    await this.selectStar(this.ratingControl, 4);
    await this.selectStar(this.serviceRatingControl, 5);
    await this.selectStar(this.wouldRecommendControl, 2);
    await this.feedbackTextarea.fill('Great product!');
  }
}
