# Advanced Wizard Demo Plan

## Overview

Create an **Advanced Travel Booking Wizard** demo showcasing:

- **NgRx Signal Store** with `signalStoreFeature` composition
- **NgRx Toolkit** with `withResource`, `withMutations`, `httpMutation` for data loading and API calls
- **NgRx `rxMethod`** for reactive store methods with RxJS pipelines
- **Zod 4** for type-safe schemas and runtime validation
- **Angular Signal Forms** for reactive form handling
- **@ngx-signal-forms/toolkit** for accessibility and UX
- **Angular 21.1.x** lifecycle best practices (`effect`, `DestroyRef`, `afterNextRender`)

## Location

```
apps/demo/src/app/05-advanced/
├── stepper-form/              # Existing basic wizard
└── advanced-wizard/           # NEW: Advanced wizard demo
    ├── advanced-wizard.page.ts
    ├── advanced-wizard.content.ts
    ├── schemas/
    │   └── wizard.schemas.ts  # Zod schemas with cross-field validation
    ├── stores/
    │   ├── wizard.store.ts    # Main store composition
    │   └── features/
    │       ├── navigation.feature.ts
    │       ├── traveler.feature.ts
    │       └── trip.feature.ts
    ├── forms/                  # Separate form files per step
    │   ├── traveler-step.form.ts
    │   ├── trip-step.form.ts
    │   └── review-step.form.ts
    ├── components/
    │   ├── wizard-container.component.ts
    │   ├── traveler-step.component.ts  # Uses traveler-step.form.ts
    │   ├── trip-step.component.ts      # Uses trip-step.form.ts
    │   └── review-step.component.ts    # Uses review-step.form.ts
    └── services/
        └── wizard-api.service.ts
```

## Domain Model: Travel Booking

A universally relatable nested structure:

```
Trip (root)
├── Traveler Info (step 1 - pre-loaded)
├── Destinations[] (step 2 - nested arrays)
│   ├── Destination Details
│   └── Activities[]
│       ├── Activity Details
│       └── Requirements[]
└── Review & Confirm (step 3)
```

---

## Form Architecture Decision: Form-Per-Step

### Question: Nested Form vs. Form-Per-Step?

**Recommendation: Form-Per-Step** with a shared NgRx Signal Store as the source of truth.

### Why Form-Per-Step?

| Aspect              | Nested Form (Single Form)               | Form-Per-Step (Recommended)        |
| ------------------- | --------------------------------------- | ---------------------------------- |
| **Auto-save**       | Must serialize entire form on each save | Only serialize current step data   |
| **Validation**      | All validators run on any change        | Validators scoped to current step  |
| **Performance**     | Large forms can cause signal churn      | Smaller signal graphs per step     |
| **Code Separation** | Monolithic form definition              | Clean separation of concerns       |
| **State Recovery**  | Complex partial hydration               | Easy per-step hydration from store |
| **Testing**         | Tests require full form setup           | Unit test each form in isolation   |

### Architecture Pattern

```
┌─────────────────────────────────────────────────────────────┐
│                    NgRx Signal Store                        │
│              (Single Source of Truth)                       │
│  • traveler: Traveler                                       │
│  • destinations: Destination[]                              │
│  • navigation state                                         │
└─────────────────────────────────────────────────────────────┘
          ▲                    ▲                    ▲
          │ sync               │ sync               │ sync
          ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ traveler-step   │  │ trip-step       │  │ review-step     │
│    .form.ts     │  │    .form.ts     │  │    .form.ts     │
│                 │  │                 │  │                 │
│ signal<Traveler>│  │ signal<Trip>    │  │ computed only   │
│ form(traveler)  │  │ form(trip)      │  │ (read-only)     │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### Key Insight

Each `.form.ts` file:

1. Creates a **local signal** initialized from the store
2. Creates a **form** bound to that signal via `form()`
3. Syncs changes back to the store via `effect()`
4. The store triggers auto-save on step navigation

---

## Step 1: Zod Schemas with Cross-Field Validation

**File:** `schemas/wizard.schemas.ts`

### Base Schemas

```typescript
import { z } from 'zod';

// Base schemas with single-field validation
export const RequirementSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['visa', 'vaccination', 'insurance', 'document', 'other']),
  description: z.string().min(3, 'Description required'),
  completed: z.boolean().default(false),
});

export const ActivitySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2, 'Activity name required'),
  date: z.string().min(1, 'Date required'),
  duration: z.number().positive('Duration must be positive').optional(),
  notes: z.string().optional(),
  requirements: z.array(RequirementSchema),
});

export const DestinationSchema = z.object({
  id: z.string().uuid(),
  country: z.string().min(2, 'Country required'),
  city: z.string().min(2, 'City required'),
  arrivalDate: z.string().min(1, 'Arrival date required'),
  departureDate: z.string().min(1, 'Departure date required'),
  accommodation: z.string().optional(),
  activities: z.array(ActivitySchema).min(1, 'At least one activity required'),
});

export const TravelerSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string().min(1, 'First name required'),
  lastName: z.string().min(1, 'Last name required'),
  email: z.email('Valid email required'),
  phone: z.string().optional(),
  passportNumber: z.string().min(6, 'Passport number required'),
  passportExpiry: z.string().min(1, 'Passport expiry required'),
  nationality: z.string().min(2, 'Nationality required'),
});

export const TripSchema = z.object({
  traveler: TravelerSchema,
  destinations: z.array(DestinationSchema).min(1, 'At least one destination'),
  confirmed: z.boolean().default(false),
});
```

### Cross-Field Validation with `.refine()`

```typescript
// ══════════════════════════════════════════════════════════════════════════════
// CROSS-FIELD VALIDATION EXAMPLES
// ══════════════════════════════════════════════════════════════════════════════

// 1. Date Range Validation (arrivalDate < departureDate)
export const DestinationWithDateValidation = DestinationSchema.refine(
  (data) => new Date(data.departureDate) > new Date(data.arrivalDate),
  {
    message: 'Departure date must be after arrival date',
    path: ['departureDate'], // Error shows on departure field
  },
);

// 2. Password Confirmation Pattern
export const PasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'], // Error shows on confirm field
  });

// 3. Booking Date Range (start before end, both in future)
export const BookingDatesSchema = z
  .object({
    startDate: z.string().min(1, 'Start date required'),
    endDate: z.string().min(1, 'End date required'),
  })
  .refine((data) => new Date(data.startDate) >= new Date(), {
    message: 'Start date must be in the future',
    path: ['startDate'],
  })
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: 'End date must be after start date',
    path: ['endDate'],
  });

// 4. Conditional Required Field (phone required if no email)
export const ContactSchema = z
  .object({
    email: z.string().optional(),
    phone: z.string().optional(),
    preferredContact: z.enum(['email', 'phone', 'both']),
  })
  .refine(
    (data) => {
      if (
        data.preferredContact === 'email' ||
        data.preferredContact === 'both'
      ) {
        return !!data.email && data.email.includes('@');
      }
      return true;
    },
    { message: 'Valid email required for email contact', path: ['email'] },
  )
  .refine(
    (data) => {
      if (
        data.preferredContact === 'phone' ||
        data.preferredContact === 'both'
      ) {
        return !!data.phone && data.phone.length >= 10;
      }
      return true;
    },
    { message: 'Valid phone required for phone contact', path: ['phone'] },
  );

// 5. Activity Date Within Destination Range
export const validateActivityDates = (destination: Destination): string[] => {
  const errors: string[] = [];
  const arrival = new Date(destination.arrivalDate);
  const departure = new Date(destination.departureDate);

  destination.activities.forEach((activity, index) => {
    const activityDate = new Date(activity.date);
    if (activityDate < arrival || activityDate > departure) {
      errors.push(
        `Activity ${index + 1} date must be between arrival and departure`,
      );
    }
  });

  return errors;
};

