import { computed, type Signal } from '@angular/core';
import type { ValidationError } from '@angular/forms/signals';
import {
  isFieldStateInteractive,
  type ErrorReadableState,
} from '@ngx-signal-forms/toolkit';

/**
 * Field-state duck-typing utilities, split out of `utilities.ts` (issue
 * #354) so the ~900-line file's domains stop sharing one module boundary.
 * Everything here reads a `FieldTree`'s return value (or a
 * `ValidationError`'s `fieldTree()`) through loose, structural access
 * instead of Angular's exact `FieldState` type — the shared reason being
 * that toolkit consumers pass mock states in tests and adapters may expose
 * `CompatFieldState` variants that only partially match.
 */

// ============================================================================
// FieldState Duck-Typing Utilities
// ============================================================================

/**
 * Boolean state keys available on FieldState.
 *
 * Angular Signal Forms exposes these as `Signal<boolean>` properties.
 * We define it locally for type-safe access via duck-typing.
 *
 * @group Utility Functions
 */
export type BooleanStateKey =
  | 'invalid'
  | 'valid'
  | 'touched'
  | 'dirty'
  | 'pending';

/**
 * Type representing the shape of FieldState for reading errors.
 * Used for duck-typing access to error properties.
 *
 * @group Utility Functions
 */
export type FieldStateLike = {
  invalid?: ErrorReadableState['invalid'];
  valid?: () => boolean;
  touched?: ErrorReadableState['touched'];
  dirty?: () => boolean;
  pending?: () => boolean;
  errorSummary?: () => ValidationError[];
  errors?: ErrorReadableState['errors'];
};

function normalizeValidationErrors(errors: unknown): ValidationError[] {
  return Array.isArray(errors) ? errors : [];
}

/**
 * Read a boolean flag from FieldState using duck-typing.
 *
 * Safely accesses FieldState boolean signals (invalid, valid, touched, dirty, pending)
 * without requiring exact type match. Useful when working with FieldTree
 * return types that may be FieldState or CompatFieldState.
 *
 * @param state - The field state object (from `fieldTree()`)
 * @param key - The boolean flag name to read
 * @returns The boolean value, or false if not accessible
 *
 * @example
 * ```typescript
 * const fieldState = myField();
 * const isInvalid = readFieldFlag(fieldState, 'invalid');
 * const isTouched = readFieldFlag(fieldState, 'touched');
 * ```
 *
 * @group Utility Functions
 */
export function readFieldFlag(state: unknown, key: BooleanStateKey): boolean {
  if (!state || typeof state !== 'object') {
    return false;
  }

  const fn: unknown = Reflect.get(state, key);
  return typeof fn === 'function' ? !!fn() : false;
}

/**
 * Computed boolean state flags from a reactive field state signal.
 *
 * @group Reactive Primitives
 */
export interface FieldStateFlags {
  readonly isInvalid: Signal<boolean>;
  readonly isValid: Signal<boolean>;
  readonly isTouched: Signal<boolean>;
  readonly isDirty: Signal<boolean>;
  readonly isPending: Signal<boolean>;
}

/**
 * Creates computed boolean state flags from a field state signal.
 *
 * Eliminates the repeated pattern of 5 individual `readFieldFlag` computeds
 * found in fieldset directives and components.
 *
 * @remarks Does not require an injection context (only creates `computed`s).
 *
 * @param fieldState - A signal/computed that returns the field state object
 * @returns Object with computed signals for each boolean flag
 *
 * @group Reactive Primitives
 */
export function createFieldStateFlags(
  fieldState: () => unknown,
): FieldStateFlags {
  return {
    isInvalid: computed(() => readFieldFlag(fieldState(), 'invalid')),
    isValid: computed(() => readFieldFlag(fieldState(), 'valid')),
    isTouched: computed(() => readFieldFlag(fieldState(), 'touched')),
    isDirty: computed(() => readFieldFlag(fieldState(), 'dirty')),
    isPending: computed(() => readFieldFlag(fieldState(), 'pending')),
  };
}

/**
 * Read errors from FieldState using duck-typing.
 *
 * Tries `errorSummary()` first (aggregated errors from nested fields),
 * then falls back to `errors()` (direct field errors).
 *
 * @param state - The field state object (from `fieldTree()`)
 * @returns Array of ValidationError, empty if not accessible
 *
 * @example
 * ```typescript
 * const fieldState = addressField();
 * const allErrors = readErrors(fieldState); // Includes nested field errors
 * ```
 *
 * @group Utility Functions
 */
export function readErrors(state: unknown): ValidationError[] {
  if (!state || typeof state !== 'object') {
    return [];
  }

  const summary = (state as FieldStateLike).errorSummary;
  if (typeof summary === 'function') {
    return normalizeValidationErrors(summary());
  }

  const errors = (state as FieldStateLike).errors;
  if (typeof errors === 'function') {
    return normalizeValidationErrors(errors());
  }

  return [];
}

/**
 * Minimal structural view of the `fieldTree` members read off a
 * `ValidationError` via duck-typing (`name()`, `focusBoundControl()`).
 *
 * As of Angular 22.0.0 the framework *does* export `ValidationError.WithFieldTree`
 * publicly (the Vest adapter consumes it directly), so this is no longer bridging
 * a missing type. It is kept as a deliberately narrow, **all-optional** structural
 * type because these helpers accept a bare `ValidationError`: errors emitted by
 * custom validators / Vest need not carry a `fieldTree`, so every access stays
 * guarded at runtime rather than asserting the framework's non-optional
 * `WithFieldTree` shape.
 *
 * Shared with `error-summary-utilities.ts`, whose mapping helpers
 * (`resolveFieldNameFromError`, `focusBoundControlFromError`,
 * `dedupeValidationErrorsByField`) read the same `fieldTree` shape.
 */
export type ValidationErrorWithFieldTree = ValidationError & {
  fieldTree?: () =>
    | {
        name?: () => string;
        focusBoundControl?: (options?: Readonly<FocusOptions>) => void;
      }
    | undefined;
};

/**
 * Predicate: returns `true` when the field behind a `ValidationError` is
 * interactive (not hidden, not disabled). Composes the shared
 * {@link isFieldStateInteractive} predicate from core with the duck-typed
 * `error.fieldTree()` extraction that Angular doesn't expose on the public
 * `ValidationError` type.
 *
 * ## Default-policy asymmetry vs `focusFirstInvalid`
 *
 * When an error has no `fieldTree` (or a malformed one), this function
 * returns `true` — **show** the error. Silently hiding a validation
 * message from the user is the worst outcome, so the default errs on the
 * side of surfacing even malformed errors. `focusFirstInvalid` in
 * `packages/toolkit/core/utilities/focus-first-invalid.ts` takes the
 * inverse default and **skips** unknown-fieldTree errors, because there
 * is nothing to focus and silently focusing an unrelated field would be
 * worse than skipping. Both policies are deliberate; do not "normalize"
 * them.
 *
 * @internal
 */
export function isErrorOnInteractiveField(error: ValidationError): boolean {
  const e = error as ValidationErrorWithFieldTree;
  if (typeof e.fieldTree !== 'function') return true;

  const fieldState = e.fieldTree();
  if (!fieldState || typeof fieldState !== 'object') return true;

  return isFieldStateInteractive(fieldState);
}
