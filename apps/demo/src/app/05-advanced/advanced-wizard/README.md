# Advanced Wizard (Travel Booking)

## Overview

Multi-step travel booking wizard showcasing form-per-step architecture, shared store state, cross-step validation, and auto-save. It is the most complex demo in the app.

## Architectural Pattern: Draft State with Explicit Commit

This wizard implements a **draft state pattern** for managing form data in NgRx Signal Store. This pattern is recommended when:

- Forms live in child components but navigation controls are in a parent
- You need explicit control over when changes are persisted
- Auto-save should operate on drafts, not committed state

### Why This Pattern?

1. **Predictable data flow**: Changes are local until explicitly committed
2. **Auto-reset on server load**: `withLinkedState` automatically resets drafts when committed state changes
3. **Undo/discard support**: Users can abandon changes before committing
4. **Testable**: Clear boundaries between draft and committed state

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│ WizardStore                                                     │
│                                                                 │
│  withLinkedState:                                               │
│    traveler ──linked──▶ travelerDraft                           │
│    destinations ──────▶ destinationsDraft                       │
│                                                                 │
│  CRUD methods operate on draft signals                          │
│  Auto-save watches draftSummary()                               │
└─────────────────────────────────────────────────────────────────┘
              ▲                           ▲
              │                           │
┌─────────────┴───────────┐  ┌────────────┴──────────────┐
│ TravelerStepComponent   │  │ TripStepComponent         │
│                         │  │                           │
│ linkedSignal reads from │  │ linkedSignal reads from   │
│ store.traveler()        │  │ store.destinations()      │
│                         │  │                           │
│ commitToStore():        │  │ commitToStore():          │
│   store.setTraveler()   │  │   store.setDestinations() │
└─────────────────────────┘  └───────────────────────────┘
```

### Data Flow: Draft → Commit → Save

```
  ┌──────────┐      ┌──────────────┐      ┌───────────┐      ┌─────────┐
  │   User   │      │ Form (local) │      │   Store   │      │   API   │
  └────┬─────┘      └──────┬───────┘      └─────┬─────┘      └────┬────┘
       │                   │                    │                 │
       │   1. API loads data                    │◀────────────────┤
       │                   │◀───linkedSignal────┤                 │
       │                   │    auto-syncs      │                 │
       │                   │                    │                 │
       ├───2. User types───▶                    │                 │
       │                   │ (local changes)    │                 │
       │                   │                    │                 │
       ├───3. Click NEXT───▶                    │                 │
       │                   │──validate──┐       │                 │
       │                   │◀───────────┘       │                 │
       │                   │                    │                 │
       │              [if valid]                │                 │
       │                   ├──commitToStore()──▶│                 │
       │                   │                    ├──auto-save─────▶│
       │                   │                    │                 │
       │              [if invalid]              │                 │
       │◀──focus errors────┤                    │                 │
       │                   │                    │                 │
```

### Navigation Flow

```
    ┌──────────┐     NEXT      ┌──────────┐     NEXT      ┌──────────┐
    │ Traveler │──(valid)─────▶│   Trip   │──(valid)─────▶│  Review  │
    │   Step   │               │   Step   │               │   Step   │
    └──────────┘◀──PREVIOUS────└──────────┘◀──PREVIOUS────└──────────┘
         │                          │                          │
         │ NEXT (invalid)           │ NEXT (invalid)           │ SUBMIT (invalid)
         ▼                          ▼                          ▼
    focus first               focus first               show cross-step
    invalid field             invalid field             validation errors
```

### Pattern Implementation

```typescript
// Store feature (stores/features/traveler.feature.ts)
export function withTravelerManagement() {
  return signalStoreFeature(
    // Committed state (source of truth)
    withState<TravelerState>({ traveler: createEmptyTraveler() }),

    // Draft state linked to committed - auto-resets when source changes
    withLinkedState(({ traveler }) => ({
      travelerDraft: linkedSignal({
        source: traveler,
        computation: (committed) => structuredClone(committed),
      }),
    })),

    withMethods((store) => ({
      // Transfer draft to committed state
      commitTraveler(): void {
        patchState(store, { traveler: store.travelerDraft() });
      },
      // Revert draft to committed state
      discardTravelerChanges(): void {
        patchState(store, { travelerDraft: store.traveler() });
      },
    })),
  );
}
```

### Form Factory Pattern

Angular Signal Forms requires `WritableSignal`, but `withLinkedState` creates `DeepSignal`. Form factories use a local `linkedSignal` that reads from the store:

```typescript
// Form factory (forms/traveler-step.form.ts)
export function createTravelerStepForm(store: WizardStore) {
  // Local writable signal that reads from store
  const model = linkedSignal<Traveler>(() => store.traveler());

  const travelerForm = form(model, {
    firstName: [Validators.required],
    // ...
  });

  return { travelerForm, model }; // Return model for explicit commit
}

// Component commits on navigation
commitToStore(): void {
  this.#store.setTraveler(this.#model());
}
```

### Effect Cleanup Pattern (Angular 21.1)

For timed UI states (saving indicators, debounced actions), use the `onCleanup` callback:

```typescript
// Angular 21.1 pattern - automatic cleanup on effect re-run
effect((onCleanup) => {
  const isSaving = this.store.isSaving();

  if (isSaving) {
    const timeoutId = setTimeout(() => {
      this.showIndicator.set(true);
    }, DELAY_MS);

    onCleanup(() => clearTimeout(timeoutId)); // Cleanup when effect re-runs
  }
});
```

### Immutable Array Update Helpers

For deeply nested arrays, helper functions reduce spread nesting:

```typescript
// Instead of 4+ levels of spread:
function updateAt<T>(arr: T[], idx: number, updater: (item: T) => T): T[] {
  return arr.map((item, i) => (i === idx ? updater(item) : item));
}

// Compose for nested structures
function updateActivity(destinations, destIdx, actIdx, updater) {
  return updateAt(destinations, destIdx, (dest) => ({
    ...dest,
    activities: updateAt(dest.activities, actIdx, updater),
  }));
}
```

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
