import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  signal,
} from '@angular/core';
import type { FieldTree, ValidationError } from '@angular/forms/signals';
import type {
  ErrorDisplayStrategy,
  FormFieldAppearanceInput,
  ReactiveOrStatic,
} from '@ngx-signal-forms/toolkit';
import {
  createUniqueId,
  NGX_SIGNAL_FORM_CONTEXT,
  NGX_SIGNAL_FORM_FIELD_CONTEXT,
  NGX_SIGNAL_FORMS_CONFIG,
  resolveErrorDisplayStrategy,
  shouldShowErrors,
} from '@ngx-signal-forms/toolkit';
import {
  isBlockingError,
  isWarningError,
  NgxFormFieldAssistiveRowComponent,
  NgxSignalFormErrorComponent,
} from '@ngx-signal-forms/toolkit/assistive';

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
 * <ngx-signal-form-field-wrapper [formField]="form.email" fieldName="email">
 *   <label for="email">Email</label>
 *   <input id="email" [formField]="form.email" />
 * </ngx-signal-form-field-wrapper>
 * ```
 *
 * @example With Custom Error Strategy
 * ```html
 * <ngx-signal-form-field-wrapper
 *   [formField]="form.password"
 *   fieldName="password"
 *   [strategy]="'on-submit'"
 * >
 *   <label for="password">Password</label>
 *   <input id="password" type="password" [formField]="form.password" />
 * </ngx-signal-form-field-wrapper>
 * ```
 *
 * @example Outlined Layout
 * ```html
 * <ngx-signal-form-field-wrapper [formField]="form.email" appearance="outline">
 *   <label for="email">Email Address</label>
 *   <input id="email" type="email" [formField]="form.email" required placeholder="you@example.com" />
 * </ngx-signal-form-field-wrapper>
 * ```
 *
 * @example With Character Count
 * ```html
 * <ngx-signal-form-field-wrapper [formField]="form.bio" appearance="outline">
 *   <label for="bio">Bio</label>
 *   <textarea id="bio" [formField]="form.bio"></textarea>
 *   <ngx-form-field-character-count [formField]="form.bio" [maxLength]="500" />
 * </ngx-signal-form-field-wrapper>
 * ```
 *
 * @example With Hint Text
 * ```html
 * <ngx-signal-form-field-wrapper [formField]="form.phone">
 *   <label for="phone">Phone Number</label>
 *   <input id="phone" [formField]="form.phone" />
 *   <ngx-form-field-hint>Format: 123-456-7890</ngx-form-field-hint>
 * </ngx-signal-form-field-wrapper>
 * ```
 *
 * @example With Prefix Icon
 * ```html
 * <ngx-signal-form-field-wrapper [formField]="form.search">
 *   <span prefix aria-hidden="true">🔍</span>
 *   <label for="search">Search</label>
 *   <input id="search" [formField]="form.search" />
 * </ngx-signal-form-field-wrapper>
 * ```
 *
 * @example With Suffix Button
 * ```html
 * <ngx-signal-form-field-wrapper [formField]="form.password">
 *   <label for="password">Password</label>
 *   <input id="password" type="password" [formField]="form.password" />
 *   <button suffix type="button" (click)="togglePassword()">Show</button>
 * </ngx-signal-form-field-wrapper>
 * ```
 *
 * @example With Both Prefix and Suffix
 * ```html
 * <ngx-signal-form-field-wrapper [formField]="form.amount">
 *   <span prefix aria-hidden="true">$</span>
 *   <label for="amount">Amount</label>
 *   <input id="amount" type="number" [formField]="form.amount" />
 *   <span suffix aria-hidden="true">.00</span>
 * </ngx-signal-form-field-wrapper>
 * ```
 *
 * @example Without Auto-Error Display
 * ```html
 * <ngx-signal-form-field-wrapper [formField]="form.custom" fieldName="custom" [showErrors]="false">
 *   <label for="custom">Custom Field</label>
 *   <input id="custom" [formField]="form.custom" />
 *   <!-- Manual error display here -->
 * </ngx-signal-form-field-wrapper>
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
  selector: 'ngx-signal-form-field-wrapper',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgxSignalFormErrorComponent, NgxFormFieldAssistiveRowComponent],
  providers: [
    {
      provide: NGX_SIGNAL_FORM_FIELD_CONTEXT,
      useFactory: () => {
        const component = inject(NgxSignalFormFieldWrapperComponent);
        return {
          fieldName: component.resolvedFieldName,
        };
      },
    },
  ],
  styleUrl: './form-field-wrapper.component.scss',
  host: {
    '[attr.outline]': 'isOutline() ? "" : null',
    '[class.ngx-signal-form-field-wrapper--warning]': 'showWarningState()',
    '[class.ngx-signal-forms-outline]': 'isOutline()',
    '[attr.data-show-required]':
      'isOutline() && resolvedShowRequiredMarker() ? "true" : null',
    '[attr.data-required-marker]':
      'isOutline() && resolvedShowRequiredMarker() ? resolvedRequiredMarker() : null',
  },
  template: `
    <!-- Label slot (outside bordered container for standard layout, visually inside for outline via CSS) -->
    <div class="ngx-signal-form-field-wrapper__label">
      <ng-content select="label" />
    </div>

    <!-- Bordered input container with prefix/suffix integrated -->
    <div class="ngx-signal-form-field-wrapper__content">
      <!-- Prefix slot (icons, text, etc.) -->
      <div class="ngx-signal-form-field-wrapper__prefix">
        <ng-content select="[prefix]" />
      </div>

      <!-- Main content (input) -->
      <div class="ngx-signal-form-field-wrapper__main">
        <ng-content />
      </div>

      <!-- Suffix slot (buttons, icons, etc.) -->
      <div class="ngx-signal-form-field-wrapper__suffix">
        <ng-content select="[suffix]" />
      </div>
    </div>

    <!-- Assistive row: fixed-height container prevents layout shift -->
    <ngx-signal-form-field-assistive-row
      class="ngx-signal-form-field-wrapper__assistive"
    >
      <!-- Left side: hint (hidden when errors shown) or errors -->
      @if (showErrors() && shouldShowErrors()) {
        <ngx-signal-form-error
          [formField]="formField()"
          [strategy]="effectiveStrategy"
          [submittedStatus]="submittedStatus"
        />
      } @else {
        <ng-content select="ngx-signal-form-field-hint" />
      }

      <!-- Right side: character count -->
      <ng-content select="ngx-signal-form-field-character-count" />
    </ngx-signal-form-field-assistive-row>
  `,
})
export class NgxSignalFormFieldWrapperComponent<TValue = unknown> {
  #findBoundControl(hostEl: HTMLElement): HTMLElement | null {
    const explicitBoundControl = hostEl.querySelector(
      '[formField], [ng-reflect-form-field], [data-ngx-signal-form-control]',
    ) as HTMLElement | null;

