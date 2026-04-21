import { DEMO_PATHS } from '@ngx-signal-forms/demo-shared';
import type { Locator, Page } from '@playwright/test';
import { BaseFormPage } from './base-form.page';

/**
 * Page Object for the Labelless Fields demo page.
 * Route: /form-field-wrapper/labelless-fields
 */
export class LabellessFieldsPage extends BaseFormPage {
  readonly route = DEMO_PATHS.labellessFields;

  readonly standardAppearanceButton: Locator;
  readonly outlineAppearanceButton: Locator;
  readonly horizontalOrientationButton: Locator;

  readonly searchInput: Locator;
  readonly ageInput: Locator;
  readonly zipInput: Locator;
  readonly comparisonLabelledWrapper: Locator;
  readonly comparisonLabellessWrapper: Locator;
  readonly labellessSearchWrapper: Locator;

  readonly comparisonSection: Locator;
  readonly narrowInputsSection: Locator;

  constructor(page: Page) {
    super(page);

    this.standardAppearanceButton = this.page.getByRole('button', {
      name: 'Standard',
    });
    this.outlineAppearanceButton = this.page.getByRole('button', {
      name: 'Outline',
    });
    this.horizontalOrientationButton = this.page.getByRole('button', {
      name: 'Horizontal',
    });

    this.searchInput = this.form.locator('#searchQuery');
    this.ageInput = this.form.locator('#age');
    this.zipInput = this.form.locator('#zipCode');
    this.comparisonLabelledWrapper = this.form
      .locator('ngx-form-field-wrapper')
      .filter({ has: this.page.locator('#comparisonLabelled') });
    this.comparisonLabellessWrapper = this.form
      .locator('ngx-form-field-wrapper')
      .filter({ has: this.page.locator('#comparisonLabelless') });
    this.labellessSearchWrapper = this.form
      .locator('ngx-form-field-wrapper')
      .filter({ has: this.page.locator('#searchQuery') });

    this.comparisonSection = this.form.locator('[data-section="comparison"]');
    this.narrowInputsSection = this.form.locator(
      '[data-section="narrow-inputs"]',
    );
  }

  async goto(): Promise<void> {
    await this.page.goto(this.getFullUrl(this.route));
  }
}
