import { Locator, Page } from '@playwright/test';
import { BaseFormPage } from './base-form.page';
/**
 * Page Object for "Fieldset - Aggregated Errors" demo
 * Route: /form-field-wrapper/fieldset
 *
 * Demonstrates NgxSignalFormFieldset for grouping form fields
 * with aggregated error display at the fieldset level.
 */
export class FieldsetPage extends BaseFormPage {
  readonly submitButton: Locator;
  readonly resetButton: Locator;

  constructor(page: Page) {
    super(page);
    this.submitButton = this.getSubmitButton(/Submit Order/i);
    this.resetButton = this.page.getByRole('button', { name: /Reset/i });
  }

  async goto(): Promise<void> {
    await this.page.goto(`/form-field-wrapper/fieldset`);
    await this.waitForReady();
  }

  /**
   * Get shipping address fieldset
   */
  get shippingFieldset(): Locator {
    return this.page.locator('[fieldsetid="shipping-address"]');
  }

  /**
   * Get billing address fieldset
   */
  get billingFieldset(): Locator {
    return this.page.locator('[fieldsetid="billing-address"]');
  }

  /**
   * Get credentials fieldset
   */
  get credentialsFieldset(): Locator {
    return this.page.locator('[fieldsetid="credentials"]');
  }

  /**
   * Get delivery method fieldset
   */
  get deliveryFieldset(): Locator {
    return this.page.locator('[fieldsetid="delivery-method"]');
  }

  /**
   * Get all visible fieldset elements with ngx-signal-form-fieldset directive
   */
  get allFieldsets(): Locator {
    return this.page.locator('[fieldsetid]');
  }

  /**
   * Get the "billing same as shipping" checkbox
   */
  get billingSameAsShippingCheckbox(): Locator {
    return this.page.getByLabel(/Billing address is the same/i);
  }

  /**
   * Get shipping address inputs
   */
  get shippingStreetInput(): Locator {
    return this.page.getByLabel(/^Street Address/i).first();
  }

  get shippingCityInput(): Locator {
    return this.page.getByLabel(/^City/i).first();
  }

  get shippingZipInput(): Locator {
    return this.page.getByLabel(/^ZIP Code/i).first();
  }

  get shippingCountrySelect(): Locator {
    return this.shippingFieldset.getByLabel(/^Country/i);
  }

  /**
   * Get password inputs
   */
  get passwordInput(): Locator {
    return this.page.getByLabel(/^Password \*/i);
  }

  get confirmPasswordInput(): Locator {
    return this.page.getByLabel(/^Confirm Password/i);
  }

  /**
   * Get error alert in a specific fieldset
   */
  getFieldsetErrors(fieldset: Locator): Locator {
    return fieldset.locator('.ngx-signal-form-error');
  }

  /**
   * Get delivery method radios
   */
  get deliveryMethodRadios(): Locator {
    return this.deliveryFieldset.getByRole('radio');
  }

  /**
   * Fill shipping address with valid data
   */
  async fillShippingAddress(
    address: {
      street: string;
      city: string;
      zipCode: string;
      country: string;
    } = {
      street: '123 Main Street',
      city: 'New York',
      zipCode: '10001',
      country: 'US',
    },
  ): Promise<void> {
    await this.shippingStreetInput.fill(address.street);
    await this.shippingCityInput.fill(address.city);
    await this.shippingZipInput.fill(address.zipCode);
    await this.shippingCountrySelect.selectOption(address.country);
  }

  /**
   * Fill credentials with matching passwords
   */
  async fillCredentials(password = 'SecureP@ss123'): Promise<void> {
    await this.passwordInput.fill(password);
    await this.confirmPasswordInput.fill(password);
  }

  /**
   * Submit the form
   */
  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Reset the form
   */
  async reset(): Promise<void> {
    await this.resetButton.click();
  }

  /**
   * Count visible fieldsets
   */
  async countFieldsets(): Promise<number> {
    return await this.allFieldsets.count();
  }

  /**
   * Toggle billing same as shipping checkbox
   */
  async toggleBillingSameAsShipping(): Promise<void> {
    await this.billingSameAsShippingCheckbox.click();
  }
}
