/**
 * Fieldset Demo Model - Demonstrates grouped form fields with aggregated errors
 *
 * This model showcases the NgxSignalFormFieldset with:
 * - Grouped address fields with shared validation display
 * - Password fields with cross-field validation
 * - Nested fieldsets within a larger form
 */

export interface AddressModel {
  street: string;
  city: string;
  zipCode: string;
  country: string;
}

export interface PasswordModel {
  password: string;
  confirmPassword: string;
}

export interface DeliveryModel {
  method: string;
}

export interface FieldsetDemoModel {
  /// Shipping address (grouped with fieldset)
  shippingAddress: AddressModel;

  /// Billing address (optional, can copy from shipping)
  billingAddress: AddressModel;

  /// Password fields (cross-field validation demo)
  credentials: PasswordModel;

  /// Delivery method selection
  delivery: DeliveryModel;

  /// Billing same as shipping
  billingSameAsShipping: boolean;
}
