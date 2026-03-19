import { DEMO_PATHS } from '@ngx-signal-forms/demo-shared';
import { Locator, Page } from '@playwright/test';
import { BaseFormPage } from './base-form.page';

export class FieldsetGroupingPage extends BaseFormPage {
  readonly submitButton: Locator;
  readonly resetButton: Locator;
  readonly placementPlayground: Locator;

  constructor(page: Page) {
    super(page);
    this.submitButton = this.form.getByRole('button', {
      name: /Submit Order|Saving/i,
    });
    this.resetButton = this.form.getByRole('button', { name: /^Reset$/i });
    this.placementPlayground = this.page.getByRole('region', {
      name: /Placement examples/i,
    });
  }

  async goto(): Promise<void> {
    await this.page.goto(this.getFullUrl(DEMO_PATHS.fieldsetGrouping));
    await this.waitForReady();
  }

  get errorModeRadios() {
    return {
      immediate: this.page.getByRole('radio', { name: 'Immediate' }),
      onTouch: this.page.getByRole('radio', {
        name: /On Touch \(Recommended\)/,
      }),
      onSubmit: this.page.getByRole('radio', { name: 'On Submit' }),
    };
  }

  get appearanceButtons() {
    return {
      standard: this.page.getByRole('button', { name: 'Standard' }),
      outline: this.page.getByRole('button', { name: 'Outline' }),
    };
  }

  get allMainFieldsets(): Locator {
    return this.form.locator('fieldset[ngxSignalFormFieldset]');
  }

  get shippingAddressFieldset(): Locator {
    return this.page.locator('[fieldsetid="shipping-address"]');
  }

  get billingAddressFieldset(): Locator {
    return this.page.locator('[fieldsetid="billing-address"]');
  }

  get deliveryMethodFieldset(): Locator {
    return this.page.locator('[fieldsetid="delivery-method"]');
  }

  get deliveryMethodOptionsFieldset(): Locator {
    return this.page.locator('[fieldsetid="delivery-method-options"]');
  }

  get credentialsFieldset(): Locator {
    return this.page.locator('[fieldsetid="credentials"]');
  }

  get billingSameAsShippingCheckbox(): Locator {
    return this.form.getByRole('checkbox', {
      name: /Billing address is the same as shipping/i,
    });
  }

  get shippingStreetInput(): Locator {
    return this.getInputById('shippingStreet');
  }

  get shippingCityInput(): Locator {
    return this.getInputById('shippingCity');
  }

  get shippingZipCodeInput(): Locator {
    return this.getInputById('shippingZipCode');
  }

  get shippingCountrySelect(): Locator {
    return this.getSelectById('shippingCountry');
  }

  get billingStreetInput(): Locator {
    return this.getInputById('billingStreet');
  }

  get passwordInput(): Locator {
    return this.getInputById('password');
  }

  get confirmPasswordInput(): Locator {
    return this.getInputById('confirmPassword');
  }

  get deliveryMethodRadios(): Locator {
    return this.deliveryMethodOptionsFieldset.getByRole('radio');
  }

  get shippingStreetError(): Locator {
    return this.page.locator('#shippingStreet-error');
  }

  get deliveryMethodOptionsAlert(): Locator {
    return this.page.locator('#delivery-method-options-error');
  }

  getFieldsetErrorsByLegend(legendText: string | RegExp): Locator {
    return this.page
      .locator('fieldset[ngxSignalFormFieldset], ngx-signal-form-fieldset')
      .filter({ has: this.page.locator('legend', { hasText: legendText }) })
      .locator('[role="alert"]');
  }

  getPlacementGroup(name: string | RegExp): Locator {
    return this.placementPlayground.getByRole('group', { name });
  }

  get errorPlacementGroup(): Locator {
    return this.page.getByRole('group', { name: 'Error placement' });
  }

  get wrapperPreview(): Locator {
    return this.page.locator('#placementPreviewEmail');
  }

  get wrapperPreviewHost(): Locator {
    return this.wrapperPreview.locator(
      'xpath=ancestor::ngx-signal-form-field-wrapper[1]',
    );
  }

  get wrapperPreviewAlert(): Locator {
    return this.placementPlayground.getByRole('alert').filter({
      hasText: 'Email is required',
    });
  }

  get addressPreviewFieldset(): Locator {
    return this.page.locator('[fieldsetid="placement-preview-address"]');
  }

  get addressPreviewAlert(): Locator {
    return this.addressPreviewFieldset.getByRole('alert');
  }

  get addressPreviewInput(): Locator {
    return this.page.locator('#placementPreviewStreet');
  }

  get deliveryPreviewFieldset(): Locator {
    return this.page.locator('[fieldsetid="placement-preview-delivery"]');
  }

  get deliveryPreviewAlert(): Locator {
    return this.deliveryPreviewFieldset.getByRole('alert');
  }

  get deliveryPreviewRadios(): Locator {
    return this.deliveryPreviewFieldset.getByRole('radio');
  }

  get deliveryPreviewRadio(): Locator {
    return this.deliveryPreviewFieldset.getByRole('radio', {
      name: /Standard \(3-5 business days\)/i,
    });
  }

  get resetSandboxButton(): Locator {
    return this.placementPlayground.getByRole('button', {
      name: /Reset sandbox values/i,
    });
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }
}
