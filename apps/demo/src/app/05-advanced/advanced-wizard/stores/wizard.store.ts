import { httpMutation, withMutations } from '@ngrx-toolkit/core';
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
  TripSchema,
  type WizardDraft,
} from '../schemas/wizard.schemas';
import {
  withWizardNavigation,
  type WizardStep,
} from './features/navigation.feature';
import { withSavedDraft } from './features/saved-draft.feature';
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

/**
 * Not `providedIn: 'root'`: the advanced-wizard route lists it in `providers`,
 * so the store (and its debounced autosave) is destroyed when the user leaves
 * the route. Provide it yourself in any other host, such as a TestBed.
 */
export const WizardStore = signalStore(
  withState({
    error: null as string | null,
    bookingConfirmation: null as BookingResponse | null,
  }),

  // Compose features (order matters - navigation first, then data features)
  withWizardNavigation(),
  withSavedDraft(),

  // Committed traveler and destinations follow `savedDraftValue`.
  withTravelerManagement(),
  withTripManagement(),

  // Computed values using arrow function shorthand (auto-wrapped in computed())
  withComputed((store) => ({
    // ══════════════════════════════════════════════════════════════════════════
    // STEP VALIDATION - the wizard Zod schemas own the rules; the store only
    // asks them about the draft the user is editing.
    // ══════════════════════════════════════════════════════════════════════════
    isTravelerStepValid: () =>
      TripSchema.shape.traveler.safeParse(store.travelerDraft()).success,
    isTripStepValid: () =>
      TripSchema.shape.destinations.safeParse(store.destinationsDraft())
        .success,
  })),

  withComputed((store) => ({
    isReviewStepValid: () =>
      store.isTravelerStepValid() && store.isTripStepValid(),

    /**
     * Validation status for all steps as a record.
     */
    stepValidation: (): Record<WizardStep, boolean> => ({
      traveler: store.isTravelerStepValid(),
      trip: store.isTripStepValid(),
      review: store.isTravelerStepValid() && store.isTripStepValid(),
    }),

    /**
     * Whether the current step's draft is valid and user can proceed.
     */
    canProceed: () => {
      switch (store.currentStep()) {
        case 'traveler':
          return store.isTravelerStepValid();
        case 'trip':
          return store.isTripStepValid();
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
      TripSchema.safeParse({
        traveler: store.traveler(),
        destinations: store.destinations(),
      }).success,

    hasDestinations: () => store.destinationsDraft().length > 0,
    hasConfirmedBooking: () => store.bookingConfirmation() !== null,
  })),

  // Mutations for API calls (ngrx-toolkit)
  withMutations((store) => ({
    /**
     * Save draft to server.
     */
    saveDraft: httpMutation<WizardDraft, DraftResponse>({
      request: (data) => {
        // A draft that failed to load may be gone on the server. Start a new
        // one instead of writing to it.
        const draftId = store.resumeFailed() ? null : store.draftId();
        return {
          url: draftId ? `/api/wizard/draft/${draftId}` : '/api/wizard/draft',
          method: draftId ? 'PUT' : 'POST',
          body: data,
        };
      },
      onSuccess: (response) => {
        // A save that lands after the booking must not bring the id back.
        if (store.hasConfirmedBooking()) {
          return;
        }
        store.setDraftSaved(response.draftId);
        patchState(store, { error: null });
      },
      onError: (error) => {
        patchState(store, { error: 'Failed to save draft' });
        console.error('Draft save failed:', error);
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
      onSuccess: (response) => {
        patchState(store, {
          error: null,
          bookingConfirmation: response,
          // The trip is booked, so the draft is spent. Clearing the id also
          // clears the stored one, so a reload starts empty.
          draftId: null,
        });
        console.log('Booking confirmed:', response.confirmationNumber);
      },
      onError: (error) => {
        patchState(store, {
          error: 'Booking submission failed',
          bookingConfirmation: null,
        });
        console.error('Booking failed:', error);
      },
    }),
  })),

  // Mutation state signals for template binding
  withComputed((store) => ({
    isLoadingDraft: () => store.savedDraftIsLoading(),
    isSaving: () => store.saveDraftIsPending(),
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
          // Until the saved draft arrives, the drafts are still empty. Saving
          // them would overwrite the draft that is loading.
          if (store.isLoadingDraft()) {
            return;
          }
          if (data.traveler.firstName || data.destinations.length > 0) {
            void store.saveDraft(data);
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
        if (store.hasConfirmedBooking()) {
          return;
        }

        if (!store.isReadyToSubmit()) {
          patchState(store, { error: 'Please complete all required fields' });
          return;
        }
        void store.submitBooking(store.tripData());
      },

      /**
       * Reset wizard to initial state.
       */
      reset(): void {
        store.resetTraveler();
        store.setDestinations([createEmptyDestination()]);
        store.goToStep('traveler');
        patchState(store, {
          error: null,
          bookingConfirmation: null,
          // Also clears the stored id, so a reload starts empty.
          draftId: null,
        });
      },
    };
  }),

  // Store lifecycle hooks
  withHooks({
    onInit(store) {
      // Auto-save draft data when it changes. rxMethod tracks the signal
      // itself, so no hand-written effect is needed.
      store.autoSaveDraft(store.draftSummary);
    },
  }),
);
