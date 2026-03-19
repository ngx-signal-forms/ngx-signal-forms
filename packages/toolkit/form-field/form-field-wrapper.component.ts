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
} from '@ngx-signal-forms/toolkit';
import {
  NGX_SIGNAL_FORM_CONTEXT,
  NGX_SIGNAL_FORM_FIELD_CONTEXT,
  NGX_SIGNAL_FORMS_CONFIG,
  resolveErrorDisplayStrategy,
} from '@ngx-signal-forms/toolkit';
import { shouldShowErrors } from '@ngx-signal-forms/toolkit/core';
import {
  isBlockingError,
  isWarningError,
  NgxFormFieldAssistiveRowComponent,
  NgxSignalFormErrorComponent,
} from '@ngx-signal-forms/toolkit/assistive';

export type FormFieldErrorPlacement = 'top' | 'bottom';

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
    '[class.ngx-signal-form-field-wrapper--messages-top]': 'isTopPlacement()',
    '[class.ngx-signal-form-field-wrapper--messages-bottom]':
      '!isTopPlacement()',
    '[class.ngx-signal-forms-outline]': 'isOutline()',
    '[attr.data-error-placement]': 'errorPlacement()',
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

    @if (isTopPlacement() && shouldShowErrors()) {
      <div class="ngx-signal-form-field-wrapper__messages">
        <ngx-signal-form-error
          [formField]="formField()"
          [strategy]="effectiveStrategy()"
          [submittedStatus]="submittedStatus()"
        />
      </div>
    }

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
      @if (!isTopPlacement() && shouldShowErrors()) {
        <ngx-signal-form-error
          [formField]="formField()"
          [strategy]="effectiveStrategy()"
          [submittedStatus]="submittedStatus()"
        />
      }
      <div [style.display]="shouldShowErrors() ? 'none' : 'contents'">
        <ng-content select="ngx-signal-form-field-hint" />
      </div>

      <!-- Right side: character count -->
      <ng-content select="ngx-signal-form-field-character-count" />
    </ngx-signal-form-field-assistive-row>
  `,
})
export class NgxSignalFormFieldWrapperComponent<TValue = unknown> {
  #getHostElement(): HTMLElement {
    const hostEl = this.#elementRef.nativeElement;

    if (!(hostEl instanceof HTMLElement)) {
      throw new TypeError(
        'NgxSignalFormFieldWrapperComponent requires an HTMLElement host.',
      );
    }

    return hostEl;
  }

  /* oxlint-disable @typescript-eslint/prefer-readonly-parameter-types -- ParentNode is a DOM API surface, not an immutable data structure. */
  #queryHostElement(hostEl: ParentNode, selector: string): HTMLElement | null {
    const element = hostEl.querySelector(selector);

    return element instanceof HTMLElement ? element : null;
  }
  /* oxlint-enable @typescript-eslint/prefer-readonly-parameter-types */

  // oxlint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- DOM query APIs operate on mutable HTMLElement instances.
  #findBoundControl(hostEl: HTMLElement): HTMLElement | null {
    const nativeControl = this.#queryHostElement(
      hostEl,
      'input[id], textarea[id], select[id], button[type="button"][id]',
    );

    if (nativeControl) {
      return nativeControl;
    }

    return this.#queryHostElement(
      hostEl,
      '[id][formField], [id][ng-reflect-form-field], [id][data-ngx-signal-form-control]',
    );
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
   * when the bound host element has an `id` attribute.
   *
   * **Explicit override:**
   * Provide an explicit field name when you need to override the automatic behavior
   * or when the input element doesn't have an `id` attribute.
   *
   * **Strict identity:**
   * If neither `fieldName` nor a bound control `id` is available, the wrapper throws.
   * This keeps ARIA linking deterministic and avoids silently inventing field names.
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
   * @default Inherited from form context or 'on-touch'
   */
  readonly strategy = input<ErrorDisplayStrategy | null>(null);

  /**
   * Placement of the automatic error or warning messages.
   *
   * - `bottom` (default): render messages in the assistive row beneath the field
   * - `top`: render messages between the label and the field control
   */
  readonly errorPlacement = input<FormFieldErrorPlacement>('bottom');

  /**
   * Form field appearance variant.
   *
   * - `'standard'`: Label above input (default)
   * - `'outline'`: Material Design outlined appearance with floating label
   * - `'inherit'`: Use the global config default
   *
   * @default 'inherit'
   */
  readonly appearance = input<FormFieldAppearanceInput>('inherit');

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
   * Reference to the host element for DOM queries.
   */
  readonly #elementRef = inject(ElementRef<HTMLElement>);

  /**
   * Signal holding the input element's ID attribute.
   * Set by afterNextRender after content projection is complete.
   */
  readonly #inputElementId = signal<string | null>(null);

  /**
   * Whether outline appearance should be applied.
   */
  protected readonly isOutline = computed(() => {
    const componentAppearance = this.appearance();
    if (componentAppearance === 'outline') {
      return true;
    }
    if (componentAppearance === 'standard') {
      return false;
    }

    return this.#config.defaultFormFieldAppearance === 'outline';
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
   * Resolved field name computed from two sources (in priority order):
   * 1. Explicit `fieldName` input (highest priority)
   * 2. Input element's `id` attribute (automatic, recommended)
   *
   * Throws when neither is available.
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
      const trimmed = explicit.trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
    }

    // Priority 2: Derive from input element's id attribute (signal updated by afterNextRender)
    const idFromInput = this.#inputElementId();
    if (idFromInput) {
      return idFromInput;
    }

    const controlId = this.#findBoundControl(
      this.#getHostElement(),
    )?.getAttribute('id');
    if (controlId) {
      return controlId;
    }

    throw new Error(
      '[ngx-signal-forms] Could not resolve a deterministic field name for ngx-signal-form-field-wrapper. Add an explicit `fieldName` input or an `id` attribute to the bound control.',
    );
  });

  /**
   * Effective error display strategy combining component input and form context defaults.
   */
  protected readonly effectiveStrategy = computed(() => {
    const formContext = this.#formContext;

    return resolveErrorDisplayStrategy(
      this.strategy(),
      formContext ? formContext.errorStrategy() : undefined,
      this.#config.defaultErrorStrategy,
    );
  });

  /**
   * Computed signal for submission status.
   * Gets Angular's SubmittedStatus from the form provider context if available,
   * otherwise defaults to 'unsubmitted'.
   */
  protected readonly submittedStatus = computed(() => {
    const formContext = this.#formContext;

    return formContext ? formContext.submittedStatus() : 'unsubmitted';
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
    return typeof errorsGetter === 'function' ? errorsGetter() : [];
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

  protected readonly isTopPlacement = computed(() => {
    return this.errorPlacement() === 'top';
  });

  constructor() {
    // Query DOM for input element ID after first render (content projection complete).
    // Uses afterNextRender (Angular 19+) instead of legacy ngAfterContentInit.
    // The signal update triggers error component to re-render with correct ID.
    afterNextRender(() => {
      const hostEl = this.#getHostElement();

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
      const hostEl = this.#getHostElement();

      const inputEl = this.#findBoundControl(hostEl);

      if (inputEl) {
        inputEl.setAttribute('data-signal-field', fieldName);
      }
    });
  }
}
