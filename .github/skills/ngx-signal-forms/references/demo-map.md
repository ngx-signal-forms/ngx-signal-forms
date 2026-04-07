# Demo App Map

Repository paths in `apps/demo/src/app/` organized by the current live demo. Use these when working inside the `ngx-signal-forms` repository. All paths are optional — if unavailable, use installed package docs.

## 01 — Getting Started

- `01-getting-started/your-first-form/` — Smallest recommended toolkit setup: `form[formRoot][ngxSignalForm]`, auto-ARIA, and inline errors

## 02 — Toolkit Core

- `02-toolkit-core/error-display-modes/` — `'immediate'`, `'on-touch'`, `'on-submit'` strategy comparison
- `02-toolkit-core/warning-support/` — Non-blocking warnings vs blocking errors; warning ARIA (`role="status"` vs `role="alert"`)

## 03 — Headless

- `03-headless/fieldset-utilities/fieldset-utilities.form.ts` — Aggregated group state, summary utilities, and state flags for custom markup
- `03-headless/fieldset-utilities/fieldset-utilities.page.ts` — Headless UI patterns and grouped-state explanation

## 04 — Form Field Wrapper

- `04-form-field-wrapper/complex-forms/` — Production-style nested objects, arrays, and dense layouts
- `04-form-field-wrapper/custom-controls/` — Wrapper integration with custom `FormValueControl` components, checkbox opt-in via `ngxSignalFormControl`, slider with manual ARIA and `buildAriaDescribedBy`, and component-scoped control presets via `provideNgxSignalFormControlPresetsForComponent`

## 05 — Advanced

- `05-advanced/global-configuration/` — App-level defaults with `provideNgxSignalFormsConfig()`
- `05-advanced/submission-patterns/` — Submission lifecycle, invalid handling, `focusFirstInvalid`, and `NgxSignalFormErrorSummaryComponent`
- `05-advanced/advanced-wizard/` — Multi-step flow with NgRx Signals + Zod
- `05-advanced/async-validation/` — Remote/pending validation flows
- `05-advanced/cross-field-validation/` — Dependent sibling validation rules
- `05-advanced/vest-validation/` — Vest-only business validation
- `05-advanced/zod-vest-validation/` — Structural validation plus business rules

## Supporting Docs in Repository

- `packages/toolkit/README.md` — Full API reference with examples
- `packages/toolkit/form-field/README.md` — Form field wrapper detailed docs
- `packages/toolkit/form-field/THEMING.md` — CSS custom properties (20+ variables)
- `packages/toolkit/assistive/README.md` — Assistive component docs
- `packages/toolkit/headless/README.md` — Headless primitive docs
- `packages/toolkit/debugger/README.md` — Debugger docs
- `docs/CSS_FRAMEWORK_INTEGRATION.md` — Bootstrap, Tailwind, Material setup
- `docs/WARNINGS_SUPPORT.md` — Non-blocking validation
- `docs/NESTED_FORM_ARRAYS_PATTERN.md` — Dynamic nested array patterns
- `.github/instructions/angular-signal-forms.instructions.md` — Angular Signal Forms rules
- `.github/instructions/ngx-signal-forms-toolkit.instructions.md` — Toolkit usage rules
