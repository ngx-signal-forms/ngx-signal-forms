import type { ValidationError } from '@angular/forms/signals';

/**
 * Type guard to check if a validation error is a warning.
 * Warnings are errors with `kind` starting with `'warn:'`.
 *
 * @param error - The validation error to check
 * @returns `true` if the error is a warning, `false` otherwise
 *
 * @example
 * ```typescript
 * const error = { kind: 'required', message: 'Field required' };
 * const warning = warningError('weak-password', 'Consider stronger password');
 *
 * isWarningError(error);   // false
 * isWarningError(warning); // true
 * ```
 */
export function isWarningError(error: ValidationError): boolean {
  return typeof error.kind === 'string' && error.kind.startsWith('warn:');
}

/**
 * Type guard to check if a validation error is a blocking error.
 * Any error whose `kind` does NOT start with `'warn:'` is blocking — including
 * malformed errors with an empty or non-string `kind`. This is intentional:
 * a malformed validator result must never silently allow form submission
 * (fail-safe semantics). Matches the semantics of `splitByKind`, which routes
 * every non-warning error into the `blocking` bucket.
 *
 * @param error - The validation error to check
 * @returns `true` if the error is not a warning (including malformed errors),
 *   `false` only if the error is a valid warning (kind starts with `'warn:'`)
 *
 * @example
 * ```typescript
 * const error = { kind: 'required', message: 'Field required' };
 * const warning = warningError('weak-password', 'Consider stronger password');
 * const malformed = { kind: '', message: 'Missing kind' };
 *
 * isBlockingError(error);     // true
 * isBlockingError(warning);   // false
 * isBlockingError(malformed); // true  — fail-safe: treated as blocking
 * ```
 */
export function isBlockingError(error: ValidationError): boolean {
  return !isWarningError(error);
}

/**
 * Result of splitting validation errors into blocking errors and warnings.
 */
export interface SplitErrors {
  readonly blocking: ValidationError[];
  readonly warnings: ValidationError[];
}

/**
 * Splits an array of validation errors into blocking errors and warnings
 * in a single pass. More efficient than calling `.filter(isBlockingError)`
 * and `.filter(isWarningError)` separately.
 *
 * @param errors - Array of ValidationError to partition
 * @returns Object with `blocking` and `warnings` arrays
 */
export function splitByKind(errors: readonly ValidationError[]): SplitErrors {
  const blocking: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  for (const error of errors) {
    if (isWarningError(error)) {
      warnings.push(error);
    } else {
      blocking.push(error);
    }
  }

  return { blocking, warnings };
}

/**
 * Creates a warning validation error using the `warn:` kind convention.
 *
 * **What are warnings?**
 * Warnings are non-blocking validation messages that provide guidance to users
 * without preventing form submission. They use the same `ValidationError` structure
 * as errors, but with a `kind` that starts with `warn:`.
 *
 * **Convention:**
 * - Errors (blocking): `kind` does NOT start with `warn:`
 * - Warnings (non-blocking): `kind` starts with `warn:`
 *
 * **ARIA Behavior:**
 * - Errors: `role="alert"` with `aria-live="assertive"` (immediate announcement)
 * - Warnings: `role="status"` with `aria-live="polite"` (non-intrusive)
 *
 * @remarks
 * **Pass the bare kind, not the prefixed form.** Call
 * `warningError('weak-password')`, NOT `warningError('warn:weak-password')`.
 * The function adds the `warn:` prefix for you. Passing an already-prefixed
 * kind is tolerated (deduplicated to avoid `warn:warn:*`) but is not the
 * intended call form.
 *
 * **Stability**: the `warn:` prefix scheme is part of the toolkit's public
 * v1 contract. Helpers that key off it (`isWarningError`, `splitByKind`,
 * `hasOnlyWarnings`, `getBlockingErrors`, `canSubmitWithWarnings`,
 * `submitWithWarnings`) and ARIA timing in the wrapper, assistive, and
 * headless entry points all depend on it. Changing the prefix is a major
 * version bump.
 *
 * @param kind - The warning type, without the `warn:` prefix (the prefix is
 *   prepended by this function).
 * @param message - Optional warning message to display.
 * @returns A `ValidationError` with `kind` prefixed by `warn:`.
 *
 * @since 1.0.0
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
 * @see {@link https://angular.dev/api/forms/signals/ValidationError | ValidationError API}
 */
export function warningError(kind: string, message?: string): ValidationError {
  const normalizedKind = kind.startsWith('warn:') ? kind.slice(5) : kind;

  return {
    kind: `warn:${normalizedKind}`,
    message,
  };
}
