import {
  Component,
  computed,
  input,
  ChangeDetectionStrategy,
} from '@angular/core';
import type { FieldTree, ValidationError } from '@angular/forms/signals';
import {
  generateErrorId,
  generateWarningId,
} from '../utilities/field-resolution';
import { showErrors } from '../utilities/show-errors';
import type { ErrorDisplayStrategy } from '../types';

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
 * // Using warningError() helper (recommended)
 * warningError('weak-password', 'Consider a stronger password')
 * warningError('common-email', 'This email domain is commonly used for spam')
 *
 * // Or using customError() directly
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
 *   [hasSubmitted]="formSubmitted"
 * />
 * ```
 *
 * @example With Custom Strategy
 * ```html
 * <ngx-signal-form-error
 *   [field]="form.password"
 *   fieldName="password"
 *   [strategy]="strategySignal"
 *   [hasSubmitted]="formSubmitted"
 * />
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
   * Can be a function returning strategy or a static value.
   * @default 'on-touch'
   */
  readonly strategy = input<
    (() => ErrorDisplayStrategy) | ErrorDisplayStrategy
  >('on-touch');

  /**
   * Signal indicating if the form has been submitted.
   * Accepts a function that returns a boolean.
   */
  readonly hasSubmitted = input.required<() => boolean>();

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
   * Computed signal for error visibility based on strategy.
   */
  protected readonly showErrors = computed(() => {
    return showErrors(this.field(), this.strategy(), this.hasSubmitted())();
  });

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
