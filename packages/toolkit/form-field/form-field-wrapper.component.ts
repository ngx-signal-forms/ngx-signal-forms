import {
  afterEveryRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  ElementRef,
  inject,
  input,
  type Signal,
  signal,
} from '@angular/core';
import type { FieldTree } from '@angular/forms/signals';
import type {
  ErrorDisplayStrategy,
  FormFieldAppearanceInput,
  NgxSignalFormHintDescriptor,
} from '@ngx-signal-forms/toolkit';
import {
  NGX_SIGNAL_FORM_CONTROL_PRESETS,
  NGX_SIGNAL_FORM_FIELD_CONTEXT,
  NGX_SIGNAL_FORM_HINT_REGISTRY,
  NGX_SIGNAL_FORMS_CONFIG,
  createShowErrorsComputed,
  injectFormContext,
  isFieldStateHidden,
  readDirectErrors,
  type ResolvedNgxSignalFormControlSemantics,
  resolveNgxSignalFormControlSemantics,
  resolveErrorDisplayStrategy,
} from '@ngx-signal-forms/toolkit';
import {
  isBlockingError,
  isWarningError,
  NgxFormFieldAssistiveRowComponent,
  NgxFormFieldErrorComponent,
  NgxFormFieldHintComponent,
} from '@ngx-signal-forms/toolkit/assistive';
import {
  hasPaddedControlContent,
  isSelectionGroupKind,
  isTextualControlKind,
  supportsOutlinedAppearance,
  type FormFieldControlKind,
} from './form-field.utils';

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
 * - Outlined appearance with floating label (`appearance="outline"`)
 * - Plain appearance for custom or low-chrome fields (`appearance="plain"`)
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
 *   strategy="on-submit"
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
  imports: [NgxFormFieldErrorComponent, NgxFormFieldAssistiveRowComponent],
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
    {
      provide: NGX_SIGNAL_FORM_HINT_REGISTRY,
      useFactory: () => {
        const component = inject(NgxSignalFormFieldWrapperComponent);
        return { hints: component.hintDescriptors };
      },
    },
  ],
  styleUrl: './form-field-wrapper.component.scss',
  host: {
    '[attr.outline]': 'isOutline() ? "" : null',
    '[attr.aria-invalid]': 'showInvalidState() ? "true" : "false"',
    '[attr.hidden]': 'isFieldHidden() ? "" : null',
    '[attr.data-ngx-signal-form-control-aria-mode]':
      'resolvedControlAriaMode()',
    '[attr.data-ngx-signal-form-control-kind]': 'resolvedControlKind()',
    '[attr.data-ngx-signal-form-control-layout]': 'resolvedControlLayout()',
    '[class.ngx-signal-form-field-wrapper--invalid]': 'showInvalidState()',
    '[class.ngx-signal-form-field-wrapper--warning]': 'showWarningState()',
    '[class.ngx-signal-form-field-wrapper--messages-top]': 'isTopPlacement()',
    '[class.ngx-signal-form-field-wrapper--messages-bottom]':
      '!isTopPlacement()',
    '[class.ngx-signal-form-field-wrapper--textual]': 'isTextualControl()',
    '[class.ngx-signal-form-field-wrapper--checkbox]': 'isCheckboxControl()',
    '[class.ngx-signal-form-field-wrapper--selection-group]':
      'isSelectionGroupControl()',
    '[class.ngx-signal-form-field-wrapper--switch]': 'isSwitchControl()',
    '[class.ngx-signal-form-field-wrapper--padded-control]':
      'hasPaddedContentControl()',
    '[class.ngx-signal-forms-outline]': 'isOutline()',
    '[class.ngx-signal-forms-plain]': 'isPlain()',
    '[attr.data-error-placement]': 'errorPlacement()',
    '[attr.data-show-required]':
      'isOutline() && resolvedShowRequiredMarker() ? "true" : null',
    '[attr.data-required-marker]':
      'isOutline() && resolvedShowRequiredMarker() ? resolvedRequiredMarker() : null',
  },
  template: `
    <!-- Label slot (outside bordered container for stacked layout, visually inside for outline via CSS) -->
    <div class="ngx-signal-form-field-wrapper__label">
      <ng-content select="label" />
    </div>

    @if (isTopPlacement() && shouldShowErrors()) {
      <div class="ngx-signal-form-field-wrapper__messages">
        <ngx-form-field-error
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
        <ngx-form-field-error
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
   * - `'stacked'`: Label above input (default)
   * - `'outline'`: Material-inspired outlined appearance with floating label
   * - `'plain'`: Minimal wrapper chrome while keeping labels, hints, and errors
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

  readonly #controlPresets = inject(NGX_SIGNAL_FORM_CONTROL_PRESETS);

  /**
   * Form context (optional, for submission state tracking).
   */
  readonly #formContext = injectFormContext();

  /**
   * Reference to the host element for DOM queries.
   */
  readonly #elementRef = inject(ElementRef<HTMLElement>);

  /**
   * Signal holding the input element's ID attribute.
   * Updated from the post-render DOM inspection after content projection settles.
   */
  readonly #inputElementId = signal<string | null>(null);
  readonly #boundControlElement = signal<HTMLElement | null>(null);

  readonly #controlSemantics = signal<ResolvedNgxSignalFormControlSemantics>({
    kind: null,
    layout: null,
    ariaMode: null,
  });

  readonly #controlKind = computed<FormFieldControlKind>(
    () => this.#controlSemantics().kind,
  );

  /**
   * Whether outline appearance should be applied.
   */
  protected readonly isOutline = computed(() => {
    // Defer outline until the projected control is discovered so selection
    // controls never flash outline chrome on the first render frame.
    if (this.#boundControlElement() === null) {
      return false;
    }
    const controlKind = this.#controlKind();
    if (!supportsOutlinedAppearance(controlKind)) {
      return false;
    }

    switch (this.appearance()) {
      case 'outline':
        return true;
      case 'stacked':
      case 'plain':
        return false;
      default:
        return this.#config.defaultFormFieldAppearance === 'outline';
    }
  });

  protected readonly isPlain = computed(() => {
    const appearance = this.appearance();

    return (
      appearance === 'plain' ||
      (appearance === 'inherit' &&
        this.#config.defaultFormFieldAppearance === 'plain')
    );
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

  protected readonly resolvedControlKind = computed(() => {
    return this.#controlKind();
  });

  protected readonly isTextualControl = computed(() => {
    return isTextualControlKind(this.#controlKind());
  });

  protected readonly isCheckboxControl = computed(() => {
    return this.#controlKind() === 'checkbox';
  });

  protected readonly isSelectionGroupControl = computed(() => {
    return isSelectionGroupKind(this.#controlKind());
  });

  protected readonly isSwitchControl = computed(() => {
    return this.#controlKind() === 'switch';
  });

  protected readonly hasPaddedContentControl = computed(() => {
    return hasPaddedControlContent(this.#controlKind());
  });

  protected readonly resolvedControlLayout = computed(() => {
    return this.#controlSemantics().layout;
  });

  protected readonly resolvedControlAriaMode = computed(() => {
    return this.#controlSemantics().ariaMode;
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
   * Hint children projected into this wrapper. Used to expose a
   * `NgxSignalFormHintRegistry` to the `NgxSignalFormAutoAriaDirective` that
   * runs on the bound control, without auto-ARIA needing to query the DOM.
   *
   * @internal Angular's `contentChildren` API requires non-private visibility,
   * so this uses `protected` instead of `#`.
   */
  protected readonly hintChildren = contentChildren(NgxFormFieldHintComponent, {
    descendants: true,
  });

  /**
   * Reactive view of the projected hints, shaped for the
   * `NGX_SIGNAL_FORM_HINT_REGISTRY` contract in the core package.
   */
  readonly hintDescriptors: Signal<readonly NgxSignalFormHintDescriptor[]> =
    computed(() =>
      this.hintChildren().map((hint) => ({
        id: hint.resolvedId(),
        fieldName: hint.resolvedFieldName(),
      })),
    );

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
   * Cached field state signal. Every downstream computed
   * (`#allMessages`, `isFieldHidden`, `#showErrorsByStrategy`, and the
   * `resolvedControlSemantics` effects) used to re-read `this.formField()()`
   * independently. With a single cache the signal graph collapses those
   * reads into one dependency node, which matters on forms with dozens of
   * wrappers all reacting to the same change-detection cycle.
   */
  readonly #fieldState = computed(() => this.formField()());

  readonly #allMessages = computed(() => readDirectErrors(this.#fieldState()));

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
   * Whether the wrapper should render its invalid visual state.
   * Mirrors the same timing rules as automatic error display so native inputs
   * and custom FormValueControl hosts share one consistent border treatment.
   */
  protected readonly showInvalidState = computed(() => {
    return this.hasErrors() && this.shouldShowErrors();
  });

  /**
   * Whether the bound field is currently hidden via Angular's `hidden()`
   * schema logic. When `true` we suppress error/warning rendering and mark
   * the host element with the `hidden` attribute so screen readers skip it
   * — Angular Signal Forms documents that hiding is the consumer's job
   * (`@if`), but the wrapper stays safe even if the consumer forgets.
   *
   * **Why no `disabled()` check here**: disabled fields are excluded from
   * Angular's validation entirely, so `errors().length === 0` already
   * short-circuits `shouldShowErrors()`. A disabled field is also still
   * visually present, so tagging the wrapper `[attr.hidden]` would be
   * wrong. `focusFirstInvalid` and the error summary (which can aggregate
   * across subtrees) do check both; this component only needs `hidden()`.
   */
  protected readonly isFieldHidden = computed(() => {
    return isFieldStateHidden(this.#fieldState());
  });

  /**
   * Visibility-timing computed shared with `showErrors()`, auto-aria, and
   * the error component. Reads `invalid()` / `touched()` off the field state
   * and runs the same strategy logic — keeping every surface in lockstep.
   */
  readonly #showErrorsByStrategy = createShowErrorsComputed(
    this.#fieldState,
    this.effectiveStrategy,
    this.submittedStatus,
  );

  /**
   * Whether to actually display errors based on current strategy and field state.
   * This controls when the error component replaces the hint.
   *
   * Short-circuits on `hidden()` and empty-error cases before consulting the
   * shared visibility-timing helper.
   */
  protected readonly shouldShowErrors = computed(() => {
    if (this.isFieldHidden()) return false;
    if (this.#allMessages().length === 0) return false;
    return this.#showErrorsByStrategy();
  });

  /**
   * Whether to apply warning styling to the form field container.
   * Warning styling is shown only when:
   * 1. Field has warnings
   * 2. Field has NO errors (errors take visual priority)
   */
  protected readonly showWarningState = computed(() => {
    return this.hasWarnings() && !this.showInvalidState();
  });

  protected readonly isTopPlacement = computed(() => {
    return this.errorPlacement() === 'top';
  });

  constructor() {
    // Single afterEveryRender with proper phased callbacks:
    // - earlyRead: read projected control metadata from the DOM before writes
    // - write: update signals only when values changed, then write data-signal-field
    afterEveryRender({
      earlyRead: () => {
        const hostEl = this.#getHostElement();

        // DOM-query cache: skip `querySelector` when the previously bound
        // control is still mounted inside this host AND still carries an
        // `id` attribute (without the id it no longer satisfies the query
        // `#findBoundControl` runs, so the cache must release it). This is
        // a hot path on large forms — every change-detection cycle used
        // to run a `querySelector` chain per wrapper before. The
        // `isConnected` + `hostEl.contains` guard covers the common
        // `@if`-branch-swap case (Angular removes the old node from its
        // parent on branch change). Not handled: moving `[formField]` to
        // a sibling element inside the same template branch without a
        // re-render — a rare author-error edge case; if it surfaces we'd
        // add a `MutationObserver` in a follow-up.
        const cached = this.#boundControlElement();
        const cacheHit =
          cached &&
          cached.isConnected &&
          hostEl.contains(cached) &&
          cached.hasAttribute('id');
        const inputEl = cacheHit ? cached : this.#findBoundControl(hostEl);

        return {
          inputEl,
          inputId: inputEl?.getAttribute('id') ?? null,
          semantics: resolveNgxSignalFormControlSemantics(
            inputEl,
            this.#controlPresets,
          ),
        };
      },
      // oxlint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- afterEveryRender passes DOM-backed render state with mutable HTMLElement references.
      write: (renderState) => {
        const { inputEl, inputId, semantics } = renderState;
        const previousBoundControl = this.#boundControlElement();

        if (previousBoundControl !== inputEl) {
          previousBoundControl?.removeAttribute('data-signal-field');
          this.#boundControlElement.set(inputEl);
        }

        if (inputId !== this.#inputElementId()) {
          this.#inputElementId.set(inputId);
        }

        const current = this.#controlSemantics();
        if (
          current.kind !== semantics.kind ||
          current.layout !== semantics.layout ||
          current.ariaMode !== semantics.ariaMode
        ) {
          this.#controlSemantics.set(semantics);
        }

        // Set data-signal-field attribute for debugging/testing.
        if (inputEl) {
          inputEl.setAttribute('data-signal-field', this.resolvedFieldName());
        }
      },
    });
  }
}
