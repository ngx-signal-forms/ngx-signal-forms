// NOT A PUBLIC ENTRY POINT.
//
// This is dist/packages/toolkit/types/ngx-signal-forms-toolkit-core.d.ts,
// a build-time-only secondary entry that strip-internal-exports.mjs
// deletes from the published `exports` map. Every published entry still
// imports its types via a relative specifier, so a breaking change here
// (see #551) can break every consumer without any published entry's own
// .d.ts changing. Snapshotted here so check-published-package.mjs still
// catches it. See that script's header for the full explanation.
// ---8<--- byte-identical snapshot of the built .d.ts below ---8<---
import * as _angular_core from '@angular/core';
import { Signal, InjectionToken, Type, EnvironmentProviders, Provider, Injector, ElementRef, WritableSignal } from '@angular/core';
import { FieldTree, NgValidationError, FieldState, ValidationError, PathKind, SchemaPath, SchemaPathRules, LogicFn, FormRoot } from '@angular/forms/signals';

/**
 * Submission status of a form.
 *
 * Angular Signal Forms exposes `submitting()` but does NOT provide a
 * `submittedStatus()` signal. The toolkit derives this from native signals.
 *
 * - `'unsubmitted'` - Form has not been submitted yet
 * - `'submitting'` - Form is currently being submitted
 * - `'submitted'` - Form has been submitted (regardless of success/failure)
 */
type SubmittedStatus = 'submitted' | 'submitting' | 'unsubmitted';
/**
 * A signal-like value that can be called to get the current value.
 * Represents either an Angular Signal or a zero-argument function.
 *
 * @template T The type of value returned when called
 */
type NgxSignalLike<T> = Signal<T> | (() => T);
/**
 * Accepts a reactive (Signal/function) or a plain static value.
 *
 * Used by {@link unwrapValue}, {@link createErrorVisibility}, and related
 * utilities to accept both signal-driven and constant inputs at a single
 * call site.
 *
 * @public
 * @template T The type of value when unwrapped
 */
type NgxReactiveOrStatic<T> = NgxSignalLike<T> | T;
/**
 * Resolved error display strategy used by forms and config defaults.
 *
 * This excludes `'inherit'`, which only makes sense for field-level overrides.
 */
type ResolvedErrorDisplayStrategy = 'immediate' | 'on-submit' | 'on-touch';
/**
 * Error display strategy determines when validation errors are shown to the user.
 *
 * - `'immediate'` — Show errors as they occur (real-time)
 * - `'on-touch'` — Show after blur or submit (WCAG recommended, default)
 * - `'on-submit'` — Show only after form submission
 * - `'inherit'` — Inherit from form provider (field-level only)
 */
type ErrorDisplayStrategy = ResolvedErrorDisplayStrategy | 'inherit';
/**
 * Resolved warning display strategy used by forms and config defaults.
 *
 * This excludes 'inherit', which only makes sense for field-level overrides.
 */
type ResolvedWarningDisplayStrategy = 'immediate' | 'on-submit' | 'on-touch';
/**
 * Warning display strategy determines when warnings are shown to the user.
 *
 * - `'immediate'` — Show warnings as they occur (real-time)
 * - `'on-touch'` — Show after blur or submit (default)
 * - `'on-submit'` — Show only after form submission
 * - `'inherit'` — Inherit from the form's warning strategy (field-level only)
 */
type WarningDisplayStrategy = ResolvedWarningDisplayStrategy | 'inherit';
/**
 * Form field appearance values accepted from consumers and used internally.
 *
 * - `'standard'`: Label above input (default)
 * - `'outline'`: Bordered container with the label inside it, as a static
 *   caption above the control — it does not float
 * - `'plain'`: Minimal wrapper chrome while keeping wrapper semantics
 *
 * @public
 */
type FormFieldAppearance = 'outline' | 'plain' | 'standard';
/**
 * Form field appearance input for component-level control.
 *
 * - `'standard'`: Default appearance with label above input
 * - `'outline'`: Bordered container with the label inside it, as a static
 *   caption above the control — it does not float
 * - `'plain'`: No border or background chrome while keeping labels, hints, and errors
 * - `'inherit'`: Use the global config default (component-level only)
 *
 * @example Component-level override
 * ```html
 * <!-- Override global config to use standard for a specific field -->
 * <ngx-form-field-wrapper [formField]="form.email" appearance="standard">
 *   <label for="email">Email</label>
 *   <input id="email" [formField]="form.email" />
 * </ngx-form-field-wrapper>
 * ```
 *
 * @example Plain appearance for custom controls
 * ```html
 * <ngx-form-field-wrapper [formField]="form.rating" appearance="plain">
 *   <label for="rating">Rating</label>
 *   <app-rating-control id="rating" [formField]="form.rating" />
 * </ngx-form-field-wrapper>
 * ```
 *
 * @see https://material.angular.dev/components/form-field/overview#form-field-appearance-variants
 */
type FormFieldAppearanceInput = FormFieldAppearance | 'inherit';
/**
 * Form field orientation controls whether the label is positioned
 * above the input (vertical) or to the left of it (horizontal).
 *
 * `outline` appearance always resolves to vertical because its label caption
 * sits inside the field chrome, above the control.
 *
 * @public
 */
type FormFieldOrientation = 'horizontal' | 'vertical';
/**
 * Form field orientation input for component-level control.
 *
 * - `'vertical'`: Label above input (default)
 * - `'horizontal'`: Label to the left of the input
 * - `'inherit'`: Use the global config default (component-level only)
 *
 * Orientation only affects an individual field wrapper. Parent form grids stay
 * under consumer control, which allows pages to keep multi-column layouts or
 * intentionally collapse to one field row per line in horizontal mode.
 *
 * @public
 */
type FormFieldOrientationInput = FormFieldOrientation | 'inherit';
/**
 * Semantic control families understood by the toolkit wrapper layer.
 *
 * Kept intentionally small so consumers can opt into stable wrapper behavior
 * without the toolkit hard-coding every possible custom control. The union is
 * closed: adding a new value is a toolkit change, not a consumer extension.
 *
 * ## Consumer extensibility
 *
 * - **Override preset behavior** for an existing kind via
 *   `provideNgxSignalFormControlPresets({ slider: { layout: 'custom', ariaMode: 'manual' } })`.
 * - **Declare per-control semantics** on the host via the
 *   `NgxSignalFormControl` inputs:
 *   `ngxSignalFormControl`, `ngxSignalFormControlLayout`,
 *   `ngxSignalFormControlAria`.
 * - **Custom widgets that don't fit any native kind** should use
 *   `ngxSignalFormControl="composite"` together with
 *   `appearance="plain"` (and usually `ariaMode="manual"`). The wrapper
 *   still contributes labels, hints, errors, and field identity but stays
 *   out of the control's own chrome and ARIA contract.
 *
 * ## Toolkit-internal: adding a new kind
 *
 * Adding a value to this union is a breaking change and requires updating
 * three coupled locations; TypeScript will fail the build until all are in
 * sync:
 *
 * 1. This union type.
 * 2. `DEFAULT_NGX_SIGNAL_FORM_CONTROL_PRESETS` in
 *    `packages/toolkit/core/tokens.ts` — the default `layout` + `ariaMode`
 *    for the new kind. The runtime
 *    `NGX_SIGNAL_FORM_CONTROL_KIND_VALUES` list is derived from this
 *    registry's keys, so updating the registry automatically keeps the
 *    runtime list in sync.
 * 3. `CONTROL_KIND_CAPABILITIES` in
 *    `packages/toolkit/form-field/form-field.utils.ts` — the
 *    wrapper-layout capability flags (`textual`, `supportsOutline`,
 *    `selectionGroup`, `paddedContent`, `forcesVertical`, `clusterRole`).
 *
 * The `Record<NgxSignalFormControlKind, ...>` types on (2) and the
 * `satisfies` clause on (3) enforce exhaustiveness at compile time, so the
 * TS error from adding only (1) tells you exactly what's missing.
 * Heuristic inference in `inferNgxSignalFormControlKind`
 * (`packages/toolkit/core/utilities/control-semantics.ts`) is optional and
 * only needed if the new kind has a reliable DOM fingerprint.
 */
type NgxSignalFormControlKind = 'checkbox' | 'composite' | 'input-like' | 'radio-group' | 'slider' | 'standalone-field-like' | 'switch';
/**
 * Layout presets understood by the form-field wrapper.
 */
type NgxSignalFormControlLayout = 'custom' | 'group' | 'inline-control' | 'stacked';
/**
 * Controls how the toolkit auto-ARIA layer participates for a control.
 *
 * - `auto`: toolkit manages `aria-invalid`, `aria-describedby`, and `aria-required`
 * - `manual`: consumer fully owns those attributes
 */
type NgxSignalFormControlAriaMode = 'auto' | 'manual';
/**
 * Explicit control semantics declared by a consumer.
 */
interface NgxSignalFormControlSemantics {
    readonly kind?: NgxSignalFormControlKind;
    readonly layout?: NgxSignalFormControlLayout;
    readonly ariaMode?: NgxSignalFormControlAriaMode;
}
/**
 * Preset behavior for a semantic control family.
 */
interface NgxSignalFormControlPreset {
    readonly layout: NgxSignalFormControlLayout;
    readonly ariaMode: NgxSignalFormControlAriaMode;
}
/**
 * Full preset registry keyed by control kind.
 */
type NgxSignalFormControlPresetRegistry = Record<NgxSignalFormControlKind, NgxSignalFormControlPreset>;
/**
 * Consumer overrides for the preset registry.
 */
type NgxSignalFormControlPresetOverrides = Partial<Record<NgxSignalFormControlKind, {
    [K in keyof NgxSignalFormControlPreset]?: NgxSignalFormControlPreset[K] | undefined;
}>>;
/**
 * Field-marking strategy: which fields carry a visual marker.
 *
 * - `'required'` — mark required fields (default). Best when most fields are
 *   optional.
 * - `'optional'` — mark optional (non-required) fields. Best when most fields
 *   are required (the GOV.UK / NN/g "mark the exception" guidance).
 * - `'none'` — mark nothing visually. Required state is still conveyed
 *   programmatically via `aria-required`, so this stays accessible.
 *
 * @public
 */
type FieldMarkingMode = 'none' | 'optional' | 'required';
/**
 * The kind of marker actually rendered on a field — the markable subset of
 * {@link FieldMarkingMode} (`'none'` never produces a marker). Also the set of
 * values the wrapper's `data-marker` host attribute can take (or absent).
 *
 * @public
 */
type MarkerKind = Exclude<FieldMarkingMode, 'none'>;
/**
 * A resolved field marker: its {@link MarkerKind} and the text to render. A
 * `null` resolution means no marker (mode is `'none'`, or the field's
 * required-ness does not match the active mode).
 *
 * @public
 */
interface ResolvedMarker {
    readonly kind: MarkerKind;
    readonly text: string;
}
/**
 * Configuration options for the ngx-signal-forms toolkit.
 */
interface NgxSignalFormsConfig {
    /**
     * Default error display strategy.
     * @default 'on-touch'
     */
    defaultErrorStrategy: ResolvedErrorDisplayStrategy;
    /**
     * Default warning display strategy.
     *
     * A warning judges a *complete* value, so it is gated until the user
     * commits the value by blur or submit. Set `'immediate'` if you want
     * advisory messages to appear while the user types.
     *
     * @default 'on-touch'
     */
    defaultWarningStrategy: ResolvedWarningDisplayStrategy;
    /**
     * Default appearance for form fields.
     * @default 'standard'
     */
    defaultFormFieldAppearance: FormFieldAppearance;
    /**
     * Default orientation for form fields.
     * @default 'vertical'
     */
    defaultFormFieldOrientation: FormFieldOrientation;
    /**
     * Which fields carry a visual marker (`'required'` | `'optional'` | `'none'`).
     *
     * Markers render in every appearance (standard, outline, plain). Regardless
     * of this setting, required state is always exposed via `aria-required`.
     *
     * @default 'required'
     */
    showMarkerWhen: FieldMarkingMode;
    /**
     * Custom character(s) appended to the label of **required** fields when
     * `showMarkerWhen` is `'required'`.
     * @default ' *'
     */
    requiredMarker: string;
    /**
     * Custom text appended to the label of **optional** fields when
     * `showMarkerWhen` is `'optional'`.
     * @default ' (optional)'
     */
    optionalMarker: string;
    /**
     * Default text for `NgxFormMarkingLegend` in `'required'` mode. The literal
     * token `{marker}` is replaced with the trimmed {@link requiredMarker}.
     * @default '{marker} indicates a required field'
     */
    requiredLegendText: string;
    /**
     * Default text for `NgxFormMarkingLegend` in `'optional'` mode. The literal
     * token `{marker}` is replaced with the trimmed {@link optionalMarker}.
     * @default 'All fields are required unless marked {marker}'
     */
    optionalLegendText: string;
    /**
     * Text for the visually-hidden required-state hint on a `role="group"`
     * multi-control selection cluster (e.g. a required checkbox cluster).
     *
     * `group` does not support `aria-required` (only `radiogroup` does), so
     * `NgxFormFieldWrapper` relocates required-ness into this text, exposed
     * via `aria-describedby` instead of an ARIA state — see
     * https://github.com/ngx-signal-forms/ngx-signal-forms/issues/300.
     * @default 'required'
     */
    requiredHintText: string;
    /**
     * Visually hidden prefix for each blocking error message rendered by
     * `NgxFormFieldError`, exposed to assistive technology through
     * `aria-describedby`. Lets screen reader users tell an error apart from a
     * warning without relying on colour (WCAG 1.4.1, 1.3.1). Pass `''` to
     * disable the prefix.
     *
     * Not applied by `NgxFormFieldErrorSummary` or headless consumers.
     * @default 'Error:'
     */
    errorPrefixText: string;
    /**
     * Visually hidden prefix for each warning message rendered by
     * `NgxFormFieldError`. See {@link errorPrefixText}. Pass `''` to disable
     * the prefix.
     * @default 'Warning:'
     */
    warningPrefixText: string;
    /**
     * Hide a field's hint while it shows a blocking error or warning.
     *
     * The hint id stays in `aria-describedby` either way, so a screen reader
     * always hears it. This setting only controls whether sighted users can
     * also see it. Off by default (WCAG 2.2 SC 3.3.2): a sighted user keeps
     * the format instructions exactly when the error tells them the value was
     * wrong.
     *
     * @default false
     */
    hideHintOnError: boolean;
    /**
     * When the form renders an `NgxFormFieldErrorSummary`, let the summary be
     * the only live region that announces after a submit.
     *
     * The summary and each `NgxFormFieldError` are `role="alert"` regions. One
     * submit that reveals N field errors would otherwise fire N + 1 assertive
     * announcements at once, which screen readers cut off, stack, or repeat.
     * With this on, a field error revealed by a submit shows outside its live
     * region. A later change to that error, while the user edits the field,
     * announces as usual. Forms without a summary are not affected.
     *
     * Set `false` to let every field error announce on submit too.
     * @default true
     */
    errorSummaryAnnouncesAlone: boolean;
    /**
     * Visually hidden text describing a character count's limit, exposed to
     * assistive technology through `aria-describedby`. `NgxFormFieldCharacterCount`
     * renders this next to the visible running count. The `[liveAnnounce]` live
     * region holds only threshold-transition text. The literal token
     * `{max}` is replaced with the resolved `maxLength`.
     * @default 'Up to {max} characters'
     */
    characterCountLimitText: string;
}
/**
 * User-provided configuration (all properties optional).
 *
 * @remarks
 * Nested `provideNgxSignalFormsConfig` / `provideNgxSignalFormsConfigForComponent`
 * calls merge with `??`, so every property — including `requiredMarker` —
 * preserves falsy overrides. Passing `requiredMarker: ''` explicitly clears
 * the inherited marker (for themes that render the required hint entirely
 * via CSS); omitting the key inherits the parent value instead.
 */
interface NgxSignalFormsUserConfig {
    defaultErrorStrategy?: ResolvedErrorDisplayStrategy | undefined;
    defaultWarningStrategy?: ResolvedWarningDisplayStrategy | undefined;
    defaultFormFieldAppearance?: FormFieldAppearance | undefined;
    defaultFormFieldOrientation?: FormFieldOrientation | undefined;
    showMarkerWhen?: FieldMarkingMode | undefined;
    /**
     * Custom character(s) rendered as the required marker. Pass `''` to
     * clear an inherited marker without changing `showMarkerWhen`.
     */
    requiredMarker?: string | undefined;
    /**
     * Custom text rendered as the optional marker. Pass `''` to clear an
     * inherited marker without changing `showMarkerWhen`.
     */
    optionalMarker?: string | undefined;
    /** Override the `'required'` legend text. `{marker}` is substituted. */
    requiredLegendText?: string | undefined;
    /** Override the `'optional'` legend text. `{marker}` is substituted. */
    optionalLegendText?: string | undefined;
    /**
     * Override the visually-hidden required-hint text for `role="group"`
     * selection clusters. Pass `''` to suppress the hint entirely — the
     * wrapper renders no hint node and omits its id from `aria-describedby`,
     * rather than pointing the description at an empty element.
     */
    requiredHintText?: string | undefined;
    /**
     * Override the visually hidden error-message prefix. Pass `''` to
     * disable it.
     */
    errorPrefixText?: string | undefined;
    /**
     * Override the visually hidden warning-message prefix. Pass `''` to
     * disable it.
     */
    warningPrefixText?: string | undefined;
    /**
     * Set `false` to let field errors announce on submit even when the form
     * renders an error summary.
     */
    errorSummaryAnnouncesAlone?: boolean | undefined;
    /**
     * Override the character-count limit text. Must contain the `{max}`
     * placeholder for the resolved `maxLength` to appear.
     */
    characterCountLimitText?: string | undefined;
    /**
     * Set `true` to hide a field's hint while it shows a blocking error or
     * warning. See {@link NgxSignalFormsConfig.hideHintOnError}.
     */
    hideHintOnError?: boolean | undefined;
}

/**
 * Form context provided to child directives and components.
 *
 * Provides access to the Angular Signal Forms instance and error display configuration.
 * Child components can inject this context to access form state without prop drilling.
 */
interface NgxSignalFormContext {
    /**
     * The Signal Forms instance (FieldTree).
     */
    form: FieldTree<unknown>;
    /**
     * Derived submission status based on Angular's native signals.
     *
     * **Values**:
     * - `'unsubmitted'` - Form hasn't been submitted yet
     * - `'submitting'` - Form is currently being submitted (`submitting()` is true)
     * - `'submitted'` - Form has completed at least one submission attempt
     *
     * This is derived from Angular's `submitting()` signal by tracking
     * submit lifecycle transitions. Resets to `'unsubmitted'` when `form.reset()`
     * is called (detected via `touched()` becoming false).
     */
    submittedStatus: Signal<SubmittedStatus>;
    /**
     * The error display strategy for this form.
     */
    errorStrategy: Signal<ResolvedErrorDisplayStrategy>;
    /**
     * The warning display strategy for this form.
     */
    warningStrategy: Signal<ResolvedWarningDisplayStrategy>;
}
/**
 * Directive that enhances Angular's `FormRoot` with toolkit context.
 *
 * This directive is intentionally additive: Angular's public `FormRoot`
 * continues to own submission behavior while the toolkit layers on extra DI
 * context, submitted-status tracking, and form-level error strategy.
 *
 * Use it together with Angular's `[formRoot]` binding on the same `<form>`.
 *
 * ### Why this uses a separate selector instead of `hostDirectives`
 *
 * The toolkit does not compose Angular's `FormRoot` via `hostDirectives` because
 * that would either duplicate `FormRoot` on the host element or make the toolkit
 * proxy Angular's public API surface again. A separate additive attribute keeps
 * Angular's public API in the lead.
 *
 * ### Toolkit additions (on top of Angular's `FormRoot`)
 *
 * 1. DI context for child toolkit components (`NGX_SIGNAL_FORM_CONTEXT`)
 * 2. Submitted status tracking (`unsubmitted` → `submitting` → `submitted`)
 * 3. Error display strategy management (`errorStrategy` input)
 *
 * ### Submission ownership
 *
 * Angular's `FormRoot` remains the only directive that calls `submit()` and
 * prevents the native submit. The toolkit only observes submit attempts so the
 * `'on-submit'` strategy can also work for invalid submissions.
 *
 * @example Angular-led form with toolkit enhancement
 * ```typescript
 * @Component({
 *   template: `
 *     <form [formRoot]="userForm" ngxSignalForm>
 *       <input [formField]="userForm.email" type="email" />
 *       <ngx-form-field-error [formField]="userForm.email" fieldName="email" />
 *       <button type="submit">Submit</button>
 *     </form>
 *   `
 * })
 * export class UserFormComponent {
 *   readonly #userData = signal({ email: '' });
 *   protected readonly userForm = form(this.#userData, {
 *     submission: {
 *       action: async (field) => {
 *         await this.save(field().value());
 *         return undefined;
 *       },
 *       onInvalid: createOnInvalidHandler(),
 *     },
 *   });
 * }
 * ```
 *
 * @example With error strategy
 * ```html
 * <form [formRoot]="userForm" ngxSignalForm errorStrategy="on-submit">
 *   <!-- Errors appear only after form submission -->
 * </form>
 * ```
 */
declare class NgxSignalForm {
    #private;
    /**
     * The Angular Signal Forms instance owned by Angular's public `FormRoot`.
     */
    readonly formRoot: Signal<FieldTree<unknown>>;
    /**
     * Error display strategy for this form.
     * Overrides the global default for all fields in this form.
     *
     * Typed as {@link ResolvedErrorDisplayStrategy} (not `ErrorDisplayStrategy`)
     * because `'inherit'` is a field-level-only value — there is nothing above
     * the form root to inherit from — so binding it here is a compile-time error.
     */
    readonly errorStrategy: _angular_core.InputSignal<ResolvedErrorDisplayStrategy | null | undefined>;
    /**
     * Resolved error display strategy (form-level or global default).
     */
    protected readonly resolvedErrorStrategy: Signal<ResolvedErrorDisplayStrategy>;
    /**
     * Warning display strategy for this form.
     * Overrides the global default for all fields in this form.
     *
     * Typed as {@link ResolvedWarningDisplayStrategy} (not `WarningDisplayStrategy`)
     * because `'inherit'` is a field-level-only value — there is nothing above
     * the form root to inherit from — so binding it here is a compile-time error.
     */
    readonly warningStrategy: _angular_core.InputSignal<ResolvedWarningDisplayStrategy | null | undefined>;
    /**
     * Resolved warning display strategy (form-level or global default).
     */
    protected readonly resolvedWarningStrategy: Signal<ResolvedWarningDisplayStrategy>;
    /**
     * Submission status derived from Angular Signal Forms' native signals
     * and the directive's own submit-attempt tracking.
     *
     * Angular 22 provides a `submitting()` signal on `FieldState`,
     * but NOT a `submittedStatus()` signal. The toolkit derives it:
     *
     * - `'unsubmitted'` - No submission attempt yet
     * - `'submitting'` - `submitting()` is currently `true` (valid form, action running)
     * - `'submitted'` - A submit was attempted (via `onSubmitAttempt`), regardless of validity
     *
     * **Reset behavior**: When `form.reset()` is called, the status returns to `'unsubmitted'`.
     * This is detected by watching for `touched()` becoming `false` after being `true`.
     */
    readonly submittedStatus: Signal<SubmittedStatus>;
    protected onSubmitAttempt(): void;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<NgxSignalForm, never>;
    static ɵdir: _angular_core.ɵɵDirectiveDeclaration<NgxSignalForm, "form[formRoot][ngxSignalForm]", ["ngxSignalForm"], { "errorStrategy": { "alias": "errorStrategy"; "required": false; "isSignal": true; }; "warningStrategy": { "alias": "warningStrategy"; "required": false; "isSignal": true; }; }, {}, never, never, true, never>;
}

/**
 * Context provided by form field wrapper components.
 * Allows child components (like error display) to inherit field name.
 *
 * `fieldName` may emit `null` when the wrapper cannot resolve a field name
 * (no `[formField]`, no explicit `[fieldName]` input, no projected control).
 * Consumers should treat `null` as "field name not yet known" — usually by
 * skipping id/aria linking and (in dev mode) surfacing the misconfiguration.
 */
interface NgxSignalFormFieldContext {
    /** Resolved field name signal, or `null` when the wrapper cannot resolve one. */
    readonly fieldName: Signal<string | null>;
    /**
     * Resolves a stable 0-based ordinal for `hint` among its sibling hints
     * that also need a generated fallback id (no bound or explicit `id`).
     * Wrappers that project more than one `<ngx-form-field-hint>` for the
     * same field implement this so the fallback id stays unique per hint
     * instead of every unnamed hint colliding on `${fieldName}-hint`
     * (WCAG 1.3.1, axe `duplicate-id-aria`). `hint` is the requesting hint
     * component instance, typed as `object` here so this core token stays
     * free of a dependency on the assistive entry point.
     *
     * Read reactively (inside a `computed`) so ids stay in sync as sibling
     * hints are added, removed, or reordered. Omitted by contexts that don't
     * track hints — callers fall back to ordinal `0`.
     *
     * Contract: implementations must return `0` for a `hint` they cannot
     * place among their own candidates (unknown instance, or one that
     * belongs to a nested field context) rather than a sentinel like `-1` —
     * callers use the return value directly to build an id, so an unresolved
     * position must still resolve to the unsuffixed `${fieldName}-hint`.
     */
    readonly hintOrdinal?: (hint: object) => number;
    /**
     * Whether the wrapper's bound control has its `aria-describedby` composed
     * by `NgxSignalFormAutoAria` — `true` unless the control opts out via
     * `ngxSignalFormControlAria="manual"`. In manual mode, auto-aria leaves
     * `aria-describedby` entirely author-owned (see
     * `NgxSignalFormAutoAria.ariaDescribedBy`), so an id registered through
     * `NGX_SIGNAL_FORM_HINT_REGISTRY` — a hint's, or a character count's limit
     * description — never reaches the DOM attribute even though the id was
     * successfully minted.
     *
     * This does not affect `NgxFormFieldHint`: its content stays directly
     * visible whether or not its id is referenced, so an unlinked hint is
     * still readable. `NgxFormFieldCharacterCount` reads this signal because
     * it does the opposite — it hides its own visible "n/max" text once a
     * limit description exists to replace it — and hiding that text without a
     * working link would silence the count for assistive technology (issue
     * #499 hardening).
     *
     * Omitted by contexts that don't track control ARIA ownership. Callers
     * default to `false` when this is absent — a context that cannot confirm
     * the link is safest treated as "not linked", not as the common case.
     * `NgxFormFieldWrapper` always publishes it (`true` unless the bound
     * control opts into `ngxSignalFormControlAria="manual"`); a custom
     * wrapper that provides its own `NGX_SIGNAL_FORM_FIELD_CONTEXT` without
     * this member gets the safe default instead of silently promising a link
     * it never registers (see `docs/CUSTOM_WRAPPERS.md`).
     */
    readonly isControlDescribedByManaged?: () => boolean;
}
/**
 * Default configuration applied when no explicit providers override values.
 *
 * Uses `as const` + `satisfies` so each literal property type is preserved
 * (enabling discriminated-union checks at call sites) while the object is
 * still verified against `NgxSignalFormsConfig` at declaration time.
 *
 * @internal
 */
