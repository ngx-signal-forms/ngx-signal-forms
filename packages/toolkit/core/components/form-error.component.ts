import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  type Signal,
} from '@angular/core';
import type {
  FieldState,
  FieldTree,
  SubmittedStatus,
  ValidationError,
} from '@angular/forms/signals';
import { NGX_ERROR_MESSAGES } from '../providers/error-messages.provider';
import type {
  ErrorDisplayStrategy,
  ReactiveOrStatic,
  ValidationErrorWithParams,
} from '../types';
import {
  generateErrorId,
  generateWarningId,
} from '../utilities/field-resolution';
import { injectFormContext } from '../utilities/inject-form-context';
import { showErrors } from '../utilities/show-errors';

/**
 * Reusable error and warning display component with WCAG 2.2 compliance.
 *
 * Accepts a FieldTree from Angular Signal Forms.
 *
 * **Signal Forms Limitation: No Native Warning Support**
 *
 * Signal Forms only has "errors" - it doesn't have a built-in concept of "warnings".
 * This component provides warnings support using a **convention-based approach**:
 *
 * - **Errors** (blocking): `kind` does NOT start with `'warn:'`
 * - **Warnings** (non-blocking): `kind` starts with `'warn:'`
 *
 * @template TValue The type of the field value (defaults to unknown)
 *
 * @example Error (blocks submission)
 * ```typescript
 * customError({ kind: 'required', message: 'Email is required' })
 * customError({ kind: 'email', message: 'Invalid email format' })
 * ```
 *
 * @example Warning (does not block submission)
 * ```typescript
 * /// Using warningError() helper (recommended)
 * warningError('weak-password', 'Consider a stronger password')
 * warningError('common-email', 'This email domain is commonly used for spam')
 *
 * /// Or using customError() directly
 * customError({ kind: 'warn:weak-password', message: 'Consider a stronger password' })
 * customError({ kind: 'warn:common-email', message: 'This email domain is commonly used for spam' })
 * ```
 *
 * Features:
 * - **Errors**: `role="alert"` with `aria-live="assertive"` for immediate announcement
 * - **Warnings**: `role="status"` with `aria-live="polite"` for non-intrusive guidance
 * - Strategy-aware error/warning display
 * - Structured rendering from Signal Forms
 * - Auto-generated IDs for aria-describedby linking
 *
 * @example Basic Usage
 * ```html
 * <ngx-signal-form-error
 *   [field]="form.email"
 *   fieldName="email"
 * />
 * ```
 *
 * @example With Field-Level Strategy Override
 * ```html
 * <form [ngxSignalForm]="form" [errorStrategy]="'on-touch'">
 *   <!-- Password field shows errors immediately -->
 *   <ngx-signal-form-error
 *     [field]="form.password"
 *     fieldName="password"
 *     strategy="immediate" />
 *
 *   <!-- Email inherits form-level strategy -->
 *   <ngx-signal-form-error
 *     [field]="form.email"
 *     fieldName="email"
 *     strategy="inherit" />
 * </form>
 * ```
 *
 * @example With Dynamic Strategy
 * ```html
 * <ngx-signal-form-error
 *   [field]="form.password"
 *   fieldName="password"
 *   [strategy]="strategySignal"
 *   [submittedStatus]="form().submitting() ? 'submitting' : form().touched() ? 'submitted' : 'unsubmitted'"
 * />
 * ```
 *
 * @example Using Angular's submit() helper (recommended)
 * ```typescript
 * import { submit } from '@angular/forms/signals';
 *
 * readonly #submitHandler = submit(this.form, async (formData) => {
 *   // Form submission logic - submittedStatus automatically managed
 *   await apiCall();
 *   return null;
 * });
 *
 * protected handleSubmit(): void {
 *   void this.#submitHandler();
 * }
 * ```
 *
 * @example Auto-injected from ngxSignalFormDirective
 * ```html
 * <form [ngxSignalForm]="form" (ngSubmit)="save()">
 *   <!-- submittedStatus automatically injected from form provider -->
 *   <ngx-signal-form-error [field]="form.email" fieldName="email" />
 * </form>
 * ```
 *
 * @example Form with Warnings
 * ```typescript
 * import { warningError } from '@ngx-signal-forms/toolkit/core';
 *
 * form(signal({ password: '' }), (path) => {
 *   required(path.password, { message: 'Password required' }); // Error
 *   minLength(path.password, 8, { message: 'Min 8 characters' }); // Error
 *
 *   // Custom validation with warning
 *   validate(path.password, (ctx) => {
 *     const value = ctx.value();
 *     if (value && value.length < 12) {
 *       return warningError('short-password', 'Consider using 12+ characters for better security');
 *     }
 *     return null;
 *   });
 * });
 * ```
 */
