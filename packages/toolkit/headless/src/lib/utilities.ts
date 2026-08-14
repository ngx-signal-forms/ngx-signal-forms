import { computed, type Injector, type Signal } from '@angular/core';
import type { FieldTree, ValidationError } from '@angular/forms/signals';
import {
  createErrorVisibility,
  createUniqueId,
  readDirectErrors,
  resolveValidationErrorMessage,
  splitByKind,
  unwrapValue,
  type ErrorDisplayStrategy,
  type SubmittedStatus,
} from '@ngx-signal-forms/toolkit';
import {
  assertInjector,
  createCharacterCountLengthSignal,
  createFieldMessageIdSignals,
  humanizeFieldPath,
  type ErrorMessageRegistry,
  type FieldLabelResolver,
} from '@ngx-signal-forms/toolkit/core';

export { humanizeFieldPath };
import { buildHeadlessContext } from './build-headless-context';
import {
  DEFAULT_DANGER_THRESHOLD,
  DEFAULT_WARNING_THRESHOLD,
  type CharacterCountLimitState,
  type CharacterCountValue,
} from './character-count-types';
// Error-summary mapping utilities live in their own module (issue #354);
// re-exported below so the public barrel — which imports everything from
// `./lib/utilities` — keeps resolving unchanged.
import {
  dedupeValidationErrorsByField,
  toErrorSummaryEntry,
  type ErrorSummaryEntryData,
} from './error-summary-utilities';
export {
  dedupeValidationErrorsByField,
  focusBoundControlFromError,
  resolveFieldNameFromError,
  toErrorSummaryEntry,
  type ErrorSummaryEntryData,
} from './error-summary-utilities';
// Field-state duck-typing utilities live in their own module (issue #354);
// re-exported below for the same reason.
import { isErrorOnInteractiveField, readErrors } from './field-state-utilities';
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
 * unchanged) so both `createFieldsetAggregation()` here and
 * `NgxHeadlessErrorState` share one definition. Mirrors the
 * `CharacterCountValue` re-export above for the same reason: the type moved,
 * the public export path did not.
 */
export interface ResolvedError {
  readonly kind: string;
  readonly message: string;
}

// Re-exported so the public barrel's `export { type CharacterCountValue }
// from './lib/utilities'` keeps resolving after the type moved to the
// shared character-count-types module (see that file's docblock for why).
export type { CharacterCountValue };

type ReadSignal<T> = () => T;
type ReactiveOrStatic<T> = T | ReadSignal<T>;

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
 * standalone factory) and `NgxHeadlessErrorState` (the directive
 * variant). The split on `readDirectErrors()` is intentionally the safer
 * path: it handles a field state whose `errors()` is missing or not an
 * array, which matters for tests and for custom control adapters.
 *
 * @internal
 */
interface HeadlessErrorStateCore {
  readonly errors: Signal<readonly ValidationError[]>;
  readonly warnings: Signal<readonly ValidationError[]>;
  readonly hasErrors: Signal<boolean>;
  readonly hasWarnings: Signal<boolean>;
  readonly errorId: Signal<string | null>;
  readonly warningId: Signal<string | null>;
}

/**
 * Shared builder used by both `createErrorState()` and
 * `NgxHeadlessErrorState` to derive the error/warning split,
 * presence flags, and ARIA region IDs.
 *
 * Exposed to `error-state.ts` via a named export only.
 *
 * When `errorsOverride` is provided and returns a defined array, that array
 * replaces the field-based error extraction entirely. This enables the
 * `NgxFormFieldError.errors` direct-input mode (pre-aggregated errors from
 * fieldsets) to flow through the same split/resolution pipeline as
 * field-derived errors.
 *
 * @internal
 */