declare const DEFAULT_NGX_SIGNAL_FORMS_CONFIG: {
    readonly defaultErrorStrategy: "on-touch";
    readonly defaultWarningStrategy: "on-touch";
    readonly defaultFormFieldAppearance: "standard";
    readonly defaultFormFieldOrientation: "vertical";
    readonly showMarkerWhen: "required";
    readonly requiredMarker: " *";
    readonly optionalMarker: " (optional)";
    readonly requiredLegendText: "{marker} indicates a required field";
    readonly optionalLegendText: "All fields are required unless marked {marker}";
    readonly requiredHintText: "required";
    readonly errorPrefixText: "Error:";
    readonly warningPrefixText: "Warning:";
    readonly errorSummaryAnnouncesAlone: true;
    readonly characterCountLimitText: "Up to {max} characters";
    readonly hideHintOnError: false;
};
/**
 * Default semantic presets applied when consumers opt into explicit control
 * semantics.
 *
 * Uses `as const` + `satisfies` so each preset keeps its literal `layout`
 * and `ariaMode` types while still being verified against the registry shape.
 *
 * @public
 */
declare const DEFAULT_NGX_SIGNAL_FORM_CONTROL_PRESETS: {
    readonly 'input-like': {
        readonly layout: "stacked";
        readonly ariaMode: "auto";
    };
    readonly 'standalone-field-like': {
        readonly layout: "stacked";
        readonly ariaMode: "auto";
    };
    readonly switch: {
        readonly layout: "inline-control";
        readonly ariaMode: "auto";
    };
    readonly checkbox: {
        readonly layout: "group";
        readonly ariaMode: "auto";
    };
    readonly 'radio-group': {
        readonly layout: "group";
        readonly ariaMode: "auto";
    };
    readonly slider: {
        readonly layout: "stacked";
        readonly ariaMode: "auto";
    };
    readonly composite: {
        readonly layout: "custom";
        readonly ariaMode: "auto";
    };
};
/**
 * Injection token for the global ngx-signal-forms configuration.
 */
declare const NGX_SIGNAL_FORMS_CONFIG: InjectionToken<NgxSignalFormsConfig>;
/**
 * Injection token for semantic control presets used by explicit control
 * metadata and wrapper inference.
 */
declare const NGX_SIGNAL_FORM_CONTROL_PRESETS: InjectionToken<NgxSignalFormControlPresetRegistry>;
/**
 * Injection token for the form context (provided by `NgxSignalForm`
 * when `ngxSignalForm` is present alongside Angular's `[formRoot]`).
 */
declare const NGX_SIGNAL_FORM_CONTEXT: InjectionToken<NgxSignalFormContext>;
/**
 * Injection token for field-level context (provided by form field wrapper).
 * Allows child components to inherit resolved field name without explicit input.
 */
declare const NGX_SIGNAL_FORM_FIELD_CONTEXT: InjectionToken<NgxSignalFormFieldContext>;
/**
 * Injection token for the resolved ARIA ownership mode for a single control
 * host. Provided by `NgxSignalFormControl` at its own
 * directive level, and read by `NgxSignalFormAutoAria` via
 * `{ optional: true, self: true }`.
 *
 * Decouples auto-ARIA from the control-semantics directive: auto-ARIA no
 * longer needs a direct class import, which lets the two directives evolve
 * independently.
 *
 * Exported from the package root so a custom wrapper that writes its own ARIA
 * can declare the mode for a control host it builds itself. Prefer the
 * `ngxSignalFormControlAria` attribute on the control host wherever a
 * template can carry it — provide this token directly only when there is no
 * such host to annotate.
 *
 * @public
 */
declare const NGX_SIGNAL_FORM_ARIA_MODE: InjectionToken<Signal<NgxSignalFormControlAriaMode | null>>;
/**
 * Descriptor for a hint element that should contribute to `aria-describedby` for
 * a specific field. `fieldName` may be `null` when a hint has not been
 * correlated to a field yet — registries decide whether to include it.
 *
 * Public wire format for the {@link NgxSignalFormHintRegistry} contract.
 * Third-party form-field wrappers expose hints to `NgxSignalFormAutoAria`
 * by providing a registry whose `hints` signal yields these descriptors.
 *
 * @public
 */
interface NgxSignalFormHintDescriptor {
    readonly id: string;
    readonly fieldName: string | null;
}
/**
 * Registry of hints that live inside a form-field wrapper. `NgxSignalFormAutoAria`
 * reads this registry instead of querying the DOM, so any wrapper that provides
 * the registry participates in `aria-describedby` chaining.
 *
 * @public
 */
interface NgxSignalFormHintRegistry {
    readonly hints: Signal<readonly NgxSignalFormHintDescriptor[]>;
}
/**
 * Injection token for the hint registry contributed by a form-field wrapper.
 * Decouples auto-ARIA from DOM knowledge of wrapper internals: hint IDs are
 * handed to auto-ARIA by whoever owns the wrapper.
 *
 * Third-party wrapper authors should provide this token at the wrapper
 * component level so projected hints automatically link to the bound control's
 * `aria-describedby`. See `docs/CUSTOM_WRAPPERS.md` for the authoring contract.
 *
 * @public
 */
declare const NGX_SIGNAL_FORM_HINT_REGISTRY: InjectionToken<NgxSignalFormHintRegistry>;
/**
 * A single field's resolved, already-rendered error/warning visibility,
 * published by a message-rendering surface (e.g. `NgxFormFieldError`) that
 * gates its own live regions independently of the ambient form context.
 *
 * `errorContainerVisible`/`warningContainerVisible` are the exact booleans
 * the surface used to decide whether its `${fieldName}-error` /
 * `${fieldName}-warning` element is in the DOM — not a strategy to
 * re-resolve — so `NgxSignalFormAutoAria` mirrors what is actually rendered
 * instead of recomputing the cascade a second time. Named to match
 * `NgxFormFieldError`'s own `errorContainerVisible`/`warningContainerVisible`
 * signals verbatim, so the publish/read seam is grep-traceable end to end.
 *
 * `errorContainerVisible` answers "is the error ID in the DOM?", so it drives
 * `aria-describedby`. `shouldShowErrors` answers "does the field show its
 * errors?", so it drives `aria-invalid`. They differ when a surface renders
 * only one channel: a warning-only template has no error element (container
 * `false`), yet the field is still invalid (`shouldShowErrors` `true`).
 * `shouldShowErrors` is optional. When a registrant leaves it out,
 * auto-ARIA uses `errorContainerVisible` for `aria-invalid` too, which is the
 * behavior before this signal existed.
 *
 * Public wire format for the {@link NgxSignalFormFieldVisibilityRegistry}
 * contract.
 *
 * @public
 */
interface NgxSignalFormFieldVisibilityDescriptor {
    readonly fieldName: string;
    readonly errorContainerVisible: Signal<boolean>;
    readonly warningContainerVisible: Signal<boolean>;
    /**
     * Whether the field shows its blocking errors, whether or not this surface
     * renders an error element. Drives `aria-invalid`. Optional: when absent,
     * auto-ARIA falls back to {@link errorContainerVisible}.
     */
    readonly shouldShowErrors?: Signal<boolean>;
}
/**
 * Registry of field-level error/warning visibility, keyed by field name.
 * Fills the gap `NgxFieldIdentity` cannot: `NgxFieldIdentity` is an
 * element-scoped service provided only by `NgxFormFieldWrapper`, so it has
 * no channel for a standalone `<ngx-form-field-error>` that is a *sibling*
 * of the control it describes rather than an ancestor.
 *
 * `NgxSignalFormAutoAria` prefers `NgxFieldIdentity` when present (the
 * wrapper fast-path) and falls back to this registry so `aria-describedby`
 * still agrees with a wrapper-less error component's own resolved
 * `strategy`/`warningStrategy` overrides.
 *
 * @public
 */
interface NgxSignalFormFieldVisibilityRegistry {
    /**
     * Publishes (or replaces) the descriptor for `descriptor.fieldName`.
     * Returns an unregister function that removes the entry — call it when the
     * publishing surface is destroyed or stops resolving that field name.
     */
    register(descriptor: NgxSignalFormFieldVisibilityDescriptor): () => void;
    /** Reads the current descriptor for `fieldName`, if one is registered. */
    get(fieldName: string): NgxSignalFormFieldVisibilityDescriptor | undefined;
}
/**
 * Injection token for the field-visibility registry contributed by
 * `NgxSignalForm`. Provided at the `[ngxSignalForm]` host so every field
 * inside the same form — wrapped or standalone — shares one registry.
 *
 * Third-party message-rendering surfaces that gate a live region on their
 * own resolved strategy should register into this token so
 * `NgxSignalFormAutoAria` can keep `aria-describedby` in lockstep. This is
 * the channel for **wrapper-less** surfaces specifically — a wrapped field
 * publishes through `NgxFieldIdentity` instead (see
 * `docs/CUSTOM_WRAPPERS.md` for that contract). See
 * "Publishing visibility for a custom standalone error surface" in
 * `docs/CUSTOM_CONTROLS.md` for the worked example.
 *
 * @public
 */
declare const NGX_SIGNAL_FORM_FIELD_VISIBILITY_REGISTRY: InjectionToken<NgxSignalFormFieldVisibilityRegistry>;
/**
 * Renderer contract for the form-field error slot. Two consumers bind this
 * renderer:
 *
 * - `NgxFormFieldWrapper` binds inputs
 *   `{formField, strategy, submittedStatus, warningStrategy, fieldName}`.
 * - `NgxFormFieldset` binds inputs `{errors, fieldName, strategy, submittedStatus, listStyle}`.
 *
 * The wrapper instantiates the configured component via `*ngComponentOutlet`
 * and binds the relevant input set per call site. A custom renderer intended
 * to replace both must accept the union of those input names; inputs the
 * renderer doesn't declare never reach it. Angular's `componentRef.setInput`
 * skips them and, in dev mode, logs an `NG0303` error (it throws when the app
 * sets `errorOnUnknownProperties`).
 *
 * Renderers may accept extra inputs beyond the contract (analytics tags,
 * theming hooks); the wrapper/fieldset ignore them and Angular accepts the
 * `inputs` map without warning.
 *
 * The provided `component` must be a standalone component — the wrapper and
 * fieldset instantiate it via `*ngComponentOutlet` without supplying
 * `ngComponentOutletNgModule`, so module-declared components are not
 * supported.
 *
 * ## id contract (required for valid `aria-describedby`)
 *
 * Both call sites compose the bound control's `aria-describedby` from
 * `${fieldName}-error` / `${fieldName}-warning` whenever errors/warnings are
 * visible (see `createAriaDescribedBySignal` and the wrapper's
 * selection-cluster host binding) — this composition happens independently
 * of which renderer is mounted. A custom renderer **must** render an element
 * with `id="${fieldName}-error"` whenever it displays blocking errors, and
 * `id="${fieldName}-warning"` whenever it displays warnings (using the
 * `fieldName` input above, or by injecting `NGX_SIGNAL_FORM_FIELD_CONTEXT`
 * itself when the wrapper doesn't pass it — e.g. `NgxFormFieldset`'s
 * contract predates the `fieldName` addition here but already binds it
 * explicitly). A renderer that doesn't satisfy this produces dangling
 * `aria-describedby` references — an axe `aria-valid-attr-value` violation
 * on every invalid field. See `NgxFormFieldError` for the reference
 * implementation and `docs/CUSTOM_WRAPPERS.md` for the full checklist.
 *
 * @public
 */
interface NgxFormFieldErrorRenderer {
    readonly component: Type<unknown>;
}
/**
 * Renderer contract for the hint slot dispatched by `NgxFormFieldHint`.
 *
 * When registered, `<ngx-form-field-hint>` dynamically instantiates the
 * configured component (via `ViewContainerRef.createComponent` with
 * `projectableNodes`) and forwards projected content into the renderer's
 * default `<ng-content />` slot. The renderer receives the metadata
 * `NgxFormFieldHint` already exposes as inputs:
 * `{ resolvedFieldName: string | null, resolvedId: string, position:
 * 'left' | 'right' | null }`. Renderers must declare all three with
 * `input()`. `componentRef.setInput` skips an undeclared input and, in dev
 * mode, logs an `NG0303` error (it throws when the app sets
 * `errorOnUnknownProperties`).
 *
 * When no provider is registered, `NgxFormFieldHint` falls back to direct
 * `<ng-content />` projection (preserving backwards compatibility for
 * consumers using the component outside a wrapper).
 *
 * The provided `component` must be a standalone component — it is
 * instantiated without an `NgModuleRef`, so module-declared components are
 * not supported.
 *
 * @public
 */
interface NgxFormFieldHintRenderer {
    readonly component: Type<unknown>;
}
/**
 * Injection token for the error renderer used by `NgxFormFieldWrapper`
 * and `NgxFormFieldset`. When no provider is registered, `NgxFormFieldWrapper`
 * and `NgxFormFieldset` fall back to `NgxFormFieldError` from
 * `@ngx-signal-forms/toolkit/assistive`. The token itself has no factory —
 * consumers injecting it directly should use `{ optional: true }` and treat
 * `null` as "use the wrapper's default".
 *
 * Override at environment scope via `provideFormFieldErrorRenderer(...)`
 * or at component scope via `provideFormFieldErrorRendererForComponent(...)`.
 * See `docs/CUSTOM_WRAPPERS.md`.
 *
 * @public
 */
declare const NGX_FORM_FIELD_ERROR_RENDERER: InjectionToken<NgxFormFieldErrorRenderer | null>;
/**
 * Injection token consulted by `NgxFormFieldHint` to dispatch hint
 * rendering through a custom design-system-flavoured component.
 *
 * When registered, `<ngx-form-field-hint>` dynamically instantiates the
 * configured component (via `ViewContainerRef.createComponent` with
 * `projectableNodes`) and forwards projected content into the renderer's
 * default `<ng-content />` slot — see {@link NgxFormFieldHintRenderer} for
 * the input contract. When no provider is registered, `NgxFormFieldHint`
 * falls back to direct content projection (`<ng-content />`).
 *
 * The token itself has no factory — consumers injecting it directly should
 * use `{ optional: true }` and treat `null` as "no custom hint renderer
 * configured".
 *
 * Override at environment scope via `provideFormFieldHintRenderer(...)`
 * or at component scope via `provideFormFieldHintRendererForComponent(...)`.
 * See `docs/CUSTOM_WRAPPERS.md`.
 *
 * @public
 */
declare const NGX_FORM_FIELD_HINT_RENDERER: InjectionToken<NgxFormFieldHintRenderer | null>;

/**
 * Provides global configuration for ngx-signal-forms toolkit.
 *
 * **Inheritance**: when nested under another `provideNgxSignalFormsConfig`,
 * the child call inherits parent values for any property it does not
 * override. This matches the behavior of
 * `provideNgxSignalFormControlPresets`.
 *
 * @param config - User configuration options (all properties optional)
 * @returns Environment providers
 *
 * @example
 * ```typescript
 * /// app.config.ts
 * import { provideNgxSignalFormsConfig } from '@ngx-signal-forms/toolkit';
 *
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideNgxSignalFormsConfig({
 *       defaultErrorStrategy: 'on-touch',
 *     }),
 *   ],
 * };
 * ```
 *
 * @public
 */
declare function provideNgxSignalFormsConfig(config: NgxSignalFormsUserConfig): EnvironmentProviders;
/**
 * Provides component-level configuration for ngx-signal-forms toolkit.
 *
 * Use this function when you need to configure signal forms at the component
 * level (in a component's `providers` array). For application-level
 * configuration, use `provideNgxSignalFormsConfig()` instead.
 *
 * **Inheritance**: parent-scope config is inherited via `inject(..., {
 * optional: true, skipSelf: true })` and merged property-by-property with
 * the supplied overrides — matching `provideNgxSignalFormControlPresetsForComponent`.
 *
 * @param config - User configuration options (all properties optional)
 * @returns Provider array for component-level injection
 *
 * @example
 * ```typescript
 * @Component({
 *   providers: [
 *     provideNgxSignalFormsConfigForComponent({
 *       defaultFormFieldAppearance: 'outline',
 *     }),
 *   ],
 * })
 * export class MyComponent {}
 * ```
 *
 * @public
 */
declare function provideNgxSignalFormsConfigForComponent(config: NgxSignalFormsUserConfig): Provider[];

/**
 * Merges partial preset overrides onto a base registry, returning a new fully
 * resolved registry. Override fields cascade
 * (`input → parent → built-in default`) per kind, and unknown kinds are
 * ignored (with a dev-mode warning) so the result always satisfies the full
 * {@link NgxSignalFormControlPresetRegistry} shape.
 *
 * This is the single source of truth for preset cascade logic. The DI
 * providers use it. Call it yourself to extend a registry you read from
 * {@link NGX_SIGNAL_FORM_CONTROL_PRESETS} without mutating it.
 *
 * @param base Base registry to merge onto, or `null` to start
 *   from {@link DEFAULT_NGX_SIGNAL_FORM_CONTROL_PRESETS}.
 * @param presets Partial overrides to apply on top of the base registry.
 * @returns A new fully resolved preset registry (the input is not mutated).
 *
 * @example Extend the effective presets
 * ```ts
 * const presets = inject(NGX_SIGNAL_FORM_CONTROL_PRESETS);
 * // Only `slider.layout` changes. Every other kind and field is kept.
 * const next = mergeNgxSignalFormControlPresets(presets, {
 *   slider: { layout: 'custom' },
 * });
 * ```
 *
 * @public
 */
declare function mergeNgxSignalFormControlPresets(base: NgxSignalFormControlPresetRegistry | null, presets: NgxSignalFormControlPresetOverrides): NgxSignalFormControlPresetRegistry;
/**
 * Overrides semantic control presets for the current injector tree.
 *
 * Use this when you want a global or feature-level default for wrapper layout
 * or ARIA ownership without repeating `ngxSignalFormControlLayout` or
 * `ngxSignalFormControlAria` on every matching control.
 *
 * Explicit directive inputs still win over provider defaults.
 *
 * @example
 * ```typescript
 * providers: [
 *   provideNgxSignalFormControlPresets({
 *     slider: { layout: 'custom', ariaMode: 'manual' },
 *   }),
 * ];
 * ```
 */
declare function provideNgxSignalFormControlPresets(presets: NgxSignalFormControlPresetOverrides): EnvironmentProviders;
/**
 * Component-scoped variant of `provideNgxSignalFormControlPresets()`.
 *
 * This is useful for demos, feature shells, or isolated subtrees that need a
 * different semantic default without changing application-wide behavior.
 *
 * @example
 * ```typescript
 * providers: [
 *   ...provideNgxSignalFormControlPresetsForComponent({
 *     slider: { layout: 'custom', ariaMode: 'manual' },
 *   }),
 * ];
 * ```
 */
declare function provideNgxSignalFormControlPresetsForComponent(presets: NgxSignalFormControlPresetOverrides): Provider[];

/**
 * Factory for a built-in validation error kind. Receives the strongly typed
 * Angular error, so its discriminating fields (e.g. `minLength`, `min`,
 * `pattern`) are available with full type-safety and autocomplete.
 */
type BuiltInErrorMessageFactory<TError extends NgValidationError> = (error: TError) => string;
/**
 * Factory for a custom validator kind. Custom errors have no statically known
 * shape, so their params are intentionally untyped. The `any` parameter also
 * keeps the per-kind built-in factories assignable to the string index
 * signature on {@link ErrorMessageRegistry}.
 */
type ErrorMessageFactory = (params: any) => string;
/**
 * Strongly typed messages for Angular's built-in validation error kinds.
 *
 * Each known kind maps to either a static string or a factory that receives the
 * matching `NgValidationError` subtype.
 */
type BuiltInErrorMessages = {
    [TError in NgValidationError as TError['kind']]?: string | BuiltInErrorMessageFactory<TError> | undefined;
};
type ErrorMessageRegistryInput = Readonly<ErrorMessageRegistry>;
type ErrorMessageRegistryFactory = () => ErrorMessageRegistryInput;
/**
 * Error message registry for customizing validation error display.
 *
 * Maps error kinds to display messages. Supports:
 * - String literals for static messages
 * - Factory functions for dynamic messages with parameters
 *
 * ## Philosophy: Zero-config by default
 *
 * Standard Schema libraries (Zod, Valibot, ArkType) include error messages in validation results.
 * This registry provides optional overrides for:
 * - Centralized message management (DRY principle)
 * - Internationalization (i18n)
 * - Customizing Angular Signal Forms built-in validators
 *
 * ## Message Priority (3-tier system)
 *
 * 1. **Validator message** - From Zod/Valibot schema (e.g., `z.string().email('Invalid email')`)
 * 2. **Registry override** - From this provider (optional)
 * 3. **Default fallback** - Toolkit's built-in messages
 *
 * The registry is completely optional - if not provided, validator messages work automatically.
 *
 * @example Zero-config (recommended for Standard Schema users)
 * ```typescript
 * /// Zod schema with custom messages
 * const userSchema = z.object({
 *   email: z.string().email('Please enter a valid email address'),
 *   password: z.string().min(8, 'Password must be at least 8 characters'),
 * });
 *
 * /// ✅ No configuration needed! Messages from Zod schema work automatically
 * form(signal({ email: '', password: '' }), (path) => {
 *   validateStandardSchema(path, userSchema);
 * });
 * ```
 *
 * @example Centralized override (DRY for built-in validators)
 * ```typescript
 * /// Override Angular Signal Forms built-in validators
 * provideErrorMessages({
 *   required: 'This field is required',
 *   email: 'Please enter a valid email address',
 *   minLength: ({ minLength }) => `At least ${minLength} characters required`,
 *   maxLength: ({ maxLength }) => `Maximum ${maxLength} characters allowed`,
 *   username_taken: 'This username is already taken', // Custom async validator
 * })
 * ```
 *
 * @example Internationalization with JSON files
 * ```typescript
 * /// locales/en.json
 * {
 *   "validation": {
 *     "required": "This field is required",
 *     "email": "Please enter a valid email address",
 *     "minLength": "At least {minLength} characters required",
 *     "maxLength": "Maximum {maxLength} characters allowed"
 *   }
 * }
 *
 * /// locales/ja.json
 * {
 *   "validation": {
 *     "required": "このフィールドは必須です",
 *     "email": "有効なメールアドレスを入力してください",
 *     "minLength": "{minLength}文字以上入力してください",
 *     "maxLength": "{maxLength}文字以内で入力してください"
 *   }
 * }
 *
 * /// app.config.ts
 * import { LOCALE_ID } from '@angular/core';
 * import enMessages from './locales/en.json';
 * import jaMessages from './locales/ja.json';
 *
 * provideErrorMessages(() => {
 *   const locale = inject(LOCALE_ID);
 *   const messages = locale === 'ja' ? jaMessages.validation : enMessages.validation;
 *
 *   return {
 *     required: messages.required,
 *     email: messages.email,
 *     minLength: ({ minLength }) => messages.minLength.replace('{minLength}', String(minLength)),
 *     maxLength: ({ maxLength }) => messages.maxLength.replace('{maxLength}', String(maxLength)),
 *   };
 * })
 * ```
 *
 * @example With ngx-translate (alternative pattern)
 *
 * The factory runs once, at injection — so a **string** entry is captured
 * once and frozen for the injector's lifetime; it never changes, even on a
 * language switch. A **function** entry is invoked per render, and re-renders
 * on a language change only if it reads a signal during that call —
 * `translate.instant()` alone reads nothing reactive. Make every entry a
 * function that reads a reactive language source, such as
 * `toSignal(translate.onLangChange)`:
 * ```typescript
 * import { toSignal } from '@angular/core/rxjs-interop';
 * import { TranslateService } from '@ngx-translate/core';
 *
 * provideErrorMessages(() => {
 *   const translate = inject(TranslateService);
 *   const lang = toSignal(translate.onLangChange, { initialValue: null });
 *
 *   return {
 *     required: () => {
 *       lang(); // reactive dependency — re-renders on language switch
 *       return translate.instant('validation.required');
 *     },
 *     email: () => {
 *       lang();
 *       return translate.instant('validation.email');
 *     },
 *     minLength: ({ minLength }) => {
 *       lang();
 *       return translate.instant('validation.minLength', { minLength });
 *     },
 *   };
 * })
 * ```
 *
 * @see {@link provideErrorMessages} Provider factory function
 *
 * `/headless`'s README documents this type only as the `errorMessages`
 * option on `createErrorMessageSignal` (the Reactive Primitives section) —
 * grouped there rather than under Utility Functions, which that README
 * reserves for dependency-free helper *functions*, not provider-level
 * configuration interfaces.
 *
 * @group Reactive Primitives
 */
