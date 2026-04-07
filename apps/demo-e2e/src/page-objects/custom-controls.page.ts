import { DEMO_PATHS } from '@ngx-signal-forms/demo-shared';
import type { Locator, Page } from '@playwright/test';
import { BaseFormPage } from './base-form.page';

/**
 * Page Object for Custom Controls demo page.
 * Route: /form-field-wrapper/custom-controls
 */
export class CustomControlsPage extends BaseFormPage {
  readonly route = DEMO_PATHS.customControls;

  readonly standardAppearanceButton: Locator;
  readonly outlineAppearanceButton: Locator;

  // Form wrapper locators
  readonly formFieldWrappers: Locator;

  // Native input fields
  readonly productNameInput: Locator;
  readonly emailUpdatesSwitch: Locator;
  readonly feedbackTextarea: Locator;

  // Custom rating controls
  readonly ratingControl: Locator;
  readonly serviceRatingControl: Locator;
  readonly wouldRecommendControl: Locator;

  constructor(page: Page) {
    super(page);

    this.standardAppearanceButton = this.page.getByRole('button', {
      name: 'Standard',
    });
    this.outlineAppearanceButton = this.page.getByRole('button', {
      name: 'Outline',
    });

    // Form field wrappers
    this.formFieldWrappers = this.form.locator('ngx-signal-form-field-wrapper');

    // Native inputs
    this.productNameInput = this.form.locator('#productName');
    this.emailUpdatesSwitch = this.form.locator('#emailUpdates');
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
    await this.page.goto(this.getFullUrl(this.route));
    await this.waitForReady();
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
   * Switch the demo to outline appearance.
   */
  async showOutlineAppearance(): Promise<void> {
    await this.outlineAppearanceButton.click();
  }

  /**
   * Get the wrapper containing a specific control.
   */
  getWrapperByControlId(controlId: string): Locator {
    return this.form.locator(
      `ngx-signal-form-field-wrapper:has(#${controlId})`,
    );
  }

  /**
   * Get the bordered content element inside a specific wrapper.
   */
  getWrapperContentByControlId(controlId: string): Locator {
    return this.getWrapperByControlId(controlId).locator(
      '.ngx-signal-form-field-wrapper__content',
    );
  }

  /**
   * Get the main content container inside a specific wrapper.
   */
  getWrapperMainByControlId(controlId: string): Locator {
    return this.getWrapperByControlId(controlId).locator(
      '.ngx-signal-form-field-wrapper__main',
    );
  }

  /**
   * Get the error element for a field by id.
   */
  getErrorById(fieldId: string): Locator {
    return this.form.locator(`#${fieldId}-error`);
  }

  /**
   * Enable the switch when the demo requires it for a valid submission.
   */
  async enableEmailUpdates(): Promise<void> {
    if (!(await this.emailUpdatesSwitch.isChecked())) {
      await this.emailUpdatesSwitch.click();
    }
  }

  /**
   * Fill the entire form with valid data.
   */
  async fillValidForm(): Promise<void> {
    await this.productNameInput.fill('Test Product');
    await this.selectStar(this.ratingControl, 4);
    await this.selectStar(this.serviceRatingControl, 5);
    await this.selectStar(this.wouldRecommendControl, 2);
    await this.enableEmailUpdates();
    await this.feedbackTextarea.fill('Great product!');
  }
}
