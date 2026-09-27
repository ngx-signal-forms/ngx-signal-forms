import { NgComponentOutlet } from '@angular/common';
import {
  afterEveryRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  ElementRef,
  inject,
  input,
  signal,
  type Type,
} from '@angular/core';
import type { FieldTree } from '@angular/forms/signals';
import type {
  ErrorDisplayStrategy,
  FieldMarkingMode,
  FormFieldAppearance,
  FormFieldAppearanceInput,
  FormFieldOrientation,
  FormFieldOrientationInput,
  NgxFormFieldErrorPlacement,
  ResolvedMarker,
  WarningDisplayStrategy,
} from '@ngx-signal-forms/toolkit';
import {
  NGX_FORM_FIELD_ERROR_RENDERER,
  NGX_SIGNAL_FORM_CONTROL_PRESETS,
  NGX_SIGNAL_FORM_FIELD_CONTEXT,
  NGX_SIGNAL_FORMS_CONFIG,
  createFieldPresentation,
  injectFormContext,
  isFieldStateHidden,
  resolveFieldNameFromCandidates,
  type ResolvedNgxSignalFormControlSemantics,
} from '@ngx-signal-forms/toolkit';
import {
  FORM_FIELD_APPEARANCE_VALUES,
  FORM_FIELD_ORIENTATION_VALUES,
  NGX_SIGNAL_FORM_HINT_REGISTRY,
  NgxFieldIdentity,
  NgxFieldIdentityProvider,
  isFieldStateRequired,
  type WarnOnceRef,
} from '@ngx-signal-forms/toolkit/core';
import {
  NgxFormFieldError,
  NgxFormFieldHint,
} from '@ngx-signal-forms/toolkit/assistive';
import { captureFormFieldWrapperDomSnapshot } from './form-field-dom-snapshot';
import {
  applyWrapperDomSnapshot,
  type WrapperDomState,
} from './form-field-dom-sync';
import { capabilitiesFor } from './form-field.utils';
import { resolveClusterAriaAttrs } from './form-field-cluster-aria';
import { resolveUnionInput } from './utilities/resolve-union-input';