interface ErrorMessageRegistry extends BuiltInErrorMessages {
    /**
     * Map error kinds to display messages.
     *
     * Keys are error kinds (e.g., 'required', 'email', 'minLength', 'custom_error_kind').
     * Values are either:
     * - String literals for static messages
     * - Factory functions for dynamic messages with parameters
     *
     * ## Built-in Angular Signal Forms validators:
     * - `required` - Required field validation
     * - `email` - Email format validation
     * - `minLength` - Minimum length validation (params: `{ minLength: number }`)
     * - `maxLength` - Maximum length validation (params: `{ maxLength: number }`)
     * - `min` - Minimum value validation (params: `{ min: number }`)
     * - `max` - Maximum value validation (params: `{ max: number }`)
     * - `minDate` - Minimum date validation (params: `{ minDate: Date }`)
     * - `maxDate` - Maximum date validation (params: `{ maxDate: Date }`)
     * - `pattern` - Pattern validation (params: `{ pattern: RegExp }`)
     * - `parse` - Value parsing/coercion failure
     * - `standardSchema` - Standard Schema (Zod/Valibot/etc.) validation
     *   (params: `{ issue: { message: string } }`)
     *
     * ## Custom validator kinds:
     * - Any string key for custom validators (e.g., 'username_taken', 'password_weak')
     * - Use 'warn:*' prefix for non-blocking warnings (e.g., 'warn:weak-password')
     *
     * @example Static messages
     * ```typescript
     * const registry: ErrorMessageRegistry = {
     *   required: 'This field is required',
     *   email: 'Invalid email address',
     * };
     * ```
     *
     * @example Factory functions with parameters
     * ```typescript
     * const registry: ErrorMessageRegistry = {
     *   minLength: ({ minLength }) => `At least ${minLength} characters`,
     *   maxLength: ({ maxLength }) => `Maximum ${maxLength} characters`,
     *   min: ({ min }) => `Must be at least ${min}`,
     *   max: ({ max }) => `Must be at most ${max}`,
     * };
     * ```
     *
     * @example Custom validators
     * ```typescript
     * const registry: ErrorMessageRegistry = {
     *   username_taken: 'This username is already taken',
     *   password_weak: ({ score }) => `Password strength: ${score}/5`,
     *   'warn:weak-password': 'Consider using 12+ characters',
     * };
     * ```
     */
    [errorKind: string]: string | ErrorMessageFactory | undefined;
}
/**
 * Injection token for error message registry.
 *
 * Used by NgxFormFieldError to resolve error messages.
 * Completely optional - if not provided, validator messages work automatically.
 *
 * @see {@link ErrorMessageRegistry}
 * @see {@link provideErrorMessages}
 *
 * @internal
 */
declare const NGX_ERROR_MESSAGES: InjectionToken<ErrorMessageRegistry>;
/**
 * Provides error message registry for customizing validation error display.
 *
 * ## Philosophy: Zero-config by default
 *
 * Standard Schema libraries (Zod, Valibot, ArkType) include error messages.
 * This provider is **completely optional** and only needed for:
 * - Centralized message management (DRY principle)
 * - Internationalization (i18n)
 * - Customizing Angular Signal Forms built-in validators
 *
 * ## Message Priority (3-tier system)
 *
 * 1. **Validator message** - From Zod/Valibot schema (used first!)
 * 2. **Registry override** - From this provider (optional fallback)
 * 3. **Default fallback** - Toolkit's built-in messages
 *
 * @param configOrFactory Static config object or factory function for dynamic messages
 * @returns Provider for Angular DI
 *
 * @example Zero-config (recommended)
 * ```typescript
 * /// No provider needed! Zod messages work automatically
 * const userSchema = z.object({
 *   email: z.string().email('Invalid email'),
 * });
 *
 * form(signal({}), (path) => {
 *   validateStandardSchema(path, userSchema);
 * });
 * ```
 *
 * @example Static configuration
 * ```typescript
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideErrorMessages({
 *       required: 'This field is required',
 *       email: 'Invalid email address',
 *       minLength: ({ minLength }) => `At least ${minLength} characters`,
 *     }),
 *   ],
 * };
 * ```
 *
 * @example Dynamic provider (i18n with locale injection)
 * ```typescript
 * import enMessages from './locales/en.json';
 * import jaMessages from './locales/ja.json';
 *
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideErrorMessages(() => {
 *       const locale = inject(LOCALE_ID);
 *       const messages = locale === 'ja' ? jaMessages.validation : enMessages.validation;
 *
 *       return {
 *         required: messages.required,
 *         email: messages.email,
 *         minLength: ({ minLength }) =>
 *           messages.minLength.replace('{minLength}', String(minLength)),
 *       };
 *     }),
 *   ],
 * };
 * ```
 *
 * @example With ngx-translate
 *
 * Every entry must be a function that reads a reactive language signal —
 * `translate.instant()` alone is not reactive, and a string entry is frozen
 * at injection and can never change. See the `ErrorMessageRegistry` doc above
 * for the full string-vs-function contract.
 * ```typescript
 * import { toSignal } from '@angular/core/rxjs-interop';
 *
 * provideErrorMessages(() => {
 *   const translate = inject(TranslateService);
 *   const lang = toSignal(translate.onLangChange, { initialValue: null });
 *
 *   return {
 *     required: () => {
 *       lang();
 *       return translate.instant('validation.required');
 *     },
 *     email: () => {
 *       lang();
 *       return translate.instant('validation.email');
 *     },
 *   };
 * })
 * ```
 *
 * @example With @angular/localize
 *
 * `$localize` is build-time, not runtime: one build per locale
 * (`ng build --localize`). It cannot switch language without a page reload,
 * so use it only with the static (non-factory) form:
 * ```typescript
 * provideErrorMessages({
 *   required: $localize`:@@validation.required:This field is required`,
 *   email: $localize`:@@validation.email:Invalid email address`,
 * })
 * ```
 *
 * @see {@link ErrorMessageRegistry}
 * @see {@link NGX_ERROR_MESSAGES}
 */
declare function provideErrorMessages(configOrFactory: ErrorMessageRegistryInput | ErrorMessageRegistryFactory): Provider;

/**
 * A function that resolves a raw field path (e.g. `'address.postalCode'`)
 * into a human-readable display label (e.g. `'Postcode'`).
 *
 * The raw path has the Angular internal prefix (`ng.form0.`) already stripped.
 */
type FieldLabelResolver = (rawFieldPath: string) => string;
/**
 * A static map from field paths to display labels.
 *
 * Keys are dot-separated paths **without** the Angular internal prefix.
 * For nested fields, use the full path (e.g. `'address.postalCode'`).
 */
type FieldLabelMap = Record<string, string>;
/**
 * Injection token for customizing how field paths are displayed in error
 * summaries.
 *
 * The default factory applies `humanizeFieldPath`, which splits camelCase,
 * capitalizes segments, and joins nested paths with ` / `.
 *
 * Override this token to:
 * - Provide translated labels (Dutch, German, Japanese, ...)
 * - Map internal field paths to user-facing names
 * - Integrate with `$localize`, `ngx-translate`, or any i18n library
 *
 * @see {@link provideFieldLabels}
 *
 * @internal
 */
declare const NGX_FIELD_LABEL_RESOLVER: InjectionToken<FieldLabelResolver>;
/**
 * Provides a field label resolver for customizing how field paths appear in
 * error summaries and other toolkit components.
 *
 * ## Usage
 *
 * ### Static label map
 *
 * Pass a record mapping field paths to display names. Unmapped paths fall
 * back to the default `humanizeFieldPath` behavior.
 *
 * ```typescript
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideFieldLabels({
 *       contactEmail: 'E-mailadres',
 *       'address.postalCode': 'Postcode',
 *       'address.street': 'Straat',
 *     }),
 *   ],
 * };
 * ```
 *
 * ### Custom resolver function
 *
 * For dynamic resolution (i18n libraries, locale-aware logic), pass a
 * factory function. The factory runs in an injection context so you can
 * call `inject()`. The factory itself runs once, at injection — but the
 * *resolver it returns* is called on every render, so a runtime language
 * switch works only if the resolver reads a reactive language signal.
 * Calling `translate.instant()` alone reads nothing reactive:
 *
 * ```typescript
 * import { toSignal } from '@angular/core/rxjs-interop';
 *
 * provideFieldLabels(() => {
 *   const translate = inject(TranslateService);
 *   const lang = toSignal(translate.onLangChange, { initialValue: null });
 *
 *   return (fieldPath) => {
 *     lang(); // reactive dependency — re-renders on language switch
 *     return translate.instant(`fields.${fieldPath}`) || humanizeFieldPath(fieldPath);
 *   };
 * })
 * ```
 *
 * ### With `@angular/localize`
 *
 * `$localize` is build-time, not runtime — one build per locale
 * (`ng build --localize`), no in-page language switching. Use it only with
 * the static (non-factory) form:
 *
 * ```typescript
 * provideFieldLabels({
 *   contactEmail: $localize`:@@field.contactEmail:Contact email`,
 *   'address.postalCode': $localize`:@@field.postalCode:Postal code`,
 * })
 * ```
 *
 * @param configOrFactory - A static `FieldLabelMap` or a factory returning a `FieldLabelResolver`
 * @returns Provider for Angular DI
 *
 * @see {@link NGX_FIELD_LABEL_RESOLVER}
 * @see {@link humanizeFieldPath}
 */
declare function provideFieldLabels(configOrFactory: FieldLabelMap | (() => FieldLabelResolver)): Provider;

/**
 * Override shape for the error renderer provider. Pass `{ component }` to
 * set a renderer; pass `{}` to inherit from a parent scope's provider.
 *
 * @public
 */
interface NgxFormFieldErrorRendererOverride {
    readonly component?: Type<unknown>;
}
/**
 * Override shape for the hint renderer provider.
 *
 * @public
 */
interface NgxFormFieldHintRendererOverride {
    readonly component?: Type<unknown>;
}
/**
 * Provides the error renderer at environment scope.
 *
 * @example
 * ```typescript
 * providers: [
 *   provideFormFieldErrorRenderer({ component: MyErrorRenderer }),
 * ];
 * ```
 *
 * @public
 */
declare function provideFormFieldErrorRenderer(override: NgxFormFieldErrorRendererOverride): EnvironmentProviders;
/**
 * Component-scoped override for the error renderer.
 *
 * @example
 * ```typescript
 * providers: [
 *   ...provideFormFieldErrorRendererForComponent({
 *     component: MyErrorRenderer,
 *   }),
 * ];
 * ```
 *
 * @public
 */
declare function provideFormFieldErrorRendererForComponent(override: NgxFormFieldErrorRendererOverride): Provider[];
/**
 * Provides the hint renderer at environment scope.
 *
 * @example
 * ```typescript
 * providers: [
 *   provideFormFieldHintRenderer({ component: MyHintRenderer }),
 * ];
 * ```
 *
 * @public
 */
declare function provideFormFieldHintRenderer(override: NgxFormFieldHintRendererOverride): EnvironmentProviders;
/**
 * Component-scoped override for the hint renderer.
 *
 * @example
 * ```typescript
 * providers: [
 *   ...provideFormFieldHintRendererForComponent({
 *     component: MyHintRenderer,
 *   }),
 * ];
 * ```
 *
 * @public
 */
declare function provideFormFieldHintRendererForComponent(override: NgxFormFieldHintRendererOverride): Provider[];

/**
 * Track whether the element that carries `aria-invalid` still has a CSS
 * layout box, and publish the answer as a `Signal<boolean>` — the shape
 * `createAriaInvalidSignal`'s third parameter expects.
 *
 * A wrapper that composes the pure ARIA factories opts out of
 * `NgxSignalFormAutoAria`, so it inherits no layout probe and must own one.
 * `docs/CUSTOM_WRAPPERS.md` ("Composing ARIA primitives") explains why a
 * control with no layout box must not keep a stale `aria-invalid`.
 *
 * Reach for this factory when the wrapper has **no** render hook of its own.
 * A wrapper or shim that already runs `afterEveryRender` should call
 * {@link isElementCssVisible} inside its own `earlyRead` instead, and reuse
 * the element it already resolved. `NgxSignalFormAutoAria`
 * (`packages/toolkit/core/directives/auto-aria.ts`) is the reference for
 * that second form.
 *
 * The probe runs in `afterEveryRender`'s `earlyRead` phase because
 * `checkVisibility()` is a layout read. Effects flush before render hooks,
 * so an effect-based probe would report pre-layout geometry.
 *
 * **The probe fails open.** The signal starts `true` and stays `true` while
 * `resolveElement` returns `null`. An element that has not been through
 * layout reports `false`, which would flicker the attribute off and back on
 * during the first render.
 *
 * @param resolveElement Returns the element that **carries** `aria-invalid`,
 *   which is not necessarily the wrapper host. A shim that writes the
 *   attribute onto an inner focusable element must probe that element —
 *   probing the host instead reports the wrong answer whenever the two have
 *   different layout boxes.
 * @param injector Registers the render hook, so a field initializer can call
 *   this factory instead of only a constructor.
 *
 * @public
 */
declare function createControlVisibilitySignal(resolveElement: () => HTMLElement | null, injector: Injector): Signal<boolean>;

/**
 * Resolve whether an element is visible from a CSS perspective.
 *
 * Uses `Element.checkVisibility()` — Baseline 2024, and the only API that
 * answers the question correctly. Its default behavior already reports
 * `false` for `display: none`, `display: contents`, the `hidden` attribute,
 * `content-visibility: hidden`, and a collapsed `<details>` (whose
 * `::details-content` is `content-visibility: hidden`). `visibilityProperty`
 * adds `visibility: hidden`, which removes an element from the accessibility
 * tree just as thoroughly. `checkVisibilityCSS` is the historic alias for the
 * same option, kept for runtimes between Chromium 105 and 121; browsers
 * ignore dictionary members they do not know, so passing both is safe.
 *
 * **`opacityProperty` is deliberately not passed.** An `opacity: 0` control
 * is still laid out, still focusable, and still interactive — it is the
 * standard custom-checkbox and custom-radio pattern, where a real input sits
 * transparently over a styled box. Treating those as hidden would strip
 * `aria-invalid` from controls a keyboard user is actively operating.
 *
 * **When the method is unavailable, this reports `true`.** That is a
 * deliberate fail-open, not an oversight. The obvious fallback,
 * `offsetParent !== null`, is wrong in both directions: it is a false
 * *positive* for a collapsed `<details>` and for `content-visibility: hidden`
 * — the exact cases this function exists to catch — and a false *negative*
 * for `position: fixed` elements, for `<body>`/`<html>`, and for every
 * environment with no layout engine at all (jsdom, and any non-rendering
 * host). Guessing "hidden" there would strip correct ARIA state from visible
 * controls, which is strictly worse than leaving state in place on a control
 * the user cannot see anyway.
 *
 * Exposed publicly (re-exported from `@ngx-signal-forms/toolkit`) so custom
 * controls and third-party wrappers can apply the exact same visibility test
 * the toolkit uses internally, keeping the native-binding and CSS-fallback
 * ARIA paths in lockstep.
 *
 * @public
 */
declare function isElementCssVisible(el: HTMLElement): boolean;
/**
 * Centralized, element-scoped field identity service that owns the load-bearing
 * a11y primitives every assistive/headless surface depends on:
 *
 * - **Name resolution** — the resolved {@link NgxFieldIdentity.fieldName} and
 *   the bound control's {@link NgxFieldIdentity.controlId}. This service stores
 *   the resolved name; it does not own the resolution cascade. The canonical
 *   wrapper computes the name (precedence: explicit → bound-control `id` →
 *   `null`) and feeds it in. Wrappers that opt into the label `for=` tier do so
 *   via `createFieldNameResolver`, which exposes the same cascade with the
 *   label tier as an opt-in middle step.
 * - **Stable ID generation** — {@link NgxFieldIdentity.errorId} (`{name}-error`)
 *   and {@link NgxFieldIdentity.warningId} (`{name}-warning`), derived from the
 *   resolved field name and `null` when no name is available.
 *
 * Provided at the `NgxFormFieldWrapper` level via `providers: [NgxFieldIdentity]`.
 * `NgxSignalFormAutoAria` and hint directives inject it optionally, falling
 * back to their registry-driven behavior when absent.
 *
 * **Channels publish independently.** An identity does not have to drive
 * every channel, and merely *existing* claims nothing. Each of the hint,
 * error-strategy, and warning-strategy channels advertises "unpublished" as
 * a distinct `null` state, and consumers fall back to
 * `NGX_SIGNAL_FORM_HINT_REGISTRY` / `NGX_SIGNAL_FORM_FIELD_VISIBILITY_REGISTRY`
 * per channel — never by testing whether this service is injectable. This is
 * what lets a partially-driven identity (one that only owns the field name,
 * say) coexist with the registries instead of silently disabling them.
 * See ADR-0010.
 *
 * Element-scoped: `providedIn: null` makes it a contract violation to
 * provide this service at the root injector. Each wrapper gets a fresh
 * instance keyed on its own DOM subtree.
 *
 * The class is part of the public API; the `set*` writer methods are tagged
 * `@internal` and must not be called from outside this package. Consumers
 * never call them directly. They read the resolved signals, and publish
 * through the toolkit's own drivers: `NgxFieldIdentityProvider` for the
 * name, and `createFieldPresentation({ identity })` for the resolved
 * strategies.
 *
 * @public
 */
declare class NgxFieldIdentity {
    #private;
    /**
     * Resolved field name. Null when no field name can be determined.
     * Updated by `NgxFormFieldWrapper` via `setFieldName`.
     */
    readonly fieldName: _angular_core.Signal<string | null>;
    /**
     * The bound control element's `id` attribute.
     * Null when no control is found or when the control has no `id`.
     */
    readonly controlId: _angular_core.Signal<string | null>;
    /**
     * Generated error element ID for the field (`{fieldName}-error`).
     * Null when no field name is available.
     */
    readonly errorId: _angular_core.Signal<string | null>;
    /**
     * Generated warning element ID for the field (`{fieldName}-warning`).
     * Null when no field name is available.
     */
    readonly warningId: _angular_core.Signal<string | null>;
    /**
     * Hint IDs contributed by the surrounding hint registry, filtered for
     * this field. Updated by `NgxFormFieldWrapper` when `hintDescriptors` changes.
     *
     * `null` means this identity has **never published** the hint channel —
     * consumers must fall back to `NGX_SIGNAL_FORM_HINT_REGISTRY` exactly as
     * they would with no identity present at all. An empty array means the
     * channel *was* published and this field genuinely has no hints, which is
     * authoritative and suppresses the fallback. See ADR-0010.
     */
    readonly hintIds: _angular_core.Signal<readonly string[] | null>;
    /**
     * The owning wrapper's fully-resolved blocking-error display strategy, or
     * `null` when no wrapper has published one (standalone auto-aria usage).
     *
     * Exists so `NgxSignalFormAutoAria` can gate `aria-describedby` on the same
     * decision the wrapper uses to render its message regions. Without it,
     * auto-aria only sees the form context and global config, so a *field*-level
     * `strategy` override on the wrapper would make the attribute reference an
     * element the wrapper never rendered (a dangling id — axe
     * `aria-valid-attr-value`), or omit one it did.
     *
     * Published by `createFieldPresentation()` when it gets this identity: the
     * built-in wrapper does, and so can any custom wrapper.
     */
    readonly resolvedErrorStrategy: _angular_core.Signal<ResolvedErrorDisplayStrategy | null>;
    /**
     * The owning wrapper's fully-resolved warning display strategy, or `null`
     * when no wrapper has published one.
     *
     * Separate from {@link resolvedErrorStrategy} because the two cascades are
     * independent (ADR-0007): a field can show warnings on `'immediate'` while
     * its blocking errors wait for `'on-submit'`.
     */
    readonly resolvedWarningStrategy: _angular_core.Signal<ResolvedWarningDisplayStrategy | null>;
    /**
     * Aggregated `aria-describedby` ID chain for this field, derived from
     * `hintIds`. Returns `null` when no IDs apply.
     *
     * Consumers that need to append error / warning IDs based on visibility
     * strategy (e.g. auto-aria) build on top of this baseline; this aggregator
     * does not encode `shouldShowErrors` because that decision is owned by
     * the consumer, not the identity service.
     */
    readonly describedBy: _angular_core.Signal<string | null>;
    /**
     * Returns the currently bound control element, or null if not yet resolved.
     */
    resolveControlElement(): HTMLElement | null;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<NgxFieldIdentity, never>;
    static ɵprov: _angular_core.ɵɵInjectableDeclaration<any>;
}

/**
 * Default implementation of the field-visibility registry contract
 * (`NgxSignalFormFieldVisibilityRegistry`), provided per-form by
 * `NgxSignalForm`.
 *
 * A plain keyed map rather than a reactive `contentChildren`-derived list:
 * unlike the hint registry, there is no shared ancestor/descendant DOM
 * relationship between a standalone `<ngx-form-field-error>` and the sibling
 * control it describes, so publishers register and unregister imperatively
 * instead of being discovered through a content query. Because the hint
 * registry's `hints` is itself a `Signal` (backed by `contentChildren`),
 * `NgxSignalFormAutoAria` reading it inside a `computed()` automatically
 * re-runs whenever a hint is added/removed. A plain `Map` has no such
 * signal to read, so `get()` bumps and reads a private version counter —
 * mirroring that same "the read establishes the dependency" idiom — to
 * make mount/unmount/rename of a registered surface reactive too. Without
 * it, a standalone `<ngx-form-field-error>` mounting (or changing field
 * name, or unmounting) after auto-aria's `computed()` first evaluated would
 * never trigger a re-run, leaving `aria-describedby` stale until an
 * unrelated signal happened to invalidate the same computed.
 *
 * `providedIn: null` — this is never injected without an explicit provider,
 * matching `NgxFieldIdentity`'s element/directive-scoped contract.
 * `NgxSignalForm` provides one instance per `[ngxSignalForm]` host so fields
 * in unrelated forms never collide on field name.
 *
 * @internal
 */
declare class NgxFieldVisibilityRegistry {
    #private;
    register(descriptor: NgxSignalFormFieldVisibilityDescriptor): () => void;
    get(fieldName: string): NgxSignalFormFieldVisibilityDescriptor | undefined;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<NgxFieldVisibilityRegistry, never>;
    static ɵprov: _angular_core.ɵɵInjectableDeclaration<any>;
}

/**
 * Per-form channel that lets an error summary and the field errors of the
 * same form find each other, so a submit announces through the summary
 * alone (issue #522, ADR-0012).
 *
 * `NgxSignalForm` provides one instance per `[ngxSignalForm]` host and
 * reports each submit attempt here. `NgxFormFieldErrorSummary` registers
 * whether it currently shows errors. `NgxFormFieldError` reads both to tell
 * "revealed by a submit, and a summary speaks for it" apart from "changed
 * while the user edits".
 *
 * `providedIn: null`: scoped to the form, never a global, so two forms on
 * one page do not silence each other.
 *
 * @internal
 */
declare class NgxSubmitAnnouncements {
    #private;
    /** True while at least one registered summary shows errors. */
    readonly summaryShowsErrors: Signal<boolean>;
    /**
     * True from a submit attempt until the render that follows it has
     * finished. Errors that appear or change inside that window were revealed
     * by the submit. A plain flag, not a signal: readers only sample it when
     * their own errors change.
     */
    isSubmitRenderPending(): boolean;
    /** Called by `NgxSignalForm` on every native submit of the form. */
    notifySubmitAttempt(): void;
    /**
     * Registers a summary's "shows errors" state. Returns the unregister
     * function; call it when the summary is destroyed.
     */
    registerSummary(showsErrors: Signal<boolean>): () => void;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<NgxSubmitAnnouncements, never>;
    static ɵprov: _angular_core.ɵɵInjectableDeclaration<any>;
}

/**
 * Automatically manages ARIA attributes for Signal Forms controls.
 *
 * Adds:
 * - `aria-invalid`: Reflects the field's validation state
 * - `aria-required`: Reflects `FieldState.required()`
 * - `aria-describedby`: Links to the error, warning and hint regions that
 *   are currently rendered
 *
 * **Selector Strategy**: Automatically applies to all form controls with `[formField]` attribute,
 * except radio buttons and standard checkboxes. Checkbox-based switches opt back in
 * with `role="switch"`, and explicit control semantics can opt checkbox/radio hosts in
 * without relying on native-role heuristics.
 *
 * A standalone `<ngx-form-field-error [formField]>` also takes `[formField]`,
 * but it is feedback, not a control. The catch-all selector excludes it, so
 * its host gets no `aria-invalid` and no missing-role warning (#566).
 *
 * **Ownership model**:
 * - default: toolkit owns `aria-invalid`, `aria-required`, and `aria-describedby`
 * - `ngxSignalFormControlAria="manual"`: the control owns those ARIA attributes
 * - `ngxSignalFormAutoAriaDisabled`: disable toolkit participation entirely for bespoke hosts
 *
 * @example
 * ```html
 * <!-- Automatic ARIA (enabled by default) -->
 * <label for="email">Email</label>
 * <input id="email" [formField]="form.email" />
 * <!-- Result: aria-invalid="true" aria-describedby="email-error" when invalid -->
 *
 * <!-- Opt-out -->
 * <input [formField]="form.custom" ngxSignalFormAutoAriaDisabled />
 * ```
 */
