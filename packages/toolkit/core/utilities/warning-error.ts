import { customError } from '@angular/forms/signals';
import type { CustomValidationError } from '@angular/forms/signals';

/**
 * Creates a warning validation error using the 'warn:' kind convention.
 *
 * **What are warnings?**
 * Warnings are non-blocking validation messages that provide guidance to users
 * without preventing form submission. They use the same `ValidationError` structure
 * as errors, but with a `kind` that starts with `'warn:'`.
 *
 * **Convention:**
 * - Errors (blocking): `kind` does NOT start with `'warn:'`
 * - Warnings (non-blocking): `kind` starts with `'warn:'`
 *
 * **ARIA Behavior:**
 * - Errors: `role="alert"` with `aria-live="assertive"` (immediate announcement)
 * - Warnings: `role="status"` with `aria-live="polite"` (non-intrusive)
 *
 * @param kind - The warning type (will be prefixed with 'warn:')
 * @param message - Optional warning message to display
 * @returns A CustomValidationError with kind prefixed by 'warn:'
 *
 * @example Basic warning
 * ```typescript
 * validate(path.password, (ctx) => {
 *   const value = ctx.value();
 *   if (value && value.length < 12) {
 *     return warningError('short-password', 'Consider using 12+ characters for better security');
 *   }
 *   return null;
 * });
 * ```
 *
 * @example Warning without message (message can be added in template or config)
 * ```typescript
 * validate(path.email, (ctx) => {
 *   const value = ctx.value();
 *   if (value && value.includes('@tempmail.com')) {
 *     return warningError('disposable-email');
 *   }
 *   return null;
 * });
 * ```
 *
 * @example Multiple warnings
 * ```typescript
 * validate(path.username, (ctx) => {
 *   const value = ctx.value();
 *   const warnings = [];
 *
 *   if (value && value.length < 6) {
 *     warnings.push(warningError('short-username', 'Usernames 6+ characters are easier to remember'));
 *   }
 *
 *   if (value && /^\d+$/.test(value)) {
 *     warnings.push(warningError('numeric-username', 'Consider adding letters for better security'));
 *   }
 *
 *   return warnings.length > 0 ? warnings[0] : null; // Signal Forms only returns one error per validator
 * });
 * ```
 *
 * @see {@link https://angular.dev/api/forms/signals/customError | customError API}
 */
export function warningError(
  kind: string,
  message?: string,
): CustomValidationError {
  return customError({
    kind: `warn:${kind}`,
    message,
  });
}
