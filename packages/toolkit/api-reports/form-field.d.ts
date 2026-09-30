import * as _ngx_signal_forms_toolkit from '@ngx-signal-forms/toolkit';
import { ResolvedNgxSignalFormControlSemantics, ErrorDisplayStrategy, WarningDisplayStrategy, FormFieldAppearanceInput, FormFieldOrientationInput, FieldMarkingMode, FormFieldAppearance, FormFieldOrientation, ResolvedMarker, NgxSignalFormHintDescriptor, NgxSignalFormAutoAria, NgxSignalFormControlSemanticsDirective } from '@ngx-signal-forms/toolkit';
import * as _angular_core from '@angular/core';
import { WritableSignal, Type, ElementRef } from '@angular/core';
import * as _angular_forms_signals from '@angular/forms/signals';
import { FieldTree } from '@angular/forms/signals';
import { NgxFormFieldHint, NgxFormFieldCharacterCount, NgxFormFieldListStyle, NgxFormFieldError } from '@ngx-signal-forms/toolkit/assistive';
import * as i1 from './ngx-signal-forms-toolkit-core.js';
import { WarnOnceRef } from './ngx-signal-forms-toolkit-core.js';
import * as i1$1 from '@ngx-signal-forms/toolkit/headless';
import { NgxHeadlessFieldset } from '@ngx-signal-forms/toolkit/headless';

/**
 * The whole selection-cluster ARIA contract `NgxFormFieldWrapper`'s host
 * bindings read from, resolved together by {@link resolveClusterAriaAttrs}.
 *
 * @internal
 */
interface ClusterAriaAttrs {
    /** `[attr.role]` — `'group'` | `'radiogroup'`, or `null` for a non-cluster wrapper. */
    readonly role: 'group' | 'radiogroup' | null;
    /**
     * ID of the visually-hidden required-state node rendered in the label
     * slot for a `group`-role cluster (`radiogroup` keeps `aria-required`
     * from auto-aria instead — see the inline reasoning below). `null` when
     * it doesn't apply.
     */
    readonly groupRequiredHintId: string | null;
    /** `[attr.aria-labelledby]`. */
    readonly labelledBy: string | null;
    /** `[attr.aria-describedby]`. */
    readonly describedBy: string | null;
}

/**
 * The wrapper state that {@link applyWrapperDomSnapshot} writes, plus the
 * readers it needs. The wrapper owns the signals; this function only sets
 * them.
 *
 * @internal
 */
interface WrapperDomState {
    /** The bound control found in the last snapshot. */
    readonly boundControl: WritableSignal<HTMLElement | null>;
    /** The bound control's `id`: tier 2 of the field-name cascade. */
    readonly inputId: WritableSignal<string | null>;
    /** Whether the bound control is required. Drives the required marker. */
    readonly required: WritableSignal<boolean>;
    /** Whether the wrapper hosts a radio group or a multi-checkbox group. */
    readonly selectionCluster: WritableSignal<boolean>;
    /** The id of the cluster's label, for `aria-labelledby` on the host. */
    readonly selectionClusterLabelId: WritableSignal<string | null>;
    /** The resolved semantics of the bound control. */
    readonly semantics: WritableSignal<ResolvedNgxSignalFormControlSemantics>;
    /**
     * Reads the resolved field name. It derives from `inputId`, so this
     * function reads it only after it writes `inputId`.
     */
    readonly resolvedFieldName: () => string | null;
    /** Reads `required()` from the field state. */
    readonly fieldRequired: () => boolean;
    readonly warnedUnresolvedKind: WarnOnceRef;
    readonly warnedUnresolvedFieldName: WarnOnceRef;
}

/**
 * Placement of the validation summary relative to the control or fieldset
 * content. Shared by `NgxFormFieldWrapper` and `NgxFormFieldset` so a
 * single value binds cleanly across both APIs.
 *
 * - `'top'`: render the summary directly below the legend / above the inputs
 * - `'bottom'`: render the summary after the projected content
 *
 * @public
 */