declare class NgxSignalFormAutoAria {
    #private;
    /**
     * Computed ARIA invalid state.
     * Returns 'true' | 'false' | null based on field validity and error display strategy.
     *
     * Respects the configured ErrorDisplayStrategy, so aria-invalid='true' only
     * appears when errors should be visible according to the strategy.
     *
     * When the identity service is present and the control is not visible
     * (e.g. inside a collapsed fieldset), returns null so `aria-invalid` is
     * removed from the hidden control rather than going stale.
     */
    protected readonly ariaInvalid: _angular_core.Signal<string | null>;
    /**
     * Computed ARIA required state. Returns `'true'` or `null`.
     *
     * {@link createAriaRequiredSignal} resolves the raw value from
     * `FieldState.required()`. This computed adds role-awareness on top:
     *
     * - Manual mode: the consumer's own DOM value wins.
     * - A native form control (`<input>`, `<select>`, `<textarea>`) always
     *   gets the attribute — it carries no explicit role.
     * - A native `<button>` never gets it. Its implicit role is not in the DOM
     *   `role` attribute, so it needs its own check.
     * - An explicit role gets the attribute only if its effective role
     *   supports `aria-required` per WAI-ARIA 1.2 (see
     *   {@link ARIA_REQUIRED_SUPPORTED_ROLES}). `group` and `button` are two
     *   roles that do not. {@link resolveEffectiveRole} takes the first token
     *   of a space-separated fallback list and lowercases it, matching how
     *   browsers resolve the `role` attribute.
     * - A role-less custom host (for example a bare `<div formField>`) never
     *   gets the attribute — the generic role does not support it. If the
     *   field is required, this also warns once in dev mode, unless the host
     *   contains a descendant control. A wrapper component matches this
     *   directive's selector too, but it is not itself the control — its
     *   projected control already gets its own `aria-required` from its own
     *   directive instance, so the wrapper must stay silent.
     *
     * See https://github.com/ngx-signal-forms/ngx-signal-forms/issues/300 and
     * https://github.com/ngx-signal-forms/ngx-signal-forms/issues/496.
     */
    protected readonly ariaRequired: _angular_core.Signal<string | null>;
    /**
     * Computed ARIA describedby attribute.
     * Links to error/warning message elements for screen readers.
     *
     * Preserves existing aria-describedby values (hints, descriptions) and
     * appends error/warning IDs when they should be shown. Delegates to the
     * pure `createAriaDescribedBySignal` factory; the manual-mode opt-out
     * stays in this directive shell so the factory contract stays
     * unconditional.
     */
    protected readonly ariaDescribedBy: _angular_core.Signal<string | null>;
    constructor();
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<NgxSignalFormAutoAria, never>;
    static ɵdir: _angular_core.ɵɵDirectiveDeclaration<NgxSignalFormAutoAria, "    input[type=\"checkbox\"][ngxSignalFormControl][formField]:not([ngxSignalFormAutoAriaDisabled]),    input[type=\"radio\"][ngxSignalFormControl][formField]:not([ngxSignalFormAutoAriaDisabled]),    input[type=\"checkbox\"][role=\"switch\"][formField]:not([ngxSignalFormAutoAriaDisabled]),    input[formField]:not([ngxSignalFormAutoAriaDisabled]):not([type=\"radio\"]):not([type=\"checkbox\"]),    textarea[formField]:not([ngxSignalFormAutoAriaDisabled]),    select[formField]:not([ngxSignalFormAutoAriaDisabled]),    [formField]:not(input):not(textarea):not(select):not(ngx-form-field-error):not([ngxSignalFormAutoAriaDisabled])  ", never, {}, {}, never, never, true, never>;
}

/**
 * Provides an {@link NgxFieldIdentity} on its host element and publishes a
 * field name into it — the supported way for a third-party wrapper to own
 * field identity for the controls it contains.
 *
 * ## What it is for
 *
 * `NgxSignalFormAutoAria` derives a field name from the bound control's `id`
 * attribute unless an ancestor provides an `NgxFieldIdentity`. That is a hard
 * constraint for a custom wrapper: it forces the field name and the control's
 * DOM `id` to be the same string. Two common shapes cannot satisfy it —
 *
 * - a third-party widget that generates its own inner input `id` and exposes
 *   no override, and
 * - a `role="group"` cluster (radios, checkboxes) whose name belongs to the
 *   group rather than to any single control.
 *
 * In both cases the ids auto-aria generates (`{fieldName}-error`,
 * `{fieldName}-warning`) disagree with what the wrapper actually rendered,
 * leaving `aria-describedby` pointing at nothing — an axe
 * `aria-valid-attr-value` failure, and error text that assistive technology
 * never reaches.
 *
 * ## How to use it
 *
 * Compose it onto your wrapper's host with `hostDirectives`. It has no
 * selector on purpose: placement on the host element is load-bearing (that is
 * the element injector descendants resolve through), and a selector would
 * invite putting it somewhere that silently does nothing.
 *
 * ```typescript
 * @Component({
 *   selector: 'my-field',
 *   hostDirectives: [
 *     { directive: NgxFieldIdentityProvider, inputs: ['fieldName'] },
 *   ],
 *   template: `
 *     <ng-content />
 *     <ngx-form-field-error [formField]="field()" [fieldName]="name()" />
 *   `,
 * })
 * export class MyField { }
 * ```
 *
 * ```html
 * <my-field fieldName="emailAddress" [field]="form.emailAddress">
 *   <label for="p-inputtext-42">Email</label>
 *   <input id="p-inputtext-42" [formField]="form.emailAddress" />
 * </my-field>
 * <!-- aria-describedby="emailAddress-error", not "p-inputtext-42-error" -->
 * ```
 *
 * ## What it does not do
 *
 * It publishes the **field-name channel only**. Hint IDs and the error /
 * warning display strategies keep resolving through
 * `NGX_SIGNAL_FORM_HINT_REGISTRY` and
 * `NGX_SIGNAL_FORM_FIELD_VISIBILITY_REGISTRY`, which stay the supported seams
 * for those. Composing this directive does not disturb them: identity shadows
 * the registries per channel, not by presence (ADR-0010).
 *
 * Strategy deliberately has no channel here. The registry publishes the
 * *observed* boolean that already gates a rendered region, so it cannot drift
 * from the DOM the way a separately-declared strategy could.
 *
 * The `set*` writers on `NgxFieldIdentity` remain `@internal` and are stripped
 * from the published type definitions. This directive is the public surface;
 * it drives them on your behalf.
 *
 * `NgxFormFieldWrapper` composes this directive too, rather than providing
 * `NgxFieldIdentity` itself — so the seam a third-party wrapper uses is the
 * same one the built-in wrapper runs on. Angular feeds a single `fieldName`
 * attribute to both a component's own input and its exposed host-directive
 * input, so composing it costs consumers nothing.
 *
 * @public
 * @group ARIA Composition
 */
declare class NgxFieldIdentityProvider {
    #private;
    /**
     * The field's name — the string every generated id is derived from
     * (`{fieldName}-error`, `{fieldName}-warning`), and what a projected
     * `<ngx-form-field-error [fieldName]="…">` must be given to match.
     *
     * Three states, all meaningful:
     *
     * - a non-empty string — the resolved name. Whitespace is trimmed.
     * - `null` — bound, but not resolvable yet. ARIA wiring is skipped for this
     *   field until a name appears; it does **not** revert to deriving one from
     *   the control's `id`, because a wrapper that declares its own naming has
     *   said the control's `id` is not the name.
     * - unbound — this directive publishes nothing, leaving the identity's name
     *   to the composing component. That branch exists for **package-internal**
     *   composers, which can reach the `@internal` writers: `NgxFormFieldWrapper`
     *   relies on it, because tier 2 of its cascade reads the bound control's
     *   `id`, which is only known in its render write phase, long after inputs
     *   are set. Third-party wrappers cannot take this branch usefully — the
     *   writers are stripped from the published type definitions — so for them
     *   an unbound input means no ARIA wiring at all, and a dev-mode diagnostic
     *   says so.
     *
     * Not `input.required`, deliberately. Exposing a required host-directive
     * input makes it mandatory in every consumer template (`NG8008`, chained
     * from `NG2019` if it is not re-exposed at all). A wrapper's own
     * `fieldName` is normally optional — `NgxFormFieldWrapper`'s certainly is,
     * because the control's `id` is the usual source — so requiring it here
     * would break every field that relies on that fallback.
     */
    readonly fieldName: _angular_core.InputSignal<string | null | undefined>;
    constructor();
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<NgxFieldIdentityProvider, never>;
    static ɵdir: _angular_core.ɵɵDirectiveDeclaration<NgxFieldIdentityProvider, never, never, { "fieldName": { "alias": "fieldName"; "required": false; "isSignal": true; }; }, {}, never, never, true, never>;
}

type NgxSignalFormControlDirectiveValue = NgxSignalFormControlKind | NgxSignalFormControlSemantics | '' | null | undefined;
/**
 * Explicitly declares wrapper semantics for a bound form control or custom
 * control host.
 *
 * The directive writes stable `data-ngx-signal-form-control-*` attributes so
 * wrapper styling and projected-control discovery can use DOM-based semantics
 * instead of relying purely on DOM heuristics. The auto-ARIA directive reads
 * semantics via Angular DI rather than these attributes.
 *
 * **Input shape:** prefer the three dedicated attribute inputs
 * (`ngxSignalFormControl="<kind>"`, `ngxSignalFormControlLayout`,
 * `ngxSignalFormControlAria`) — they read naturally in templates and show
 * intent at a glance. The object-literal form of `ngxSignalFormControl` is a
 * power-user escape hatch for one-off combinations that would otherwise need
 * three separate bindings.
 *
 * **Combining both forms is supported.** When an element carries both the
 * object-literal input and one of the standalone overrides
 * (`ngxSignalFormControlLayout` / `ngxSignalFormControlAria`), the standalone
 * override wins — that is the intentional precedence used by the override
 * inputs and what the resolution logic implements. Treat the object form as
 * the "base" semantics and the standalone inputs as explicit last-mile
 * overrides.
 *
 * Precedence order for each resolved value (layout / ariaMode):
 * standalone override input → object-literal field → preset default.
 *
 * @example Declarative form (preferred)
 * ```html
 * <app-star-rating
 *   id="rating"
 *   role="slider"
 *   [formField]="form.rating"
 *   ngxSignalFormControl="slider"
 *   ngxSignalFormControlAria="manual"
 * />
 * ```
 *
 * @example Object-literal form (power-user escape hatch)
 * ```html
 * <third-party-date-range-picker
 *   id="travelDates"
 *   [ngxSignalFormControl]="{ kind: 'composite', layout: 'stacked', ariaMode: 'manual' }"
 * />
 * ```
 *
 * @example Combining both forms (object-literal base + standalone override)
 * ```html
 * <third-party-date-range-picker
 *   id="travelDates"
 *   [ngxSignalFormControl]="{ kind: 'composite', layout: 'stacked' }"
 *   ngxSignalFormControlAria="manual"
 * />
 * ```
 */
declare class NgxSignalFormControl {
    #private;
    /**
     * Host element this directive is applied to.
     *
     * Exposed so parent wrappers can locate the bound control via
     * `contentChildren(NgxSignalFormControl)` and read the
     * host's tag, `id`, or current attributes (e.g. Material's
     * `aria-describedby` for the `preservedIds` reader of
     * `createAriaDescribedBySignal`). This is the canonical signal-native
     * alternative to imperative DOM probing from a render hook.
     */
    readonly elementRef: ElementRef<any>;
    readonly semanticsInput: _angular_core.InputSignal<NgxSignalFormControlDirectiveValue>;
    readonly layoutOverride: _angular_core.InputSignal<NgxSignalFormControlLayout | null>;
    readonly ariaModeOverride: _angular_core.InputSignal<NgxSignalFormControlAriaMode | null>;
    readonly kind: _angular_core.Signal<NgxSignalFormControlKind | null>;
    readonly layout: _angular_core.Signal<NgxSignalFormControlLayout | null>;
    readonly ariaMode: _angular_core.Signal<NgxSignalFormControlAriaMode | null>;
    readonly hasSemantics: _angular_core.Signal<boolean>;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<NgxSignalFormControl, never>;
    static ɵdir: _angular_core.ɵɵDirectiveDeclaration<NgxSignalFormControl, "[ngxSignalFormControl],[ngxSignalFormControlLayout],[ngxSignalFormControlAria]", never, { "semanticsInput": { "alias": "ngxSignalFormControl"; "required": false; "isSignal": true; }; "layoutOverride": { "alias": "ngxSignalFormControlLayout"; "required": false; "isSignal": true; }; "ariaModeOverride": { "alias": "ngxSignalFormControlAria"; "required": false; "isSignal": true; }; }, {}, never, never, true, never>;
}

/**
 * Public surface of an `aria-describedby` bridge.
 *
 * This shape is the structural superset most design-system a11y services
 * adopt: a reactive `describedBy` value plus a registration API for
 * description and error IDs that downstream design-system primitives may
 * register imperatively (labels, hints, etc.).
 *
 * Brain's `BrnFieldA11yService` matches this shape. Wrapping the bridge
 * behind this typed contract lets a future toolkit consumer assert that a
 * design-system service it intends to swap can be replaced — without
 * pulling in a runtime dependency on the design-system itself.
 *
 * @public
 * @group ARIA Composition
 */
interface AriaDescribedByBridge {
    /**
     * Composed `aria-describedby` value (toolkit-managed IDs first, then any
     * IDs registered via `register*`). `null` when nothing has accumulated,
     * mirroring the directive-friendly "drop the attribute" convention.
     */
    readonly describedBy: Signal<string | null>;
    registerDescription(id: string): void;
    unregisterDescription(id: string): void;
    registerError(id: string): void;
    unregisterError(id: string): void;
}
/**
 * Inputs for {@link createAriaDescribedByBridge}.
 *
 * @public
 * @group ARIA Composition
 */
interface CreateAriaDescribedByBridgeOptions {
    /**
     * Toolkit-managed `aria-describedby` value. Typically the output of
     * {@link import('./create-aria-described-by-signal').createAriaDescribedBySignal}
     * but any `Signal<string | null>` works (a space-separated id list, or
     * `null` when no toolkit-owned IDs apply).
     */
    readonly toolkit: Signal<string | null>;
}
/**
 * Creates a wrapper-scoped bridge that lets a design-system a11y service
 * (e.g. Spartan brain's `BrnFieldA11yService`) consume the toolkit's
 * `aria-describedby` composition.
 *
 * ## Why this exists
 *
 * Design-system primitives that own `aria-describedby` via a host binding
 * fed by an injectable a11y service (Spartan's `BrnFieldA11yService` is the
 * motivating case) overwrite any direct DOM writes the toolkit's auto-aria
 * makes on the next change-detection tick. The fix is to provide a custom
 * a11y service at the wrapper's component-level injector that reads from
 * the toolkit's composition, then let the design-system's host binding
 * write the toolkit-managed IDs onto the bound element.
 *
 * Wrapper authors register the bridge with `useFactory` (or `useClass`
 * around a thin subclass) at the wrapper component-level — component-scope
 * providers win over host-directive providers, so the bridge replaces the
 * design-system's default service without forking the design-system.
 *
 * The bridge's `describedBy` signal merges the toolkit composition with
 * any IDs registered via `register*` so any other DS primitive that
 * registers a description or error id keeps working transparently. It is
 * a strict superset of the typical DS contract, not a lossy replacement.
 *
 * @example Spartan brain integration
 * ```ts
 * import { BrnFieldA11yService } from '@spartan-ng/brain/field';
 * import {
 *   createAriaDescribedByBridge,
 *   createAriaDescribedBySignal,
 * } from '@ngx-signal-forms/toolkit/headless';
 *
 * @Component({
 *   selector: 'spartan-form-field[ngxSpartanFormField]',
 *   providers: [
 *     {
 *       provide: BrnFieldA11yService,
 *       useFactory: () => createAriaDescribedByBridge({
 *         toolkit: inject(SpartanFormField).toolkitAriaDescribedBy,
 *       }),
 *     },
 *   ],
 * })
 * export class SpartanFormField {
 *   readonly toolkitAriaDescribedBy = createAriaDescribedBySignal({ ... });
 * }
 * ```
 *
 * @public
 * @group ARIA Composition
 */
declare function createAriaDescribedByBridge(options: CreateAriaDescribedByBridgeOptions): AriaDescribedByBridge;

/**
 * Reactive reader for the resolved field name. Invoked inside the resulting
 * computed so signal-backed readers stay tracked. Returns `null` when no
 * field name has been resolved yet.
 *
 * @group ARIA Composition
 */
type AriaDescribedByFieldNameReader = () => string | null;
/**
 * Reader for non-managed `aria-describedby` IDs that should be preserved
 * verbatim (hints stamped by template, descriptions, etc.). Called per
 * computed evaluation so consumers re-evaluating their preserved list see
 * fresh values without re-creating the factory.
 *
 * @group ARIA Composition
 */
type AriaDescribedByPreservedIdsReader = () => string | null;
/**
 * Inputs for {@link createAriaDescribedBySignal}.
 *
 * `fieldState`, `hintIds`, and `visibility` are signals so the resulting
 * `aria-describedby` value tracks each of them reactively. `preservedIds`
 * and `fieldName` are plain readers so consumers can thread DOM reads or
 * service queries through without forcing them into a `Signal` shape.
 *
 * @group ARIA Composition
 */
interface CreateAriaDescribedBySignalOptions {
    /**
     * The bound `FieldState` (or `null` when no field is bound yet).
     * Drives error/warning detection on the same source of truth as the
     * sibling factories (`createAriaInvalidSignal`, `createAriaRequiredSignal`).
     */
    readonly fieldState: Signal<FieldState<unknown> | null>;
    /**
     * Hint IDs to append after the preserved list. Typically comes from
     * {@link createHintIdsSignal} but can be any signal of strings.
     */
    readonly hintIds: Signal<readonly string[]>;
    /**
     * Blocking-error visibility computed (typically from
     * `createErrorVisibility`). When `true`, the error ID is appended whenever
     * the field has a blocking error. When `false`, no error ID is appended
     * even if the field is invalid.
     */
    readonly visibility: Signal<boolean>;
    /**
     * Warning visibility computed, resolved through the **warning** cascade
     * (`warningStrategy` → form context → `defaultWarningStrategy` →
     * `'on-touch'`).
     *
     * Optional for backwards compatibility with callers written before the
     * two channels could diverge; omitting it falls back to {@link visibility},
     * which is correct only while both strategies agree. Pass it whenever the
     * renderer times its warning region independently, or a form with e.g.
     * `errorStrategy="on-submit"` and `warningStrategy="immediate"` will show
     * a warning that this attribute never references.
     */
    readonly warningVisibility?: Signal<boolean>;
    /**
     * Reader for non-managed IDs (e.g. existing hint IDs stamped into the
     * DOM by the template, or description IDs the wrapper has registered).
     * Called per computed evaluation; consumers re-evaluating their preserved
     * list see fresh values automatically.
     */
    readonly preservedIds: AriaDescribedByPreservedIdsReader;
    /**
     * Reader for the resolved field name. Without a field name no managed
     * error / warning IDs can be generated, so the factory falls back to
     * returning the preserved list verbatim.
     */
    readonly fieldName: AriaDescribedByFieldNameReader;
}
/**
 * Pure-signal factory that composes the `aria-describedby` attribute value
 * for a Signal Forms control.
 *
 * Mirrors the resolution previously inlined in
 * `NgxSignalFormAutoAria.ariaDescribedBy`:
 *
 * 1. Read the preserved (non-managed) ID list — these are IDs the toolkit
 *    does not own (template-stamped hints, descriptions, etc.).
 * 2. Append every hint ID from the supplied `hintIds` signal that is not
 *    already preserved. Hints are managed by the toolkit, but consumers
 *    may still preserve them when re-binding.
 * 3. When `visibility()` is `true` AND the field has at least one blocking
 *    error, append `generateErrorId(fieldName)`.
 * 4. When `warningVisibility()` (falling back to `visibility()`) is `true`
 *    AND the field has at least one warning error AND no blocking error is
 *    being shown, append `generateWarningId(fieldName)`.
 * 5. Deduplicate while preserving insertion order.
 * 6. Return the joined list, or `null` when nothing accumulated, so
 *    consumers can drop the attribute entirely.
 *
 * The factory is unconditional and contains no DI: the manual-mode opt-out
 * lives in the directive shell that wires this factory, not here. That
 * keeps the contract clean and the factory reusable from any composition
 * surface (custom wrappers built on Material, PrimeNG, Spartan, etc.).
 *
 * @public
 * @group ARIA Composition
 */
declare function createAriaDescribedBySignal(options: CreateAriaDescribedBySignalOptions): Signal<string | null>;

/**
 * Pure-signal factory that derives the `aria-invalid` ARIA attribute value
 * for a Signal Forms control.
 *
 * Returns one of:
 * - `'true'` — the control has at least one blocking error AND error
 *   visibility evaluates to `true` (per the configured display strategy).
 * - `'false'` — the control is reachable and visible, but is not currently
 *   announcing blocking errors, either because none exist or because error
 *   visibility currently evaluates to `false`.
 * - `null` — the field state is missing, OR the control is not currently
 *   laid out (collapsed `<details>`, `hidden`, `display: none`). Consumers
 *   should remove `aria-invalid` from the host element in this case so the
 *   attribute does not go stale on a hidden control.
 *
 * The factory is unconditional and contains no DI: callers thread DI-resolved
 * values (the visibility computed from `createErrorVisibility`, and an
 * optional `isControlVisible` predicate, typically from
 * `createControlVisibilitySignal()`, or from your own signal fed by
 * `isElementCssVisible()` in an `afterEveryRender` `earlyRead`) in as
 * inputs. The `'manual'` ARIA-mode opt-out lives in the directive shell that
 * wires this factory, not here.
 *
 * @param fieldState A signal returning the bound `FieldState`, or `null`
 *   when no field is bound yet.
 * @param visibility A signal that is `true` when errors should be visible
 *   under the active display strategy. Typically the result of
 *   `createErrorVisibility(fieldState)`.
 * @param isControlVisible Optional signal that is `false` when the control
 *   is collapsed/hidden from layout. When omitted, visibility is assumed.
 * @returns A computed signal with the resolved `aria-invalid` value.
 *
 * @example
 * ```typescript
 * const fieldState = computed(() => formField.state());
 * const visibility = createErrorVisibility(fieldState);
 * const ariaInvalid = createAriaInvalidSignal(fieldState, visibility);
 * ```
 *
 * @public
 * @group ARIA Composition
 */
declare function createAriaInvalidSignal(fieldState: Signal<FieldState<unknown> | null>, visibility: Signal<boolean>, isControlVisible?: Signal<boolean>): Signal<'true' | 'false' | null>;

/**
 * Minimal FieldState contract required for aria-required resolution.
 *
 * @group ARIA Composition
 */
type AriaRequiredFieldState = Pick<FieldState<unknown>, 'required'>;
/**
 * Pure signal factory that resolves the `aria-required` attribute value from
 * a reactive `FieldState`.
 *
 * Returns `'true'` when the field's `required()` signal is `true`, and `null`
 * otherwise (so the caller can drop the attribute entirely rather than
 * emitting `aria-required="false"`).
 *
 * The factory is unconditional — manual-mode opt-out lives in the directive
 * shell that consumes this factory, not here. That keeps the contract clean:
 * `fieldState in → ARIA out`.
 *
 * @param fieldState Reactive field state. `null` short-circuits to `null` so
 *   consumers don't have to inline the null branch at every call site.
 * @returns A computed `Signal<'true' | null>` driven by `fieldState().required()`.
 *
 * @example Compose inside a custom wrapper
 * ```typescript
 * const ariaRequired = createAriaRequiredSignal(
 *   computed(() => this.formField()?.()),
 * );
 * // ariaRequired() → 'true' | null
 * ```
 *
 * @public
 * @group ARIA Composition
 */
declare function createAriaRequiredSignal(fieldState: Signal<AriaRequiredFieldState | null>): Signal<'true' | null>;

/**
 * Reactive reader for the current field's name. Accepts a plain getter or a
 * `Signal<string | null>`; both are invoked inside the resulting computed so
 * signal-based readers stay tracked.
 *
 * @group ARIA Composition
 */
type HintIdsFieldNameReader = () => string | null;
/**
 * Public alias for the signal returned by {@link createHintIdsSignal}.
 *
 * Exposed so consumers composing custom wrappers can type their own
 * `aria-describedby` aggregators without re-deriving the shape.
 *
 * @group ARIA Composition
 */
type HintIdsSignal = Signal<readonly string[]>;
/**
 * Minimal structural surface the factory needs from a field-identity
 * service: a reactive, pre-filtered list of hint IDs for the current field.
 *
 * `hintIds` is nullable, and the two empty-ish states mean different things:
 *
 * - `null` — this identity has **never published** the hint channel. The
 *   factory falls through to the registry exactly as if no identity were
 *   present at all.
 * - `[]` — this identity published the channel and there are genuinely no
 *   hints. Authoritative; the registry is not consulted.
 *
 * Exposed as a public option type so consumers building bespoke wrappers can
 * type-import the factory's inputs without using package-internal imports.
 * Production code passes its `NgxFieldIdentity` instance in
 * directly via structural assignability.
 *
 * @group ARIA Composition
 */
interface HintIdsIdentityLike {
    readonly hintIds: Signal<readonly string[] | null>;
}
/**
 * Minimal structural surface the factory needs from a hint registry: a
 * reactive list of `{ id, fieldName }` descriptors.
 *
 * `fieldName` is `string | null`. `null` means the hint is unscoped and
 * applies to any field; a non-null value scopes the hint to the field whose
 * resolved name matches exactly (empty string included — empty string is
 * **not** treated as unscoped).
 *
 * Exposed as a public option type so consumers building bespoke wrappers can
 * type-import the factory's inputs without using package-internal imports.
 * Production code passes its `NgxSignalFormHintRegistry` instance
 * in directly via structural assignability.
 *
 * @group ARIA Composition
 */
interface HintIdsRegistryLike {
    readonly hints: Signal<readonly {
        readonly id: string;
        readonly fieldName: string | null;
    }[]>;
}
/**
 * Inputs for {@link createHintIdsSignal}.
 *
 * All three properties are optional — the factory must produce a stable
 * signal even when neither an identity service nor a registry is available,
 * matching the directive shell's "no wrapper context" branch.
 *
 * @group ARIA Composition
 */
