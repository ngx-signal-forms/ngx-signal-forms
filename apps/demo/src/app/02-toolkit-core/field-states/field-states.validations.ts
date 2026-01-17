import {
  schema,
  required,
  email,
  minLength,
  validate,
} from '@angular/forms/signals';
import type { FieldStatesModel } from './field-states.model';

/**
 * Validation schema for Field States demonstration
 * Shows simple validation rules to demonstrate state changes
 *
 * **Password warnings demonstrate:**
 * - customError() with 'warn:' prefix for non-blocking feedback
 * - Non-blocking suggestions that don't prevent form submission
 * - dirty() + warnings() pattern (show warnings immediately when typing)
 */
export const fieldStatesSchema = schema<FieldStatesModel>((path) => {
  // Email validation
  required(path.email, { message: 'Email is required' });
  email(path.email, { message: 'Email format is invalid' });

  // Username validation
  required(path.username, { message: 'Username is required' });
  minLength(path.username, 3, {
    message: 'Username must be at least 3 characters',
  });

  // Password validation - blocking errors
  required(path.password, { message: 'Password is required' });
  minLength(path.password, 8, {
    message: 'Password must be at least 8 characters',
  });

  // ✨ Password strength warnings (non-blocking)
  // Use customError() with 'warn:' prefix to make these suggestions instead of errors
  validate(path.password, (ctx) => {
    const password = ctx.value();
    if (password && !/[!@#$%^&*]/.test(password)) {
      return {
        kind: 'warn:missing-special-chars',
        message: 'Consider adding special characters (!@#$%^&*)',
      };
    }
    return null;
  });

  validate(path.password, (ctx) => {
    const password = ctx.value();
    if (password && !/[A-Z]/.test(password)) {
      return {
        kind: 'warn:missing-uppercase',
        message: 'Consider adding uppercase letters for stronger security',
      };
    }
    return null;
  });

  validate(path.password, (ctx) => {
    const password = ctx.value();
    if (password && !/[0-9]/.test(password)) {
      return {
        kind: 'warn:missing-numbers',
        message: 'Consider adding numbers for stronger security',
      };
    }
    return null;
  });
});
