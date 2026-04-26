import {
  computed,
  Directive,
  inject,
  input,
  signal,
  type Signal,
} from '@angular/core';
import type { FieldTree, ValidationError } from '@angular/forms/signals';
import {
  injectFormContext,
  resolveStrategyFromContext,
  resolveSubmittedStatusFromContext,
  resolveValidationErrorMessage,
  showErrors,
  type ErrorDisplayStrategy,
  type ErrorReadableState,
  type ResolvedErrorDisplayStrategy,
  type SubmittedStatus,
} from '@ngx-signal-forms/toolkit';
import { NGX_ERROR_MESSAGES } from '@ngx-signal-forms/toolkit/core';

import { buildHeadlessErrorState } from './utilities';

/**
 * Resolved error with kind and message.
 */
export interface ResolvedError {
  readonly kind: string;
  readonly message: string;
}

/**
 * Error state signals exposed by the headless directive.
 *
 * These signals provide all the state needed for custom error display implementations.
 */
export interface ErrorStateSignals {
  /** Whether to show errors based on the current strategy */
  readonly showErrors: Signal<boolean>;
  /** Whether to show warnings based on the current strategy */
  readonly showWarnings: Signal<boolean>;
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
 *   @if (errorState.showErrors() && errorState.hasErrors()) {
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
 *     @if (errorState.showErrors()) {
 *       @for (error of errorState.resolvedErrors(); track error.kind) {
 *         <span class="error">{{ error.message }}</span>
 *       }
 *     }
 *   </div>
 * </form>
 * ```
 *
 * @template TValue The type of the field value
 */
@Directive({
  selector: '[ngxHeadlessErrorState]',
  exportAs: 'errorState',
})
export class NgxHeadlessErrorState<
  TValue = unknown,
> implements ErrorStateSignals {
  readonly #injectedContext = injectFormContext();
  readonly #errorMessagesRegistry = inject(NGX_ERROR_MESSAGES, {
    optional: true,
  });

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
   * Form submission status (optional).
   * Only needed for 'on-submit' strategy.
   */
  readonly submittedStatus = input<SubmittedStatus | undefined>();

  /**
   * Pre-aggregated error signal that replaces field-based error extraction.
   *
   * When provided, errors and warnings are derived from this signal rather
   * than from `field`. Useful for fieldsets or custom components that
   * compute their own error lists (e.g. `NgxFormFieldset.filteredErrorsSignal`).
   * In this mode `field` is not required and `showErrors` always returns
   * `true` (the caller controls visibility through `hasErrors`/`hasWarnings`).
   */
  readonly errorsOverride = input<Signal<readonly ValidationError[]>>();

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

  readonly #resolvedStrategy = computed<ResolvedErrorDisplayStrategy>(() =>
    resolveStrategyFromContext(this.strategy(), this.#injectedContext),
  );

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
    computed(() => this.errorsOverride()?.()),
  );

  readonly errorId = this.#core.errorId;
  readonly warningId = this.#core.warningId;
  readonly errors = this.#core.errors;
  readonly warnings = this.#core.warnings;
  readonly hasErrors = this.#core.hasErrors;
  readonly hasWarnings = this.#core.hasWarnings;

  readonly #strategyBasedShowErrors = showErrors(
    this.#fieldState,
    this.#resolvedStrategy,
    this.resolvedSubmittedStatus,
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
  readonly showErrors = computed(() => {
    if (this.errorsOverride()) return true;
    if (!this.field() && this.#bridgedFieldState()?.() == null) return true;
    return this.#strategyBasedShowErrors();
  });

  /**
   * Whether warnings should be shown (same strategy logic as errors).
   */
  readonly showWarnings = this.showErrors;

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
    return resolveValidationErrorMessage(error, this.#errorMessagesRegistry, {
      stripWarningPrefix: true,
    });
  }
}