interface CreateHintIdsSignalOptions {
    /**
     * Optional shared field-identity-like service (typically provided by a
     * form field wrapper). When it has **published** the hint channel — its
     * `hintIds()` returns a non-null array — that pre-filtered list is used
     * as-is and no registry filtering is performed. While it returns `null`
     * the channel is unclaimed and the registry fallback applies.
     */
    readonly identity?: HintIdsIdentityLike | null;
    /**
     * Optional hint-registry-like source exposing the un-filtered hint
     * descriptors. Used as a fallback whenever
     * {@link CreateHintIdsSignalOptions.identity} is absent *or* has not
     * published the hint channel. Hints are filtered to those whose
     * `fieldName` is `null` (unscoped — applies to any field) or matches the
     * resolved field name from {@link CreateHintIdsSignalOptions.fieldName}.
     */
    readonly registry?: HintIdsRegistryLike | null;
    /**
     * Optional reader for the resolved field name. Only consulted on the
     * registry-fallback path; ignored once an identity service has published
     * the hint channel. When omitted, the registry is read with a `null`
     * field name, so only hints whose own `fieldName` is `null` are kept.
     */
    readonly fieldName?: HintIdsFieldNameReader;
}
/**
 * Pure-signal factory that produces the `aria-describedby` hint-ID list for
 * a single field.
 *
 * Resolution is **per channel**, not per service: an identity that exists
 * but has not published its hints does not suppress the registry. Order:
 *
 * 1. If an identity service has published the hint channel (`hintIds()` is
 *    non-null), return that pre-filtered list verbatim — the wrapper has
 *    already correlated hints to this field. A published empty array is
 *    authoritative and stops resolution here.
 * 2. Otherwise, if a registry is provided, return the registry's hints
 *    filtered to those whose `fieldName` is `null` (unscoped) or matches
 *    the reader-supplied current field name. Empty-string `fieldName` is
 *    treated as a real, scoped value — it only matches when the current
 *    field name is also the empty string.
 * 3. Otherwise, return an empty list.
 *
 * No DI is performed inside the factory; consumers thread DI-resolved
 * values in via {@link CreateHintIdsSignalOptions}. This keeps the factory
 * testable without `TestBed` and reusable from any injection context.
 *
 * @public
 * @group ARIA Composition
 */
declare function createHintIdsSignal(options?: CreateHintIdsSignalOptions): HintIdsSignal;

type InjectionContextDebugFn = Function;
/**
 * Runs work in the current or supplied Angular injection context.
 *
 * This pattern is inspired by ngxtension's `assertInjector` utility.
 * @see https://github.com/ngxtension/ngxtension-platform
 *
 * @internal
 */
declare function assertInjector<Runner extends () => unknown>(fn: InjectionContextDebugFn, injector: Injector | undefined | null, runner: Runner): ReturnType<Runner>;

type Nullable<T> = T | null | undefined;
/**
 * Options for a cascading resolver.
 *
 * Tiers are evaluated in order: `input` → `context` → `configDefault` →
 * `fallback`. The first non-nullish value wins. `fallback` is always
 * non-nullish so the resolver never returns `undefined`.
 *
 * @internal
 */
interface StaticCascadingResolverOptions<T> {
    /** Highest-priority tier. Wins when non-nullish. */
    readonly input: Nullable<T>;
    /** Optional second tier (e.g. form context). Wins when `input` is nullish. */
    readonly context?: Nullable<T>;
    /**
     * Optional third tier (e.g. injected config default). Wins when `input` and
     * `context` are both nullish.
     */
    readonly configDefault?: Nullable<T>;
    /** Lowest-priority tier. Always non-nullish — the ultimate hardcoded default. */
    readonly fallback: T;
}
/**
 * Resolves a value from an ordered cascade of up to four tiers, using
 * nullish-only short-circuit semantics: `null` and `undefined` fall through;
 * any other value — including `''`, `0`, and `false` — wins.
 *
 * ## Tiers (highest to lowest priority)
 * 1. `input` — explicit consumer override
 * 2. `context` — form/component context injection (optional)
 * 3. `configDefault` — injected provider default (optional)
 * 4. `fallback` — hardcoded toolkit default (always non-nullish)
 *
 * @example Static cascade
 * ```typescript
 * const value = createCascadingResolver({
 *   input: userConfig.requiredMarker,      // '' → wins (preserves empty string)
 *   configDefault: parentConfig?.requiredMarker,
 *   fallback: DEFAULT_CONFIG.requiredMarker,
 * });
 * // value: string
 * ```
 *
 * @internal
 */
declare function createCascadingResolver<T>(opts: StaticCascadingResolverOptions<T>): T;

/**
 * Creates a `computed()` signal counting a character-count value's length:
 * `string.length` for strings, `array.length` for arrays, `0` for
 * `null`/`undefined` (treated as "empty"), and `0` — plus a one-shot dev-mode
 * `console.warn` — for anything else.
 *
 * Used internally by `createCharacterCount` for its own `currentLength`
 * signal, so every consumer of the factory (`NgxHeadlessCharacterCount`,
 * `NgxFormFieldCharacterCount`) gets the identical diagnostic instead of
 * re-deriving the length logic without it.
 *
 * @remarks Does not require an injection context (only creates a `computed()`
 * signal internally).
 *
 * @param value - Reader for the field's raw value. Called reactively on
 *   every recomputation — pass a tracked signal read (e.g. `() =>
 *   field()().value()`).
 * @param component - Name reported in the dev warning, e.g.
 *   `[ngx-signal-forms] <component>: unsupported value type — …`. Required
 *   rather than defaulted — every current caller passes its own name so the
 *   warning always points at the component the misconfiguration lives in.
 *
 * @internal
 */
declare function createCharacterCountLengthSignal(value: () => unknown, component: string): Signal<number>;

/**
 * Minimal FieldState contract required for error visibility decisions.
 */
type ErrorVisibilityState = Pick<FieldState<unknown>, 'invalid' | 'touched'>;
/**
 * Minimal FieldState contract required for warning visibility decisions.
 *
 * Reads `errors` rather than `invalid` because warnings are non-blocking:
 * the warning channel gates on warning *presence* (`warn:` kinds), while a
 * field that is invalid for a blocking reason has nothing to say here.
 */
type WarningVisibilityState = Pick<FieldState<unknown>, 'errors' | 'touched'>;
/**
 * Minimal FieldState contract required for reading direct errors
 * plus visibility state.
 */
type ErrorReadableState = Pick<FieldState<unknown>, 'errors' | 'invalid' | 'touched'>;

/**
 * Options for {@link createErrorVisibility}.
 *
 * Both `strategy` and `submittedStatus` are optional:
 * - Omit `strategy` to inherit from form context (via DI), then
 *   `opts.configDefault` (when supplied), then fall back to `'on-touch'`.
 * - Pass a static value to hard-code the behaviour at the call site.
 * - Pass a signal to allow the behaviour to change reactively.
 */
interface CreateErrorVisibilityOptions {
    /**
     * Error display strategy override.
     *
     * - Static `ErrorDisplayStrategy` — value is read on every computed
     *   evaluation but is stable, so the result does not change.
     * - `Signal<ErrorDisplayStrategy | undefined>` — tracked reactively.
     * - `undefined` / omitted — inherits from form context, then falls back to
     *   `opts.configDefault` (when supplied), then `'on-touch'`.
     */
    readonly strategy?: ErrorDisplayStrategy | Signal<ErrorDisplayStrategy | undefined> | undefined;
    /**
     * Explicit submission status.
     *
     * Only needed when using `'on-submit'` strategy without a parent
     * `[ngxSignalForm]` context that already supplies it. Accepts a static
     * value or a reactive signal.
     */
    readonly submittedStatus?: SubmittedStatus | Signal<SubmittedStatus | undefined> | undefined;
    /**
     * Fallback strategy consulted when both `strategy` and the ambient form
     * context resolve to nothing (i.e. no `[ngxSignalForm]` host is present).
     * Typically the caller's own `NGX_SIGNAL_FORMS_CONFIG.defaultErrorStrategy`.
     *
     * Deliberately opt-in rather than auto-injected, so this generic
     * primitive does not read the global config behind a caller's back.
     * Callers that must match the visible message when no form context
     * exists (`NgxSignalFormAutoAria`, the headless package's standalone
     * factories) inject the config themselves and pass it through here.
     */
    readonly configDefault?: ResolvedErrorDisplayStrategy | null;
    /**
     * Optional injector for use outside an Angular injection context (e.g.
     * unit tests, `runInInjectionContext` wrappers). When omitted the function
     * must be called inside a DI context.
     */
    readonly injector?: Injector;
}
/**
 * One-shot factory for error-visibility wiring.
 *
 * It replaces a four-step manual composition: resolve the strategy, resolve
 * the submission status, evaluate the timing predicate, and expose the
 * result as a computed. Every in-tree consumer now calls this factory instead
 * of inlining those steps (ADR-0006): `NgxHeadlessErrorState`,
 * `NgxHeadlessFieldset`, `createErrorState()`, `NgxFormFieldWrapper`,
 * `NgxSignalFormAutoAria`, `createAriaInvalidSignal`,
 * `createErrorMessageSignal()`, and `NgxHeadlessErrorSummary`.
 *
 * ## What it does
 *
 * 1. Reads the nearest `[ngxSignalForm]` context via `inject()` (optional).
 * 2. Resolves the error display strategy: explicit opt → context →
 *    `opts.configDefault` (when supplied) → `'on-touch'`.
 * 3. Resolves the submission status: explicit opt → context → `undefined`.
 * 4. Evaluates the visibility timing predicate and returns a reactive
 *    `Signal<boolean>`.
 *
 * This is the single composition point for the visibility cascade. It owns
 * the reactive computed. It also owns the dev-mode warning for a missing
 * submission status. The shared pure predicate evaluates the strategy.
 *
 * ## When to use
 *
 * Use `createErrorVisibility` as the public entry point for consumer-side
 * error visibility wiring. The lower-level resolution and predicate helpers
 * are internal toolkit building blocks exposed only through the hidden,
 * build-time `/core` entry point.
 *
 * ## When NOT to use
 *
 * Do not import the lower-level helpers from `/core`; that entry point is not
 * published. For custom timing, compute `strategy` and `submittedStatus` in
 * your own signals and pass them in the options. To show errors from your own
 * rule, such as a "show after the user clicks Validate" flag, use that
 * signal directly instead of this factory.
 *
 * @param field Reactive or static field state. `null`/`undefined` values
 *   short-circuit the result to `false` — this is handled by the visibility
 *   computation inside this factory.
 * @param opts Optional overrides; all properties are optional.
 * @returns A computed `Signal<boolean>` that is `true` when the strategy says
 *   errors should be visible.
 *
 * @example Inside a component (auto-consumes form context via DI)
 * ```typescript
 * @Component({ ... })
 * export class MyFieldComponent {
 *   readonly formField = input.required<FieldTree<string>>();
 *
 *   // Reads strategy + submission status from the nearest [ngxSignalForm] context.
 *   readonly showErrors = createErrorVisibility(
 *     computed(() => this.formField()()),
 *   );
 * }
 * ```
 *
 * @example With an explicit strategy override
 * ```typescript
 * readonly showErrors = createErrorVisibility(
 *   computed(() => this.formField()()),
 *   { strategy: 'immediate' },
 * );
 * ```
 *
 * @example With a reactive strategy signal
 * ```typescript
 * readonly strategy = input<ErrorDisplayStrategy>('on-touch');
 *
 * readonly showErrors = createErrorVisibility(
 *   computed(() => this.formField()()),
 *   { strategy: this.strategy },
 * );
 * ```
 *
 * @example Outside DI (tests / standalone utilities)
 * ```typescript
 * const showErrors = createErrorVisibility(fieldState, {
 *   strategy: 'on-touch',
 *   injector: TestBed.inject(Injector),
 * });
 * ```
 *
 * @see {@link resolveStrategyFromContext} Building block: strategy cascade
 * @see {@link resolveSubmittedStatusFromContext} Building block: submitted-status cascade
 * @see {@link shouldShowErrors} Building block: pure boolean evaluation
 *
 * @public
 */
declare function createErrorVisibility(field: NgxReactiveOrStatic<Partial<ErrorVisibilityState> | null | undefined>, opts?: CreateErrorVisibilityOptions): Signal<boolean>;

/**
 * The part of a `FieldState` that {@link createFieldPresentation} reads.
 *
 * Every member is optional, so custom controls and tests can pass a partial
 * state. `hidden` is only read when the `hidden` option is omitted.
 *
 * @public
 */
type FieldPresentationState = Partial<Pick<FieldState<unknown>, 'errors' | 'hidden' | 'invalid' | 'touched'>>;
/**
 * Options for {@link createFieldPresentation}. All are optional.
 *
 * @public
 */
interface CreateFieldPresentationOptions {
    /**
     * Field-level error display strategy. `null`, `undefined` and `'inherit'`
     * defer to the form context, then to
     * `NGX_SIGNAL_FORMS_CONFIG.defaultErrorStrategy`, then to `'on-touch'`.
     */
    readonly strategy?: NgxSignalLike<ErrorDisplayStrategy | null | undefined>;
    /**
     * Field-level warning display strategy. It resolves through its own
     * cascade and never reads the error strategy (ADR-0007): form context
     * `warningStrategy()`, then `defaultWarningStrategy`, then `'on-touch'`.
     */
    readonly warningStrategy?: NgxSignalLike<WarningDisplayStrategy | null | undefined>;
    /**
     * Whether the field is hidden. A hidden field shows no messages. When
     * omitted, the factory reads the field state's own `hidden()`.
     */
    readonly hidden?: NgxSignalLike<boolean>;
    /**
     * The field identity to publish the resolved strategies to (ADR-0010).
     * `NgxSignalFormAutoAria` reads them, so `aria-describedby` follows the
     * same field-level overrides as the rendered message regions. Leave it
     * out when your wrapper does not provide an `NgxFieldIdentity`.
     */
    readonly identity?: NgxFieldIdentity | null;
    /**
     * Injector for calls outside an injection context, for example in tests.
     */
    readonly injector?: Injector;
}
/**
 * The error and warning presentation state of one field surface. Every
 * member is a read-only signal.
 *
 * @public
 */
interface FieldPresentation {
    /** The field's own blocking errors (warnings excluded). */
    readonly errors: Signal<readonly ValidationError[]>;
    /** The field's own warnings (`warn:` kinds). */
    readonly warnings: Signal<readonly ValidationError[]>;
    /** Whether the field has at least one blocking error. */
    readonly hasErrors: Signal<boolean>;
    /** Whether the field has at least one warning. */
    readonly hasWarnings: Signal<boolean>;
    /**
     * Whether blocking errors show now: the field has one, the error strategy
     * allows it, and the field is not hidden. Use it for the invalid styling
     * and the error region.
     */
    readonly showErrors: Signal<boolean>;
    /**
     * Whether warnings show now: the field has one, the warning strategy
     * allows it, the field is not hidden, and no blocking error shows. A
     * warning-only field never suppresses its own warning.
     */
    readonly showWarnings: Signal<boolean>;
    /**
     * Whether to mount the message renderer. It opens when warnings show, or
     * when the error strategy allows messages on a field that has any. The
     * renderer then decides which messages to print.
     */
    readonly renderMessageSlot: Signal<boolean>;
    /** The fully resolved error display strategy. */
    readonly effectiveStrategy: Signal<ResolvedErrorDisplayStrategy>;
    /** The fully resolved warning display strategy. */
    readonly effectiveWarningStrategy: Signal<ResolvedWarningDisplayStrategy>;
}
/**
 * Builds the error and warning presentation state of one field surface.
 *
 * Use it in a custom form-field wrapper. It is the state
 * `NgxFormFieldWrapper` uses, so a custom wrapper shows messages at the
 * same moments as the built-in one.
 *
 * It composes the two cascade seams: `createErrorVisibility()` (ADR-0006)
 * for blocking errors and `createWarningVisibility()` (ADR-0007) for
 * warnings. Each strategy resolves through its own cascade. A visible
 * blocking error hides the warning. A warning alone makes the field
 * `invalid()` to Angular, so the suppression checks for a visible
 * *blocking* error, not for `invalid()`.
 *
 * With an `identity`, the factory publishes both resolved strategies to it
 * in an effect (ADR-0010).
 *
 * Call it in an injection context, or pass `injector`.
 *
 * @param field The field state, as a signal, a getter or a static value.
 *   `null` and `undefined` show nothing.
 * @param options Field-level overrides. All are optional.
 * @returns The presentation state as read-only signals.
 *
 * @example A custom wrapper
 * ```typescript
 * @Component({
 *   selector: 'app-form-field',
 *   hostDirectives: [
 *     { directive: NgxFieldIdentityProvider, inputs: ['fieldName'] },
 *   ],
 *   host: { '[class.app-form-field--invalid]': 'presentation.showErrors()' },
 *   template: `
 *     <ng-content />
 *     @if (presentation.renderMessageSlot()) {
 *       <ngx-form-field-error
 *         [formField]="formField()"
 *         [strategy]="presentation.effectiveStrategy()"
 *         [warningStrategy]="presentation.effectiveWarningStrategy()"
 *       />
 *     }
 *   `,
 * })
 * export class AppFormField {
 *   readonly formField = input.required<FieldTree<unknown>>();
 *   readonly strategy = input<ErrorDisplayStrategy | null>(null);
 *
 *   protected readonly presentation = createFieldPresentation(
 *     computed(() => this.formField()()),
 *     { strategy: this.strategy, identity: inject(NgxFieldIdentity) },
 *   );
 * }
 * ```
 *
 * @see {@link createErrorVisibility} The blocking-error seam
 * @see {@link createWarningVisibility} The warning seam
 *
 * @group Reactive Primitives
 *
 * @public
 */
declare function createFieldPresentation(field: NgxReactiveOrStatic<FieldPresentationState | null | undefined>, options?: CreateFieldPresentationOptions): FieldPresentation;

/**
 * Options for {@link createWarningVisibility}.
 *
 * Mirrors `CreateErrorVisibilityOptions` tier for tier, with two additions
 * the warning channel needs: a presence override for surfaces that aggregate
 * warnings from elsewhere, and the blocking-error visibility that suppresses
 * the warning region (ADR-0007).
 */
interface CreateWarningVisibilityOptions {
    /**
     * Warning display strategy override.
     *
     * - Static `WarningDisplayStrategy` — read on every evaluation but stable.
     * - `Signal<WarningDisplayStrategy | undefined>` — tracked reactively.
     * - `undefined` / omitted — inherits from the form context's
     *   `warningStrategy()`, then `opts.configDefault`, then `'on-touch'`.
     *
     * No tier reaches into the error channel (ADR-0007).
     */
    readonly strategy?: WarningDisplayStrategy | Signal<WarningDisplayStrategy | undefined> | undefined;
    /**
     * Explicit submission status. Only needed for the `'on-submit'` strategy
     * without a parent `[ngxSignalForm]` context that already supplies it.
     */
    readonly submittedStatus?: SubmittedStatus | Signal<SubmittedStatus | undefined> | undefined;
    /**
     * Fallback strategy consulted when both `strategy` and the ambient form
     * context resolve to nothing. Typically the caller's own
     * `NGX_SIGNAL_FORMS_CONFIG.defaultWarningStrategy`. Opt-in for the same
     * reason as the error seam's `configDefault`: most callers run inside a
     * form context and never observe the difference.
     */
    readonly configDefault?: ResolvedWarningDisplayStrategy | null;
    /**
     * Warning-presence override.
     *
     * By default presence is read from the field state's own `errors()` —
     * any error whose `kind` starts with `warn:`. Surfaces that collect
     * warnings from somewhere else pass their own presence signal, or `true`
     * when they apply the presence gate downstream. `NgxHeadlessFieldset` is
     * the second case: its warnings live on member fields rather than on the
     * fieldset's own `errors()`, and `createFieldsetAggregation` already
     * returns `showWarnings() && hasWarnings()`.
     */
    readonly hasWarnings?: NgxReactiveOrStatic<boolean>;
    /**
     * Whether a blocking error is currently visible on the **same field**.
     * While it reads `true` the warning stays hidden: errors and warnings are
     * never shown together, so a warning only ever appears on a field whose
     * value is currently acceptable (ADR-0007).
     *
     * Omitted means "no blocking error competes for this region". Aggregate
     * surfaces (`NgxHeadlessFieldset`, `NgxHeadlessErrorSummary`) leave it
     * omitted on purpose — they span a subtree, and a blocking error on one
     * member field must not silence a warning on a sibling.
     */
    readonly errorVisibility?: NgxReactiveOrStatic<boolean>;
    /**
     * Optional injector for use outside an Angular injection context (e.g.
     * unit tests, `runInInjectionContext` wrappers).
     */
    readonly injector?: Injector;
}
/**
 * One-shot factory for warning-visibility wiring — the warning channel's
 * counterpart to `createErrorVisibility()` (ADR-0006's one cascade seam,
 * ADR-0007's independent warning cascade).
 *
 * ## What it does
 *
 * 1. Reads the nearest `[ngxSignalForm]` context via `inject()` (optional).
 * 2. Resolves the warning display strategy: explicit opt → context
 *    `warningStrategy()` → `opts.configDefault` → `'on-touch'`.
 * 3. Resolves the submission status: explicit opt → context → `'unsubmitted'`.
 * 4. Applies the **presence** rule — warnings gate on `warn:` errors being
 *    present, not on `invalid()`, because a warning never makes a field
 *    invalid on its own.
 * 5. Applies the **suppression** rule — a visible blocking error on the same
 *    field hides the warning (`opts.errorVisibility`).
 *
 * ## When NOT to use
 *
 * Reach for `resolveWarningStrategyFromContext()` + `shouldShowWarnings()`
 * from `@ngx-signal-forms/toolkit/core` (toolkit-internal) when a surface needs
 * the resolved strategy as public API, or composes the presence check into a
 * larger pipeline of its own.
 *
 * @param field Reactive or static field state. Nullish values short-circuit
 *   the result to `false`.
 * @param opts Optional overrides; all properties are optional.
 * @returns A computed `Signal<boolean>` that is `true` when the warning
 *   region should be shown.
 *
 * @example Inside a component (auto-consumes form context via DI)
 * ```typescript
 * readonly showWarnings = createWarningVisibility(
 *   computed(() => this.formField()()),
 * );
 * ```
 *
 * @example Per-field surface, with blocking errors taking precedence
 * ```typescript
 * readonly showWarnings = createWarningVisibility(this.fieldState, {
 *   strategy: this.warningStrategy,
 *   configDefault: this.config.defaultWarningStrategy,
 *   errorVisibility: this.errorsVisible,
 * });
 * ```
 *
 * @see {@link createErrorVisibility} The blocking-error counterpart
 * @see {@link resolveWarningStrategyFromContext} Building block: warning cascade
 * @see {@link shouldShowWarnings} Building block: pure boolean evaluation
 *
 * @group Reactive Primitives
 *
 * @public
 */
declare function createWarningVisibility(field: NgxReactiveOrStatic<Partial<WarningVisibilityState> | null | undefined>, opts?: CreateWarningVisibilityOptions): Signal<boolean>;

/**
 * Reactive reader of the bound control's host element. Returns `null` when
 * no control has been projected (or queried) yet. Typically a `computed`
 * over `contentChildren(NgxSignalFormControl)`.
 *
 * @public
 * @group ARIA Composition
 */
type BoundControlElementReader = () => HTMLElement | null;
/**
 * Optional reader for a label's `for=` attribute. Useful for design systems
 * that ship labelable directives separate from native `<label for=…>`
 * (Spartan's `BrnLabel`, for instance).
 *
 * @public
 * @group ARIA Composition
 */
type LabelForReader = () => string | null;
/**
 * Inputs for {@link createFieldNameResolver}.
 *
 * @public
 * @group ARIA Composition
 */
interface CreateFieldNameResolverOptions {
    /**
     * Explicit consumer-supplied field name (typically a wrapper input).
     * Returns `undefined` when the consumer hasn't bound a value.
     */
    readonly explicit: Signal<string | undefined>;
    /**
     * Reader for the bound control's host element. Used to surface the
     * `id` attribute as the third-tier fallback. Returns `null` when no
     * bound control has been projected yet.
     */
    readonly boundControl: BoundControlElementReader;
    /**
     * Optional reader for a projected label's `for=` attribute. When present
     * AND the explicit name is empty, the resolver falls back to this value
     * before consulting the bound control's `id`. When omitted, the resolver
     * skips this tier.
     */
    readonly labelFor?: LabelForReader;
    /**
     * Identifier used in the dev-mode warning ("[<name>] could not resolve
     * a deterministic field name…"). Typically the wrapper component name
     * (e.g. `'spartan-form-field'` or `'mat-form-field'`).
     */
    readonly wrapperName: string;
}
/**
 * Pure-signal factory that resolves a deterministic `fieldName` for a
 * form-field wrapper. Mirrors the priority cascade in the canonical
 * `NgxFormFieldWrapper`:
 *
 *   1. Explicit consumer input (trimmed; non-empty).
 *   2. Optional label `for=` attribute reader (same trim rule).
 *   3. Bound control's `id` attribute (same trim rule).
 *   4. `null` (auto-ARIA gracefully no-ops; emits a one-shot dev warning).
 *
 * The resolved name is raw — trimmed, but not sanitized for inner
 * whitespace — matching {@link resolveFieldNameFromCandidates}. Whoever
 * turns this into an `id` (`generateErrorId` and friends) sanitizes at
 * that point instead; see `sanitizeFieldNameForId`.
 *
 * The dev-mode warning latches on the first miss and stays silent for
 * every subsequent recomputation (hit or miss) for the resolver's
 * lifetime, so it never spams.
 *
 * @example Spartan wrapper (uses tier-3 only, skips label `for=` tier)
 * ```ts
 * readonly resolvedFieldName = createFieldNameResolver({
 *   explicit: this.fieldName,
 *   labelFor: () => this.projectedLabels()[0]?.for() ?? null,
 *   boundControl: () => this.boundSemantics()[0]?.elementRef.nativeElement ?? null,
 *   wrapperName: 'spartan-form-field',
 * });
 * ```
 *
 * @public
 * @group ARIA Composition
 */
