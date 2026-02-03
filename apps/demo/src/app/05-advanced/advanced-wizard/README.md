# Advanced Wizard Demo (Travel Booking Wizard)

## Overview

This demo is a multi-step travel booking wizard built to showcase advanced form and state patterns in Angular 21 Signal Forms, with a strong focus on the `@ngx-signal-forms/toolkit` UX and accessibility enhancements. It demonstrates form-per-step architecture, a single shared NgRx Signal Store, cross-step validation, and auto-save.

Route: `/advanced-scenarios/advanced-wizard`

Source: `apps/demo/src/app/05-advanced/advanced-wizard`

## Why this demo exists

This is the reference implementation for complex, real-world forms where:

- Each step has its own form logic and validation rules
- State must be shared across steps without prop drilling
- Cross-step validation depends on data from other steps
- Auto-save should be reliable and user-friendly
- Accessibility and error UX should be consistent and low-boilerplate

## Architecture at a glance

- **Single source of truth**: `WizardStore` composes navigation, traveler, and trip features.
- **Form-per-step**: Each step has a `.form.ts` factory using `linkedSignal()` so forms are writable locally but only committed on navigation.
- **Commit-before-navigation**: The container uses `viewChild()` to call `commitToStore()` on the active step before moving forward or backward.
- **Auto-save**: `rxMethod()` with debounce triggers `httpMutation()` draft saves, with a buffered UI status indicator.
- **MSW-backed API**: Mock endpoints simulate draft and booking APIs for development.

### Note on `linkedSignal()` vs `withLinkedState`

This demo intentionally uses Angular’s `linkedSignal()` inside the form factories to create writable form models that **do not** auto-sync back to the store. The store remains the source of truth, and changes are committed explicitly on navigation.

Use NgRx’s `withLinkedState` only when you need a **store slice** to be exposed as a linked writable signal inside the store itself. It still relies on Angular’s `linkedSignal()` under the hood and is not a replacement for form-level models.

## Toolkit usage highlights

- **Auto-ARIA and novalidate** via `NgxSignalFormToolkit`.
- **Consistent field layout** with `NgxFormField` wrappers.
- **Progressive disclosure** is aligned with the default on-touch strategy.
- **Custom cross-step feedback** in the passport expiry hint (the error is computed to avoid stale external-signal errors).

## Validation strategy

- **Zod 4 schemas** are used as Standard Schema validators through `validateStandardSchema()`.
- **Cross-field validation** uses `validate()` with `ctx.valueOf()` (activity date within destination date range).
- **Cross-step validation** uses a computed last-departure signal for the passport six-month rule.

## Key files

- `advanced-wizard.page.ts`: Page shell and route content.
- `advanced-wizard.content.ts`: Demo documentation content used by the UI.
- `components/wizard-container.component.ts`: Step navigation, commit logic, and auto-save indicator.
- `components/traveler-step.component.ts`: Toolkit field wrapper usage and passport rule display.
- `components/trip-step.component.ts`: Nested arrays with store-backed CRUD.
- `forms/traveler-step.form.ts`: Zod + cross-step passport rule.
- `forms/trip-step.form.ts`: Nested schema validation + cross-field rules.
- `forms/review-step.form.ts`: Read-only computed summary.
- `schemas/wizard.schemas.ts`: Zod schema definitions and factories.
- `stores/wizard.store.ts`: Store composition, auto-save, and submit mutations.
- `stores/features/*`: Feature slices (navigation, traveler, trip).
- `apps/demo/src/mocks/*`: MSW handlers and worker setup.

## Extending the wizard

1. Add a new step component and a corresponding `.form.ts` factory.
2. Add a store feature slice if the step needs its own state or CRUD methods.
3. Update `WIZARD_STEPS` and step metadata in the container.
4. Commit step data in `wizard-container.component.ts` before navigation.
5. Add schema validation and link fields using `id` attributes to preserve auto-ARIA behavior.

## Testing

- E2E scenarios are in `apps/demo-e2e/src/forms/05-advanced/advanced-wizard.spec.ts`.
- The test plan is documented in `apps/demo-e2e/src/forms/05-advanced/TEST_PLAN.md`.

## Related docs

- `docs/NESTED_FORM_ARRAYS_PATTERN.md`
- `packages/toolkit/README.md`
- `packages/toolkit/form-field/README.md`
