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
- Local `linkedSignal<T>(() => store.travelerDraft())` gives each form a writable model that follows the store's draft slice.
- A `signalMethod` on the store (`syncTravelerDraft`, `syncDestinationsDraft`) copies the typed model back into the draft slice. The step component calls it in a field initializer, so Angular destroys the effect with the component.
- Moving forward commits the active step: Next, or a click on a later step in the progress header. Both validate the step first. Previous, or a click on an earlier step, only moves back: the typed values stay in the draft. Autosave observes the draft and the committed data.
- `withLinkedState` on the store creates draft copies that reset when the committed data changes or a saved draft loads.

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
- Demonstrates the Angular 22 `effect((onCleanup) => …)` pattern for timed UI state (saving indicators).

## Architecture in brief

**Committed and in-progress state.** The store keeps both.

- Committed (`traveler`, `destinations`): set by Next. Step completion markers (`stepValidation`) and submit read only this.
- In progress (`travelerDraft`, `destinationsDraft`): what the user has typed. Step forms write here through the `signalMethod` write-back, and `canProceed` reads here because the current step is not committed yet.

Typing never marks a step as completed.

**No reset loop.** The form model is a `linkedSignal` over the draft, and the write-back changes that draft. The write-back hands over the same object the model already holds, so the `linkedSignal` sees no change and the field in focus keeps its value, caret and touched state. The trip form's `computation` returns the previous model when the array is the same one. The write-back has no debounce of its own, because autosave already debounces.

**Lazy steps.** Each step is a `@defer` block so step-specific dependencies (validation libraries, data lists) ship as separate chunks. A shared `WizardStepInterface` lets the container call `validateAndFocus()` / `commitToStore()` / `focusHeading()` on whichever step is currently loaded.

**Auto-save.** The store passes the `draftSummary` signal straight to an `rxMethod`, which tracks it and persists through `httpMutation`. The saved `WizardDraft` has the committed `traveler` and `destinations`, plus an optional `inProgress` part with what the user typed. Saving indicator uses the `onCleanup` effect pattern so debounced timers cancel on re-run.

**Dates.** Every date rule compares `Temporal.PlainDate` values from the `temporal-polyfill` package, through the helpers in `schemas/wizard.schemas.ts`. A `Date` built from `'YYYY-MM-DD'` is UTC midnight, but "today" is local, so a mix of the two moves a rule by one day east or west of UTC. Run `pnpm nx run demo:test-timezones` after a change to a date rule. In Vitest, `vi.setSystemTime()` also sets `Temporal.Now`. In Playwright it does not, because Chromium has native Temporal: the e2e timezone tests delete `globalThis.Temporal` in an init script before `page.clock.setFixedTime()`.

**Resume.** The store's `withStorageSync` keeps only the draft id in `sessionStorage`. The MSW mock server keeps the full drafts under its own `sessionStorage` key, in place of a server database. On each visit, `withResource` loads that draft through an `httpResource`, wrapped by `extendResource` with `withPreviousValueOnLoading()` and `withValueOnError(undefined)`. Committed `traveler` and `destinations` are `withLinkedState` over the loaded draft, so no effect copies it. The step buttons and fields stay disabled while the draft loads. A failed load shows an error, and the next save starts a new draft and clears the error. The committed slices come from the committed part of the draft. The draft slices come from the `inProgress` part. When a draft has no `inProgress` part, they come from the committed part. The form fields show the draft slices. So a reload brings back text typed in the current step. A step you did not finish with Next is not marked as completed. A reset clears both parts. A confirmed booking clears the stored draft id, so a reload starts empty.

## Key files

- [forms/traveler-step.form.ts](forms/traveler-step.form.ts) — traveler form + cross-step passport rule.
- [forms/trip-step.form.ts](forms/trip-step.form.ts) — destinations, activities, and cross-field rules.
- [forms/review-step.form.ts](forms/review-step.form.ts) — review-page data and the cross-step passport check.
- [schemas/wizard.schemas.ts](schemas/wizard.schemas.ts) — Zod schemas, factories, and the `Temporal.PlainDate` helpers.
- [stores/wizard.store.ts](stores/wizard.store.ts) — store composition, draft state, and auto-save.
- [stores/features/navigation.feature.ts](stores/features/navigation.feature.ts) — current step and `goToStep()`. Previous and Next live in `wizard-container.ts`.
- [stores/features/saved-draft.feature.ts](stores/features/saved-draft.feature.ts) — stored draft id and the draft resource.
- [components/wizard-container.ts](components/wizard-container.ts) — step navigation, commit flow, `@defer` coordination.
- `components/*-step.ts` — individual step UI implementations.

## Other tools

- **Zod 4** schemas via `validateStandardSchema()`.
- **NgRx Signal Store** (`@ngrx/signals`) for `withLinkedState()` and rxjs interop (`rxMethod`).
- **`@ngrx-toolkit/core`** for `withMutations()` and `httpMutation()`.
- **MSW** mock APIs in `apps/demo/src/mocks/*`.

## How to test

1. Run the demo and navigate to `/advanced-scenarios/advanced-wizard`.
2. Walk the traveler step with one required field empty — click NEXT and confirm focus lands on the first invalid field.
3. Fill the traveler step and advance; confirm the auto-save indicator appears briefly (effect `onCleanup` pattern).
4. On the trip step, add a destination and activity, then set an activity date outside the destination range — confirm the cross-field error.
5. Go back to traveler, set a passport expiry before the trip end — confirm the cross-step validation error on the review step.
6. Navigate away and back. The root-provided store survives route re-entry; re-entry alone does not reload server state. Test explicit reload separately.

## Related

- [Single-Model Wizard](../single-model-wizard/README.md) — the single-`form()`
  alternative to this demo's form-per-step architecture; read together for the contrast.
- [Cross-Field Validation](../cross-field-validation/README.md) — the simpler cross-field primer.
- [Submission Patterns](../submission-patterns/README.md) — declarative submission in a single-screen form.
- [Global Configuration](../global-configuration/README.md) — app-level defaults the wizard also consumes.
- [Autosave](../autosave/README.md) — the native `debounce()` schema rule replacing this wizard's own RxJS-based auto-save draft, for simple field-level cases.