declare function createFieldNameResolver(options: CreateFieldNameResolverOptions): Signal<string | null>;

/**
 * Per-injector counter used by {@link createUniqueId} to mint stable,
 * monotonically increasing ids for ARIA wiring (`aria-describedby`,
 * `aria-labelledby`, hint/error wiring).
 *
 * ## Why a service instead of a module-scoped counter?
 *
 * A module-scoped `let counter = 0` is shared across every Angular injector
 * that loads the module — including the server and the browser during SSR,
 * and every SSR request in a long-running Node process. That causes two
 * problems:
 *
 * 1. **Hydration mismatches**. Server-rendered HTML ships `hint-1`, `hint-2`,
 *    …; the browser bundle then re-evaluates the same directives from a
 *    non-zero counter (module-level state persists), so the `id` /
 *    `aria-describedby` pair never matches the server output.
 * 2. **Test pollution**. Each test's counter state leaks into the next,
 *    making assertions on concrete ids brittle.
 *
 * Scoping the counter to the root `EnvironmentInjector` — one per platform,
 * one per SSR request — means the server and the browser each start at the
 * same value (1) and walk through directives in the same order during
 * hydration, producing matching ids on both sides. Tests that create fresh
 * `TestBed` injectors likewise get a fresh counter.
 *
 * This is the same pattern Angular uses internally for `_IdGenerator`, which
 * we deliberately don't import because it is `@internal` and not part of
 * the public Angular API.
 *
 * @internal
 */
declare class NgxSignalFormIdCounter {
    #private;
    /**
     * Returns the next id for `prefix`, starting at `1` on a fresh injector.
     */
    next(prefix: string): string;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<NgxSignalFormIdCounter, never>;
    static ɵprov: _angular_core.ɵɵInjectableDeclaration<any>;
}
/**
 * Mints a stable, per-injector unique id for ARIA wiring.
 *
 * **SSR guarantees**: when called from an Angular injection context (the
 * usage pattern every toolkit caller follows — class-field initializers,
 * constructors, provider factories), ids are minted by a service scoped to
 * the current `EnvironmentInjector`. The server and the browser each own a
 * distinct root injector during hydration, so both platforms start the
 * counter at `1` and — because directives evaluate in the same order on
 * both sides — emit the same id sequence. That eliminates the hydration
 * mismatches a module-scoped counter would cause.
 *
 * **Outside an injection context**: the function falls back to a
 * module-scoped counter. This branch exists for unit tests and utility-style
 * usage; it is NOT SSR-safe and a dev-mode warning is emitted the first
 * time it is hit. Real components/directives should keep calling this from
 * class-field initializers, `constructor`, or provider factories — the
 * injection-context path is unchanged for them.
 *
 * @param prefix - Short tag prepended to the generated id (e.g. `'hint'`,
 *   `'fieldset'`).
 * @returns A string of the form `${prefix}-${n}` where `n` is
 *   monotonically increasing per injector (or per module, in the fallback
 *   branch).
 *
 * @example Inside a component (SSR-safe)
 * ```typescript
 * @Component({ ... })
 * export class NgxFormFieldHint {
 *   readonly #generatedId = createUniqueId('hint');
 * }
 * ```
 *
 * @public
 * @group Utility Functions
 */
declare function createUniqueId(prefix: string): string;

interface ResolvedNgxSignalFormControlSemantics {
    readonly kind: NgxSignalFormControlKind | null;
    readonly layout: NgxSignalFormControlLayout | null;
    readonly ariaMode: NgxSignalFormControlAriaMode | null;
}
/**
 * Canonical list of supported control kinds, derived from the default preset
 * registry's keys. Deriving (rather than re-listing) closes the historical
 * "advisory `satisfies`" gap: TypeScript's `Record<NgxSignalFormControlKind,
 * NgxSignalFormControlPreset>` already enforces exhaustiveness on the registry
 * itself, so any kind missing from the registry is a compile error — and this
 * derived list inherits that guarantee. Adding a new kind now requires only
 * three coupled updates (the union, the registry, and the wrapper capability
 * table) instead of four.
 *
 * Used by dev-mode diagnostics (e.g. the preset-provider warning) so the
 * runtime list never drifts from the type.
 *
 * @internal
 */
declare const NGX_SIGNAL_FORM_CONTROL_KIND_VALUES: readonly NgxSignalFormControlKind[];
/**
 * Checks whether a raw attribute value is one of the supported control kinds.
 *
 * This narrow guard is shared by both the directive and DOM-reading utilities
 * so explicit semantics declared in markup are validated in one place instead
 * of duplicating string comparisons across the toolkit.
 *
 * @param value Raw DOM attribute or directive input value to validate.
 * @returns True when the value matches a supported control kind.
 */
declare function isNgxSignalFormControlKind(value: string | null | undefined): value is NgxSignalFormControlKind;
/**
 * Checks whether a raw attribute value is one of the supported wrapper layouts.
 *
 * Keeping layout validation centralized ensures wrapper metadata and directive
 * inputs stay aligned even if the set of supported layouts grows later.
 *
 * @param value Raw DOM attribute or directive input value to validate.
 * @returns True when the value matches a supported wrapper layout.
 */
declare function isNgxSignalFormControlLayout(value: string | null | undefined): value is NgxSignalFormControlLayout;
/**
 * Checks whether a raw attribute value is one of the supported ARIA modes.
 *
 * This exists so callers can safely treat DOM attributes as typed semantics
 * without trusting arbitrary string values rendered by user markup.
 *
 * @param value Raw DOM attribute or directive input value to validate.
 * @returns True when the value matches a supported ARIA ownership mode.
 */
declare function isNgxSignalFormControlAriaMode(value: string | null | undefined): value is NgxSignalFormControlAriaMode;
/**
 * Reads explicit control semantics from the stable `data-ngx-signal-form-*`
 * attributes written by `NgxSignalFormControl`.
 *
 * The wrapper layer uses this to read projected-control semantics from the DOM
 * instead of injecting the directive directly, so projected controls, custom
 * elements, and plain DOM lookups all share the same transport format.
 *
 * Note: the auto-ARIA directive reads semantics via Angular DI
 * (`inject(NgxSignalFormControl)`) rather than this function.
 *
 * @param element Rendered control host to inspect.
 * @returns The explicit semantics declared on the host, or an empty object.
 */
declare function readNgxSignalFormControlSemantics(element: HTMLElement | null): NgxSignalFormControlSemantics;
/**
 * Infers a semantic control kind from the rendered element shape when no
 * explicit semantics were declared.
 *
 * This fallback preserves backwards compatibility for existing wrapper usage
 * while still allowing explicit semantics to override heuristic guesses when a
 * custom control needs deterministic behavior.
 *
 * @param element Rendered control host to inspect.
 * @returns The inferred control kind, or `null` when no safe heuristic exists.
 */
declare function inferNgxSignalFormControlKind(element: HTMLElement | null): NgxSignalFormControlKind | null;
/**
 * Resolves the final control semantics for a rendered control element.
 *
 * Resolution intentionally happens in three layers:
 * 1. explicit semantics from DOM attributes
 * 2. heuristic kind inference for backwards compatibility
 * 3. preset defaults for layout and ARIA mode
 *
 * This ordering keeps explicit consumer intent authoritative while still
 * providing sensible defaults for older markup and built-in control families.
 *
 * @param element Rendered control host to inspect.
 * @param presets Preset registry used for layout and ARIA fallback values.
 * @returns Fully resolved semantics used by wrapper and auto-ARIA logic.
 */
declare function resolveNgxSignalFormControlSemantics(element: HTMLElement | null, presets: NgxSignalFormControlPresetRegistry): ResolvedNgxSignalFormControlSemantics;

/**
 * Platform-safe type guards for the `HTMLElement` constructor family.
 *
 * `value instanceof HTMLElement` throws a `ReferenceError` wherever the DOM
 * constructors are not global — a Node render pass (`@angular/platform-server`,
 * Angular's own SSR pipeline), a Node unit test, or any worker context. Every
 * toolkit call site runs inside a render/DOM-read phase that a server pass is
 * *supposed* to skip, but a partial mock, a custom wrapper, or a consumer that
 * calls a utility directly can still reach one on the server. These guards keep
 * such a call a `false` instead of a crash.
 *
 * In a browser the guards are exactly the `instanceof` checks they replace. Off
 * the DOM they fall back to a structural check (`nodeType === 1` plus the
 * expected `tagName`), which is what a server-side element double provides.
 *
 * @internal
 */
/**
 * Whether `value` is an `HTMLElement`.
 *
 * @internal
 */
declare function isHtmlElement(value: unknown): value is HTMLElement;
/**
 * Whether `value` is an `<input>` element.
 *
 * @internal
 */
declare function isHtmlInputElement(value: unknown): value is HTMLInputElement;
/**
 * Whether `value` is a `<textarea>` element.
 *
 * @internal
 */
declare function isHtmlTextAreaElement(value: unknown): value is HTMLTextAreaElement;
/**
 * Whether `value` is a `<select>` element.
 *
 * @internal
 */
declare function isHtmlSelectElement(value: unknown): value is HTMLSelectElement;
/**
 * Whether `value` is a `<button>` element.
 *
 * @internal
 */
declare function isHtmlButtonElement(value: unknown): value is HTMLButtonElement;

/**
 * The supported `appearance` literals, in the order they should be listed in
 * dev-mode diagnostics. Shared with {@link resolveUnionInput} call sites so
 * the runtime membership check and the `appearance` type can't drift apart.
 *
 * @internal
 */
declare const FORM_FIELD_APPEARANCE_VALUES: readonly ["standard", "outline", "plain"];
/**
 * The supported `orientation` literals, in the order they should be listed
 * in dev-mode diagnostics. Shared with {@link resolveUnionInput} call sites
 * so the runtime membership check and the `orientation` type can't drift apart.
 *
 * @internal
 */
declare const FORM_FIELD_ORIENTATION_VALUES: readonly ["vertical", "horizontal"];

/**
 * Determines if errors should be shown immediately without creating a reactive signal.
 *
 * ## What does it do?
 * Performs a synchronous check to determine if form field errors should be displayed,
 * without the overhead of creating a computed signal. This is a lightweight helper
 * for non-reactive scenarios or one-time checks.
 *
 * ## When to use it?
 * Use `shouldShowErrors()` when you need to:
 * - Check error visibility in imperative code (event handlers, functions)
 * - Perform one-time validation checks without reactivity
 * - Implement custom logic that doesn't need automatic updates
 * - Reduce memory overhead when reactivity isn't needed
 *
 * **Use {@link createErrorVisibility} instead when you need reactive updates.**
 *
 * ## Strategy contract
 * This helper accepts a {@link ResolvedErrorDisplayStrategy} — the `'inherit'`
 * value from `ErrorDisplayStrategy` is a user-facing input that must be
 * resolved to a concrete strategy (`'immediate' | 'on-touch' | 'on-submit'`)
 * before calling this function. Route user input through
 * {@link resolveStrategyFromContext} first. Reactive surfaces should use
 * {@link createErrorVisibility},
 * which accepts the wider `ErrorDisplayStrategy` and resolves `'inherit'`
 * internally.
 *
 * ## How does it work?
 * 1. Accepts unwrapped (static) field state, strategy, and submission status
 * 2. Converts `submittedStatus` to boolean (`!== 'unsubmitted'`)
 * 3. Immediately evaluates the strategy logic
 * 4. Returns a boolean result without creating signals or subscriptions
 *
 * @param isInvalid - Whether the field is currently invalid
 * @param isTouched - Whether the field has been touched (blurred)
 * @param strategy - The resolved error display strategy (no `'inherit'`)
 * @param submittedStatus - Angular's submission status
 * @returns `true` if errors should be displayed
 *
 * @example Imperative validation check
 * ```typescript
 * function handleSave() {
 *   const field = form.email();
 *   const status: SubmittedStatus = form().submitting()
 *     ? 'submitting'
 *     : form().touched()
 *       ? 'submitted'
 *       : 'unsubmitted';
 *   const visible = shouldShowErrors(field.invalid(), field.touched(), 'on-touch', status);
 *
 *   if (visible) {
 *     displayErrors(field.errors());
 *   }
 * }
 * ```
 *
 * @see {@link createErrorVisibility} For the reactive visibility factory
 * @see {@link ResolvedErrorDisplayStrategy} For the resolved strategy union
 * @see {@link resolveStrategyFromContext} To resolve `'inherit'` before calling this
 *
 * @internal
 */
declare function shouldShowErrors(isInvalid: boolean, isTouched: boolean, strategy: ResolvedErrorDisplayStrategy, submittedStatus: SubmittedStatus): boolean;
/**
 * Determines if warnings should be shown based on warning strategy.
 *
 * Unlike `shouldShowErrors`, this gates on the presence of warnings rather
 * than on `invalid()`. Angular offers no separate non-invalidating channel:
 * a `warn:`-prefixed `ValidationError` comes out of the same validator
 * pipeline and marks the field `invalid()` like any other, so `invalid()`
 * cannot tell the two apart. The toolkit splits on `kind` instead
 * (`splitByKind()` / `isWarningError()`). Warnings are non-blocking in the
 * sense the toolkit defines — they never gate submission, and they are
 * timed by their own cascade (ADR-0007).
 */
declare function shouldShowWarnings(hasWarnings: boolean, isTouched: boolean, strategy: ResolvedWarningDisplayStrategy, submittedStatus: SubmittedStatus): boolean;

/**
 * Predicates for Angular Signal Forms `FieldState` interactivity used across
 * focus management, error summaries, and wrapper rendering so every surface
 * asks the same "can the user interact with this field?" question.
 *
 * ## Consistency rules
 *
 * - `hidden()` → non-interactive. Angular documents that hidden fields must
 *   be removed from the DOM via `@if`; we treat a rendered hidden field as a
 *   consumer mistake and refuse to focus/surface its errors defensively.
 * - `disabled()` → non-interactive. Angular excludes disabled fields from
 *   validation entirely, so in practice `errors().length === 0` usually
 *   short-circuits before these helpers run, but we check anyway.
 * - `readonly()` → **interactive**. The field is visible and focusable and
 *   its errors remain meaningful; only editing is suppressed.
 *
 * ## Why `isFieldStateInteractive` stays duck-typed
 *
 * Its callers bridge from a bare `ValidationError` whose `fieldTree()` result
 * is typed as `FieldState<unknown>` but, in tests and at framework
 * boundaries, may be a partial shape without every signal. Angular 22's
 * stable `FieldState` guarantees the signals on real field states, but this
 * bridge helper still needs to tolerate the partial case so it defaults to
 * "interactive" when a signal is missing — nothing is silently hidden from
 * screen readers.
 *
 * {@link isFieldStateHidden} is the opposite: it has exactly one caller (the
 * form-field wrapper) that passes a fully-typed `FieldState`, so it uses a
 * structural `Pick` and relies on compile-time guarantees rather than
 * runtime probes.
 *
 * @public
 */
declare function isFieldStateInteractive(fieldState: object): boolean;
/**
 * Reads `hidden()` from a real `FieldState`.
 *
 * The wrapper component uses this (not the broader interactivity predicate)
 * because it only wants to set `[attr.hidden]` when the *field* is hidden —
 * disabling a visible field should not mark the wrapper hidden.
 *
 * The parameter is typed as the structural `Pick` of `FieldState<unknown>`
 * so call sites must pass a real field state (not an unrelated `object`),
 * but the body stays defensively duck-typed for wrapper specs that still
 * hand-roll partial field mocks without a `hidden` signal. Tightening
 * those mocks (via a shared factory) would let the body drop the guard and
 * is tracked as a follow-up.
 *
 * @public
 */
declare function isFieldStateHidden(fieldState: Pick<FieldState<unknown>, 'hidden'>): boolean;
/**
 * Reads `required()` from a real `FieldState`.
 *
 * Angular types `FieldState.required` as `Signal<boolean>`, so the parameter
 * is the structural `Pick` of `FieldState<unknown>` rather than a widening
 * cast at the call site. The body stays defensively duck-typed for the same
 * reason {@link isFieldStateHidden} does: the form-field wrapper specs still
 * hand-roll partial field mocks that carry no `required` signal.
 *
 * @internal Reachable only through the package-internal `/core` entry.
 */
declare function isFieldStateRequired(fieldState: Pick<FieldState<unknown>, 'required'>): boolean;

/**
 * Normalize a potential field name into the deterministic v1 identity form.
 *
 * Returns `null` for nullish or whitespace-only inputs, and trims leading
 * and trailing whitespace everywhere else. This is the single source of
 * truth for "is this a usable field name?" — wrappers, headless directives,
 * and consumer-built field-identity surfaces should call it before using
 * a name as the basis for an `id` or `aria-describedby` chain.
 *
 * Deliberately does NOT touch inner whitespace. This is also the primitive
 * that DOM-id reporting
 * (`NgxFieldIdentity.controlId`) relies on, so the returned string must
 * round-trip a data-driven name exactly — a field literally named
 * `"x other-id"` must still be injectable, and a control's reported id must
 * still match its actual DOM `id` attribute. See
 * {@link sanitizeFieldNameForId} for the separate transform ARIA-id
 * generators apply.
 *
 * @example
 * ```typescript
 * normalizeFieldName('email');      // 'email'
 * normalizeFieldName('  email  ');  // 'email'
 * normalizeFieldName('   ');        // null
 * normalizeFieldName('');           // null
 * normalizeFieldName(null);         // null
 * normalizeFieldName(undefined);    // null
 * ```
 */
declare function normalizeFieldName(fieldName: string | null | undefined): string | null;
/**
 * Sanitizes an already-resolved field name into an id-safe token by
 * replacing every run of inner whitespace with a single `-`.
 *
 * Call this ONLY at the point a `${fieldName}-…` ARIA id is built —
 * {@link generateErrorId}, {@link generateWarningId},
 * {@link generateRequiredHintId}, and the hint / selection-cluster-label id
 * builders all apply it internally. Everything that resolves or looks up a
 * field name ({@link normalizeFieldName}, {@link resolveFieldName},
 * {@link resolveFieldNameFromCandidates},
 * `NgxFieldIdentity.controlId`) deliberately stays raw, because those
 * consumers need the exact characters the form model or the DOM `id`
 * attribute carries.
 *
 * `aria-describedby` is a space-separated id list, so a raw space inside a
 * generated id would make it two tokens — the second one pointing at an
 * unrelated element. Replacing keeps a generated id a single token.
 * `'a b'` and `'a-b'` therefore produce the same generated id, by design.
 * Emits a one-shot dev-mode warning so the authoring smell stays visible.
 *
 * @example
 * ```typescript
 * sanitizeFieldNameForId('email');      // 'email'
 * sanitizeFieldNameForId('x other-id'); // 'x-other-id'
 * ```
 *
 * @internal
 */
declare function sanitizeFieldNameForId(fieldName: string): string;
/**
 * Resolve the first usable field name from a list of candidates.
 *
 * Each candidate is run through {@link normalizeFieldName} and the first
 * non-null result wins. Returns `null` only when every candidate is
 * nullish, empty, or whitespace-only.
 *
 * Use this when assembling a field name from a precedence chain — explicit
 * input first, host element id second, parent context third — and you want
 * the same trimming/empty-collapse rules applied to every source.
 *
 * ## The canonical field-name cascade
 *
 * This is the toolkit's canonical statement of the field-name precedence
 * contract. `NgxFormFieldError`, `NgxHeadlessFieldName`,
 * `NgxFormFieldWrapper.resolvedFieldName`, and `createFieldNameResolver`
 * all call this primitive directly, so every wrapper-authoring surface
 * gets the same trim/empty-collapse rules. The result is the raw resolved
 * name — id builders that consume it (`generateErrorId` and friends) apply
 * {@link sanitizeFieldNameForId} themselves. Reading top to bottom, later
 * tiers only run when every earlier tier resolved to `null`:
 *
 * 1. **Explicit input** — a `fieldName` (or equivalent) input the consumer
 *    bound directly on *this* component/directive. Always wins when
 *    non-empty, regardless of what any ancestor already resolved.
 * 2. **Bound-control `id`** — read via {@link resolveFieldName} from the
 *    element the component/directive is itself attached to or projecting.
 *    Only components that own (or are attached to) the control participate
 *    in this tier — `NgxFormFieldWrapper` and `NgxHeadlessFieldName` both
 *    do; a standalone `NgxFormFieldError` does not, because it has no
 *    control of its own.
 * 3. **Inherited context** — the nearest ancestor's *already-resolved*
 *    field name, read through `NGX_SIGNAL_FORM_FIELD_CONTEXT`. This is how
 *    a projected `<ngx-form-field-error>` (which has no bound control of
 *    its own) still ends up with the wrapper's tier-2 id-derived name: the
 *    wrapper resolves tiers 1–2 for itself, publishes the result as
 *    context, and the child's own cascade stops at tier 3.
 *
 * Concretely:
 * - `NgxFormFieldWrapper.resolvedFieldName` cascades 1 → 2 (it owns the
 *   projected control, so it never needs tier 3).
 * - `NgxFormFieldError.#resolvedFieldName` and `NgxHeadlessFieldName`'s
 *   directive-scoped resolution cascade 1 → 3 for `NgxFormFieldError`
 *   (no control of its own to read an id from) and 1 → 2 for
 *   `NgxHeadlessFieldName` (attached directly to the control, so it never
 *   needs context).
 * - `createFieldNameResolver` (in `core/utilities/`) is the one wrapper-
 *   authoring helper that inserts an *optional* fourth tier — a projected
 *   label's `for=` attribute — between explicit and bound-control-id, for
 *   design systems that want that additional fallback.
 *
 * A `null` result at the end of any of these cascades means the same thing
 * everywhere: ARIA wiring is skipped for that field until a name becomes
 * resolvable, never a thrown error or a synthetic `"-error"` id.
 *
 * @example
 * ```typescript
 * // explicit input wins, then host id, then context
 * resolveFieldNameFromCandidates(
 *   this.fieldName(),
 *   this.#elementRef.nativeElement.id,
 *   this.#fieldContext?.fieldName(),
 * );
 * ```
 */
declare function resolveFieldNameFromCandidates(...fieldNameCandidates: readonly (string | null | undefined)[]): string | null;
/**
 * Resolves the field name from an HTML element's `id`.
 *
 * Field identity is deterministic: the bound control must have an `id`.
 * Standalone error/headless APIs require an explicit `fieldName` input;
 * wrappers may infer from the control's `id`.
 *
 * Resolution rules (frozen for v1):
 * - Reads `getAttribute('id')` first, then the `element.id` property as a
 *   fallback. The two are equivalent for normal HTML hosts; the property
 *   read covers attribute-less / detached cases.
 * - Whitespace is trimmed. `"  email  "` → `"email"`. Whitespace-only and
 *   empty strings collapse to `null`, treated as "no id".
 *
 * Returns the raw (trimmed-only) id, unchanged otherwise — this is the
 * primitive
 * `NgxFieldIdentity.controlId` reports, so it must match the DOM `id`
 * attribute and the form model's own key exactly. ARIA id generation
 * applies {@link sanitizeFieldNameForId} separately, at the point an id is
 * built, not here.
 *
 * @param element - The HTML element to resolve the field name from
 * @returns The trimmed `id`, or `null` if the element has no usable id
 */
declare function resolveFieldName(element: HTMLElement): string | null;
/**
 * Generates an error ID for a field, following WCAG best practices.
 *
 * When `kind` is omitted the result identifies the *container* that holds
 * one or more error messages — the form returned by the toolkit's wrappers
 * and used as a single `aria-describedby` target. When `kind` is supplied
 * the result identifies a *specific error*, suitable for headless consumers
 * that render one DOM node per error and want each node addressable on its
 * own. Both forms remain stable so wrapper-rendered and headless-rendered
 * IDs interoperate without the call site re-deriving the format.
 *
 * Applies {@link sanitizeFieldNameForId} to `fieldName` first, so a name
 * with inner whitespace still produces a single-token id. Logs a one-time
 * dev-mode warning when it does.
 *
 * @param fieldName - The field name
 * @param kind - Optional error kind (e.g. `'required'`); appended after the
 *   `-error` suffix when present
 * @returns `{fieldName}-error` (container form) or
 *   `{fieldName}-error-{kind}` (per-error form)
 *
 * @example
 * ```typescript
 * generateErrorId('email');                  // 'email-error'
 * generateErrorId('email', 'required');      // 'email-error-required'
 * generateErrorId('address.city', 'minLen'); // 'address.city-error-minLen'
 * ```
 */
declare function generateErrorId(fieldName: string, kind?: string): string;
/**
 * Computed ID signals for a resolved field name.
 *
 * @internal
 */
interface FieldMessageIdSignals {
    readonly errorId: Signal<string | null>;
    readonly warningId: Signal<string | null>;
}
/**
 * Create computed error / warning IDs for a resolved field name.
 *
 * @internal
 */
declare function createFieldMessageIdSignals(fieldName: () => string | null): FieldMessageIdSignals;
/**
 * Options for building an `aria-describedby` chain in manual ARIA mode.
 */
