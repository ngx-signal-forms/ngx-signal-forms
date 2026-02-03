# Advanced Wizard (Travel Booking)

## Overview

Multi-step travel booking wizard showcasing form-per-step architecture, shared store state, cross-step validation, and auto-save. It is the most complex demo in the app.

## Form model

- Forms are created per step via `linkedSignal()` and `form()` factories.
- The store is the source of truth; step forms commit changes on navigation.

## Validation overview

**Errors**

- Traveler: first/last name required, email format, passport number required, passport expiry required and must be in the future, nationality required.
- Trip: at least one destination; country/city required; arrival date required and not in the past; departure date after arrival; at least one activity.
- Activity: name required, date required, duration must be non-negative.
- Requirement: description minimum length 3.
- Cross-field: activity date must be within destination date range.
- Cross-step: passport must be valid 6 months after last trip departure.

**Warnings**

- None.

## Toolkit usage

- `NgxSignalFormToolkit` for auto-ARIA and `novalidate`.
- `NgxFormField` wrapper for consistent layout and errors.

## Other tools

- Zod 4 schemas via `validateStandardSchema()`.
- NgRx Signal Store (`@ngrx/signals`) and rxjs interop (`rxMethod`).
- `@angular-architects/ngrx-toolkit` for `httpMutation()` and store mutations.
- MSW mock APIs in `apps/demo/src/mocks/*`.

## Key files

- `forms/traveler-step.form.ts` — traveler form + cross-step passport rule.
- `forms/trip-step.form.ts` — destinations, activities, and cross-field rules.
- `schemas/wizard.schemas.ts` — Zod schemas and factories.
- `stores/wizard.store.ts` — store composition and auto-save.
- `components/wizard-container.component.ts` — step navigation and commit flow.
- `components/*-step.component.ts` — step UI.

## How to test

1. Run the demo app.
2. Navigate to `/advanced-scenarios/advanced-wizard`.
3. Add a destination and activity, then set an invalid activity date.
4. Set a passport expiry before the trip end date to trigger cross-step validation.
