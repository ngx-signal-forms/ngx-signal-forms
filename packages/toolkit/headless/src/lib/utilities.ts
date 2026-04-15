import { computed } from '@angular/core';
import type { FieldTree, ValidationError } from '@angular/forms/signals';
import {
  createUniqueId,
  generateErrorId,
  generateWarningId,
  isFieldStateInteractive,
  readDirectErrors,
  resolveValidationErrorMessage,
  showErrors,
  splitByKind,
  unwrapValue,
  type ErrorDisplayStrategy,
  type ErrorReadableState,
  type SubmittedStatus,
} from '@ngx-signal-forms/toolkit';
import {
  humanizeFieldPath,
  stripAngularFormPrefix,
  type ErrorMessageRegistry,
  type FieldLabelResolver,
} from '@ngx-signal-forms/toolkit/core';

import type { CharacterCountLimitState } from './character-count.directive';

export { humanizeFieldPath };
import {
  DEFAULT_DANGER_THRESHOLD,
  DEFAULT_WARNING_THRESHOLD,
} from './character-count.directive';

type ReadSignal<T> = () => T;
type ReactiveOrStatic<T> = T | ReadSignal<T>;

// ============================================================================
// FieldState Duck-Typing Utilities
// ============================================================================

/**
 * Boolean state keys available on FieldState.
 *
 * Angular Signal Forms exposes these as `Signal<boolean>` properties.
 * We define it locally for type-safe access via duck-typing.
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
 */
export interface FieldStateFlags {
  readonly isInvalid: () => boolean;
  readonly isValid: () => boolean;
  readonly isTouched: () => boolean;
  readonly isDirty: () => boolean;
  readonly isPending: () => boolean;
}

/**
 * Creates computed boolean state flags from a field state signal.
 *
 * Eliminates the repeated pattern of 5 individual `readFieldFlag` computeds
 * found in fieldset directives and components.
 *
 * @remarks Must be called in an injection context (constructor, field
 * initializer, or `runInInjectionContext`) because it creates `computed`
 * signals internally.
 *
 * @param fieldState - A signal/computed that returns the field state object
 * @returns Object with computed signals for each boolean flag
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

// Re-exported from core for convenience
export { createUniqueId, readDirectErrors };

/**
 * Core error-state signals shared between `createErrorState()` (the
 * standalone factory) and `NgxHeadlessErrorStateDirective` (the directive
 * variant). The split on `readDirectErrors()` is intentionally the safer
 * path: it handles a field state whose `errors()` is missing or not an
 * array, which matters for tests and for custom control adapters.
 *
 * @internal
 */
interface HeadlessErrorStateCore {
  readonly errors: ReadSignal<ValidationError[]>;
  readonly warnings: ReadSignal<ValidationError[]>;
  readonly hasErrors: ReadSignal<boolean>;
  readonly hasWarnings: ReadSignal<boolean>;
  readonly errorId: ReadSignal<string>;
  readonly warningId: ReadSignal<string>;
}

/**
 * Shared builder used by both `createErrorState()` and
 * `NgxHeadlessErrorStateDirective` to derive the error/warning split,
 * presence flags, and ARIA region IDs.
 *
 * Exposed to `error-state.directive.ts` via a named export only.
 *
 * @internal
 */
export function buildHeadlessErrorState(
  fieldState: ReadSignal<unknown>,
  fieldName: ReadSignal<string>,
): HeadlessErrorStateCore {
  const split = computed(() => splitByKind(readDirectErrors(fieldState())));

  return {
    errors: computed(() => split().blocking),
    warnings: computed(() => split().warnings),
    hasErrors: computed(() => split().blocking.length > 0),
    hasWarnings: computed(() => split().warnings.length > 0),
    errorId: computed(() => generateErrorId(fieldName())),
    warningId: computed(() => generateWarningId(fieldName())),
  };
}

/**
 * Options for creating error state signals.
 */
export interface CreateErrorStateOptions<TValue = unknown> {
  /** Form field FieldTree */
  readonly field: FieldTree<TValue>;
  /** Field name for ID generation */
  readonly fieldName: ReactiveOrStatic<string>;
  /** Error display strategy (defaults to 'on-touch') */
  readonly strategy?: ReactiveOrStatic<ErrorDisplayStrategy>;
  /** Submitted status signal (optional) */
  readonly submittedStatus?: ReactiveOrStatic<SubmittedStatus | undefined>;
}

/**
 * Error state signals returned by createErrorState.
 */
export interface ErrorStateResult {
  /** Whether to show errors */
  readonly showErrors: ReadSignal<boolean>;
  /** Whether to show warnings */
  readonly showWarnings: ReadSignal<boolean>;
  /** Raw blocking errors */
  readonly errors: ReadSignal<ValidationError[]>;
  /** Raw warning errors */
  readonly warnings: ReadSignal<ValidationError[]>;
  /** Whether there are blocking errors */
  readonly hasErrors: ReadSignal<boolean>;
  /** Whether there are warnings */
  readonly hasWarnings: ReadSignal<boolean>;
  /** Generated error region ID */
  readonly errorId: ReadSignal<string>;
  /** Generated warning region ID */
  readonly warningId: ReadSignal<string>;
  /** Resolved field name */
  readonly fieldName: ReadSignal<string>;
}

