# Demo App Map

Repository paths in `apps/demo/src/app/` organized by the current live demo. Use these when working inside the `ngx-signal-forms` repository. All paths are optional — if unavailable, use installed package docs.

## 01 — Getting Started

- `01-getting-started/your-first-form/` — Intro demo for bundle import, `ngxSignalForm` form context, auto-ARIA, and inline errors

## 02 — Toolkit Core

- `02-toolkit-core/error-display-modes/` — `'immediate'`, `'on-touch'`, `'on-submit'` strategy comparison
- `02-toolkit-core/warning-support/` — Non-blocking warnings vs blocking errors; warning ARIA (`role="status"` vs `role="alert"`)

## 03 — Headless

- `03-headless/fieldset-utilities/fieldset-utilities.form.ts` — Aggregated group state, summary utilities, and state flags for custom markup
- `03-headless/fieldset-utilities/fieldset-utilities.page.ts` — Headless UI patterns and grouped-state explanation

## 04 — Form Field Wrapper

- `04-form-field-wrapper/complex-forms/` — Production-style nested objects, arrays, and dense layouts
  - Includes a dedicated fieldset example (`fieldset.form.ts` / `fieldset.model.ts` / `fieldset.validations.ts`) demonstrating `NgxFormFieldset` grouped summaries
- `04-form-field-wrapper/custom-controls/` — Wrapper integration with custom `FormValueControl` components, checkbox opt-in via `ngxSignalFormControl`, slider with manual ARIA and `buildAriaDescribedBy`, and component-scoped control presets via `provideNgxSignalFormControlPresetsForComponent`

Horizontal `FormFieldOrientation` is exercised via the shared `ui/orientation-toggle` component wired into multiple 05-advanced demos — there's no dedicated page yet. `provideNgxSignalFormsConfig({ defaultFormFieldOrientation: 'horizontal' })` drives the default; per-wrapper `orientation="horizontal"` overrides it.

## 05 — Advanced

- `05-advanced/global-configuration/` — App-level defaults with `provideNgxSignalFormsConfig()`
- `05-advanced/submission-patterns/` — Submission lifecycle, invalid handling, `focusFirstInvalid`, and `NgxFormFieldErrorSummary`
- `05-advanced/advanced-wizard/` — Multi-step flow with NgRx Signals + Zod
- `05-advanced/async-validation/` — Remote/pending validation flows
- `05-advanced/cross-field-validation/` — Dependent sibling validation rules
- `05-advanced/vest-validation/` — Vest-only business validation
- `05-advanced/zod-vest-validation/` — Structural validation plus business rules

## Supporting Docs in Repository

### Package READMEs

- `packages/toolkit/README.md` — Full API reference with examples
- `packages/toolkit/form-field/README.md` — Form field wrapper detailed docs
- `packages/toolkit/form-field/THEMING.md` — CSS custom properties and control-aware styling hooks
- `packages/toolkit/assistive/README.md` — Assistive component docs
- `packages/toolkit/headless/README.md` — Headless primitive docs
- `packages/toolkit/vest/README.md` — Vest adapter, suite lifecycle, `only()` selector
- `packages/toolkit/debugger/README.md` — Debugger, badges, production tree-shaking

### Cross-cutting docs (`docs/`)

- `docs/ANGULAR_VS_TOOLKIT.md` — Where Angular Signal Forms ends and the toolkit begins
- `docs/VALIDATION_STRATEGY.md` — When to reach for Angular validators, Zod, or Vest
- `docs/CUSTOM_CONTROLS.md` — Building `FormValueControl` / `FormCheckboxControl` / `FormUiControl` hosts
- `docs/COMPLEX_NESTED_FORMS.md` — Nested objects, arrays, `apply`/`applyEach`/`applyWhenValue`
- `docs/CSS_FRAMEWORK_INTEGRATION.md` — Bootstrap, Tailwind, Material setup
- `docs/WARNINGS_SUPPORT.md` — Non-blocking validation end-to-end
- `docs/PACKAGE_ARCHITECTURE.md` — Entry point layout and `@internal` policy
- `docs/ANGULAR_PUBLIC_API_POLICY.md` — How public vs `@internal` exports are managed
- `docs/MIGRATING_BETA_TO_V1.md` — Beta → 1.0 migration
- `docs/MIGRATING_FROM_NGX_VEST_FORMS.md` — Migration from `ngx-vest-forms`
- `docs/decisions/` — Architecture Decision Records (ADRs)
- `docs/archive/NESTED_FORM_ARRAYS_PATTERN.md` — Dynamic nested array patterns (historical reference)

### Instructions

- `.github/instructions/angular-signal-forms.instructions.md` — Angular Signal Forms rules
- `.github/instructions/ngx-signal-forms-toolkit.instructions.md` — Toolkit usage rules
