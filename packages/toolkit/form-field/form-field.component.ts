import {
  Component,
  input,
  computed,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import type { FieldTree } from '@angular/forms/signals';
import {
  NgxSignalFormErrorComponent,
  NGX_SIGNAL_FORM_CONTEXT,
} from '@ngx-signal-forms/toolkit/core';
import type { ErrorDisplayStrategy } from '@ngx-signal-forms/toolkit/core';

/**
 * Form field wrapper component with automatic error/warning display.
 *
 * Provides:
 * - Consistent layout for form fields
 * - Automatic error and warning display
 * - Accessibility-compliant structure
 * - Content projection for labels and inputs
 * - Type-safe field binding with generics
 *
 * @template TValue The type of the field value (defaults to unknown)
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
 *
 * @example Type Inference
 * ```typescript
 * // TypeScript knows email is FieldTree<string>
 * const emailField = form.email;
 * // Component infers TValue = string automatically
 * ```
 */
@Component({
  selector: 'ngx-signal-form-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgxSignalFormErrorComponent],
  template: `
    <div class="ngx-signal-form-field__content">
      <ng-content />
    </div>
    @if (showErrors()) {
      <ngx-signal-form-error
        [field]="field()"
        [fieldName]="fieldName()"
        [strategy]="effectiveStrategy"
        [hasSubmitted]="hasSubmitted"
      />
    }
  `,
  styles: `
    :host {
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
export class NgxSignalFormFieldComponent<TValue = unknown> {
  /**
   * The Signal Forms field to display.
   * Accepts a FieldTree from Angular Signal Forms.
   * Generic type parameter allows type inference from the provided field.
   */
  readonly field = input.required<FieldTree<TValue>>();

  /**
   * The field name used for generating error IDs.
   * This should match the field name used in the form.
   */
  readonly fieldName = input.required<string>();

  /**
   * Error display strategy.
   * Can be a function returning strategy or a static value.
   * @default Inherited from form context or 'on-touch'
   */
  readonly strategy = input<
    (() => ErrorDisplayStrategy) | ErrorDisplayStrategy | null
  >(null);

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
   * Effective error display strategy combining component input and form context defaults.
   */
  protected readonly effectiveStrategy = computed(() => {
    const explicit = this.strategy();
    if (explicit !== null) {
      return typeof explicit === 'function' ? explicit() : explicit;
    }

    const contextStrategy = this.#formContext?.errorStrategy?.();
    return contextStrategy ?? 'on-touch';
  });

  /**
   * Computed signal for submission state.
   */
  protected readonly hasSubmitted = computed(() => {
    return this.#formContext?.hasSubmitted?.() ?? false;
  });
}