/**
 * Creates error state signals for a form field.
 *
 * This utility provides the same state management as NgxHeadlessErrorStateDirective
 * but as standalone signals for programmatic use. Defaults to the 'on-touch'
 * strategy when no strategy is provided.
 *
 * ## Usage
 *
 * ```typescript
 * const formData = signal({ email: '' });
 * const emailField = form(formData, { validators: [Validators.required, Validators.email] });
 *
 * const errorState = createErrorState({
 *   field: emailField,
 *   fieldName: 'email',
 * });
 *
 * // Use in templates
 * effect(() => {
 *   if (errorState.showErrors() && errorState.hasErrors()) {
 *     console.log('Errors:', errorState.errors());
 *   }
 * });
 * ```
 *
 * @remarks
 * **Why `showWarnings` aliases `showErrors`:** toolkit warnings are
 * `ValidationError`s with `kind: 'warn:*'` produced by the same validator
 * pipeline as blocking errors. Angular Signal Forms sees them as regular
 * errors and marks `field.invalid() === true` regardless of the `warn:`
 * prefix; the toolkit only splits them later via `splitByKind()` /
 * `isWarningError()` from `@ngx-signal-forms/toolkit` core. Because the
 * `invalid()` gate is shared, the same `shouldShowErrors(strategy, status)`
 * decision applies to both surfaces — routing them through one signal is
 * intentional. Consumers that need to show warnings on a field that is
 * otherwise valid would need a non-invalidating validation channel, which
 * Angular does not currently expose.
 *
 * @see {@link splitByKind} and {@link isWarningError} for the warning
 *   convention.
 */
export function createErrorState<TValue = unknown>(
  options: Readonly<CreateErrorStateOptions<TValue>>,
): ErrorStateResult {
  const { field, fieldName, strategy, submittedStatus } = options;

  const fieldState = computed(() => field());

  const resolvedFieldName = computed(() => unwrapValue(fieldName));

  const resolvedStrategy = computed<ErrorDisplayStrategy>(() => {
    if (strategy !== undefined) {
      const resolved = unwrapValue(strategy);
      if (resolved !== 'inherit') {
        return resolved;
      }
    }

    return 'on-touch';
  });

  const resolvedSubmittedStatus = computed<SubmittedStatus | undefined>(() => {
    if (submittedStatus !== undefined) {
      return unwrapValue(submittedStatus);
    }
    return undefined;
  });

  const showErrorsSignal = showErrors(
    fieldState,
    resolvedStrategy,
    resolvedSubmittedStatus,
  );

  const core = buildHeadlessErrorState(fieldState, resolvedFieldName);

  return {
    showErrors: showErrorsSignal,
    showWarnings: showErrorsSignal,
    ...core,
    fieldName: resolvedFieldName,
  };
}

/**
 * Options for creating character count signals.
 */
export interface CreateCharacterCountOptions {
  /** Form field for string value */
  readonly field: FieldTree<string | null | undefined>;
  /** Maximum length for the character count */
  readonly maxLength: ReactiveOrStatic<number>;
  /** Warning threshold (0-1), default 0.8 */
  readonly warningThreshold?: ReactiveOrStatic<number>;
  /** Danger threshold (0-1), default 0.95 */
  readonly dangerThreshold?: ReactiveOrStatic<number>;
}

/**
 * Character count signals returned by createCharacterCount.
 */
export interface CharacterCountResult {
  /** Current value length */
  readonly currentLength: ReadSignal<number>;
  /** Resolved maximum length */
  readonly resolvedMaxLength: ReadSignal<number>;
  /** Remaining characters until limit */
  readonly remaining: ReadSignal<number>;
  /** Current limit state */
  readonly limitState: ReadSignal<CharacterCountLimitState>;
  /** Whether the limit has been exceeded */
  readonly isExceeded: ReadSignal<boolean>;
  /** Percentage of limit used (0-100+) */
  readonly percentUsed: ReadSignal<number>;
}

/**
 * Creates character count signals for a form field.
 *
 * This utility provides the same state management as NgxHeadlessCharacterCountDirective
 * but as standalone signals for programmatic use.
 *
 * ## Usage
 *
 * ```typescript
 * const formData = signal({ bio: '' });
 * const bioField = form(formData, { validators: [] });
 *
 * const charCount = createCharacterCount({
 *   field: bioField,
 *   maxLength: 500,
 *   warningThreshold: 0.8,
 *   dangerThreshold: 0.95,
 * });
 *
 * // Use in templates
 * effect(() => {
 *   console.log(`${charCount.currentLength()} / ${charCount.resolvedMaxLength()}`);
 *   console.log(`State: ${charCount.limitState()}`);
 * });
 * ```
 */