/**
 * Form field wrapper component with automatic error/warning display.
 *
 * Provides:
 * - Consistent layout for form fields
 * - Automatic error and warning display
 * - Accessibility-compliant structure
 * - Content projection for labels and inputs
 * - Type-safe field binding with generics
 * - Outlined appearance with the label as a caption inside the border
 *   (`appearance="outline"`)
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

  // `NgxFormFieldError` is deliberately absent: the wrapper never writes the
  // element in its template, it renders whatever `#errorRendererComponent()`
  // resolves through `NgComponentOutlet` (the default being
  // `NgxFormFieldError`). Listing it here only earned an NG8113 "unused
  // import" build warning.
  imports: [NgComponentOutlet],
  // `NgxFieldIdentity` is provided by the host directive, not listed here.
  // Composing the public surface rather than duplicating it keeps one
  // provisioning site, and means the `fieldName` input a consumer already
  // binds reaches the identity through exactly the seam a third-party wrapper
  // uses. Angular feeds one `fieldName` attribute to both this component's own
  // input and the exposed host-directive input, so nothing changes for
  // consumers. Tier 2 of the name cascade (the bound control's `id`) cannot
  // travel through an input at all — it is only known in the render write
  // phase below — so this component still drives the identity itself for that
  // tier and for every non-name channel. See ADR-0011.
  hostDirectives: [
    { directive: NgxFieldIdentityProvider, inputs: ['fieldName'] },
  ],
  providers: [
    {
      provide: NGX_SIGNAL_FORM_FIELD_CONTEXT,
      useFactory: () => {
        const component = inject(NgxFormFieldWrapper);
        return {
          fieldName: component.resolvedFieldName,
          // Disambiguates the generated hint fallback id (issue #435): a
          // hint that needs `${fieldName}-hint` asks for its ordinal among
          // sibling hints that also need it, so a second unnamed hint
          // doesn't collide with the first on the DOM id (WCAG 1.3.1).
          // Read through `hintChildren()` and each candidate's
          // `usesGeneratedFallbackId()` so this stays reactive to
          // projected-hint changes.
          //
          // `hintChildren` queries with `descendants: true`, so it also
          // picks up hints that live inside a nested `ngx-form-field-wrapper`
          // projected into this one's content — those hints resolve their
          // own id through the nested wrapper's own context (DI resolves to
          // the closest provider), but they'd still shift this wrapper's
          // ordinals if left in the candidate list. Restrict candidates to
          // hints whose resolved field name matches this wrapper's own, so
          // a nested wrapper's hints never count against this one.
          //
          // `indexOf` returns -1 when `hint` isn't found among the filtered
          // candidates (for example, if `hintChildren()` hasn't picked it up
          // yet). Treat that as ordinal 0 rather than propagating -1 into
          // the id — a transient miss should still resolve to a valid id.
          hintOrdinal: (hint: object) => {
            const ownFieldName = component.resolvedFieldName();
            const candidates = component
              .hintChildren()
              .filter(
                (candidate) =>
                  candidate.usesGeneratedFallbackId() &&
                  candidate.resolvedFieldName() === ownFieldName,
              );
            const ordinal = candidates.indexOf(hint as NgxFormFieldHint);
            return ordinal === -1 ? 0 : ordinal;
          },
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
    '[attr.data-ngx-signal-form-control-aria-mode]': 'dom.semantics().ariaMode',
    '[attr.data-ngx-signal-form-control-kind]': 'dom.semantics().kind',
    '[attr.data-ngx-signal-form-control-layout]': 'dom.semantics().layout',
    '[class.ngx-signal-form-field-wrapper--invalid]':
      'presentation.showErrors()',
    '[class.ngx-signal-form-field-wrapper--warning]': 'showWarningState()',
    '[class.ngx-signal-form-field-wrapper--messages-top]': 'isTopPlacement()',
    '[class.ngx-signal-form-field-wrapper--messages-bottom]':
      '!isTopPlacement()',
    '[class.ngx-signal-form-field-wrapper--textual]': 'isTextualControl()',
    '[class.ngx-signal-form-field-wrapper--checkbox]': 'isCheckboxControl()',
    '[class.ngx-signal-form-field-wrapper--selection-group]':
      'isSelectionGroupControl()',
    '[class.ngx-signal-form-field-wrapper--selection-cluster]':
      'dom.selectionCluster()',
    '[class.ngx-signal-form-field-wrapper--switch]': 'isSwitchControl()',
    '[class.ngx-signal-form-field-wrapper--padded-control]':
      'hasPaddedContentControl()',
    '[class.ngx-signal-forms-outline]': 'isOutline()',
    '[class.ngx-signal-forms-plain]': 'isPlain()',
    '[class.ngx-signal-form-field-wrapper--horizontal]': 'isHorizontal()',
    '[attr.data-orientation]': 'resolvedOrientation()',
    '[attr.data-error-placement]': 'errorPlacement()',
    '[attr.data-marker]': 'resolvedMarker()?.kind ?? null',
    '[attr.role]': 'clusterAria().role',
    '[attr.aria-labelledby]': 'clusterAria().labelledBy',
    '[attr.aria-describedby]': 'clusterAria().describedBy',
  },
  template: `
    <!--
      Structural wrapper around every slot below. \`display: contents\` in
      every appearance except horizontal (see form-field-wrapper.selection.css,
      "HORIZONTAL LAYOUT"), so it drops out of the box tree and changes
      nothing for standard/outline/plain/selection layouts — the label,
      content and assistive nodes stay direct grid/flex participants of the
      host exactly as before.

      Horizontal layout turns it into the real CSS Grid container and gives
      it \`container-type: inline-size\` instead of putting either on
      \`:host\` itself — see CONTEXT.md, "The horizontal form-field layout's
      grid lives on a structural child, not \`:host\`", for why (#523).
    -->
    <div class="ngx-signal-form-field-wrapper__layout">
      <!-- Label slot (outside bordered container for standard layout, visually inside for outline via CSS) -->
      <div class="ngx-signal-form-field-wrapper__label">
        <ng-content select="label, [ngxFormFieldLabel]" />
        @if (resolvedMarker(); as marker) {
          <!--
            Required/optional marker rendered in the template (not via CSS
            ::after content) so screen readers do not double-announce alongside
            the control's own \`aria-required\` attribute. \`aria-hidden="true"\`
            keeps the marker purely visual (WCAG 1.3.1, 4.1.2).
          -->
          <span
            class="ngx-signal-form-field-wrapper__marker"
            [class.ngx-signal-form-field-wrapper__required-marker]="
              marker.kind === 'required'
            "
            [class.ngx-signal-form-field-wrapper__optional-marker]="
              marker.kind === 'optional'
            "
            aria-hidden="true"
            >{{ marker.text }}</span
          >
        }
        @if (clusterAria().groupRequiredHintId; as requiredHintId) {
          <!--
            Relocated required-state announcement for a \`group\`-role selection
            cluster (see \`resolveClusterAriaAttrs\`): \`aria-required\`
            isn't valid ARIA on \`group\`, so this visually-hidden (NOT
            aria-hidden) node carries the text instead, wired into
            \`aria-describedby\` on the host. WCAG 1.3.1 / 4.1.2.
          -->
          <span
            [id]="requiredHintId"
            class="ngx-signal-form-field-wrapper__visually-hidden"
            >{{ config.requiredHintText }}</span
          >
        }
      </div>

      @if (isTopPlacement() && presentation.renderMessageSlot()) {
        <div class="ngx-signal-form-field-wrapper__messages">
          <ng-container
            *ngComponentOutlet="
              errorRendererComponent();
              inputs: errorRendererInputs()
            "
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
      <div class="ngx-signal-form-field-wrapper__assistive">
        <div class="ngx-signal-form-field-wrapper__assistive-left">
          @if (!isTopPlacement() && presentation.renderMessageSlot()) {
            <ng-container
              *ngComponentOutlet="
                errorRendererComponent();
                inputs: errorRendererInputs()
              "
            />
          }
          <div
            class="ngx-signal-form-field-wrapper__hint-slot"
            [style.display]="
              presentation.renderMessageSlot() ? 'none' : 'contents'
            "
          >
            <ng-content select="ngx-form-field-hint" />
          </div>
        </div>
        <div class="ngx-signal-form-field-wrapper__assistive-right">
          <ng-content
            select="ngx-form-field-character-count, [characterCount]"
          />
        </div>
      </div>
    </div>
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
   * when the bound host element has an `id` attribute. The probe also matches
   * an inner `[role="combobox"][id]` (see `BOUND_CONTROL_SELECTOR`), so a
   * field-shaped widget whose only `id` sits on its combobox trigger still
   * resolves a name. Auto-ARIA reads the `[formField]` host's own `id` first,
   * so give the host an `id` — or pass `fieldName` — whenever the two would
   * otherwise disagree.
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
   * Warning display strategy, passed through to the projected error
   * renderer (`NgxFormFieldError` by default). Decoupled from {@link strategy}
   * so warnings can stay visible even while blocking errors are gated by
   * `'on-touch'` / `'on-submit'`.
   *
   * The wrapper also uses this to decide whether to mount the error
   * renderer at all: it renders whenever blocking errors OR warnings
   * should be visible, not just on the blocking-error timing.
   *
   * Left unset the value is `undefined`, and the renderer runs the warning
   * cascade instead: form context `warningStrategy()` →
   * `NGX_SIGNAL_FORMS_CONFIG.defaultWarningStrategy` → `'on-touch'`.
   *
   * @default Inherited from form context or `'on-touch'`
   */
  readonly warningStrategy = input<WarningDisplayStrategy | undefined>();

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
   * - `'outline'`: Bordered container with the label printed inside it as a
   *   static caption above the control. The label never moves, so no
   *   `placeholder=" "` is needed — the stylesheet has no `:placeholder-shown`
   *   rule, transition, or keyframes on it.
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
   * Outline fields always resolve to vertical because their label caption
   * sits inside the bordered container, above the control.
   *
   * Selection controls (checkbox, switch, radio-group) ignore this setting
   * because they already manage their own inline layout.
   *
   * @default 'inherit'
   */
  readonly orientation = input<FormFieldOrientationInput>('inherit');

  /**
   * Which fields carry a visual marker (`'required'` | `'optional'` | `'none'`).
   * Falls back to `NgxSignalFormsConfig.showMarkerWhen` when unset.
   *
   * Markers render in every appearance. `aria-required` is unaffected.
   */
  readonly showMarkerWhen = input<FieldMarkingMode>();

  /**
   * Custom character(s) for the required marker (used in `'required'` mode).
   * Falls back to `NgxSignalFormsConfig.requiredMarker` when unset.
   */
  readonly requiredMarker = input<string | undefined>();

  /**
   * Custom text for the optional marker (used in `'optional'` mode).
   * Falls back to `NgxSignalFormsConfig.optionalMarker` when unset.
   */
  readonly optionalMarker = input<string | undefined>();

  /**
   * Toolkit configuration for default appearance, markers and the required
   * hint text.
   */
  protected readonly config = inject(NGX_SIGNAL_FORMS_CONFIG);

  readonly #controlPresets = inject(NGX_SIGNAL_FORM_CONTROL_PRESETS);

  /**
   * Optional error renderer override resolved via DI. When no provider is
   * registered the resolved component below is `NgxFormFieldError`, the
   * wrapper's built-in default.
   */
  readonly #errorRenderer = inject(NGX_FORM_FIELD_ERROR_RENDERER, {
    optional: true,
  });

  /**
   * Resolved error-renderer component, exposed as a signal so the outlet
   * rebinds if the DI-provided renderer changes.
   */
  protected readonly errorRendererComponent = computed<Type<unknown>>(
    () => this.#errorRenderer?.component ?? NgxFormFieldError,
  );

  /**
   * Inputs map passed to `*ngComponentOutlet` for the error renderer. Custom
   * error renderers must accept `formField`, `strategy`, and `submittedStatus`;
   * any extra inputs the consumer's renderer declares are unaffected.
   *
   * `warningStrategy` and `fieldName` are extras beyond that minimal
   * contract: `warningStrategy` forwards this input's value (`undefined`
   * when unset, which is a no-op for the default `NgxFormFieldError`'s own
   * warning cascade) so consumers can override warning timing
   * through the wrapper instead of only through a directly-projected
   * `NgxFormFieldError`. `fieldName` lets a custom renderer satisfy the
   * `${fieldName}-error` / `${fieldName}-warning` id contract (see
   * `NgxFormFieldErrorRenderer`) without needing to inject
   * `NGX_SIGNAL_FORM_FIELD_CONTEXT` itself.
   *
   * `submittedStatus` is `undefined` without a form context, not a made-up
   * `'unsubmitted'`. That keeps the dev-mode warning for
   * `strategy="on-submit"` without a form context, which a default would
   * hide.
   */
  protected readonly errorRendererInputs = computed<Record<string, unknown>>(
    () => ({
      formField: this.formField(),
      strategy: this.presentation.effectiveStrategy(),
      submittedStatus: this.#formContext?.submittedStatus(),
      warningStrategy: this.warningStrategy(),
      fieldName: this.resolvedFieldName(),
    }),
  );

  /**
   * Shared field-identity service, provided by the `NgxFieldIdentityProvider`
   * host directive. The render write phase publishes the name, the bound
   * control, its visibility and the hint ids. `createFieldPresentation()`
   * publishes the resolved strategies.
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
   * Author-supplied `aria-labelledby` / `aria-describedby`, captured at
   * construction. The cluster ARIA attributes return `null` for non-cluster
   * wrappers (the vast majority), and
   * `[attr.aria-labelledby]` / `[attr.aria-describedby]` on the host would
   * otherwise strip any value an author bound directly on
   * `<ngx-form-field-wrapper aria-describedby="…">` — the host bindings are
   * always active regardless of cluster mode, so there is no way to simply
   * "not bind" them for the common case. Falling back to (and merging with)
   * these preserves author-supplied values the same way auto-aria already
   * does for the bound control itself.
   */
  readonly #initialAriaLabelledby =
    this.#elementRef.nativeElement.getAttribute('aria-labelledby');
  readonly #initialAriaDescribedby =
    this.#elementRef.nativeElement.getAttribute('aria-describedby');

  /**
   * Caches for the `__main` slot and the projected label element. Plain
   * fields, not signals: only the `earlyRead`/`write` pair below reads
   * them. See `readFormFieldWrapperDomSnapshot`'s cache-hit checks for why
   * reusing these skips a `querySelector` call on most renders.
   */
  #cachedMainSlot: HTMLElement | null = null;
  #cachedLabel: Element | null = null;

  /**
   * Cached field state signal. Every downstream computed reads this one
   * node instead of re-reading `this.formField()()`, which matters on forms
   * with dozens of wrappers reacting to the same change-detection cycle.
   */
  readonly #fieldState = computed(() => this.formField()());

  /**
   * State the render write phase derives from the projected control. See
   * `applyWrapperDomSnapshot` for what each signal holds and when it
   * changes.
   */
  protected readonly dom: WrapperDomState = {
    boundControl: signal<HTMLElement | null>(null),
    inputId: signal<string | null>(null),
    required: signal(false),
    selectionCluster: signal(false),
    selectionClusterLabelId: signal<string | null>(null),
    semantics: signal<ResolvedNgxSignalFormControlSemantics>({
      kind: null,
      layout: null,
      ariaMode: null,
    }),
    resolvedFieldName: () => this.resolvedFieldName(),
    fieldRequired: () => isFieldStateRequired(this.#fieldState()),
    warnedUnresolvedKind: { current: false },
    warnedUnresolvedFieldName: { current: false },
  };

  readonly #warnedInvalidAppearance: WarnOnceRef = { current: false };

  protected readonly resolvedAppearance = computed<FormFieldAppearance>(() => {
    const appearance = this.appearance();

    if (appearance === 'inherit') {
      return this.config.defaultFormFieldAppearance;
    }

    const raw = appearance as string;
    const hint =
      raw === 'stacked'
        ? ` The legacy 'stacked' appearance alias resolves to the configured default ('${this.config.defaultFormFieldAppearance}').`
        : raw === 'bare'
          ? " The 'bare' appearance was renamed to 'plain' in v1 rc.1."
          : undefined;

    return resolveUnionInput(raw, FORM_FIELD_APPEARANCE_VALUES, {
      component: 'NgxFormFieldWrapper',
      prop: 'appearance',
      fallback: this.config.defaultFormFieldAppearance,
      fallbackLabel: 'the global default',
      expectedLabel: "'standard' | 'outline' | 'plain' | 'inherit'",
      hint,
      warned: this.#warnedInvalidAppearance,
    });
  });

  /**
   * Whether outline appearance should be applied.
   */
  protected readonly isOutline = computed(() => {
    // Defer outline until the projected control is discovered so selection
    // controls never flash outline chrome on the first render frame.
    if (this.dom.boundControl() === null) {
      return false;
    }
    if (!capabilitiesFor(this.dom.semantics().kind).supportsOutline) {
      return false;
    }

    return this.resolvedAppearance() === 'outline';
  });

  protected readonly isPlain = computed(() => {
    return this.resolvedAppearance() === 'plain';
  });

  readonly #warnedInvalidOrientation: WarnOnceRef = { current: false };

  /**
   * Effective orientation for theming hooks (`data-orientation` attribute).
   *
   * Outline appearance and selection-control rows force vertical layout.
   *
   * Gated the same way as its siblings `isOutline` and `resolvedMarker`
   * (each returns its own pre-resolution value): the control kind has not
   * settled before the projected control is discovered, so forcing on it
   * here would report the raw *requested* orientation for a frame before
   * snapping to the forced `'vertical'` once a checkbox / switch /
   * radio-group resolves — a visible `data-orientation` flash. This
   * computed's own pre-resolution value is the *configured default* (not
   * the requested orientation, and not the forced value): most fields
   * already resolve to the configured default via `orientation` `'inherit'`,
   * so this keeps the first frame aligned with the common case rather than
   * guessing either extreme.
   */
  protected readonly resolvedOrientation = computed<FormFieldOrientation>(
    () => {
      const orientation = this.orientation();
      const requestedOrientation = this.#resolveOrientationInput(orientation);

      if (this.dom.boundControl() === null) {
        return this.config.defaultFormFieldOrientation;
      }

      if (
        this.resolvedAppearance() === 'outline' ||
        capabilitiesFor(this.dom.semantics().kind).forcesVertical
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
      return this.config.defaultFormFieldOrientation;
    }

    return resolveUnionInput(orientation, FORM_FIELD_ORIENTATION_VALUES, {
      component: 'NgxFormFieldWrapper',
      prop: 'orientation',
      fallback: this.config.defaultFormFieldOrientation,
      fallbackLabel: 'the global default',
      expectedLabel: "'vertical' | 'horizontal' | 'inherit'",
      warned: this.#warnedInvalidOrientation,
    });
  }

  /**
   * Whether horizontal layout should be applied.
   */
  protected readonly isHorizontal = computed(
    () => this.resolvedOrientation() === 'horizontal',
  );

  /**
   * Resolved marking mode with input override.
   */
  protected readonly resolvedMarkerMode = computed<FieldMarkingMode>(() => {
    return this.showMarkerWhen() ?? this.config.showMarkerWhen;
  });

  /**
   * Resolved required marker text with input override.
   */
  protected readonly resolvedRequiredMarker = computed(() => {
    return this.requiredMarker() ?? this.config.requiredMarker;
  });

  /**
   * Resolved optional marker text with input override.
   */
  protected readonly resolvedOptionalMarker = computed(() => {
    return this.optionalMarker() ?? this.config.optionalMarker;
  });

  /**
   * The visual marker (`<span aria-hidden="true">`) to render in the label,
   * or `null` for none. Derived from the active {@link resolvedMarkerMode} and
   * the bound control's required-ness:
   *
   * - `'required'` mode → mark required fields with {@link resolvedRequiredMarker}
   * - `'optional'` mode → mark non-required fields with {@link resolvedOptionalMarker}
   * - `'none'` mode → never marks
   *
   * Renders in every appearance (standard, outline, plain). No marker is shown
   * until the projected control is discovered, so the optional marker never
   * flashes before required-ness is known.
   *
   * The marker is kept out of the accessibility tree (`aria-hidden="true"`);
   * required state reaches assistive tech through the control's own
   * `aria-required` (managed by `auto-aria`), independent of marking mode. This
   * avoids the double-announcement that CSS `::after` content caused on
   * NVDA/VoiceOver (WCAG 1.3.1, 4.1.2).
   */
  protected readonly resolvedMarker = computed<ResolvedMarker | null>(() => {
    if (this.dom.boundControl() === null) {
      return null;
    }

    const mode = this.resolvedMarkerMode();
    if (mode === 'none') {
      return null;
    }

    const isRequired = this.dom.required();

    if (mode === 'required') {
      return isRequired
        ? { kind: 'required', text: this.resolvedRequiredMarker() }
        : null;
    }

    // mode === 'optional'
    return isRequired
      ? null
      : { kind: 'optional', text: this.resolvedOptionalMarker() };
  });

  protected readonly isTextualControl = computed(() => {
    return capabilitiesFor(this.dom.semantics().kind).textual;
  });

  protected readonly isCheckboxControl = computed(() => {
    return this.dom.semantics().kind === 'checkbox';
  });

  protected readonly isSelectionGroupControl = computed(() => {
    return capabilitiesFor(this.dom.semantics().kind).selectionGroup;
  });

  protected readonly isSwitchControl = computed(() => {
    return this.dom.semantics().kind === 'switch';
  });

  protected readonly hasPaddedContentControl = computed(() => {
    return capabilitiesFor(this.dom.semantics().kind).paddedContent;
  });

  /**
   * Resolved field name computed from two sources (in priority order):
   * 1. Explicit `fieldName` input (highest priority)
   * 2. Input element's `id` attribute (automatic, recommended)
   *
   * Tier 1 → tier 2 of the toolkit's canonical field-name cascade — the
   * wrapper owns the projected control, so it resolves both tiers itself
   * and never needs tier 3 (inherited context). This resolved value is
   * what the wrapper then publishes as context for children (e.g. a
   * projected `<ngx-form-field-error>`) that have no control of their own.
   * See `resolveFieldNameFromCandidates` (`core/utilities/field-resolution.ts`)
   * for the full cascade.
   *
   * Returns `null` when neither source is available. Downstream consumers
   * (auto-ARIA, hint registry, projected error component) handle `null` by
   * skipping the `aria-describedby` wiring.
   *
   * The returned name is raw (trimmed, not sanitized for inner whitespace)
   * — the same value used for `data-signal-field` and for matching against
   * `NGX_SIGNAL_FORM_FIELD_VISIBILITY_REGISTRY` entries. Whatever builds an
   * `id` from it (`generateErrorId`, the hint id builder, the
   * selection-cluster label id in `applyWrapperDomSnapshot`) sanitizes at
   * that point instead. See `sanitizeFieldNameForId`.
   *
   * **Pure by design**: this computed performs no side effects. Projected
   * children (`NgxFormFieldHint`, `NgxFormFieldError`) read it via
   * `NGX_SIGNAL_FORM_FIELD_CONTEXT` during the *first* change-detection
   * pass — before the render write phase fills in the control `id` — so a
   * `console.error` fired from in here would fire once, permanently, on
   * every correctly configured field (id set, no `fieldName` input) purely
   * because of that one-render race. `applyWrapperDomSnapshot` owns the
   * unresolved-name diagnostic instead, after the state has settled.
   *
   * @remarks
   * This signal is public to allow child components to access the resolved field name
   * via the `NGX_SIGNAL_FORM_FIELD_CONTEXT` injection token.
   */
  readonly resolvedFieldName = computed<string | null>(() =>
    resolveFieldNameFromCandidates(
      // Priority 1: Explicit fieldName input
      this.fieldName(),
      // Priority 2: the bound control's `id`, written by the render write
      // phase. The DOM is never queried inside a computed: that would crash
      // on the server and hide the dependency from the signal graph.
      this.dom.inputId(),
    ),
  );

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
  readonly hintDescriptors = computed(() =>
    this.hintChildren().map((hint) => ({
      id: hint.resolvedId(),
      fieldName: hint.resolvedFieldName(),
    })),
  );

  /**
   * Whether the bound field is currently hidden via Angular's `hidden()`
   * schema logic. When `true` we suppress error/warning rendering and mark
   * the host element with the `hidden` attribute so screen readers skip it
   * — Angular Signal Forms documents that hiding is the consumer's job
   * (`@if`), but the wrapper stays safe even if the consumer forgets.
   *
   * **Why no `disabled()` check here**: disabled fields are excluded from
   * Angular's validation entirely, so they have no errors to show. A
   * disabled field is also still visually present, so tagging the wrapper
   * `[attr.hidden]` would be wrong. `focusFirstInvalid` and the error
   * summary (which can aggregate across subtrees) do check both; this
   * component only needs `hidden()`.
   */
  protected readonly isFieldHidden = computed(() => {
    return isFieldStateHidden(this.#fieldState());
  });

  /**
   * Error and warning state of this field: strategies, visibility timing
   * and whether the message renderer mounts. Shared with custom wrappers
   * through the public `createFieldPresentation()`, which also publishes the
   * resolved strategies to the field identity so auto-aria gates
   * `aria-describedby` on this wrapper's field-level overrides.
   */
  protected readonly presentation = createFieldPresentation(this.#fieldState, {
    strategy: this.strategy,
    warningStrategy: this.warningStrategy,
    hidden: this.isFieldHidden,
    identity: this.#fieldIdentity,
  });

  /**
   * Whether to apply warning styling to the form field container.
   * Warning styling is shown only when:
   * 1. Field has warnings
   * 2. Field has NO visible errors (errors take visual priority)
   */
  protected readonly showWarningState = computed(() => {
    return this.presentation.hasWarnings() && !this.presentation.showErrors();
  });

  protected readonly isTopPlacement = computed(() => {
    return this.errorPlacement() === 'top';
  });

  /**
   * The whole selection-cluster ARIA contract (`role`, the visually-hidden
   * required-hint id, `aria-labelledby`, `aria-describedby`), resolved
   * together by the pure {@link resolveClusterAriaAttrs} — see that
   * function's doc comment for the accessibility rationale (WCAG 1.3.1 /
   * 4.1.2, https://github.com/ngx-signal-forms/ngx-signal-forms/issues/300)
   * and for why these four outputs are computed as one unit.
   *
   * `labelledBy` falls back to (never replaces) the author's own
   * `aria-labelledby`, and `describedBy` merges with the author's own
   * `aria-describedby` — see `#initialAriaLabelledby` for why the host
   * bindings cannot simply be left unbound instead.
   */
  protected readonly clusterAria = computed(() =>
    resolveClusterAriaAttrs({
      isSelectionCluster: this.dom.selectionCluster(),
      controlKind: this.dom.semantics().kind,
      boundControlIsRequired: this.dom.required(),
      requiredHintText: this.config.requiredHintText,
      fieldName: this.resolvedFieldName(),
      selectionClusterLabelId: this.dom.selectionClusterLabelId(),
      initialAriaLabelledby: this.#initialAriaLabelledby,
      initialAriaDescribedby: this.#initialAriaDescribedby,
      showInvalidState: this.presentation.showErrors(),
      showWarningState: this.showWarningState(),
      shouldShowWarnings: this.presentation.showWarnings(),
    }),
  );

  constructor() {
    // One `afterEveryRender` with phased callbacks:
    // - earlyRead: read the projected control's metadata before any writes
    // - write: turn that snapshot into state (`applyWrapperDomSnapshot`)
    //
    // `afterEveryRender` (not `afterNextRender`) is deliberate: the projected
    // `[formField]` control can be swapped at any render. An `@if` branch
    // flip, an `@for` reorder, or a dynamic component swap all need a
    // re-resolve. The cache checks in `readFormFieldWrapperDomSnapshot` skip
    // `findBoundControl` when nothing changed. A real swap still falls
    // through to it. The steady-state render still runs one
    // `querySelectorAll` for the selection-control count, because an `@for`
    // can add or remove radios without swapping the control itself, and one
    // `checkVisibility()` call for the bound control.
    afterEveryRender({
      earlyRead: () =>
        // Resolves the host element, the bound control (native binding
        // registry first, DOM-probe fallback second — see
        // `captureFormFieldWrapperDomSnapshot`'s doc comment), and the rest
        // of the DOM snapshot in one call.
        captureFormFieldWrapperDomSnapshot(
          this.#elementRef,
          this.dom.boundControl(),
          this.#controlPresets,
          this.#fieldState(),
          this.#cachedMainSlot,
          this.#cachedLabel,
        ),
      // oxlint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- afterEveryRender passes DOM-backed render state with mutable HTMLElement references.
      write: (snapshot) => {
        this.#cachedMainSlot = snapshot.mainSlot;
        this.#cachedLabel = snapshot.label;
        applyWrapperDomSnapshot(
          snapshot,
          this.dom,
          this.#fieldIdentity,
          this.hintDescriptors(),
        );
      },
    });
  }
}
