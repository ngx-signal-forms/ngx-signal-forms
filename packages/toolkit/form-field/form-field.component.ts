import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  effect,
  inject,
  input,
} from '@angular/core';
import type { FieldTree, ValidationError } from '@angular/forms/signals';
import type {
  ErrorDisplayStrategy,
  ReactiveOrStatic,
} from '@ngx-signal-forms/toolkit';
import {
  isBlockingError,
  isWarningError,
  NGX_SIGNAL_FORM_CONTEXT,
  NGX_SIGNAL_FORMS_CONFIG,
  NgxSignalFormErrorComponent,
} from '@ngx-signal-forms/toolkit';

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
 * - Optional floating label styling (via ngxFloatingLabel directive)
 * - Support for hints and character counts
 *
 * @template TValue The type of the field value (defaults to unknown)
 *
 * @example Basic Usage
 * ```html
 * <ngx-signal-form-field [formField]="form.email" fieldName="email">
 *   <label for="email">Email</label>
 *   <input id="email" [formField]="form.email" />
 * </ngx-signal-form-field>
 * ```
 *
 * @example With Custom Error Strategy
 * ```html
 * <ngx-signal-form-field
 *   [formField]="form.password"
 *   fieldName="password"
 *   [strategy]="'on-submit'"
 * >
 *   <label for="password">Password</label>
 *   <input id="password" type="password" [formField]="form.password" />
 * </ngx-signal-form-field>
 * ```
 *
 * @example Outlined Layout
 * ```html
 * <ngx-signal-form-field [formField]="form.email" outline>
 *   <label for="email">Email Address</label>
 *   <input id="email" type="email" [formField]="form.email" required placeholder="you@example.com" />
 * </ngx-signal-form-field>
 * ```
 *
 * @example With Character Count
 * ```html
 * <ngx-signal-form-field [formField]="form.bio" outline>
 *   <label for="bio">Bio</label>
 *   <textarea id="bio" [formField]="form.bio"></textarea>
 *   <ngx-signal-form-field-character-count [formField]="form.bio" [maxLength]="500" />
 * </ngx-signal-form-field>
 * ```
 *
 * @example With Hint Text
 * ```html
 * <ngx-signal-form-field [formField]="form.phone">
 *   <label for="phone">Phone Number</label>
 *   <input id="phone" [formField]="form.phone" />
 *   <ngx-signal-form-field-hint>Format: 123-456-7890</ngx-signal-form-field-hint>
 * </ngx-signal-form-field>
 * ```
 *
 * @example With Prefix Icon
 * ```html
 * <ngx-signal-form-field [formField]="form.search">
 *   <span prefix aria-hidden="true">🔍</span>
 *   <label for="search">Search</label>
 *   <input id="search" [formField]="form.search" />
 * </ngx-signal-form-field>
 * ```
 *
 * @example With Suffix Button
 * ```html
 * <ngx-signal-form-field [formField]="form.password">
 *   <label for="password">Password</label>
 *   <input id="password" type="password" [formField]="form.password" />
 *   <button suffix type="button" (click)="togglePassword()">Show</button>
 * </ngx-signal-form-field>
 * ```
 *
 * @example With Both Prefix and Suffix
 * ```html
 * <ngx-signal-form-field [formField]="form.amount">
 *   <span prefix aria-hidden="true">$</span>
 *   <label for="amount">Amount</label>
 *   <input id="amount" type="number" [formField]="form.amount" />
 *   <span suffix aria-hidden="true">.00</span>
 * </ngx-signal-form-field>
 * ```
 *
 * @example Without Auto-Error Display
 * ```html
 * <ngx-signal-form-field [formField]="form.custom" fieldName="custom" [showErrors]="false">
 *   <label for="custom">Custom Field</label>
 *   <input id="custom" [formField]="form.custom" />
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
  styleUrl: './form-field.component.scss',
  host: {
    '[attr.outline]': 'isOutline() ? "" : null',
    '[class.ngx-signal-form-field--warning]': 'showWarningState()',
  },
  template: `
    <!-- Label slot (outside bordered container for traditional layout) -->
    <div class="ngx-signal-form-field__label">
      <ng-content select="label" />
    </div>

    <!-- Bordered input container with prefix/suffix integrated -->
    <div class="ngx-signal-form-field__content">
      <!-- Prefix slot (icons, text, etc.) -->
      <div class="ngx-signal-form-field__prefix">
        <ng-content select="[prefix]" />
      </div>

      <!-- Main content (input only - label is outside) -->
      <div class="ngx-signal-form-field__main">
        <ng-content />
      </div>

      <!-- Suffix slot (buttons, icons, etc.) -->
      <div class="ngx-signal-form-field__suffix">
        <ng-content select="[suffix]" />
      </div>
    </div>

    <!-- Hint/character count slot (projected before errors) -->
    <ng-content
      select="ngx-signal-form-field-hint, ngx-signal-form-field-character-count"
    />

    @if (showErrors()) {
      <ngx-signal-form-error
        [formField]="formField()"
        [fieldName]="resolvedFieldName()"
        [strategy]="effectiveStrategy"
        [submittedStatus]="submittedStatus"
      />
    }
  `,
})
export class NgxSignalFormFieldComponent<TValue = unknown> {
  /**
   * The Signal Forms field to display.
   * Accepts a FieldTree from Angular Signal Forms.
   * Generic type parameter allows type inference from the provided field.
   */
  readonly formField = input.required<FieldTree<TValue>>();

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
   * <ngx-signal-form-field [formField]="form.email">
   *   <label for="email">Email</label>
   *   <input id="email" [formField]="form.email" />
   * </ngx-signal-form-field>
   * ```
   *
   * @example Explicit override
   * ```html
   * <ngx-signal-form-field [formField]="form.email" fieldName="user-email">
   *   <label for="user-email">Email</label>
   *   <input id="user-email" [formField]="form.email" />
   * </ngx-signal-form-field>
   * ```
   *
   * @example Fallback to auto-generated ID (when no id attribute exists)
   * ```html
   * <ngx-signal-form-field [formField]="form.email">
   *   <label>Email</label>
   *   <input [formField]="form.email" />
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
   * Enable outlined form field appearance.
   * When true, applies Material Design outlined input styling.
   *
   * @default Inherited from NgxSignalFormsConfig.defaultFormFieldAppearance
   *
   * @example Explicit outline
   * ```html
   * <ngx-signal-form-field [formField]="form.email" outline>
   *   <label for="email">Email</label>
   *   <input id="email" [formField]="form.email" />
   * </ngx-signal-form-field>
   * ```
   *
   * @example Global default via config
   * ```typescript
   * provideNgxSignalFormsConfig({
   *   defaultFormFieldAppearance: 'outline',
   * });
   * ```
   */
  readonly outline = input(false, { transform: booleanAttribute });

  /**
   * Toolkit configuration for default appearance.
   */
  readonly #config = inject(NGX_SIGNAL_FORMS_CONFIG);

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
   * This query searches for interactive form control elements that typically have the [formField] directive:
   * - input: All input types (text, email, password, number, checkbox, radio, etc.)
   * - textarea: Multi-line text input
   * - select: Dropdown selection
   * - button: Interactive buttons (type="button" with [formField] for custom controls)
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
   * Computed signal determining if outline appearance should be applied.
   * Respects explicit outline input, falls back to config default.
   */
  protected readonly isOutline = computed(() => {
    // Priority 1: Explicit outline input
    if (this.outline()) {
      return true;
    }

    // Priority 2: Config default
    return this.#config.defaultFormFieldAppearance === 'outline';
  });

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

  /**
   * All validation messages from the field.
   * Uses safe duck-typing access pattern.
   */
  readonly #allMessages = computed(() => {
    const fieldState = this.formField()();

    if (!fieldState || typeof fieldState !== 'object') {
      return [] as ValidationError[];
    }

    const errorsGetter = (fieldState as { errors?: () => ValidationError[] })
      .errors;
    return typeof errorsGetter === 'function' ? (errorsGetter() ?? []) : [];
  });

  /**
   * Whether field has blocking errors.
   * Uses shared `isBlockingError` utility from headless.
   */
  protected readonly hasErrors = computed(() =>
    this.#allMessages().some(isBlockingError),
  );

  /**
   * Whether field has warnings.
   * Uses shared `isWarningError` utility from headless.
   */
  protected readonly hasWarnings = computed(() =>
    this.#allMessages().some(isWarningError),
  );

  /**
   * Whether to apply warning styling to the form field container.
   * Warning styling is shown only when:
   * 1. Field has warnings
   * 2. Field has NO errors (errors take visual priority)
   */
  protected readonly showWarningState = computed(() => {
    return this.hasWarnings() && !this.hasErrors();
  });

  constructor() {
    effect(() => {
      const inputEl = this.inputElement();
      const fieldName = this.resolvedFieldName();

      if (inputEl) {
        inputEl.setAttribute('data-signal-field', fieldName);
      }
    });
  }
}
