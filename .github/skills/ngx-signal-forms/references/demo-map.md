# Demo App Map

Repository paths in `apps/demo/src/app/` organized by feature. Use these when working inside the `ngx-signal-forms` repository. All paths are optional — if unavailable, use installed package docs.

## 00 — Signal Forms Only (No Toolkit)

- `00-signal-forms-only/pure-signal-form/` — Baseline Angular Signal Forms form without any toolkit; shows what the toolkit replaces

## 01 — Getting Started

- `01-getting-started/your-first-form/` — First meaningful toolkit adoption: auto-ARIA, error components, reduced boilerplate

## 02 — Toolkit Core

- `02-toolkit-core/accessibility-comparison/` — ARIA automation and boilerplate reduction before/after `[formRoot]`
- `02-toolkit-core/error-display-modes/` — `'immediate'`, `'on-touch'`, `'on-submit'` strategy comparison
- `02-toolkit-core/warning-support/` — Non-blocking warnings vs blocking errors; warning ARIA (`role="status"` vs `role="alert"`)

## 03 — Headless

- `03-headless/error-state/error-state.form.ts` — Custom error rendering via headless visibility and message state
- `03-headless/error-state/error-state.page.ts` — Headless UI side-by-side with debugger
- `03-headless/fieldset-utilities/fieldset-utilities.form.ts` — Aggregated group state with fieldset utilities
- `03-headless/fieldset-utilities/fieldset-utilities.page.ts` — Why grouped state helps when markup is fully custom

## 04 — Form Field Wrapper

- `04-form-field-wrapper/basic-usage/` — Smallest wrapper happy path; standard vs outline appearance
- `04-form-field-wrapper/basic-usage/outline-form-field.*` — Outline appearance with floating label
- `04-form-field-wrapper/complex-forms/` — Production-style nested objects, arrays, and dense layouts
- `04-form-field-wrapper/fieldset-grouping/` — Grouped summaries and fieldset-level validation placement
- `04-form-field-wrapper/custom-controls/` — Wrapper integration with custom `FormValueControl` components

## 05 — Advanced

- `05-advanced/global-configuration/` — App-level defaults with `provideNgxSignalFormsConfig()`
- `05-advanced/error-messages/` — Centralized message resolution with `provideErrorMessages()`
- `05-advanced/submission-patterns/` — Submission lifecycle, invalid handling, `focusFirstInvalid`, `NgxSignalFormErrorSummaryComponent` (GOV.UK pattern)
- `05-advanced/advanced-wizard/` — Wrapper appearance across step-based multi-page flows

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
