/**
 * PROTOTYPE — throwaway, issue #600. Type-level evidence only; run with
 * `node apps/demo/src/app/_prototype-display-controls/run.mjs`.
 *
 * Checks the controls section of real example definitions against the REAL
 * form components' inputs. Every `@ts-expect-error` below is a mistake the
 * definition must reject at compile time; if one stops erroring, tsc fails.
 */
import type { InputSignalWithTransform } from '@angular/core';
import type { ServerIntegrationComponent } from '../05-advanced/server-integration/server-integration.form';
import type { ComplexFormsComponent } from '../04-form-field-wrapper/complex-forms/complex-forms.form';
import type { FieldMarkingFormComponent } from '../04-form-field-wrapper/field-marking/field-marking.form';
import type { BrandThemingFormComponent } from '../04-form-field-wrapper/brand-theming/brand-theming.form';
import type { WarningsSupportFormComponent } from '../02-toolkit-core/warning-support/warning-support.form';
import type { FieldsetAppearanceFormComponent } from '../04-form-field-wrapper/fieldset-appearance/fieldset-appearance.form';
import type { CATALOG, ControlConfig, ControlId, ValueOf } from './display-controls.prototype';

// ── The whole type machinery option (b) needs: ~12 lines.
type Accepted<T> = T extends InputSignalWithTransform<infer _R, infer W> ? W : never;
type FormInputs<F> = {
  [P in keyof F as F[P] extends InputSignalWithTransform<infer _R, infer _W> ? P : never]: Accepted<F[P]>;
};
type Offers<F, K extends ControlId> = (typeof CATALOG)[K] extends { input: infer I }
  ? I extends keyof FormInputs<F>
    ? [ValueOf<K>] extends [FormInputs<F>[I]] ? true : false
    : false
  : true; // live-area controls (brand theme) work with any form
export type ControlsFor<F> = {
  readonly [K in ControlId as Offers<F, K> extends true ? K : never]?: ControlConfig<K>;
};

declare function defineExample<F>(def: {
  readonly form: abstract new (...args: never[]) => F;
  readonly controls: ControlsFor<F>;
}): void;
declare const ServerIntegration: abstract new () => ServerIntegrationComponent;
declare const ComplexForms: abstract new () => ComplexFormsComponent;
declare const FieldMarking: abstract new () => FieldMarkingFormComponent;
declare const BrandTheming: abstract new () => BrandThemingFormComponent;
declare const WarningSupport: abstract new () => WarningsSupportFormComponent;
declare const FieldsetAppearance: abstract new () => FieldsetAppearanceFormComponent;

// ── Real definitions: how big does the controls section get?

// The 20 "standard shape" examples all look like this (3 lines).
defineExample({
  form: ServerIntegration,
  controls: { errorMode: {}, appearance: {}, orientation: {} },
});

// warning-support: restricted modes (1 line).
defineExample({
  form: WarningSupport,
  controls: { errorMode: { modes: ['immediate', 'on-touch'] } },
});

// complex-forms: + grouped-feedback placement (1 extra line).
defineExample({
  form: ComplexForms,
  controls: { errorMode: {}, appearance: {}, orientation: {}, errorPlacement: { default: 'bottom' } },
});

// field-marking: every control is example-specific (6 lines).
defineExample({
  form: FieldMarking,
  controls: {
    appearance: { default: 'standard' },
    markingMode: {},
    requiredMarkerText: {},
    optionalMarkerText: {},
    legendText: {},
    phoneRequired: {},
  },
});

// brand-theming: its form has no inputs at all; brand theme styles the live area.
defineExample({ form: BrandTheming, controls: { brandTheme: {} } });

// ── Mistakes the definition must reject.

defineExample({
  form: FieldMarking,
  // @ts-expect-error field-marking has no `orientation` input
  controls: { orientation: {} },
});

defineExample({
  form: ComplexForms,
  // @ts-expect-error 'left' is not a grouped-feedback placement
  controls: { errorPlacement: { default: 'left' } },
});

defineExample({
  form: WarningSupport,
  // @ts-expect-error 'sometimes' is not an error mode
  controls: { errorMode: { modes: ['sometimes'] } },
});

defineExample({
  form: BrandTheming,
  // @ts-expect-error brand-theming's form has no `appearance` input
  controls: { appearance: {} },
});

// fieldset-appearance TODAY keeps its settings as internal signals, not
// inputs, so the definition (correctly) refuses its controls. The migration
// must turn those signals into inputs — true under option (a) as well.
defineExample({
  form: FieldsetAppearance,
  // @ts-expect-error fieldset-appearance's form has no `fieldsetAppearance` input yet
  controls: { fieldsetAppearance: {} },
});
