import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  inject,
  input,
} from '@angular/core';
import type { FieldTree } from '@angular/forms/signals';
import type {
  ErrorDisplayStrategy,
  ReactiveOrStatic,
} from '@ngx-signal-forms/toolkit/core';
import {
  NGX_SIGNAL_FORM_CONTEXT,
  NgxSignalFormErrorComponent,
} from '@ngx-signal-forms/toolkit/core';

/**
 * Counter for generating unique field IDs when fieldName is not provided.
 * The counter is incremented using the pre-increment operator within component initialization.
 */
let uniqueFieldIdCounter = 0;

/**
 * Generates a unique field ID by incrementing the global counter.
 * Each call returns a new unique ID (e.g., "field-1", "field-2", etc.).
 */
function generateUniqueFieldId(): string {
  return `field-${++uniqueFieldIdCounter}`;
}

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
 *   <input id="email" [field]="form.email" />
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
 *   <input id="password" type="password" [field]="form.password" />
 * </ngx-signal-form-field>
 * ```
 *
 * @example Without Auto-Error Display
 * ```html
 * <ngx-signal-form-field [field]="form.custom" fieldName="custom" [showErrors]="false">
 *   <label for="custom">Custom Field</label>
 *   <input id="custom" [field]="form.custom" />
 *   <!-- Manual error display here -->
 * </ngx-signal-form-field>
 * ```
 *
 * @example Type Inference
 * ```typescript
 * /// TypeScript knows email is FieldTree<string>
 * const emailField = form.email;
 * /// Component infers TValue = string automatically
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
        [fieldName]="resolvedFieldName()"
        [strategy]="effectiveStrategy"
        [submittedStatus]="submittedStatus"
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
   * The field name used for generating error IDs and ARIA attributes.
   *
   * **Automatic derivation (recommended):**
   * When omitted, the field name is automatically derived from the input element's `id` attribute.
   * This ensures ARIA attributes (`aria-describedby`) correctly link to error messages.
   *
   * **Explicit override:**
   * Provide an explicit field name when you need to override the automatic behavior
   * or when the input element doesn't have an `id` attribute.
   *
   * **Fallback:**
   * If no explicit fieldName is provided AND no input element with an `id` is found,
   * a unique ID is auto-generated (e.g., "field-1", "field-2").
   *
   * @example Automatic (recommended) - derives "email" from input's id attribute
   * ```html
   * <ngx-signal-form-field [field]="form.email">
   *   <label for="email">Email</label>
   *   <input id="email" [field]="form.email" />
   * </ngx-signal-form-field>
   * ```
   *
   * @example Explicit override
   * ```html
   * <ngx-signal-form-field [field]="form.email" fieldName="user-email">
   *   <label for="user-email">Email</label>
   *   <input id="user-email" [field]="form.email" />
   * </ngx-signal-form-field>
   * ```
   *
   * @example Fallback to auto-generated ID (when no id attribute exists)
   * ```html
   * <ngx-signal-form-field [field]="form.email">
   *   <label>Email</label>
   *   <input [field]="form.email" />
   * </ngx-signal-form-field>
   * ```
   */
  readonly fieldName = input<string>();

  /**
   * Error display strategy.
   * Can be a ReactiveOrStatic for dynamic strategy or a static value.
   * @default Inherited from form context or 'on-touch'
   */
  readonly strategy = input<ReactiveOrStatic<ErrorDisplayStrategy> | null>(
    null,
  );

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
   * Auto-generated unique field ID as fallback when no explicit fieldName or input id is found.
   */
  readonly #generatedFieldId = generateUniqueFieldId();

  /**
   * Query for form control elements within this form field.
   * Used to automatically derive the field name from the element's `id` attribute.
   *
   * This query searches for interactive form control elements that typically have the [field] directive:
   * - input: All input types (text, email, password, number, checkbox, radio, etc.)
   * - textarea: Multi-line text input
   * - select: Dropdown selection
   * - button: Interactive buttons (type="button" with [field] for custom controls)
   *
   * The result is a signal containing the HTMLElement, or undefined if no matching element exists.
   *
   * Note: Cannot use ES private (#) because contentChild doesn't support it.
   * Note: Uses descendants:true to find elements nested within projected content (like labels wrapping inputs).
   */
  private readonly inputElement = contentChild<HTMLElement>(
    'input, textarea, select, button[type="button"]',
    {
      descendants: true,
    },
  );

  /**
   * Resolved field name computed from three sources (in priority order):
   * 1. Explicit `fieldName` input (highest priority)
   * 2. Input element's `id` attribute (automatic, recommended)
   * 3. Auto-generated unique ID (fallback)
   *
   * This ensures ARIA attributes (`aria-describedby`) correctly link to error messages
   * even when the developer doesn't provide an explicit `fieldName`.
   */
  protected readonly resolvedFieldName = computed(() => {
    // Priority 1: Explicit fieldName input
    const explicit = this.fieldName();
    if (explicit !== undefined) {
      return explicit;
    }

    // Priority 2: Derive from input element's id attribute
    const inputEl = this.inputElement();
    const idFromInput = inputEl?.getAttribute('id');
    if (idFromInput) {
      return idFromInput;
    }

    // Priority 3: Fallback to auto-generated unique ID
    return this.#generatedFieldId;
  });

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
   * Computed signal for submission status.
   * Gets Angular's SubmittedStatus from the form provider context if available,
   * otherwise defaults to 'unsubmitted'.
   */
  protected readonly submittedStatus = computed(() => {
    return this.#formContext?.submittedStatus?.() ?? 'unsubmitted';
  });
}