export function buildHeadlessErrorState(
  fieldState: ReadSignal<unknown>,
  fieldName: ReadSignal<string | null>,
  errorsOverride?: ReadSignal<readonly ValidationError[] | undefined>,
): HeadlessErrorStateCore {
  const split = computed(() => {
    const override = errorsOverride?.();
    return override === undefined
      ? splitByKind(readDirectErrors(fieldState()))
      : splitByKind(override);
  });

  const ids = createFieldMessageIdSignals(fieldName);

  return {
    errors: computed(() => split().blocking),
    warnings: computed(() => split().warnings),
    hasErrors: computed(() => split().blocking.length > 0),
    hasWarnings: computed(() => split().warnings.length > 0),
    errorId: ids.errorId,
    warningId: ids.warningId,
  };
}

/**
 * Options for creating error state signals.
 */
export interface CreateErrorStateOptions<TValue = unknown> {
  /** Form field FieldTree */
  readonly field: FieldTree<TValue>;
  /** Field name for ID generation. `null` disables ID generation. */
  readonly fieldName: ReactiveOrStatic<string | null>;
  /**
   * Error display strategy override.
   *
   * Resolution order: this option (when not `'inherit'`) → ambient
   * `NGX_SIGNAL_FORM_CONTEXT.errorStrategy` → the global
   * `NGX_SIGNAL_FORMS_CONFIG.defaultErrorStrategy` → `'on-touch'`. This
   * mirrors `NgxHeadlessFieldset.resolvedStrategy`'s cascade so config-level
   * defaults apply consistently across headless surfaces even outside a
   * form context.
   */
  readonly strategy?: ReactiveOrStatic<ErrorDisplayStrategy>;
  /**
   * Submitted status override.
   *
   * Resolution order: this option (when not `undefined`) → ambient
   * `NGX_SIGNAL_FORM_CONTEXT.submittedStatus` → `undefined`.
   */
  readonly submittedStatus?: ReactiveOrStatic<SubmittedStatus | undefined>;
  /**
   * Optional injector for use outside an Angular injection context (e.g.
   * unit tests, `runInInjectionContext` wrappers). When omitted the
   * function must be called inside a DI context. Mirrors the `injector`
   * escape hatch on the sibling factories `createErrorVisibility()` and
   * `createErrorMessageSignal()`.
   */
  // Angular's Injector is inherently mutable; Readonly<Injector> is not practical here.
  // oxlint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Angular's Injector is mutable by design
  readonly injector?: Injector;
}

/**
 * Error state signals returned by createErrorState.
 */
export interface ErrorStateResult {
  /** Whether to show errors */
  readonly shouldShowErrors: Signal<boolean>;
  /** Whether to show warnings */
  readonly shouldShowWarnings: Signal<boolean>;
  /** Raw blocking errors */
  readonly errors: Signal<readonly ValidationError[]>;
  /** Raw warning errors */
  readonly warnings: Signal<readonly ValidationError[]>;
  /** Whether there are blocking errors */
  readonly hasErrors: Signal<boolean>;
  /** Whether there are warnings */
  readonly hasWarnings: Signal<boolean>;
  /** Generated error region ID, or `null` when no fieldName is resolvable */
  readonly errorId: Signal<string | null>;
  /** Generated warning region ID, or `null` when no fieldName is resolvable */
  readonly warningId: Signal<string | null>;
  /** Resolved field name */
  readonly fieldName: Signal<string | null>;
}

