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
  isDevMode,
  type Signal,
  signal,
} from '@angular/core';
import type { FieldTree } from '@angular/forms/signals';
import type {
  ErrorDisplayStrategy,
  FormFieldAppearance,
  FormFieldAppearanceInput,
  FormFieldOrientation,
  FormFieldOrientationInput,
  NgxFormFieldErrorPlacement,
} from '@ngx-signal-forms/toolkit';
import {
  NGX_SIGNAL_FORM_CONTROL_PRESETS,
  NGX_SIGNAL_FORM_FIELD_CONTEXT,
  NGX_SIGNAL_FORMS_CONFIG,
  createShowErrorsComputed,
  injectFormContext,
  isBlockingError,
  isFieldStateHidden,
  isFormFieldAppearance,
  isFormFieldOrientation,
  isWarningError,
  readDirectErrors,
  type ResolvedNgxSignalFormControlSemantics,
  resolveNgxSignalFormControlSemantics,
  resolveErrorDisplayStrategy,
} from '@ngx-signal-forms/toolkit';
import {
  NGX_SIGNAL_FORM_HINT_REGISTRY,
  type NgxSignalFormHintDescriptor,
  NgxFieldIdentity,
  isElementCssVisible,
} from '@ngx-signal-forms/toolkit/core';
import {
  NgxFormFieldAssistiveRow,
  NgxFormFieldError,
  NgxFormFieldHint,
} from '@ngx-signal-forms/toolkit/assistive';
import {
  findBoundControl,
  hasPaddedControlContent,
  isSelectionGroupKind,
  isTextualControlKind,
  requireHostElement,
  supportsOutlinedAppearance,
  type FormFieldControlKind,
} from './form-field.utils';

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
 * <ngx-form-field-wrapper [formField]="form.email" fieldName="email">
 *   <label for="email">Email</label>
 *   <input id="email" [formField]="form.email" />
 * </ngx-form-field-wrapper>
 * ```
 *
 * @example With Custom Error Strategy
 * ```html
 * <ngx-form-field-wrapper
 *   [formField]="form.password"
 *   fieldName="password"
 *   strategy="on-submit"
 * >
 *   <label for="password">Password</label>
 *   <input id="password" type="password" [formField]="form.password" />
 * </ngx-form-field-wrapper>
 * ```
 *
 * @example Outlined Layout
 * ```html
 * <ngx-form-field-wrapper [formField]="form.email" appearance="outline">
 *   <label for="email">Email Address</label>
 *   <input id="email" type="email" [formField]="form.email" required placeholder="you@example.com" />
 * </ngx-form-field-wrapper>
 * ```
 *
 * @example With Character Count
 * ```html
 * <ngx-form-field-wrapper [formField]="form.bio" appearance="outline">
 *   <label for="bio">Bio</label>
 *   <textarea id="bio" [formField]="form.bio"></textarea>
 *   <ngx-form-field-character-count [formField]="form.bio" [maxLength]="500" />
 * </ngx-form-field-wrapper>
 * ```
 *
 * @example With Hint Text
 * ```html
 * <ngx-form-field-wrapper [formField]="form.phone">
 *   <label for="phone">Phone Number</label>
 *   <input id="phone" [formField]="form.phone" />
 *   <ngx-form-field-hint>Format: 123-456-7890</ngx-form-field-hint>
 * </ngx-form-field-wrapper>
 * ```
 *
 * @example With Prefix Icon
 * ```html
 * <ngx-form-field-wrapper [formField]="form.search">
 *   <span prefix aria-hidden="true">🔍</span>
 *   <label for="search">Search</label>
 *   <input id="search" [formField]="form.search" />
 * </ngx-form-field-wrapper>
 * ```
 *
 * @example With Suffix Button
 * ```html
 * <ngx-form-field-wrapper [formField]="form.password">
 *   <label for="password">Password</label>
 *   <input id="password" type="password" [formField]="form.password" />
 *   <button suffix type="button" (click)="togglePassword()">Show</button>
 * </ngx-form-field-wrapper>
 * ```
 *
 * @example With Both Prefix and Suffix
 * ```html
 * <ngx-form-field-wrapper [formField]="form.amount">
 *   <span prefix aria-hidden="true">$</span>
 *   <label for="amount">Amount</label>
 *   <input id="amount" type="number" [formField]="form.amount" />
 *   <span suffix aria-hidden="true">.00</span>
 * </ngx-form-field-wrapper>
 * ```
 *
 * @example Grouped Radio/Checkbox Heading
 * ```html
 * <ngx-form-field-wrapper [formField]="form.deliveryMethod" fieldName="delivery-method">
 *   <span ngxFormFieldLabel>Delivery option *</span>
 *
 *   <div>
 *     <label>
 *       <input type="radio" value="standard" [formField]="form.deliveryMethod" />
 *       Standard
 *     </label>
 *     <label>
 *       <input type="radio" value="express" [formField]="form.deliveryMethod" />
 *       Express
 *     </label>
 *   </div>
 * </ngx-form-field-wrapper>
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
  selector: 'ngx-form-field-wrapper',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgxFormFieldError, NgxFormFieldAssistiveRow],
  providers: [
    NgxFieldIdentity,
    {
      provide: NGX_SIGNAL_FORM_FIELD_CONTEXT,
      useFactory: () => {
        const component = inject(NgxFormFieldWrapper);
        return {
          fieldName: component.resolvedFieldName,
        };
      },
    },
    {
      provide: NGX_SIGNAL_FORM_HINT_REGISTRY,
      useFactory: () => {
        const component = inject(NgxFormFieldWrapper);
        return { hints: component.hintDescriptors };
      },
    },
  ],
  styleUrls: ['./form-field-wrapper.css', './form-field-wrapper.selection.css'],
  host: {
    '[attr.outline]': 'isOutline() ? "" : null',
    // NOTE: `aria-invalid` is intentionally NOT bound on the host. ARIA
    // `aria-invalid` only belongs on form controls (the projected `<input>`,
    // `<textarea>`, `<select>`, or `FormValueControl` host) — not on a
    // wrapper. Auto-aria writes `aria-invalid` directly to the bound control;
    // duplicating it here would either be ignored by assistive tech or, worse,
    // cause confusing double-announcements (WCAG 4.1.2).
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
    '[class.ngx-signal-form-field-wrapper--selection-cluster]':
      'isSelectionCluster()',
    '[class.ngx-signal-form-field-wrapper--switch]': 'isSwitchControl()',
    '[class.ngx-signal-form-field-wrapper--padded-control]':
      'hasPaddedContentControl()',
    '[class.ngx-signal-forms-outline]': 'isOutline()',
    '[class.ngx-signal-forms-plain]': 'isPlain()',
    '[class.ngx-signal-form-field-wrapper--horizontal]': 'isHorizontal()',
    '[attr.data-orientation]': 'resolvedOrientation()',
    '[attr.data-error-placement]': 'errorPlacement()',
    '[attr.data-show-required]': 'showRequiredMarkerVisible() ? "true" : null',
    '[attr.role]': 'selectionClusterRole()',
    '[attr.aria-labelledby]': 'selectionClusterLabelledBy()',
    '[attr.aria-describedby]': 'selectionClusterDescribedBy()',
  },
  template: `
    <!-- Label slot (outside bordered container for standard layout, visually inside for outline via CSS) -->
    <div class="ngx-signal-form-field-wrapper__label">
      <ng-content select="label, [ngxFormFieldLabel]" />
      @if (showRequiredMarkerVisible()) {
        <!--
          Required marker rendered in the template (not via CSS ::after content)
          so screen readers do not double-announce "required" alongside the
          control's own \`aria-required\` attribute. \`aria-hidden="true"\` keeps
          the asterisk purely visual (WCAG 1.3.1, 4.1.2).
        -->
        <span
          class="ngx-signal-form-field-wrapper__required-marker"
          aria-hidden="true"
          >{{ resolvedRequiredMarker() }}</span
        >
      }
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
    <ngx-form-field-assistive-row
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
        <ng-content select="ngx-form-field-hint" />
      </div>

      <!-- Right side: character count -->
      <ng-content select="ngx-form-field-character-count" />
    </ngx-form-field-assistive-row>
  `,
})
export class NgxFormFieldWrapper<TValue = unknown> {
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
   * If neither `fieldName` nor a bound control `id` is available, the
   * wrapper emits a dev-mode `console.error` and skips ARIA wiring. This
   * keeps ARIA linking deterministic (no inventing names that drift between
   * instances) without blowing up production rendering.
   *
   * @example Automatic (native input) - derives "email" from input's id attribute
   * ```html
   * <ngx-form-field-wrapper [formField]="form.email">
   *   <label for="email">Email</label>
   *   <input id="email" [formField]="form.email" />
   * </ngx-form-field-wrapper>
   * ```
   *
   * @example Custom control (FormValueControl) - derives "rating" from component's id
   * ```html
   * <ngx-form-field-wrapper [formField]="form.rating">
   *   <label for="rating">Rating</label>
   *   <app-rating-control id="rating" [formField]="form.rating" />
   * </ngx-form-field-wrapper>
   * ```
   *
   * @example Explicit override
   * ```html
   * <ngx-form-field-wrapper [formField]="form.email" fieldName="user-email">
   *   <label for="user-email">Email</label>
   *   <input id="user-email" [formField]="form.email" />
   * </ngx-form-field-wrapper>
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
  readonly errorPlacement = input<NgxFormFieldErrorPlacement>('bottom');

  /**
   * Form field appearance variant.
   *
   * - `'standard'`: Label above input (default)
   * - `'outline'`: Material-inspired outlined appearance with floating label
   * - `'plain'`: Minimal wrapper chrome while keeping labels, hints, and errors
   * - `'inherit'`: Use the global config default
   *
   * @default 'inherit'
   */
  readonly appearance = input<FormFieldAppearanceInput>('inherit');

  /**
   * Form field orientation.
   *
   * - `'vertical'`: Label above input (default)
   * - `'horizontal'`: Label to the left of the input
   * - `'inherit'`: Use the global config default
   *
   * Outline fields always resolve to vertical because the floating-label
   * treatment depends on the label sitting inside the bordered container.
   *
   * Selection controls (checkbox, switch, radio-group) ignore this setting
   * because they already manage their own inline layout.
   *
   * @default 'inherit'
   */
  readonly orientation = input<FormFieldOrientationInput>('inherit');

  /**
   * Whether to show the required marker in outlined fields.
   * Falls back to NgxSignalFormsConfig.showRequiredMarker when unset.
   */
  readonly showRequiredMarker = input<unknown>();

  /**
   * Custom character(s) for the required marker in outlined fields.
   * Falls back to NgxSignalFormsConfig.requiredMarker when unset.
   */
  readonly requiredMarker = input<string | undefined>();

  /**
   * Toolkit configuration for default appearance.
   */
  readonly #config = inject(NGX_SIGNAL_FORMS_CONFIG);

  readonly #controlPresets = inject(NGX_SIGNAL_FORM_CONTROL_PRESETS);

  /**
   * Shared field-identity service. Provided by this component so auto-aria
   * and future surfaces can read field name, error / warning IDs, and the
   * bound control element through a single, centralized source of truth.
   */
  readonly #fieldIdentity = inject(NgxFieldIdentity);

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

  /**
   * Tracks whether the bound control is required, mirroring what the previous
   * `:has([required])` / `:has([aria-required='true'])` CSS selectors detected.
   * Updated in the post-render `write` callback so the template-rendered
   * required marker stays in sync with the projected control's attributes.
   */
  readonly #boundControlIsRequired = signal(false);
  readonly #isSelectionCluster = signal(false);
  readonly #selectionClusterLabelId = signal<string | null>(null);

  readonly #controlSemantics = signal<ResolvedNgxSignalFormControlSemantics>({
    kind: null,
    layout: null,
    ariaMode: null,
  });
  #warnedUnresolvedKind = false;

  readonly #controlKind = computed<FormFieldControlKind>(
    () => this.#controlSemantics().kind,
  );

  #warnedInvalidAppearance = false;

  protected readonly resolvedAppearance = computed<FormFieldAppearance>(() => {
    const appearance = this.appearance();

    if (appearance === 'inherit') {
      return this.#config.defaultFormFieldAppearance;
    }

    if (isFormFieldAppearance(appearance)) {
      // Exhaustiveness pin: switch on the resolved literal so any future
      // `FormFieldAppearance` value forces a TypeScript error here until the
      // matching wrapper branch (chrome, ARIA hooks) is added.
      switch (appearance) {
        case 'standard':
        case 'outline':
        case 'plain':
          return appearance;
        default:
          appearance satisfies never;
          return this.#config.defaultFormFieldAppearance;
      }
    }

    if (isDevMode() && !this.#warnedInvalidAppearance) {
      this.#warnedInvalidAppearance = true;
      const raw = appearance as string;
      const hint =
        raw === 'stacked'
          ? " The 'stacked' appearance was renamed to 'standard' in v1 rc.5."
          : raw === 'bare'
            ? " The 'bare' appearance was renamed to 'plain' in v1 rc.1."
            : '';
      // oxlint-disable-next-line no-console -- dev-mode misconfiguration signal
      console.error(
        `[ngx-signal-forms] NgxFormFieldWrapper: unknown appearance "${raw}". ` +
          `Expected 'standard' | 'outline' | 'plain' | 'inherit'. ` +
          `Falling back to the global default.${hint}`,
      );
    }

    return this.#config.defaultFormFieldAppearance;
  });

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

    return this.resolvedAppearance() === 'outline';
  });

  protected readonly isPlain = computed(() => {
    return this.resolvedAppearance() === 'plain';
  });

  /**
   * Effective orientation for theming hooks (`data-orientation` attribute).
   *
   * Outline appearance and selection-control rows force vertical layout.
   */
  #warnedInvalidOrientation = false;

  protected readonly resolvedOrientation = computed<FormFieldOrientation>(
    () => {
      const orientation = this.orientation();
      const requestedOrientation = this.#resolveOrientationInput(orientation);
      const controlKind = this.#controlKind();

      if (
        this.resolvedAppearance() === 'outline' ||
        controlKind === 'checkbox' ||
        controlKind === 'switch' ||
        controlKind === 'radio-group'
      ) {
        return 'vertical';
      }

      return requestedOrientation;
    },
  );

  #resolveOrientationInput(
    orientation: FormFieldOrientationInput,
  ): FormFieldOrientation {
    if (orientation === 'inherit') {
      return this.#config.defaultFormFieldOrientation;
    }

    if (isFormFieldOrientation(orientation)) {
      switch (orientation) {
        case 'vertical':
        case 'horizontal':
          return orientation;
        default:
          orientation satisfies never;
          return this.#config.defaultFormFieldOrientation;
      }
    }

    if (isDevMode() && !this.#warnedInvalidOrientation) {
      this.#warnedInvalidOrientation = true;
      // oxlint-disable-next-line no-console -- dev-mode misconfiguration signal
      console.error(
        `[ngx-signal-forms] NgxFormFieldWrapper: unknown orientation ` +
          `"${orientation as string}". Expected 'vertical' | 'horizontal' | ` +
          `'inherit'. Falling back to the global default.`,
      );
    }

    return this.#config.defaultFormFieldOrientation;
  }

  /**
   * Whether horizontal layout should be applied.
   */
  protected readonly isHorizontal = computed(
    () => this.resolvedOrientation() === 'horizontal',
  );

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
   * Whether the visual required marker (`<span aria-hidden="true">`) should
   * render in the template. Mirrors the previous CSS-driven contract:
   *
   * - outline appearance is active
   * - `resolvedShowRequiredMarker()` is true (consumer/config opt-in)
   * - the bound control declares required-ness via `[required]` or
   *   `[aria-required="true"]`
   *
   * Encoded in TypeScript so the marker can live in the template — generated
   * `::after` content was being read aloud by NVDA/VoiceOver in addition to
   * the control's own `aria-required`, causing double announcement (WCAG
   * 1.3.1, 4.1.2).
   */
  protected readonly showRequiredMarkerVisible = computed(() => {
    return (
      this.isOutline() &&
      this.resolvedShowRequiredMarker() &&
      this.#boundControlIsRequired()
    );
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

  protected readonly isSelectionCluster = computed(() => {
    return this.#isSelectionCluster();
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

  #warnedUnresolvedFieldName = false;

  /**
   * Resolved field name computed from two sources (in priority order):
   * 1. Explicit `fieldName` input (highest priority)
   * 2. Input element's `id` attribute (automatic, recommended)
   *
   * Returns `null` when neither source is available. A dev-mode
   * `console.error` is emitted once per instance so the misconfiguration
   * is surfaced loudly without crashing the render tree. Downstream
   * consumers (auto-ARIA, hint registry, projected error component)
   * handle `null` by skipping the `aria-describedby` wiring.
   *
   * @remarks
   * This signal is public to allow child components to access the resolved field name
   * via the `NGX_SIGNAL_FORM_FIELD_CONTEXT` injection token.
   */
  readonly resolvedFieldName = computed<string | null>(() => {
    // Priority 1: Explicit fieldName input
    const explicit = this.fieldName();
    if (explicit !== undefined) {
      const trimmed = explicit.trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
    }

    // Priority 2: Derive from input element's id attribute (signal updated by afterEveryRender)
    const idFromInput = this.#inputElementId();
    if (idFromInput) {
      return idFromInput;
    }

    const controlId = findBoundControl(
      requireHostElement(this.#elementRef),
    )?.id;
    if (controlId !== undefined && controlId.length > 0) {
      return controlId;
    }

    if (isDevMode() && !this.#warnedUnresolvedFieldName) {
      this.#warnedUnresolvedFieldName = true;
      console.error(
        '[ngx-signal-forms] Could not resolve a deterministic field name for ngx-form-field-wrapper. Add an explicit `fieldName` input or an `id` attribute to the bound control. ARIA wiring will be skipped until a name is available.',
      );
    }

    return null;
  });

  /**
   * Hint children projected into this wrapper. Used to expose a
   * `NgxSignalFormHintRegistry` to the `NgxSignalFormAutoAria` that
   * runs on the bound control, without auto-ARIA needing to query the DOM.
   *
   * Angular's `contentChildren` API requires non-private visibility,
   * so this uses `protected` instead of `#`.
   *
   * @internal
   */
  protected readonly hintChildren = contentChildren(NgxFormFieldHint, {
    descendants: true,
  });

