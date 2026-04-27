import { computed, Directive, inject, input, type Signal } from '@angular/core';
import type { FieldTree, ValidationError } from '@angular/forms/signals';
import {
  createErrorVisibility,
  splitByKind,
  type ErrorDisplayStrategy,
  type SubmittedStatus,
} from '@ngx-signal-forms/toolkit';
import {
  NGX_ERROR_MESSAGES,
  NGX_FIELD_LABEL_RESOLVER,
} from '@ngx-signal-forms/toolkit/core';

import {
  dedupeValidationErrors,
  isErrorOnInteractiveField,
  readErrors,
  toErrorSummaryEntry,
  type ErrorSummaryEntryData,
} from './utilities';

const STRIP_WARNING_PREFIX = { stripWarningPrefix: true } as const;

/**
 * A resolved error-summary entry with kind, message, and focus capability.
 */
export type ErrorSummaryEntry = ErrorSummaryEntryData;

/**
 * Error summary signals exposed by the headless directive.
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
 * ```html
 * <div
 *   ngxHeadlessErrorSummary
 *   #summary="errorSummary"
 *   [formTree]="myForm"
 * >
 *   @if (summary.shouldShow() && summary.hasErrors()) {
 *     <ul role="alert">
 *       @for (entry of summary.entries(); track entry.kind + entry.fieldName) {
 *         <li>
 *           <button type="button" (click)="entry.focus()">
 *             {{ entry.fieldName }}: {{ entry.message }}
 *           </button>
 *         </li>
 *       }
 *     </ul>
 *   }
 * </div>
 * ```
 */
@Directive({
  selector: '[ngxHeadlessErrorSummary]',
  exportAs: 'errorSummary',
})
export class NgxHeadlessErrorSummary implements ErrorSummarySignals {
  readonly #errorMessagesRegistry = inject(NGX_ERROR_MESSAGES, {
    optional: true,
  });
  readonly #labelResolver = inject(NGX_FIELD_LABEL_RESOLVER, {
    optional: true,
  });

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
   * Form submission status (optional).
   * If not provided, inherits from form context.
   */
  readonly submittedStatus = input<SubmittedStatus | undefined>();

  readonly #fieldState = computed(() => this.formTree()());

  readonly #showErrorsSignal = createErrorVisibility(this.#fieldState, {
    strategy: this.strategy,
    submittedStatus: this.submittedStatus,
  });

  /**
   * Errors with `errorSummary()` traversal, then filtered to drop entries
   * whose underlying field is `hidden()` or `disabled()`. Angular's docs say
   * hidden/disabled fields do not contribute to form validation state, but
   * they may still appear in `errorSummary()`. A summary entry for such a
   * field has no actionable target — `focus()` would either throw or strand
   * focus on a non-interactive control — so we exclude them before dedupe.
   *
   * `readonly()` is intentionally **not** filtered: the field is visible and
   * focusable, and its error is usually still meaningful to the user.
   */
  readonly #split = computed(() => {
    const visibleErrors = readErrors(this.#fieldState()).filter(
      (error: ValidationError) => isErrorOnInteractiveField(error),
    );
    return splitByKind(dedupeValidationErrors(visibleErrors));
  });

  readonly entries = computed(() =>
    this.#split().blocking.map((error) =>
      toErrorSummaryEntry(
        error,
        this.#errorMessagesRegistry,
        undefined,
        this.#labelResolver,
      ),
    ),
  );

  readonly warningEntries = computed(() =>
    this.#split().warnings.map((error) =>
      toErrorSummaryEntry(
        error,
        this.#errorMessagesRegistry,
        STRIP_WARNING_PREFIX,
        this.#labelResolver,
      ),
    ),
  );

  readonly hasErrors = computed(() => this.#split().blocking.length > 0);
  readonly hasWarnings = computed(() => this.#split().warnings.length > 0);

  readonly shouldShow = computed(
    () => this.#showErrorsSignal() && this.hasErrors(),
  );

  readonly focusFirst = (): void => {
    const first = this.entries()[0];
    first?.focus();
  };
}
