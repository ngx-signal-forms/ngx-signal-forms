import {
  Component,
  input,
  computed,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import type { SignalLike } from '@angular/aria/ui-patterns';
import {
  NgxSignalFormErrorComponent,
  NGX_SIGNAL_FORM_CONTEXT,
} from '@ngx-signal-forms/toolkit/core';

/**
 * Error display strategy determines when validation errors are shown to the user.
 */
type ErrorDisplayStrategy =
  | 'immediate' // Show errors as they occur
  | 'on-touch' // Show after blur or submit (WCAG recommended)
  | 'on-submit' // Show only after submit
  | 'manual'; // Developer controls display

/**
 * Form field wrapper component with automatic error/warning display.
 *
 * Provides:
 * - Consistent layout for form fields
 * - Automatic error and warning display
 * - Accessibility-compliant structure
 * - Content projection for labels and inputs
 *
 * @example Basic Usage
 * ```html
 * <ngx-signal-form-field [field]="form.email" fieldName="email">
 *   <label for="email">Email</label>
 *   <input id="email" [control]="form.email" />
 * </ngx-signal-form-field>
 * ```
 *
 * @example With Custom Error Strategy
 * ```html
 * <ngx-signal-form-field
 *   [field]="form.password"
 *   fieldName="password"
 *   [strategy]="'on-submit'"
 * >
 *   <label for="password">Password</label>
 *   <input id="password" type="password" [control]="form.password" />
 * </ngx-signal-form-field>
 * ```
 *
 * @example Without Auto-Error Display
 * ```html
 * <ngx-signal-form-field [field]="form.custom" fieldName="custom" [showErrors]="false">
 *   <label for="custom">Custom Field</label>
 *   <input id="custom" [control]="form.custom" />
 *   <!-- Manual error display here -->
 * </ngx-signal-form-field>
 * ```
 */
@Component({
  selector: 'ngx-signal-form-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgxSignalFormErrorComponent],
  template: `
    <div class="ngx-signal-form-field">
      <div class="ngx-signal-form-field__content">
        <ng-content />
      </div>
      @if (showErrors()) {
        <ngx-signal-form-error
          [field]="field"
          [fieldName]="fieldName()"
          [strategy]="strategy()"
          [hasSubmitted]="hasSubmitted"
        />
      }
    </div>
  `,
  styles: `
    .ngx-signal-form-field {
      display: flex;
      flex-direction: column;
      gap: var(--ngx-signal-form-field-gap, 0.5rem);
      margin-bottom: var(--ngx-signal-form-field-margin, 1rem);
    }

    .ngx-signal-form-field__content {
      display: contents;
    }
  `,
})
export class NgxSignalFormFieldComponent {
  /**
   * The Signal Forms field to display.
   * Accepts any SignalLike that returns the field state.
   */
  readonly field = input.required<SignalLike<unknown>>();

  /**
   * The field name used for generating error IDs.
   * This should match the field name used in the form.
   */
  readonly fieldName = input.required<string>();

  /**
   * Error display strategy.
   * Can be a SignalLike for dynamic strategy or a static value.
   * @default Inherited from form context or 'on-touch'
   */
  readonly strategy = input<
    SignalLike<ErrorDisplayStrategy> | ErrorDisplayStrategy
  >('on-touch');

  /**
   * Whether to show the automatic error display.
   * Set to false to manually control error display.
   * @default true
   */
  readonly showErrors = input<boolean>(true);

  /**
   * Form context (optional, for submission state tracking).
   */
  readonly #formContext = inject(NGX_SIGNAL_FORM_CONTEXT, { optional: true });

  /**
   * Computed signal for submission state.
   */
  protected readonly hasSubmitted = computed(() => {
    const ctx = this.#formContext;
    return ctx && typeof ctx === 'object' && 'hasSubmitted' in ctx
      ? (ctx as { hasSubmitted: () => boolean }).hasSubmitted()
      : false;
  });
}
