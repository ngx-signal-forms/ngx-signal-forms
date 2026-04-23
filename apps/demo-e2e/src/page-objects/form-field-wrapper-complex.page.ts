import { DEMO_PATHS } from '@ngx-signal-forms/demo-shared';
import { Locator, Page } from '@playwright/test';
import { BaseFormPage } from './base-form.page';
/**
 * Page Object for "Form Field Wrapper - Complex Forms" demo
 * Route: /form-field-wrapper/complex-forms
 *
 * Demonstrates complex form structures with nested fields and fieldset grouping
 */
export class FormFieldWrapperComplexPage extends BaseFormPage {
  readonly addSkillButton: Locator;
  readonly bottomFieldsetSummaryButton: Locator;
  readonly fieldsetSummaryPlacementGroup: Locator;
  readonly horizontalOrientationButton: Locator;
  readonly outlineAppearanceButton: Locator;
  readonly plainAppearanceButton: Locator;
  readonly resetButton: Locator;
  readonly standardAppearanceButton: Locator;
  readonly submitButton: Locator;
  readonly topFieldsetSummaryButton: Locator;
  readonly verticalOrientationButton: Locator;

  constructor(page: Page) {
    super(page);
    this.addSkillButton = this.form.getByRole('button', {
      name: /Add Skill/i,
    });
    this.fieldsetSummaryPlacementGroup = this.page.getByRole('group', {
      name: 'Grouped feedback placement',
    });
    this.bottomFieldsetSummaryButton =
      this.fieldsetSummaryPlacementGroup.getByRole('button', {
        name: 'Bottom',
      });
    this.horizontalOrientationButton = this.page.getByRole('button', {
      name: 'Horizontal',
    });
    this.outlineAppearanceButton = this.page.getByRole('button', {
      name: 'Outline',
    });
    this.plainAppearanceButton = this.page.getByRole('button', {
      name: 'Plain',
    });
    this.resetButton = this.form.getByRole('button', {
      name: /^Reset$/i,
    });
    this.standardAppearanceButton = this.page.getByRole('button', {
      name: 'Standard',
    });
    this.submitButton = this.form.getByRole('button', {
      name: /Submit Application|Submitting/i,
    });
    this.topFieldsetSummaryButton =
      this.fieldsetSummaryPlacementGroup.getByRole('button', {
        name: 'Top',
      });
    this.verticalOrientationButton = this.page.getByRole('button', {
      name: 'Vertical',
    });
  }

  async goto(): Promise<void> {
    await this.page.goto(this.getFullUrl(DEMO_PATHS.complexForms));
    await this.waitForReady();
  }

  /**
   * Get all form field wrapper components
   */
  get formFields(): Locator {
    return this.form.locator('ngx-form-field-wrapper');
  }

  /**
   * Get all fieldset grouping components (both element and attribute usage)
   */
  get fieldsets(): Locator {
    return this.form.locator('ngx-form-fieldset, fieldset[ngxFormFieldset]');
  }

  /**
   * Get fieldset by legend text content
   */
  getFieldsetByLegend(legendText: string | RegExp): Locator {
    return this.fieldsets.filter({
      has: this.page.locator('legend', { hasText: legendText }),
    });
  }

  /**
   * Get Personal Information fieldset
   */
  get personalInfoFieldset(): Locator {
    return this.getFieldsetByLegend(/Personal Information/i);
  }

  /**
   * Get Address Information fieldset
   */
  get addressInfoFieldset(): Locator {
    return this.getFieldsetByLegend(/Address Information/i);
  }

  /**
   * Get Skills fieldset
   */
  get skillsFieldset(): Locator {
    return this.getFieldsetByLegend(/Skills/i);
  }

  /**
   * Get Contacts fieldset
   */
  get contactsFieldset(): Locator {
    return this.getFieldsetByLegend(/Contact Methods/i);
  }

  /**
   * Get Account Credentials fieldset
   */
  get credentialsFieldset(): Locator {
    return this.getFieldsetByLegend(/Account Credentials/i);
  }

  get credentialsFieldsetSurface(): Locator {
    return this.credentialsFieldset.locator(
      '.ngx-signal-form-fieldset__surface',
    );
  }

  get credentialsFieldsetError(): Locator {
    return this.credentialsFieldset.getByRole('alert').first();
  }

  get credentialsFieldsetErrorList(): Locator {
    return this.credentialsFieldset
      .locator(
        '.ngx-form-field-notification__list, .ngx-form-field-error__list',
      )
      .first();
  }

  /**
   * Get Preferences fieldset
   */
  get preferencesFieldset(): Locator {
    return this.getFieldsetByLegend(/Preferences/i);
  }

  get contactMethodGroup(): Locator {
    return this.form.locator('ngx-form-field-wrapper.choice-group-field');
  }

  get contactMethodGroupLabel(): Locator {
    return this.contactMethodGroup.locator(
      ':scope > .ngx-signal-form-field-wrapper__label [ngxFormFieldLabel]',
    );
  }

  get contactMethodFieldset(): Locator {
    return this.contactMethodGroup;
  }

  get contactMethodFieldsetError(): Locator {
    return this.contactMethodGroup.getByRole('alert');
  }

  get credentialsPasswordInput(): Locator {
    return this.form.locator('#credentialsPassword');
  }

  get credentialsConfirmPasswordInput(): Locator {
    return this.form.locator('#credentialsConfirmPassword');
  }

  /**
   * Get preferences newsletter switch control
   */
  get newsletterSwitch(): Locator {
    return this.form.locator('#newsletter');
  }

  /**
   * Get preferences notifications checkbox control
   */
  get notificationsCheckbox(): Locator {
    return this.form.locator('#notifications');
  }

  /**
   * Get contact method radios within preferences
   */
  get preferencesContactRadios(): Locator {
    return this.contactMethodGroup.getByRole('radio');
  }

  /**
   * Get dynamic skill-name inputs, one per skill row
   */
  get skillRows(): Locator {
    return this.form.getByRole('textbox', { name: /Skill Name/i });
  }

  /**
   * Get all inputs, textareas, and selects within the form
   */
  get allFormControls(): Locator {
    return this.form.locator('input, textarea, select');
  }

  /**
   * Submit the form
   */
  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Get skill name input by row index
   */
  getSkillNameInput(index: number): Locator {
    return this.skillRows.nth(index);
  }

  /**
   * Count visible form field wrappers
   */
  countFormFields(): Promise<number> {
    return this.formFields.count();
  }

  /**
   * Count visible fieldset components
   */
  countFieldsets(): Promise<number> {
    return this.fieldsets.count();
  }

  /**
   * Get aggregated error container for a fieldset by legend text
   */
  getFieldsetErrorsByLegend(legendText: string | RegExp): Locator {
    return this.getFieldsetByLegend(legendText).locator('[role="alert"]');
  }

  /**
   * Get the wrapper containing a specific control.
   */
  getWrapperByControlId(controlId: string): Locator {
    return this.form.locator(`ngx-form-field-wrapper:has(#${controlId})`);
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
   * Switch grouped fieldset summaries to top placement.
   */
  async showTopFieldsetSummaryPlacement(): Promise<void> {
    await this.topFieldsetSummaryButton.click();
  }

  /**
   * Switch grouped fieldset summaries to bottom placement.
   */
  async showBottomFieldsetSummaryPlacement(): Promise<void> {
    await this.bottomFieldsetSummaryButton.click();
  }

  /**
   * Switch the demo to horizontal orientation.
   */
  async showHorizontalOrientation(): Promise<void> {
    await this.horizontalOrientationButton.click();
  }
}
