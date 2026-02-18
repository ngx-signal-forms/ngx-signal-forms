import { computed, Directive, inject, input } from '@angular/core';
import type { FieldTree, ValidationError } from '@angular/forms/signals';
import {
  generateErrorId,
  generateWarningId,
  injectFormContext,
  isBlockingError,
  isWarningError,
  NGX_ERROR_MESSAGES,
  resolveErrorDisplayStrategy,
  resolveValidationErrorMessage,
  showErrors,
  unwrapValue,
  type ErrorDisplayStrategy,
  type ReactiveOrStatic,
  type SubmittedStatus,
} from '@ngx-signal-forms/toolkit/core';

import type { ErrorMessageRegistry } from '@ngx-signal-forms/toolkit/core';
import { readDirectErrors } from './utilities';

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
  /** Generated error ID for aria-describedby */
  readonly errorId: () => string;
  /** Generated warning ID for aria-describedby */
  readonly warningId: () => string;
}

/**
 * Headless error state directive for custom error display implementations.
 *
 * Extracts error state logic from `NgxSignalFormErrorComponent` into a renderless
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
 * <form [ngxSignalForm]="form" [errorStrategy]="'on-submit'">
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
   */
  readonly fieldName = input.required<string>();

  /**
   * Error display strategy override.
   * If undefined, inherits from form context or defaults to 'on-touch'.
   */
  readonly strategy = input<ReactiveOrStatic<ErrorDisplayStrategy> | undefined>(
    undefined,
  );

  /**
   * Form submission status (optional).
   * Only needed for 'on-submit' strategy.
   */
  readonly submittedStatus = input<
    ReactiveOrStatic<SubmittedStatus> | undefined
  >(undefined);

  /**
   * Resolved error display strategy.
   */
  readonly #resolvedStrategy = computed<ErrorDisplayStrategy>(() => {
    return resolveErrorDisplayStrategy(
      this.strategy(),
      this.#injectedContext?.errorStrategy?.(),
      undefined,
    );
  });

  /**
   * Resolved submitted status.
   */
  readonly #resolvedSubmittedStatus = computed<SubmittedStatus | undefined>(
    () => {
      const inputStatus = this.submittedStatus();
      if (inputStatus !== undefined && inputStatus !== null) {
        return unwrapValue(inputStatus);
      }

      const contextStatus = this.#injectedContext?.submittedStatus?.();
      if (contextStatus !== undefined && contextStatus !== null) {
        return contextStatus;
      }

      return undefined;
    },
  );

  /**
   * Field state from the FieldTree.
   */
  readonly #fieldState = computed(() => this.field()());

  /**
   * Generated error ID for aria-describedby.
   */
  readonly errorId = computed(() => generateErrorId(this.fieldName()));

  /**
   * Generated warning ID for aria-describedby.
   */
  readonly warningId = computed(() => generateWarningId(this.fieldName()));

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
   * All validation messages from the field.
   */
  readonly #allMessages = computed(() => {
    return readDirectErrors(this.#fieldState());
  });

  /**
   * Blocking errors (kind does NOT start with 'warn:').
   */
  readonly errors = computed(() => this.#allMessages().filter(isBlockingError));

  /**
   * Warning errors (kind starts with 'warn:').
   */
  readonly warnings = computed(() =>
    this.#allMessages().filter(isWarningError),
  );

  /**
   * Whether the field has blocking errors.
   */
  readonly hasErrors = computed(() => this.errors().length > 0);

  /**
   * Whether the field has warnings.
   */
  readonly hasWarnings = computed(() => this.warnings().length > 0);

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