// 6. Passport Expiry Validation (must be valid for 6 months after last departure)
export const TravelerWithPassportValidation = (lastDepartureDate: string) =>
  TravelerSchema.refine(
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

// 7. Age Restriction (traveler must be 18+)
export const TravelerWithAgeValidation = z
  .object({
    ...TravelerSchema.shape,
    dateOfBirth: z.string().min(1, 'Date of birth required'),
  })
  .refine(
    (data) => {
      const dob = new Date(data.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < dob.getDate())
      ) {
        return age - 1 >= 18;
      }
      return age >= 18;
    },
    {
      message: 'Traveler must be at least 18 years old',
      path: ['dateOfBirth'],
    },
  );
```

### Using Cross-Field Validation in Forms

```typescript
// In traveler-step.form.ts
import {
  TravelerSchema,
  TravelerWithPassportValidation,
} from '../schemas/wizard.schemas';

export function createTravelerForm(store: WizardStore) {
  const lastDeparture = store.lastDepartureDate(); // computed from destinations

  // Use dynamic cross-field validation
  const schema = lastDeparture
    ? TravelerWithPassportValidation(lastDeparture)
    : TravelerSchema;

  return {
    model: signal<Traveler>(store.traveler() ?? createEmptyTraveler()),
    validate: (data: Traveler) => schema.safeParse(data),
  };
}
```

### Native Zod Integration via StandardSchema (Angular 21+)

Angular Signal Forms natively supports [Standard Schema](https://standardschema.dev/) libraries like Zod via `validateStandardSchema()`. **No custom adapters needed.**

```typescript
// Native Angular validation with Zod schemas - no custom utilities required!
import {
  form,
  validateStandardSchema,
  applyEach,
} from '@angular/forms/signals';
import { z } from 'zod';

// Zod schemas implement StandardSchemaV1 natively
const TravelerSchema = z.object({
  firstName: z.string().min(1, 'First name required'),
  lastName: z.string().min(1, 'Last name required'),
  email: z.email('Valid email required'),
  passportExpiry: z.string().min(1, 'Passport expiry required'),
});

// Usage in form - Angular's validateStandardSchema works directly with Zod!
const travelerForm = form(travelerModel, (path) => {
  validateStandardSchema(path, TravelerSchema);
});

// For nested arrays, use applyEach with validateStandardSchema
const tripForm = form(tripModel, (path) => {
  applyEach(path.destinations, (destPath) => {
    validateStandardSchema(destPath, DestinationSchema);
    applyEach(destPath.activities, (actPath) => {
      validateStandardSchema(actPath, ActivitySchema);
    });
  });
});
```

### Type Inference

```typescript
// Infer types from schemas
export type Requirement = z.infer<typeof RequirementSchema>;
export type Activity = z.infer<typeof ActivitySchema>;
export type Destination = z.infer<typeof DestinationSchema>;
export type Traveler = z.infer<typeof TravelerSchema>;
export type Trip = z.infer<typeof TripSchema>;
```

### Factory Functions

```typescript
// Factory functions for empty entities
export function createEmptyRequirement(): Requirement {
  return {
    id: crypto.randomUUID(),
    type: 'other',
    description: '',
    completed: false,
  };
}

export function createEmptyActivity(): Activity {
  return {
    id: crypto.randomUUID(),
    name: '',
    date: '',
    requirements: [createEmptyRequirement()],
  };
}

export function createEmptyDestination(): Destination {
  return {
    id: crypto.randomUUID(),
    country: '',
    city: '',
    arrivalDate: '',
    departureDate: '',
    activities: [createEmptyActivity()],
  };
}

export function createEmptyTraveler(): Traveler {
  return {
    id: crypto.randomUUID(),
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    passportNumber: '',
    passportExpiry: '',
    nationality: '',
  };
}
```

---

## Angular 21.1 Lifecycle Best Practices

### Render Hooks vs Traditional Lifecycle

| Traditional Hook     | Angular 21.1 Alternative | Use Case                         |
| -------------------- | ------------------------ | -------------------------------- |
| `ngOnInit`           | Constructor + `effect()` | Initialize reactive state        |
| `ngAfterViewInit`    | `afterNextRender()`      | One-time DOM access after render |
| `ngAfterViewChecked` | `afterRender()`          | Every render DOM access          |
| `ngOnDestroy`        | `DestroyRef.onDestroy()` | Cleanup resources                |
| N/A (new)            | `afterRenderEffect()`    | Reactive DOM manipulation        |

### Key Principles

1. **Use constructor for initialization** - Signal effects and injections work in constructor
2. **Use `effect()` for reactive side effects** - Replaces `ngOnChanges` patterns
3. **Use `afterNextRender()` for DOM operations** - Runs once after first render
4. **Use `afterRenderEffect()` for reactive DOM** - Re-runs when dependencies change
5. **Use `DestroyRef` for cleanup** - Inject and register cleanup callbacks

### Example Patterns

```typescript
import {
  Component,
  inject,
  effect,
  DestroyRef,
  afterNextRender,
  afterRenderEffect,
} from '@angular/core';

@Component({
  /* ... */
})
export class ModernComponent {
  readonly #store = inject(WizardStore);
  readonly #destroyRef = inject(DestroyRef);

  constructor() {
    // Reactive initialization (replaces ngOnInit + effect)
    effect(() => {
      this.#store.markStepValid('traveler', this.stepForm.isValid());
    });

    // One-time DOM setup (replaces ngAfterViewInit)
    afterNextRender(() => {
      this.stepForm = createTravelerStepForm(this.#store);
    });

    // Reactive DOM updates (new capability)
    afterRenderEffect(() => {
      // This re-runs when any read signals change
      const isValid = this.stepForm.isValid();
      // DOM manipulation based on signal state
    });

    // Cleanup (replaces ngOnDestroy)
    this.#destroyRef.onDestroy(() => {
      this.stepForm.syncToStore();
    });
  }
}
```

---

## Step 2: NgRx Signal Store Features

### Using `rxMethod` for Reactive Store Methods

NgRx's `rxMethod` from `@ngrx/signals/rxjs-interop` creates methods that:

- Accept signals or static values as input
- Process through RxJS pipelines
- Automatically track pending/error states

```typescript
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, debounceTime } from 'rxjs';
import { tapResponse } from '@ngrx/operators';