export function createCharacterCount(
  options: Readonly<CreateCharacterCountOptions>,
): CharacterCountResult {
  const {
    field,
    maxLength,
    warningThreshold = DEFAULT_WARNING_THRESHOLD,
    dangerThreshold = DEFAULT_DANGER_THRESHOLD,
  } = options;

  const fieldState = computed(() => field());

  const currentLength = computed(() => {
    const state = fieldState();
    const value = state.value();
    return typeof value === 'string' ? value.length : 0;
  });

  const resolvedMaxLength = computed(() => unwrapValue(maxLength));

  const remaining = computed(() => resolvedMaxLength() - currentLength());

  const percentUsed = computed(() => {
    const max = resolvedMaxLength();
    if (max === 0) return 0;
    return (currentLength() / max) * 100;
  });

  const isExceeded = computed(() => remaining() < 0);

  const limitState = computed<CharacterCountLimitState>(() => {
    const max = resolvedMaxLength();
    const current = currentLength();
    const ratio = current / max;

    if (ratio > 1) return 'exceeded';

    const danger = unwrapValue(dangerThreshold);
    if (ratio >= danger) return 'danger';

    const warning = unwrapValue(warningThreshold);
    if (ratio >= warning) return 'warning';

    return 'ok';
  });

  return {
    currentLength,
    resolvedMaxLength,
    remaining,
    limitState,
    isExceeded,
    percentUsed,
  };
}

// ============================================================================
// Error Summary Entry Utilities
// ============================================================================

/**
 * A resolved error-summary entry ready for rendering.
 */
export interface ErrorSummaryEntryData {
  readonly kind: string;
  readonly message: string;
  readonly fieldName: string;
  readonly focus: () => void;
}

/**
 * Duck-typed access to `ValidationError.WithFieldTree` properties.
 *
 * Angular Signal Forms' `errorSummary()` returns errors with an optional
 * `fieldTree` reference, but the public `ValidationError` type doesn't
 * include it. This type bridges the gap via duck-typing.
 */
type ValidationErrorWithFieldTree = ValidationError & {
  fieldTree?: () =>
    | {
        name?: () => string;
        focusBoundControl?: (options?: Readonly<FocusOptions>) => void;
      }
    | undefined;
};

/**
 * Resolve the field name from a `ValidationError` via duck-typed access
 * to `error.fieldTree().name()`.
 *
 * Falls back to the error's `kind` when the field tree is not available.
 *
 * @param error - The validation error to extract a field name from
 * @param resolver - Optional custom resolver; receives the field path
 *   **without** the Angular internal prefix. Falls back to
 *   `humanizeFieldPath` when `undefined`.
 *
 * @public
 */
export function resolveFieldNameFromError(
  error: ValidationError,
  resolver?: FieldLabelResolver | null,
): string {
  const resolve = resolver ?? humanizeFieldPath;

  const e = error as ValidationErrorWithFieldTree;
  if (typeof e.fieldTree === 'function') {
    const fieldState = e.fieldTree();
    if (fieldState && typeof fieldState.name === 'function') {
      const stripped = stripAngularFormPrefix(fieldState.name());
      return resolve(stripped);
    }
  }

  return resolve(error.kind);
}

/**
 * Focus the form control bound to the field that produced a validation error.
 *
 * Uses duck-typed access to `error.fieldTree().focusBoundControl()`.
 *
 * @public
 */
export function focusBoundControlFromError(error: ValidationError): void {
  const e = error as ValidationErrorWithFieldTree;
  if (typeof e.fieldTree === 'function') {
    const fieldState = e.fieldTree();
    if (fieldState && typeof fieldState.focusBoundControl === 'function') {
      fieldState.focusBoundControl();
    }
  }
}

/**
 * Maps a `ValidationError` into an `ErrorSummaryEntryData` with resolved
 * message, field name, and focus callback.
 *
 * @param error - The validation error to map
 * @param registry - Error message registry for 3-tier message resolution
 * @param options - Settings (e.g. `{ stripWarningPrefix: true }`)
 * @param labelResolver - Optional field-label resolver; falls back to
 *   `humanizeFieldPath` when `undefined`
 *
 * @public
 */
export function toErrorSummaryEntry(
  error: ValidationError,
  registry?: Readonly<ErrorMessageRegistry> | null,
  options?: Readonly<{ stripWarningPrefix?: boolean }>,
  labelResolver?: FieldLabelResolver | null,
): ErrorSummaryEntryData {
  const message = resolveValidationErrorMessage(error, registry, options);
  const fieldName = resolveFieldNameFromError(error, labelResolver);

  return {
    kind: error.kind,
    message,
    fieldName,
    focus: () => {
      focusBoundControlFromError(error);
    },
  };
}
