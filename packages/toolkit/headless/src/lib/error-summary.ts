import { computed, Directive, input, type Signal } from '@angular/core';
import type { FieldTree } from '@angular/forms/signals';
import {
  createErrorVisibility,
  createWarningVisibility,
  resolveStrategyFromContext,
  resolveWarningStrategyFromContext,
  type ErrorDisplayStrategy,
  type ResolvedErrorDisplayStrategy,
  type ResolvedWarningDisplayStrategy,
  type SubmittedStatus,
  type WarningDisplayStrategy,
} from '@ngx-signal-forms/toolkit';

import { buildHeadlessContext } from './build-headless-context';
import {
  createErrorSummaryEntries,
  type ErrorSummaryEntryData,
} from './utilities';

/**
 * A resolved error-summary entry with kind, message, and focus capability.
 *
 * @group Directives
 */
export type ErrorSummaryEntry = ErrorSummaryEntryData;

/**
 * Error summary signals exposed by the headless directive.
 *
 * @group Directives
 */
export interface ErrorSummarySignals {
  /** Resolved blocking error entries ready for rendering */
  readonly entries: Signal<readonly ErrorSummaryEntry[]>;
  /** Resolved warning entries */
  readonly warningEntries: Signal<readonly ErrorSummaryEntry[]>;
  /** Whether there are any blocking errors */
  readonly hasErrors: Signal<boolean>;
  /** Whether there are any warnings */
  readonly hasWarnings: Signal<boolean>;
  /** Whether the summary should be visible based on strategy */
  readonly shouldShow: Signal<boolean>;
  /**
   * Whether the warning list should be visible, timed by
   * {@link resolvedWarningStrategy}.
   *
   * Independent of {@link shouldShow} in both directions: a warnings-only
   * form has `hasErrors() === false`, so `shouldShow()` never gates
   * `warningEntries()`, and the warning cascade never consults the
   * blocking-error strategy (ADR-0007). Consumers rendering
   * `warningEntries()` should gate on this signal instead of `shouldShow()`.
   */
  readonly shouldShowWarnings: Signal<boolean>;
  /**
   * The fully-resolved error display strategy: explicit `strategy` input →
   * form context → `'on-touch'` default. Consumers that need to distinguish
   * a submit-driven appearance (e.g. to decide whether to move focus) from
   * an on-touch/immediate one should read this rather than the raw
   * `strategy` input, which may be `undefined`.
   */
  readonly resolvedStrategy: Signal<ResolvedErrorDisplayStrategy>;
  /**
   * The fully-resolved warning display strategy, independent of
   * {@link resolvedStrategy}: `warningStrategy` input → form context
   * `warningStrategy()` → `NGX_SIGNAL_FORMS_CONFIG.defaultWarningStrategy` →
   * `'on-touch'`.
   */
  readonly resolvedWarningStrategy: Signal<ResolvedWarningDisplayStrategy>;
  /** Focus the control for the first error entry */
  readonly focusFirst: () => void;
}

/**
 * Headless error-summary directive for form-level validation summaries.
 *
 * Aggregates errors from a form's `errorSummary()` and exposes them as
 * focusable entries for custom rendering.
 *
 * ## Features
 *
 * - **Angular-native**: Uses `errorSummary()` — never reimplements validation traversal
 * - **Click-to-focus**: Each entry exposes a `focus()` method via `focusBoundControl()`
 * - **Strategy-aware**: Respects error display strategy from form context
 * - **Warning support**: Separates blocking errors from warnings
 * - **Message resolution**: 3-tier message priority (validator, registry, default)
 * - **Deduplication**: Same error shown only once
 *
 * ## Usage
 *
 * The `role="alert"` container should be rendered UNCONDITIONALLY (even
 * while empty) rather than inserted together with its content — the same
 * always-mounted live-region pattern `NgxFormFieldError` uses (both its
 * inline and panel presentations). `role="alert"` only reliably fires on
 * content insertion into a *pre-existing* live region; mounting the
 * container and its content in the same tick risks the NVDA + Chrome
 * missed-first-announcement bug. Gate only the inner content on
 * `shouldShow()`/`hasErrors()`, not the container itself:
 *
 * ```html
 * <div ngxHeadlessErrorSummary #summary="errorSummary" [formTree]="myForm">
 *   <ul role="alert">
 *     @if (summary.shouldShow() && summary.hasErrors()) {
 *       @for (entry of summary.entries(); track entry.kind + entry.fieldName) {
 *         <li>
 *           <button type="button" (click)="entry.focus()">
 *             {{ entry.fieldName }}: {{ entry.message }}
 *           </button>
 *         </li>
 *       }
 *     }
 *   </ul>
 * </div>
 * ```
 *
 * @group Directives
 */
@Directive({
  selector: '[ngxHeadlessErrorSummary]',
  exportAs: 'errorSummary',
})
export class NgxHeadlessErrorSummary implements ErrorSummarySignals {
  readonly #context = buildHeadlessContext();
  readonly #errorMessagesRegistry = this.#context.errorMessagesRegistry;
  readonly #labelResolver = this.#context.labelResolver;
  readonly #formContext = this.#context.formContext;
  readonly #config = this.#context.config;

