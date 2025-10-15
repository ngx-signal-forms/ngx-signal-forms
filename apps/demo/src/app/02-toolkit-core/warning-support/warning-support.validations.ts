import type { WritableSignal } from '@angular/core';
import {
  email,
  form,
  minLength,
  required,
  schema,
} from '@angular/forms/signals';
import type { PasswordFormModel } from './warning-support.model';

/**
 * NOTE: This is a simplified demo showing the CONCEPT of warnings vs errors.
 *
 * The toolkit provides a warningError() utility for creating non-blocking warnings.
 * Due to TypeScript complexity in this demo environment, we're showing the concept
 * with standard validation and explaining the difference in the UI.
 *
 * In production apps, use the toolkit's warningError() utility which:
 * - Creates errors with kind='warn:*'
 * - Automatically separates warnings from blocking errors
 * - Uses ARIA role="status" aria-live="polite" for warnings
 * - Uses ARIA role="alert" aria-live="assertive" for errors
 * - Allows form submission even with warnings present
 */

/**
 * Password form validation schema.
 *
 * In a real app with the toolkit, you would add warning validations using:
 *
 * validate(path.password, (ctx) => {
 *   if (ctx.value() && ctx.value().length < 12) {
 *     return warningError('short-password', 'Consider 12+ characters for better security');
 *   }
 *   return null;
 * });
 *
 * The toolkit automatically separates warnings from errors and displays them differently.
 */
export const passwordFormSchema = schema<PasswordFormModel>((path) => {
  // Username validation
  required(path.username, { message: 'Username is required' });
  minLength(path.username, 3, {
    message: 'Username must be at least 3 characters',
  });

  // Email validation
  required(path.email, { message: 'Email address is required' });
  email(path.email, { message: 'Please enter a valid email address' });

  // Password validation
  required(path.password, { message: 'Password is required' });
  minLength(path.password, 8, {
    message: 'Password must be at least 8 characters',
  });
});

/**
 * Helper function to create a password form with validation schema.
 */
export function createPasswordForm(model: WritableSignal<PasswordFormModel>) {
  return form(model, passwordFormSchema);
}
