# Toolkit Form Field Reference Map

## Portability note

This file is safe to copy outside this repository.

- Treat the wrapper patterns below as portable guidance.
- Treat any repository paths as optional examples that only exist in `ngx-signal-forms`.
- When those paths do not exist, use the installed package docs or the public GitHub repository instead.

## Portable patterns

- Use the form-field entry point when a pre-styled wrapper, grouped fieldset, or floating-label treatment is preferred over custom markup.
- Prefer stable control `id` values so the wrapper can derive field identity without extra wiring.
- Use grouped fieldsets for compound controls and section-level summaries instead of rebuilding aggregation logic manually.

## Repository docs and demo map (optional)

Use these paths only when working inside this repository.

- `.github/instructions/ngx-signal-forms-toolkit.instructions.md`
- `packages/toolkit/form-field/README.md`
- `packages/toolkit/form-field/THEMING.md`
- `apps/demo/src/app/04-form-field-wrapper/README.md`
- `apps/demo/src/app/04-form-field-wrapper/basic-usage/`
  - Shows the smallest happy path for wrapper adoption and the standard versus outline appearance comparison.
- `apps/demo/src/app/04-form-field-wrapper/complex-forms/`
  - Shows why the wrapper exists in production-style forms: nested objects, arrays, and dense layouts with less boilerplate.
- `apps/demo/src/app/04-form-field-wrapper/fieldset-grouping/`
  - Shows grouped summaries and fieldset-level validation placement.
- `apps/demo/src/app/04-form-field-wrapper/custom-controls/`
  - Shows wrapper integration with custom `FormValueControl` components.
- `apps/demo/src/app/05-advanced/advanced-wizard/`
  - Shows wrapper appearance carried consistently across step-based flows.

## Why this feature family exists

- Give consumers a production-ready field shell with automatic feedback, spacing, and consistent field presentation.
- Reduce repeated label-plus-input-plus-error markup while preserving Angular Signal Forms as the data model.
- Support grouped validation summaries and custom controls without forcing every consumer into a headless implementation.