interface AriaDescribedByChainOptions {
    /** Base IDs that are always included (e.g. hint elements). */
    readonly baseIds?: readonly string[];
    /** Whether the error ID should be appended. */
    readonly showErrors?: boolean;
    /** Whether the warning ID should be appended. */
    readonly showWarnings?: boolean;
}
/**
 * Builds an `aria-describedby` ID chain for a field, following the same
 * conventions as the auto-ARIA layer.
 *
 * Use this when a custom control opts into `ngxSignalFormControlAria="manual"`
 * and needs to assemble its own described-by chain without duplicating the
 * ID-generation logic.
 *
 * @param fieldName - The field name (must match the control's `id`)
 * @param options - Controls which IDs are included in the chain
 * @returns A space-separated ID string, or `null` if no IDs apply
 *
 * @example
 * ```typescript
 * protected readonly describedBy = computed(() =>
 *   buildAriaDescribedBy('accessibilityAudit', {
 *     baseIds: ['accessibilityAudit-hint'],
 *     showErrors: shouldShowErrors(
 *       fieldState.invalid(), fieldState.touched(), strategy, submittedStatus,
 *     ),
 *   }),
 * );
 * ```
 */
declare function buildAriaDescribedBy(fieldName: string, options?: AriaDescribedByChainOptions): string | null;
/**
 * Generates a warning ID for a field, following WCAG best practices.
 *
 * Applies {@link sanitizeFieldNameForId} to `fieldName` first, so a name
 * with inner whitespace still produces a single-token id. Logs a one-time
 * dev-mode warning when it does.
 *
 * @param fieldName - The field name
 * @returns The warning ID in format: `{fieldName}-warning`
 *
 * @example
 * ```typescript
 * generateWarningId('password') // Returns: 'password-warning'
 * generateWarningId('address.zipCode') // Returns: 'address.zipCode-warning'
 * ```
 */
declare function generateWarningId(fieldName: string): string;
/**
 * Generates the ID for a selection cluster's visually-hidden required hint.
 *
 * `role="group"` does not support `aria-required` (only `radiogroup` does),
 * so `NgxFormFieldWrapper` relocates required-ness for `group` clusters into
 * a visually-hidden node referenced by `aria-describedby` instead of an ARIA
 * state — see
 * https://github.com/ngx-signal-forms/ngx-signal-forms/issues/300.
 *
 * Applies {@link sanitizeFieldNameForId} to `fieldName` first, so a name
 * with inner whitespace still produces a single-token id.
 *
 * @param fieldName - The field name
 * @returns The required-hint ID in format: `{fieldName}-required-hint`
 *
 * @example
 * ```typescript
 * generateRequiredHintId('consent'); // Returns: 'consent-required-hint'
 * ```
 *
 * @internal
 */
declare function generateRequiredHintId(fieldName: string): string;
/**
 * Generates the ID for a character count's visually-hidden limit
 * description (issue #499).
 *
 * `NgxFormFieldCharacterCount` renders an element with this id whenever a
 * limit is resolved, and registers it through `NGX_SIGNAL_FORM_HINT_REGISTRY`
 * so `NgxSignalFormAutoAria` links it into `aria-describedby`, right after
 * any hint ids. The element's text states the limit (e.g. "Up to 200
 * characters") — the running count stays in the `[liveAnnounce]` live
 * region.
 *
 * Applies {@link sanitizeFieldNameForId} to `fieldName` first, so a name
 * with inner whitespace still produces a single-token id.
 *
 * @param fieldName - The field name
 * @returns The limit-description ID in format: `{fieldName}-char-count-limit`
 *
 * @example
 * ```typescript
 * generateCharacterCountLimitId('bio'); // Returns: 'bio-char-count-limit'
 * ```
 */
declare function generateCharacterCountLimitId(fieldName: string): string;

/**
 * CSS selector used to discover a bound control inside a wrapper host.
 *
 * Candidate branches (each may match a bound control):
 *
 * - `input[id], textarea[id], select[id], button[type="button"][id]` —
 *   native controls with an `id`. This is the canonical case and works in
 *   both dev and prod builds.
 * - `[role="combobox"][id]` — a non-native combobox trigger with an `id`.
 *   This covers readonly select widgets whose trigger is a `div` or another
 *   element that is not a native form control.
 * - `[id][formField]` — the Signal Forms host binding on a custom control.
 * - `[id][ng-reflect-form-field]` — Angular's reflection attribute. Since
 *   Angular 22 it is opt-in: an application only carries it when it calls
 *   `provideNgReflectAttributes()`, and even then only when the `formField`
 *   input serializes to a string. Kept as a courtesy branch for those
 *   applications; nothing in the toolkit depends on it.
 * - `[id][data-ngx-signal-form-control]` — the stable attribute written
 *   by `NgxSignalFormControl`. Recommended fallback for
 *   custom control hosts that don't carry a native `[formField]` binding
 *   themselves.
 *
 * **Not a tiered resolution order.** This is one comma-separated selector
 * passed to a single `querySelector` call, which returns the first match in
 * *document order* across the whole subtree — not the first branch above
 * that has a match. A `[prefix]`/label-slot element that happens to satisfy
 * any branch (e.g. `<button prefix type="button" id="toggle">`) can
 * therefore win over the real control found elsewhere in the subtree.
 * Callers that care about this (`NgxFormFieldWrapper`, via
 * `readFormFieldWrapperDomSnapshot`) scope the element passed to
 * {@link findBoundControl} to the region that can only contain the real
 * control (its `__main` slot) rather than the whole wrapper host.
 *
 * Centralized here (rather than co-located with the form-field wrapper) so
 * `NgxFieldIdentity` and any future surface that needs to discover a bound
 * control share one resolution rule.
 *
 * @internal
 */
declare const BOUND_CONTROL_SELECTOR = "input[id], textarea[id], select[id], button[type=\"button\"][id], [role=\"combobox\"][id], [id][formField], [id][ng-reflect-form-field], [id][data-ngx-signal-form-control]";
/**
 * Locate the bound form control inside a host element.
 *
 * Returns `null` when no match is found or when the first match isn't an
 * `HTMLElement` (guards against exotic host node types). The element check
 * goes through {@link isHtmlElement} so a server render pass, where the DOM
 * constructors are not global, gets `null` rather than a `ReferenceError`.
 *
 * `hostEl` should already be scoped to the region that can only contain the
 * real control — see the document-order caveat on {@link BOUND_CONTROL_SELECTOR}.
 *
 * @internal
 */
declare function findBoundControl(hostEl: HTMLElement): HTMLElement | null;

/**
 * Minimal FieldState contract required to read Angular's native form-field
 * binding registry.
 *
 * Picked from the real `FieldState` so the type stays in lock-step with the
 * framework, while keeping the surface this module touches small enough to be
 * satisfied by partial/mock field states in tests. `formFieldBindings` is a
 * signal of the `[formField]` (and custom-control) directive instances Angular
 * has registered against this field — each exposes the DOM `element` hosting
 * the binding.
 *
 * @internal
 */
type FormFieldBindingsState = Pick<FieldState<unknown>, 'formFieldBindings'>;
/**
 * Resolve the bound control element from Angular's native binding registry.
 *
 * Prefers `fieldState.formFieldBindings()` — the canonical, framework-owned
 * source of truth for which DOM element a field is bound to — over probing the
 * host DOM with a CSS selector. Returns the first binding whose host `element`
 * is an `HTMLElement` mounted inside `hostEl` **and carrying a non-empty `id`**.
 *
 * Scoping to `hostEl.contains(...)` matters because a single `FieldTree` can be
 * bound to multiple controls (e.g. the same field rendered in two wrappers, or
 * a radio group spread across siblings); only the binding projected into *this*
 * wrapper host is relevant to the wrapper's chrome and ARIA derivations.
 *
 * ## Why the `id` guard is load-bearing (native-vs-fallback invariant)
 *
 * The legacy discovery path (`findBoundControl`'s `BOUND_CONTROL_SELECTOR`)
 * only ever matches elements that carry an `[id]`. To preserve PR #92's
 * "identical output" invariant, the native path must agree: it may only win
 * for an element the fallback could also have produced. Without this guard, an
 * id-less `[formField]` host — e.g. `<my-control formField><input id="x">…` —
 * would let the wrapper element (`my-control`, no id) win over the inner
 * `<input id="x">`, nulling out `inputId`/`resolvedFieldName` and diverging
 * from the established CSS-selector behaviour. By skipping id-less binding
 * elements here, an id-less native host falls through to the existing probe,
 * which still finds the inner `<input id="x">`.
 *
 * Returns `null` (so callers fall back to their existing discovery path) when:
 * - `fieldState` is a partial/mock state without a `formFieldBindings` signal
 *   (the wrapper's unit tests bind a plain mock signal), or
 * - no control has registered a binding yet (the registry can be empty for a
 *   render or two before the projected `[formField]` directive initializes), or
 * - the wrapper hosts a plain control with no `[formField]` directive of its own
 *   (the wrapper carries the `FieldTree`; the inner control is a bare
 *   `<input id="...">`), which never appears in the registry, or
 * - every registered binding element inside this host lacks an `id` (the native
 *   match would diverge from the CSS-selector fallback — see above).
 *
 * @internal Used only within `@ngx-signal-forms/toolkit` package entries.
 */
declare function resolveBoundControlFromBindings(fieldState: FormFieldBindingsState | null | undefined, hostEl: HTMLElement): HTMLElement | null;

/**
 * Focus the first **focusable** invalid field in a form after failed submission.
 *
 * Iterates `errorSummary()` and, for each error whose bound field is
 * interactive (not `hidden()` or `disabled()`), determines success by either
 * of two signals: the active element is already inside one of the field's
 * registered bindings (submit triggered from within the invalid control
 * itself, e.g. pressing Enter), or calling `focusBoundControl()` changes
 * `document.activeElement`. Angular's `focusBoundControl()` is a silent
 * no-op when the field has no registered binding — it exists as a method on
 * every real `FieldState` regardless of whether a control ever called
 * `registerAsBinding()`, so its mere presence cannot signal success, and an
 * unchanged `document.activeElement` cannot either, since the control may
 * already hold focus. A no-op call with focus elsewhere continues to the
 * next candidate. A descendant binding (a composite control whose child
 * registered) still counts, because the check is "did focus move anywhere,
 * or was it already there", not "did it land on this exact field's own
 * element".
 *
 * `readonly()` fields are **not** skipped: they are visible, focusable, and
 * the validation error is usually still meaningful to the user even though
 * they cannot edit the value directly.
 *
 * @param formTree The root form tree to search for invalid fields
 * @returns `true` if a focusable invalid field was found and focused, `false` otherwise
 *
 * @example With declarative submission
 * ```typescript
 * const myForm = form(this.#data, validators, {
 *   submission: {
 *     action: async (field) => { ... },
 *     onInvalid: createOnInvalidHandler(), // uses focusFirstInvalid internally
 *   },
 * });
 * ```
 *
 * @remarks
 * Custom controls must call `registerAsBinding()` for `focusBoundControl()` to work.
 *
 * Angular Signal Forms documents that a hidden field "is ignored when
 * determining the valid, touched, and dirty states" but does not guarantee its
 * errors are absent from `errorSummary()`. The filter below is defensive and
 * becomes a no-op if Angular starts excluding them.
 *
 * ## Default-policy asymmetry vs `isErrorOnInteractiveField`
 *
 * When an error has no `fieldTree` (or a malformed one), this function
 * **skips** it: there is nothing to focus, and silently focusing an
 * unrelated field would be worse than skipping. The error-surfacing
 * predicate `isErrorOnInteractiveField` in
 * `packages/toolkit/headless/src/lib/utilities.ts` takes the inverse
 * default — it returns `true` and **shows** the error, because silently
 * hiding a validation message from the user is the worst outcome.
 * Both policies are deliberate and documented in-place; do not
 * "normalize" them without understanding the blast radius.
 *
 * @public
 */
declare function focusFirstInvalid(formTree: FieldTree<unknown>): boolean;

/**
 * Strips the Angular internal form prefix (`{appId}.form0.`) from a field
 * path, splits camelCase, capitalizes each segment, and joins nested paths
 * with ` / `.
 *
 * This is the default field-label resolver used by error summaries. Override
 * it globally via `provideFieldLabels()` or `NGX_FIELD_LABEL_RESOLVER`.
 *
 * @example
 * ```typescript
 * humanizeFieldPath('address.postalCode'); // 'Address / Postal code'
 * humanizeFieldPath('ng.form0.email');     // 'Email'
 * ```
 *
 * @param fieldName - Raw field path, optionally prefixed with `ng.form{n}.`
 * @returns Human-readable label; nested segments are joined with ` / `
 *
 * @public
 * @group Utility Functions
 */
declare function humanizeFieldPath(fieldName: string): string;
/**
 * Strips the Angular internal form prefix from a raw field name.
 *
 * Resolver functions receive the stripped path, not the raw `{appId}.form0.*`
 * name.
 *
 * @param rawName - Raw field name that may include Angular's
 *   `{appId}.form{n}.` prefix
 * @returns Field name with the Angular internal form prefix removed
 *
 * @internal Used only within `@ngx-signal-forms/toolkit` package entries.
 */
declare function stripAngularFormPrefix(rawName: string): string;

/**
 * Immutable array update utilities for use with NgRx Signal Store.
 *
 * These helpers reduce nested spread boilerplate when updating
 * deeply nested arrays in immutable state.
 *
 * @example
 * ```typescript
 * import { updateAt, updateNested } from '@ngx-signal-forms/toolkit';
 *
 * // Update item at index
 * const updated = updateAt(items, 2, (item) => ({ ...item, name: 'New' }));
 *
 * // Update nested item
 * const nested = updateNested(items, 0, 'children', 1, (child) => ({ ...child }));
 * ```
 *
 * @packageDocumentation
 */
/**
 * Updates an item at a specific index in an array immutably.
 *
 * @param array - The source array
 * @param index - The index of the item to update
 * @param updater - A function that receives the current item and returns the updated item
 * @returns A new array with the updated item
 *
 * @example
 * ```typescript
 * const users = [{ name: 'Alice' }, { name: 'Bob' }];
 * const updated = updateAt(users, 1, (user) => ({ ...user, name: 'Robert' }));
 * /// Result: [{ name: 'Alice' }, { name: 'Robert' }]
 * ```
 */
declare function updateAt<T>(array: readonly T[], index: number, updater: (item: T) => T): T[];
/**
 * Updates nested items in an array using a path of indices and property keys.
 * Useful for deeply nested form arrays.
 *
 * @param array - The source array
 * @param index - The index of the parent item
 * @param nestedKey - The property key of the nested array
 * @param nestedIndex - The index within the nested array
 * @param updater - A function that receives the nested item and returns the updated item
 * @returns A new array with the nested item updated
 *
 * @example
 * ```typescript
 * interface Destination {
 *   name: string;
 *   activities: { name: string }[];
 * }
 *
 * const destinations: Destination[] = [
 *   { name: 'Paris', activities: [{ name: 'Louvre' }, { name: 'Eiffel' }] }
 * ];
 *
 * const updated = updateNested(
 *   destinations, 0, 'activities', 1,
 *   (activity) => ({ ...activity, name: 'Eiffel Tower' })
 * );
 * ```
 */
declare function updateNested<T extends Record<K, U[]>, K extends keyof T, U>(array: readonly T[], index: number, nestedKey: K, nestedIndex: number, updater: (item: U) => U): T[];

/**
 * Custom Inject Function (CIF) for retrieving the form context from FormProviderDirective.
 * Works both inside and outside Angular injection context when an injector is provided.
 *
 * This pattern is inspired by ngxtension's Custom Inject Functions.
 * @see https://github.com/ngxtension/ngxtension-platform
 *
 * @param injector - Optional injector for use outside injection context
 * @returns The form context with submission state and other form-level data, or undefined if not available
 *
 * @example
 * ```typescript
 * /// Inside injection context (component, directive, service)
 * const formContext = injectFormContext();
 * if (formContext) {
 *   const submittedStatus = formContext.submittedStatus();
 * }
 *
 * /// Outside injection context (utility function)
 * function myUtility(injector?: Injector) {
 *   const formContext = injectFormContext(injector);
 *   // Use formContext...
 * }
 *
 * /// In tests
 * const formContext = injectFormContext(TestBed.inject(Injector));
 * ```
 */
declare function injectFormContext(injector?: Injector): NgxSignalFormContext | undefined;

/**
 * Options for configuring the `onInvalid` handler.
 */
interface OnInvalidHandlerOptions {
    /**
     * Whether to focus the first invalid field on invalid submission.
     * @default true
     */
    readonly focusFirstInvalid?: boolean;
    /**
     * Additional callback to run when the form is invalid on submission.
     * Called after focus (if enabled).
     */
    readonly afterInvalid?: (field: FieldTree<unknown>) => void;
}
/**
 * Creates an `onInvalid` handler for `FormSubmitOptions.onInvalid`.
 *
 * By default, focuses the first invalid field for WCAG-compliant form error handling.
 * Can be customized with additional callbacks or disabled focus behavior.
 *
 * @param options Configuration for the handler
 * @returns A function suitable for `FormSubmitOptions.onInvalid`
 *
 * @example Default (focus first invalid)
 * ```typescript
 * const myForm = form(this.#data, {
 *   submission: {
 *     action: async (field) => { ... },
 *     onInvalid: createOnInvalidHandler(),
 *   },
 * });
 * ```
 *
 * @example With additional callback
 * ```typescript
 * const myForm = form(this.#data, {
 *   submission: {
 *     action: async (field) => { ... },
 *     onInvalid: createOnInvalidHandler({
 *       afterInvalid: () => this.showErrorNotification(),
 *     }),
 *   },
 * });
 * ```
 *
 * @example Without focus
 * ```typescript
 * const myForm = form(this.#data, {
 *   submission: {
 *     action: async (field) => { ... },
 *     onInvalid: createOnInvalidHandler({ focusFirstInvalid: false }),
 *   },
 * });
 * ```
 *
 * @public
 */
declare function createOnInvalidHandler(options?: Readonly<OnInvalidHandlerOptions>): (field: FieldTree<unknown>) => void;

/**
 * Read only direct errors from FieldState (excludes nested field errors).
 *
 * Unlike `errorSummary()`-based approaches, this only reads direct `errors()`
 * from the current field/group state.
 *
 * @group Utility Functions
 */
declare function readDirectErrors(state: unknown): ValidationError[];

/**
 * Options accepted by {@link resolveValidationErrorMessage} and
 * {@link getDefaultValidationMessage}.
 *
 * Exported because both functions are on the package root: a caller that
 * wraps either one needs to be able to name this type.
 */
interface ResolveErrorMessageOptions {
    readonly stripWarningPrefix?: boolean;
}
/**
 * A `ValidationError` whose `message` may be *explicitly* `undefined`.
 *
 * Angular declares `message?: string`, which under `exactOptionalPropertyTypes`
 * permits omission but not an explicit `undefined`. A custom validator that
 * builds its error from optional data (`{ kind, message: maybeMissing }`)
 * produces exactly that shape at runtime, and the nullish check below already
 * treats it as "fall through to the registry". This alias widens the parameter
 * to accept what the function already handles — it only ever accepts more, so
 * every real `ValidationError` still fits.
 */
type ResolvableValidationError = Omit<ValidationError, 'message'> & {
    readonly message?: string | undefined;
};
/**
 * Resolves the display message for one validation error.
 *
 * Three-tier cascade:
 * 1. the error's own `message`, if set (an explicit empty string wins too)
 * 2. the matching entry in `registry`, if any
 * 3. {@link getDefaultValidationMessage}
 *
 * @param error The validation error to describe.
 * @param registry An optional error-message registry, as set by
 *   `provideErrorMessages()`.
 * @param options Formatting options, such as `stripWarningPrefix`.
 * @returns The resolved display string.
 */
declare function resolveValidationErrorMessage(error: ResolvableValidationError, registry?: Readonly<ErrorMessageRegistry> | null, options?: ResolveErrorMessageOptions): string;
/**
 * The last tier of {@link resolveValidationErrorMessage}: a message for an
 * error with no explicit `message` and no registry entry.
 *
 * A built-in `NgValidationError` kind gets a written-out sentence. Any other
 * kind gets its `kind` string humanized (underscores become spaces, and the
 * `warn:` prefix is stripped when `options.stripWarningPrefix` is set).
 *
 * @param error The validation error to describe.
 * @param options Formatting options, such as `stripWarningPrefix`.
 * @returns The default display string.
 */
declare function getDefaultValidationMessage(error: ResolvableValidationError, options?: ResolveErrorMessageOptions): string;

/**
 * Minimal structural contract for a Standard Schema (v1) compatible
 * validator — e.g. a Zod, Valibot, or ArkType schema.
 *
 * Deliberately narrower than `@standard-schema/spec`'s `StandardSchemaV1`
 * (which also requires `vendor`/`version`/`types`): this toolkit only ever
 * *calls* `~standard.validate`, so keeping the contract to that single method
 * avoids importing an extra runtime type-only dependency while remaining
 * structurally assignable from any real Standard Schema implementation.
 *
 * @public
 */
interface StandardSchemaLike<TInput = unknown> {
    readonly '~standard': {
        readonly validate: (value: unknown) => StandardSchemaLikeResult<TInput> | PromiseLike<StandardSchemaLikeResult<TInput>>;
    };
}
/**
 * A single Standard Schema validation issue, narrowed to the fields this
 * toolkit reads (`path`, to target the failing key).
 *
 * @public
 */
interface StandardSchemaLikeIssue {
    readonly message: string;
    readonly path?: ReadonlyArray<PropertyKey | {
        readonly key: PropertyKey;
    }>;
}
/**
 * Result shape returned by `~standard.validate`. A successful validation
 * omits `issues` (or returns an empty array); a failed one returns a
 * non-empty `issues` array.
 *
 * @public
 */
interface StandardSchemaLikeResult<TInput> {
    readonly issues?: ReadonlyArray<StandardSchemaLikeIssue>;
    readonly value?: TInput;
}
/**
 * Derives `aria-required` for a Standard Schema (Zod, Valibot, ArkType, …)
 * validated field by wiring Angular Signal Forms' `REQUIRED` metadata key
 * from the schema, mirroring what the native `required()` validator does for
 * hand-written Signal Forms validation.
 *
 * **Why this exists**: `validateStandardSchema()` (from
 * `@angular/forms/signals`) only registers tree-level validation errors — it
 * never touches `REQUIRED` metadata, because the Standard Schema spec has no
 * runtime way to ask "is this key required?" directly. Without `REQUIRED`
 * metadata, `FieldState.required()` stays `false`, so `NgxSignalFormAutoAria`
 * never writes `aria-required`, and `ngx-form-field-wrapper`'s
 * `showMarkerWhen: 'required'` auto-marker never fires — see
 * [#118](https://github.com/ngx-signal-forms/ngx-signal-forms/issues/118).
 *
 * This function closes that gap with the only library-agnostic technique
 * available: probing the schema with the field's own key set to `undefined`
 * (see {@link isStandardSchemaKeyRequired}) and registering the result as
 * `REQUIRED` metadata. `REQUIRED` is an OR-reducing metadata key, so this
 * composes safely alongside other `required()`/`metadata(path, REQUIRED, …)`
 * registrations on the same field.
 *
 * **Call this once per field**, bound directly to that field's own path, next
 * to the `validateStandardSchema()` call that validates the object owning it.
 * Standard Schema doesn't expose an object's keys at runtime, so there's no
 * way to derive every required field from a single root-level call — this
 * mirrors calling `required()` per field in hand-written schemas.
 *
 * @param path The field's own `SchemaPath` (e.g. `path.firstName`) — required-ness
 *   is registered on this exact field.
 * @param schema The same Standard Schema (or `LogicFn` resolving to one) passed to
 *   `validateStandardSchema()` for the object that owns `path`.
 *
 * @example
 * ```typescript
 * import { form, validateStandardSchema } from '@angular/forms/signals';
 * import { requiredFromStandardSchema } from '@ngx-signal-forms/toolkit';
 *
 * const travelerForm = form(model, (path) => {
 *   validateStandardSchema(path, TravelerSchema);
 *   requiredFromStandardSchema(path.firstName, TravelerSchema);
 *   requiredFromStandardSchema(path.lastName, TravelerSchema);
 * });
 * ```
 *
 * @public
 */
declare function requiredFromStandardSchema<TValue, TModel = unknown, TPathKind extends PathKind = PathKind.Root>(path: SchemaPath<TValue, SchemaPathRules.Supported, TPathKind>, schema: StandardSchemaLike<TModel> | LogicFn<TValue, StandardSchemaLike<TModel> | undefined, TPathKind>): void;

/**
 * Resolves the error display strategy from a component/directive's input,
 * falling back to form context, then to the default.
 *
 * This eliminates the repeated pattern across directives/components that
 * each implement their own `#resolvedStrategy` computed with the same logic.
 */
declare function resolveStrategyFromContext(inputStrategy: ErrorDisplayStrategy | undefined, formContext: NgxSignalFormContext | undefined, configDefault?: ResolvedErrorDisplayStrategy | null): ResolvedErrorDisplayStrategy;
/**
 * Resolves the warning display strategy from a component/directive's input,
 * falling back to form context, then to the config default.
 *
 * This is the warning-specific counterpart to `resolveStrategyFromContext`.
 * It ensures warnings follow their own independent cascade, separate from errors.
 */
declare function resolveWarningStrategyFromContext(inputStrategy: WarningDisplayStrategy | undefined, formContext: NgxSignalFormContext | undefined, configDefault?: ResolvedWarningDisplayStrategy | null): ResolvedWarningDisplayStrategy;
/**
 * Resolves the submitted status from a component/directive's input,
 * falling back to form context.
 *
 * This eliminates the repeated pattern across directives/components that
 * each implement their own `#resolvedSubmittedStatus` computed with the same logic.
 */
declare function resolveSubmittedStatusFromContext(inputStatus: SubmittedStatus | undefined, formContext: NgxSignalFormContext | undefined): SubmittedStatus | undefined;

/**
 * Mutable one-shot warning flag, held by the caller so each call site keeps
 * its own scoping (per-instance private field, per-invocation module-scope
 * `let`, …). {@link devWarnOnce} only ever flips `current` from `false` to
 * `true`; it never resets it — callers whose diagnostic should re-arm (e.g.
 * "warn again if the misconfiguration recurs after being fixed") reset
 * `current` themselves.
 *
 * @internal
 */
