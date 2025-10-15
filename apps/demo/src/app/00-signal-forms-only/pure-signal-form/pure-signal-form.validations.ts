import {
  customError,
  email,
  minLength,
  required,
  schema,
  validate,
} from '@angular/forms/signals';
import type { PureSignalFormModel } from './pure-signal-form.model';

/**
 * Validation schema for pure Signal Forms example
 * Uses Angular's built-in validators
 */
export const pureSignalFormSchema = schema<PureSignalFormModel>((path) => {
  // Email validation
  required(path.email, { message: 'Email is required' });
  email(path.email, { message: 'Please enter a valid email address' });

  // Password validation
  required(path.password, { message: 'Password is required' });
  minLength(path.password, 8, {
    message: 'Password must be at least 8 characters',
  });

  // Confirm password validation
  required(path.confirmPassword, { message: 'Please confirm your password' });

  // Cross-field validation: passwords must match
  validate(path, (ctx) => {
    const { password, confirmPassword } = ctx.value();
    if (password !== confirmPassword) {
      return customError({
        kind: 'password_mismatch',
        message: 'Passwords do not match',
      });
    }
    return null;
  });
});
