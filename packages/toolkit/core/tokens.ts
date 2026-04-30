import { InjectionToken, type Signal, type Type } from '@angular/core';
import type { NgxSignalFormContext } from './directives/ngx-signal-form';
import type {
  NgxSignalFormControlAriaMode,
  NgxSignalFormControlPresetRegistry,
  NgxSignalFormsConfig,
} from './types';

/**
 * Context provided by form field wrapper components.
 * Allows child components (like error display) to inherit field name.
 *
 * `fieldName` may emit `null` when the wrapper cannot resolve a field name
 * (no `[formField]`, no explicit `[fieldName]` input, no projected control).
 * Consumers should treat `null` as "field name not yet known" — usually by
 * skipping id/aria linking and (in dev mode) surfacing the misconfiguration.
 */
export interface NgxSignalFormFieldContext {
  /** Resolved field name signal, or `null` when the wrapper cannot resolve one. */
  readonly fieldName: Signal<string | null>;
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
export const DEFAULT_NGX_SIGNAL_FORMS_CONFIG = {
  autoAria: true,
  defaultErrorStrategy: 'on-touch',
  defaultFormFieldAppearance: 'standard',
  defaultFormFieldOrientation: 'vertical',
  showRequiredMarker: true,
  requiredMarker: ' *',
} as const satisfies NgxSignalFormsConfig;

/**
 * Default semantic presets applied when consumers opt into explicit control
 * semantics.
 *
 * Uses `as const` + `satisfies` so each preset keeps its literal `layout`
 * and `ariaMode` types while still being verified against the registry shape.
 *
 * @public
 */
export const DEFAULT_NGX_SIGNAL_FORM_CONTROL_PRESETS = {
  'input-like': {
    layout: 'stacked',
    ariaMode: 'auto',
  },
  'standalone-field-like': {
    layout: 'stacked',
    ariaMode: 'auto',
  },
  switch: {
    layout: 'inline-control',
    ariaMode: 'auto',
  },
  checkbox: {
    layout: 'group',
    ariaMode: 'auto',
  },
  'radio-group': {
    layout: 'group',
    ariaMode: 'auto',
  },
  slider: {
    layout: 'stacked',
    ariaMode: 'auto',
  },
  composite: {
    layout: 'custom',
    ariaMode: 'auto',
  },
} as const satisfies NgxSignalFormControlPresetRegistry;

/**
 * Injection token for the global ngx-signal-forms configuration.
 */
export const NGX_SIGNAL_FORMS_CONFIG = new InjectionToken<NgxSignalFormsConfig>(
  'NGX_SIGNAL_FORMS_CONFIG',
  {
    factory: () => ({
      ...DEFAULT_NGX_SIGNAL_FORMS_CONFIG,
    }),
  },
);

/**
 * Injection token for semantic control presets used by explicit control
 * metadata and wrapper inference.
 */
export const NGX_SIGNAL_FORM_CONTROL_PRESETS =
  new InjectionToken<NgxSignalFormControlPresetRegistry>(
    'NGX_SIGNAL_FORM_CONTROL_PRESETS',
    {
      factory: () => ({
        ...DEFAULT_NGX_SIGNAL_FORM_CONTROL_PRESETS,
      }),
    },
  );

/**
 * Injection token for the form context (provided by `NgxSignalForm`
 * when `ngxSignalForm` is present alongside Angular's `[formRoot]`).
 *
 * @template TForm - The Signal Forms instance type
 */
export const NGX_SIGNAL_FORM_CONTEXT = new InjectionToken<NgxSignalFormContext>(
  'NGX_SIGNAL_FORM_CONTEXT',
);

/**
 * Injection token for field-level context (provided by form field wrapper).
 * Allows child components to inherit resolved field name without explicit input.
 */
export const NGX_SIGNAL_FORM_FIELD_CONTEXT =
  new InjectionToken<NgxSignalFormFieldContext>(
    'NGX_SIGNAL_FORM_FIELD_CONTEXT',
  );

/**
 * Injection token for the resolved ARIA ownership mode for a single control
 * host. Provided by `NgxSignalFormControlSemanticsDirective` at its own
 * directive level, and read by `NgxSignalFormAutoAria` via
 * `{ optional: true, self: true }`.
 *
 * Decouples auto-ARIA from the control-semantics directive: auto-ARIA no
 * longer needs a direct class import, which lets the two directives evolve
 * independently.
 *
 * Internal contract between the control-semantics directive and the
 * auto-ARIA directive. Consumers should use `ngxSignalFormControlAria` on
 * their control host instead of providing this token directly — that keeps
 * the public API focused on the declarative directive input.
 *
 * @internal
 */
export const NGX_SIGNAL_FORM_ARIA_MODE = new InjectionToken<
  Signal<NgxSignalFormControlAriaMode | null>
>('NGX_SIGNAL_FORM_ARIA_MODE');

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
export interface NgxSignalFormHintDescriptor {
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
export interface NgxSignalFormHintRegistry {
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
export const NGX_SIGNAL_FORM_HINT_REGISTRY =
  new InjectionToken<NgxSignalFormHintRegistry>(
    'NGX_SIGNAL_FORM_HINT_REGISTRY',
  );

/**
 * Renderer contract for the form-field error slot. Two consumers bind this
 * renderer:
 *
 * - `NgxFormFieldWrapper` binds inputs `{formField, strategy, submittedStatus}`.
 * - `NgxFormFieldset` binds inputs `{errors, fieldName, strategy, submittedStatus, listStyle}`.
 *
 * The wrapper instantiates the configured component via `*ngComponentOutlet`
 * and binds the relevant input set per call site. A custom renderer intended
 * to replace both must accept the union of those input names; inputs the
 * renderer doesn't declare are silently dropped by `*ngComponentOutlet`.
 *
 * Renderers may accept extra inputs beyond the contract (analytics tags,
 * theming hooks); the wrapper/fieldset ignore them and Angular accepts the
 * `inputs` map without warning.
 *
 * @public
 */
export interface NgxFormFieldErrorRenderer {
  readonly component: Type<unknown>;
}

/**
 * Renderer contract for a form-field wrapper's hint slot when that wrapper
 * chooses to instantiate a configured hint component, for example via
 * `*ngComponentOutlet`.
 *
 * The first-party `NgxFormFieldWrapper` currently projects
 * `<ngx-form-field-hint>` content directly and does not consult this token
 * for its hint slot. This token therefore applies to wrappers that opt into
 * dynamic hint rendering.
 *
 * Hint renderers receive no wrapper-bound inputs; when instantiated, they
 * consume `NGX_SIGNAL_FORM_FIELD_CONTEXT` (and any other DI tokens)
 * directly.
 *
 * @public
 */
export interface NgxFormFieldHintRenderer {
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
export const NGX_FORM_FIELD_ERROR_RENDERER =
  new InjectionToken<NgxFormFieldErrorRenderer>(
    'NGX_FORM_FIELD_ERROR_RENDERER',
  );

/**
 * Injection token for form-field wrapper implementations that render the
 * hint slot via a component outlet.
 *
 * The first-party `NgxFormFieldWrapper` currently renders projected hint
 * content directly and does not consult this token. Wrappers that do render
 * hints dynamically may use this token to resolve a custom hint renderer,
 * typically falling back to `NgxFormFieldHint` from
 * `@ngx-signal-forms/toolkit/assistive` when no provider is registered.
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
export const NGX_FORM_FIELD_HINT_RENDERER =
  new InjectionToken<NgxFormFieldHintRenderer>('NGX_FORM_FIELD_HINT_RENDERER');
