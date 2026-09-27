import {
  computed,
  Directive,
  input,
  signal,
  type Injector,
  type Signal,
} from '@angular/core';
import type { FieldTree, ValidationError } from '@angular/forms/signals';
import {
  createErrorVisibility,
  createWarningVisibility,
  readDirectErrors,
  resolveSubmittedStatusFromContext,
  splitByKind,
  unwrapValue,
  type ErrorDisplayStrategy,
  type ErrorReadableState,
  type ReactiveOrStatic,
  type SignalLike,
  type SubmittedStatus,
  type WarningDisplayStrategy,
} from '@ngx-signal-forms/toolkit';
import {
  assertInjector,
  createFieldMessageIdSignals,
} from '@ngx-signal-forms/toolkit/core';

import { buildHeadlessContext } from './build-headless-context';
import { resolveErrorMessage, type ResolvedError } from './utilities';

// Re-exported so the public barrel's `export { type ResolvedError } from
// './lib/error-state'` keeps resolving after the type moved to the shared
// `utilities.ts` module (see that file's docblock for why — it now also
// backs `createFieldsetAggregation()`'s return shape).
export type { ResolvedError };

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
 * When `errorsOverride` is provided and returns a defined array, that array
 * replaces the field-based error extraction entirely. This enables the
 * `NgxFormFieldError.errors` direct-input mode (pre-aggregated errors from
 * fieldsets) to flow through the same split/resolution pipeline as
 * field-derived errors.
 *
 * @internal
 */
export function buildHeadlessErrorState(
  fieldState: SignalLike<unknown>,
  fieldName: SignalLike<string | null>,
  errorsOverride?: SignalLike<readonly ValidationError[] | undefined>,
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
 *
 * @group Reactive Primitives
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
   * Warning display strategy override, independent of {@link strategy}.
   *
   * Resolution order: this option (when not `'inherit'`) → ambient
   * `NGX_SIGNAL_FORM_CONTEXT.warningStrategy` → the global
   * `NGX_SIGNAL_FORMS_CONFIG.defaultWarningStrategy` → `'on-touch'`. No tier
   * consults `defaultErrorStrategy`, so an ambient `'on-submit'` meant for
   * blocking errors never silently gates warnings (ADR-0007).
   */
  readonly warningStrategy?: ReactiveOrStatic<WarningDisplayStrategy>;
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
 *
 * @group Reactive Primitives
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
 * **Warnings run on their own cascade.** Toolkit warnings are
 * `ValidationError`s with `kind: 'warn:*'` produced by the same validator
 * pipeline as blocking errors, so Angular marks `field.invalid() === true`
 * for them like any other error — `invalid()` cannot tell the two channels
 * apart. `shouldShowWarnings` therefore does not reuse the error decision:
 * it runs the warning cascade (`warningStrategy` option → form context
 * `warningStrategy()` → `defaultWarningStrategy` → `'on-touch'`), gates on
 * warning *presence* from `splitByKind()` rather than on `invalid()`, and
 * stays `false` while a blocking error is visible on the same field
 * (ADR-0007).
 *
 * @see {@link splitByKind} and {@link isWarningError} for the warning
 *   convention.
 *
 * @group Reactive Primitives
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
  const { field, fieldName, strategy, warningStrategy, submittedStatus } =
    options;

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
  // `strategy`/`submittedStatus` are core's `ReactiveOrStatic<T>`
  // (signal-or-plain-function-or-value union), which also accepts a bare
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

  // The warning channel gets its own seam call (ADR-0006) running the warning
  // cascade of ADR-0007, so an ambient `'on-submit'` error strategy no longer
  // holds a weak-password warning back until submit. Presence comes from the
  // split (`core.hasWarnings`) rather than `invalid()`, and a blocking error
  // that is actually on screen owns the message region until it clears.
  const showWarningsSignal = createWarningVisibility(fieldState, {
    strategy:
      warningStrategy === undefined
        ? undefined
        : computed(() => unwrapValue(warningStrategy)),
    submittedStatus:
      submittedStatus === undefined
        ? undefined
        : computed(() => unwrapValue(submittedStatus)),
    configDefault: config.defaultWarningStrategy,
    hasWarnings: core.hasWarnings,
    errorVisibility: () => showErrorsSignal() && core.hasErrors(),
  });

  return {
    shouldShowErrors: showErrorsSignal,
    shouldShowWarnings: showWarningsSignal,
    ...core,
    fieldName: resolvedFieldName,
  };
}

