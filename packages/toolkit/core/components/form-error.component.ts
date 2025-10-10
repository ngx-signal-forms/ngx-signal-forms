import {
  Component,
  computed,
  input,
  ChangeDetectionStrategy,
} from '@angular/core';
import type { SignalLike } from '@angular/aria/ui-patterns';
import { generateErrorId } from '../utilities/field-resolution';
import { createShowErrorsSignal } from '../utilities/show-errors';
import type { ErrorDisplayStrategy } from '../types';

/**
 * Reusable error display component with WCAG 2.2 compliance.
 *
 * Uses SignalLike<T> from @angular/aria for flexible inputs that accept
 * signals, computed signals, or plain functions returning values.
 *
 * Features:
 * - `role="alert"` for screen reader announcements
 * - Strategy-aware error display
 * - Structured error rendering from Signal Forms
 * - Auto-generated error IDs for aria-describedby linking
 *
 * @example
 * ```html
 * <ngx-signal-form-error
 *   [field]="form.email"
 *   fieldName="email"
 *   [hasSubmitted]="formSubmitted"
 * />
 * ```
 *
 * @example With custom strategy (as signal or static value)
 * ```html
 * <ngx-signal-form-error
 *   [field]="form.password"
 *   fieldName="password"
 *   [strategy]="strategySignal"
 *   [hasSubmitted]="formSubmitted"
 * />
 * ```
 */
@Component({
  selector: 'ngx-signal-form-error',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (showErrors()) {
      <div
        [id]="errorId()"
        role="alert"
        class="ngx-signal-form-error"
        aria-live="polite"
      >
        @for (error of errors(); track error.kind) {
          <p class="ngx-signal-form-error__message">
            {{ error.message }}
          </p>
        }
      </div>
    }
  `,
  styles: `
    .ngx-signal-form-error {
      color: var(--ngx-signal-form-error-color, #dc2626);
      font-size: var(--ngx-signal-form-error-font-size, 0.875rem);
      margin-top: var(--ngx-signal-form-error-margin-top, 0.25rem);
    }

    .ngx-signal-form-error__message {
      margin: 0;
      padding: 0;
    }

    .ngx-signal-form-error__message + .ngx-signal-form-error__message {
      margin-top: var(--ngx-signal-form-error-message-spacing, 0.25rem);
    }
  `,
})
export class NgxSignalFormErrorComponent {
  /**
   * The Signal Forms field to display errors for.
   * Accepts any SignalLike that returns the field state.
   */
  readonly field = input.required<SignalLike<unknown>>();

  /**
   * The field name used for generating error IDs.
   * This should match the field name used in aria-describedby.
   */
  readonly fieldName = input.required<string>();

  /**
   * Error display strategy.
   * Can be a SignalLike for dynamic strategy or a static value.
   * @default 'on-touch'
   */
  readonly strategy = input<
    SignalLike<ErrorDisplayStrategy> | ErrorDisplayStrategy
  >('on-touch');

  /**
   * Signal indicating if the form has been submitted.
   * Accepts any SignalLike that returns a boolean.
   */
  readonly hasSubmitted = input.required<SignalLike<boolean>>();

  /**
   * Computed error ID for aria-describedby linking.
   */
  protected readonly errorId = computed(() =>
    generateErrorId(this.fieldName()),
  );

  /**
   * Computed signal for error visibility based on strategy.
   */
  protected readonly showErrors = computed(() => {
    const field = this.field();
    return createShowErrorsSignal(field, {
      strategy: this.strategy(),
      hasSubmitted: this.hasSubmitted(),
    })();
  });

  /**
   * Computed array of errors from the field state.
   */
  protected readonly errors = computed(() => {
    const field = this.field();
    const fieldState = typeof field === 'function' ? field() : field;

    // Handle null/undefined field state
    if (!fieldState || typeof fieldState !== 'object') {
      return [];
    }

    // Extract errors from Signal Forms field state
    const errorsGetter = (
      fieldState as unknown as {
        errors?: () => Array<{ kind: string; message: string }>;
      }
    ).errors;

    if (typeof errorsGetter === 'function') {
      return errorsGetter() || [];
    }

    return [];
  });
}
