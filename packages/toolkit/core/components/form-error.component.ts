import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import type {
  FieldTree,
  SubmittedStatus,
  ValidationError,
} from '@angular/forms/signals';
import type { ErrorDisplayStrategy, ReactiveOrStatic } from '../types';
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
 *   [submittedStatus]="form().submittedStatus()"
 * />
 * ```
 *
 * @example With Custom Strategy
 * ```html
 * <ngx-signal-form-error
 *   [field]="form.password"
 *   fieldName="password"
 *   [strategy]="strategySignal"
 *   [submittedStatus]="form().submittedStatus()"
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
 * @example Auto-injected from NgxSignalFormProviderDirective
 * ```html
 * <form [ngxSignalFormProvider]="form" (ngSubmit)="save()">
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
        @for (error of errors(); track error.kind) {
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
        @for (warning of warnings(); track warning.kind) {
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
    /**
     * CSS Custom Properties (Public API)
     *
     * All properties prefixed with --ngx-signal-form-error-* to avoid naming conflicts.
     * Uses @property for type-safe CSS variables with fallbacks for browsers
     * that don't support @property (Firefox < 128).
     */

    /* Error Colors */
    @property --ngx-signal-form-error-color {
      syntax: '<color>';
      inherits: true;
      initial-value: #dc2626;
    }

    @property --ngx-signal-form-error-bg {
      syntax: '<color>';
      inherits: true;
      initial-value: transparent;
    }

    @property --ngx-signal-form-error-border {
      syntax: '<color>';
      inherits: true;
      initial-value: transparent;
    }

    /* Warning Colors */
    @property --ngx-signal-form-warning-color {
      syntax: '<color>';
      inherits: true;
      initial-value: #f59e0b;
    }

    @property --ngx-signal-form-warning-bg {
      syntax: '<color>';
      inherits: true;
      initial-value: transparent;
    }

    @property --ngx-signal-form-warning-border {
      syntax: '<color>';
      inherits: true;
      initial-value: transparent;
    }

    /* Spacing */
    @property --ngx-signal-form-error-margin-top {
      syntax: '<length>';
      inherits: true;
      initial-value: 0.375rem;
    }

    @property --ngx-signal-form-error-message-spacing {
      syntax: '<length>';
      inherits: true;
      initial-value: 0.25rem;
    }

    /* Typography */
    @property --ngx-signal-form-error-font-size {
      syntax: '<length>';
      inherits: true;
      initial-value: 0.875rem;
    }

    @property --ngx-signal-form-error-line-height {
      syntax: '<number>';
      inherits: true;
      initial-value: 1.25;
    }

    /* Border */
    @property --ngx-signal-form-error-border-width {
      syntax: '<length>';
      inherits: true;
      initial-value: 0px;
    }

    @property --ngx-signal-form-error-border-radius {
      syntax: '<length>';
      inherits: true;
      initial-value: 0px;
    }

    /* Padding */
    @property --ngx-signal-form-error-padding {
      syntax: '<length>';
      inherits: true;
      initial-value: 0px;
    }

    /**
     * Dark Mode Support
     */
    @media (prefers-color-scheme: dark) {
      :host {
        --ngx-signal-form-error-color: #fca5a5;
        --ngx-signal-form-warning-color: #fcd34d;
      }
    }

    /**
     * Component Styles
     */

    :host {
      display: block;
      margin-top: var(--ngx-signal-form-error-margin-top);
    }

    .ngx-signal-form-error {
      display: flex;
      flex-direction: column;
      gap: var(--ngx-signal-form-error-message-spacing);
      padding: var(--ngx-signal-form-error-padding);
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

    /**
     * Reduced Motion Support
     */
    @media (prefers-reduced-motion: reduce) {
      .ngx-signal-form-error {
        transition: none;
      }
    }

    /**
     * High Contrast Mode Support
     */
    @media (prefers-contrast: high) {
      .ngx-signal-form-error {
        border-width: 2px;
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
   * Error display strategy.
   * Can be a SignalLike for dynamic strategy or a static value.
   * Falls back to injected strategy from form provider if available.
   * @default 'on-touch'
   */
  readonly strategy = input<ReactiveOrStatic<ErrorDisplayStrategy> | undefined>(
    undefined,
  );

  /**
   * Form submission status from Angular Signal Forms.
   * Accepts Angular's SubmittedStatus type: 'unsubmitted' | 'submitting' | 'submitted'.
   *
   * When used inside a form with NgxSignalFormProviderDirective, this is automatically
   * injected from the form provider context. Otherwise, pass Angular's submittedStatus:
   * `[submittedStatus]="form().submittedStatus()"`.
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
   */
  readonly #resolvedStrategy = computed<ErrorDisplayStrategy>(() => {
    const inputStrategy = this.strategy();
    if (inputStrategy !== undefined && inputStrategy !== null) {
      return typeof inputStrategy === 'function'
        ? inputStrategy()
        : inputStrategy;
    }

    const contextStrategy = this.#injectedContext?.errorStrategy?.();
    if (contextStrategy) {
      return contextStrategy;
    }

    return 'on-touch'; // Default fallback
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
    if (contextStatus) {
      return contextStatus;
    }

    return 'unsubmitted'; // Default fallback
  });

  /**
   * Extract FieldState from FieldTree for use with showErrors utility.
   * FieldTree is a callable signal: () => FieldState
   */
  readonly #fieldState = computed(() => {
    const fieldTree = this.field();
    return fieldTree(); // Call FieldTree to get FieldState
  });

  /**
   * Computed signal for error visibility based on strategy.
   */
  protected readonly showErrors = showErrors(
    this.#fieldState, // Pass computed FieldState signal
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
}
