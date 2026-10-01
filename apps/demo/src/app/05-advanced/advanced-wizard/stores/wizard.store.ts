import { httpMutation, withMutations } from '@ngrx-toolkit/core';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withProps,
  withState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { debounceTime, distinctUntilChanged, pipe, tap } from 'rxjs';

import {
  createEmptyDestination,
  createEmptyRequirement,
  Trip,
  TripSchema,
  type WizardDraft,
  type WizardStepData,
} from '../schemas/wizard.schemas';
import {
  withWizardNavigation,
  type WizardStep,
} from './features/navigation.feature';
import { isSameData } from './features/draft-link';
import { withSavedDraft } from './features/saved-draft.feature';
import { withTravelerManagement } from './features/traveler.feature';
import { withTripManagement } from './features/trip.feature';

const DEFAULT_REQUIREMENT_TYPE = createEmptyRequirement().type;

/**
 * True when the value holds something the user entered. The empty factories
 * add placeholders (random ids, the default requirement `type`, `completed:
 * false`, a blank destination), so those keys and empty fields do not count.
 * A `type` other than the default and a `true` checkbox are user edits.
 */
function hasUserData(value: unknown): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    return value !== '';
  }
  if (typeof value === 'number') {
    return value !== 0;
  }
  if (Array.isArray(value)) {
    return value.some(hasUserData);
  }
  if (value !== null && typeof value === 'object') {
    return Object.entries(value).some(
      ([key, v]) =>
        key !== 'id' &&
        (key === 'type' ? v !== DEFAULT_REQUIREMENT_TYPE : hasUserData(v)),
    );
  }
  return false;
}

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
    // asks them about the data.
    //
    // Two kinds of data, on purpose:
    // - Committed (`traveler`, `destinations`): set by Next or a resumed
    //   draft. A step is "completed" only when this is valid.
    // - Draft (`travelerDraft`, `destinationsDraft`): what the user has typed.
    //   It answers "may I proceed from the step I am on?", never "is it done?".
    // ══════════════════════════════════════════════════════════════════════════
    isTravelerStepValid: () =>
      TripSchema.shape.traveler.safeParse(store.traveler()).success,
    isTripStepValid: () =>
      TripSchema.shape.destinations.safeParse(store.destinations()).success,
    isTravelerDraftValid: () =>
      TripSchema.shape.traveler.safeParse(store.travelerDraft()).success,
    isTripDraftValid: () =>
      TripSchema.shape.destinations.safeParse(store.destinationsDraft())
        .success,
  })),

  withComputed((store) => ({
    isReviewStepValid: () =>
      store.isTravelerStepValid() && store.isTripStepValid(),

    /**
     * Completion status for all steps as a record. Reads committed data only,
     * so typing alone never marks a step as completed.
     */
    stepValidation: (): Record<WizardStep, boolean> => ({
      traveler: store.isTravelerStepValid(),
      trip: store.isTripStepValid(),
      review: store.isTravelerStepValid() && store.isTripStepValid(),
    }),

    /**
     * Whether the draft of the current step is valid, so Next can commit it.
     * Reads the live draft: the step is not committed yet.
     */
    canProceed: () => {
      switch (store.currentStep()) {
        case 'traveler':
          return store.isTravelerDraftValid();
        case 'trip':
          return store.isTripDraftValid();
        case 'review':
          return true;
        default:
          return false;
      }
    },

    // ══════════════════════════════════════════════════════════════════════════
    // TRIP DATA - committed and in-progress data for auto-save, committed for
    // submission
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * What auto-save sends. The committed part keeps the meaning of Next; the
     * in-progress part carries what the user typed, so a reload gets it back.
     */
    draftSummary: (): WizardDraft => ({
      traveler: store.traveler(),
      destinations: store.destinations(),
      inProgress: {
        traveler: store.travelerDraft(),
        destinations: store.destinationsDraft(),
      },
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

    /** Live: the trip step shows its empty state from the typed draft. */
    hasDestinations: () => store.destinationsDraft().length > 0,
    hasConfirmedBooking: () => store.bookingConfirmation() !== null,
  })),

  // A booking or a reset ends the draft. Each save records the epoch it started
  // in, and a save from an earlier epoch is ignored when it completes. The
  // confirmation alone cannot do this: "Start New Booking" clears it.
  withProps(() => {
    const startedIn = new WeakMap<WizardDraft, number>();
    const draftEpoch = {
      current: 0,
      markStarted: (data: WizardDraft): void => {
        startedIn.set(data, draftEpoch.current);
      },
      isSpent: (data: WizardDraft): boolean =>
        startedIn.get(data) !== draftEpoch.current,
    };
    return { draftEpoch };
  }),

  // Mutations for API calls (ngrx-toolkit)
  withMutations((store) => ({
    /**
     * Save draft to server.
     */
    saveDraft: httpMutation<WizardDraft, DraftResponse>({
      request: (data) => {
        store.draftEpoch.markStarted(data);
        // A draft that failed to load may be gone on the server. Start a new
        // one instead of writing to it.
        const draftId = store.resumeFailed() ? null : store.draftId();
        return {
          url: draftId ? `/api/wizard/draft/${draftId}` : '/api/wizard/draft',
          method: draftId ? 'PUT' : 'POST',
          body: data,
        };
      },
      onSuccess: (response, data) => {
        // A save that lands after the booking or a reset must not bring the id back.
        if (store.draftEpoch.isSpent(data)) {
          return;
        }
        store.setDraftSaved(response.draftId);
        patchState(store, { error: null });
      },
      onError: (error, data) => {
        if (store.draftEpoch.isSpent(data)) {
          return;
        }
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
        store.draftEpoch.current++;
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
    const autoSaveDraft = rxMethod<WizardDraft>(
      pipe(
        debounceTime(2000),
        distinctUntilChanged(isSameData),
        tap((data) => {
          // Until the saved draft arrives, the drafts are still empty. Saving
          // them would overwrite the draft that is loading.
          if (store.isLoadingDraft()) {
            return;
          }
          // The booked trip stays on screen for the confirmation, so it still
          // looks like content. A save now would bring the draft id back and
          // a reload would resume the booked trip.
          if (store.hasConfirmedBooking()) {
            return;
          }
          // Skip only while there is nothing to save yet. Once a draft
          // exists, clearing a field must reach the server too.
          const hasContent = (part: WizardStepData): boolean =>
            hasUserData(part.traveler) || hasUserData(part.destinations);
          if (
            store.draftId() !== null ||
            hasContent(data) ||
            (data.inProgress !== undefined && hasContent(data.inProgress))
          ) {
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
        store.draftEpoch.current++;
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