/**
 * Creates error state signals for a form field.
 *
 * This utility provides the same state management as NgxHeadlessErrorState
 * but as standalone signals for programmatic use. When no `strategy` is
 * provided, it resolves from the ambient `NGX_SIGNAL_FORM_CONTEXT` (installed
 * by the parent form host directive, `NgxSignalForm` on
 * `form[formRoot][ngxSignalForm]`) and falls back to `'on-touch'`. The same
 * precedence applies to `submittedStatus`.
 *
 * ## Usage
 *
 * ```typescript
 * const formData = signal({ email: '' });
 * const contactForm = form(
 *   formData,
 *   schema((path) => {
 *     required(path.email);
 *     email(path.email);
 *   }),
 * );
 *
 * const errorState = createErrorState({
 *   field: contactForm.email,
 *   fieldName: 'email',
 * });
 *
 * // Use in templates
 * effect(() => {
 *   if (errorState.shouldShowErrors() && errorState.hasErrors()) {
 *     console.log('Errors:', errorState.errors());
 *   }
 * });
 * ```
 *
 * @remarks
 * **Injection context required, unless `options.injector` is passed.** This
 * factory creates `computed()` signals internally, so by default it must be
 * called inside an injection context (constructor, field initializer, or
 * `runInInjectionContext`). Pass `options.injector` to call it imperatively
 * outside one (tests, services) — mirrors the `injector` escape hatch on
 * `createErrorVisibility()` / `createErrorMessageSignal()`.
 *
 * @remarks
 * **Why `showWarnings` aliases `createShowErrorsComputed`'s result:** toolkit warnings are
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
  return assertInjector(createErrorState, options.injector, () =>
    createErrorStateInternal(options),
  );
}

function createErrorStateInternal<TValue = unknown>(
  options: Readonly<CreateErrorStateOptions<TValue>>,
): ErrorStateResult {
  const { field, fieldName, strategy, submittedStatus } = options;

  // Falls back to the global `defaultErrorStrategy` config (same cascade
  // `NgxHeadlessFieldset` applies) when neither an explicit `strategy` nor a
  // form context is present, keeping standalone usage consistent regardless
  // of which headless surface a consumer reaches for.
  const { config } = buildHeadlessContext();

  const fieldState = computed(() => field());

  const resolvedFieldName = computed(() => unwrapValue(fieldName));

  // Routes strategy + submitted-status resolution and the visibility
  // computed itself through the shared `createErrorVisibility` seam
  // (ADR-0006) instead of re-inlining `resolveStrategyFromContext` →
  // `resolveSubmittedStatusFromContext` → `createShowErrorsComputed`.
  //
  // `strategy`/`submittedStatus` are `ReactiveOrStatic<T>` (this file's own
  // signal-or-plain-function-or-value union), which also accepts a bare
  // `() => T` reader — a shape `createErrorVisibility`'s `Signal<T>`-typed
  // options don't structurally accept. Normalize through `computed()` so
  // both a real Signal and a plain reader unwrap the same way.
  const showErrorsSignal = createErrorVisibility(fieldState, {
    strategy:
      strategy === undefined
        ? undefined
        : computed(() => unwrapValue(strategy)),
    submittedStatus:
      submittedStatus === undefined
        ? undefined
        : computed(() => unwrapValue(submittedStatus)),
    configDefault: config.defaultErrorStrategy,
  });

  const core = buildHeadlessErrorState(fieldState, resolvedFieldName);

  return {
    shouldShowErrors: showErrorsSignal,
    shouldShowWarnings: showErrorsSignal,
    ...core,
    fieldName: resolvedFieldName,
  };
}

/**
 * Options for creating character count signals.
 */
export interface CreateCharacterCountOptions {
  /** Form field producing a {@link CharacterCountValue}. */
  readonly field: FieldTree<CharacterCountValue>;
  /** Maximum length for the character count */
  readonly maxLength: ReactiveOrStatic<number>;
  /** Warning threshold (0-1), default 0.8 */
  readonly warningThreshold?: ReactiveOrStatic<number>;
  /** Danger threshold (0-1), default 0.95 */
  readonly dangerThreshold?: ReactiveOrStatic<number>;
  /**
   * Name reported in the unsupported-value-type dev warning, e.g.
   * `[ngx-signal-forms] <component>: unsupported value type — …`. Lets a
   * delegating caller (`NgxHeadlessCharacterCount`) report its own name
   * instead of `'createCharacterCount'`, since the message text is asserted
   * in specs on both sides.
   *
   * @default 'createCharacterCount'
   */
  readonly component?: string;
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
  /** Whether a limit is configured. `maxLength` is required, so this is
   * always `true` — retained for API symmetry with
   * `NgxHeadlessCharacterCount.hasLimit`. */
  readonly hasLimit: Signal<boolean>;
  /** Whether the limit has been exceeded */
  readonly isExceeded: Signal<boolean>;
  /** Percentage of limit used (0-100+) */
  readonly percentUsed: Signal<number>;
}