  /**
   * The root form FieldTree to aggregate errors from.
   */
  readonly formTree = input.required<FieldTree<unknown>>();

  /**
   * Error display strategy override.
   * If undefined, inherits from form context or defaults to 'on-touch'.
   */
  readonly strategy = input<ErrorDisplayStrategy | undefined>();

  /**
   * Warning display strategy override, independent of {@link strategy}
   * (which only governs blocking errors).
   *
   * Cascade: this input → the ambient form context's `warningStrategy()` →
   * `NGX_SIGNAL_FORMS_CONFIG.defaultWarningStrategy` → `'on-touch'`. No tier
   * consults `defaultErrorStrategy`, so a form that defers its errors to
   * submit still surfaces summary warnings on touch (ADR-0007).
   *
   * @default `'on-touch'`
   */
  readonly warningStrategy = input<WarningDisplayStrategy | undefined>();

  /**
   * Form submission status (optional).
   * If not provided, inherits from form context.
   */
  readonly submittedStatus = input<SubmittedStatus | undefined>();

  /**
   * Resolution order: `strategy` input (when not `'inherit'`) → ambient
   * form context → the global `NGX_SIGNAL_FORMS_CONFIG.defaultErrorStrategy`
   * → `'on-touch'`. Mirrors `NgxHeadlessFieldset.resolvedStrategy`'s cascade
   * so standalone usage (no `[ngxSignalForm]` host) behaves consistently
   * regardless of which headless surface a consumer reaches for.
   */
  readonly resolvedStrategy = computed(() =>
    resolveStrategyFromContext(
      this.strategy(),
      this.#formContext,
      this.#config.defaultErrorStrategy,
    ),
  );

  /**
   * Resolved warning display strategy — the warning cascade, run with the
   * same tiers `NgxHeadlessFieldset.resolvedWarningStrategy` uses so
   * `'inherit'` gives one answer across headless surfaces.
   */
  readonly resolvedWarningStrategy = computed<ResolvedWarningDisplayStrategy>(
    () =>
      resolveWarningStrategyFromContext(
        this.warningStrategy(),
        this.#formContext,
        this.#config.defaultWarningStrategy,
      ),
  );

  readonly #fieldState = computed(() => this.formTree()());

  readonly #showErrorsSignal = createErrorVisibility(this.#fieldState, {
    strategy: this.strategy,
    submittedStatus: this.submittedStatus,
    configDefault: this.#config.defaultErrorStrategy,
  });

  /**
   * Warning visibility, routed through the warning seam (ADR-0006) so the
   * summary's warning list is timed by `warningStrategy`, not by whatever
   * the blocking-error strategy happens to be.
   *
   * `hasWarnings: true` because a summary's warnings live on member fields
   * rather than on the root's own `errors()`; {@link #entries} applies the
   * presence gate. `errorVisibility` is omitted for the same reason
   * `NgxHeadlessFieldset` omits it — a blocking error on one field must not
   * silence a warning on a sibling.
   */
  readonly #showWarningsSignal = createWarningVisibility(this.#fieldState, {
    strategy: this.warningStrategy,
    submittedStatus: this.submittedStatus,
    hasWarnings: true,
    configDefault: this.#config.defaultWarningStrategy,
  });

  /**
   * Entry-mapping pipeline, delegated to {@link createErrorSummaryEntries} —
   * this directive is a pure projection over its result. The pipeline reads
   * `errorSummary()`, drops entries whose underlying field is `hidden()` or
   * `disabled()` (a summary entry for such a field has no actionable
   * target — `focus()` would either throw or strand focus on a
   * non-interactive control), dedupes **per field** (unlike
   * `NgxHeadlessFieldset`'s grouped-message dedupe, two different fields
   * sharing the same kind/message — e.g. two `required()` fields with no
   * custom message — must both keep their own summary entry), and maps to
   * focusable entries. `readonly()` fields are intentionally **not**
   * filtered: the field is visible and focusable, and its error is usually
   * still meaningful to the user.
   */
  readonly #entries = createErrorSummaryEntries({
    fieldState: this.#fieldState,
    showErrors: this.#showErrorsSignal,
    showWarnings: this.#showWarningsSignal,
    errorMessages: this.#errorMessagesRegistry,
    labelResolver: this.#labelResolver,
  });

  readonly entries = this.#entries.entries;
  readonly warningEntries = this.#entries.warningEntries;
  readonly hasErrors = this.#entries.hasErrors;
  readonly hasWarnings = this.#entries.hasWarnings;
  readonly shouldShow = this.#entries.shouldShow;
  readonly shouldShowWarnings = this.#entries.shouldShowWarnings;

  readonly focusFirst = (): void => {
    const first = this.entries()[0];
    first?.focus();
  };
}
