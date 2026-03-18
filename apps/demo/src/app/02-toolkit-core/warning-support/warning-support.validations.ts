import type { WritableSignal } from '@angular/core';
import {
  email,
  form,
  minLength,
  required,
  schema,
  validate,
} from '@angular/forms/signals';
import type { PasswordFormModel } from './warning-support.model';

/**
 * Password form validation schema demonstrating the toolkit's warning support.
 *
 * This schema shows the distinction between:
 * - **Blocking errors**: Prevent form submission (required, minLength, email format)
 * - **Non-blocking warnings**: Provide guidance without blocking submission
 *
 * **Warning Implementation:**
 * Use `customError()` with `kind: 'warn:*'` to create non-blocking warnings.
 * The toolkit's form error component automatically:
 * - Separates warnings from blocking errors in the UI
 * - Displays warnings with ARIA role="status" aria-live="polite" (non-intrusive)
 * - Displays errors with ARIA role="alert" aria-live="assertive" (immediate)
 * - Styles warnings differently (amber vs red)
 * - Allows form submission even with warnings present
 *
 * **Alternative:** The toolkit also provides `warningError('kind', 'message')` helper
 * which wraps `customError({ kind: 'warn:kind', message })` for convenience.
 */
export const passwordFormSchema = schema<PasswordFormModel>((path) => {
  // Username validation - blocking errors
  required(path.username, { message: 'Username is required' });
  minLength(path.username, 3, {
    message: 'Username must be at least 3 characters',
  });

  // Username warning - suggest longer usernames for better security
  validate(path.username, (ctx) => {
    const value = ctx.value();
    if (value && value.length >= 3 && value.length < 6) {
      return {
        kind: 'warn:short-username',
        message: 'Consider using 6+ characters for better security',
      };
    }
    return null;
  });

  // Email validation - blocking errors
  required(path.email, { message: 'Email address is required' });
  email(path.email, { message: 'Please enter a valid email address' });

  // Email warning - suggest avoiding common disposable email domains
  validate(path.email, (ctx) => {
    const value = ctx.value();
    const disposableDomains = [
      'tempmail.com',
      'throwaway.email',
      '10minutemail.com',
    ];

    if (
      value &&
      disposableDomains.some((domain) => value.includes(`@${domain}`))
    ) {
      return {
        kind: 'warn:disposable-email',
        message:
          'Disposable email addresses may limit account recovery options',
      };
    }
    return null;
  });

  // Password validation - blocking errors
  required(path.password, { message: 'Password is required' });
  minLength(path.password, 8, {
    message: 'Password must be at least 8 characters',
  });

  // Password warning - encourage stronger passwords
  validate(path.password, (ctx) => {
    const value = ctx.value();
    if (value && value.length >= 8 && value.length < 12) {
      return {
        kind: 'warn:weak-password',
        message: 'Consider using 12+ characters for better security',
      };
    }
    return null;
  });

  // Password warning - suggest mixing character types
  validate(path.password, (ctx) => {
    const value = ctx.value();
    if (value && value.length >= 8) {
      const hasUpperCase = /[A-Z]/.test(value);
      const hasLowerCase = /[a-z]/.test(value);
      const hasNumbers = /\d/.test(value);
      const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(value);

      const typeCount = [
        hasUpperCase,
        hasLowerCase,
        hasNumbers,
        hasSpecialChars,
      ].filter(Boolean).length;

      if (typeCount < 3) {
        return {
          kind: 'warn:simple-password',
          message:
            'Consider mixing uppercase, lowercase, numbers, and special characters',
        };
      }
    }
    return null;
  });
});

/**
 * Helper function to create a password form with validation schema.
 */
export function createPasswordForm(model: WritableSignal<PasswordFormModel>) {
  return form(model, passwordFormSchema);
}