/**
 * Creates character count signals for a form field.
 *
 * This utility provides the same state management as NgxHeadlessCharacterCount
 * but as standalone signals for programmatic use.
 *
 * @remarks Does not require an injection context (only creates `computed()`
 * signals internally).
 *
 * ## Usage
 *
 * ```typescript
 * const formData = signal({ bio: '' });
 * const bioField = form(formData).bio;
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
    component = 'createCharacterCount',
  } = options;

  const fieldState = computed(() => field());

  const currentLength = createCharacterCountLengthSignal(
    () => fieldState().value(),
    component,
  );

  const resolvedMaxLength = computed(() => unwrapValue(maxLength));

  const remaining = computed(() => resolvedMaxLength() - currentLength());

  const isExceeded = computed(() => remaining() < 0);

  // A non-positive limit ("no characters allowed") is handled identically here
  // to NgxHeadlessCharacterCount so the factory and directive return the same
  // values for the same inputs. Without this guard, percentUsed would go
  // negative (when max < 0) or NaN (when max === 0), and limitState would
  // disagree with isExceeded — both visible bugs in consumer UIs.
  const percentUsed = computed(() => {
    const max = resolvedMaxLength();
    if (max <= 0) return currentLength() > 0 ? 100 : 0;
    return (currentLength() / max) * 100;
  });

  const limitState = computed<CharacterCountLimitState>(() => {
    const max = resolvedMaxLength();
    const current = currentLength();

    if (max <= 0) {
      return current > 0 ? 'exceeded' : 'ok';
    }

    const ratio = current / max;

    if (ratio > 1) return 'exceeded';

    const danger = unwrapValue(dangerThreshold);
    if (ratio >= danger) return 'danger';

    const warning = unwrapValue(warningThreshold);
    if (ratio >= warning) return 'warning';

    return 'ok';
  });

  // `maxLength` is a required option, so a limit is always configured.
  // See the `hasLimit` doc above for why this member exists at all.
  const hasLimit = computed(() => true);

  return {
    currentLength,
    resolvedMaxLength,
    remaining,
    limitState,
    hasLimit,
    isExceeded,
    percentUsed,
  };
}

// ============================================================================
// Fieldset Aggregation
// ============================================================================

/**
 * Options for {@link createFieldsetAggregation}.
 *
 * `showErrors`/`showWarnings` are pre-resolved visibility signals, not raw
 * strategy inputs — per ADR-0005 (factories take DI-resolved values as
 * inputs and never call `inject()` themselves). `NgxHeadlessFieldset` keeps
 * owning the single `createErrorVisibility()`/`createShowErrorsComputed()`
 * seam call (ADR-0006) and threads the results in here; this factory only
 * combines them with the (visibility-independent) presence check.
 */
export interface CreateFieldsetAggregationOptions {
  /** Reactive reader for the fieldset's own field state (from `field()()`). */
  readonly fieldState: ReadSignal<unknown>;
  /**
   * Explicit field-list override. `null`/omitted means "not provided" —
   * aggregate `fieldState`'s own errors. See `NgxHeadlessFieldset.fields`
   * for the "not provided" vs "explicitly empty" distinction this preserves.
   */
  readonly fields?: ReactiveOrStatic<readonly FieldTree<unknown>[] | null>;
  /** Whether to aggregate nested field errors (`errorSummary()`) instead of direct ones (`errors()`). */
  readonly includeNestedErrors?: ReactiveOrStatic<boolean>;
  /** Pre-resolved blocking-error visibility (from the caller's own visibility seam call). */
  readonly showErrors: ReadSignal<boolean>;
  /** Pre-resolved warning visibility, timed independently of {@link showErrors}. */
  readonly showWarnings: ReadSignal<boolean>;
  /** Error message registry for 3-tier message resolution. */
  readonly errorMessages?: Readonly<ErrorMessageRegistry> | null;
}

/**
 * Fieldset error/warning aggregation result.
 */