type NgxFormFieldErrorPlacement = 'bottom' | 'top';

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
declare class NgxFormFieldWrapper<TValue = unknown> {
    #private;
    /**
     * The Signal Forms field to display.
     * Accepts a FieldTree from Angular Signal Forms.
     * Generic type parameter allows type inference from the provided field.
     */
    readonly formField: _angular_core.InputSignal<FieldTree<TValue>>;
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
    readonly fieldName: _angular_core.InputSignal<string | undefined>;
    /**
     * Error display strategy.
     * @default Inherited from form context or 'on-touch'
     */
    readonly strategy: _angular_core.InputSignal<ErrorDisplayStrategy | null>;
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
    readonly warningStrategy: _angular_core.InputSignal<WarningDisplayStrategy | undefined>;
    /**
     * Placement of the automatic error or warning messages.
     *
     * - `bottom` (default): render messages in the assistive row beneath the field
     * - `top`: render messages between the label and the field control
     */
    readonly errorPlacement: _angular_core.InputSignal<NgxFormFieldErrorPlacement>;
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
    readonly appearance: _angular_core.InputSignal<FormFieldAppearanceInput>;
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
    readonly orientation: _angular_core.InputSignal<FormFieldOrientationInput>;
    /**
     * Which fields carry a visual marker (`'required'` | `'optional'` | `'none'`).
     * Falls back to `NgxSignalFormsConfig.showMarkerWhen` when unset.
     *
     * Markers render in every appearance. `aria-required` is unaffected.
     */
    readonly showMarkerWhen: _angular_core.InputSignal<FieldMarkingMode | undefined>;
    /**
     * Custom character(s) for the required marker (used in `'required'` mode).
     * Falls back to `NgxSignalFormsConfig.requiredMarker` when unset.
     */
    readonly requiredMarker: _angular_core.InputSignal<string | undefined>;
    /**
     * Custom text for the optional marker (used in `'optional'` mode).
     * Falls back to `NgxSignalFormsConfig.optionalMarker` when unset.
     */
    readonly optionalMarker: _angular_core.InputSignal<string | undefined>;
    /**
     * Hide this field's hint while it shows a blocking error or warning.
     * Falls back to `NgxSignalFormsConfig.hideHintOnError` when unset.
     *
     * The hint id stays in `aria-describedby` either way, so a screen reader
     * always hears it. This only controls whether sighted users also see it.
     *
     * Accepts a bare attribute (`hideHintOnError`) or a bound value
     * (`[hideHintOnError]="true"`). Leaving it unbound keeps it `undefined`, so
     * the config fallback below still applies — a plain `booleanAttribute`
     * transform would coerce an absent attribute to `false` and mask that
     * fallback.
     *
     * @default false
     */
    readonly hideHintOnError: _angular_core.InputSignalWithTransform<boolean | undefined, unknown>;
    /**
     * Toolkit configuration for default appearance, markers and the required
     * hint text.
     */
    protected readonly config: _ngx_signal_forms_toolkit.NgxSignalFormsConfig;
    /**
     * Resolved error-renderer component, exposed as a signal so the outlet
     * rebinds if the DI-provided renderer changes.
     */
    protected readonly errorRendererComponent: _angular_core.Signal<Type<unknown>>;
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
    protected readonly errorRendererInputs: _angular_core.Signal<Record<string, unknown>>;
    /**
     * State the render write phase derives from the projected control. See
     * `applyWrapperDomSnapshot` for what each signal holds and when it
     * changes.
     */
    protected readonly dom: WrapperDomState;
    protected readonly resolvedAppearance: _angular_core.Signal<FormFieldAppearance>;
    /**
     * Whether outline appearance should be applied.
     */
    protected readonly isOutline: _angular_core.Signal<boolean>;
    protected readonly isPlain: _angular_core.Signal<boolean>;
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
    protected readonly resolvedOrientation: _angular_core.Signal<FormFieldOrientation>;
    /**
     * Whether horizontal layout should be applied.
     */
    protected readonly isHorizontal: _angular_core.Signal<boolean>;
    /**
     * Resolved marking mode with input override.
     */
    protected readonly resolvedMarkerMode: _angular_core.Signal<FieldMarkingMode>;
    /**
     * Resolved hint-on-error visibility with input override. See
     * `hideHintOnError` and `NgxSignalFormsConfig.hideHintOnError`.
     */
    protected readonly resolvedHideHintOnError: _angular_core.Signal<boolean>;
    /**
     * Resolved required marker text with input override.
     */
    protected readonly resolvedRequiredMarker: _angular_core.Signal<string>;
    /**
     * Resolved optional marker text with input override.
     */
    protected readonly resolvedOptionalMarker: _angular_core.Signal<string>;
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
    protected readonly resolvedMarker: _angular_core.Signal<ResolvedMarker | null>;
    protected readonly isTextualControl: _angular_core.Signal<boolean>;
    /**
     * The bordered field box (`__content`) that wraps prefix, control and
     * suffix. `protected`, not `#`: Angular 22.1 does not allow signal queries
     * on ES private fields.
     */
    protected readonly fieldBox: _angular_core.Signal<ElementRef<HTMLElement>>;
    /**
     * Focuses the bound control when the user clicks the field box outside it.
     *
     * A textual field draws a box of about 32–44px, but the control inside it
     * is only one line tall. Without this handler a click on the box padding
     * does nothing, so the real target is much smaller than the one the user
     * sees (#567, WCAG 2.5.8).
     *
     * The handler does nothing when:
     * - the field is not textual (selection rows manage their own clicks),
     * - the click lands on an interactive element (the control itself, a
     *   prefix or suffix button, a link, a label),
     * - the click belongs to a nested wrapper's field box.
     *
     * It is a pointer convenience only. Keyboard users already reach the
     * control with Tab, so the host needs no key handler.
     */
    protected focusControlFromFieldBox(event: MouseEvent): void;
    protected readonly isCheckboxControl: _angular_core.Signal<boolean>;
    protected readonly isSelectionGroupControl: _angular_core.Signal<boolean>;
    protected readonly isSwitchControl: _angular_core.Signal<boolean>;
    protected readonly hasPaddedContentControl: _angular_core.Signal<boolean>;
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
    readonly resolvedFieldName: _angular_core.Signal<string | null>;
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
    protected readonly isFieldHidden: _angular_core.Signal<boolean>;
    /**
     * Error and warning state of this field: strategies, visibility timing
     * and whether the message renderer mounts. Shared with custom wrappers
     * through the public `createFieldPresentation()`, which also publishes the
     * resolved strategies to the field identity so auto-aria gates
     * `aria-describedby` on this wrapper's field-level overrides.
     */
    protected readonly presentation: _ngx_signal_forms_toolkit.FieldPresentation;
    /**
     * Whether to apply warning styling to the form field container.
     * Warning styling is shown only when:
     * 1. Field has warnings
     * 2. Field has NO visible errors (errors take visual priority)
     */
    protected readonly showWarningState: _angular_core.Signal<boolean>;
    protected readonly isTopPlacement: _angular_core.Signal<boolean>;
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
    protected readonly clusterAria: _angular_core.Signal<ClusterAriaAttrs>;
    constructor();
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<NgxFormFieldWrapper<any>, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<NgxFormFieldWrapper<any>, "ngx-form-field-wrapper", never, { "formField": { "alias": "formField"; "required": true; "isSignal": true; }; "fieldName": { "alias": "fieldName"; "required": false; "isSignal": true; }; "strategy": { "alias": "strategy"; "required": false; "isSignal": true; }; "warningStrategy": { "alias": "warningStrategy"; "required": false; "isSignal": true; }; "errorPlacement": { "alias": "errorPlacement"; "required": false; "isSignal": true; }; "appearance": { "alias": "appearance"; "required": false; "isSignal": true; }; "orientation": { "alias": "orientation"; "required": false; "isSignal": true; }; "showMarkerWhen": { "alias": "showMarkerWhen"; "required": false; "isSignal": true; }; "requiredMarker": { "alias": "requiredMarker"; "required": false; "isSignal": true; }; "optionalMarker": { "alias": "optionalMarker"; "required": false; "isSignal": true; }; "hideHintOnError": { "alias": "hideHintOnError"; "required": false; "isSignal": true; }; }, {}, ["hintChildren", "characterCountChildren"], ["label, [ngxFormFieldLabel]", "[prefix]", "*", "[suffix]", "ngx-form-field-hint", "ngx-form-field-character-count, [characterCount]"], true, [{ directive: typeof i1.NgxFieldIdentityProvider; inputs: { "fieldName": "fieldName"; }; outputs: {}; }]>;
}

