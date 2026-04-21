import {
  max,
  min,
  minLength,
  pattern,
  required,
  schema,
} from '@angular/forms/signals';
import type { LabellessFieldsModel } from './labelless-fields.model';

/**
 * Validation schema for the labelless-fields demo. The narrow-input
 * section intentionally uses messages longer than the input so that the
 * error text must render wider than the input itself.
 */
export const labellessFieldsSchema = schema<LabellessFieldsModel>((path) => {
  // Phone group — require each part so the shared error region lights up.
  required(path.phoneCountry, { message: 'Country code is required' });
  minLength(path.phoneNumber, 7, {
    message: 'Phone number must be at least 7 digits',
  });

  // Amount — enforces a positive number so "Amount must be greater than 0"
  // renders below the currency input.
  min(path.amount, 1, { message: 'Amount must be greater than 0' });

  // Narrow inputs — messages are intentionally longer than the input.
  required(path.age, { message: 'Age is required' });
  min(path.age, 18, { message: 'Must be 18 or older' });
  max(path.age, 120, { message: 'Invalid age' });

  pattern(path.zipCode, /^\d{5}(-\d{4})?$/, {
    message: 'Format: 12345 or 12345-6789',
  });

  pattern(path.otp, /^\d{6}$/, {
    message: 'Enter all six digits',
  });
});