export interface FieldsetAggregationResult {
  /** Aggregated and deduplicated blocking errors. */
  readonly aggregatedErrors: Signal<readonly ValidationError[]>;
  /** Aggregated and deduplicated warnings. */
  readonly aggregatedWarnings: Signal<readonly ValidationError[]>;
  /** {@link aggregatedErrors}, resolved to display messages. */
  readonly resolvedErrors: Signal<readonly ResolvedError[]>;
  /** {@link aggregatedWarnings}, resolved to display messages. */
  readonly resolvedWarnings: Signal<readonly ResolvedError[]>;
  /** Whether there are blocking errors. */
  readonly hasErrors: Signal<boolean>;
  /** Whether there are warnings. */
  readonly hasWarnings: Signal<boolean>;
  /** `showErrors() && hasErrors()`. */
  readonly shouldShowErrors: Signal<boolean>;
  /** `showWarnings() && hasWarnings()`. */
  readonly shouldShowWarnings: Signal<boolean>;
}

/**
 * Aggregates, deduplicates, and resolves field/warning errors for a
 * fieldset-shaped surface.
 *
 * Extracted from `NgxHeadlessFieldset`, which used to inline this pipeline
 * (issue #351). Deliberately pure — no `inject()` calls — so it is testable
 * with plain signal mocks and no `TestBed`, matching the other headless
 * factories (`createFieldStateFlags`, `createCharacterCount`). Visibility
 * timing is NOT resolved here; callers pass already-resolved `showErrors`/
 * `showWarnings` signals from their own `createErrorVisibility()` /
 * `createShowErrorsComputed()` call (ADR-0006's single seam).
 *
 * @remarks Does not require an injection context.
 */
export function createFieldsetAggregation(
  options: Readonly<CreateFieldsetAggregationOptions>,
): FieldsetAggregationResult {
  const {
    fieldState,
    fields,
    includeNestedErrors,
    showErrors,
    showWarnings,
    errorMessages,
  } = options;

  const allMessages = computed(() => {
    const override = fields === undefined ? null : unwrapValue(fields);
    const readFn = unwrapValue(includeNestedErrors ?? false)
      ? readErrors
      : readDirectErrors;

    // `null` means "not provided" → aggregate `fieldState`'s own errors. An
    // explicitly bound `[]` means "provided but empty" → aggregate nothing.
    if (override !== null) {
      const messages = override.flatMap((field) => readFn(field()));
      return dedupeValidationErrors(messages);
    }

    return dedupeValidationErrors(readFn(fieldState()));
  });

  const split = computed(() => splitByKind(allMessages()));

  const aggregatedErrors = computed(() => split().blocking);
  const aggregatedWarnings = computed(() => split().warnings);
  const hasErrors = computed(() => split().blocking.length > 0);
  const hasWarnings = computed(() => split().warnings.length > 0);

  const toResolved = (error: ValidationError): ResolvedError => ({
    kind: error.kind,
    message: resolveErrorMessage(error, errorMessages),
  });

  const resolvedErrors = computed(() => aggregatedErrors().map(toResolved));
  const resolvedWarnings = computed(() => aggregatedWarnings().map(toResolved));

  const shouldShowErrors = computed(() => showErrors() && hasErrors());
  const shouldShowWarnings = computed(() => showWarnings() && hasWarnings());

  return {
    aggregatedErrors,
    aggregatedWarnings,
    resolvedErrors,
    resolvedWarnings,
    hasErrors,
    hasWarnings,
    shouldShowErrors,
    shouldShowWarnings,
  };
}

// ============================================================================
// Error Summary Entry Utilities
// ============================================================================
//
// The per-error mapping functions (`toErrorSummaryEntry`,
// `resolveFieldNameFromError`, `focusBoundControlFromError`,
// `dedupeValidationErrorsByField`) and the `ErrorSummaryEntryData` type live
// in `./error-summary-utilities` (issue #354) — imported above and
// re-exported from there. `createErrorSummaryEntries` below is the
// aggregation *pipeline* that composes them; it stays here with the other
// factories per ADR-0005/#351.

