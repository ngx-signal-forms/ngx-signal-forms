import { httpMutation, withMutations } from '@angular-architects/ngrx-toolkit';
import { computed, effect } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { debounceTime, distinctUntilChanged, pipe, tap } from 'rxjs';

import {
  createEmptyDestination,
  Destination,
  Traveler,
  Trip,
} from '../schemas/wizard.schemas';
import {
  withWizardNavigation,
  type WizardStep,
} from './features/navigation.feature';
import { withTravelerManagement } from './features/traveler.feature';
import { withTripManagement } from './features/trip.feature';

export type { WizardStep } from './features/navigation.feature';

// ══════════════════════════════════════════════════════════════════════════════
// API TYPES (using `type` for consistency with Zod inference pattern)
// ══════════════════════════════════════════════════════════════════════════════

type DraftResponse = {
  draftId: string;
  savedAt: string;
};

type DraftData = {
  traveler: Traveler;
  destinations: Destination[];
};

type BookingResponse = {
  bookingId: string;
  confirmationNumber: string;
  status: 'confirmed' | 'pending';
};

type TripSummary = {
  traveler: Traveler;
  destinations: Destination[];
};

// ══════════════════════════════════════════════════════════════════════════════
// STORE
// ══════════════════════════════════════════════════════════════════════════════

