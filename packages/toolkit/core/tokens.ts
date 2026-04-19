import { InjectionToken, type Signal } from '@angular/core';
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
 * Describes a hint element that should contribute to `aria-describedby` for
 * a specific field. `fieldName` may be `null` when a hint has not been
 * correlated to a field yet — in that case the registry consumer decides
 * whether to include it.
 *
 * Wire format for the already-internal `NgxSignalFormHintRegistry` contract
 * between the form field wrapper and the auto-ARIA directive. Consumers
 * should not depend on its shape.
 *
 * @internal
 */
export interface NgxSignalFormHintDescriptor {
  readonly id: string;
  readonly fieldName: string | null;
}

/**
 * Registry of hints that live inside a form field wrapper (or any other
 * provider of `NGX_SIGNAL_FORM_HINT_REGISTRY`). `NgxSignalFormAutoAria`
 * reads this registry instead of querying the DOM for hint elements.
 *
 * @internal
 */
export interface NgxSignalFormHintRegistry {
  readonly hints: Signal<readonly NgxSignalFormHintDescriptor[]>;
}

/**
 * Injection token for the hint registry contributed by a form field wrapper.
 * Decouples auto-ARIA from DOM knowledge of the wrapper and hint component
 * selectors: hint IDs are now handed to auto-ARIA by whoever owns the wrapper.
 *
 * Internal contract between the form field wrapper component and the
 * auto-ARIA directive. Consumers authoring their own wrapper component may
 * provide it, but it is not part of the stable public API surface and may
 * evolve alongside auto-ARIA internals.
 *
 * @internal
 */
export const NGX_SIGNAL_FORM_HINT_REGISTRY =
  new InjectionToken<NgxSignalFormHintRegistry>(
    'NGX_SIGNAL_FORM_HINT_REGISTRY',
  );
