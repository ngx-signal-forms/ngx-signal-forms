# Advanced Wizard (Travel Booking)

## Intent

The most complex demo in the app: a three-step travel-booking wizard built on a **form-per-step** architecture, a shared NgRx Signal Store as source of truth, cross-field and cross-step validation, lazy-loaded step components, and auto-save on a draft state. This is the reference for putting every advanced toolkit feature together in one surface.

## Toolkit features showcased

- `NgxSignalFormToolkit` — shared form context across every step component.
- `NgxFormField` wrapper — consistent layout and errors across heterogeneous step forms.
- `createOnInvalidHandler()` + `validateAndFocus()` — focus-first-invalid on every NEXT click.
- `validateStandardSchema(path, zodSchema)` — Zod 4 schemas for structural rules.
- Per-step `form()` factories fed by a `linkedSignal()` reading from the store — bridges Angular's `WritableSignal` requirement with NgRx's `DeepSignal`.
- Cross-field validators (`validate(path, ctx => …)`) and cross-step validation (passport vs. trip dates).
- `@defer` block lazy-loading of step components, coordinated via a `WizardStepInterface` and a generic `viewChild`.

## Form model

- Each step owns its own `form()`: `TravelerStepForm`, `TripStepForm`.
- Local `linkedSignal<T>(() => store.stateSlice())` gives each form a writable, store-tracked model.
- Steps commit to the store on `NEXT`; the store auto-saves committed state.
- `withLinkedState` on the store creates draft copies that reset automatically when server state reloads.

## Validation rules

### Errors

- Traveler — first/last name required; email format; passport number required; passport expiry required and in the future; nationality required.
- Trip — at least one destination; country/city required; arrival date required and not in the past; departure date after arrival; at least one activity per destination.
- Activity — name required; date required; duration non-negative.
- Requirement — description min length 3.
- Cross-field — activity date must fall within its destination's date range.
- Cross-step — passport must remain valid at least 6 months after the last trip departure.

### Warnings

- None.

## Strong suites

- The only demo that exercises **cross-step** validation, not just cross-field — shows how to compose rules that depend on data from earlier steps.
- Models the "draft + commit" pattern that keeps step forms isolated from each other until the user explicitly advances.
- Proves that `@defer` + lazy step loading works without breaking the toolkit's form context or focus management.
- Demonstrates the Angular 21.1 `effect((onCleanup) => …)` pattern for timed UI state (saving indicators).

## Architecture in brief

**Draft vs. committed state.** The store holds committed state (source of truth) and a `withLinkedState` draft that auto-resets when committed state reloads. Step forms read from committed state via `linkedSignal`, mutate locally, and call `store.setXxx(model())` on NEXT. This keeps steps isolated until commit and makes undo/discard trivial.

**Lazy steps.** Each step is a `@defer` block so step-specific dependencies (validation libraries, data lists) ship as separate chunks. A shared `WizardStepInterface` lets the container call `validateAndFocus()` / `commitToStore()` / `focusHeading()` on whichever step is currently loaded.

**Auto-save.** The store watches `draftSummary()` and persists via `rxMethod` + `httpMutation`. Saving indicator uses the `onCleanup` effect pattern so debounced timers cancel on re-run.

## Key files

- [forms/traveler-step.form.ts](forms/traveler-step.form.ts) — traveler form + cross-step passport rule.
- [forms/trip-step.form.ts](forms/trip-step.form.ts) — destinations, activities, and cross-field rules.
- [schemas/wizard.schemas.ts](schemas/wizard.schemas.ts) — Zod schemas and factories.
- [stores/wizard.store.ts](stores/wizard.store.ts) — store composition, draft state, and auto-save.
- [components/wizard-container.ts](components/wizard-container.ts) — step navigation, commit flow, `@defer` coordination.
- `components/*-step.ts` — individual step UI implementations.

## Other tools

- **Zod 4** schemas via `validateStandardSchema()`.
- **NgRx Signal Store** (`@ngrx/signals`) and rxjs interop (`rxMethod`).
- **`@angular-architects/ngrx-toolkit`** for `httpMutation()` and linked state.
- **MSW** mock APIs in `apps/demo/src/mocks/*`.

## How to test

1. Run the demo and navigate to `/advanced-scenarios/advanced-wizard`.
2. Walk the traveler step with one required field empty — click NEXT and confirm focus lands on the first invalid field.
3. Fill the traveler step and advance; confirm the auto-save indicator appears briefly (effect `onCleanup` pattern).
4. On the trip step, add a destination and activity, then set an activity date outside the destination range — confirm the cross-field error.
5. Go back to traveler, set a passport expiry before the trip end — confirm the cross-step validation error on the review step.
6. Trigger a store reload (navigate away and back) and confirm drafts reset to committed state via `withLinkedState`.

## Related

- [Cross-Field Validation](../cross-field-validation/README.md) — the simpler cross-field primer.
- [Submission Patterns](../submission-patterns/README.md) — declarative submission in a single-screen form.
- [Global Configuration](../global-configuration/README.md) — app-level defaults the wizard also consumes.