    if (explicitBoundControl?.getAttribute('id')) {
      return explicitBoundControl;
    }

    const nativeControl = hostEl.querySelector(
      'input, textarea, select, button[type="button"]',
    ) as HTMLElement | null;

    if (nativeControl?.getAttribute('id')) {
      return nativeControl;
    }

    const customControl = hostEl.querySelector(
      '[id][formField], [id][ng-reflect-form-field], [id][data-ngx-signal-form-control]',
    ) as HTMLElement | null;

    if (customControl) {
      return customControl;
    }

    const idBasedFallback = hostEl.querySelector(
      '[id]:not(label):not(ngx-signal-form-field-wrapper):not(ngx-signal-form-error):not(ngx-signal-form-field-hint):not(ngx-signal-form-field-character-count):not([role="alert"]):not([role="status"])',
    ) as HTMLElement | null;

    if (idBasedFallback) {
      return idBasedFallback;
    }

    return nativeControl;
  }

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
   * **Native HTML elements:** Works automatically with `<input>`, `<textarea>`, `<select>`,
   * and `<button type="button">` elements.
   *
   * **Custom Signal Forms controls:** Also works with custom `FormValueControl` components
   * that have an `id` attribute. The wrapper queries for any element with `[id]` as a fallback.
   *
   * **Explicit override:**
   * Provide an explicit field name when you need to override the automatic behavior
   * or when the input element doesn't have an `id` attribute.
   *
   * **Fallback:**
   * If no explicit fieldName is provided AND no element with an `id` is found,
   * a unique ID is auto-generated (e.g., "field-1", "field-2").
   *
   * @example Automatic (native input) - derives "email" from input's id attribute
   * ```html
   * <ngx-signal-form-field-wrapper [formField]="form.email">
   *   <label for="email">Email</label>
   *   <input id="email" [formField]="form.email" />
   * </ngx-signal-form-field-wrapper>
   * ```
   *
   * @example Custom control (FormValueControl) - derives "rating" from component's id
   * ```html
   * <ngx-signal-form-field-wrapper [formField]="form.rating">
   *   <label for="rating">Rating</label>
   *   <app-rating-control id="rating" [formField]="form.rating" />
   * </ngx-signal-form-field-wrapper>
   * ```
   *
   * @example Explicit override
   * ```html
   * <ngx-signal-form-field-wrapper [formField]="form.email" fieldName="user-email">
   *   <label for="user-email">Email</label>
   *   <input id="user-email" [formField]="form.email" />
   * </ngx-signal-form-field-wrapper>
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
   * Form field appearance variant.
   *
   * Controls the visual style of the form field wrapper:
   * - `'standard'`: Default appearance with label above input
   * - `'outline'`: Material Design outlined appearance with floating label
   * - `'inherit'`: Use the global config default (defaultFormFieldAppearance)
   *
   * @default 'inherit'
   *
   * @example Explicit standard appearance (override global config)
   * ```html
   * <ngx-signal-form-field-wrapper [formField]="form.email" appearance="standard">
   *   <label for="email">Email</label>
   *   <input id="email" [formField]="form.email" />
   * </ngx-signal-form-field-wrapper>
   * ```
   *
   * @example Explicit outline appearance
   * ```html
   * <ngx-signal-form-field-wrapper [formField]="form.email" appearance="outline">
   *   <label for="email">Email</label>
   *   <input id="email" [formField]="form.email" />
   * </ngx-signal-form-field-wrapper>
   * ```
   *
   * @example Inherit from global config (default behavior)
   * ```html
   * <ngx-signal-form-field-wrapper [formField]="form.email" appearance="inherit">
   *   <label for="email">Email</label>
   *   <input id="email" [formField]="form.email" />
   * </ngx-signal-form-field-wrapper>
   * ```
   *
   * @example Global config
   * ```typescript
   * provideNgxSignalFormsConfig({
   *   defaultFormFieldAppearance: 'outline', // All inherit fields use outline
   * });
   * ```
   */
  readonly appearance = input<FormFieldAppearanceInput>('inherit');

  /**
   * @deprecated Use `appearance="outline"` instead. Maintained for backward compatibility.
   *
   * Legacy boolean attribute for outline appearance.
   * When true, forces outline appearance regardless of `appearance` input or config.
   *
   * @example Legacy usage (still works)
   * ```html
   * <ngx-signal-form-field-wrapper [formField]="form.email" outline>
   *   <label for="email">Email</label>
   *   <input id="email" [formField]="form.email" />
   * </ngx-signal-form-field-wrapper>
   * ```
   *
   * @example Recommended replacement
   * ```html
   * <ngx-signal-form-field-wrapper [formField]="form.email" appearance="outline">
   *   <label for="email">Email</label>
   *   <input id="email" [formField]="form.email" />
   * </ngx-signal-form-field-wrapper>
   * ```
   */
  readonly outline = input(false, { transform: booleanAttribute });

  /**
   * Whether to show the required marker in outlined fields.
   * Falls back to NgxSignalFormsConfig.showRequiredMarker when unset.
   */
  readonly showRequiredMarker = input<unknown>(undefined);

  /**
   * Custom character(s) for the required marker in outlined fields.
   * Falls back to NgxSignalFormsConfig.requiredMarker when unset.
   */
  readonly requiredMarker = input<string | undefined>(undefined);

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
  readonly #generatedFieldId = createUniqueId('field');

  /**
   * Reference to the host element for DOM queries.
   */
  readonly #elementRef = inject(ElementRef<HTMLElement>);

  /**
   * Signal holding the input element's ID attribute.
   * Set by afterNextRender after content projection is complete.
   */
  readonly #inputElementId = signal<string | null>(null);

  /**
   * Computed signal determining if outline appearance should be applied.
   * Resolves the effective appearance based on component input and config default.
   *
   * Resolution priority:
   * 1. Legacy `outline` boolean input (for backward compatibility)
   * 2. Component `appearance` input (if not 'inherit')
   * 3. Global config `defaultFormFieldAppearance`
   */
  protected readonly isOutline = computed(() => {
    // Priority 1: Legacy outline boolean (backward compatibility)
    if (this.outline()) {
      return true;
    }

    // Priority 2: Explicit component appearance (non-inherit)
    const componentAppearance = this.appearance();
    if (componentAppearance === 'outline') {
      return true;
    }
    if (componentAppearance === 'standard') {
      return false;
    }

    // Priority 3: Inherit from config default
    const configDefault = this.#config.defaultFormFieldAppearance;
    return configDefault === 'outline';
  });

  /**
   * Resolved required marker visibility with input override.
   */
  protected readonly resolvedShowRequiredMarker = computed(() => {
    const explicit = this.showRequiredMarker();
    if (explicit !== undefined) {
      return booleanAttribute(explicit);
    }

    return this.#config.showRequiredMarker;
  });

  /**
   * Resolved required marker text with input override.
   */
  protected readonly resolvedRequiredMarker = computed(() => {
    const explicit = this.requiredMarker();
    if (explicit !== undefined) {
      return explicit;
    }

    return this.#config.requiredMarker;
  });

  /**
   * Resolved field name computed from three sources (in priority order):
   * 1. Explicit `fieldName` input (highest priority)
   * 2. Input element's `id` attribute (automatic, recommended)
   * 3. Auto-generated unique ID (fallback)
   *
   * This ensures ARIA attributes (`aria-describedby`) correctly link to error messages
   * even when the developer doesn't provide an explicit `fieldName`.
   *
   * @remarks
   * This signal is public to allow child components to access the resolved field name
   * via the `NGX_SIGNAL_FORM_FIELD_CONTEXT` injection token.
   */
  readonly resolvedFieldName = computed(() => {
    // Priority 1: Explicit fieldName input
    const explicit = this.fieldName();
    if (explicit !== undefined) {
      return explicit;
    }

    // Priority 2: Derive from input element's id attribute (signal updated by afterNextRender)
    const idFromInput = this.#inputElementId();
    if (idFromInput) {
      return idFromInput;
    }

    const controlId = this.#findBoundControl(
      this.#elementRef.nativeElement as HTMLElement,
    )?.getAttribute('id');
    if (controlId) {
      return controlId;
    }

    // Priority 3: Fallback to auto-generated unique ID
    return this.#generatedFieldId;
  });

  /**
   * Effective error display strategy combining component input and form context defaults.
   */
  protected readonly effectiveStrategy = computed(() => {
    return resolveErrorDisplayStrategy(
      this.strategy(),
      this.#formContext?.errorStrategy?.(),
      this.#config.defaultErrorStrategy,
    );
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
   * Whether to actually display errors based on current strategy and field state.
   * This controls when the error component replaces the hint.
   */
  protected readonly shouldShowErrors = computed(() => {
    const errors = this.#allMessages();
    if (errors.length === 0) return false;

    const fieldState = this.formField()();

    if (!fieldState || typeof fieldState !== 'object') return false;

    return shouldShowErrors(
      fieldState,
      this.effectiveStrategy(),
      this.submittedStatus(),
    );
  });

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
    // Query DOM for input element ID after first render (content projection complete).
    // Uses afterNextRender (Angular 19+) instead of legacy ngAfterContentInit.
    // The signal update triggers error component to re-render with correct ID.
    afterNextRender(() => {
      const hostEl = this.#elementRef.nativeElement as HTMLElement;

      const inputEl = this.#findBoundControl(hostEl);

      if (inputEl) {
        const id = inputEl.getAttribute('id');
        if (id) {
          this.#inputElementId.set(id);
        }
      }
    });

    // Set data-signal-field attribute for debugging/testing
    effect(() => {
      const fieldName = this.resolvedFieldName();
      const hostEl = this.#elementRef.nativeElement as HTMLElement;

      const inputEl = this.#findBoundControl(hostEl);

      if (inputEl) {
        inputEl.setAttribute('data-signal-field', fieldName);
      }
    });
  }
}
