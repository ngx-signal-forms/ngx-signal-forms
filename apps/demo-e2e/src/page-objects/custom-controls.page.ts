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
  readonly plainAppearanceButton: Locator;
  readonly verticalOrientationButton: Locator;
  readonly horizontalOrientationButton: Locator;

  // Form wrapper locators
  readonly formFieldWrappers: Locator;

  // Native input fields
  readonly productNameInput: Locator;
  readonly emailUpdatesSwitch: Locator;
  readonly shareReviewPubliclyCheckbox: Locator;
  readonly feedbackTextarea: Locator;

  // Custom rating controls
  readonly ratingControl: Locator;
  readonly serviceRatingControl: Locator;
  readonly wouldRecommendControl: Locator;
  readonly accessibilityAuditControl: Locator;

  constructor(page: Page) {
    super(page);

    this.standardAppearanceButton = this.page.getByRole('button', {
      name: 'Standard',
    });
    this.outlineAppearanceButton = this.page.getByRole('button', {
      name: 'Outline',
    });
    this.plainAppearanceButton = this.page.getByRole('button', {
      name: 'Plain',
    });
    this.verticalOrientationButton = this.page.getByRole('button', {
      name: 'Vertical',
    });
    this.horizontalOrientationButton = this.page.getByRole('button', {
      name: 'Horizontal',
    });

    // Form field wrappers
    this.formFieldWrappers = this.form.locator('ngx-form-field-wrapper');

    // Native inputs
    this.productNameInput = this.form.locator('#productName');
    this.emailUpdatesSwitch = this.form.locator('#emailUpdates');
    this.shareReviewPubliclyCheckbox = this.form.locator(
      '#shareReviewPublicly',
    );
    this.feedbackTextarea = this.form.locator('#feedback');

    // Custom rating controls (by id)
    this.ratingControl = this.form.locator('#rating');
    this.serviceRatingControl = this.form.locator('#serviceRating');
    this.wouldRecommendControl = this.form.locator('#wouldRecommend');
    this.accessibilityAuditControl = this.form.locator('#accessibilityAudit');
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
   * Switch the demo to standard appearance.
   */
  async showStandardAppearance(): Promise<void> {
    await this.standardAppearanceButton.click();
  }

  /**
   * Switch the demo to plain appearance.
   */
  async showPlainAppearance(): Promise<void> {
    await this.plainAppearanceButton.click();
  }

  /**
   * Switch the demo to horizontal orientation.
   */
  async showHorizontalOrientation(): Promise<void> {
    await this.horizontalOrientationButton.click();
  }

  /**
   * Switch the demo to vertical orientation.
   */
  async showVerticalOrientation(): Promise<void> {
    await this.verticalOrientationButton.click();
  }

  /**
   * Get the wrapper containing a specific control.
   */
  getWrapperByControlId(controlId: string): Locator {
    return this.form.locator(`ngx-form-field-wrapper:has(#${controlId})`);
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
   * Enable the public sharing checkbox for successful submissions.
   */
  async enablePublicReviewSharing(): Promise<void> {
    if (!(await this.shareReviewPubliclyCheckbox.isChecked())) {
      await this.shareReviewPubliclyCheckbox.click();
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
    await this.enablePublicReviewSharing();
    await this.selectStar(this.accessibilityAuditControl, 5);
    await this.feedbackTextarea.fill('Great product!');
  }
}
