# Nested Form Arrays with Angular Signal Forms & NgRx Signal Store

## Table of Contents

- [Problem Statement](#problem-statement)
- [Is This an Angular Signal Forms Issue?](#is-this-an-angular-signal-forms-issue)
- [Current Architecture (Problematic)](#current-architecture-problematic)
- [Recommended Solution: NgRx Toolkit with withMutations](#recommended-solution-ngrx-toolkit-with-withmutations)
- [Advanced: Reusable Custom Features](#advanced-reusable-custom-features-with-signalstorefeature)
- [Using withEntityResources for API-Backed Collections](#using-withentityresources-for-api-backed-collections)
- [Parent Component with Loading & Error States](#parent-component-with-loading--error-states)
- [Form-Store Sync: LinkedSignal (No Effect Mirroring)](#form-store-sync-linkedsignal-no-effect-mirroring)
- [Comparison: Basic vs NgRx Toolkit](#comparison-basic-vs-ngrx-toolkit)
- [Using Zod 4 for Type-Safe Models & Validation](#using-zod-4-for-type-safe-models--validation)
- [Summary](#summary)
- [Multi-Step Wizard Architecture](#multi-step-wizard-architecture)
- [Architecture Decision: Single Store vs Store per Step](#architecture-decision-single-store-vs-store-per-step)
- [When to Use Which NgRx Toolkit Feature](#when-to-use-which-ngrx-toolkit-feature)
- [Cross-Field Validation with validate() and ctx.valueOf()](#cross-field-validation-with-validate-and-ctxvalueof)
- [Auto-Save Pattern with rxMethod](#auto-save-pattern-with-rxmethod)
- [Toolkit Integration Improvements](#toolkit-integration-improvements)
- [Complete Best Practices Example: Prison Sentence Wizard](#complete-best-practices-example-prison-sentence-wizard)
- [Related Resources](#related-resources)

---

## Problem Statement

### The Challenge: Deeply Nested Form Arrays with CRUD at Every Level

When building forms with deeply nested arrays, a common architectural challenge emerges: **how should child components modify data without bubbling every change up through the component hierarchy?**

Consider a legal case entry form with this structure:

```
Parent Page (model signal)
└── Facts[] (add/remove at parent level)
    └── CriminalOffenses[] (add/remove at fact level)
        └── LegalArticles[] (add/remove at offense level)
```

**Concrete Example:** A prison sentence entry wizard where:

| Level | Entity            | CRUD Operations                         |
| ----- | ----------------- | --------------------------------------- |
| 1     | Facts             | Add/remove facts from parent page       |
| 2     | Criminal Offenses | Add/remove offenses within each fact    |
| 3     | Legal Articles    | Add/remove articles within each offense |

### Current (Problematic) Behavior

With Angular Signal Forms, the `form()` function binds to a `WritableSignal<T>` as the source of truth. When this signal lives in the parent component, all modifications bubble up:

1. **Add/remove fact:** `fact → parent.model.update()`
2. **Add/remove offense:** `offense → fact → parent.model.update()`
3. **Add/remove article:** `article → offense → fact → parent.model.update()`

This creates:

- **Tight coupling:** Child components need callbacks or event emitters for every action
- **Prop-drilling:** Passing handlers through multiple component layers
- **Limited autonomy:** Children cannot manage their own data lifecycle
- **Store sync issues:** If using a store, it's loaded once at initialization and becomes stale

### The Core Question

**How can child components perform CRUD operations on their nested arrays without:**

1. Bubbling every change through parent components via callbacks/events
2. Breaking Angular Signal Forms' single source of truth principle
3. Creating stale data between store and form state

### Solution Requirements

- ✅ Single source of truth (store owns the data)
- ✅ Direct store access from any component level
- ✅ Type-safe nested updates with immutable patterns
- ✅ Form reactively reflects store state
- ✅ Components can be tested in isolation
- ✅ Loading/error states per mutation

## Is This an Angular Signal Forms Issue?

**No.** This is an architectural decision about state ownership.

Angular Signal Forms has a fundamental design principle:

> **Your data signal IS the form model. The form is a reactive view of that model.**

The `form()` function takes a `WritableSignal<T>` and creates a reactive view. The form doesn't own the data—the signal does. The question becomes: **Who owns the signal, and how can nested components modify it?**

---

## Current Architecture (Problematic)

```
┌─────────────────────────────────────────────────────┐
│ Parent Component                                     │
│   #model = signal<Model>()                          │
│   form = form(#model, schema)                       │
│                                                      │
│   addFact()      → #model.update()                 │
│   removeFact()   → #model.update()                 │
│   addOffense()   → #model.update()   ← All here    │
│   removeOffense()→ #model.update()                 │
│   addArticle()   → #model.update()                 │
│   removeArticle()→ #model.update()                 │
│                                                      │
│   ┌─────────────────────────────────────────────┐  │
│   │ FactComponent (receives callbacks)           │  │
│   │   ┌───────────────────────────────────────┐ │  │
│   │   │ OffenseComponent (receives callbacks)  │ │  │
│   │   │   ┌─────────────────────────────────┐ │ │  │
│   │   │   │ ArticleComponent (receives cb)   │ │ │  │
│   │   │   └─────────────────────────────────┘ │ │  │
│   │   └───────────────────────────────────────┘ │  │
│   └─────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

**Issues:**

- All mutations bubble up to parent
- Prop-drilling through multiple component layers
- Tight coupling between components
- Difficult to test components in isolation

---

## Recommended Solution: NgRx Toolkit with withMutations

Using [NgRx Toolkit](https://ngrx-toolkit.angulararchitects.io/) provides a more structured approach with `withMutations` for CRUD operations. This follows Angular team guidance that **resources are for reading, mutations are for writing**.

### Store Definition with withMutations

```typescript
// facts.store.ts
import { computed, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import {
  httpMutation,
  rxMutation,
  withMutations,
} from '@angular-architects/ngrx-toolkit';
import { addEntity, removeEntity, updateEntity } from '@ngrx/signals/entities';

export type FactEntry = {
  id: number;
  factNumber: number;
  commitDate: string;
  offenses: CriminalOffense[];
};

export type CriminalOffense = {
  id: number;
  qualification: string;
  articles: LegalArticle[];
};

export type LegalArticle = {
  id: number;
  article: string;
};

type FactsState = {
  facts: FactEntry[];
  selectedFactId: number | null;
};

export const FactsStore = signalStore(
  { providedIn: 'root' },

  withState<FactsState>({
    facts: [createEmptyFact(1)],
    selectedFactId: null,
  }),

  withComputed((store) => ({
    factsCount: computed(() => store.facts().length),
    selectedFact: computed(() =>
      store.facts().find((f) => f.id === store.selectedFactId()),
    ),
  })),

  withMethods((store) => ({
    selectFact(factId: number): void {
      patchState(store, { selectedFactId: factId });
    },
  })),

  // Use withMutations for all CRUD operations
  withMutations((store, api = inject(FactsApiService)) => ({
    // Fact mutations
    addFact: rxMutation({
      operation: () => {
        const nextNumber =
          Math.max(...store.facts().map((f) => f.factNumber), 0) + 1;
        const newFact = createEmptyFact(nextNumber);
        return of(newFact);
      },
      onSuccess: (fact) => {
        patchState(store, (state) => ({
          facts: [...state.facts, fact],
        }));
      },
    }),

    removeFact: rxMutation({
      operation: (factId: number) => of(factId),
      onSuccess: (_, factId) => {
        patchState(store, (state) => ({
          facts: state.facts.filter((f) => f.id !== factId),
        }));
      },
    }),

    // Offense mutations (nested level 1)
    addOffense: rxMutation({
      operation: (params: { factId: number }) => {
        const newOffense = createEmptyOffense();
        return of({ ...params, offense: newOffense });
      },
      onSuccess: ({ factId, offense }) => {
        patchState(store, (state) => ({
          facts: state.facts.map((f) =>
            f.id === factId ? { ...f, offenses: [...f.offenses, offense] } : f,
          ),
        }));
      },
    }),

    removeOffense: rxMutation({
      operation: (params: { factId: number; offenseId: number }) => of(params),
      onSuccess: ({ factId, offenseId }) => {
        patchState(store, (state) => ({
          facts: state.facts.map((f) =>
            f.id === factId
              ? { ...f, offenses: f.offenses.filter((o) => o.id !== offenseId) }
              : f,
          ),
        }));
      },
    }),

    // Article mutations (nested level 2)
    addArticle: rxMutation({
      operation: (params: { factId: number; offenseId: number }) => {
        const newArticle = createEmptyArticle();
        return of({ ...params, article: newArticle });
      },
      onSuccess: ({ factId, offenseId, article }) => {
        patchState(store, (state) => ({
          facts: state.facts.map((f) =>
            f.id === factId
              ? {
                  ...f,
                  offenses: f.offenses.map((o) =>
                    o.id === offenseId
                      ? { ...o, articles: [...o.articles, article] }
                      : o,
                  ),
                }
              : f,
          ),
        }));
      },
    }),

    removeArticle: rxMutation({
      operation: (params: {
        factId: number;
        offenseId: number;
        articleId: number;
      }) => of(params),
      onSuccess: ({ factId, offenseId, articleId }) => {
        patchState(store, (state) => ({
          facts: state.facts.map((f) =>
            f.id === factId
              ? {
                  ...f,
                  offenses: f.offenses.map((o) =>
                    o.id === offenseId
                      ? {
                          ...o,
                          articles: o.articles.filter(
                            (a) => a.id !== articleId,
                          ),
                        }
                      : o,
                  ),
                }
              : f,
          ),
        }));
      },
    }),

    // Server sync mutation (httpMutation for actual API calls)
    saveToServer: httpMutation<void, { success: boolean }>({
      request: () => ({
        url: '/api/facts',
        method: 'POST',
        body: { facts: store.facts() },
      }),
      parse: (res) => res as { success: boolean },
      onSuccess: (response) => {
        console.log('Saved to server:', response);
      },
      onError: (error) => {
        console.error('Failed to save:', error);
      },
    }),
  })),
);
```

### Benefits of withMutations

| Feature              | Benefit                                                       |
| -------------------- | ------------------------------------------------------------- |
| `rxMutation`         | Local/synchronous operations with Observable support          |
| `httpMutation`       | HTTP operations without RxJS boilerplate                      |
| `onSuccess` callback | Centralized state updates after successful operations         |
| `onError` callback   | Centralized error handling                                    |
| State signals        | `isPending`, `status`, `error` signals per mutation           |
| Flattening operators | `concatOp`, `exhaustOp`, `mergeOp`, `switchOp` for race conds |

---

## Advanced: Reusable Custom Features with signalStoreFeature

For nested arrays that follow the same pattern, create reusable features:

### Generic Nested Array Feature

```typescript
// nested-array.feature.ts
import { computed, Signal } from '@angular/core';
import {
  patchState,
  signalStoreFeature,
  withComputed,
  withMethods,
  type,
} from '@ngrx/signals';

export type HasId = { id: number };

/**
 * Creates a reusable feature for managing nested arrays
 * Works for any parent/child relationship with id-based entities
 */
export function withNestedArrayCrud<
  Parent extends HasId & { [K in ChildKey]: Child[] },
  Child extends HasId,
  ChildKey extends keyof Parent,
>(config: {
  parentSignal: Signal<Parent[]>;
  childKey: ChildKey;
  createChild: () => Child;
}) {
  return signalStoreFeature(
    withMethods((store) => ({
      addChild(parentId: number): void {
        const newChild = config.createChild();
        patchState(store, (state: { [key: string]: Parent[] }) => {
          const parents = state[Object.keys(state)[0]] as Parent[];
          return {
            [Object.keys(state)[0]]: parents.map((p) =>
              p.id === parentId
                ? { ...p, [config.childKey]: [...p[config.childKey], newChild] }
                : p,
            ),
          };
        });
      },

      removeChild(parentId: number, childId: number): void {
        patchState(store, (state: { [key: string]: Parent[] }) => {
          const parents = state[Object.keys(state)[0]] as Parent[];
          return {
            [Object.keys(state)[0]]: parents.map((p) =>
              p.id === parentId
                ? {
                    ...p,
                    [config.childKey]: (p[config.childKey] as Child[]).filter(
                      (c) => c.id !== childId,
                    ),
                  }
                : p,
            ),
          };
        });
      },
    })),
  );
}
```

### Using withFeature for Flexible Composition

```typescript
// facts.store.ts
import { signalStore, withFeature, withState } from '@ngrx/signals';

export const FactsStore = signalStore(
  { providedIn: 'root' },

  withState<FactsState>({ facts: [createEmptyFact(1)] }),

  // Use withFeature to pass signals to custom features
  withFeature(({ facts }) => withOffensesCrud(facts)),
  withFeature(({ facts }) => withArticlesCrud(facts)),
);

// Custom feature for offense CRUD
function withOffensesCrud(facts: Signal<FactEntry[]>) {
  return signalStoreFeature(
    withMethods((store) => ({
      addOffense(factId: number): void {
        // Implementation with access to facts signal
        patchState(store, (state) => ({
          facts: facts().map((f) =>
            f.id === factId
              ? { ...f, offenses: [...f.offenses, createEmptyOffense()] }
              : f,
          ),
        }));
      },
      removeOffense(factId: number, offenseId: number): void {
        patchState(store, (state) => ({
          facts: facts().map((f) =>
            f.id === factId
              ? { ...f, offenses: f.offenses.filter((o) => o.id !== offenseId) }
              : f,
          ),
        }));
      },
    })),
  );
}
```

---

## Using withEntityResources for API-Backed Collections

When your nested arrays come from an API, use `withEntityResources` with `httpResource` for automatic entity management:

```typescript
// facts-api.store.ts
import { httpResource } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { addEntity, removeEntity, updateEntity } from '@ngrx/signals/entities';
import {
  withEntityResources,
  withMutations,
  httpMutation,
} from '@angular-architects/ngrx-toolkit';
import { z } from 'zod';
import { FactEntrySchema } from './facts.schemas';

export const FactsApiStore = signalStore(
  { providedIn: 'root' },

  withState({ filter: '', selectedFactId: null as number | null }),

  // Load facts as entities from API using httpResource (Angular 19+)
  withEntityResources(() =>
    httpResource<FactEntry[]>({
      url: '/api/facts',
      defaultValue: [],
    }),
  ),

  withMethods((store) => ({
    setFilter(filter: string): void {
      patchState(store, { filter });
    },
  })),

  // Mutations for CRUD operations with Zod parsing
  withMutations((store) => ({
    addFact: httpMutation<FactEntry, FactEntry>({
      request: (fact) => ({
        url: '/api/facts',
        method: 'POST',
        body: fact,
      }),
      // Type-safe parsing with Zod validation
      parse: (raw) => FactEntrySchema.parse(raw),
      onSuccess: (fact) => {
        patchState(store, addEntity(fact));
      },
    }),

    updateFact: httpMutation<
      { id: number; changes: Partial<FactEntry> },
      FactEntry
    >({
      request: ({ id, changes }) => ({
        url: `/api/facts/${id}`,
        method: 'PATCH',
        body: changes,
      }),
      parse: (raw) => FactEntrySchema.parse(raw),
      onSuccess: (fact) => {
        patchState(store, updateEntity({ id: fact.id, changes: fact }));
      },
    }),

    removeFact: httpMutation<number, boolean>({
      request: (id) => ({
        url: `/api/facts/${id}`,
        method: 'DELETE',
      }),
      // No body to parse for DELETE
      parse: () => true,
      onSuccess: (_, id) => {
        patchState(store, removeEntity(id));
      },
    }),
  })),
);
```

### Store Signals Available

With `withEntityResources`, your store automatically provides:

| Signal        | Description                         |
| ------------- | ----------------------------------- |
| `entities()`  | Array of all entities               |
| `entityMap()` | Map of id → entity                  |
| `ids()`       | Array of entity IDs                 |
| `isLoading()` | Loading state from httpResource     |
| `error()`     | Error state from httpResource       |
| `hasValue()`  | Type guard for value                |
| `_reload()`   | Manual reload method (after errors) |

With `withMutations`, each mutation gets these signals:

| Signal              | Description                                         |
| ------------------- | --------------------------------------------------- |
| `{name}IsPending()` | `true` while mutation is in progress                |
| `{name}Status()`    | `'idle'` \| `'pending'` \| `'success'` \| `'error'` |
| `{name}Error()`     | Error object if mutation failed                     |

---

## Parent Component with Loading & Error States

```typescript
@Component({
  providers: [FactsStore],
  template: `
    <!-- Loading state from httpResource -->
    @if (store.isLoading()) {
      <div class="loading-overlay" role="status" aria-live="polite">
        <span class="spinner"></span>
        Loading facts...
      </div>
    }

    <!-- Error state from httpResource -->
    @if (store.error(); as error) {
      <div class="error-banner" role="alert">
        <p>Failed to load facts: {{ error.message }}</p>
        <button type="button" (click)="store._reload()">Retry</button>
      </div>
    }

    <!-- Mutation error state -->
    @if (store.saveToServerError(); as mutationError) {
      <div class="error-banner" role="alert">
        <p>Failed to save: {{ mutationError.message }}</p>
      </div>
    }

    <form novalidate (submit)="save($event)">
      @for (fact of store.entities(); track fact.id; let i = $index) {
        <app-fact-card [factId]="fact.id" [factField]="factsForm.facts()[i]" />
      }

      <button
        type="button"
        (click)="store.addFact()"
        [disabled]="store.addFactIsPending() || store.isLoading()"
        [attr.aria-busy]="store.addFactIsPending()"
      >
        @if (store.addFactIsPending()) {
          <span class="spinner"></span> Adding...
        } @else {
          Add Fact
        }
      </button>

      <button
        type="submit"
        [disabled]="store.saveToServerIsPending() || store.isLoading()"
        [attr.aria-busy]="store.saveToServerIsPending()"
      >
        @if (store.saveToServerIsPending()) {
          <span class="spinner"></span> Saving...
        } @else {
          Save
        }
      </button>
    </form>
  `,
})
export class ParentComponent {
  protected readonly store = inject(FactsStore);

  // Connect store entities to form (entities() is provided by withEntityResources)
  readonly #model = computed(() => ({ facts: this.store.entities() }));

  // Create form from store-derived signal
  protected readonly factsForm = form(this.#model, schema);

  protected async save(event: Event): Promise<void> {
    event.preventDefault();
    try {
      await this.store.saveToServer();
    } catch (error) {
      // Error is captured in store.saveToServerError()
      console.error('Save failed:', error);
    }
  }
}
```

### Child Component (FactCard)

```typescript
@Component({
  selector: 'app-fact-card',
  template: `
    <button
      type="button"
      (click)="remove()"
      [disabled]="store.removeFactIsPending()"
    >
      Remove Fact
    </button>

    @for (offense of factField().offenses(); track offense.id; let j = $index) {
      <app-offense-card
        [factId]="factId()"
        [offenseId]="offense.id"
        [offenseField]="factField().offenses()[j]"
      />
    }

    <button
      type="button"
      (click)="addOffense()"
      [disabled]="store.addOffenseIsPending()"
    >
      Add Offense
    </button>
  `,
})
export class FactCardComponent {
  readonly #store = inject(FactsStore); // Direct injection!

  readonly factId = input.required<number>();
  readonly factField = input.required<FieldTree<FactEntry>>();

  protected get store() {
    return this.#store;
  }

  protected remove(): void {
    this.#store.removeFact(this.factId()); // Direct call, no bubbling
  }

  protected addOffense(): void {
    this.#store.addOffense({ factId: this.factId() }); // Direct call
  }
}
```

### Architecture After

```
┌─────────────────────────────────────────────────────┐
│ FactsStore (NgRx Signal Store + Toolkit)            │
│   state: { facts: FactEntry[] }                     │
│                                                      │
│   withMutations:                                     │
│     addFact    → rxMutation   │ isPending signal   │
│     removeFact → rxMutation   │ status signal      │
│     addOffense → rxMutation   │ error signal       │
│     saveToServer → httpMutation                     │
└─────────────────────────────────────────────────────┘
           ↑              ↑              ↑
     inject()        inject()       inject()
           │              │              │
┌──────────┴──────────────┴──────────────┴────────────┐
│ Parent            Fact            Offense           │
│ Component         Component       Component         │
│                                                      │
│ form(storeState)  addOffense()    addArticle()     │
│ addFact()         removeFact()    removeOffense()  │
└─────────────────────────────────────────────────────┘
```

**Benefits:**

- No prop-drilling or event bubbling
- Each component calls store methods directly
- Store is the single source of truth
- Form reflects store state reactively
- Components are easier to test in isolation
- Built-in loading/error states per mutation
- Race condition handling with flattening operators

---

## Form-Store Sync: LinkedSignal (No Effect Mirroring)

### Basic Pattern: Component-Level Link

When using NgRx Signal Store with Angular Signal Forms, use `linkedSignal()` in your component (or form factory) to create a **writable form model** derived from store state. Avoid using `effect()` to mirror values between signals.

```typescript
// facts-step.form.ts
export function createFactsStepForm(store: InstanceType<typeof WizardStore>) {
  // Local model linked to store (store is source of truth)
  const model = linkedSignal<FactsStepData>(() => ({
    facts: store.facts(),
  }));

  // Form binds to this local model
  return form(model, ...);
}
```

### Advanced Pattern: The Draft State (withLinkedState)

For user experiences like **Wizards** or **Editable Data Grids**, a cleaner architectural pattern is to enforce the "Draft" concept in the store itself using `withLinkedState`.

This pattern separates **Committed State** (canonical data) from **Draft State** (user edits).

1.  **Committed State**: The "real" data (saved to server or confirmed).
2.  **Draft State**: A temporary, mutable copy the user works on.
3.  **Commit**: Copy Draft → Committed (on "Next" or "Save").
4.  **Discard**: Reset Draft ← Committed (on "Cancel").

#### Store Implementation

```typescript
import {
  signalStoreFeature,
  withState,
  withLinkedState,
  withMethods,
  patchState,
} from '@ngrx/signals';
import { linkedSignal } from '@angular/core';

export function withTravelerManagement() {
  return signalStoreFeature(
    withState({ traveler: createEmptyTraveler() }), // Committed state

    // Draft state linked to committed
    // structuredClone ensures deep copy for immutability
    withLinkedState(({ traveler }) => ({
      travelerDraft: linkedSignal({
        source: traveler,
        computation: (committed) => structuredClone(committed),
      }),
    })),

    withMethods((store) => ({
      // Edit: updates DRAFT only
      updateTraveler(changes: Partial<Traveler>): void {
        patchState(store, (state) => ({
          travelerDraft: { ...state.travelerDraft, ...changes },
        }));
      },

      // Commit: Draft → Committed
      commitTraveler(): void {
        patchState(store, { traveler: store.travelerDraft() });
      },

      // Discard: Trigger reset via linkedSignal logic
      // By resetting draft to source explicitly (or relying on source change)
      discardChanges(): void {
        patchState(store, { travelerDraft: store.traveler() });
      },
    })),
  );
}
```

#### Benefits of Draft State

1.  **Atomic Commits**: The "real" state only changes when valid and confirmed.
2.  **Cancellation**: Trivial to revert changes (just read committed state again).
3.  **Derived Stability**: Expensive computations on "Committed" state don't re-run on every keystroke in the Draft.
4.  **Form Simplicity**: The form binds to `draft` and pushes updates to `draft`.

### Summary: Which Pattern to Use?

| Pattern              | Use When...                                   | Logic Location | Implementation                             |
| :------------------- | :-------------------------------------------- | :------------- | :----------------------------------------- |
| **Component Linked** | Simple forms, immediate updates               | Component      | `model = linkedSignal(() => store.data())` |
| **Store Draft**      | Wizards, complex validation, "Cancel" support | Store Feature  | `withLinkedState(...)`                     |

### Pattern: Form Factory with linkedSignal

(Deprecated in favor of Store Draft pattern for complex wizards, but valid for simple forms)

```typescript
// facts-step.form.ts
import { computed, linkedSignal, type Signal } from '@angular/core';
import {
  applyEach,
  type FieldTree,
  form,
  validate,
  validateStandardSchema,
} from '@angular/forms/signals';

import { FactEntrySchema, type FactEntry } from '../schemas/wizard.schemas';
import type { WizardStore } from '../stores/wizard.store';

/** Facts step data structure */
export type FactsStepData = {
  facts: FactEntry[];
};

export type FactsStepForm = FieldTree<FactsStepData>;

/**
 * Creates facts step form with Zod validation via StandardSchema.
 *
 * The store is the source of truth — form provides reactive validation
 * and FieldTree for toolkit error/field components.
 */
export function createFactsStepForm(store: InstanceType<typeof WizardStore>): {
  form: FactsStepForm;
  hasFacts: Signal<boolean>;
  isValid: Signal<boolean>;
} {
  // Local model linked to store (store is source of truth)
  const model = linkedSignal<FactsStepData>(() => ({
    facts: store.facts(),
  }));

  // Form with nested array validation using StandardSchema
  const factsForm = form(model, (path) => {
    applyEach(path.facts, (factPath) => {
      validateStandardSchema(factPath, FactEntrySchema);

      applyEach(factPath.offenses, (offensePath) => {
        // Cross-field: offense date within fact date range
        validate(offensePath.commitDate, (ctx) => {
          const factDate = ctx.valueOf(factPath.commitDate);
          const offenseDate = ctx.value();

          if (!factDate || !offenseDate) return null;
          if (new Date(offenseDate) < new Date(factDate)) {
            return {
              kind: 'offense_before_fact',
              message: 'Offense date cannot be before fact date',
            };
          }
          return null;
        });
      });
    });
  });

  return {
    form: factsForm,
    hasFacts: computed(() => model().facts.length > 0),
    isValid: computed(() => !factsForm().invalid() && model().facts.length > 0),
  };
}
```

### Component: Commit Changes via Store Methods

```typescript
// facts-step.component.ts
@Component({
  selector: 'app-facts-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, NgxSignalFormToolkit, NgxFormField],
  template: `
    <form novalidate (submit)="onSubmit($event)">
      @for (fact of store.facts(); track fact.id; let i = $index) {
        <app-fact-card [factIndex]="i" [factField]="factsForm.facts[i]" />
      }
      <button type="button" (click)="store.addFact()">Add Fact</button>
      <button type="submit">Save Facts</button>
    </form>
  `,
})
export class FactsStepComponent {
  protected readonly store = inject(WizardStore);
  readonly #factsStepForm = createFactsStepForm(this.store);

  protected readonly factsForm = this.#factsStepForm.form;
  protected readonly hasFacts = this.#factsStepForm.hasFacts;

  protected onSubmit(event: Event): void {
    event.preventDefault();
    if (this.factsForm().valid()) {
      this.store.setFacts(this.factsForm().value().facts);
    }
  }

  constructor() {
    // Side effects only (HTTP, persistence, analytics)
    effect(() => {
      if (this.factsForm().dirty()) {
        this.store.autoSave(this.store.wizardSummary());
      }
    });
  }
}
```

---

## Comparison: Basic vs NgRx Toolkit

| Feature             | Basic `withMethods`  | NgRx Toolkit `withMutations`  |
| ------------------- | -------------------- | ----------------------------- |
| Local state updates | ✅                   | ✅                            |
| HTTP operations     | Manual HttpClient    | `httpMutation` (simplified)   |
| Loading states      | Manual signals       | Auto `isPending`, `status`    |
| Error handling      | Manual try/catch     | `onError` callback            |
| Race conditions     | Manual               | `concatOp`, `exhaustOp`, etc. |
| Awaitable           | ❌                   | ✅ Returns `Promise`          |
| Reusable features   | `signalStoreFeature` | `signalStoreFeature`          |
| Entity management   | `withEntities`       | `withEntityResources`         |

---

## Using Zod 4 for Type-Safe Models & Validation

[Zod 4](https://zod.dev) provides runtime validation with TypeScript type inference. Use it for:

1. **Model definitions** with `z.infer<typeof schema>` for both runtime validation and static types
2. **API response parsing** in `httpMutation` parse functions with proper error handling
3. **Form field validation** for custom validators beyond Angular's built-in validators

### Defining Models with Zod Schemas

```typescript
// facts.schemas.ts
import { z } from 'zod';

// Define schemas with runtime validation
export const LegalArticleSchema = z.object({
  id: z.number(),
  article: z.string().min(1, 'Article is required'),
});

export const CriminalOffenseSchema = z.object({
  id: z.number(),
  qualification: z.string().min(1, 'Qualification is required'),
  get articles() {
    return z.array(LegalArticleSchema);
  },
});

export const FactEntrySchema = z.object({
  id: z.number(),
  factNumber: z.number().min(1),
  commitDate: z.string().datetime({ offset: true }).optional(),
  get offenses() {
    return z.array(CriminalOffenseSchema);
  },
});

// Infer TypeScript types from schemas (single source of truth)
export type LegalArticle = z.infer<typeof LegalArticleSchema>;
export type CriminalOffense = z.infer<typeof CriminalOffenseSchema>;
export type FactEntry = z.infer<typeof FactEntrySchema>;

// API response schema with metadata
export const FactsApiResponseSchema = z.object({
  data: z.array(FactEntrySchema),
  meta: z.object({
    total: z.number(),
    page: z.number(),
  }),
});
```

### Type-Safe API Parsing in httpMutation

Use Zod's `safeParse` in the `parse()` function for runtime validation with proper error handling:

```typescript
import { z } from 'zod';
import { FactEntrySchema, FactsApiResponseSchema } from './facts.schemas';

export const FactsApiStore = signalStore(
  { providedIn: 'root' },

  withState({
    filter: '',
    selectedFactId: null as number | null,
    parseError: null as z.ZodError | null, // Track validation errors
  }),

  withEntityResources(() =>
    httpResource<FactEntry[]>({
      url: '/api/facts',
      defaultValue: [],
    }),
  ),

  withMutations((store) => ({
    addFact: httpMutation<FactEntry, FactEntry>({
      request: (fact) => ({
        url: '/api/facts',
        method: 'POST',
        body: fact,
      }),
      // Use Zod for type-safe parsing with validation
      parse: (raw) => {
        const result = FactEntrySchema.safeParse(raw);
        if (!result.success) {
          // Log or store validation errors
          console.error(
            'API response validation failed:',
            z.prettifyError(result.error),
          );
          patchState(store, { parseError: result.error });
          throw new Error(
            `Invalid API response: ${result.error.issues[0]?.message}`,
          );
        }
        patchState(store, { parseError: null });
        return result.data;
      },
      onSuccess: (fact) => {
        patchState(store, addEntity(fact));
      },
    }),

    loadFacts: httpMutation<void, FactEntry[]>({
      request: () => ({
        url: '/api/facts',
        method: 'GET',
      }),
      parse: (raw) => {
        // Parse full API response with metadata
        const result = FactsApiResponseSchema.safeParse(raw);
        if (!result.success) {
          console.error(
            'Facts API response invalid:',
            z.prettifyError(result.error),
          );
          throw new Error('Invalid facts response from server');
        }
        return result.data.data; // Return just the entities
      },
      onSuccess: (facts) => {
        patchState(store, setAllEntities(facts));
      },
    }),
  })),
);
```

### Native Zod Integration via StandardSchema (Angular 21+)

Angular Signal Forms natively supports [Standard Schema](https://standardschema.dev/) libraries like Zod, Valibot, and ArkType via `validateStandardSchema()`. No custom adapters needed.

```typescript
import { z } from 'zod';
import {
  form,
  validateStandardSchema,
  applyEach,
} from '@angular/forms/signals';

// Zod schema with business rules
const FactFormSchema = z.object({
  factNumber: z.number().min(1).max(999),
  commitDate: z.string().refine((date) => new Date(date) <= new Date(), {
    message: 'Commit date cannot be in the future',
  }),
  offenses: z
    .array(
      z.object({
        qualification: z.string().min(3, 'Min 3 characters'),
        articles: z
          .array(z.object({ article: z.string().min(1) }))
          .min(1, 'At least one article required'),
      }),
    )
    .min(1, 'At least one offense required'),
});

// Separated schemas for nested validation
const OffenseSchema = z.object({
  qualification: z.string().min(3, 'Min 3 characters'),
  articles: z
    .array(z.object({ article: z.string().min(1) }))
    .min(1, 'At least one article required'),
});

type FactFormModel = z.infer<typeof FactFormSchema>;

@Component({
  template: `
    <form novalidate (submit)="save($event)">
      <input type="number" [formField]="factForm.factNumber" />
      @if (factForm.factNumber().invalid() && factForm.factNumber().touched()) {
        <span class="error">{{
          factForm.factNumber().errors()[0]?.message
        }}</span>
      }

      <input type="date" [formField]="factForm.commitDate" />
      @if (factForm.commitDate().invalid() && factForm.commitDate().touched()) {
        <span class="error">{{
          factForm.commitDate().errors()[0]?.message
        }}</span>
      }
    </form>
  `,
})
export class FactFormComponent {
  readonly #store = inject(FactsStore);
  readonly #model = computed(
    () => this.#store.selectedFact() ?? createEmptyFact(1),
  );

  // Form with native StandardSchema validation - Zod schemas work directly!
  protected readonly factForm = form(this.#model, (path) => {
    // Validate entire form with Zod schema
    validateStandardSchema(path, FactFormSchema);

    // Or validate nested arrays individually
    applyEach(path.offenses, (offensePath) => {
      validateStandardSchema(offensePath, OffenseSchema);
    });
  });
}
```

### Benefits of Zod Integration

| Feature                  | Benefit                                                    |
| ------------------------ | ---------------------------------------------------------- |
| Single source of truth   | Schema defines both runtime validation AND TypeScript type |
| `z.infer<typeof schema>` | No duplicate type definitions                              |
| `safeParse()`            | Non-throwing validation with detailed error info           |
| `z.prettifyError()`      | Human-readable error messages                              |
| Recursive schemas        | Native support via getter pattern                          |
| `.extend()`, `.pick()`   | Derive schemas for partial forms or DTOs                   |
| Coercion (`z.coerce.*`)  | Auto-convert strings to numbers/dates from forms           |

### Zod Error Display in Templates

```typescript
@Component({
  template: `
    <!-- Display all Zod validation errors -->
    @if (parseErrors(); as errors) {
      <div class="validation-errors" role="alert">
        <h4>Validation Errors:</h4>
        <ul>
          @for (error of errors; track error.path.join('.')) {
            <li>
              <strong>{{ error.path.join('.') }}:</strong> {{ error.message }}
            </li>
          }
        </ul>
      </div>
    }
  `,
})
export class ValidationErrorsComponent {
  protected readonly store = inject(FactsStore);

  protected readonly parseErrors = computed(() => {
    const error = this.store.parseError();
    return error?.issues ?? null;
  });
}
```

---

## Summary

| Aspect                                   | Assessment                                                                 |
| ---------------------------------------- | -------------------------------------------------------------------------- |
| **Is this an Angular Signal Forms bug?** | No                                                                         |
| **Root cause**                           | Architectural decision: single model signal at parent level                |
| **Recommended fix**                      | Use NgRx Signal Store with `signalStoreFeature` composition                |
| **For nested CRUD**                      | Use `withState` + `withMethods` (NOT `withEntityResources`)                |
| **For API calls**                        | Use `httpMutation` from `@angular-architects/ngrx-toolkit`                 |
| **For type-safe validation**             | Zod 4 schemas + `validateStandardSchema()` + `validate()` with `valueOf()` |
| **For multi-step wizard**                | Single root store with `signalStoreFeature` slices per domain              |
| **Store architecture**                   | Hybrid: single store + composable features (NOT store per step)            |
| **Form ↔ Store sync**                    | `linkedSignal()` provides writable form model; no effect-based mirroring   |
| **Auto-save**                            | `rxMethod` with `debounceTime` + `distinctUntilChanged`                    |
| **Cross-field validation**               | `validate(path, ctx => ctx.valueOf(otherPath))` pattern                    |
| **Toolkit integration**                  | `NgxSignalFormFieldWrapperComponent`, `showErrors()`, error strategies     |

**Key Insights:**

1. **Data ownership:** Store owns the data; form provides reactive FieldTree for UI. Child components call store methods directly via `inject()` — no prop-drilling or event bubbling.

2. **Single source of truth:** Use Zod schemas for both TypeScript types (`z.infer<typeof schema>`) and runtime validation. Zod works natively with Angular Signal Forms via `validateStandardSchema()`.

3. **Wizard state:** Use **ONE** `signalStore` with `signalStoreFeature` composition for multi-step wizards. Cross-step validation and atomic submission require shared state.

4. **Form-Store synchronization:** Use `linkedSignal()` to create a writable form model derived from store state. Reserve `effect()` for external side effects.

5. **When to use which feature:**
   - `withState` + `withMethods`: Local nested CRUD operations
   - `httpMutation`: REST API calls to Java backend
   - `withEntityResources`: Flat entity lists from API (NOT for nested forms)
   - `rxMethod`: Reactive auto-save with debounce
   - `validate()` + `valueOf()`: Cross-field validation referencing other paths

6. **Toolkit benefits:** `@ngx-signal-forms/toolkit` provides `NgxSignalFormFieldWrapperComponent` for consistent field layout, automatic ARIA attributes via `NgxSignalFormAutoAriaDirective`, and `showErrors()` utility with strategies (`'on-touch'`, `'on-submit'`, `'immediate'`).

---

## Multi-Step Wizard Architecture

When the nested form is part of a multi-step wizard (e.g., Person Info → Facts → Review), the architecture decisions become more complex.

### Recommended: Single Root Store with Step Slices

**Use ONE store** for the entire wizard with feature slices per step. This ensures:

- Single source of truth across all steps
- Easy navigation back/forward with preserved state
- Atomic submission of complete data
- Shared validation across steps

```typescript
// wizard.schemas.ts
import { z } from 'zod';

export const PersonInfoSchema = z.object({
  firstName: z.string().min(1, 'First name required'),
  lastName: z.string().min(1, 'Last name required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
});

export const FactEntrySchema = z.object({
  id: z.number(),
  factNumber: z.number().min(1),
  commitDate: z.string().optional(),
  get offenses() {
    return z.array(CriminalOffenseSchema);
  },
});

export const WizardDataSchema = z.object({
  personInfo: PersonInfoSchema,
  facts: z.array(FactEntrySchema),
  reviewed: z.boolean(),
});

export type PersonInfo = z.infer<typeof PersonInfoSchema>;
export type FactEntry = z.infer<typeof FactEntrySchema>;
export type WizardData = z.infer<typeof WizardDataSchema>;
```

### Store Architecture: signalStoreFeature Composition

```typescript
// wizard.store.ts
import { computed, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  signalStoreFeature,
  withComputed,
  withFeature,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import {
  httpMutation,
  rxMutation,
  withMutations,
} from '@angular-architects/ngrx-toolkit';
import { z } from 'zod';

// Step navigation state
type WizardStep = 'person-info' | 'facts' | 'review';

interface WizardNavigationState {
  currentStep: WizardStep;
  visitedSteps: WizardStep[];
  stepValidation: Record<WizardStep, boolean>;
}

// Feature: Navigation
function withWizardNavigation() {
  return signalStoreFeature(
    withState<WizardNavigationState>({
      currentStep: 'person-info',
      visitedSteps: ['person-info'],
      stepValidation: {
        'person-info': false,
        facts: false,
        review: false,
      },
    }),

    withComputed((store) => ({
      canProceed: computed(() => store.stepValidation()[store.currentStep()]),
      isFirstStep: computed(() => store.currentStep() === 'person-info'),
      isLastStep: computed(() => store.currentStep() === 'review'),
      progress: computed(() => {
        const steps: WizardStep[] = ['person-info', 'facts', 'review'];
        const currentIndex = steps.indexOf(store.currentStep());
        return ((currentIndex + 1) / steps.length) * 100;
      }),
    })),

    withMethods((store) => ({
      goToStep(step: WizardStep): void {
        if (store.visitedSteps().includes(step) || store.canProceed()) {
          patchState(store, {
            currentStep: step,
            visitedSteps: [...new Set([...store.visitedSteps(), step])],
          });
        }
      },

      nextStep(): void {
        const steps: WizardStep[] = ['person-info', 'facts', 'review'];
        const currentIndex = steps.indexOf(store.currentStep());
        if (currentIndex < steps.length - 1 && store.canProceed()) {
          this.goToStep(steps[currentIndex + 1]);
        }
      },

      previousStep(): void {
        const steps: WizardStep[] = ['person-info', 'facts', 'review'];
        const currentIndex = steps.indexOf(store.currentStep());
        if (currentIndex > 0) {
          this.goToStep(steps[currentIndex - 1]);
        }
      },

      markStepValid(step: WizardStep, isValid: boolean): void {
        patchState(store, (state) => ({
          stepValidation: { ...state.stepValidation, [step]: isValid },
        }));
      },
    })),
  );
}

// Feature: Person Info (Step 1)
function withPersonInfo() {
  const initialPersonInfo: PersonInfo = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  };

  return signalStoreFeature(
    withState({ personInfo: initialPersonInfo }),

    withComputed((store) => ({
      personInfoValid: computed(() => {
        const result = PersonInfoSchema.safeParse(store.personInfo());
        return result.success;
      }),
      personInfoErrors: computed(() => {
        const result = PersonInfoSchema.safeParse(store.personInfo());
        return result.success ? [] : result.error.issues;
      }),
    })),

    withMethods((store) => ({
      updatePersonInfo(changes: Partial<PersonInfo>): void {
        patchState(store, (state) => ({
          personInfo: { ...state.personInfo, ...changes },
        }));
      },
    })),
  );
}

// Feature: Facts (Step 2) - with nested CRUD
function withFacts() {
  return signalStoreFeature(
    withState({ facts: [createEmptyFact(1)] as FactEntry[] }),

    withComputed((store) => ({
      factsCount: computed(() => store.facts().length),
      factsValid: computed(() => {
        return (
          store.facts().length > 0 &&
          store.facts().every((f) => {
            const result = FactEntrySchema.safeParse(f);
            return result.success;
          })
        );
      }),
    })),

    withMethods((store) => ({
      addFact(): void {
        const nextNumber =
          Math.max(...store.facts().map((f) => f.factNumber), 0) + 1;
        patchState(store, (state) => ({
          facts: [...state.facts, createEmptyFact(nextNumber)],
        }));
      },

      removeFact(factId: number): void {
        patchState(store, (state) => ({
          facts: state.facts.filter((f) => f.id !== factId),
        }));
      },

      updateFact(factId: number, changes: Partial<FactEntry>): void {
        patchState(store, (state) => ({
          facts: state.facts.map((f) =>
            f.id === factId ? { ...f, ...changes } : f,
          ),
        }));
      },

      // Nested offense CRUD
      addOffense(factId: number): void {
        patchState(store, (state) => ({
          facts: state.facts.map((f) =>
            f.id === factId
              ? { ...f, offenses: [...f.offenses, createEmptyOffense()] }
              : f,
          ),
        }));
      },

      removeOffense(factId: number, offenseId: number): void {
        patchState(store, (state) => ({
          facts: state.facts.map((f) =>
            f.id === factId
              ? { ...f, offenses: f.offenses.filter((o) => o.id !== offenseId) }
              : f,
          ),
        }));
      },

      // Nested article CRUD
      addArticle(factId: number, offenseId: number): void {
        patchState(store, (state) => ({
          facts: state.facts.map((f) =>
            f.id === factId
              ? {
                  ...f,
                  offenses: f.offenses.map((o) =>
                    o.id === offenseId
                      ? {
                          ...o,
                          articles: [...o.articles, createEmptyArticle()],
                        }
                      : o,
                  ),
                }
              : f,
          ),
        }));
      },

      removeArticle(
        factId: number,
        offenseId: number,
        articleId: number,
      ): void {
        patchState(store, (state) => ({
          facts: state.facts.map((f) =>
            f.id === factId
              ? {
                  ...f,
                  offenses: f.offenses.map((o) =>
                    o.id === offenseId
                      ? {
                          ...o,
                          articles: o.articles.filter(
                            (a) => a.id !== articleId,
                          ),
                        }
                      : o,
                  ),
                }
              : f,
          ),
        }));
      },
    })),
  );
}

// Main Wizard Store - Compose all features
export const WizardStore = signalStore(
  { providedIn: 'root' },

  // Compose feature slices
  withWizardNavigation(),
  withPersonInfo(),
  withFacts(),

  // Cross-step computed values
  withComputed((store) => ({
    wizardData: computed<WizardData>(() => ({
      personInfo: store.personInfo(),
      facts: store.facts(),
      reviewed: store.currentStep() === 'review',
    })),

    isWizardValid: computed(
      () => store.personInfoValid() && store.factsValid(),
    ),

    // Auto-validate steps when data changes
    currentStepValid: computed(() => {
      switch (store.currentStep()) {
        case 'person-info':
          return store.personInfoValid();
        case 'facts':
          return store.factsValid();
        case 'review':
          return store.isWizardValid();
        default:
          return false;
      }
    }),
  })),

  // Submission mutations
  withMutations((store) => ({
    submitWizard: httpMutation<void, { success: boolean; id: string }>({
      request: () => ({
        url: '/api/wizard/submit',
        method: 'POST',
        body: store.wizardData(),
      }),
      parse: (raw) => {
        const result = z
          .object({ success: z.boolean(), id: z.string() })
          .safeParse(raw);
        if (!result.success) {
          throw new Error('Invalid server response');
        }
        return result.data;
      },
      onSuccess: (response) => {
        console.log('Wizard submitted:', response.id);
      },
      onError: (error) => {
        console.error('Submission failed:', error);
      },
    }),

    saveDraft: httpMutation<void, { draftId: string }>({
      request: () => ({
        url: '/api/wizard/draft',
        method: 'POST',
        body: store.wizardData(),
      }),
      parse: (raw) => raw as { draftId: string },
    }),
  })),

  // Lifecycle hooks
  withHooks({
    onInit(store) {
      // Auto-update step validation when data changes
      // This effect runs whenever personInfoValid or factsValid changes
    },
  }),
);
```

### Wizard Shell Component

```typescript
@Component({
  selector: 'app-wizard-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgxSignalFormToolkit,
    WizardProgressComponent,
    PersonInfoStepComponent,
    FactsStepComponent,
    ReviewStepComponent,
  ],
  template: `
    <!-- Progress indicator -->
    <app-wizard-progress
      [currentStep]="store.currentStep()"
      [visitedSteps]="store.visitedSteps()"
      [progress]="store.progress()"
      (stepClick)="store.goToStep($event)"
    />

    <!-- Step content -->
    @switch (store.currentStep()) {
      @case ('person-info') {
        <app-person-info-step />
      }
      @case ('facts') {
        <app-facts-step />
      }
      @case ('review') {
        <app-review-step />
      }
    }

    <!-- Navigation -->
    <nav class="wizard-navigation" aria-label="Wizard navigation">
      <button
        type="button"
        (click)="store.previousStep()"
        [disabled]="store.isFirstStep()"
      >
        Previous
      </button>

      @if (!store.isLastStep()) {
        <button
          type="button"
          (click)="store.nextStep()"
          [disabled]="!store.currentStepValid()"
        >
          Next
        </button>
      } @else {
        <button
          type="button"
          (click)="submit()"
          [disabled]="!store.isWizardValid() || store.submitWizardIsPending()"
          [attr.aria-busy]="store.submitWizardIsPending()"
        >
          @if (store.submitWizardIsPending()) {
            Submitting...
          } @else {
            Submit
          }
        </button>
      }

      <button
        type="button"
        (click)="saveDraft()"
        [disabled]="store.saveDraftIsPending()"
      >
        Save Draft
      </button>
    </nav>
  `,
})
export class WizardShellComponent {
  protected readonly store = inject(WizardStore);

  protected async submit(): Promise<void> {
    await this.store.submitWizard();
  }

  protected async saveDraft(): Promise<void> {
    await this.store.saveDraft();
  }
}
```

### Step Component (Person Info - Step 1)

```typescript
@Component({
  selector: 'app-person-info-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormField,
    NgxSignalFormToolkit,
    NgxSignalFormFieldWrapperComponent,
  ],
  template: `
    <form novalidate [ngxSignalForm]="personForm" (submit)="onContinue($event)">
      <ngx-signal-form-field-wrapper [formField]="personForm.firstName" outline>
        <label for="firstName">First Name</label>
        <input
          id="firstName"
          type="text"
          [formField]="personForm.firstName"
          required
        />
      </ngx-signal-form-field-wrapper>

      <ngx-signal-form-field-wrapper [formField]="personForm.lastName" outline>
        <label for="lastName">Last Name</label>
        <input
          id="lastName"
          type="text"
          [formField]="personForm.lastName"
          required
        />
      </ngx-signal-form-field-wrapper>

      <ngx-signal-form-field-wrapper [formField]="personForm.email" outline>
        <label for="email">Email</label>
        <input
          id="email"
          type="email"
          [formField]="personForm.email"
          required
        />
      </ngx-signal-form-field-wrapper>

      <ngx-signal-form-field-wrapper [formField]="personForm.phone" outline>
        <label for="phone">Phone (optional)</label>
        <input id="phone" type="tel" [formField]="personForm.phone" />
      </ngx-signal-form-field-wrapper>
    </form>
  `,
})
export class PersonInfoStepComponent {
  readonly #store = inject(WizardStore);

  // Create form from store slice
  readonly #model = computed(() => this.#store.personInfo());

  protected readonly personForm = form(this.#model, {
    firstName: [Validators.required],
    lastName: [Validators.required],
    email: [Validators.required, Validators.email],
    phone: [],
  });

  // Sync form changes back to store
  constructor() {
    effect(() => {
      const firstName = this.personForm.firstName().value();
      const lastName = this.personForm.lastName().value();
      const email = this.personForm.email().value();
      const phone = this.personForm.phone().value();

      // Update store when form values change
      untracked(() => {
        this.#store.updatePersonInfo({ firstName, lastName, email, phone });
        this.#store.markStepValid('person-info', this.#store.personInfoValid());
      });
    });
  }

  protected onContinue(event: Event): void {
    event.preventDefault();
    if (this.personForm.valid()) {
      this.#store.nextStep();
    }
  }
}
```

### Step Component (Facts - Step 2)

```typescript
@Component({
  selector: 'app-facts-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, NgxSignalFormToolkit, FactCardComponent],
  template: `
    <form novalidate [ngxSignalForm]="factsForm" (submit)="onContinue($event)">
      @for (fact of store.facts(); track fact.id; let i = $index) {
        <app-fact-card [factId]="fact.id" [factField]="factsForm.facts()[i]" />
      }

      <button type="button" (click)="store.addFact()">Add Fact</button>
    </form>
  `,
})
export class FactsStepComponent {
  protected readonly store = inject(WizardStore);

  readonly #model = computed(() => ({ facts: this.store.facts() }));
  protected readonly factsForm = form(this.#model, factsSchema);

  constructor() {
    effect(() => {
      untracked(() => {
        this.store.markStepValid('facts', this.store.factsValid());
      });
    });
  }

  protected onContinue(event: Event): void {
    event.preventDefault();
    if (this.store.factsValid()) {
      this.store.nextStep();
    }
  }
}
```

---

## Architecture Decision: Single Store vs Store per Step

### Why ONE Store? (Recommended)

For multi-step wizards with nested data, use **ONE store** with composable `signalStoreFeature` slices. This is the pattern used in the [Advanced Wizard Demo](../apps/demo/src/app/05-advanced/advanced-wizard).

**Key Reasoning:**

| Requirement               | Why Single Store Wins                                                   |
| ------------------------- | ----------------------------------------------------------------------- |
| **Cross-step validation** | Passport expiry validation needs trip departure dates from another step |
| **Atomic submission**     | Submit complete wizard data in one API call to Java backend             |
| **Easy navigation**       | Go back/forward without losing state or coordinating multiple stores    |
| **Shared mutations**      | `httpMutation` for draft save needs access to all wizard data           |
| **Computed derivations**  | `isReadyToSubmit()` checks data from multiple steps                     |
| **Auto-save**             | `rxMethod` with debounce needs full `tripSummary` data                  |

### Comparison Table

| Approach                 | Pros                                             | Cons                                     |
| ------------------------ | ------------------------------------------------ | ---------------------------------------- |
| **Single Root Store**    | Atomic submission, shared state, easy navigation | Larger store, all state in memory        |
| **Store per Step**       | Smaller stores, lazy loading                     | Complex coordination, state sync issues  |
| **Hybrid (Recommended)** | Root store + step features, best of both         | Slight complexity in feature composition |

### When to Split Stores

Only split into separate stores when:

- Steps are **completely independent** (no shared data)
- Steps can be completed in **different sessions**
- Memory constraints require **lazy loading**
- Teams work on different steps **independently**

### Recommended: Hybrid with signalStoreFeature

Use `signalStoreFeature()` to create modular slices that compose into a single store:

```typescript
// wizard.store.ts - Single store with composable features
export const WizardStore = signalStore(
  { providedIn: 'root' },

  withState({ error: null as string | null }),

  // Feature slices - each manages its own state and methods
  withWizardNavigation(), // currentStep, visitedSteps, draftId
  withPersonManagement(), // personInfo data and validation
  withFactsManagement(), // facts → offenses → articles CRUD

  // Cross-feature computed - requires access to ALL features
  withComputed((store) => ({
    isReadyToSubmit: computed(
      () => store.personInfoValid() && store.factsValid(),
    ),
    wizardData: computed(() => ({
      personInfo: store.personInfo(),
      facts: store.facts(),
      reviewed: store.currentStep() === 'review',
    })),
  })),

  // API mutations - need access to derived data
  withMutations((store) => ({
    submitWizard: httpMutation({
      request: () => ({
        url: '/api/prison-sentence/submit',
        method: 'POST',
        body: store.wizardData(),
      }),
      parse: (res) => res as SubmitResponse,
      onSuccess: () => console.log('Submitted'),
    }),
  })),

  withHooks({
    onInit(store) {
      store.initializeIfEmpty();
    },
  }),
);
```

**Benefits:**

- Each feature manages its own state slice
- Features can be developed/tested independently
- Single store instance for atomic operations
- Easy to add new steps as new features
- Cross-step validation via single `withComputed`

---

## When to Use Which NgRx Toolkit Feature

| Feature                          | Use When                                     | Prison Sentence Example                        |
| -------------------------------- | -------------------------------------------- | ---------------------------------------------- |
| `withState`                      | Simple local state, no API                   | Navigation state, selected fact ID             |
| `withMethods`                    | Synchronous state mutations                  | `addFact()`, `removeOffense()`, `selectStep()` |
| `withMutations` + `httpMutation` | REST API calls to Java backend               | `saveDraft()`, `loadDraft()`, `submitWizard()` |
| `withMutations` + `rxMutation`   | Local async with RxJS (rarely needed)        | Complex local calculations                     |
| `withEntityResources`            | Entity collections loaded via `httpResource` | N/A for nested forms (see below)               |
| `withResource`                   | Non-entity API data                          | Load person info by ID                         |
| `signalStoreFeature`             | Modular feature slices                       | `withFactsManagement()`, `withNavigation()`    |
| `rxMethod`                       | Reactive side effects with RxJS              | Auto-save with debounce                        |

### When NOT to Use withEntityResources

`withEntityResources` is designed for **flat entity collections** loaded from an API:

```typescript
// ✅ Good: Flat entity list from API
withEntityResources(() =>
  httpResource<Todo[]>({ url: '/api/todos', defaultValue: [] }),
);
```

For **nested forms** like Facts → Offenses → Articles, use `withState` + `withMethods` instead:

```typescript
// ✅ Good: Nested structures with local CRUD
withState({ facts: [createEmptyFact(1)] })
withMethods((store) => ({
  addFact(): void { ... },
  addOffense(factIndex: number): void { ... },
  addArticle(factIndex: number, offenseIndex: number): void { ... },
}))
```

**Reasons:**

- Nested arrays aren't flat entities
- Entity ID selectors don't work for deeply nested items
- Local state mutations are simpler than entity adapters for forms
- API sync happens via `httpMutation` on explicit save

---

## Cross-Field Validation with validate() and ctx.valueOf()

Angular Signal Forms provides `validate()` with `ctx.valueOf()` for cross-field validation that **references values from other fields**. This is essential for:

- Activity dates must fall within destination date range
- Article effective date must be before offense commit date
- Passport expiry must be 6 months after last trip departure

### Pattern: Cross-Field Within Same Object

```typescript
// facts-step.form.ts
import {
  applyEach,
  form,
  validate,
  validateStandardSchema,
} from '@angular/forms/signals';

export function createFactsStepForm(store: InstanceType<typeof WizardStore>) {
  const model = linkedSignal(() => ({ facts: store.facts() }));

  return form(model, (path) => {
    applyEach(path.facts, (factPath) => {
      // Zod handles single-field validation
      validateStandardSchema(factPath, FactEntrySchema);

      applyEach(factPath.offenses, (offensePath) => {
        validateStandardSchema(offensePath, CriminalOffenseSchema);

        // Cross-field: offense commit date vs fact commit date
        validate(offensePath.commitDate, (ctx) => {
          const factDate = ctx.valueOf(factPath.commitDate);
          const offenseDate = ctx.value();

          if (!factDate || !offenseDate) return null;

          if (new Date(offenseDate) < new Date(factDate)) {
            return {
              kind: 'offense_before_fact',
              message: 'Offense date cannot be before fact date',
            };
          }
          return null;
        });

        applyEach(offensePath.articles, (articlePath) => {
          validateStandardSchema(articlePath, LegalArticleSchema);

          // Cross-field: article effective date vs offense date
          validate(articlePath.effectiveDate, (ctx) => {
            const offenseDate = ctx.valueOf(offensePath.commitDate);
            const articleDate = ctx.value();

            if (!offenseDate || !articleDate) return null;

            if (new Date(articleDate) > new Date(offenseDate)) {
              return {
                kind: 'article_after_offense',
                message: 'Article must be effective before offense date',
              };
            }
            return null;
          });
        });
      });
    });
  });
}
```

### Pattern: Cross-Step Validation (Store-Level)

For validation that spans wizard steps, use Zod refinements with store data:

```typescript
// Cross-step: Passport must be valid 6 months after last trip departure
export function TravelerWithTripValidation(lastDepartureDate: string) {
  return TravelerSchema.refine(
    (data) => {
      const expiry = new Date(data.passportExpiry);
      const lastDeparture = new Date(lastDepartureDate);
      const sixMonthsAfter = new Date(lastDeparture);
      sixMonthsAfter.setMonth(sixMonthsAfter.getMonth() + 6);
      return expiry > sixMonthsAfter;
    },
    {
      message: 'Passport must be valid for 6 months after your trip ends',
      path: ['passportExpiry'],
    },
  );
}

// In form setup - access store for cross-step data
export function createTravelerStepForm(
  store: InstanceType<typeof WizardStore>,
) {
  const model = linkedSignal(() => store.traveler());

  return form(model, (path) => {
    validateStandardSchema(path, TravelerSchema);

    // Cross-step validation when trip data exists
    const lastDeparture = store.lastDepartureDate();
    if (lastDeparture) {
      validate(path.passportExpiry, (ctx) => {
        const expiry = new Date(ctx.value());
        const sixMonthsAfter = new Date(lastDeparture);
        sixMonthsAfter.setMonth(sixMonthsAfter.getMonth() + 6);

        if (expiry <= sixMonthsAfter) {
          return {
            kind: 'passport_expiry',
            message: 'Passport must be valid for 6 months after your trip ends',
          };
        }
        return null;
      });
    }
  });
}
```

---

## Auto-Save Pattern with rxMethod

Use `rxMethod` from `@ngrx/signals/rxjs-interop` for reactive auto-save with debounce:

```typescript
// wizard.store.ts
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { debounceTime, distinctUntilChanged, pipe, tap } from 'rxjs';

export const WizardStore = signalStore(
  { providedIn: 'root' },

  withState({ ... }),
  withWizardNavigation(),
  withFactsManagement(),

  withComputed((store) => ({
    // Data snapshot for auto-save
    wizardSummary: computed(() => ({
      personInfo: store.personInfo(),
      facts: store.facts(),
    })),
  })),

  withMutations((store) => ({
    saveDraft: httpMutation<WizardSummary, DraftResponse>({
      request: (data) => {
        const draftId = store.draftId();
        return {
          url: draftId ? `/api/wizard/draft/${draftId}` : '/api/wizard/draft',
          method: draftId ? 'PUT' : 'POST',
          body: data,
        };
      },
      parse: (res) => res as DraftResponse,
      onSuccess: (response) => {
        store.setDraftSaved(response.draftId);
      },
    }),
  })),

  withMethods((store) => {
    // Reactive auto-save with debounce (2 seconds)
    const autoSave = rxMethod<WizardSummary>(
      pipe(
        debounceTime(2000),
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
        tap((data) => {
          // Only save if meaningful data exists
          if (data.personInfo.firstName || data.facts.length > 0) {
            store.saveDraft(data);
          }
        }),
      ),
    );

    return {
      autoSave,

      // Trigger auto-save in component effects
      triggerAutoSave(): void {
        autoSave(store.wizardSummary());
      },
    };
  }),
);
```

### Using Auto-Save in Components

```typescript
// facts-step.component.ts
@Component({ ... })
export class FactsStepComponent {
  protected readonly store = inject(WizardStore);
  readonly #tripStepForm = createFactsStepForm(this.store);

  constructor() {
    // Sync form → store
    effect(() => {
      const facts = this.#tripStepForm.form().value().facts;
      this.store.setFacts(facts);
    });

    // Auto-save when form is dirty
    effect(() => {
      if (this.#tripStepForm.form().dirty()) {
        this.store.autoSave(this.store.wizardSummary());
      }
    });
  }
}
```

---

## Toolkit Integration Improvements

### 1. Use NgxSignalFormFieldWrapperComponent

Your toolkit provides excellent field wrapper functionality. Use it consistently:

```typescript
import { NgxSignalFormFieldWrapperComponent } from '@ngx-signal-forms/toolkit/form-field';

// In template
<ngx-signal-form-field-wrapper [formField]="form.email" outline>
  <label for="email">Email</label>
  <input id="email" type="email" [formField]="form.email" required />
  <ngx-form-field-hint>Enter your work email</ngx-form-field-hint>
</ngx-signal-form-field-wrapper>
```

### 2. Use showErrors and Error Strategies

Your toolkit provides `showErrors()` utility - use it instead of manual checks:

```typescript
import { showErrors, combineShowErrors } from '@ngx-signal-forms/toolkit';

protected readonly showEmailErrors = showErrors(
  this.form.email,
  'on-touch', // Uses strategy from toolkit
);

// Combine for form-level validation
protected readonly showAnyErrors = combineShowErrors([
  showErrors(this.form.email, 'on-touch'),
  showErrors(this.form.password, 'on-touch'),
]);
```

### 3. Configure Global Error Strategy

```typescript
// app.config.ts
import { provideNgxSignalFormsConfig } from '@ngx-signal-forms/toolkit';

export const appConfig: ApplicationConfig = {
  providers: [
    provideNgxSignalFormsConfig({
      defaultErrorStrategy: 'on-touch',
      defaultFormFieldAppearance: 'outline',
      autoAria: true,
    }),
  ],
};
```

---

## Complete Best Practices Example: Prison Sentence Wizard

This example demonstrates a production-ready multi-step wizard combining all technologies:

- **NgRx Signal Store** with `signalStoreFeature` composition
- **NgRx Toolkit** with `withMutations` for auto-save
- **Zod 4** for type-safe schemas and validation
- **Angular Signal Forms** for reactive form handling
- **@ngx-signal-forms/toolkit** for accessibility and UX

### Wizard Overview

Based on the DEK-4 prison sentence entry workflow:

| Step | Name        | Description                                   |
| ---- | ----------- | --------------------------------------------- |
| 1    | Person Info | Display read-only person details (pre-loaded) |
| 2    | Facts       | Nested arrays: Facts → Offenses → Articles    |
| 3    | Review      | Summary with final validation                 |

### Zod Schemas with Full Validation

```typescript
// schemas/wizard.schemas.ts
import { z, type ZodError } from 'zod';

// Base schemas
export const LegalArticleSchema = z.object({
  id: z.string().uuid(),
  article: z.string().regex(/^SR-\d+[a-z]?$/i, {
    message: 'Format: SR-310 or SR-310a',
  }),
});

export const CriminalOffenseSchema = z.object({
  id: z.string().uuid(),
  qualification: z.string().min(3, 'Minimum 3 characters'),
  articles: z.array(LegalArticleSchema).min(1, 'At least one article required'),
});

export const FactEntrySchema = z.object({
  id: z.string().uuid(),
  factNumber: z.number().int().positive(),
  commitDate: z.string().min(1, 'Date is required'),
  commitPeriod: z.string().optional(),
  country: z.string().min(2, 'Country is required'),
  place: z.string().optional(),
  municipality: z.string().optional(),
  locationDescription: z.string().optional(),
  abroadLocation: z.string().optional(),
  offenses: z
    .array(CriminalOffenseSchema)
    .min(1, 'At least one offense required'),
});

export const PersonInfoSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string(),
  lastName: z.string(),
  dateOfBirth: z.string(),
  bsn: z.string().length(9, 'BSN must be 9 digits'),
});

export const WizardDataSchema = z.object({
  personInfo: PersonInfoSchema,
  facts: z.array(FactEntrySchema),
  reviewed: z.boolean().default(false),
});

// Cross-field validation for facts
export const FactEntryWithCrossValidation = FactEntrySchema.refine(
  (data) => {
    if (data.country === 'NL' && !data.municipality) {
      return false;
    }
    return true;
  },
  { message: 'Municipality required for Netherlands', path: ['municipality'] },
).refine(
  (data) => {
    if (data.country !== 'NL' && !data.abroadLocation) {
      return false;
    }
    return true;
  },
  { message: 'Abroad location required', path: ['abroadLocation'] },
);

// Infer types from schemas
export type LegalArticle = z.infer<typeof LegalArticleSchema>;
export type CriminalOffense = z.infer<typeof CriminalOffenseSchema>;
export type FactEntry = z.infer<typeof FactEntrySchema>;
export type PersonInfo = z.infer<typeof PersonInfoSchema>;
export type WizardData = z.infer<typeof WizardDataSchema>;

// Factory functions
export function createEmptyArticle(): LegalArticle {
  return { id: crypto.randomUUID(), article: '' };
}

export function createEmptyOffense(): CriminalOffense {
  return {
    id: crypto.randomUUID(),
    qualification: '',
    articles: [createEmptyArticle()],
  };
}

export function createEmptyFact(factNumber: number): FactEntry {
  return {
    id: crypto.randomUUID(),
    factNumber,
    commitDate: '',
    commitPeriod: '',
    country: '',
    place: '',
    municipality: '',
    locationDescription: '',
    abroadLocation: '',
    offenses: [createEmptyOffense()],
  };
}

// Validation helper
export function validateStep<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): { success: true; data: T } | { success: false; errors: ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}
```

### SignalStoreFeature: Navigation with Auto-Save

```typescript
// features/wizard-navigation.feature.ts
import { computed, inject } from '@angular/core';
import {
  patchState,
  signalStoreFeature,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { httpMutation, withMutations } from '@angular-architects/ngrx-toolkit';
import { pipe, tap, exhaustMap } from 'rxjs';
import { WizardApiService } from '../services/wizard-api.service';

export type WizardStep = 'person-info' | 'facts' | 'review';

interface NavigationState {
  currentStep: WizardStep;
  visitedSteps: WizardStep[];
  stepValidation: Record<WizardStep, boolean>;
  draftId: string | null;
  lastSavedAt: Date | null;
}

const STEPS: WizardStep[] = ['person-info', 'facts', 'review'];

export function withWizardNavigation() {
  return signalStoreFeature(
    withState<NavigationState>({
      currentStep: 'person-info',
      visitedSteps: ['person-info'],
      stepValidation: { 'person-info': true, facts: false, review: false },
      draftId: null,
      lastSavedAt: null,
    }),

    withComputed((store) => ({
      canProceed: computed(() => store.stepValidation()[store.currentStep()]),
      isFirstStep: computed(() => store.currentStep() === 'person-info'),
      isLastStep: computed(() => store.currentStep() === 'review'),
      currentStepIndex: computed(() => STEPS.indexOf(store.currentStep())),
      progress: computed(() => {
        const idx = STEPS.indexOf(store.currentStep());
        return ((idx + 1) / STEPS.length) * 100;
      }),
    })),

    // Auto-save mutations
    withMutations(({ events }) => {
      const api = inject(WizardApiService);
      return {
        saveDraft: httpMutation({
          trigger: events.draftSaveRequested,
          mutationFn: (draft: { draftId: string | null; data: unknown }) =>
            api.saveDraft(draft.draftId, draft.data),
          onSuccess: (response, store) => {
            patchState(store, {
              draftId: response.draftId,
              lastSavedAt: new Date(),
            });
          },
        }),
      };
    }),

    withMethods((store, _mutations = inject(_MutationsToken)) => ({
      goToStep(step: WizardStep): void {
        const canNavigate =
          store.visitedSteps().includes(step) || store.canProceed();
        if (!canNavigate) return;

        patchState(store, {
          currentStep: step,
          visitedSteps: [...new Set([...store.visitedSteps(), step])],
        });
      },

      // Auto-save on next: validates current step, saves draft, then navigates
      async nextStep(getCurrentStepData: () => unknown): Promise<void> {
        if (!store.canProceed() || store.isLastStep()) return;

        // Trigger auto-save before navigation
        const data = getCurrentStepData();
        _mutations.saveDraft.trigger({
          draftId: store.draftId(),
          data: { step: store.currentStep(), data },
        });

        const nextIdx = store.currentStepIndex() + 1;
        this.goToStep(STEPS[nextIdx]);
      },

      // Auto-save on previous: saves draft, then navigates back
      async previousStep(getCurrentStepData: () => unknown): Promise<void> {
        if (store.isFirstStep()) return;

        // Save draft before going back (preserve progress)
        const data = getCurrentStepData();
        _mutations.saveDraft.trigger({
          draftId: store.draftId(),
          data: { step: store.currentStep(), data },
        });

        const prevIdx = store.currentStepIndex() - 1;
        this.goToStep(STEPS[prevIdx]);
      },

      markStepValid(step: WizardStep, isValid: boolean): void {
        patchState(store, (s) => ({
          stepValidation: { ...s.stepValidation, [step]: isValid },
        }));
      },
    })),
  );
}

// Token for mutations injection
const _MutationsToken = Symbol('WizardMutations');
```

### SignalStoreFeature: Facts Management

```typescript
// features/facts.feature.ts
import { computed } from '@angular/core';
import {
  patchState,
  signalStoreFeature,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import {
  FactEntry,
  CriminalOffense,
  LegalArticle,
  createEmptyFact,
  createEmptyOffense,
  createEmptyArticle,
  FactEntrySchema,
} from '../schemas/wizard.schemas';
import { z } from 'zod';

interface FactsState {
  facts: FactEntry[];
}

export function withFacts() {
  return signalStoreFeature(
    withState<FactsState>({
      facts: [createEmptyFact(1)],
    }),

    withComputed((store) => ({
      factsCount: computed(() => store.facts().length),
      factsValid: computed(() => {
        const facts = store.facts();
        return facts.every((fact) => FactEntrySchema.safeParse(fact).success);
      }),
      // Flattened view for validation summary
      allOffenses: computed(() => store.facts().flatMap((f) => f.offenses)),
      allArticles: computed(() =>
        store.facts().flatMap((f) => f.offenses.flatMap((o) => o.articles)),
      ),
    })),

    withMethods((store) => ({
      // Facts CRUD
      addFact(): void {
        patchState(store, (s) => ({
          facts: [...s.facts, createEmptyFact(s.facts.length + 1)],
        }));
      },

      removeFact(factIndex: number): void {
        patchState(store, (s) => ({
          facts: s.facts
            .filter((_, i) => i !== factIndex)
            .map((f, i) => ({ ...f, factNumber: i + 1 })),
        }));
      },

      updateFact(factIndex: number, updates: Partial<FactEntry>): void {
        patchState(store, (s) => ({
          facts: s.facts.map((f, i) =>
            i === factIndex ? { ...f, ...updates } : f,
          ),
        }));
      },

      // Offenses CRUD
      addOffense(factIndex: number): void {
        patchState(store, (s) => ({
          facts: s.facts.map((f, i) =>
            i === factIndex
              ? { ...f, offenses: [...f.offenses, createEmptyOffense()] }
              : f,
          ),
        }));
      },

      removeOffense(factIndex: number, offenseIndex: number): void {
        patchState(store, (s) => ({
          facts: s.facts.map((f, i) =>
            i === factIndex
              ? {
                  ...f,
                  offenses: f.offenses.filter((_, j) => j !== offenseIndex),
                }
              : f,
          ),
        }));
      },

      updateOffense(
        factIndex: number,
        offenseIndex: number,
        updates: Partial<CriminalOffense>,
      ): void {
        patchState(store, (s) => ({
          facts: s.facts.map((f, i) =>
            i === factIndex
              ? {
                  ...f,
                  offenses: f.offenses.map((o, j) =>
                    j === offenseIndex ? { ...o, ...updates } : o,
                  ),
                }
              : f,
          ),
        }));
      },

      // Articles CRUD
      addArticle(factIndex: number, offenseIndex: number): void {
        patchState(store, (s) => ({
          facts: s.facts.map((f, i) =>
            i === factIndex
              ? {
                  ...f,
                  offenses: f.offenses.map((o, j) =>
                    j === offenseIndex
                      ? {
                          ...o,
                          articles: [...o.articles, createEmptyArticle()],
                        }
                      : o,
                  ),
                }
              : f,
          ),
        }));
      },

      removeArticle(
        factIndex: number,
        offenseIndex: number,
        articleIndex: number,
      ): void {
        patchState(store, (s) => ({
          facts: s.facts.map((f, i) =>
            i === factIndex
              ? {
                  ...f,
                  offenses: f.offenses.map((o, j) =>
                    j === offenseIndex
                      ? {
                          ...o,
                          articles: o.articles.filter(
                            (_, k) => k !== articleIndex,
                          ),
                        }
                      : o,
                  ),
                }
              : f,
          ),
        }));
      },

      updateArticle(
        factIndex: number,
        offenseIndex: number,
        articleIndex: number,
        updates: Partial<LegalArticle>,
      ): void {
        patchState(store, (s) => ({
          facts: s.facts.map((f, i) =>
            i === factIndex
              ? {
                  ...f,
                  offenses: f.offenses.map((o, j) =>
                    j === offenseIndex
                      ? {
                          ...o,
                          articles: o.articles.map((a, k) =>
                            k === articleIndex ? { ...a, ...updates } : a,
                          ),
                        }
                      : o,
                  ),
                }
              : f,
          ),
        }));
      },

      // Replace all facts (for loading draft)
      setFacts(facts: FactEntry[]): void {
        patchState(store, { facts });
      },
    })),
  );
}
```

### Complete Wizard Store with withHooks

```typescript
// stores/wizard.store.ts
import { computed, effect, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import { httpMutation, withMutations } from '@angular-architects/ngrx-toolkit';
import { withWizardNavigation } from '../features/wizard-navigation.feature';
import { withFacts } from '../features/facts.feature';
import {
  PersonInfo,
  WizardData,
  WizardDataSchema,
} from '../schemas/wizard.schemas';
import { WizardApiService } from '../services/wizard-api.service';

interface WizardState {
  personInfo: PersonInfo | null;
  isLoading: boolean;
  error: string | null;
}

export const WizardStore = signalStore(
  { providedIn: 'root' },

  // Base state
  withState<WizardState>({
    personInfo: null,
    isLoading: true,
    error: null,
  }),

  // Compose features
  withWizardNavigation(),
  withFacts(),

  // Computed: form data for submission
  withComputed((store) => ({
    wizardData: computed<WizardData | null>(() => {
      const personInfo = store.personInfo();
      if (!personInfo) return null;

      return {
        personInfo,
        facts: store.facts(),
        reviewed: store.currentStep() === 'review',
      };
    }),

    isValid: computed(() => {
      const data = store.wizardData?.();
      if (!data) return false;
      return WizardDataSchema.safeParse(data).success;
    }),

    validationErrors: computed(() => {
      const data = store.wizardData?.();
      if (!data) return [];
      const result = WizardDataSchema.safeParse(data);
      if (result.success) return [];
      return result.error.issues;
    }),
  })),

  // Mutations for API calls
  withMutations(({ events }) => {
    const api = inject(WizardApiService);

    return {
      loadDraft: httpMutation({
        trigger: events.loadDraftRequested,
        mutationFn: (draftId: string) => api.loadDraft(draftId),
        onSuccess: (draft, store) => {
          patchState(store, {
            personInfo: draft.personInfo,
            draftId: draft.id,
            isLoading: false,
          });
          store.setFacts(draft.facts);
        },
        onError: (error, store) => {
          patchState(store, {
            error: 'Failed to load draft',
            isLoading: false,
          });
        },
      }),

      loadPerson: httpMutation({
        trigger: events.loadPersonRequested,
        mutationFn: (personId: string) => api.loadPerson(personId),
        onSuccess: (person, store) => {
          patchState(store, { personInfo: person, isLoading: false });
        },
        onError: (error, store) => {
          patchState(store, {
            error: 'Failed to load person',
            isLoading: false,
          });
        },
      }),

      submitWizard: httpMutation({
        trigger: events.submitRequested,
        mutationFn: (data: WizardData) => api.submit(data),
        onSuccess: (_response, store) => {
          // Navigate to success page or reset
          patchState(store, { error: null });
        },
        onError: (error, store) => {
          patchState(store, { error: 'Submission failed' });
        },
      }),
    };
  }),

  // Methods for initialization and submission
  withMethods((store, mutations = inject(_MutationsToken)) => ({
    initialize(params: { personId?: string; draftId?: string }): void {
      if (params.draftId) {
        mutations.loadDraft.trigger(params.draftId);
      } else if (params.personId) {
        mutations.loadPerson.trigger(params.personId);
      }
    },

    submit(): void {
      const data = store.wizardData();
      if (data && store.isValid()) {
        mutations.submitWizard.trigger(data);
      }
    },
  })),

  // Initialization via withHooks
  withHooks({
    onInit(store) {
      // Auto-validate facts step when facts change
      effect(() => {
        const isValid = store.factsValid();
        store.markStepValid('facts', isValid);
      });

      // Mark review step valid when all previous steps are valid
      effect(() => {
        const factsValid = store.stepValidation().facts;
        const personValid = store.stepValidation()['person-info'];
        store.markStepValid('review', factsValid && personValid);
      });
    },
  }),
);

const _MutationsToken = Symbol('WizardMutations');
```

### Facts Step Component with Toolkit Integration

```typescript
// components/facts-step.component.ts
import {
  Component,
  ChangeDetectionStrategy,
  computed,
  inject,
  signal,
  effect,
} from '@angular/core';
import { form } from '@angular/forms/signals';
import {
  NgxSignalFormToolkit,
  NgxSignalFormFieldWrapperComponent,
  NgxSignalFormFieldHint,
  NgxSignalFormError,
} from '@ngx-signal-forms/toolkit';
import { WizardStore } from '../stores/wizard.store';
import { factsValidationSchema } from './facts.validations';

@Component({
  selector: 'app-facts-step',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgxSignalFormToolkit,
    NgxSignalFormFieldWrapperComponent,
    NgxSignalFormFieldHint,
    NgxSignalFormError,
  ],
  template: `
    <div class="space-y-6">
      @for (fact of store.facts(); track fact.id; let fi = $index) {
        <section
          class="rounded-lg border p-4"
          [attr.aria-label]="'Feit ' + fact.factNumber"
        >
          <header class="mb-4 flex items-center justify-between">
            <h3 class="font-semibold">Feit {{ fact.factNumber }}</h3>
            @if (store.factsCount() > 1) {
              <button
                type="button"
                (click)="store.removeFact(fi)"
                class="text-red-600 hover:text-red-800"
                [attr.aria-label]="'Feit ' + fact.factNumber + ' verwijderen'"
              >
                Verwijderen
              </button>
            }
          </header>

          <!-- Fact Fields -->
          <div class="grid gap-4 md:grid-cols-2">
            <ngx-signal-form-field-wrapper
              [formField]="factsForm.facts[fi].commitDate"
            >
              <label [for]="'commitDate-' + fi">Pleegdatum</label>
              <input
                [id]="'commitDate-' + fi"
                type="text"
                [formField]="factsForm.facts[fi].commitDate"
                placeholder="DD-MM-JJJJ"
              />
              <ngx-signal-form-field-hint
                >Verplicht veld</ngx-signal-form-field-hint
              >
            </ngx-signal-form-field-wrapper>

            <ngx-signal-form-field-wrapper
              [formField]="factsForm.facts[fi].country"
            >
              <label [for]="'country-' + fi">Land</label>
              <select
                [id]="'country-' + fi"
                [formField]="factsForm.facts[fi].country"
              >
                <option value="">Selecteer land</option>
                @for (country of countries; track country.value) {
                  <option [value]="country.value">{{ country.label }}</option>
                }
              </select>
            </ngx-signal-form-field-wrapper>
          </div>

          <!-- Conditional: Municipality for Netherlands -->
          @if (factsForm.facts[fi].country().value() === 'NL') {
            <ngx-signal-form-field-wrapper
              [formField]="factsForm.facts[fi].municipality"
            >
              <label [for]="'municipality-' + fi">Gemeente</label>
              <input
                [id]="'municipality-' + fi"
                type="text"
                [formField]="factsForm.facts[fi].municipality"
              />
            </ngx-signal-form-field-wrapper>
          }

          <!-- Offenses -->
          <div class="mt-4 space-y-4">
            <h4 class="font-medium">Strafbare feiten</h4>
            @for (offense of fact.offenses; track offense.id; let oi = $index) {
              <div class="rounded border border-gray-200 p-3">
                <div class="mb-2 flex items-center justify-between">
                  <span class="text-sm text-gray-600"
                    >Strafbaar feit {{ oi + 1 }}</span
                  >
                  <button
                    type="button"
                    (click)="store.removeOffense(fi, oi)"
                    class="text-sm text-red-600"
                    aria-label="Strafbaar feit verwijderen"
                  >
                    ×
                  </button>
                </div>

                <ngx-signal-form-field-wrapper
                  [formField]="factsForm.facts[fi].offenses[oi].qualification"
                >
                  <label [for]="'qualification-' + fi + '-' + oi"
                    >Kwalificatie</label
                  >
                  <input
                    [id]="'qualification-' + fi + '-' + oi"
                    type="text"
                    [formField]="factsForm.facts[fi].offenses[oi].qualification"
                    placeholder="SR-310"
                  />
                </ngx-signal-form-field-wrapper>

                <!-- Articles -->
                <div class="mt-3 space-y-2 border-l-2 border-gray-200 pl-4">
                  <h5 class="text-sm font-medium">Wetsartikelen</h5>
                  @for (
                    article of offense.articles;
                    track article.id;
                    let ai = $index
                  ) {
                    <div class="flex items-center gap-2">
                      <ngx-signal-form-field-wrapper
                        [formField]="
                          factsForm.facts[fi].offenses[oi].articles[ai].article
                        "
                        class="flex-1"
                      >
                        <label [for]="'article-' + fi + '-' + oi + '-' + ai"
                          >Artikel</label
                        >
                        <select
                          [id]="'article-' + fi + '-' + oi + '-' + ai"
                          [formField]="
                            factsForm.facts[fi].offenses[oi].articles[ai]
                              .article
                          "
                        >
                          <option value="">Selecteer artikel</option>
                          @for (art of legalArticles; track art.value) {
                            <option [value]="art.value">{{ art.label }}</option>
                          }
                        </select>
                      </ngx-signal-form-field-wrapper>
                      <button
                        type="button"
                        (click)="store.removeArticle(fi, oi, ai)"
                        class="text-red-600"
                        aria-label="Artikel verwijderen"
                      >
                        ×
                      </button>
                    </div>
                  }

                  <!-- Array validation errors -->
                  <ngx-signal-form-error
                    [formField]="factsForm.facts[fi].offenses[oi].articles"
                    [fieldName]="'articles-' + fi + '-' + oi"
                  />

                  <button
                    type="button"
                    (click)="store.addArticle(fi, oi)"
                    class="text-sm text-indigo-600"
                  >
                    + Artikel toevoegen
                  </button>
                </div>
              </div>
            }

            <!-- Offenses array validation -->
            <ngx-signal-form-error
              [formField]="factsForm.facts[fi].offenses"
              [fieldName]="'offenses-' + fi"
            />

            <button
              type="button"
              (click)="store.addOffense(fi)"
              class="text-indigo-600"
            >
              + Strafbaar feit toevoegen
            </button>
          </div>
        </section>
      }

      <!-- Add Fact Button -->
      <button
        type="button"
        (click)="store.addFact()"
        class="w-full rounded-lg border-2 border-dashed border-gray-300 p-4 text-gray-600 hover:border-indigo-500"
      >
        + Feit toevoegen
      </button>
    </div>
  `,
})
export class FactsStepComponent {
  protected readonly store = inject(WizardStore);

  // Signal for form binding - synced with store
  readonly #factsModel = computed(() => ({ facts: this.store.facts() }));

  // Create form bound to the computed signal
  // Note: Use linkedSignal for writable computed in production
  protected readonly factsForm = form(this.#factsModel, factsValidationSchema);

  // Reference data
  protected readonly countries = [
    { value: 'NL', label: 'Nederland' },
    { value: 'BE', label: 'België' },
    { value: 'DE', label: 'Duitsland' },
  ];

  protected readonly legalArticles = [
    { value: 'SR-310', label: 'SR-310 - Diefstal' },
    { value: 'SR-310a', label: 'SR-310a - Gekwalificeerde diefstal' },
    { value: 'SR-311', label: 'SR-311 - Verduistering' },
  ];

  constructor() {
    // Sync form changes back to store
    effect(() => {
      const facts = this.factsForm.facts().value();
      this.store.setFacts(facts);
    });
  }
}
```

### Wizard Container with Auto-Save Navigation

```typescript
// components/wizard.component.ts
import {
  Component,
  ChangeDetectionStrategy,
  computed,
  inject,
  input,
} from '@angular/core';
import { WizardStore } from '../stores/wizard.store';
import { PersonInfoStepComponent } from './person-info-step.component';
import { FactsStepComponent } from './facts-step.component';
import { ReviewStepComponent } from './review-step.component';

@Component({
  selector: 'app-wizard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PersonInfoStepComponent, FactsStepComponent, ReviewStepComponent],
  template: `
    <!-- Progress Bar -->
    <div class="mb-6">
      <div class="h-2 rounded-full bg-gray-200">
        <div
          class="h-full rounded-full bg-indigo-600 transition-all"
          [style.width.%]="store.progress()"
        ></div>
      </div>
      <div class="mt-2 flex justify-between text-sm">
        @for (step of steps; track step.id; let i = $index) {
          <button
            type="button"
            (click)="store.goToStep(step.id)"
            [class.text-indigo-600]="store.currentStep() === step.id"
            [class.font-semibold]="store.currentStep() === step.id"
            [disabled]="!store.visitedSteps().includes(step.id)"
            class="disabled:text-gray-400"
          >
            {{ i + 1 }}. {{ step.label }}
          </button>
        }
      </div>
    </div>

    <!-- Loading State -->
    @if (store.isLoading()) {
      <div class="flex items-center justify-center py-12">
        <span class="text-gray-500">Laden...</span>
      </div>
    } @else {
      <!-- Step Content -->
      <main class="min-h-[400px]">
        @switch (store.currentStep()) {
          @case ('person-info') {
            <app-person-info-step />
          }
          @case ('facts') {
            <app-facts-step />
          }
          @case ('review') {
            <app-review-step />
          }
        }
      </main>

      <!-- Auto-Save Status -->
      @if (store.lastSavedAt()) {
        <div class="mt-2 text-sm text-gray-500">
          Automatisch opgeslagen: {{ store.lastSavedAt() | date: 'HH:mm:ss' }}
        </div>
      }

      <!-- Navigation Footer -->
      <footer class="mt-8 flex justify-between border-t pt-4">
        <button
          type="button"
          (click)="onPrevious()"
          [disabled]="store.isFirstStep()"
          class="rounded bg-gray-200 px-4 py-2 disabled:opacity-50"
        >
          Vorige
        </button>

        @if (store.isLastStep()) {
          <button
            type="button"
            (click)="store.submit()"
            [disabled]="!store.isValid()"
            class="rounded bg-indigo-600 px-4 py-2 text-white disabled:opacity-50"
          >
            Indienen
          </button>
        } @else {
          <button
            type="button"
            (click)="onNext()"
            [disabled]="!store.canProceed()"
            class="rounded bg-indigo-600 px-4 py-2 text-white disabled:opacity-50"
          >
            Volgende
          </button>
        }
      </footer>
    }
  `,
})
export class WizardComponent {
  readonly personId = input<string>();
  readonly draftId = input<string>();

  protected readonly store = inject(WizardStore);

  protected readonly steps = [
    { id: 'person-info' as const, label: 'Persoon' },
    { id: 'facts' as const, label: 'Feiten' },
    { id: 'review' as const, label: 'Controleren' },
  ];

  ngOnInit(): void {
    // Initialize store from route params
    this.store.initialize({
      personId: this.personId(),
      draftId: this.draftId(),
    });
  }

  protected onNext(): void {
    this.store.nextStep(() => this.getCurrentStepData());
  }

  protected onPrevious(): void {
    this.store.previousStep(() => this.getCurrentStepData());
  }

  #getCurrentStepData(): unknown {
    switch (this.store.currentStep()) {
      case 'person-info':
        return this.store.personInfo();
      case 'facts':
        return this.store.facts();
      case 'review':
        return { reviewed: true };
    }
  }
}
```

### API Service

```typescript
// services/wizard-api.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PersonInfo, WizardData, FactEntry } from '../schemas/wizard.schemas';

interface DraftResponse {
  id: string;
  personInfo: PersonInfo;
  facts: FactEntry[];
  savedAt: string;
}

interface SaveDraftResponse {
  draftId: string;
  savedAt: string;
}

@Injectable({ providedIn: 'root' })
export class WizardApiService {
  readonly #http = inject(HttpClient);
  readonly #baseUrl = '/api/wizard';

  loadPerson(personId: string) {
    return this.#http.get<PersonInfo>(`${this.#baseUrl}/person/${personId}`);
  }

  loadDraft(draftId: string) {
    return this.#http.get<DraftResponse>(`${this.#baseUrl}/draft/${draftId}`);
  }

  saveDraft(draftId: string | null, data: unknown) {
    const url = draftId
      ? `${this.#baseUrl}/draft/${draftId}`
      : `${this.#baseUrl}/draft`;
    const method = draftId ? 'put' : 'post';
    return this.#http[method]<SaveDraftResponse>(url, data);
  }

  submit(data: WizardData) {
    return this.#http.post(`${this.#baseUrl}/submit`, data);
  }
}
```

### Key Patterns Summary

| Pattern                     | Implementation                                                 |
| --------------------------- | -------------------------------------------------------------- |
| **Auto-save on navigation** | `nextStep()` and `previousStep()` trigger `saveDraft` mutation |
| **Initialization**          | `withHooks({ onInit })` sets up validation effects             |
| **Type safety**             | Zod schemas with `z.infer<>` for all models                    |
| **Nested CRUD**             | Store methods with immutable updates via `patchState`          |
| **Form ↔ Store sync**       | `linkedSignal()` for writable model; no effect mirroring       |
| **Validation**              | Zod for schema, Angular Signal Forms for field-level           |
| **Toolkit integration**     | `NgxSignalFormFieldWrapperComponent` + error components        |
| **Loading states**          | `isLoading` state + mutation pending signals                   |

---

## Related Resources

- [Angular Signal Forms Instructions](../.github/instructions/angular-signal-forms.instructions.md)
- [NgRx Signal Store Documentation](https://ngrx.io/guide/signals/signal-store)
- [NgRx Toolkit Documentation](https://ngrx-toolkit.angulararchitects.io/)
- [NgRx Toolkit withMutations](https://ngrx-toolkit.angulararchitects.io/docs/mutations)
- [NgRx Toolkit withEntityResources](https://ngrx-toolkit.angulararchitects.io/docs/with-entity-resources)
- [NgRx Toolkit withResource](https://ngrx-toolkit.angulararchitects.io/docs/with-resource)
- [NgRx Toolkit Instructions](../.github/instructions/ngx-signal-forms-toolkit.instructions.md)
- [Zod 4 Documentation](https://zod.dev)
- [Zod 4 Changelog](https://zod.dev/v4/changelog)
- [Zod API Reference](https://zod.dev/v4/api)