type NgxFormFieldsetFeedbackAppearance = 'auto' | 'notification' | 'plain';
type NgxFormFieldsetAppearance = 'outline' | 'plain';
type NgxFormFieldsetSurfaceTone = 'danger' | 'default' | 'info' | 'neutral' | 'success' | 'warning';
type NgxFormFieldsetValidationSurface = 'always' | 'never';
/**
 * Form fieldset component for grouping related form fields with aggregated error/warning display.
 *
 * Similar to HTML `<fieldset>`, this component groups form fields and displays
 * aggregated validation messages for all contained fields. It resolves between
 * compact inline feedback and a surfaced notification pattern depending on the
 * grouped content and the configured appearance.
 *
 * Reach for `NgxFormFieldset` when the validation story belongs to a group,
 * not just an individual control:
 *
 * - a cross-field rule lives on the parent node (`password !== confirm`)
 * - a nested subsection should own one shared summary
 * - repeated rows or radio/checkbox groups need one grouped error surface
 *
 * When each control should fully own its own label, hint, and feedback, use
 * `NgxFormFieldWrapper` on those leaf controls and keep the fieldset in its
 * default group-only mode. When you need total markup control but still want
 * the aggregation state, compose `NgxHeadlessFieldset` directly.
 *
 * ## Composition
 *
 * The styled fieldset composes `NgxHeadlessFieldset` via
 * `hostDirectives`. All field-aggregation state — errors, warnings,
 * strategy resolution, submitted status, deduplication — lives in the
 * headless directive; this component only contributes UI-layer
 * concerns (`showErrors` toggle, `errorPlacement`, `describedByIds`).
 *
 * ## Features
 *
 * - **Aggregated Errors**: Collects errors from all nested fields via `errorSummary()`
 * - **Group-Only Mode**: Show only group-level errors when nested fields display their own
 * - **Deduplication**: Same error shown only once even if multiple fields have it
 * - **Warning Support**: Non-blocking warnings (with `warn:` prefix), timed independently
 *   of blocking errors via `warningStrategy` (defaults to `'on-touch'`, mirroring
 *   `NgxFormFieldWrapper`); the rendered message slot still gives errors visual
 *   priority when both are present at once (single notification/error region)
 * - **Adaptive Feedback UI**: Notification cards by default, with an optional compact text mode
 * - **Configurable Surface Tones**: Neutral, info, success, warning, or danger base surfaces
 * - **WCAG 2.2 Compliant**: Errors use `role="alert"`, warnings use `role="status"`
 * - **Strategy Aware**: Respects `ErrorDisplayStrategy` from form context or input
 * - **Configurable Placement**: Grouped messages can appear above or below the fieldset content
 *
 * ## Error Display Modes
 *
 * Use `includeNestedErrors` to control which errors are shown:
 * - `false` (default): Shows ONLY direct group-level errors (use when fields show their own errors)
 * - `true`: Shows ALL errors including nested field errors via `errorSummary()`
 *
 * @example Group-Only Mode (when nested fields show their own errors)
 * ```html
 * <ngx-form-fieldset
 *   [field]="form.passwords"
 *   [includeNestedErrors]="false"
 * >
 *   <ngx-form-field-wrapper [formField]="form.passwords.password">...</ngx-form-field-wrapper>
 *   <ngx-form-field-wrapper [formField]="form.passwords.confirm">...</ngx-form-field-wrapper>
 *   <!-- Fieldset shows only "Passwords must match" cross-field error -->
 * </ngx-form-fieldset>
 * ```
 *
 * @example Aggregated Mode (when nested fields don't show errors)
 * ```html
 * <ngx-form-fieldset [field]="form.address">
 *   <input [formField]="form.address.street" />
 *   <input [formField]="form.address.city" />
 *   <!-- Fieldset shows all nested field errors -->
 * </ngx-form-fieldset>
 * ```
 */
