import { linkedSignal } from '@angular/core';
import {
  patchState,
  signalStoreFeature,
  withComputed,
  withLinkedState,
  withMethods,
  withState,
} from '@ngrx/signals';

import { createEmptyTraveler, Traveler } from '../../schemas/wizard.schemas';

type TravelerState = {
  traveler: Traveler;
};

export function withTravelerManagement() {
  return signalStoreFeature(
    withState<TravelerState>({
      traveler: createEmptyTraveler(),
    }),

    // Draft state linked to committed - form binds to this
    // Resets when committed state changes (e.g., after load from server)
    withLinkedState(({ traveler }) => ({
      travelerDraft: linkedSignal({
        source: traveler,
        computation: (committed) => structuredClone(committed),
      }),
    })),

    // Arrow function shorthand - auto-wrapped in computed()
    withComputed(({ traveler }) => ({
      travelerFullName: () => {
        const t = traveler();
        return `${t.firstName} ${t.lastName}`.trim() || 'Guest';
      },
      isAdult: () => {
        const dob = traveler().dateOfBirth;
        if (!dob) return false;
        const today = new Date();
        const birthDate = new Date(dob);
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (
          monthDiff < 0 ||
          (monthDiff === 0 && today.getDate() < birthDate.getDate())
        ) {
          return age - 1 >= 18;
        }
        return age >= 18;
      },
      hasValidPassport: () => {
        const passport = traveler().passportExpiry;
        if (!passport) return false;
        return new Date(passport) > new Date();
      },
    })),

    withMethods((store) => ({
      // Commit draft to permanent state
      commitTraveler(): void {
        patchState(store, { traveler: store.travelerDraft() });
      },

      // Discard draft changes, revert to committed
      discardTravelerChanges(): void {
        patchState(store, { travelerDraft: store.traveler() });
      },

      // Direct update to committed state (for API loads)
      setTraveler(traveler: Traveler): void {
        patchState(store, { traveler });
      },

      resetTraveler(): void {
        patchState(store, { traveler: createEmptyTraveler() });
      },
    })),
  );
}