export const WizardStore = signalStore(
  { providedIn: 'root' },

  withState({
    error: null as string | null,
  }),

  // Compose features
  withWizardNavigation(),
  withTravelerManagement(),
  withTripManagement(),

  // Computed values - derived state (no effects needed!)
  withComputed((store) => ({
    // ══════════════════════════════════════════════════════════════════════════
    // STEP VALIDATION - Pure computed, no side effects
    // ══════════════════════════════════════════════════════════════════════════
    isTravelerStepValid: computed(() => {
      const t = store.traveler();
      return !!t.firstName && !!t.lastName && !!t.email && !!t.passportNumber;
    }),

    isTripStepValid: computed(() => {
      const d = store.destinations();
      return (
        d.length > 0 &&
        d.every(
          (dest) =>
            dest.country && dest.city && dest.arrivalDate && dest.departureDate,
        )
      );
    }),

    isReviewStepValid: computed(() => {
      const t = store.traveler();
      const d = store.destinations();
      const travelerValid =
        !!t.firstName && !!t.lastName && !!t.email && !!t.passportNumber;
      const tripValid =
        d.length > 0 &&
        d.every(
          (dest) =>
            dest.country && dest.city && dest.arrivalDate && dest.departureDate,
        );
      return travelerValid && tripValid;
    }),

    /**
     * Returns validation status for all steps as a record.
     * Useful for templates that need to check multiple steps.
     */
    stepValidation: computed(
      (): Record<WizardStep, boolean> => ({
        traveler:
          !!store.traveler().firstName &&
          !!store.traveler().lastName &&
          !!store.traveler().email &&
          !!store.traveler().passportNumber,
        trip:
          store.destinations().length > 0 &&
          store
            .destinations()
            .every(
              (d) => d.country && d.city && d.arrivalDate && d.departureDate,
            ),
        review:
          !!store.traveler().firstName &&
          !!store.traveler().lastName &&
          !!store.traveler().email &&
          !!store.traveler().passportNumber &&
          store.destinations().length > 0 &&
          store
            .destinations()
            .every(
              (d) => d.country && d.city && d.arrivalDate && d.departureDate,
            ),
      }),
    ),

    /**
     * Whether the current step is valid and user can proceed.
     */
    canProceed: computed(() => {
      const step = store.currentStep();
      const t = store.traveler();
      const d = store.destinations();

      switch (step) {
        case 'traveler':
          return (
            !!t.firstName && !!t.lastName && !!t.email && !!t.passportNumber
          );
        case 'trip':
          return (
            d.length > 0 &&
            d.every(
              (dest) =>
                dest.country &&
                dest.city &&
                dest.arrivalDate &&
                dest.departureDate,
            )
          );
        case 'review':
          return true; // Review step is always "valid" for proceeding
        default:
          return false;
      }
    }),

    // ══════════════════════════════════════════════════════════════════════════
    // TRIP DATA
    // ══════════════════════════════════════════════════════════════════════════
    tripSummary: computed<TripSummary>(() => ({
      traveler: store.traveler(),
      destinations: store.destinations(),
    })),

    tripData: computed<Trip>(() => ({
      traveler: store.traveler(),
      destinations: store.destinations(),
      confirmed: false,
    })),

    isReadyToSubmit: computed(() => {
      const t = store.traveler();
      const d = store.destinations();
      return (
        !!t.firstName &&
        !!t.lastName &&
        !!t.email &&
        !!t.passportNumber &&
        d.length > 0 &&
        d.every(
          (dest) =>
            dest.country && dest.city && dest.arrivalDate && dest.departureDate,
        )
      );
    }),

    hasDestinations: computed(() => store.destinations().length > 0),
  })),

  // Mutations for API calls (ngrx-toolkit)
  // These automatically provide isPending, error, and value signals
  withMutations((store) => ({
    /**
     * Save draft to server.
     * Auto-creates new draft or updates existing based on draftId.
     */
    saveDraft: httpMutation<DraftData, DraftResponse>({
      request: (data) => {
        const draftId = store.draftId();
        return {
          url: draftId ? `/api/wizard/draft/${draftId}` : '/api/wizard/draft',
          method: draftId ? 'PUT' : 'POST',
          body: data,
        };
      },
      parse: (response) => response as DraftResponse,
      onSuccess: (response) => {
        store.setDraftSaved(response.draftId);
        patchState(store, { error: null });
      },
      onError: (error) => {
        patchState(store, { error: 'Failed to save draft' });
        console.error('Draft save failed:', error);
      },
    }),

    /**
     * Load existing draft from server.
     */
    loadDraft: httpMutation<string, DraftData>({
      request: (draftId) => ({
        url: `/api/wizard/draft/${draftId}`,
        method: 'GET',
      }),
      parse: (response) => response as DraftData,
      onSuccess: (data) => {
        store.setTraveler(data.traveler);
        store.setDestinations(data.destinations);
        patchState(store, { error: null });
      },
      onError: (error) => {
        patchState(store, { error: 'Failed to load draft' });
        console.error('Draft load failed:', error);
      },
    }),

    /**
     * Submit final booking.
     */
    submitBooking: httpMutation<Trip, BookingResponse>({
      request: (trip) => ({
        url: '/api/wizard/booking',
        method: 'POST',
        body: trip,
      }),
      parse: (response) => response as BookingResponse,
      onSuccess: (response) => {
        patchState(store, { error: null });
        console.log('Booking confirmed:', response.confirmationNumber);
      },
      onError: (error) => {
        patchState(store, { error: 'Booking submission failed' });
        console.error('Booking failed:', error);
      },
    }),
  })),

  // Expose mutation states for components
  withComputed((store) => ({
    // Expose mutation pending states for template binding
    isSaving: computed(() => store.saveDraftIsPending()),
    isLoading: computed(
      () => store.loadDraftIsPending() || store.submitBookingIsPending(),
    ),
    isSubmitting: computed(() => store.submitBookingIsPending()),
  })),

  // Additional methods
  withMethods((store) => {
    // Reactive auto-save with debounce using rxMethod
    const autoSave = rxMethod<TripSummary>(
      pipe(
        debounceTime(2000),
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
        tap((data) => {
          // Only save if we have meaningful data
          if (data.traveler.firstName || data.destinations.length > 0) {
            store.saveDraft(data);
          }
        }),
      ),
    );

    return {
      autoSave,

      /**
       * Submit the booking (convenience wrapper that checks validity)
       */
      submit(): void {
        if (!store.isReadyToSubmit()) {
          patchState(store, { error: 'Please complete all required fields' });
          return;
        }
        store.submitBooking(store.tripData());
      },

      /**
       * Reset wizard to initial state
       */
      reset(): void {
        store.resetTraveler();
        store.setDestinations([createEmptyDestination()]);
        store.goToStep('traveler');
        patchState(store, { error: null });
      },

      /**
       * Initialize wizard with a destination if empty
       */
      initializeIfEmpty(): void {
        if (store.destinations().length === 0) {
          store.setDestinations([createEmptyDestination()]);
        }
      },
    };
  }),

  // Store lifecycle hooks
  withHooks({
    onInit(store) {
      // Connect store state changes to auto-save
      // This ensures any commit (via navigation) or manual update triggers auto-save
      effect(() => {
        store.autoSave(store.tripSummary());
      });

      // Initialize wizard with a destination if empty
      store.initializeIfEmpty();
    },
  }),
);