/**
 * Error state signals exposed by the headless directive.
 *
 * These signals provide all the state needed for custom error display implementations.
 *
 * @group Directives
 */
export interface ErrorStateSignals {
  /** Whether to show errors based on the current strategy */
  readonly shouldShowErrors: Signal<boolean>;
  /** Whether to show warnings based on the current strategy */
  readonly shouldShowWarnings: Signal<boolean>;
  /** Raw blocking errors from the field */
  readonly errors: Signal<readonly ValidationError[]>;
  /** Raw warning errors from the field */
  readonly warnings: Signal<readonly ValidationError[]>;
  /** Resolved errors with messages */
  readonly resolvedErrors: Signal<readonly ResolvedError[]>;
  /** Resolved warnings with messages */
  readonly resolvedWarnings: Signal<readonly ResolvedError[]>;
  /** Whether the field has blocking errors */
  readonly hasErrors: Signal<boolean>;
  /** Whether the field has warnings */
  readonly hasWarnings: Signal<boolean>;
  /** Generated error ID for aria-describedby, or `null` when no fieldName is resolvable */
  readonly errorId: Signal<string | null>;
  /** Generated warning ID for aria-describedby, or `null` when no fieldName is resolvable */
  readonly warningId: Signal<string | null>;
}

/**
 * Headless error state directive for custom error display implementations.
 *
 * Extracts error state logic from `NgxFormFieldError` into a renderless
 * directive that exposes signals for custom templates.
 *
 * ## Features
 *
 * - **Renderless**: No template output - use with custom templates
 * - **Strategy-aware**: Respects error display strategy (on-touch, immediate, etc.)
 * - **Warning support**: Separates blocking errors from non-blocking warnings
 * - **Message resolution**: 3-tier message priority (validator, registry, default)
 * - **ARIA IDs**: Auto-generates error/warning IDs for accessibility
 *
 * ## Usage
 *
 * ```html
 * <div
 *   ngxHeadlessErrorState
 *   #errorState="errorState"
 *   [field]="form.email"
 *   fieldName="email"
 * >
 *   @if (errorState.shouldShowErrors() && errorState.hasErrors()) {
 *     <my-custom-error-display [errors]="errorState.resolvedErrors()" />
 *   }
 * </div>
 * ```
 *
 * ## With Form Context (for on-submit strategy)
 *
 * ```html
 * <form [formRoot]="form" ngxSignalForm errorStrategy="on-submit">
 *   <div ngxHeadlessErrorState #errorState="errorState" [field]="form.email" fieldName="email">
 *     @if (errorState.shouldShowErrors()) {
 *       @for (error of errorState.resolvedErrors(); track error.kind) {
 *         <span class="error">{{ error.message }}</span>
 *       }
 *     }
 *   </div>
 * </form>
 * ```
 *
 * @template TValue The type of the field value
 *
 * @group Directives
 */
@Directive({
  selector: '[ngxHeadlessErrorState]',
  exportAs: 'errorState',
})
export class NgxHeadlessErrorState<
  TValue = unknown,