@Component({
  selector: 'ngx-signal-form-error',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Blocking Errors (ARIA role="alert" for assertive announcement) -->
    @if (showErrors() && hasErrors()) {
      <div
        [id]="errorId()"
        class="ngx-signal-form-error ngx-signal-form-error--error"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
      >
        @for (error of resolvedErrors(); track error.kind) {
          <p
            class="ngx-signal-form-error__message ngx-signal-form-error__message--error"
          >
            {{ error.message }}
          </p>
        }
      </div>
    }

    <!-- Non-blocking Warnings (ARIA role="status" for polite announcement) -->
    @if (showWarnings() && hasWarnings()) {
      <div
        [id]="warningId()"
        class="ngx-signal-form-error ngx-signal-form-error--warning"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        @for (warning of resolvedWarnings(); track warning.kind) {
          <p
            class="ngx-signal-form-error__message ngx-signal-form-error__message--warning"
          >
            {{ warning.message }}
          </p>
        }
      </div>
    }
  `,
  styles: `
    /*
     * CSS Custom Properties (Public API)
     *
     * All properties prefixed with --ngx-signal-form-* for namespacing.
     * Override these in your app or component styles to customize appearance.
     *
     * Example - Customize in your component:
     *   ngx-signal-form-error {
     *     --ngx-signal-form-error-color: #b91c1c;
     *     --ngx-signal-form-error-bg: #fef2f2;
     *   }
     */
    :host {
      /* Error Colors */
      --ngx-signal-form-error-color: #dc2626;
      --ngx-signal-form-error-bg: transparent;
      --ngx-signal-form-error-border: transparent;

      /* Warning Colors */
      --ngx-signal-form-warning-color: #f59e0b;
      --ngx-signal-form-warning-bg: transparent;
      --ngx-signal-form-warning-border: transparent;

      /* Spacing */
      --ngx-signal-form-error-margin-top: 0.375rem;
      --ngx-signal-form-error-message-spacing: 0.25rem;

      /* Typography */
      --ngx-signal-form-error-font-size: 0.75rem;
      --ngx-signal-form-error-line-height: 1.25;

      /* Border */
      --ngx-signal-form-error-border-width: 0;
      --ngx-signal-form-error-border-radius: 0;

      /* Padding */
      --ngx-signal-form-error-padding: 0;
      --ngx-signal-form-error-padding-horizontal: 0.5rem;

      display: block;
      margin-top: var(--ngx-signal-form-error-margin-top);
    }

    /* Dark mode defaults */
    @media (prefers-color-scheme: dark) {
      :host {
        --ngx-signal-form-error-color: #fca5a5;
        --ngx-signal-form-warning-color: #fcd34d;
      }
    }

    .ngx-signal-form-error {
      display: flex;
      flex-direction: column;
      gap: var(--ngx-signal-form-error-message-spacing);
      padding: var(--ngx-signal-form-error-padding);
      padding-left: var(--ngx-signal-form-error-padding-horizontal);
      padding-right: var(--ngx-signal-form-error-padding-horizontal);
      border-width: var(--ngx-signal-form-error-border-width);
      border-style: solid;
      border-radius: var(--ngx-signal-form-error-border-radius);
      font-size: var(--ngx-signal-form-error-font-size);
      line-height: var(--ngx-signal-form-error-line-height);
    }

    .ngx-signal-form-error--error {
      color: var(--ngx-signal-form-error-color);
      background-color: var(--ngx-signal-form-error-bg);
      border-color: var(--ngx-signal-form-error-border);
    }

    .ngx-signal-form-error--warning {
      color: var(--ngx-signal-form-warning-color);
      background-color: var(--ngx-signal-form-warning-bg);
      border-color: var(--ngx-signal-form-warning-border);
    }

    .ngx-signal-form-error__message {
      margin: 0;
    }

    /* Reduced Motion Support */
    @media (prefers-reduced-motion: reduce) {
      .ngx-signal-form-error {
        transition: none;
      }
    }

    /* High Contrast Mode Support */
    @media (prefers-contrast: high) {
      :host {
        --ngx-signal-form-error-border-width: 2px;
      }
    }
  `,
})
export class NgxSignalFormErrorComponent<TValue = unknown> {
  /**
   * Try to inject form context (optional - may not be available).
   */
  readonly #injectedContext = injectFormContext();

  /**
   * Try to inject error messages registry (optional - may not be provided).
   *
   * Used for 3-tier message priority:
   * 1. error.message (from validator/Zod schema) ← Use first!
   * 2. Registry override (from provideErrorMessages())
   * 3. Default fallback (built-in toolkit messages)
   */
  readonly #errorMessagesRegistry = inject(NGX_ERROR_MESSAGES, {
    optional: true,
  });

  /**
   * The Signal Forms field to display errors/warnings for.
   * Accepts a FieldTree from Angular Signal Forms.
   */
  readonly field = input.required<FieldTree<TValue>>();

  /**
   * The field name used for generating error/warning IDs.
   * This should match the field name used in aria-describedby.
   */
  readonly fieldName = input.required<string>();

  /**
   * Error display strategy for this specific field.
   *
   * Can be a SignalLike for dynamic strategy or a static value.
   * Use 'inherit' to explicitly inherit from form provider.
   * If undefined, automatically inherits from form provider or defaults to 'on-touch'.
   *
   * **Field-Level Override Use Cases:**
   * - Password fields: Use 'immediate' for real-time feedback
   * - Optional fields: Use 'on-submit' to avoid premature errors
   * - Critical fields: Use 'on-touch' for quick feedback
   *
   * @default undefined (inherits from form or 'on-touch')
   *
   * @example Field-level override
   * ```html
   * <form [ngxSignalForm]="form" [errorStrategy]="'on-touch'">
   *   <!-- Override: immediate feedback for password -->
   *   <ngx-signal-form-error
   *     [field]="form.password"
   *     fieldName="password"
   *     strategy="immediate" />
   *
   *   <!-- Explicit inherit (same as omitting strategy) -->
   *   <ngx-signal-form-error
   *     [field]="form.email"
   *     fieldName="email"
   *     strategy="inherit" />
   * </form>
   * ```
   */
  readonly strategy = input<ReactiveOrStatic<ErrorDisplayStrategy> | undefined>(
    undefined,
  );

  /**
   * Form submission status derived from Angular Signal Forms.
   * Accepts Angular's SubmittedStatus type: 'unsubmitted' | 'submitting' | 'submitted'.
   *
   * When used inside a form with ngxSignalFormDirective, this is automatically
   * injected from the form provider context. Otherwise, pass a SubmittedStatus
   * derived from `submitting()`/`touched()`, e.g.:
   * `[submittedStatus]="form().submitting() ? 'submitting' : form().touched() ? 'submitted' : 'unsubmitted'"`.
   */
  readonly submittedStatus = input<
    ReactiveOrStatic<SubmittedStatus> | undefined
  >(undefined);

  /**
   * Computed error ID for aria-describedby linking.
   */
  protected readonly errorId = computed(() =>
    generateErrorId(this.fieldName()),
  );

  /**
   * Computed warning ID for aria-describedby linking.
   */
  protected readonly warningId = computed(() =>
    generateWarningId(this.fieldName()),
  );

  /**
   * Resolved error display strategy (input or injected from context).
   *
   * Resolution priority:
   * 1. Field-level strategy (if not 'inherit' or undefined)
   * 2. Form-level strategy from context
   * 3. Default 'on-touch'
   */
  readonly #resolvedStrategy = computed<ErrorDisplayStrategy>(() => {
    const inputStrategy = this.strategy();
    const unwrappedStrategy =
      inputStrategy !== undefined && inputStrategy !== null
        ? typeof inputStrategy === 'function'
          ? inputStrategy()
          : inputStrategy
        : undefined;

    // If field-level strategy is explicitly set and not 'inherit', use it
    if (unwrappedStrategy !== undefined && unwrappedStrategy !== 'inherit') {
      return unwrappedStrategy;
    }

    // Otherwise, inherit from form provider
    const contextStrategy = this.#injectedContext?.errorStrategy?.();
    if (contextStrategy && contextStrategy !== 'inherit') {
      return contextStrategy;
    }

    // Final fallback
    return 'on-touch';
  });

  /**
   * Resolved submitted status (input or injected from context).
   */
  readonly #resolvedSubmittedStatus = computed<SubmittedStatus>(() => {
    const inputStatus = this.submittedStatus();
    if (inputStatus !== undefined && inputStatus !== null) {
      return typeof inputStatus === 'function' ? inputStatus() : inputStatus;
    }

    const contextStatus = this.#injectedContext?.submittedStatus?.();
    if (contextStatus !== undefined && contextStatus !== null) {
      return contextStatus;
    }

    return 'unsubmitted';
  });

  /**
   * Extract FieldState from FieldTree for use with showErrors utility.
   * FieldTree is a callable signal: () => FieldState
   */
  readonly #fieldState = computed(() => {
    const fieldTree = this.field();
    return fieldTree();
  });

  /**
   * Computed signal for error visibility based on strategy.
   * Type assertion needed due to FieldState/CompatFieldState union type complexity.
   */
  protected readonly showErrors = showErrors(
    this.#fieldState as Signal<FieldState<TValue>>,
    this.#resolvedStrategy,
    this.#resolvedSubmittedStatus,
  );

  /**
   * Computed signal for warning visibility.
   * Warnings are shown using the same strategy as errors.
   */
  protected readonly showWarnings = this.showErrors;

  /**
   * All validation messages from the field.
   */
  readonly #allMessages = computed(() => {
    const fieldTree = this.field();
    // FieldTree is callable: () => FieldState
    const fieldState = fieldTree();

    if (!fieldState || typeof fieldState !== 'object') {
      return [];
    }

    const errorsGetter = (
      fieldState as unknown as {
        errors?: () => ValidationError[];
      }
    ).errors;

    if (typeof errorsGetter === 'function') {
      return errorsGetter() || [];
    }

    return [];
  });

  /**
   * Computed array of errors (kind does NOT start with 'warn:').
   */
  protected readonly errors = computed(() => {
    return this.#allMessages().filter(
      (msg) => msg.kind && !msg.kind.startsWith('warn:'),
    );
  });

  /**
   * Computed array of warnings (kind starts with 'warn:').
   */
  protected readonly warnings = computed(() => {
    return this.#allMessages().filter(
      (msg) => msg.kind && msg.kind.startsWith('warn:'),
    );
  });

  /**
   * Whether the field has blocking errors.
   */
  protected readonly hasErrors = computed(() => this.errors().length > 0);

  /**
   * Whether the field has non-blocking warnings.
   */
  protected readonly hasWarnings = computed(() => this.warnings().length > 0);

  /**
   * Resolve error message using 3-tier priority:
   * 1. error.message (from validator/Zod schema) ← Use first!
   * 2. Registry override (from provideErrorMessages())
   * 3. Default fallback (built-in toolkit messages)
   *
   * @param error The validation error
   * @returns The resolved error message
   */
  #resolveErrorMessage(error: ValidationError): string {
    // Tier 1: Use error.message if provided by validator (Zod/Valibot/custom)
    if (error.message) {
      return error.message;
    }

    // Tier 2: Check registry for override
    if (this.#errorMessagesRegistry) {
      const registryMessage = this.#errorMessagesRegistry[error.kind];
      if (registryMessage !== undefined) {
        if (typeof registryMessage === 'function') {
          // Factory function - pass error object as params
          // ValidationError has strict shape, but validators add properties (minLength, min, max, etc.)
          return registryMessage(error as ValidationErrorWithParams);
        }
        // String literal
        return registryMessage;
      }
    }

    // Tier 3: Default fallback messages
    return this.#getDefaultMessage(error);
  }

  /**
   * Get default fallback message for built-in validators.
   *
   * Used when validator doesn't provide message AND registry doesn't override.
   *
   * @param error The validation error
   * @returns Default error message
   */
  #getDefaultMessage(error: ValidationError): string {
    const kind = error.kind;
    // Cast to ValidationErrorWithParams to access validator-specific properties
    const errorParams = error as ValidationErrorWithParams;

    // Built-in Angular Signal Forms validators
    switch (kind) {
      case 'required':
        return 'This field is required';
      case 'email':
        return 'Please enter a valid email address';
      case 'minLength':
        return `Minimum ${errorParams['minLength'] || 0} characters required`;
      case 'maxLength':
        return `Maximum ${errorParams['maxLength'] || 0} characters allowed`;
      case 'min':
        return `Minimum value is ${errorParams['min'] || 0}`;
      case 'max':
        return `Maximum value is ${errorParams['max'] || 0}`;
      case 'pattern':
        return 'Invalid format';
      default:
        // Custom validators: convert error kind to human-readable message
        // e.g., 'phone_invalid' → 'Phone invalid'
        return kind.replace(/_/g, ' ');
    }
  }

  /**
   * Computed array of resolved error messages (not warnings).
   */
  protected readonly resolvedErrors = computed(() => {
    return this.errors().map((error) => ({
      kind: error.kind,
      message: this.#resolveErrorMessage(error),
    }));
  });

  /**
   * Computed array of resolved warning messages.
   */
  protected readonly resolvedWarnings = computed(() => {
    return this.warnings().map((warning) => ({
      kind: warning.kind,
      message: this.#resolveErrorMessage(warning),
    }));
  });
}