  /**
   * Reactive view of the projected hints, shaped for the
   * `NGX_SIGNAL_FORM_HINT_REGISTRY` contract in the core package.
   *
   * Exposed so this component can provide itself into the hint registry via
   * a decorator-level `useFactory` (TypeScript access modifiers would block
   * that). Not part of the stable public component API — consumers reading
   * hints should go through `NGX_SIGNAL_FORM_HINT_REGISTRY`, which is itself
   * internal, rather than touching this field directly.
   *
   * @internal
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

  protected readonly selectionClusterRole = computed<
    'group' | 'radiogroup' | null
  >(() => {
    if (!this.isSelectionCluster()) {
      return null;
    }

    return this.#controlKind() === 'radio-group' ? 'radiogroup' : 'group';
  });

  protected readonly selectionClusterLabelledBy = computed<string | null>(
    () => {
      if (!this.isSelectionCluster()) {
        return null;
      }

      return this.#selectionClusterLabelId();
    },
  );

  protected readonly selectionClusterDescribedBy = computed<string | null>(
    () => {
      if (!this.isSelectionCluster()) {
        return null;
      }

      const fieldName = this.resolvedFieldName();
      if (fieldName === null) {
        return null;
      }

      if (this.showInvalidState()) {
        return `${fieldName}-error`;
      }

      // `shouldShowErrors()` gates the `<ngx-form-field-error>` template, so
      // the `${fieldName}-warning` id only exists in the DOM when that branch
      // renders. Guard `aria-describedby` on the same signal to avoid dangling
      // references for warning-only clusters with `showErrors="false"`.
      if (this.showWarningState() && this.shouldShowErrors()) {
        return `${fieldName}-warning`;
      }

      return null;
    },
  );

  constructor() {
    // Single afterEveryRender with proper phased callbacks:
    // - earlyRead: read projected control metadata from the DOM before writes
    // - write: update signals only when values changed, then write data-signal-field
    //
    // `afterEveryRender` (not `afterNextRender`) is deliberate: the projected
    // `[formField]` control can be swapped at any render — `@if` branch flips,
    // `@for` reorder, or a dynamic component swap — and we need to re-resolve
    // it each time. The `cacheHit` check at the top of `earlyRead` keeps the
    // steady-state cost to a handful of DOM attribute reads when nothing has
    // changed; only a real swap falls through to `findBoundControl`.
    afterEveryRender({
      earlyRead: () => {
        const hostEl = requireHostElement(this.#elementRef);

        // DOM-query cache: reuse the previously bound control when it is
        // still mounted inside this host AND still carries an `id` (without
        // the id it no longer satisfies the `findBoundControl` selector).
        // The `isConnected` + `hostEl.contains` guard covers the common
        // `@if`-branch-swap case where Angular detaches the old node from
        // its parent on branch change. Moving `[formField]` to a sibling
        // inside the same template branch without a re-render is an
        // author-error edge case this cache does not catch.
        const cached = this.#boundControlElement();
        // oxlint-disable-next-line @typescript-eslint/prefer-optional-chain -- rewriting to `cached?.isConnected` trades one lint rule for another (strict-boolean-expressions on the resulting nullable boolean)
        const cacheHit =
          cached &&
          cached.isConnected &&
          hostEl.contains(cached) &&
          cached.hasAttribute('id');
        const inputEl = cacheHit ? cached : findBoundControl(hostEl);

        return {
          inputEl,
          inputId: inputEl && inputEl.id.length > 0 ? inputEl.id : null,
          semantics: resolveNgxSignalFormControlSemantics(
            inputEl,
            this.#controlPresets,
          ),
          selectionControlCount: hostEl.querySelectorAll(
            "input[type='radio'], input[type='checkbox']:not([role='switch']), [role='radio'], [role='checkbox']",
          ).length,
          label: hostEl.querySelector(
            ':scope > .ngx-signal-form-field-wrapper__label :is(label, [ngxFormFieldLabel])',
          ),
        };
      },
      // oxlint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- afterEveryRender passes DOM-backed render state with mutable HTMLElement references.
      write: (renderState) => {
        const { inputEl, inputId, semantics, selectionControlCount, label } =
          renderState;
        const previousBoundControl = this.#boundControlElement();

        if (previousBoundControl !== inputEl) {
          previousBoundControl?.removeAttribute('data-signal-field');
          this.#boundControlElement.set(inputEl);
        }

        if (inputId !== this.#inputElementId()) {
          this.#inputElementId.set(inputId);
        }

        // Replaces the previous CSS `:has([required])` /
        // `:has([aria-required='true'])` detection. Read each render so the
        // marker reacts to dynamic schema changes (auto-aria toggles
        // `aria-required` whenever the field's required state flips).
        const isRequired =
          inputEl !== null &&
          (inputEl.hasAttribute('required') ||
            inputEl.getAttribute('aria-required') === 'true');
        if (isRequired !== this.#boundControlIsRequired()) {
          this.#boundControlIsRequired.set(isRequired);
        }

        const isSelectionCluster =
          semantics.kind === 'radio-group' ||
          (semantics.kind === 'checkbox' && selectionControlCount > 1);
        if (isSelectionCluster !== this.#isSelectionCluster()) {
          this.#isSelectionCluster.set(isSelectionCluster);
        }

        if (label instanceof HTMLElement && isSelectionCluster) {
          const existingLabelId = label.id.trim();
          const resolvedFieldName = this.resolvedFieldName();
          // Two unnamed selection clusters on one page would otherwise
          // collide on the same fallback id and misroute `aria-labelledby`
          // to the wrong legend. Skip wiring instead — `resolvedFieldName`
          // already emits a one-shot dev error pointing authors at the
          // missing `fieldName` input.
          const nextLabelId = existingLabelId
            ? existingLabelId
            : resolvedFieldName === null
              ? null
              : `${resolvedFieldName}-label`;

          if (nextLabelId !== null && existingLabelId.length === 0) {
            label.id = nextLabelId;
          }

          if (nextLabelId !== this.#selectionClusterLabelId()) {
            this.#selectionClusterLabelId.set(nextLabelId);
          }
        } else if (this.#selectionClusterLabelId() !== null) {
          this.#selectionClusterLabelId.set(null);
        }

        const current = this.#controlSemantics();
        if (
          current.kind !== semantics.kind ||
          current.layout !== semantics.layout ||
          current.ariaMode !== semantics.ariaMode
        ) {
          this.#controlSemantics.set(semantics);
        }

        // A bound control whose semantics couldn't be resolved renders with
        // default textual chrome silently — authors typically discover this
        // only when outlined appearance or selection-group layout doesn't
        // apply to their custom control. Fire a one-shot dev warning so the
        // mis-wiring is visible without spamming change detection.
        if (
          inputEl &&
          semantics.kind === null &&
          !this.#warnedUnresolvedKind &&
          isDevMode()
        ) {
          this.#warnedUnresolvedKind = true;
          console.warn(
            '[ngx-signal-forms] Form-field wrapper could not infer a control ' +
              'kind for its bound control and will render with default textual ' +
              'chrome. Declare semantics via `ngxSignalFormControl="..."` on the ' +
              'control host (or register a preset) to opt into the right layout ' +
              'and ARIA wiring.',
            inputEl,
          );
        }

        // `data-signal-field` is a stable runtime contract keyed off by
        // custom controls (as a `:host([data-signal-field]:focus-visible)`
        // selector), test discovery, and the assistive hint component for
        // screen-reader correlation. Skip the write when no field name can
        // be resolved — the attribute would otherwise hold the string
        // `"null"` and mislead downstream DOM queries.
        if (inputEl) {
          const fieldName = this.resolvedFieldName();
          if (fieldName !== null) {
            inputEl.setAttribute('data-signal-field', fieldName);
          } else {
            inputEl.removeAttribute('data-signal-field');
          }
        }

        // Sync the shared NgxFieldIdentity service so auto-aria and any other
        // consumer always see the same field name, control element, IDs, and
        // visibility state. Visibility is polled per render via
        // `Element.checkVisibility()` so a control inside a collapsed
        // `<details>` / `hidden` ancestor flips the flag the next time
        // Angular runs CD, which is when wrappers see the change anyway.
        this.#fieldIdentity._setFieldName(this.resolvedFieldName());
        this.#fieldIdentity._setControlElement(inputEl);
        this.#fieldIdentity._setControlVisible(
          inputEl ? isElementCssVisible(inputEl) : true,
        );
        this.#fieldIdentity._setHintIds(
          this.hintDescriptors().map((h) => h.id),
        );
      },
    });
  }
}