> implements ErrorStateSignals {
  readonly #context = buildHeadlessContext();
  readonly #injectedContext = this.#context.formContext;
  readonly #errorMessagesRegistry = this.#context.errorMessagesRegistry;
  readonly #config = this.#context.config;

  /**
   * Bridged field-state signal, set by host components that cannot forward
   * their `[formField]` input via `hostDirectives` inputs (because
   * `[formField]` conflicts with Angular's `FormField` directive selector).
   *
   * Host components call `connectFieldState()` in their constructor to
   * provide a reactive signal of the current field state
   * (`Partial<ErrorReadableState> | null | undefined`), not the `FieldTree`
   * itself, so this directive can compute strategy-based visibility and
   * error-split. `null` until connected.
   */
  readonly #bridgedFieldState = signal<Signal<
    Partial<ErrorReadableState> | null | undefined
  > | null>(null);

  /**
   * The Signal Forms field to track error state for.
   *
   * Optional when `errorsOverride` is provided (direct-errors mode) or when
   * the host component calls `connectFieldState()`. When neither is supplied
   * the directive renders as an empty, always-visible shell — the host
   * component controls visibility via its own conditions.
   */
  readonly field = input<FieldTree<TValue>>();

  /**
   * The field name for generating error/warning IDs.
   * Pass `null` (or omit) to disable ID generation (e.g. when the field name
   * cannot be resolved yet).
   *
   * @default null
   */
  readonly fieldName = input<string | null>(null);

  /**
   * Error display strategy override.
   * If undefined, inherits from form context or defaults to 'on-touch'.
   */
  readonly strategy = input<ErrorDisplayStrategy | undefined>();

  /**
   * Warning display strategy override, independent of {@link strategy}.
   *
   * Cascade: this input → form context `warningStrategy()` →
   * `NGX_SIGNAL_FORMS_CONFIG.defaultWarningStrategy` → `'on-touch'`. No tier
   * consults `defaultErrorStrategy`.
   */
  readonly warningStrategy = input<WarningDisplayStrategy | undefined>();

  /**
   * Form submission status (optional).
   * Only needed for 'on-submit' strategy.
   */
  readonly submittedStatus = input<SubmittedStatus | undefined>();

  /**
   * Pre-aggregated errors that replace field-based error extraction.
   *
   * Accepts a plain array or a reactive source (`Signal<…>` / `() => …`) —
   * unwrapped internally via {@link unwrapValue}. When provided, errors and
   * warnings are derived from this value rather than from `field`. Useful
   * for fieldsets or custom components that compute their own error lists
   * (e.g. `NgxFormFieldset.filteredErrorsSignal`). In this mode `field` is
   * not required and `shouldShowErrors` always returns `true` (the caller
   * controls visibility through `hasErrors`/`hasWarnings`).
   */
  readonly errorsOverride =
    input<ReactiveOrStatic<readonly ValidationError[]>>();

  /**
   * Bridges a host component's field input to this directive when the
   * component cannot forward `formField` via `hostDirectives` inputs
   * (because `[formField]` conflicts with Angular's `FormField` directive
   * selector `[formField]`).
   *
   * Call this once from the host component's constructor after `inject()`
   * resolves this directive:
   *
   * ```typescript
   * constructor() {
   *   inject(NgxHeadlessErrorState).connectFieldState(
   *     computed(() => this.formField()?.()),
   *   );
   * }
   * ```
   *
   * Not intended for external callers outside of `NgxFormFieldError`.
   * @internal
   */
  connectFieldState(
    s: Signal<Partial<ErrorReadableState> | null | undefined>,
  ): void {
    this.#bridgedFieldState.set(s);
  }

  /**
   * Resolved submission status after applying form-context defaults.
   * Exposed so that host components composing this directive via
   * `hostDirectives` can reuse the resolved value without re-calling
   * `resolveSubmittedStatusFromContext`.
   */
  readonly resolvedSubmittedStatus = computed<SubmittedStatus | undefined>(() =>
    resolveSubmittedStatusFromContext(
      this.submittedStatus(),
      this.#injectedContext,
    ),
  );

  /**
   * Resolved field state from: (1) `field` input, or (2) a bridged signal
   * connected via `connectFieldState()`. `undefined` when neither is set.
   */
  readonly #fieldState = computed<
    Partial<ErrorReadableState> | null | undefined
  >(() => this.field()?.() ?? this.#bridgedFieldState()?.());

  readonly #core = buildHeadlessErrorState(
    this.#fieldState,
    this.fieldName,
    computed(() => {
      const override = this.errorsOverride();
      return override === undefined ? undefined : unwrapValue(override);
    }),
  );

  readonly errorId = this.#core.errorId;
  readonly warningId = this.#core.warningId;
  readonly errors = this.#core.errors;
  readonly warnings = this.#core.warnings;
  readonly hasErrors = this.#core.hasErrors;
  readonly hasWarnings = this.#core.hasWarnings;

  /**
   * Resolution order: `strategy` input (when not `'inherit'`) → ambient
   * form context → the global `NGX_SIGNAL_FORMS_CONFIG.defaultErrorStrategy`
   * → `'on-touch'`. Mirrors `NgxHeadlessFieldset.resolvedStrategy`'s cascade
   * so standalone usage (no `[ngxSignalForm]` host) behaves consistently
   * regardless of which headless surface a consumer reaches for.
   */
  readonly #strategyBasedShowErrors = createErrorVisibility(this.#fieldState, {
    strategy: this.strategy,
    submittedStatus: this.submittedStatus,
    configDefault: this.#config.defaultErrorStrategy,
  });

  /**
   * Warning timing, routed through the shared `createWarningVisibility` seam
   * (ADR-0006) so the four-tier warning cascade of ADR-0007 is composed in
   * one place rather than re-assembled here.
   *
   * Presence comes from {@link hasWarnings} rather than the field's own
   * `errors()`, because direct-errors mode (`errorsOverride`) supplies the
   * warning list from outside the field. `errorVisibility` mirrors what the
   * renderers already enforce (`NgxFormFieldError.errorContainerVisible`):
   * a blocking error that is actually on screen owns the message region, so
   * the warning waits.
   */
  readonly #strategyBasedShowWarnings = createWarningVisibility(
    this.#fieldState,
    {
      strategy: this.warningStrategy,
      submittedStatus: this.submittedStatus,
      configDefault: this.#config.defaultWarningStrategy,
      hasWarnings: this.hasWarnings,
      errorVisibility: () =>
        this.#strategyBasedShowErrors() && this.hasErrors(),
    },
  );

  /**
   * Whether errors should be shown based on strategy.
   *
   * Returns `true` unconditionally in two cases:
   * 1. **Direct-errors mode** — `errorsOverride` is bound. Strategy gating
   *    is intentionally bypassed here: callers using `errorsOverride` (e.g.
   *    `NgxFormFieldset.filteredErrorsSignal`) already aggregate and gate
   *    their own error lists upstream, so a second strategy filter here
   *    would double-gate. Visibility is delegated to the caller via
   *    `hasErrors`/`hasWarnings`.
   * 2. **No field state available** — neither `field` nor a bridged value
   *    via `connectFieldState()` is set. The host controls visibility
   *    through its own template conditions.
   *
   * The bridge slot is checked by *value*, not by presence: host components
   * that compose this directive via `hostDirectives` always call
   * `connectFieldState()` in their constructor, so the slot is non-null
   * even when the host's `[formField]` input is unbound.
   */
  readonly shouldShowErrors = computed(() => {
    if (this.errorsOverride()) return true;
    if (!this.field() && this.#bridgedFieldState()?.() == null) return true;
    return this.#strategyBasedShowErrors();
  });

  /**
   * Whether warnings should be shown, timed by {@link warningStrategy}'s own
   * cascade rather than the blocking-error one.
   *
   * The two unconditional-`true` cases are the same as
   * {@link shouldShowErrors}, and for the same reasons — direct-errors mode
   * delegates gating upstream, and with no field state the host owns
   * visibility. The strategy branch differs: it runs the warning cascade,
   * gates on warning presence rather than `invalid()`, and stays `false`
   * while a blocking error is visible on this field (ADR-0007).
   */
  readonly shouldShowWarnings = computed(() => {
    if (this.errorsOverride()) return true;
    if (!this.field() && this.#bridgedFieldState()?.() == null) return true;
    return this.#strategyBasedShowWarnings();
  });

  /**
   * Resolved error messages using 3-tier priority.
   */
  readonly resolvedErrors: Signal<readonly ResolvedError[]> = computed(() =>
    this.errors().map((error) => ({
      kind: error.kind,
      message: this.#resolveErrorMessage(error),
    })),
  );

  /**
   * Resolved warning messages.
   */
  readonly resolvedWarnings: Signal<readonly ResolvedError[]> = computed(() =>
    this.warnings().map((warning) => ({
      kind: warning.kind,
      message: this.#resolveErrorMessage(warning),
    })),
  );

  #resolveErrorMessage(error: ValidationError): string {
    return resolveErrorMessage(error, this.#errorMessagesRegistry);
  }
}
