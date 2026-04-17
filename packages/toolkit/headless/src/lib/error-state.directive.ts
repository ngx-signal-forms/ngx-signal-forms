import { computed, Directive, inject, input } from '@angular/core';
import type { FieldTree, ValidationError } from '@angular/forms/signals';
import {
  injectFormContext,
  resolveStrategyFromContext,
  resolveSubmittedStatusFromContext,
  resolveValidationErrorMessage,
  showErrors,
  type ErrorDisplayStrategy,
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
  readonly showErrors: () => boolean;
  /** Whether to show warnings based on the current strategy */
  readonly showWarnings: () => boolean;
  /** Raw blocking errors from the field */
  readonly errors: () => ValidationError[];
  /** Raw warning errors from the field */
  readonly warnings: () => ValidationError[];
  /** Resolved errors with messages */
  readonly resolvedErrors: () => ResolvedError[];
  /** Resolved warnings with messages */
  readonly resolvedWarnings: () => ResolvedError[];
  /** Whether the field has blocking errors */
  readonly hasErrors: () => boolean;
  /** Whether the field has warnings */
  readonly hasWarnings: () => boolean;
  /** Generated error ID for aria-describedby, or `null` when no fieldName is resolvable */
  readonly errorId: () => string | null;
  /** Generated warning ID for aria-describedby, or `null` when no fieldName is resolvable */
  readonly warningId: () => string | null;
}

/**
 * Headless error state directive for custom error display implementations.
 *
 * Extracts error state logic from `NgxFormFieldErrorComponent` into a renderless
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
 *   ngxSignalFormHeadlessErrorState
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
 *   <div ngxSignalFormHeadlessErrorState #errorState="errorState" [field]="form.email" fieldName="email">
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
  selector: '[ngxSignalFormHeadlessErrorState]',
  exportAs: 'errorState',
})
export class NgxHeadlessErrorStateDirective<
  TValue = unknown,
> implements ErrorStateSignals {
  readonly #injectedContext = injectFormContext();
  readonly #errorMessagesRegistry = inject(NGX_ERROR_MESSAGES, {
    optional: true,
  });

  /**
   * The Signal Forms field to track error state for.
   */
  readonly field = input.required<FieldTree<TValue>>();

  /**
   * The field name for generating error/warning IDs.
   * Pass `null` to disable ID generation (e.g. when the field name cannot be
   * resolved yet from a companion `ngxSignalFormHeadlessFieldName` directive).
   */
  readonly fieldName = input.required<string | null>();

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

  readonly #resolvedStrategy = computed<ResolvedErrorDisplayStrategy>(() =>
    resolveStrategyFromContext(this.strategy(), this.#injectedContext),
  );

  readonly #resolvedSubmittedStatus = computed<SubmittedStatus | undefined>(
    () =>
      resolveSubmittedStatusFromContext(
        this.submittedStatus(),
        this.#injectedContext,
      ),
  );

  /**
   * Field state from the FieldTree.
   */
  readonly #fieldState = computed(() => this.field()());

  readonly #core = buildHeadlessErrorState(this.#fieldState, this.fieldName);

  readonly errorId = this.#core.errorId;
  readonly warningId = this.#core.warningId;
  readonly errors = this.#core.errors;
  readonly warnings = this.#core.warnings;
  readonly hasErrors = this.#core.hasErrors;
  readonly hasWarnings = this.#core.hasWarnings;

  /**
   * Whether errors should be shown based on strategy.
   */
  readonly showErrors = showErrors(
    this.#fieldState,
    this.#resolvedStrategy,
    this.#resolvedSubmittedStatus,
  );

  /**
   * Whether warnings should be shown (same logic as errors).
   */
  readonly showWarnings = this.showErrors;

  /**
   * Resolved error messages using 3-tier priority.
   */
  readonly resolvedErrors = computed(() =>
    this.errors().map((error) => ({
      kind: error.kind,
      message: this.#resolveErrorMessage(error),
    })),
  );

  /**
   * Resolved warning messages.
   */
  readonly resolvedWarnings = computed(() =>
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