/**
 * Resolve a validation error's display message using the toolkit's standard
 * settings (`stripWarningPrefix: true` by default).
 *
 * Shared by `NgxHeadlessErrorState` and `createErrorMessageSignal` so that
 * both surfaces stay in lockstep — changing message resolution behaviour
 * requires editing exactly one place.
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

const STRIP_WARNING_PREFIX_OPTION = { stripWarningPrefix: true } as const;

/**
 * Options for {@link createErrorSummaryEntries}.
 *
 * `showErrors` is a pre-resolved visibility signal, not a raw strategy
 * input — mirrors {@link CreateFieldsetAggregationOptions}'s contract
 * (ADR-0005: factories take DI-resolved values as inputs, never `inject()`
 * themselves).
 */
export interface CreateErrorSummaryEntriesOptions {
  /** Reactive reader for the root field state (from `formTree()()`). */
  readonly fieldState: ReadSignal<unknown>;
  /** Pre-resolved visibility, shared by both the error and warning channel. */
  readonly showErrors: ReadSignal<boolean>;
  /** Error message registry for 3-tier message resolution. */
  readonly errorMessages?: Readonly<ErrorMessageRegistry> | null;
  /** Optional field-label resolver; falls back to `humanizeFieldPath`. */
  readonly labelResolver?: FieldLabelResolver | null;
}

/**
 * Error-summary entry-mapping result.
 */
export interface ErrorSummaryEntriesResult {
  /** Resolved blocking error entries ready for rendering. */
  readonly entries: Signal<readonly ErrorSummaryEntryData[]>;
  /** Resolved warning entries. */
  readonly warningEntries: Signal<readonly ErrorSummaryEntryData[]>;
  /** Whether there are any blocking errors. */
  readonly hasErrors: Signal<boolean>;
  /** Whether there are any warnings. */
  readonly hasWarnings: Signal<boolean>;
  /** `showErrors() && hasErrors()`. */
  readonly shouldShow: Signal<boolean>;
  /** `showErrors() && hasWarnings()`. */
  readonly shouldShowWarnings: Signal<boolean>;
}

/**
 * Builds the `errorSummary()` entry-mapping pipeline: read → filter out
 * non-interactive (hidden/disabled) fields → dedupe per field → split by
 * kind → map to focusable {@link ErrorSummaryEntryData} entries.
 *
 * Extracted from `NgxHeadlessErrorSummary`, which used to inline this
 * pipeline (issue #351). Deliberately pure — no `inject()` calls — so it is
 * testable with plain signal mocks and no `TestBed`, matching the other
 * headless factories (`createFieldStateFlags`, `createCharacterCount`,
 * `createFieldsetAggregation`).
 *
 * @remarks Does not require an injection context.
 */
export function createErrorSummaryEntries(
  options: Readonly<CreateErrorSummaryEntriesOptions>,
): ErrorSummaryEntriesResult {
  const { fieldState, showErrors, errorMessages, labelResolver } = options;

  const split = computed(() => {
    const visibleErrors = readErrors(fieldState()).filter(
      (error: ValidationError) => isErrorOnInteractiveField(error),
    );
    return splitByKind(dedupeValidationErrorsByField(visibleErrors));
  });

  const entries = computed(() =>
    split().blocking.map((error) =>
      toErrorSummaryEntry(error, errorMessages, undefined, labelResolver),
    ),
  );

  const warningEntries = computed(() =>
    split().warnings.map((error) =>
      toErrorSummaryEntry(
        error,
        errorMessages,
        STRIP_WARNING_PREFIX_OPTION,
        labelResolver,
      ),
    ),
  );

  const hasErrors = computed(() => split().blocking.length > 0);
  const hasWarnings = computed(() => split().warnings.length > 0);

  const shouldShow = computed(() => showErrors() && hasErrors());
  const shouldShowWarnings = computed(() => showErrors() && hasWarnings());

  return {
    entries,
    warningEntries,
    hasErrors,
    hasWarnings,
    shouldShow,
    shouldShowWarnings,
  };
}