declare class NgxFormFieldset {
    #private;
    /**
     * The composed headless fieldset directive that owns all aggregated
     * validation state. Exposed to the template so bindings stay short
     * (`fieldset.isPending()` rather than `this.#fieldset.isPending()`),
     * and protected so it doesn't leak into the component's public API.
     */
    protected readonly fieldset: NgxHeadlessFieldset<any>;
    /**
     * Whether to show the automatic error/warning display.
     * @default true
     */
    readonly showErrors: _angular_core.InputSignalWithTransform<boolean, unknown>;
    /**
     * Placement of the aggregated error or warning summary.
     *
     * This API is primarily intended for grouped fieldset summaries. The wrapper
     * component also supports message placement, but this fieldset placement is
     * the main design-alignment control for complex grouped forms.
     *
     * Use `top` when the summary should be announced immediately after the
     * legend/description, which can work well for grouped validation such as
     * address sections or radio groups. Use `bottom` when the user should scan
     * the controls first and see the shared summary after the group, which is
     * now the default and tends to work better in dense review-style layouts.
     *
     * - `top`: display the summary directly below the legend/description
     * - `bottom` (default): display the summary after the projected field content
     */
    readonly errorPlacement: _angular_core.InputSignal<NgxFormFieldErrorPlacement>;
    /**
     * Visual shell for the grouped fieldset.
     *
     * - `outline` (default): bordered grouped section with inner padding
     * - `plain`: semantic-only grouping with no border, no padding, and no surfaced background
     */
    readonly appearance: _angular_core.InputSignal<NgxFormFieldsetAppearance>;
    /**
     * Presentation style for grouped feedback.
     *
     * - `auto` (default): surfaced notification for grouped sections
     * - `plain`: always use the compact `ngx-form-field-error` presentation
     * - `notification`: always use the surfaced notification card
     */
    readonly feedbackAppearance: _angular_core.InputSignal<NgxFormFieldsetFeedbackAppearance>;
    /**
     * Optional title rendered inside the notification card.
     */
    readonly notificationTitle: _angular_core.InputSignal<string | null | undefined>;
    /**
     * Visual layout for grouped messages.
     */
    readonly listStyle: _angular_core.InputSignal<NgxFormFieldListStyle>;
    /**
     * Base surface tint for the fieldset content area.
     */
    readonly surfaceTone: _angular_core.InputSignal<NgxFormFieldsetSurfaceTone>;
    /**
     * Whether validation state should tint the fieldset surface.
     *
     * - `never` (default): keep the surface neutral and rely on the grouped message only
     * - `always`: tint every invalid/warning fieldset surface
     */
    readonly validationSurface: _angular_core.InputSignal<NgxFormFieldsetValidationSurface>;
    protected readonly isTopPlacement: _angular_core.Signal<boolean>;
    protected readonly showMessages: _angular_core.Signal<boolean>;
    protected readonly resolvedAppearance: _angular_core.Signal<NgxFormFieldsetAppearance>;
    protected readonly resolvedFeedbackAppearance: _angular_core.Signal<'notification' | 'plain'>;
    protected readonly usesNotificationFeedback: _angular_core.Signal<boolean>;
    /**
     * Filtered errors signal for NgxFormFieldError.
     *
     * Passes blocking errors OR warnings, never both — the rendered
     * error/notification slot is a single region and errors take visual
     * priority when both are showable at once.
     *
     * Gated on {@link NgxHeadlessFieldset.shouldShowErrors} (visibility), NOT
     * `aggregatedErrors().length > 0` (presence). Those two diverge now that
     * `NgxHeadlessFieldset.shouldShowWarnings` is timed independently via
     * `warningStrategy` (default `'on-touch'`): a blocking error can be
     * *present* but not yet *visible* (e.g. gated behind `strategy="on-submit"`
     * pre-submit) while a warning is already visible. Gating on presence would
     * render the hidden blocking-error content instead of the visible warning
     * the moment both exist — gating on `shouldShowErrors()` keeps this in
     * lockstep with the `--invalid`/`--warning` host classes and
     * `describedByIds()`, which already check visibility the same way.
     */
    protected readonly filteredErrorsSignal: _angular_core.Signal<readonly _angular_forms_signals.ValidationError[]>;
    protected readonly displayedMessagesSignal: _angular_core.Signal<readonly _angular_forms_signals.ValidationError[]>;
    /**
     * Resolved error-renderer component, exposed as a signal so the outlet
     * rebinds if the DI-provided renderer changes.
     */
    protected readonly errorRendererComponent: _angular_core.Signal<Type<unknown>>;
    /**
     * Inputs map passed to `*ngComponentOutlet` for the error renderer. The
     * fieldset binds `errors`, `fieldName`, `strategy`, `submittedStatus`, and
     * `listStyle` — a superset of the wrapper's contract (`errors`, `fieldName`,
     * and `listStyle` are fieldset-only). Custom renderers must accept these
     * input names; extras declared on a custom renderer are unaffected. The
     * notification branch keeps a static `ngx-form-field-error
     * presentation="panel"` element, not this outlet.
     */
    protected readonly errorRendererInputs: _angular_core.Signal<Record<string, unknown>>;
    protected readonly resolvedValidationSurface: _angular_core.Signal<NgxFormFieldsetValidationSurface>;
    protected readonly resolvedSurfaceTone: _angular_core.Signal<NgxFormFieldsetSurfaceTone>;
    protected readonly showInvalidSurface: _angular_core.Signal<boolean>;
    protected readonly showWarningSurface: _angular_core.Signal<boolean>;
    protected readonly hostRole: _angular_core.Signal<"group" | null>;
    protected readonly legendLabelId: _angular_core.Signal<string | null>;
    protected readonly describedByIds: _angular_core.Signal<string | null>;
    constructor();
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<NgxFormFieldset, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<NgxFormFieldset, "ngx-form-fieldset, [ngxFormFieldset]", ["ngxFormFieldset"], { "showErrors": { "alias": "showErrors"; "required": false; "isSignal": true; }; "errorPlacement": { "alias": "errorPlacement"; "required": false; "isSignal": true; }; "appearance": { "alias": "appearance"; "required": false; "isSignal": true; }; "feedbackAppearance": { "alias": "feedbackAppearance"; "required": false; "isSignal": true; }; "notificationTitle": { "alias": "notificationTitle"; "required": false; "isSignal": true; }; "listStyle": { "alias": "listStyle"; "required": false; "isSignal": true; }; "surfaceTone": { "alias": "surfaceTone"; "required": false; "isSignal": true; }; "validationSurface": { "alias": "validationSurface"; "required": false; "isSignal": true; }; }, {}, never, ["legend", "*"], true, [{ directive: typeof i1$1.NgxHeadlessFieldset; inputs: { "field": "field"; "fields": "fields"; "fieldsetId": "fieldsetId"; "strategy": "strategy"; "warningStrategy": "warningStrategy"; "submittedStatus": "submittedStatus"; "includeNestedErrors": "includeNestedErrors"; }; outputs: {}; }]>;
}

