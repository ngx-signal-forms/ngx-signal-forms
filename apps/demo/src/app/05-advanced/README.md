# Advanced scenarios

Independent, real-world form patterns: app-wide configuration, declarative submission, async validation, server errors, store binding, autosave, i18n, routed steps, and multi-step wizards.

This folder also holds the source for the three `/validation/*` demos ([zod-validation](./zod-validation/README.md), [vest-validation](./vest-validation/README.md), and [zod-vest-validation](./zod-vest-validation/README.md)).

Prerequisites: familiarity with [02-toolkit-core](../02-toolkit-core/README.md) and [04-form-field-wrapper](../04-form-field-wrapper/README.md).

## Demos in this section

- **[global-configuration](./global-configuration/README.md):** `provideNgxSignalFormsConfig()`, `provideErrorMessages()`, `provideFieldLabels()`, and control presets with local overrides.
- **[submission-patterns](./submission-patterns/README.md):** declarative `form(..., { submission })` with `[formRoot]`, `createOnInvalidHandler()`, submitting state, and `NgxFormFieldErrorSummary`.
- **[advanced-wizard](./advanced-wizard/README.md):** multi-step wizard with one form per step, NgRx SignalStore draft/commit state, Zod schemas, and `@defer` lazy steps.
- **[single-model-wizard](./single-model-wizard/README.md):** multi-step wizard backed by one shared `form()` model with per-step validation guards.
- **[routed-steps](./routed-steps/README.md):** one `form()` above three step routes using `withErrorBoundaries()`, per-step `errorComponent`, `canActivate` step guards, and reload retry.
- **[async-validation](./async-validation/README.md):** `validateHttp()` with automatic cancellation, request vs. blur debounce, `pending()` indicators, and request-failure warnings.
- **[field-state-patterns](./field-state-patterns/README.md):** conditional `hidden()`, `disabled()`, and `readonly()` rules using Angular's `{ when }` syntax.
- **[cross-field-validation](./cross-field-validation/README.md):** sibling-aware rules with `ctx.valueOf()` and field-level vs. group-level error placement.
- **[server-integration](./server-integration/README.md):** `resource()` prefill, declarative submission, server `TreeValidationResult` errors, and `reset(value)` after save.
- **[store-binding](./store-binding/README.md):** two-way binding between a Signal Form and an `@ngrx/signals` store through `linkedSignal`.
- **[autosave](./autosave/README.md):** debounced field-level saves via `debounce(path, 500)` and `HttpClient.patch()`, gated on `dirty()` and `valid()`.
- **[i18n](./i18n/README.md):** `provideErrorMessages()` and `provideFieldLabels()` factories reading a runtime language signal.

## Core concepts

- **Declarative submission.** `form(model, schema, { submission: { action, onInvalid } })` with `[formRoot]` handles submit lifecycle and focus on invalid fields. See the [toolkit README](../../../../../packages/toolkit/README.md).
- **Async validators.** `validateHttp()` cancels in-flight requests on value change and exposes `pending()`.
- **Global configuration.** `provideNgxSignalFormsConfig()` and `provideNgxSignalFormControlPresets()` set app-wide defaults with component- and field-level overrides.
- **Warning-tolerant submission.** Use declarative `ignoreValidators: 'all'` with `hasOnlyWarnings()`, or imperative `submitWithWarnings()`.
- **Server error mapping.** Return a `TreeValidationResult` from `action`; include `fieldTree` for a field error or omit it for a form-level error.
- **Validation layering.** Compare Angular validators, Standard Schema (Zod), and Vest in [docs/VALIDATION_STRATEGY.md](../../../../../docs/VALIDATION_STRATEGY.md).

## Next steps

- [Toolkit reference](../../../../../packages/toolkit/README.md)
- [Form field wrapper](../../../../../packages/toolkit/form-field/README.md)
- [Headless primitives](../../../../../packages/toolkit/headless/README.md)
- [Vest integration](../../../../../packages/toolkit/vest/README.md)
- [Root README](../../../../../README.md)
