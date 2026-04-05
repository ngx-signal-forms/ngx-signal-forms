import { computed, Directive, inject, input } from '@angular/core';
import type { FieldTree } from '@angular/forms/signals';
import {
  injectFormContext,
  isBlockingError,
  isWarningError,
  NGX_ERROR_MESSAGES,
  resolveStrategyFromContext,
  resolveSubmittedStatusFromContext,
  showErrors,
  type ErrorDisplayStrategy,
  type SubmittedStatus,
} from '@ngx-signal-forms/toolkit';

import {
  dedupeValidationErrors,
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
  readonly entries: () => ErrorSummaryEntry[];
  /** Resolved warning entries */
  readonly warningEntries: () => ErrorSummaryEntry[];
  /** Whether there are any blocking errors */
  readonly hasErrors: () => boolean;
  /** Whether there are any warnings */
  readonly hasWarnings: () => boolean;
  /** Whether the summary should be visible based on strategy */
  readonly shouldShow: () => boolean;
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
 *   ngxSignalFormHeadlessErrorSummary
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
  selector: '[ngxSignalFormHeadlessErrorSummary]',
  exportAs: 'errorSummary',
})
export class NgxHeadlessErrorSummaryDirective implements ErrorSummarySignals {
  readonly #formContext = injectFormContext();
  readonly #errorMessagesRegistry = inject(NGX_ERROR_MESSAGES, {
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
  readonly strategy = input<ErrorDisplayStrategy | undefined>(undefined);

  /**
   * Form submission status (optional).
   * If not provided, inherits from form context.
   */
  readonly submittedStatus = input<SubmittedStatus | undefined>(undefined);

  readonly #fieldState = computed(() => this.formTree()());

  readonly #resolvedStrategy = computed<ErrorDisplayStrategy>(() =>
    resolveStrategyFromContext(this.strategy(), this.#formContext),
  );

  readonly #resolvedSubmittedStatus = computed<SubmittedStatus | undefined>(
    () =>
      resolveSubmittedStatusFromContext(
        this.submittedStatus(),
        this.#formContext,
      ),
  );

  readonly #showErrorsSignal = showErrors(
    this.#fieldState,
    this.#resolvedStrategy,
    this.#resolvedSubmittedStatus,
  );

  readonly #allMessages = computed(() =>
    dedupeValidationErrors(readErrors(this.#fieldState())),
  );

  readonly #blockingErrors = computed(() =>
    this.#allMessages().filter(isBlockingError),
  );

  readonly #warningErrors = computed(() =>
    this.#allMessages().filter(isWarningError),
  );

  readonly entries = computed(() =>
    this.#blockingErrors().map((error) =>
      toErrorSummaryEntry(error, this.#errorMessagesRegistry),
    ),
  );

  readonly warningEntries = computed(() =>
    this.#warningErrors().map((error) =>
      toErrorSummaryEntry(
        error,
        this.#errorMessagesRegistry,
        STRIP_WARNING_PREFIX,
      ),
    ),
  );

  readonly hasErrors = computed(() => this.#blockingErrors().length > 0);
  readonly hasWarnings = computed(() => this.#warningErrors().length > 0);

  readonly shouldShow = computed(
    () => this.#showErrorsSignal() && this.hasErrors(),
  );

  readonly focusFirst = (): void => {
    const first = this.entries()[0];
    first?.focus();
  };
}
