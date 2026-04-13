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
  readonly resetButton: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    super(page);
    this.addSkillButton = this.form.getByRole('button', {
      name: /Add Skill/i,
    });
    this.resetButton = this.form.getByRole('button', {
      name: /^Reset$/i,
    });
    this.submitButton = this.form.getByRole('button', {
      name: /Submit Application|Submitting/i,
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
    return this.form.locator('ngx-signal-form-field-wrapper');
  }

  /**
   * Get all fieldset grouping components (both element and attribute usage)
   */
  get fieldsets(): Locator {
    return this.form.locator(
      'ngx-signal-form-fieldset, fieldset[ngxSignalFormFieldset]',
    );
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
   * Get Preferences fieldset
   */
  get preferencesFieldset(): Locator {
    return this.getFieldsetByLegend(/Preferences/i);
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
    return this.preferencesFieldset.getByRole('radio');
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
  async countFormFields(): Promise<number> {
    return await this.formFields.count();
  }

  /**
   * Count visible fieldset components
   */
  async countFieldsets(): Promise<number> {
    return await this.fieldsets.count();
  }

  /**
   * Get aggregated error container for a fieldset by legend text
   */
  getFieldsetErrorsByLegend(legendText: string | RegExp): Locator {
    return this.getFieldsetByLegend(legendText).locator('[role="alert"]');
  }
}