interface WarnOnceRef {
    current: boolean;
}
/**
 * Emits a dev-mode console diagnostic at most once per `warned` ref.
 *
 * Collapses the repeated "dev-mode check → one-shot flag → console call"
 * shape used across the toolkit's misconfiguration diagnostics. No-ops
 * outside dev mode and after the first call for a given `warned` ref.
 *
 * @param warned Caller-owned one-shot flag — see {@link WarnOnceRef}.
 * @param level `'warn'` or `'error'` — the console method to call. Kept
 *   explicit per call site rather than defaulted, since sites disagree on
 *   severity (a config typo is an error; a silent focus() no-op is a warn).
 * @param message The diagnostic message. By convention, toolkit messages are
 *   prefixed `[ngx-signal-forms] <Component>: …`.
 * @param args Extra values forwarded verbatim to the console call (e.g. a
 *   DOM element for inspection, or a type descriptor) — never interpolated
 *   into `message` when they might carry user-entered data.
 *
 * @internal
 */
declare function devWarnOnce(warned: WarnOnceRef, level: 'error' | 'warn', message: string, ...args: readonly unknown[]): void;
/**
 * Creates a bound {@link devWarnOnce} for call sites that don't already own
 * a per-instance field to hold the {@link WarnOnceRef} — factory functions
 * (`createXyz()`) that mint one closure-scoped warning per invocation, or a
 * module-scoped singleton warning shared for the process lifetime.
 *
 * @returns A function with the same `(level, message, ...args)` signature as
 *   {@link devWarnOnce}, pre-bound to a fresh, private `WarnOnceRef`.
 *
 * @example Per-invocation (factory)
 * ```typescript
 * export function createThing(options: Options) {
 *   const warnOnce = createDevWarnOnce();
 *   return computed(() => {
 *     if (somethingWrong) {
 *       warnOnce('warn', '[ngx-signal-forms] …');
 *     }
 *   });
 * }
 * ```
 *
 * @internal
 */
declare function createDevWarnOnce(): (level: 'error' | 'warn', message: string, ...args: readonly unknown[]) => void;

/**
 * Tracks completed-once submission history on top of native
 * `FieldState.submitting()`.
 *
 * Angular Signal Forms exposes `submitting()` and `touched()` but does not
 * retain whether a submission has already completed. This helper derives that
 * history:
 * - `'unsubmitted'` — no submission attempt has completed yet
 * - `'submitting'` — `submitting()` is currently `true`
 * - `'submitted'` — `submitting()` completed at least once, or an invalid
 *   submit attempt was recorded via the optional `submitAttempted` signal
 *
 * When `form.reset()` flips `touched()` from `true` to `false`, the derived
 * history resets to `'unsubmitted'`.
 *
 * @param formTree A `FieldTree` or `Signal<FieldTree>` (supports deferred resolution via `input.required()`)
 * @param submitAttempted Optional `WritableSignal<boolean>` consumers set to
 *   `true` when an invalid-form submit attempt would otherwise leave native
 *   `submitting()` flat (Angular's `submit()` short-circuits on invalid forms
 *   without ever flipping the signal). The tracker treats a `true` value as
 *   evidence of a completed attempt and reports `'submitted'`. The signal is
 *   cleared automatically when `touched()` returns to `false` (form reset) —
 *   without that clear, the next touched: `false` → `true` transition (the
 *   user simply touching a field again, with no new submit) would see the
 *   stale `true` and resurrect `'submitted'`.
 * @returns Signal with the current `SubmittedStatus`
 *
 * @remarks
 * Must be called in an injection context (uses `effect()` internally).
 *
 * @public
 */
declare function createSubmittedStatusTracker(formTree: FieldTree<unknown> | Signal<FieldTree<unknown>>, submitAttempted?: WritableSignal<boolean>): Signal<SubmittedStatus>;
/**
 * Computed signal indicating whether a form has been submitted.
 *
 * Returns `true` when:
 * - Form has completed at least one submission attempt
 * - Derived submission status resolves to `'submitted'`
 *
 * Use this to conditionally show messages or change UI after submission.
 *
 * @param formTree The form tree to check submission history for
 * @returns Signal that emits `true` when form has been submitted
 *
 * @remarks
 * Must be called in an injection context — delegates to
 * {@link createSubmittedStatusTracker}, which uses `effect()` internally.
 * Calling this from a plain method (outside a constructor, field
 * initializer, or `runInInjectionContext()`) throws Angular's NG0203, and
 * the error will report `createSubmittedStatusTracker` (not `hasSubmitted`)
 * as the offending call.
 *
 * @public
 */
declare function hasSubmitted(formTree: FieldTree<unknown>): Signal<boolean>;
/**
 * Checks whether a form has only warnings (no blocking errors).
 *
 * @public
 */
declare function hasOnlyWarnings(errors: readonly ValidationError[]): boolean;
/**
 * Gets blocking errors only (excludes warnings).
 *
 * @public
 */
declare function getBlockingErrors(errors: readonly ValidationError[]): ValidationError[];
/**
 * Computed signal indicating whether a form can be submitted with warnings.
 *
 * @public
 */
declare function canSubmitWithWarnings(formTree: FieldTree<unknown>): Signal<boolean>;
/**
 * Submits a form, allowing warnings to pass through.
 *
 * Marks all form fields as touched (including all descendants), yields one
 * microtask so that synchronously-resolving validation state propagates, then
 * — when no blocking errors remain — delegates to Angular's `submit()` with
 * `ignoreValidators: 'all'` (the blocking-error gate above already replaces
 * Angular's own check, which would otherwise treat warnings as blocking too).
 * Warnings (errors whose `kind` starts with `'warn:'`) never block submission.
 *
 * **Pending validators do not block**, matching Angular `submit()`'s default
 * `ignoreValidators: 'pending'` behavior: a still-in-flight async validator is
 * not a reason to refuse submission. Only settled blocking errors gate.
 *
 * **Return value**: matches Angular's own `submit()` — `true` once `action`
 * has run and settled, `false` when the call was refused (blocking errors
 * present) or dropped (re-entrant call, see below).
 *
 * Because the success path delegates to native `submit()`, `submitting()`
 * flips for its duration and `createSubmittedStatusTracker` picks up the
 * completed attempt automatically — no extra wiring needed. A refused call
 * (blocking errors present) never reaches native `submit()`, so `submitting()`
 * does not flip for it either — the same behavior as Angular's own `submit()`
 * on an invalid form. Pass a `WritableSignal<boolean>` into
 * {@link createSubmittedStatusTracker}'s `submitAttempted` parameter and set
 * it to `true` when this function returns `false` without running `action` if
 * a form using `errorStrategy: 'on-submit'` needs to react to that refusal.
 *
 * **Re-entrancy**: concurrent calls for the same `formTree` — from a
 * double-click, Enter spam, or an overlapping native submit — are silently
 * dropped. The in-flight guard is cleared in the `finally` block so the form
 * is always re-submittable after the current call settles (even on rejection).
 *
 * @param formTree - The root `FieldTree` of the form to submit
 * @param action - Async callback invoked only when no blocking errors remain
 * @returns `true` once `action` has run and settled; `false` when the call
 *   was refused or dropped
 *
 * @public
 */
declare function submitWithWarnings<TModel>(formTree: FieldTree<TModel>, action: () => Promise<void>): Promise<boolean>;

/**
 * Unwraps a `NgxReactiveOrStatic<T>` value to get the actual value of type `T`.
 *
 * ## What does it do?
 * Extracts the static value from reactive (Signal/function) or static inputs,
 * handling all three input types transparently.
 *
 * ## When to use it?
 * Use `unwrapValue()` when you need to:
 * - Get the actual value from a `NgxReactiveOrStatic<T>` parameter
 * - Work with the concrete value inside `computed()` or `effect()`
 * - Convert flexible inputs into usable values
 *
 * ## How does it work?
 * The function checks the input type and unwraps accordingly:
 * 1. **Signal** (`signal()` or `computed()`) → Calls the signal to get the value
 * 2. **Function** (`() => T`) → Calls the function to get the value
 * 3. **Static value** (`T`) → Returns the value directly
 *
 * ## Why use this instead of manual checks?
 * - Type-safe: Properly narrows `NgxReactiveOrStatic<T>` to `T`
 * - Consistent: Handles all three cases with proper Angular signal detection
 * - Maintainable: Centralized unwrapping logic with proper type assertions
 *
 * @template T The type of the unwrapped value
 * @param value - The reactive or static value to unwrap
 * @returns The unwrapped value of type `T`
 *
 * @example Unwrapping different input types
 * ```typescript
 * const staticValue = 'on-touch';
 * const signalValue = signal('on-touch');
 * const fnValue = () => 'on-touch';
 *
 * unwrapValue(staticValue);  // 'on-touch' (returned directly)
 * unwrapValue(signalValue);  // 'on-touch' (signal called)
 * unwrapValue(fnValue);      // 'on-touch' (function called)
 * ```
 *
 * @example Inside a computed signal
 * ```typescript
 * function resolveShowErrors<T>(
 *   field: NgxReactiveOrStatic<FieldState<T>>,
 *   strategy: NgxReactiveOrStatic<ErrorDisplayStrategy>
 * ): Signal<boolean> {
 *   return computed(() => {
 *     /// Unwrap to get actual values inside computed
 *     const fieldState = unwrapValue(field);
 *     const strategyValue = unwrapValue(strategy);
 *
 *     /// Now work with concrete values
 *     return fieldState.invalid() && strategyValue === 'immediate';
 *   });
 * }
 * ```
 *
 * @example Component input unwrapping
 * ```typescript
 * @Component({...})
 * export class MyComponent {
 *   readonly strategy = input<NgxReactiveOrStatic<ErrorDisplayStrategy>>('on-touch');
 *
 *   protected readonly actualStrategy = computed(() =>
 *     unwrapValue(this.strategy())
 *   );
 * }
 * ```
 *
 * @remarks
 * **Callable `T` footgun.** Some toolkit types (e.g. `FieldTree<U>` /
 * `FieldState<U>` from `@angular/forms/signals`) are themselves callable —
 * the type IS a function. The single-signature `unwrapValue<T>(v: Signal<T> |
 * (() => T) | T): T` form would route those values through the function
 * branch and silently invoke them, losing the wrapper. The overloads below
 * make the call-site route explicit (the developer can see they are invoking
 * the `() => T` branch), but they do not prevent a `FieldTree` from
 * accidentally being passed where a static value was intended — the runtime
 * guard always invokes any `typeof === 'function'` value.
 *
 * - {@link unwrapValue} `(value: Signal<T>)` — the signal branch
 * - {@link unwrapValue} `(value: () => T)` — the zero-arg-function branch.
 *   `FieldTree`/`FieldState` are accepted here because they ARE callable, and
 *   invoking them yields the snapshot, which is the documented semantic.
 * - {@link unwrapValue} `(value: T)` — the static branch
 *
 * The runtime behavior (`isSignal()` then `typeof === 'function'`) is
 * unchanged; only the public type signature gained overloads.
 *
 * @see {@link NgxReactiveOrStatic} The type this function unwraps
 */
declare function unwrapValue<T>(value: Signal<T>): T;
declare function unwrapValue<T>(value: () => T): T;
declare function unwrapValue<T>(value: NgxReactiveOrStatic<T>): T;
declare function unwrapValue<T>(value: T): T;

type WalkFieldTreeEntry = {
    readonly path: string;
    readonly state: FieldState<unknown>;
};
/**
 * Thrown when {@link walkFieldTreeEntries} encounters a value that does not satisfy
 * the FieldTree / FieldState contract. Always loud — never swallowed —
 * because malformed trees indicate a wiring mistake (mock missing required
 * methods, child typed as a non-callable value, etc.) rather than a runtime
 * condition the toolkit can recover from.
 *
 * @internal Reachable only through the package-internal `/core` entry;
 * absent from the published root barrel.
 */
declare class InvalidFieldTreeError extends Error {
    constructor(message: string, options?: ErrorOptions);
}
/**
 * Type predicate for an externally-supplied value that is *usable as* a `FieldTree`.
 *
 * This is a **structural** check, deliberately not Angular's `isFieldTree()`
 * provenance brand (`@angular/forms/signals`), which tests a module-private
 * `Symbol` no hand-built test double can ever satisfy. Toolkit boundaries must
 * accept such doubles, so this predicate instead verifies that `value` is
 * callable and produces a `FieldState` whose required methods (`value`,
 * `touched`, `errors`, `errorSummary`, `submitting`, `markAsTouched`) are
 * functions and whose `.fieldTree` back-reference points to `value` itself.
 * Returns `false` for any value that fails this contract, including ones that
 * throw when invoked.
 *
 * Use this at toolkit boundaries that accept `unknown` (debugger probes,
 * submission tracker entry points, third-party wrapper integration code) so
 * the cast to `FieldTree<unknown>` is provably safe rather than asserted.
 *
 * @internal Reachable only through the package-internal `/core` entry;
 * absent from the published root barrel.
 */
declare function isFieldTreeLike(value: unknown): value is FieldTree<unknown>;
/**
 * Depth-first field-tree walk with stable dotted paths for consumers that
 * need stable per-field identity (e.g. `@for` track keys in the debugger).
 *
 * @yields Each reachable `FieldState` plus its dotted path.
 *
 * @internal Reachable only through the package-internal `/core` entry;
 * absent from the published root barrel.
 */
declare function walkFieldTreeEntries<TModel>(root: FieldTree<TModel>): Iterable<WalkFieldTreeEntry>;

/**
 * The `kind` prefix that marks a `ValidationError` as a non-blocking warning
 * rather than a blocking error (see {@link warningError}). Exported so other
 * adapters that build their own warning kinds — e.g. the `vest` entry
 * point's `warn:vest:` prefix — derive from one source instead of
 * hard-coding the string.
 *
 * **Stability**: part of the toolkit's public v1 contract. Changing it is a
 * major version bump — see {@link warningError}'s stability note.
 *
 * @public
 */
declare const WARN_KIND_PREFIX = "warn:";
/**
 * Type guard to check if a validation error is a warning.
 * Warnings are errors with `kind` starting with `'warn:'`.
 *
 * @param error - The validation error to check
 * @returns `true` if the error is a warning, `false` otherwise
 *
 * @example
 * ```typescript
 * const error = { kind: 'required', message: 'Field required' };
 * const warning = warningError('weak-password', 'Consider stronger password');
 *
 * isWarningError(error);   // false
 * isWarningError(warning); // true
 * ```
 */
declare function isWarningError(error: ValidationError): boolean;
/**
 * Predicate that checks if a validation error is a blocking error.
 * Any error whose `kind` does NOT start with `'warn:'` is blocking — including
 * malformed errors with an empty or non-string `kind`. This is intentional:
 * a malformed validator result must never silently allow form submission
 * (fail-safe semantics). Matches the semantics of `splitByKind`, which routes
 * every non-warning error into the `blocking` bucket.
 *
 * @param error - The validation error to check
 * @returns `true` if the error is not a warning (including malformed errors),
 *   `false` only if the error is a valid warning (kind starts with `'warn:'`)
 *
 * @example
 * ```typescript
 * const error = { kind: 'required', message: 'Field required' };
 * const warning = warningError('weak-password', 'Consider stronger password');
 * const malformed = { kind: '', message: 'Missing kind' };
 *
 * isBlockingError(error);     // true
 * isBlockingError(warning);   // false
 * isBlockingError(malformed); // true  — fail-safe: treated as blocking
 * ```
 */
declare function isBlockingError(error: ValidationError): boolean;
/**
 * Result of splitting validation errors into blocking errors and warnings.
 */
interface SplitErrors {
    readonly blocking: ValidationError[];
    readonly warnings: ValidationError[];
}
/**
 * Splits an array of validation errors into blocking errors and warnings
 * in a single pass. More efficient than calling `.filter(isBlockingError)`
 * and `.filter(isWarningError)` separately.
 *
 * @param errors - Array of ValidationError to partition
 * @returns Object with `blocking` and `warnings` arrays
 */
declare function splitByKind(errors: readonly ValidationError[]): SplitErrors;
/**
 * Creates a warning validation error using the `warn:` kind convention.
 *
 * **What are warnings?**
 * Warnings are non-blocking validation messages that provide guidance to users
 * without preventing form submission. They use the same `ValidationError` structure
 * as errors, but with a `kind` that starts with `warn:`.
 *
 * **Convention:**
 * - Errors (blocking): `kind` does NOT start with `warn:`
 * - Warnings (non-blocking): `kind` starts with `warn:`
 *
 * **ARIA Behavior:**
 * - Errors: `role="alert"` with `aria-live="assertive"` (immediate announcement)
 * - Warnings: `role="status"` with `aria-live="polite"` (non-intrusive)
 *
 * @remarks
 * **Pass the bare kind, not the prefixed form.** Call
 * `warningError('weak-password')`, NOT `warningError('warn:weak-password')`.
 * The function adds the `warn:` prefix for you. Passing an already-prefixed
 * kind is tolerated (deduplicated to avoid `warn:warn:*`) but is not the
 * intended call form.
 *
 * **Stability**: the `warn:` prefix scheme is part of the toolkit's public
 * v1 contract. Helpers that key off it (`isWarningError`, `splitByKind`,
 * `hasOnlyWarnings`, `getBlockingErrors`, `canSubmitWithWarnings`,
 * `submitWithWarnings`) and ARIA timing in the wrapper, assistive, and
 * headless entry points all depend on it. Changing the prefix is a major
 * version bump.
 *
 * @param kind - The warning type, without the `warn:` prefix (the prefix is
 *   prepended by this function).
 * @param message - Optional warning message to display.
 * @returns A `ValidationError` with `kind` prefixed by `warn:`.
 *
 * @since 1.0.0
 *
 * @example Basic warning
 * ```typescript
 * validate(path.password, (ctx) => {
 *   const value = ctx.value();
 *   if (value && value.length < 12) {
 *     return warningError('short-password', 'Consider using 12+ characters for better security');
 *   }
 *   return null;
 * });
 * ```
 *
 * @example Warning without message (message can be added in template or config)
 * ```typescript
 * validate(path.email, (ctx) => {
 *   const value = ctx.value();
 *   if (value && value.includes('@tempmail.com')) {
 *     return warningError('disposable-email');
 *   }
 *   return null;
 * });
 * ```
 *
 * @see {@link https://angular.dev/api/forms/signals/ValidationError | ValidationError API}
 */
declare function warningError(kind: string, message?: string): ValidationError;

/**
 * Bundled imports for the ngx-signal-forms toolkit core directives.
 *
 * This constant provides a convenient way to import all essential toolkit directives
 * in a single import statement, reducing boilerplate in component imports.
 *
 * @example
 * ```typescript
 * import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';
 * import { NgxFormFieldError } from '@ngx-signal-forms/toolkit/assistive';
 *
 * @Component({
 *   selector: 'ngx-my-form',
 *   imports: [FormField, NgxSignalFormToolkit, NgxFormFieldError],
 *   template: `
 *     <form [formRoot]="myForm" ngxSignalForm>
 *       <input [formField]="myForm.email" />
 *       <ngx-form-field-error [formField]="myForm.email" fieldName="email" />
 *     </form>
 *   `
 * })
 * export class MyFormComponent {
 *   // ...
 * }
 * ```
 *
 * @remarks
 * **Contents:**
 * - {@link FormRoot} - Angular-owned submit and `novalidate` behavior
 * - {@link NgxSignalForm} - Adds toolkit context and error strategy
 * - {@link NgxSignalFormAutoAria} - Automatically applies ARIA attributes
 * - {@link NgxSignalFormControl} - Declares stable wrapper/ARIA semantics for a control
 *
 * **For error display:** Import `NgxFormFieldError` from `@ngx-signal-forms/toolkit/assistive`
 *
 * **Benefits:**
 * - Single import instead of multiple individual imports
 * - Type-safe readonly tuple
 * - Cleaner component metadata
 *
 * @public
 */
declare const NgxSignalFormToolkit: readonly [typeof FormRoot, typeof NgxSignalForm, typeof NgxSignalFormAutoAria, typeof NgxSignalFormControl];

export { BOUND_CONTROL_SELECTOR, DEFAULT_NGX_SIGNAL_FORMS_CONFIG, DEFAULT_NGX_SIGNAL_FORM_CONTROL_PRESETS, FORM_FIELD_APPEARANCE_VALUES, FORM_FIELD_ORIENTATION_VALUES, InvalidFieldTreeError, NGX_ERROR_MESSAGES, NGX_FIELD_LABEL_RESOLVER, NGX_FORM_FIELD_ERROR_RENDERER, NGX_FORM_FIELD_HINT_RENDERER, NGX_SIGNAL_FORMS_CONFIG, NGX_SIGNAL_FORM_ARIA_MODE, NGX_SIGNAL_FORM_CONTEXT, NGX_SIGNAL_FORM_CONTROL_KIND_VALUES, NGX_SIGNAL_FORM_CONTROL_PRESETS, NGX_SIGNAL_FORM_FIELD_CONTEXT, NGX_SIGNAL_FORM_FIELD_VISIBILITY_REGISTRY, NGX_SIGNAL_FORM_HINT_REGISTRY, NgxFieldIdentity, NgxFieldIdentityProvider, NgxFieldVisibilityRegistry, NgxSignalForm, NgxSignalFormAutoAria, NgxSignalFormControl, NgxSignalFormIdCounter, NgxSignalFormToolkit, NgxSubmitAnnouncements, WARN_KIND_PREFIX, assertInjector, buildAriaDescribedBy, canSubmitWithWarnings, createAriaDescribedByBridge, createAriaDescribedBySignal, createAriaInvalidSignal, createAriaRequiredSignal, createCascadingResolver, createCharacterCountLengthSignal, createControlVisibilitySignal, createDevWarnOnce, createErrorVisibility, createFieldMessageIdSignals, createFieldNameResolver, createFieldPresentation, createHintIdsSignal, createOnInvalidHandler, createSubmittedStatusTracker, createUniqueId, createWarningVisibility, devWarnOnce, findBoundControl, focusFirstInvalid, generateCharacterCountLimitId, generateErrorId, generateRequiredHintId, generateWarningId, getBlockingErrors, getDefaultValidationMessage, hasOnlyWarnings, hasSubmitted, humanizeFieldPath, inferNgxSignalFormControlKind, injectFormContext, isBlockingError, isElementCssVisible, isFieldStateHidden, isFieldStateInteractive, isFieldStateRequired, isFieldTreeLike, isHtmlButtonElement, isHtmlElement, isHtmlInputElement, isHtmlSelectElement, isHtmlTextAreaElement, isNgxSignalFormControlAriaMode, isNgxSignalFormControlKind, isNgxSignalFormControlLayout, isWarningError, mergeNgxSignalFormControlPresets, normalizeFieldName, provideErrorMessages, provideFieldLabels, provideFormFieldErrorRenderer, provideFormFieldErrorRendererForComponent, provideFormFieldHintRenderer, provideFormFieldHintRendererForComponent, provideNgxSignalFormControlPresets, provideNgxSignalFormControlPresetsForComponent, provideNgxSignalFormsConfig, provideNgxSignalFormsConfigForComponent, readDirectErrors, readNgxSignalFormControlSemantics, requiredFromStandardSchema, resolveBoundControlFromBindings, resolveFieldName, resolveFieldNameFromCandidates, resolveNgxSignalFormControlSemantics, resolveStrategyFromContext, resolveSubmittedStatusFromContext, resolveValidationErrorMessage, resolveWarningStrategyFromContext, sanitizeFieldNameForId, shouldShowErrors, shouldShowWarnings, splitByKind, stripAngularFormPrefix, submitWithWarnings, unwrapValue, updateAt, updateNested, walkFieldTreeEntries, warningError };
export type { AriaDescribedByBridge, AriaDescribedByChainOptions, AriaDescribedByFieldNameReader, AriaDescribedByPreservedIdsReader, AriaRequiredFieldState, BoundControlElementReader, CreateAriaDescribedByBridgeOptions, CreateAriaDescribedBySignalOptions, CreateErrorVisibilityOptions, CreateFieldNameResolverOptions, CreateFieldPresentationOptions, CreateHintIdsSignalOptions, CreateWarningVisibilityOptions, ErrorDisplayStrategy, ErrorMessageRegistry, ErrorReadableState, ErrorVisibilityState, FieldLabelMap, FieldLabelResolver, FieldMarkingMode, FieldMessageIdSignals, FieldPresentation, FieldPresentationState, FormFieldAppearance, FormFieldAppearanceInput, FormFieldBindingsState, FormFieldOrientation, FormFieldOrientationInput, HintIdsFieldNameReader, HintIdsIdentityLike, HintIdsRegistryLike, HintIdsSignal, LabelForReader, MarkerKind, NgxFormFieldErrorRenderer, NgxFormFieldErrorRendererOverride, NgxFormFieldHintRenderer, NgxFormFieldHintRendererOverride, NgxReactiveOrStatic, NgxSignalFormContext, NgxSignalFormControlAriaMode, NgxSignalFormControlKind, NgxSignalFormControlLayout, NgxSignalFormControlPreset, NgxSignalFormControlPresetOverrides, NgxSignalFormControlPresetRegistry, NgxSignalFormControlSemantics, NgxSignalFormFieldContext, NgxSignalFormFieldVisibilityDescriptor, NgxSignalFormFieldVisibilityRegistry, NgxSignalFormHintDescriptor, NgxSignalFormHintRegistry, NgxSignalFormsConfig, NgxSignalFormsUserConfig, NgxSignalLike, OnInvalidHandlerOptions, ResolvableValidationError, ResolveErrorMessageOptions, ResolvedErrorDisplayStrategy, ResolvedMarker, ResolvedNgxSignalFormControlSemantics, ResolvedWarningDisplayStrategy, SplitErrors, StandardSchemaLike, StandardSchemaLikeIssue, StandardSchemaLikeResult, StaticCascadingResolverOptions, SubmittedStatus, WarnOnceRef, WarningDisplayStrategy, WarningVisibilityState };
