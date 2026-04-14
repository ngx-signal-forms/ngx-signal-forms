import type { Signal } from '@angular/core';

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
export type SubmittedStatus = 'unsubmitted' | 'submitting' | 'submitted';

/**
 * A signal-like value that can be called to get the current value.
 * Represents either an Angular Signal or a zero-argument function.
 *
 * @template T The type of value returned when called
 */
export type SignalLike<T> = Signal<T> | (() => T);

/**
 * Accepts reactive (Signal/function) or static values.
 *
 * @internal Used internally by toolkit utilities. Not part of the public API.
 * @template T The type of value when unwrapped
 */
export type ReactiveOrStatic<T> = SignalLike<T> | T;

/**
 * Resolved error display strategy used by forms and config defaults.
 *
 * This excludes `'inherit'`, which only makes sense for field-level overrides.
 */
export type ResolvedErrorDisplayStrategy =
  | 'immediate'
  | 'on-touch'
  | 'on-submit';

/**
 * Error display strategy determines when validation errors are shown to the user.
 *
 * - `'immediate'` — Show errors as they occur (real-time)
 * - `'on-touch'` — Show after blur or submit (WCAG recommended, default)
 * - `'on-submit'` — Show only after form submission
 * - `'inherit'` — Inherit from form provider (field-level only)
 */
export type ErrorDisplayStrategy = ResolvedErrorDisplayStrategy | 'inherit';

/**
 * Normalized form field appearance values used by the toolkit internally.
 *
 * - `'stacked'`: Label above input (default)
 * - `'outline'`: Material-inspired outlined appearance with floating label
 * - `'plain'`: Minimal wrapper chrome for custom or visually lightweight fields
 */
export type ResolvedFormFieldAppearance = 'stacked' | 'outline' | 'plain';

/**
 * Public form field appearance values accepted from consumers.
 *
 * - `'stacked'`: Label above input (default)
 * - `'outline'`: Material-inspired outlined appearance with floating label
 * - `'plain'`: Minimal wrapper chrome while keeping wrapper semantics
 */
export type FormFieldAppearance = ResolvedFormFieldAppearance;

/**
 * Form field appearance input for component-level control.
 *
 * - `'stacked'`: Default appearance with label above input
 * - `'outline'`: Material-inspired outlined appearance with floating label
 * - `'plain'`: No border or background chrome while keeping labels, hints, and errors
 * - `'inherit'`: Use the global config default (component-level only)
 *
 * @example Component-level override
 * ```html
 * <!-- Override global config to use stacked for a specific field -->
 * <ngx-signal-form-field-wrapper [formField]="form.email" appearance="stacked">
 *   <label for="email">Email</label>
 *   <input id="email" [formField]="form.email" />
 * </ngx-signal-form-field-wrapper>
 * ```
 *
 * @example Plain appearance for custom controls
 * ```html
 * <ngx-signal-form-field-wrapper [formField]="form.rating" appearance="plain">
 *   <label for="rating">Rating</label>
 *   <app-rating-control id="rating" [formField]="form.rating" />
 * </ngx-signal-form-field-wrapper>
 * ```
 *
 * @see https://material.angular.dev/components/form-field/overview#form-field-appearance-variants
 */
export type FormFieldAppearanceInput = FormFieldAppearance | 'inherit';

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
 *   `NgxSignalFormControlSemanticsDirective` inputs:
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
 * four coupled locations; TypeScript will fail the build until all are in
 * sync:
 *
 * 1. This union type.
 * 2. `NGX_SIGNAL_FORM_CONTROL_KIND_VALUES` in
 *    `packages/toolkit/core/utilities/control-semantics.ts` — the runtime
 *    list used by DOM validation and dev diagnostics.
 * 3. `DEFAULT_NGX_SIGNAL_FORM_CONTROL_PRESETS` in
 *    `packages/toolkit/core/tokens.ts` — the default `layout` + `ariaMode`
 *    for the new kind.
 * 4. `CONTROL_KIND_CAPABILITIES` in
 *    `packages/toolkit/form-field/form-field.utils.ts` — the
 *    wrapper-layout capability flags (`textual`, `supportsOutline`,
 *    `selectionGroup`, `paddedContent`).
 *
 * The `satisfies` clauses on (2) and (4) enforce exhaustiveness at compile
 * time, so the TS error from adding only (1) tells you exactly what's
 * missing. Heuristic inference in
 * `inferNgxSignalFormControlKind` (same file as (2)) is optional and only
 * needed if the new kind has a reliable DOM fingerprint.
 */
export type NgxSignalFormControlKind =
  | 'input-like'
  | 'standalone-field-like'
  | 'switch'
  | 'checkbox'
  | 'radio-group'
  | 'slider'
  | 'composite';

/**
 * Layout presets understood by the form-field wrapper.
 */
export type NgxSignalFormControlLayout =
  | 'stacked'
  | 'inline-control'
  | 'group'
  | 'custom';

/**
 * Controls how the toolkit auto-ARIA layer participates for a control.
 *
 * - `auto`: toolkit manages `aria-invalid`, `aria-describedby`, and `aria-required`
 * - `manual`: consumer fully owns those attributes
 */
export type NgxSignalFormControlAriaMode = 'auto' | 'manual';

/**
 * Explicit control semantics declared by a consumer.
 */
export interface NgxSignalFormControlSemantics {
  readonly kind?: NgxSignalFormControlKind;
  readonly layout?: NgxSignalFormControlLayout;
  readonly ariaMode?: NgxSignalFormControlAriaMode;
}

/**
 * Preset behavior for a semantic control family.
 */
export interface NgxSignalFormControlPreset {
  readonly layout: NgxSignalFormControlLayout;
  readonly ariaMode: NgxSignalFormControlAriaMode;
}

/**
 * Full preset registry keyed by control kind.
 */
export type NgxSignalFormControlPresetRegistry = Record<
  NgxSignalFormControlKind,
  NgxSignalFormControlPreset
>;

/**
 * Consumer overrides for the preset registry.
 */
export type NgxSignalFormControlPresetOverrides = Partial<
  Record<NgxSignalFormControlKind, Partial<NgxSignalFormControlPreset>>
>;

/**
 * Configuration options for the ngx-signal-forms toolkit.
 */
export interface NgxSignalFormsConfig {
  /**
   * Enable automatic ARIA attributes (aria-invalid, aria-describedby).
   * @default true
   */
  autoAria: boolean;

  /**
   * Default error display strategy.
   * @default 'on-touch'
   */
  defaultErrorStrategy: ResolvedErrorDisplayStrategy;

  /**
   * Default appearance for form fields.
   * @default 'stacked'
   */
  defaultFormFieldAppearance: ResolvedFormFieldAppearance;

  /**
   * Whether to show the required marker for outlined fields.
   * @default true
   */
  showRequiredMarker: boolean;

  /**
   * Custom character(s) to display as the required marker in outlined fields.
   * @default ' *'
   */
  requiredMarker: string;
}

/**
 * User-provided configuration (all properties optional).
 */
export interface NgxSignalFormsUserConfig {
  autoAria?: boolean;
  defaultErrorStrategy?: ResolvedErrorDisplayStrategy;
  defaultFormFieldAppearance?: FormFieldAppearance;
  showRequiredMarker?: boolean;
  requiredMarker?: string;
}
