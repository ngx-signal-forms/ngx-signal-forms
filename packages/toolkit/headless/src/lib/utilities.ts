import type { ValidationError } from '@angular/forms/signals';
import { resolveValidationErrorMessage } from '@ngx-signal-forms/toolkit';
import {
  humanizeFieldPath,
  type ErrorMessageRegistry,
} from '@ngx-signal-forms/toolkit/core';

export { humanizeFieldPath };

// Error-summary mapping utilities live in their own module (issue #354);
// re-exported below so the public barrel — which imports everything from
// `./lib/utilities` — keeps resolving unchanged.
export {
  dedupeValidationErrorsByField,
  focusBoundControlFromError,
  resolveFieldNameFromError,
  toErrorSummaryEntry,
} from './error-summary-utilities';
// Field-state duck-typing utilities live in their own module (issue #354);
// re-exported below for the same reason.
export {
  createFieldStateFlags,
  isErrorOnInteractiveField,
  readErrors,
  readFieldFlag,
  type BooleanStateKey,
  type FieldStateFlags,
  type FieldStateLike,
} from './field-state-utilities';

/**
 * A resolved error with kind and message.
 *
 * Canonical home for this type — `error-state.ts` re-exports it (the public
 * barrel resolves `ResolvedError` from `./lib/error-state` and stays
 * unchanged) so both `createFieldsetAggregation()` (`fieldset.ts`) and
 * `NgxHeadlessErrorState` (`error-state.ts`) share one definition.
 *
 * @group Directives
 */
export interface ResolvedError {
  readonly kind: string;
  readonly message: string;
}

/**
 * Deduplicate validation errors by kind + message combination.
 *
 * Useful for fieldsets that aggregate errors from multiple fields -
 * the same validation error (e.g., "required") might appear multiple times.
 *
 * @param errors - Array of ValidationError to deduplicate
 * @returns Deduplicated array preserving first occurrence order
 *
 * @example
 * ```typescript
 * const errors = [
 *   { kind: 'required', message: 'Required' },
 *   { kind: 'email', message: 'Invalid email' },
 *   { kind: 'required', message: 'Required' }, // duplicate
 * ];
 * const unique = dedupeValidationErrors(errors);
 * // [{ kind: 'required', message: 'Required' }, { kind: 'email', message: 'Invalid email' }]
 * ```
 *
 * @group Utility Functions
 */
export function dedupeValidationErrors(
  errors: readonly ValidationError[],
): ValidationError[] {
  const seen = new Set<string>();
  const result: ValidationError[] = [];

  for (const error of errors) {
    const key = `${error.kind}::${error.message ?? ''}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(error);
  }

  return result;
}

/**
 * Resolve a validation error's display message using the toolkit's standard
 * settings (`stripWarningPrefix: true` by default).
 *
 * Shared by `NgxHeadlessErrorState` (`error-state.ts`), `createFieldsetAggregation`
 * (`fieldset.ts`), and `createErrorMessageSignal` so all three surfaces stay in lockstep — changing
 * message resolution behaviour requires editing exactly one place.
 *
 * @internal
 */
export function resolveErrorMessage(
  error: ValidationError,
  registry: Readonly<ErrorMessageRegistry> | null | undefined,
  stripWarningPrefix = true,
): string {
  return resolveValidationErrorMessage(error, registry, { stripWarningPrefix });
}
