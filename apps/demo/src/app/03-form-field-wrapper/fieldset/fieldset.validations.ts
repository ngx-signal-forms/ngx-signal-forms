import {
  minLength,
  pattern,
  required,
  schema,
  validate,
} from '@angular/forms/signals';

import type { FieldsetDemoModel } from './fieldset.model';

const ZIP_CODE_PATTERN = /^[0-9]{5}(-[0-9]{4})?$/;
const PASSWORD_MIN_LENGTH = 8;

/**
 * Validation schema for the fieldset demo form
 *
 * Demonstrates:
 * - Grouped address field validations
 * - Cross-field validation (passwords must match)
 * - Conditional validation based on form state
 */
export const fieldsetDemoSchema = schema<FieldsetDemoModel>((path) => {
  // Shipping Address validation
  required(path.shippingAddress.street, {
    message: 'Shipping street is required',
  });
  required(path.shippingAddress.city, { message: 'Shipping city is required' });
  required(path.shippingAddress.zipCode, {
    message: 'Shipping ZIP code is required',
  });
  pattern(path.shippingAddress.zipCode, ZIP_CODE_PATTERN, {
    message: 'ZIP code must be 5 digits (e.g., 12345 or 12345-6789)',
  });
  required(path.shippingAddress.country, {
    message: 'Shipping country is required',
  });

  // Billing Address validation (only if not same as shipping)
  validate(path.billingAddress.street, (ctx) => {
    const billingSame = ctx.valueOf(path.billingSameAsShipping);
    if (billingSame) return null;

    const value = ctx.value();
    if (!value || !value.trim()) {
      return { kind: 'required', message: 'Billing street is required' };
    }
    return null;
  });

  validate(path.billingAddress.city, (ctx) => {
    const billingSame = ctx.valueOf(path.billingSameAsShipping);
    if (billingSame) return null;

    const value = ctx.value();
    if (!value || !value.trim()) {
      return { kind: 'required', message: 'Billing city is required' };
    }
    return null;
  });

  validate(path.billingAddress.zipCode, (ctx) => {
    const billingSame = ctx.valueOf(path.billingSameAsShipping);
    if (billingSame) return null;

    const value = ctx.value();
    if (!value || !value.trim()) {
      return { kind: 'required', message: 'Billing ZIP code is required' };
    }
    if (!ZIP_CODE_PATTERN.test(value)) {
      return {
        kind: 'pattern',
        message: 'ZIP code must be 5 digits (e.g., 12345 or 12345-6789)',
      };
    }
    return null;
  });

  validate(path.billingAddress.country, (ctx) => {
    const billingSame = ctx.valueOf(path.billingSameAsShipping);
    if (billingSame) return null;

    const value = ctx.value();
    if (!value || !value.trim()) {
      return { kind: 'required', message: 'Billing country is required' };
    }
    return null;
  });

  // Password validation
  required(path.credentials.password, { message: 'Password is required' });
  minLength(path.credentials.password, PASSWORD_MIN_LENGTH, {
    message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
  });
  required(path.credentials.confirmPassword, {
    message: 'Confirm password is required',
  });

  // Cross-field: passwords must match
  validate(path.credentials.confirmPassword, (ctx) => {
    const confirmValue = ctx.value();
    const passwordValue = ctx.valueOf(path.credentials.password);
    if (confirmValue && passwordValue && confirmValue !== passwordValue) {
      return {
        kind: 'passwordMismatch',
        message: 'Passwords do not match',
      };
    }
    return null;
  });
});
