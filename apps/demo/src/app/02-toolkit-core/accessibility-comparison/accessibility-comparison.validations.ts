import {
  email,
  minLength,
  required,
  schema,
  validate,
} from '@angular/forms/signals';
import type { AccessibilityFormModel } from './accessibility-comparison.model';

/**
 * Validation schema for accessibility comparison
 * Used by BOTH manual and toolkit implementations
 */
export const accessibilityValidationSchema = schema<AccessibilityFormModel>(
  (path) => {
    // Email validation
    required(path.email, { message: 'Email address is required' });
    email(path.email, { message: 'Please enter a valid email address' });

    // Password validation
    required(path.password, { message: 'Password is required' });
    minLength(path.password, 8, {
      message: 'Password must be at least 8 characters',
    });

    // Confirm password validation
    required(path.confirmPassword, { message: 'Please confirm your password' });

    // Cross-field validation - passwords must match
    // Validate on confirmPassword field and check against password field
    validate(path.confirmPassword, (ctx) => {
      const confirmPassword = ctx.value();
      const password = ctx.valueOf(path.password);

      if (password && confirmPassword && confirmPassword !== password) {
        return {
          kind: 'password_mismatch',
          message: 'Passwords do not match',
        };
      }
      return null;
    });
  },
);
