import { computed, type Signal } from '@angular/core';
import type {
  FieldState,
  FieldTree,
  ValidationError,
} from '@angular/forms/signals';
import {
  createUniqueId as createCoreUniqueId,
  generateErrorId,
  generateWarningId,
  isBlockingError,
  isWarningError,
  showErrors,
  unwrapValue,
  type ErrorDisplayStrategy,
  type ReactiveOrStatic,
  type SubmittedStatus,
} from '@ngx-signal-forms/toolkit';

import type { CharacterCountLimitState } from './character-count.directive';
import {
  DEFAULT_DANGER_THRESHOLD,
  DEFAULT_WARNING_THRESHOLD,
} from './character-count.directive';

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
  invalid?: () => boolean;
  valid?: () => boolean;
  touched?: () => boolean;
  dirty?: () => boolean;
  pending?: () => boolean;
  errorSummary?: () => ValidationError[];
  errors?: () => ValidationError[];
};

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

  const fn = (state as Record<BooleanStateKey, (() => boolean) | undefined>)[
    key
  ];
  return typeof fn === 'function' ? fn() : false;
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
    return summary() ?? [];
  }

  const errors = (state as FieldStateLike).errors;
  if (typeof errors === 'function') {
    return errors() ?? [];
  }

  return [];
}

/**
 * Read only direct errors from FieldState (excludes nested field errors).
 *
 * Unlike `readErrors()` which uses `errorSummary()`, this only reads
 * the direct `errors()` on the field itself. Use this when nested fields
 * display their own errors and you only want group-level validation.
 *
 * @param state - The field state object (from `fieldTree()`)
 * @returns Array of ValidationError directly on this field, empty if not accessible
 *
 * @example
 * ```typescript
 * const addressState = addressField();
 * const groupErrors = readDirectErrors(addressState); // Only cross-field validations
 * ```
 */
export function readDirectErrors(state: unknown): ValidationError[] {
  if (!state || typeof state !== 'object') {
    return [];
  }

  const errors = (state as FieldStateLike).errors;
  if (typeof errors === 'function') {
    return errors() ?? [];
  }

  return [];
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
  errors: ValidationError[],
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
 * Generate a unique ID with the given prefix.
 *
 * Creates sequential IDs like "field-1", "fieldset-2", etc.
 * Useful for generating stable IDs when explicit IDs aren't provided.
 *
 * @param prefix - Prefix for the ID (e.g., "field", "fieldset")
 * @returns Unique ID string
 *
 * @example
 * ```typescript
 * const id1 = createUniqueId('field'); // "field-1"
 * const id2 = createUniqueId('field'); // "field-2"
 * const id3 = createUniqueId('fieldset'); // "fieldset-3"
 * ```
 */
export function createUniqueId(prefix: string): string {
  return createCoreUniqueId(prefix);
}

/**
 * Options for creating error state signals.
 */
export interface CreateErrorStateOptions<TValue = unknown> {
  /** Form field FieldTree */
  field: FieldTree<TValue>;
  /** Field name for ID generation */
  fieldName: ReactiveOrStatic<string>;
  /** Error display strategy (defaults to 'on-touch') */
  strategy?: ReactiveOrStatic<ErrorDisplayStrategy>;
  /** Submitted status signal (optional) */
  submittedStatus?: ReactiveOrStatic<SubmittedStatus | undefined>;
}

/**
 * Error state signals returned by createErrorState.
 */
export interface ErrorStateResult {
  /** Whether to show errors */
  readonly showErrors: Signal<boolean>;
  /** Whether to show warnings */
  readonly showWarnings: Signal<boolean>;
  /** Raw blocking errors */
  readonly errors: Signal<ValidationError[]>;
  /** Raw warning errors */
  readonly warnings: Signal<ValidationError[]>;
  /** Whether there are blocking errors */
  readonly hasErrors: Signal<boolean>;
  /** Whether there are warnings */
  readonly hasWarnings: Signal<boolean>;
  /** Generated error region ID */
  readonly errorId: Signal<string>;
  /** Generated warning region ID */
  readonly warningId: Signal<string>;
  /** Resolved field name */
  readonly fieldName: Signal<string>;
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
 */
export function createErrorState<TValue = unknown>(
  options: CreateErrorStateOptions<TValue>,
): ErrorStateResult {
  const { field, fieldName, strategy, submittedStatus } = options;

  const fieldState = computed(() => field() as FieldState<TValue>);

  const resolvedFieldName = computed(() => unwrapValue(fieldName));

  const resolvedStrategy = computed<ErrorDisplayStrategy>(() => {
    if (strategy !== undefined && strategy !== null) {
      const resolved = unwrapValue(strategy);
      if (resolved && resolved !== 'inherit') {
        return resolved;
      }
    }

    return 'on-touch';
  });

  const resolvedSubmittedStatus = computed<SubmittedStatus | undefined>(() => {
    if (submittedStatus !== undefined && submittedStatus !== null) {
      return unwrapValue(submittedStatus);
    }
    return undefined;
  });

  const showErrorsSignal = showErrors(
    fieldState as Signal<FieldState<TValue>>,
    resolvedStrategy,
    resolvedSubmittedStatus,
  );

  const allErrors = computed(() => fieldState().errors?.() ?? []);

  const errors = computed(() => allErrors().filter(isBlockingError));

  const warnings = computed(() => allErrors().filter(isWarningError));

  const hasErrors = computed(() => errors().length > 0);
  const hasWarnings = computed(() => warnings().length > 0);

  const errorId = computed(() => generateErrorId(resolvedFieldName()));
  const warningId = computed(() => generateWarningId(resolvedFieldName()));

  return {
    showErrors: showErrorsSignal,
    showWarnings: showErrorsSignal,
    errors,
    warnings,
    hasErrors,
    hasWarnings,
    errorId,
    warningId,
    fieldName: resolvedFieldName,
  };
}

/**
 * Options for creating character count signals.
 */
export interface CreateCharacterCountOptions {
  /** Form field for string value */
  field: FieldTree<string | null | undefined>;
  /** Maximum length for the character count */
  maxLength: ReactiveOrStatic<number>;
  /** Warning threshold (0-1), default 0.8 */
  warningThreshold?: ReactiveOrStatic<number>;
  /** Danger threshold (0-1), default 0.95 */
  dangerThreshold?: ReactiveOrStatic<number>;
}

/**
 * Character count signals returned by createCharacterCount.
 */
export interface CharacterCountResult {
  /** Current value length */
  readonly currentLength: Signal<number>;
  /** Resolved maximum length */
  readonly resolvedMaxLength: Signal<number>;
  /** Remaining characters until limit */
  readonly remaining: Signal<number>;
  /** Current limit state */
  readonly limitState: Signal<CharacterCountLimitState>;
  /** Whether the limit has been exceeded */
  readonly isExceeded: Signal<boolean>;
  /** Percentage of limit used (0-100+) */
  readonly percentUsed: Signal<number>;
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
  options: CreateCharacterCountOptions,
): CharacterCountResult {
  const {
    field,
    maxLength,
    warningThreshold = DEFAULT_WARNING_THRESHOLD,
    dangerThreshold = DEFAULT_DANGER_THRESHOLD,
  } = options;

  const fieldState = computed(
    () => field() as FieldState<string | null | undefined>,
  );

  const currentLength = computed(() => {
    const state = fieldState();
    const value = state?.value?.() ?? '';
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

    /// Exceeded only when OVER the limit, not at exactly 100%
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
