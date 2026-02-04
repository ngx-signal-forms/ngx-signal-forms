import { httpMutation, withMutations } from '@angular-architects/ngrx-toolkit';
import { effect } from '@angular/core';
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
// VALIDATION HELPERS - reusable validation logic
// ══════════════════════════════════════════════════════════════════════════════

function isTravelerValid(t: Traveler): boolean {
  return !!t.firstName && !!t.lastName && !!t.email && !!t.passportNumber;
}

function isDestinationsValid(d: Destination[]): boolean {
  return (
    d.length > 0 &&
    d.every(
      (dest) =>
        dest.country && dest.city && dest.arrivalDate && dest.departureDate,
    )
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// STORE
// ══════════════════════════════════════════════════════════════════════════════

export const WizardStore = signalStore(
  { providedIn: 'root' },

  withState({
    error: null as string | null,
  }),

  // Compose features (order matters - navigation first, then data features)
  withWizardNavigation(),
  withTravelerManagement(),
  withTripManagement(),

  // Computed values using arrow function shorthand (auto-wrapped in computed())
  withComputed((store) => ({
    // ══════════════════════════════════════════════════════════════════════════
    // STEP VALIDATION - validates draft data (what user is editing)
    // ══════════════════════════════════════════════════════════════════════════
    isTravelerStepValid: () => isTravelerValid(store.travelerDraft()),
    isTripStepValid: () => isDestinationsValid(store.destinationsDraft()),
    isReviewStepValid: () =>
      isTravelerValid(store.travelerDraft()) &&
      isDestinationsValid(store.destinationsDraft()),

    /**
     * Validation status for all steps as a record.
     */
    stepValidation: (): Record<WizardStep, boolean> => ({
      traveler: isTravelerValid(store.travelerDraft()),
      trip: isDestinationsValid(store.destinationsDraft()),
      review:
        isTravelerValid(store.travelerDraft()) &&
        isDestinationsValid(store.destinationsDraft()),
    }),

    /**
     * Whether the current step's draft is valid and user can proceed.
     */
    canProceed: () => {
      const step = store.currentStep();
      switch (step) {
        case 'traveler':
          return isTravelerValid(store.travelerDraft());
        case 'trip':
          return isDestinationsValid(store.destinationsDraft());
        case 'review':
          return true;
        default:
          return false;
      }
    },

    // ══════════════════════════════════════════════════════════════════════════
    // TRIP DATA - uses drafts for auto-save, committed for submission
    // ══════════════════════════════════════════════════════════════════════════

    /** Draft data for auto-save (saves work in progress) */
    draftSummary: (): TripSummary => ({
      traveler: store.travelerDraft(),
      destinations: store.destinationsDraft(),
    }),

    /** Committed data for final submission */
    tripData: (): Trip => ({
      traveler: store.traveler(),
      destinations: store.destinations(),
      confirmed: false,
    }),

    isReadyToSubmit: () =>
      isTravelerValid(store.traveler()) &&
      isDestinationsValid(store.destinations()),

    hasDestinations: () => store.destinationsDraft().length > 0,
  })),

  // Mutations for API calls (ngrx-toolkit)
  withMutations((store) => ({
    /**
     * Save draft to server.
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
        // Set committed state; withLinkedState auto-updates drafts
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

  // Mutation state signals for template binding
  withComputed((store) => ({
    isSaving: () => store.saveDraftIsPending(),
    isLoading: () => store.loadDraftIsPending(),
    isSubmitting: () => store.submitBookingIsPending(),
  })),

  // Additional methods
  withMethods((store) => {
    // Auto-save draft data with debounce
    const autoSaveDraft = rxMethod<TripSummary>(
      pipe(
        debounceTime(2000),
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
        tap((data) => {
          if (data.traveler.firstName || data.destinations.length > 0) {
            store.saveDraft(data);
          }
        }),
      ),
    );

    return {
      autoSaveDraft,

      /**
       * Submit the booking using committed data.
       */
      submit(): void {
        if (!store.isReadyToSubmit()) {
          patchState(store, { error: 'Please complete all required fields' });
          return;
        }
        store.submitBooking(store.tripData());
      },

      /**
       * Reset wizard to initial state.
       */
      reset(): void {
        store.resetTraveler();
        store.setDestinations([createEmptyDestination()]);
        store.goToStep('traveler');
        patchState(store, { error: null });
      },

      /**
       * Initialize wizard with a destination if empty.
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
      // Auto-save draft data when it changes
      effect(() => {
        store.autoSaveDraft(store.draftSummary());
      });

      store.initializeIfEmpty();
    },
  }),
);