/**
 * Convenience bundle for the basic form field wrapper.
 *
 * Includes `NgxSignalFormAutoAria` so projected hints, errors, and
 * character counts are automatically linked to the input via
 * `aria-describedby` even when consumers don't separately import
 * `NgxSignalFormToolkit`. The directive is idempotent — importing it twice
 * (e.g. via both bundles) is safe.
 *
 * Also includes `NgxSignalFormControlSemanticsDirective` so the
 * `ngxSignalFormControl="..."` / `ngxSignalFormControlAria="manual"`
 * attributes the wrapper's own dev-mode warning instructs authors to add
 * (see the "unresolved control kind" diagnostic in `NgxFormFieldWrapper`)
 * actually do something when a consumer imports only this bundle. Without
 * it, `ngxSignalFormControl` was inert — the control's kind stayed
 * unresolved (the warning kept firing) and, worse, `ariaMode="manual"` was
 * silently ignored while `NgxSignalFormAutoAria` kept managing ARIA via its
 * CSS attribute selector, actively overriding what the author opted out of.
 * The directive is selector-gated (`[ngxSignalFormControl]`) and inert when
 * unused, so including it here is a no-op for consumers who never add the
 * attribute.
 *
 * @example
 * ```typescript
 * import { FormField } from '@angular/forms/signals';
 * import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';
 *
 * @Component({
 *   imports: [FormField, NgxFormField],
 *   template: `
 *     <ngx-form-field-wrapper [formField]="form.email">
 *       <label for="email">Email</label>
 *       <input id="email" [formField]="form.email" />
 *       <ngx-form-field-hint>
 *         Enter your email address
 *       </ngx-form-field-hint>
 *     </ngx-form-field-wrapper>
 *   `
 * })
 * ```
 */
declare const NgxFormField: readonly [typeof NgxSignalFormAutoAria, typeof NgxSignalFormControlSemanticsDirective, typeof NgxFormFieldWrapper, typeof NgxFormFieldHint, typeof NgxFormFieldCharacterCount, typeof NgxFormFieldError, typeof NgxFormFieldset];

export { NgxFormField, NgxFormFieldWrapper, NgxFormFieldset };
export type { NgxFormFieldErrorPlacement, NgxFormFieldsetAppearance, NgxFormFieldsetFeedbackAppearance, NgxFormFieldsetSurfaceTone, NgxFormFieldsetValidationSurface };
