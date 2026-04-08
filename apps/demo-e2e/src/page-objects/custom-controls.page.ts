import { DEMO_PATHS } from '@ngx-signal-forms/demo-shared';
import type { Locator, Page } from '@playwright/test';
import { BaseFormPage } from './base-form.page';

/**
 * Page Object for Custom Controls demo page.
 * Route: /form-field-wrapper/custom-controls
 */
export class CustomControlsPage extends BaseFormPage {
  readonly route = DEMO_PATHS.customControls;

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

    this.outlineAppearanceButton = this.page.getByRole('button', {
      name: 'Outline',
    });

    this.formFieldWrappers = this.form.locator('ngx-signal-form-field-wrapper');

    this.productNameInput = this.form.locator('#productName');
    this.emailUpdatesSwitch = this.form.locator('#emailUpdates');
    this.feedbackTextarea = this.form.locator('#feedback');

    this.ratingControl = this.form.locator('#rating');
    this.serviceRatingControl = this.form.locator('#serviceRating');
    this.wouldRecommendControl = this.form.locator('#wouldRecommend');
  }

  get submitButton(): Locator {
    return this.getSubmitButton(/submit/i);
  }

  override async goto(): Promise<void> {
    await this.page.goto(this.getFullUrl(this.route));
    await this.waitForReady();
  }

  getStars(ratingControl: Locator): Locator {
    return ratingControl.locator('.star');
  }

  getFilledStars(ratingControl: Locator): Locator {
    return ratingControl.locator('.star--filled');
  }

  async selectStar(ratingControl: Locator, starNumber: number): Promise<void> {
    const star = ratingControl.locator(`[data-star="${starNumber}"]`);
    await star.click();
  }

  async getRatingValue(ratingControl: Locator): Promise<number> {
    const valuenow = await ratingControl.getAttribute('aria-valuenow');
    return parseInt(valuenow ?? '0', 10);
  }

  async showOutlineAppearance(): Promise<void> {
    await this.outlineAppearanceButton.click();
  }

  getWrapperByControlId(controlId: string): Locator {
    return this.form.locator(
      `ngx-signal-form-field-wrapper:has(#${controlId})`,
    );
  }

  getErrorById(fieldId: string): Locator {
    return this.form.locator(`#${fieldId}-error`);
  }

  async enableEmailUpdates(): Promise<void> {
    if (!(await this.emailUpdatesSwitch.isChecked())) {
      await this.emailUpdatesSwitch.click();
    }
  }

  async fillValidForm(): Promise<void> {
    await this.productNameInput.fill('Test Product');
    await this.selectStar(this.ratingControl, 4);
    await this.selectStar(this.serviceRatingControl, 5);
    await this.selectStar(this.wouldRecommendControl, 2);
    await this.enableEmailUpdates();
    await this.feedbackTextarea.fill('Great product!');
  }
}
