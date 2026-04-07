import {
  ChangeDetectionStrategy,
  Component,
  input,
  signal,
} from '@angular/core';
import {
  email,
  FormField,
  form,
  required,
  schema,
} from '@angular/forms/signals';
import {
  createOnInvalidHandler,
  NgxSignalFormToolkit,
  type ErrorDisplayStrategy,
  type FormFieldAppearance,
} from '@ngx-signal-forms/toolkit';
import {
  type FieldsetErrorPlacement,
  NgxFormField,
} from '@ngx-signal-forms/toolkit/form-field';

import type { FieldsetDemoModel } from './fieldset.model';
import { fieldsetDemoSchema } from './fieldset.validations';

interface PlacementPreviewModel {
  email: string;
  address: {
    street: string;
    city: string;
  };
  deliveryMethod: string;
}

interface PlacementDesignPreviewModel {
  appointmentDate: string;
  address: {
    street: string;
    city: string;
  };
  deliveryMethod: string;
}

const createPlacementPreviewValue = (): PlacementPreviewModel => ({
  email: '',
  address: {
    street: '',
    city: '',
  },
  deliveryMethod: '',
});

const createPlacementDesignPreviewValue = (): PlacementDesignPreviewModel => ({
  appointmentDate: '12-03-2026',
  address: {
    street: 'Keizersgracht 120',
    city: 'Amsterdam',
  },
  deliveryMethod: 'express',
});

const placementPreviewSchema = schema<PlacementPreviewModel>((path) => {
  required(path.email, { message: 'Email is required' });
  email(path.email, { message: 'Email format is invalid' });
  required(path.address.street, { message: 'Street is required' });
  required(path.address.city, { message: 'City is required' });
  required(path.deliveryMethod, { message: 'Delivery method is required' });
});

const placementDesignPreviewSchema = schema<PlacementDesignPreviewModel>(
  () => {},
);

/**
 * Fieldset Demo - Demonstrates NgxSignalFormFieldset
 *
 * This example showcases how to group related form fields and display
 * aggregated validation errors using the NgxSignalFormFieldset.
 *
 * 🎯 Key Features Demonstrated:
 * - Grouped address fields with shared validation display
 * - Error aggregation across multiple fields
 * - Deduplication of repeated error messages
 * - Cross-field validation (passwords must match)
 * - Conditional fieldset visibility (billing same as shipping)
 * - WCAG 2.2 compliant accessibility
 *
 * 📚 When to use NgxSignalFormFieldset:
 * - Grouping logically related fields (addresses, password groups)
 * - Showing aggregated errors at the group level
 * - Reducing visual clutter with many field-level errors
 *
 * @example
 * ```html
 * <ngx-fieldset-form errorDisplayMode="on-touch" />
 * ```
 */
@Component({
  selector: 'ngx-fieldset-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, NgxSignalFormToolkit, NgxFormField],
  templateUrl: './fieldset.form.html',
  styleUrls: ['./fieldset.form.scss'],
})
export class FieldsetFormComponent {
  /**
   * Error display mode input - controls when errors are shown
   */
  readonly errorDisplayMode = input<ErrorDisplayStrategy>('on-touch');
  readonly appearance = input<FormFieldAppearance>('standard');
  readonly errorPlacement = input<FieldsetErrorPlacement>('top');

  readonly #placementPreviewModel = signal(createPlacementPreviewValue());
  readonly #placementDesignPreviewModel = signal(
    createPlacementDesignPreviewValue(),
  );

  readonly placementPreviewForm = form(
    this.#placementPreviewModel,
    placementPreviewSchema,
  );

  readonly placementDesignPreviewForm = form(
    this.#placementDesignPreviewModel,
    placementDesignPreviewSchema,
  );

  /**
   * Initial empty address template
   */
  readonly #emptyAddress = {
    street: '',
    city: '',
    zipCode: '',
    country: '',
  };

  /**
   * Form model signal with default values
   */
  readonly #model = signal<FieldsetDemoModel>({
    shippingAddress: { ...this.#emptyAddress },
    billingAddress: { ...this.#emptyAddress },
    credentials: {
      password: '',
      confirmPassword: '',
    },
    delivery: {
      method: '',
    },
    billingSameAsShipping: true,
  });

  /**
   * Create form instance with validation schema
   * Exposed as public for debugger access
   */
  readonly fieldsetForm = form(this.#model, fieldsetDemoSchema, {
    submission: {
      action: async () => {
        console.log('Fieldset form submitted:', this.#model());
        return null;
      },
      onInvalid: createOnInvalidHandler(),
    },
  });

  /**
   * Available countries for dropdown
   */
  protected readonly countries = [
    { value: '', label: 'Select a country' },
    { value: 'US', label: 'United States' },
    { value: 'UK', label: 'United Kingdom' },
    { value: 'CA', label: 'Canada' },
    { value: 'AU', label: 'Australia' },
    { value: 'DE', label: 'Germany' },
    { value: 'NL', label: 'Netherlands' },
  ];

  protected resetPlacementPreview(): void {
    this.placementPreviewForm().reset();
    this.#placementPreviewModel.set(createPlacementPreviewValue());
  }

  /**
   * Reset form to initial values
   */
  protected resetForm(): void {
    this.fieldsetForm().reset();
    this.#model.set({
      shippingAddress: { ...this.#emptyAddress },
      billingAddress: { ...this.#emptyAddress },
      credentials: {
        password: '',
        confirmPassword: '',
      },
      delivery: {
        method: '',
      },
      billingSameAsShipping: true,
    });
  }
}