// In withMethods:
loadByQuery: rxMethod<string>(
  pipe(
    debounceTime(300),
    tap(() => patchState(store, { isLoading: true })),
    switchMap((query) =>
      api.search(query).pipe(
        tapResponse({
          next: (results) => patchState(store, { results, isLoading: false }),
          error: (err) => patchState(store, { error: err, isLoading: false }),
        }),
      ),
    ),
  ),
);
```

### Navigation Feature

**File:** `stores/features/navigation.feature.ts`

```typescript
import { computed, inject } from '@angular/core';
import {
  patchState,
  signalStoreFeature,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, tap, switchMap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';

export type WizardStep = 'traveler' | 'trip' | 'review';

interface NavigationState {
  currentStep: WizardStep;
  visitedSteps: WizardStep[];
  stepValidation: Record<WizardStep, boolean>;
  draftId: string | null;
  lastSavedAt: Date | null;
}

const STEPS: WizardStep[] = ['traveler', 'trip', 'review'];

export function withWizardNavigation() {
  return signalStoreFeature(
    withState<NavigationState>({
      currentStep: 'traveler',
      visitedSteps: ['traveler'],
      stepValidation: { traveler: false, trip: false, review: false },
      draftId: null,
      lastSavedAt: null,
    }),

    withComputed((store) => ({
      canProceed: computed(() => store.stepValidation()[store.currentStep()]),
      isFirstStep: computed(() => store.currentStep() === 'traveler'),
      isLastStep: computed(() => store.currentStep() === 'review'),
      currentStepIndex: computed(() => STEPS.indexOf(store.currentStep())),
      progress: computed(() => {
        const idx = STEPS.indexOf(store.currentStep());
        return ((idx + 1) / STEPS.length) * 100;
      }),
    })),

    withMethods((store) => ({
      // Simple state updates
      goToStep(step: WizardStep): void {
        if (store.visitedSteps().includes(step) || store.canProceed()) {
          patchState(store, {
            currentStep: step,
            visitedSteps: [...new Set([...store.visitedSteps(), step])],
          });
        }
      },

      markStepValid(step: WizardStep, isValid: boolean): void {
        patchState(store, (s) => ({
          stepValidation: { ...s.stepValidation, [step]: isValid },
        }));
      },

      setDraftSaved(draftId: string): void {
        patchState(store, {
          draftId,
          lastSavedAt: new Date(),
        });
      },
    })),
  );
}
```

### Trip Feature (Nested Arrays CRUD)

**File:** `stores/features/trip.feature.ts`

```typescript
import { computed } from '@angular/core';
import {
  patchState,
  signalStoreFeature,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import {
  Destination,
  Activity,
  Requirement,
  DestinationSchema,
  createEmptyDestination,
  createEmptyActivity,
  createEmptyRequirement,
} from '../../schemas/wizard.schemas';

interface TripState {
  destinations: Destination[];
}

export function withTrip() {
  return signalStoreFeature(
    withState<TripState>({
      destinations: [createEmptyDestination()],
    }),

    withComputed((store) => ({
      destinationCount: computed(() => store.destinations().length),
      tripValid: computed(() =>
        store
          .destinations()
          .every((d) => DestinationSchema.safeParse(d).success),
      ),
      allActivities: computed(() =>
        store.destinations().flatMap((d) => d.activities),
      ),
      allRequirements: computed(() =>
        store
          .destinations()
          .flatMap((d) => d.activities.flatMap((a) => a.requirements)),
      ),
    })),

    withMethods((store) => ({
      // Destinations CRUD
      addDestination(): void {
        patchState(store, (s) => ({
          destinations: [...s.destinations, createEmptyDestination()],
        }));
      },

      removeDestination(index: number): void {
        patchState(store, (s) => ({
          destinations: s.destinations.filter((_, i) => i !== index),
        }));
      },

      updateDestination(index: number, updates: Partial<Destination>): void {
        patchState(store, (s) => ({
          destinations: s.destinations.map((d, i) =>
            i === index ? { ...d, ...updates } : d,
          ),
        }));
      },

      // Activities CRUD
      addActivity(destIndex: number): void {
        patchState(store, (s) => ({
          destinations: s.destinations.map((d, i) =>
            i === destIndex
              ? { ...d, activities: [...d.activities, createEmptyActivity()] }
              : d,
          ),
        }));
      },

      removeActivity(destIndex: number, actIndex: number): void {
        patchState(store, (s) => ({
          destinations: s.destinations.map((d, i) =>
            i === destIndex
              ? {
                  ...d,
                  activities: d.activities.filter((_, j) => j !== actIndex),
                }
              : d,
          ),
        }));
      },

      updateActivity(
        destIndex: number,
        actIndex: number,
        updates: Partial<Activity>,
      ): void {
        patchState(store, (s) => ({
          destinations: s.destinations.map((d, i) =>
            i === destIndex
              ? {
                  ...d,
                  activities: d.activities.map((a, j) =>
                    j === actIndex ? { ...a, ...updates } : a,
                  ),
                }
              : d,
          ),
        }));
      },

      // Requirements CRUD
      addRequirement(destIndex: number, actIndex: number): void {
        patchState(store, (s) => ({
          destinations: s.destinations.map((d, di) =>
            di === destIndex
              ? {
                  ...d,
                  activities: d.activities.map((a, ai) =>
                    ai === actIndex
                      ? {
                          ...a,
                          requirements: [
                            ...a.requirements,
                            createEmptyRequirement(),
                          ],
                        }
                      : a,
                  ),
                }
              : d,
          ),
        }));
      },

      removeRequirement(
        destIndex: number,
        actIndex: number,
        reqIndex: number,
      ): void {
        patchState(store, (s) => ({
          destinations: s.destinations.map((d, di) =>
            di === destIndex
              ? {
                  ...d,
                  activities: d.activities.map((a, ai) =>
                    ai === actIndex
                      ? {
                          ...a,
                          requirements: a.requirements.filter(
                            (_, ri) => ri !== reqIndex,
                          ),
                        }
                      : a,
                  ),
                }
              : d,
          ),
        }));
      },

      // Bulk operations
      setDestinations(destinations: Destination[]): void {
        patchState(store, { destinations });
      },
    })),
  );
}
```

### Main Store with Resource & Mutations

**File:** `stores/wizard.store.ts`

Uses ngrx-toolkit's `withResource` for loading, `withMutations` with `httpMutation` for API calls, and NgRx's `rxMethod` for reactive methods.

```typescript
import { computed, effect, inject, resource } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import {
  httpMutation,
  withMutations,
  withResource,
} from '@angular-architects/ngrx-toolkit';
import { pipe, switchMap, tap, debounceTime } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { withWizardNavigation } from './features/navigation.feature';
import { withTrip } from './features/trip.feature';
import { Traveler, Trip, TripSchema } from '../schemas/wizard.schemas';
import { WizardApiService } from '../services/wizard-api.service';
import { firstValueFrom } from 'rxjs';

interface WizardState {
  traveler: Traveler | null;
  isLoading: boolean;
  error: string | null;
}

export const WizardStore = signalStore(
  { providedIn: 'root' },

  withState<WizardState>({
    traveler: null,
    isLoading: false,
    error: null,
  }),

  // Compose features
  withWizardNavigation(),
  withTrip(),

  // Resource for loading draft data (ngrx-toolkit)
  withResource(
    'draftResource',
    (store, api = inject(WizardApiService)) =>
      resource({
        request: () => store.draftId(), // reactive to draftId changes
        loader: async ({ request: draftId }) => {
          if (!draftId) return null;
          return firstValueFrom(api.loadDraft(draftId));
        },
        defaultValue: null,
      }),
    {
      onSuccess: (draft, store) => {
        if (draft) {
          patchState(store, { traveler: draft.traveler });
          store.setDestinations(draft.destinations);
        }
      },
      onError: (error, store) => {
        patchState(store, { error: 'Failed to load draft' });
      },
    },
  ),

  // Computed
  withComputed((store) => ({
    tripData: computed<Trip | null>(() => {
      const traveler = store.traveler();
      if (!traveler) return null;
      return {
        traveler,
        destinations: store.destinations(),
        confirmed: store.currentStep() === 'review',
      };
    }),

    isValid: computed(() => {
      const data = store.tripData?.();
      if (!data) return false;
      return TripSchema.safeParse(data).success;
    }),

    validationErrors: computed(() => {
      const data = store.tripData?.();
      if (!data) return [];
      const result = TripSchema.safeParse(data);
      return result.success ? [] : result.error.issues;
    }),

    // Resource loading state
    isLoadingDraft: computed(() => store.draftResource.isLoading()),
  })),

  // Mutations for API calls (ngrx-toolkit)
  withMutations((store, api = inject(WizardApiService)) => ({
    saveDraft: httpMutation<
      { draftId: string | null; step: string; data: unknown },
      { draftId: string }
    >({
      request: (data) => ({
        url: data.draftId
          ? `/api/wizard/draft/${data.draftId}`
          : '/api/wizard/draft',
        method: data.draftId ? 'PUT' : 'POST',
        body: data,
      }),
      parse: (response) => response as { draftId: string },
      onSuccess: (response) => {
        store.setDraftSaved(response.draftId);
      },
      onError: (error) => {
        console.error('Failed to save draft:', error);
      },
    }),

    submitTrip: httpMutation<Trip, { bookingId: string }>({
      request: (trip) => ({
        url: '/api/wizard/submit',
        method: 'POST',
        body: trip,
      }),
      parse: (response) => response as { bookingId: string },
      onSuccess: (_response) => {
        patchState(store, { error: null });
      },
      onError: (error) => {
        patchState(store, { error: 'Submission failed' });
      },
    }),
  })),

  // Methods with rxMethod for reactive patterns
  withMethods((store) => ({
    setTraveler(traveler: Traveler): void {
      patchState(store, { traveler });
    },

    // Reactive auto-save triggered by signal changes
    autoSave: rxMethod<{ step: string; data: unknown }>(
      pipe(
        debounceTime(2000), // Debounce rapid changes
        tap(({ step, data }) => {
          store.saveDraft({
            draftId: store.draftId(),
            step,
            data,
          });
        }),
      ),
    ),

    nextStep(getCurrentStepData: () => unknown): void {
      if (!store.canProceed() || store.isLastStep()) return;

      // Auto-save before navigation
      store.saveDraft({
        draftId: store.draftId(),
        step: store.currentStep(),
        data: getCurrentStepData(),
      });

      const steps = ['traveler', 'trip', 'review'] as const;
      const nextIdx = store.currentStepIndex() + 1;
      store.goToStep(steps[nextIdx]);
    },

    previousStep(getCurrentStepData: () => unknown): void {
      if (store.isFirstStep()) return;

      // Auto-save before navigation
      store.saveDraft({
        draftId: store.draftId(),
        step: store.currentStep(),
        data: getCurrentStepData(),
      });

      const steps = ['traveler', 'trip', 'review'] as const;
      const prevIdx = store.currentStepIndex() - 1;
      store.goToStep(steps[prevIdx]);
    },

    submit(): void {
      const data = store.tripData();
      if (data && store.isValid()) {
        store.submitTrip(data);
      }
    },
  })),

  // Initialization hooks
  withHooks({
    onInit(store) {
      // Auto-validate steps when data changes
      effect(() => {
        const traveler = store.traveler();
        store.markStepValid('traveler', !!traveler?.passportNumber);
      });

      effect(() => {
        const isValid = store.tripValid();
        store.markStepValid('trip', isValid);
      });

      effect(() => {
        const travelerValid = store.stepValidation().traveler;
        const tripValid = store.stepValidation().trip;
        store.markStepValid('review', travelerValid && tripValid);
      });
    },
  }),
);
```

---

## Step 3: Separate Form Files (Per-Step)

Each step has its own `.form.ts` file containing **only** the form logic, keeping components focused on presentation.

### Traveler Step Form

**File:** `forms/traveler-step.form.ts`

```typescript
import {
  signal,
  computed,
  effect,
  inject,
  type Signal,
  type WritableSignal,
} from '@angular/core';
import {
  form,
  validate,
  validateStandardSchema,
  type SignalForm,
} from '@angular/forms/signals';
import { WizardStore } from '../stores/wizard.store';
import {
  Traveler,
  TravelerSchema,
  createEmptyTraveler,
} from '../schemas/wizard.schemas';

export interface TravelerStepForm {
  readonly model: WritableSignal<Traveler>;
  readonly form: SignalForm<Traveler>;
  readonly isValid: Signal<boolean>;
  readonly errors: Signal<string[]>;
  syncToStore(): void;
}

export function createTravelerStepForm(
  store: InstanceType<typeof WizardStore>,
): TravelerStepForm {
  // Local signal initialized from store
  const model = signal<Traveler>(store.traveler() ?? createEmptyTraveler());

  // Create form with native StandardSchema validation (Zod works directly!)
  const travelerForm = form(model, (path) => {
    validateStandardSchema(path, TravelerSchema);
  });

  // Computed validation state
  const isValid = computed(() => travelerForm.valid());

  const errors = computed(() => {
    const result = schema.safeParse(model());
    return result.success ? [] : result.error.issues.map((i) => i.message);
  });

  // Sync changes back to store
  const syncToStore = () => {
    if (isValid()) {
      store.setTraveler(model());
    }
  };

  return {
    model,
    form: travelerForm,
    isValid,
    errors,
    syncToStore,
  };
}
```

### Trip Step Form

**File:** `forms/trip-step.form.ts`

```typescript
import {
  signal,
  computed,
  effect,
  type Signal,
  type WritableSignal,
} from '@angular/core';
import {
  form,
  validateStandardSchema,
  applyEach,
  type SignalForm,
} from '@angular/forms/signals';
import { WizardStore } from '../stores/wizard.store';
import {
  Destination,
  DestinationSchema,
  ActivitySchema,
  RequirementSchema,
  validateActivityDates,
  createEmptyDestination,
} from '../schemas/wizard.schemas';

interface TripModel {
  destinations: Destination[];
}

export interface TripStepForm {
  readonly model: WritableSignal<TripModel>;
  readonly form: SignalForm<TripModel>;
  readonly isValid: Signal<boolean>;
  readonly errors: Signal<string[]>;
  readonly destinationCount: Signal<number>;

  // CRUD operations (delegate to store)
  addDestination(): void;
  removeDestination(index: number): void;
  addActivity(destIndex: number): void;
  removeActivity(destIndex: number, actIndex: number): void;
  addRequirement(destIndex: number, actIndex: number): void;
  removeRequirement(
    destIndex: number,
    actIndex: number,
    reqIndex: number,
  ): void;

  syncToStore(): void;
}

export function createTripStepForm(
  store: InstanceType<typeof WizardStore>,
): TripStepForm {
  // Local signal initialized from store
  const model = signal<TripModel>({ destinations: store.destinations() });

  // Create form
  const tripForm = form(model);

  // Validate all destinations including cross-field rules
  const isValid = computed(() => {
    const destinations = model().destinations;
    if (destinations.length === 0) return false;

    return destinations.every((dest) => {
      // Single-field validation
      const baseValid = DestinationWithDateValidation.safeParse(dest).success;
      // Cross-field: activity dates within destination range
      const activityErrors = validateActivityDates(dest);
      return baseValid && activityErrors.length === 0;
    });
  });

  const errors = computed(() => {
    const allErrors: string[] = [];
    model().destinations.forEach((dest, i) => {
      const result = DestinationWithDateValidation.safeParse(dest);
      if (!result.success) {
        result.error.issues.forEach((issue) => {
          allErrors.push(`Destination ${i + 1}: ${issue.message}`);
        });
      }
      // Cross-field activity validation
      validateActivityDates(dest).forEach((err) => {
        allErrors.push(`Destination ${i + 1}: ${err}`);
      });
    });
    return allErrors;
  });

  const destinationCount = computed(() => model().destinations.length);

  // CRUD delegated to store, then sync back to local model
  const addDestination = () => {
    store.addDestination();
    model.set({ destinations: store.destinations() });
  };

  const removeDestination = (index: number) => {
    store.removeDestination(index);
    model.set({ destinations: store.destinations() });
  };

  const addActivity = (destIndex: number) => {
    store.addActivity(destIndex);
    model.set({ destinations: store.destinations() });
  };

  const removeActivity = (destIndex: number, actIndex: number) => {
    store.removeActivity(destIndex, actIndex);
    model.set({ destinations: store.destinations() });
  };

  const addRequirement = (destIndex: number, actIndex: number) => {
    store.addRequirement(destIndex, actIndex);
    model.set({ destinations: store.destinations() });
  };

  const removeRequirement = (
    destIndex: number,
    actIndex: number,
    reqIndex: number,
  ) => {
    store.removeRequirement(destIndex, actIndex, reqIndex);
    model.set({ destinations: store.destinations() });
  };

  const syncToStore = () => {
    store.setDestinations(model().destinations);
  };

  return {
    model,
    form: tripForm,
    isValid,
    errors,
    destinationCount,
    addDestination,
    removeDestination,
    addActivity,
    removeActivity,
    addRequirement,
    removeRequirement,
    syncToStore,
  };
}
```

### Review Step Form

**File:** `forms/review-step.form.ts`

```typescript
import { signal, computed, type Signal } from '@angular/core';
import { WizardStore } from '../stores/wizard.store';
import { Trip, TripSchema } from '../schemas/wizard.schemas';

export interface ReviewStepForm {
  readonly tripSummary: Signal<Trip | null>;
  readonly isValid: Signal<boolean>;
  readonly allErrors: Signal<string[]>;
  readonly canSubmit: Signal<boolean>;
}

export function createReviewStepForm(
  store: InstanceType<typeof WizardStore>,
): ReviewStepForm {
  // Read-only computed from store (no local model needed)
  const tripSummary = computed<Trip | null>(() => store.tripData());

  const isValid = computed(() => {
    const data = tripSummary();
    if (!data) return false;
    return TripSchema.safeParse(data).success;
  });

  const allErrors = computed(() => {
    const data = tripSummary();
    if (!data) return ['Trip data is incomplete'];

    const result = TripSchema.safeParse(data);
    if (result.success) return [];

    return result.error.issues.map((issue) => {
      const path = issue.path.join(' → ');
      return path ? `${path}: ${issue.message}` : issue.message;
    });
  });

  const canSubmit = computed(() => isValid() && !store.submitTripIsPending?.());

  return {
    tripSummary,
    isValid,
    allErrors,
    canSubmit,
  };
}
```

---

## Step 4: Components (Using Form Files)

### Wizard Container

**File:** `components/wizard-container.component.ts`

```typescript
import {
  Component,
  ChangeDetectionStrategy,
  inject,
  input,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { WizardStore } from '../stores/wizard.store';
import { TravelerStepComponent } from './traveler-step.component';
import { TripStepComponent } from './trip-step.component';
import { ReviewStepComponent } from './review-step.component';

@Component({
  selector: 'ngx-advanced-wizard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    TravelerStepComponent,
    TripStepComponent,
    ReviewStepComponent,
  ],
  template: `
    <!-- Progress Bar -->
    <div class="mb-6">
      <div class="h-2 rounded-full bg-gray-200">
        <div
          class="h-full rounded-full bg-indigo-600 transition-all duration-300"
          [style.width.%]="store.progress()"
        ></div>
      </div>
      <nav class="mt-2 flex justify-between text-sm" aria-label="Wizard steps">
        @for (step of steps; track step.id; let i = $index) {
          <button
            type="button"
            (click)="store.goToStep(step.id)"
            [class.text-indigo-600]="store.currentStep() === step.id"
            [class.font-semibold]="store.currentStep() === step.id"
            [disabled]="!store.visitedSteps().includes(step.id)"
            [attr.aria-current]="
              store.currentStep() === step.id ? 'step' : null
            "
            class="disabled:cursor-not-allowed disabled:text-gray-400"
          >
            {{ i + 1 }}. {{ step.label }}
          </button>
        }
      </nav>
    </div>

    <!-- Loading State -->
    @if (store.isLoading()) {
      <div class="flex items-center justify-center py-12" role="status">
        <span class="text-gray-500">Loading...</span>
      </div>
    } @else {
      <!-- Step Content -->
      <main class="min-h-[400px]">
        @switch (store.currentStep()) {
          @case ('traveler') {
            <ngx-traveler-step />
          }
          @case ('trip') {
            <ngx-trip-step />
          }
          @case ('review') {
            <ngx-review-step />
          }
        }
      </main>

      <!-- Auto-save indicator -->
      @if (store.lastSavedAt(); as savedAt) {
        <div class="mt-2 text-sm text-gray-500" aria-live="polite">
          Auto-saved: {{ savedAt | date: 'HH:mm:ss' }}
        </div>
      }

      <!-- Navigation Footer -->
      <footer class="mt-8 flex justify-between border-t pt-4">
        <button
          type="button"
          (click)="onPrevious()"
          [disabled]="store.isFirstStep()"
          class="rounded-md border px-4 py-2 disabled:opacity-50"
        >
          Back
        </button>

        @if (store.isLastStep()) {
          <button
            type="button"
            (click)="store.submit()"
            [disabled]="!store.isValid() || store.submitTripIsPending()"
            class="rounded-md bg-indigo-600 px-4 py-2 text-white disabled:opacity-50"
          >
            @if (store.submitTripIsPending()) {
              Submitting...
            } @else {
              Book Trip
            }
          </button>
        } @else {
          <button
            type="button"
            (click)="onNext()"
            [disabled]="!store.canProceed()"
            class="rounded-md bg-indigo-600 px-4 py-2 text-white disabled:opacity-50"
          >
            Next
          </button>
        }
      </footer>
    }
  `,
})
export class WizardContainerComponent {
  readonly draftId = input<string>();

  protected readonly store = inject(WizardStore);

  protected readonly steps = [
    { id: 'traveler' as const, label: 'Traveler' },
    { id: 'trip' as const, label: 'Trip' },
    { id: 'review' as const, label: 'Review' },
  ];

  protected onNext(): void {
    this.store.nextStep(() => this.#getCurrentStepData());
  }

  protected onPrevious(): void {
    this.store.previousStep(() => this.#getCurrentStepData());
  }

  #getCurrentStepData(): unknown {
    switch (this.store.currentStep()) {
      case 'traveler':
        return this.store.traveler();
      case 'trip':
        return this.store.destinations();
      case 'review':
        return { confirmed: true };
    }
  }
}
```

### Traveler Step Component (Using Form File)

**File:** `components/traveler-step.component.ts`

Uses Angular 21.1 lifecycle patterns: constructor initialization, `effect()` for reactivity, `DestroyRef` for cleanup.

```typescript
import {
  Component,
  ChangeDetectionStrategy,
  inject,
  effect,
  DestroyRef,
} from '@angular/core';
import { FormField } from '@angular/forms/signals';
import {
  NgxSignalFormToolkit,
  NgxSignalFormError,
} from '@ngx-signal-forms/toolkit';
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';
import { WizardStore } from '../stores/wizard.store';
import {
  createTravelerStepForm,
  type TravelerStepForm,
} from '../forms/traveler-step.form';

@Component({
  selector: 'ngx-traveler-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, NgxSignalFormToolkit, NgxFormField, NgxSignalFormError],
  template: `
    <div class="space-y-6">
      <h3 class="text-lg font-semibold">Traveler Information</h3>

      <div class="grid gap-4 md:grid-cols-2">
        <ngx-signal-form-field-wrapper
          [formField]="stepForm.form.firstName"
          outline
        >
          <label for="firstName">First Name</label>
          <input
            id="firstName"
            type="text"
            [formField]="stepForm.form.firstName"
          />
        </ngx-signal-form-field-wrapper>

        <ngx-signal-form-field-wrapper
          [formField]="stepForm.form.lastName"
          outline
        >
          <label for="lastName">Last Name</label>
          <input
            id="lastName"
            type="text"
            [formField]="stepForm.form.lastName"
          />
        </ngx-signal-form-field-wrapper>

        <ngx-signal-form-field-wrapper
          [formField]="stepForm.form.email"
          outline
        >
          <label for="email">Email</label>
          <input id="email" type="email" [formField]="stepForm.form.email" />
        </ngx-signal-form-field-wrapper>

        <ngx-signal-form-field-wrapper
          [formField]="stepForm.form.phone"
          outline
        >
          <label for="phone">Phone (optional)</label>
          <input id="phone" type="tel" [formField]="stepForm.form.phone" />
        </ngx-signal-form-field-wrapper>

        <ngx-signal-form-field-wrapper
          [formField]="stepForm.form.passportNumber"
          outline
        >
          <label for="passportNumber">Passport Number</label>
          <input
            id="passportNumber"
            type="text"
            [formField]="stepForm.form.passportNumber"
          />
        </ngx-signal-form-field-wrapper>

        <ngx-signal-form-field-wrapper
          [formField]="stepForm.form.passportExpiry"
          outline
        >
          <label for="passportExpiry">Passport Expiry</label>
          <input
            id="passportExpiry"
            type="date"
            [formField]="stepForm.form.passportExpiry"
          />
          <!-- Cross-field validation error (6-month rule) -->
          <ngx-signal-form-error
            [formField]="stepForm.form.passportExpiry"
            fieldName="passportExpiry"
          />
        </ngx-signal-form-field-wrapper>

        <ngx-signal-form-field-wrapper
          [formField]="stepForm.form.nationality"
          outline
          class="md:col-span-2"
        >
          <label for="nationality">Nationality</label>
          <input
            id="nationality"
            type="text"
            [formField]="stepForm.form.nationality"
          />
        </ngx-signal-form-field-wrapper>
      </div>

      <!-- Validation summary -->
      @if (stepForm.errors().length > 0) {
        <div class="rounded-md bg-red-50 p-4" role="alert">
          <ul class="list-disc pl-5 text-sm text-red-700">
            @for (error of stepForm.errors(); track error) {
              <li>{{ error }}</li>
            }
          </ul>
        </div>
      }
    </div>
  `,
})
export class TravelerStepComponent {
  readonly #store = inject(WizardStore);
  readonly #destroyRef = inject(DestroyRef);
  protected readonly stepForm: TravelerStepForm;

  constructor() {
    // Initialize form in constructor (replaces ngOnInit)
    this.stepForm = createTravelerStepForm(this.#store);

    // Reactive validation sync (replaces ngOnInit effect)
    effect(() => {
      this.#store.markStepValid('traveler', this.stepForm.isValid());
    });

    // Cleanup (replaces ngOnDestroy)
    this.#destroyRef.onDestroy(() => {
      this.stepForm.syncToStore();
    });
  }
}
```

### Trip Step Component (Using Form File)

**File:** `components/trip-step.component.ts`

Uses Angular 21.1 lifecycle patterns: constructor initialization, `effect()` for reactivity, `DestroyRef` for cleanup.

```typescript
import {
  Component,
  ChangeDetectionStrategy,
  inject,
  effect,
  DestroyRef,
} from '@angular/core';
import { FormField } from '@angular/forms/signals';
import {
  NgxSignalFormToolkit,
  NgxSignalFormError,
} from '@ngx-signal-forms/toolkit';
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';
import { WizardStore } from '../stores/wizard.store';
import { createTripStepForm, type TripStepForm } from '../forms/trip-step.form';

@Component({
  selector: 'ngx-trip-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, NgxSignalFormToolkit, NgxFormField, NgxSignalFormError],
  template: `
    <div class="space-y-6">
      <h3 class="text-lg font-semibold">Trip Details</h3>

      @for (
        dest of stepForm.model().destinations;
        track dest.id;
        let di = $index
      ) {
        <section
          class="rounded-lg border p-4"
          [attr.aria-label]="'Destination ' + (di + 1)"
        >
          <header class="mb-4 flex items-center justify-between">
            <h4 class="font-medium">Destination {{ di + 1 }}</h4>
            @if (stepForm.destinationCount() > 1) {
              <button
                type="button"
                (click)="stepForm.removeDestination(di)"
                class="text-red-600 hover:text-red-800"
                [attr.aria-label]="'Remove destination ' + (di + 1)"
              >
                Remove
              </button>
            }
          </header>

          <!-- Destination fields -->
          <div class="grid gap-4 md:grid-cols-2">
            <ngx-signal-form-field-wrapper
              [formField]="stepForm.form.destinations[di].country"
              outline
            >
              <label [for]="'country-' + di">Country</label>
              <input
                [id]="'country-' + di"
                type="text"
                [formField]="stepForm.form.destinations[di].country"
              />
            </ngx-signal-form-field-wrapper>

            <ngx-signal-form-field-wrapper
              [formField]="stepForm.form.destinations[di].city"
              outline
            >
              <label [for]="'city-' + di">City</label>
              <input
                [id]="'city-' + di"
                type="text"
                [formField]="stepForm.form.destinations[di].city"
              />
            </ngx-signal-form-field-wrapper>

            <ngx-signal-form-field-wrapper
              [formField]="stepForm.form.destinations[di].arrivalDate"
              outline
            >
              <label [for]="'arrival-' + di">Arrival Date</label>
              <input
                [id]="'arrival-' + di"
                type="date"
                [formField]="stepForm.form.destinations[di].arrivalDate"
              />
            </ngx-signal-form-field-wrapper>

            <ngx-signal-form-field-wrapper
              [formField]="stepForm.form.destinations[di].departureDate"
              outline
            >
              <label [for]="'departure-' + di">Departure Date</label>
              <input
                [id]="'departure-' + di"
                type="date"
                [formField]="stepForm.form.destinations[di].departureDate"
              />
              <!-- Cross-field: departure after arrival -->
              <ngx-signal-form-error
                [formField]="stepForm.form.destinations[di].departureDate"
                [fieldName]="'departure-' + di"
              />
            </ngx-signal-form-field-wrapper>
          </div>

          <!-- Activities (nested array) -->
          <div class="mt-4 space-y-3">
            <h5 class="font-medium">Activities</h5>

            @for (
              activity of dest.activities;
              track activity.id;
              let ai = $index
            ) {
              <div class="rounded border p-3">
                <div class="mb-2 flex items-center justify-between">
                  <span class="text-sm text-gray-600"
                    >Activity {{ ai + 1 }}</span
                  >
                  <button
                    type="button"
                    (click)="stepForm.removeActivity(di, ai)"
                    class="text-sm text-red-600"
                    aria-label="Remove activity"
                  >
                    ×
                  </button>
                </div>

                <div class="grid gap-3 md:grid-cols-2">
                  <ngx-signal-form-field-wrapper
                    [formField]="
                      stepForm.form.destinations[di].activities[ai].name
                    "
                    outline
                  >
                    <label [for]="'activity-name-' + di + '-' + ai">Name</label>
                    <input
                      [id]="'activity-name-' + di + '-' + ai"
                      type="text"
                      [formField]="
                        stepForm.form.destinations[di].activities[ai].name
                      "
                    />
                  </ngx-signal-form-field-wrapper>

                  <ngx-signal-form-field-wrapper
                    [formField]="
                      stepForm.form.destinations[di].activities[ai].date
                    "
                    outline
                  >
                    <label [for]="'activity-date-' + di + '-' + ai">Date</label>
                    <input
                      [id]="'activity-date-' + di + '-' + ai"
                      type="date"
                      [formField]="
                        stepForm.form.destinations[di].activities[ai].date
                      "
                    />
                    <!-- Cross-field: activity date within destination range -->
                  </ngx-signal-form-field-wrapper>
                </div>

                <!-- Requirements (deepest nested array) -->
                <div class="mt-3 space-y-2 border-l-2 border-gray-200 pl-4">
                  <h6 class="text-sm font-medium">Requirements</h6>

                  @for (
                    req of activity.requirements;
                    track req.id;
                    let ri = $index
                  ) {
                    <div class="flex items-center gap-2">
                      <ngx-signal-form-field-wrapper
                        [formField]="
                          stepForm.form.destinations[di].activities[ai]
                            .requirements[ri].description
                        "
                        class="flex-1"
                        outline
                      >
                        <label
                          [for]="'req-' + di + '-' + ai + '-' + ri"
                          class="sr-only"
                        >
                          Requirement
                        </label>
                        <input
                          [id]="'req-' + di + '-' + ai + '-' + ri"
                          type="text"
                          [formField]="
                            stepForm.form.destinations[di].activities[ai]
                              .requirements[ri].description
                          "
                          placeholder="e.g., Visa, Vaccination"
                        />
                      </ngx-signal-form-field-wrapper>
                      <button
                        type="button"
                        (click)="stepForm.removeRequirement(di, ai, ri)"
                        class="text-red-600"
                        aria-label="Remove requirement"
                      >
                        ×
                      </button>
                    </div>
                  }

                  <button
                    type="button"
                    (click)="stepForm.addRequirement(di, ai)"
                    class="text-sm text-indigo-600"
                  >
                    + Add Requirement
                  </button>
                </div>
              </div>
            }

            <button
              type="button"
              (click)="stepForm.addActivity(di)"
              class="text-indigo-600"
            >
              + Add Activity
            </button>
          </div>
        </section>
      }

      <button
        type="button"
        (click)="stepForm.addDestination()"
        class="w-full rounded-lg border-2 border-dashed border-gray-300 p-4 text-gray-600 hover:border-indigo-500"
      >
        + Add Destination
      </button>

      <!-- Validation summary for all destinations -->
      @if (stepForm.errors().length > 0) {
        <div class="rounded-md bg-red-50 p-4" role="alert">
          <ul class="list-disc pl-5 text-sm text-red-700">
            @for (error of stepForm.errors(); track error) {
              <li>{{ error }}</li>
            }
          </ul>
        </div>
      }
    </div>
  `,
})
export class TripStepComponent {
  readonly #store = inject(WizardStore);
  readonly #destroyRef = inject(DestroyRef);
  protected readonly stepForm: TripStepForm;

  constructor() {
    // Initialize form in constructor (replaces ngOnInit)
    this.stepForm = createTripStepForm(this.#store);

    // Reactive validation sync
    effect(() => {
      this.#store.markStepValid('trip', this.stepForm.isValid());
    });

    // Cleanup (replaces ngOnDestroy)
    this.#destroyRef.onDestroy(() => {
      this.stepForm.syncToStore();
    });
  }
}
```

### Review Step Component (Using Form File)

**File:** `components/review-step.component.ts`

Uses Angular 21.1 lifecycle patterns: constructor initialization for read-only computed form.

```typescript
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { WizardStore } from '../stores/wizard.store';
import {
  createReviewStepForm,
  type ReviewStepForm,
} from '../forms/review-step.form';

@Component({
  selector: 'ngx-review-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, CurrencyPipe],
  template: `
    <div class="space-y-6">
      <h3 class="text-lg font-semibold">Review Your Trip</h3>

      @if (stepForm.tripSummary(); as trip) {
        <!-- Traveler Summary -->
        <section class="rounded-lg border p-4">
          <h4 class="mb-3 font-medium">Traveler</h4>
          <dl class="grid gap-2 text-sm md:grid-cols-2">
            <div>
              <dt class="text-gray-500">Name</dt>
              <dd>
                {{ trip.traveler.firstName }} {{ trip.traveler.lastName }}
              </dd>
            </div>
            <div>
              <dt class="text-gray-500">Email</dt>
              <dd>{{ trip.traveler.email }}</dd>
            </div>
            <div>
              <dt class="text-gray-500">Passport</dt>
              <dd>{{ trip.traveler.passportNumber }}</dd>
            </div>
            <div>
              <dt class="text-gray-500">Expires</dt>
              <dd>{{ trip.traveler.passportExpiry | date }}</dd>
            </div>
          </dl>
        </section>

        <!-- Destinations Summary -->
        @for (dest of trip.destinations; track dest.id; let i = $index) {
          <section class="rounded-lg border p-4">
            <h4 class="mb-3 font-medium">
              {{ dest.city }}, {{ dest.country }}
            </h4>
            <p class="mb-2 text-sm text-gray-600">
              {{ dest.arrivalDate | date }} – {{ dest.departureDate | date }}
            </p>

            <h5 class="mt-3 text-sm font-medium">
              Activities ({{ dest.activities.length }})
            </h5>
            <ul class="mt-1 space-y-1 text-sm">
              @for (activity of dest.activities; track activity.id) {
                <li class="flex justify-between">
                  <span>{{ activity.name }}</span>
                  <span class="text-gray-500">{{ activity.date | date }}</span>
                </li>
              }
            </ul>
          </section>
        }

        <!-- Validation Errors -->
        @if (stepForm.allErrors().length > 0) {
          <div class="rounded-md bg-red-50 p-4" role="alert">
            <h4 class="mb-2 font-medium text-red-800">
              Please fix these issues:
            </h4>
            <ul class="list-disc pl-5 text-sm text-red-700">
              @for (error of stepForm.allErrors(); track error) {
                <li>{{ error }}</li>
              }
            </ul>
          </div>
        }

        <!-- Ready to Submit -->
        @if (stepForm.canSubmit()) {
          <div class="rounded-md bg-green-50 p-4" role="status">
            <p class="text-green-800">✓ Your trip is ready to book!</p>
          </div>
        }
      } @else {
        <p class="text-gray-500">No trip data available.</p>
      }
    </div>
  `,
})
export class ReviewStepComponent {
  readonly #store = inject(WizardStore);
  protected readonly stepForm: ReviewStepForm;

  constructor() {
    // Initialize read-only form in constructor (replaces ngOnInit)
    this.stepForm = createReviewStepForm(this.#store);
  }
}
```

---

## Step 5: Implementation Tasks

### Phase 1: Foundation

- [ ] Create folder structure under `apps/demo/src/app/05-advanced/advanced-wizard/`
- [ ] Implement Zod schemas in `schemas/wizard.schemas.ts`
- [ ] Add cross-field validation with `.refine()` examples
- [ ] Use native `validateStandardSchema()` from Angular Signal Forms (Zod 4 is StandardSchema-compatible)
- [ ] Create factory functions for empty entities
- [ ] Add unit tests for schemas (including cross-field validation)

### Phase 2: Store

- [ ] Implement `navigation.feature.ts` with step management
- [ ] Implement `trip.feature.ts` with nested CRUD
- [ ] Implement `traveler.feature.ts` for step 1
- [ ] Compose main `wizard.store.ts` with:
  - [ ] `withResource` for loading draft data (ngrx-toolkit)
  - [ ] `withMutations` with `httpMutation` for save/submit (ngrx-toolkit)
  - [ ] `rxMethod` for reactive auto-save with debounce
- [ ] Add `withHooks` for validation effects
- [ ] Add unit tests for store

### Phase 3: Form Files

- [ ] Create `forms/traveler-step.form.ts` with cross-field passport validation
- [ ] Create `forms/trip-step.form.ts` with date range validation
- [ ] Create `forms/review-step.form.ts` (read-only computed)
- [ ] Add unit tests for form creation functions

### Phase 4: Components (Angular 21.1 Lifecycle)

- [ ] Create `wizard-container.component.ts`
- [ ] Create `traveler-step.component.ts`:
  - [ ] Constructor initialization (no ngOnInit)
  - [ ] `effect()` for validation sync
  - [ ] `DestroyRef.onDestroy()` for cleanup
- [ ] Create `trip-step.component.ts` (same patterns)
- [ ] Create `review-step.component.ts` (same patterns)
- [ ] Integrate `@ngx-signal-forms/toolkit` components
- [ ] Add accessibility attributes (ARIA)

### Phase 5: Integration

- [ ] Create `advanced-wizard.page.ts` wrapper
- [ ] Create `advanced-wizard.content.ts` for docs
- [ ] Add route in `app.routes.ts`
- [ ] Add mock API service for demo
- [ ] Add debugger integration
- [ ] Write E2E tests

### Phase 6: Polish

- [ ] Add animations for step transitions
- [ ] Add validation summary on review step
- [ ] Add error recovery UI
- [ ] Add loading skeletons
- [ ] Update demo navigation/README

---

## Angular 21.1.x Best Practices Checklist

| Practice                        | Implementation                                  |
| ------------------------------- | ----------------------------------------------- |
| Standalone components           | All components use `standalone: true` (default) |
| Signals for state               | `signal()`, `computed()` throughout             |
| `input()` / `output()`          | Signal-based inputs for draftId, etc.           |
| `OnPush` change detection       | All components                                  |
| `inject()` for DI               | No constructor injection                        |
| Native control flow             | `@if`, `@for`, `@switch`                        |
| No `ngClass` / `ngStyle`        | Class and style bindings                        |
| ES `#` private fields           | Used for private component state                |
| `form()` from Signal Forms      | Not FormBuilder                                 |
| `FormField` directive           | Not formControlName                             |
| Immutable signal updates        | `update()` not mutation                         |
| **Constructor initialization**  | No `ngOnInit` for setup                         |
| **`effect()` for reactivity**   | Reactive side effects in constructor            |
| **`DestroyRef` for cleanup**    | No `ngOnDestroy` lifecycle hook                 |
| **`afterNextRender()` for DOM** | One-time DOM operations after render            |
| **`rxMethod` for reactive API** | NgRx/signals rxjs-interop                       |
| **`withResource` for loading**  | ngrx-toolkit reactive data loading              |
| **`withMutations` for API**     | ngrx-toolkit `httpMutation` / `rxMutation`      |

---

## NgRx & ngrx-toolkit Features Used

| Feature              | Package                            | Use Case                             |
| -------------------- | ---------------------------------- | ------------------------------------ |
| `signalStore`        | `@ngrx/signals`                    | State container                      |
| `signalStoreFeature` | `@ngrx/signals`                    | Composable store features            |
| `withState`          | `@ngrx/signals`                    | Define initial state                 |
| `withComputed`       | `@ngrx/signals`                    | Derived state                        |
| `withMethods`        | `@ngrx/signals`                    | State update methods                 |
| `withHooks`          | `@ngrx/signals`                    | Store lifecycle (onInit)             |
| `patchState`         | `@ngrx/signals`                    | Immutable state updates              |
| `rxMethod`           | `@ngrx/signals/rxjs-interop`       | Reactive methods with RxJS pipelines |
| `withResource`       | `@angular-architects/ngrx-toolkit` | Reactive data loading                |
| `withMutations`      | `@angular-architects/ngrx-toolkit` | API mutations with state tracking    |
| `httpMutation`       | `@angular-architects/ngrx-toolkit` | HTTP-based mutations                 |
| `rxMutation`         | `@angular-architects/ngrx-toolkit` | RxJS-based mutations                 |
| `tapResponse`        | `@ngrx/operators`                  | Error handling in RxJS pipelines     |

---

## Content for Demo Page

```typescript
export const ADVANCED_WIZARD_CONTENT = {
  demonstrated: {
    title: 'Advanced Wizard with NgRx & Zod',
    sections: [
      {
        title: 'State Architecture',
        items: [
          '• <strong>NgRx Signal Store:</strong> Centralized state with <code>signalStoreFeature</code>',
          '• <strong>NgRx Toolkit:</strong> <code>withResource</code> for data loading, <code>httpMutation</code> for API calls',
          '• <strong>rxMethod:</strong> Reactive methods with RxJS pipelines for auto-save',
          '• <strong>Zod 4:</strong> Type-safe schemas with runtime validation',
          '• <strong>Cross-field validation:</strong> Date ranges, passport expiry, conditional required',
        ],
      },
      {
        title: 'Angular 21.1 Lifecycle Patterns',
        items: [
          '• <strong>Constructor initialization:</strong> No ngOnInit, setup in constructor',
          '• <strong>effect():</strong> Reactive side effects for validation sync',
          '• <strong>DestroyRef:</strong> Cleanup callbacks replace ngOnDestroy',
          '• <strong>afterNextRender:</strong> One-time DOM operations after render',
        ],
      },
      {
        title: 'Form-Per-Step Architecture',
        items: [
          '• <strong>Separate .form.ts files:</strong> Clean separation of form logic from components',
          '• <strong>Local signals synced to store:</strong> Each step manages its own form state',
          '• <strong>Auto-save on navigation:</strong> Triggered via rxMethod with debounce',
        ],
      },
      {
        title: 'Nested Arrays',
        items: [
          '• <strong>3-Level Nesting:</strong> Destinations → Activities → Requirements',
          '• <strong>Direct Store Access:</strong> No prop-drilling or event bubbling',
          '• <strong>Immutable Updates:</strong> Using <code>patchState</code>',
        ],
      },
    ],
  },
  learning: {
    title: 'Architecture Patterns',
    sections: [
      {
        title: 'When to Use',
        items: [
          '• Complex multi-step forms with nested data',
          '• Forms requiring auto-save or draft persistence',
          '• Shared state across multiple step components',
          '• Cross-field validation between related fields',
        ],
      },
      {
        title: 'ngrx-toolkit Features',
        items: [
          '• <code>withResource</code>: Reactive data loading triggered by signal changes',
          '• <code>withMutations</code>: API calls with automatic pending/error state',
          '• <code>httpMutation</code>: HTTP requests with progress tracking',
          '• <code>rxMutation</code>: RxJS-based mutations for complex async flows',
        ],
      },
    ],
  },
};
```

---

## Verification

### Manual Testing

1. Navigate through all steps
2. Add/remove nested items at each level
3. Verify auto-save triggers on navigation
4. Check validation errors display correctly
5. Test keyboard navigation
6. Verify screen reader announces step changes

### Automated Testing

```bash
# Unit tests for store
pnpm nx test demo --testPathPattern=advanced-wizard

# E2E tests
pnpm nx e2e demo-e2e --grep "advanced wizard"
```

---

## Related Resources

- [Nested Form Arrays Pattern](./NESTED_FORM_ARRAYS_PATTERN.md)
- [NgRx Signal Store](https://ngrx.io/guide/signals/signal-store)
- [NgRx rxMethod](https://ngrx.io/guide/signals/signal-store#reactive-methods)
- [NgRx Toolkit withMutations](https://ngrx-toolkit.angulararchitects.io/docs/mutations)
- [NgRx Toolkit withResource](https://ngrx-toolkit.angulararchitects.io/docs/with-resource)
- [NgRx Toolkit withEntityResources](https://ngrx-toolkit.angulararchitects.io/docs/with-entity-resources)
- [Zod 4 Documentation](https://zod.dev)
- [Angular Signal Forms](https://angular.dev/guide/forms/signals)
- [Angular afterRender/afterNextRender](https://angular.dev/api/core/afterRender)
