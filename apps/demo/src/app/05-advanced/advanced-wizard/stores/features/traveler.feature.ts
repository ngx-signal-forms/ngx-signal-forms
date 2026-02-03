import { computed } from '@angular/core';
import {
  patchState,
  signalStoreFeature,
  withComputed,
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

    withComputed((store) => ({
      travelerFullName: computed(() => {
        const t = store.traveler();
        return `${t.firstName} ${t.lastName}`.trim() || 'Guest';
      }),
      isAdult: computed(() => {
        const dob = store.traveler().dateOfBirth;
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
      }),
      hasValidPassport: computed(() => {
        const passport = store.traveler().passportExpiry;
        if (!passport) return false;
        return new Date(passport) > new Date();
      }),
    })),

    withMethods((store) => ({
      updateTraveler(changes: Partial<Traveler>): void {
        patchState(store, (s) => ({
          traveler: { ...s.traveler, ...changes },
        }));
      },

      setTraveler(traveler: Traveler): void {
        patchState(store, { traveler });
      },

      resetTraveler(): void {
        patchState(store, { traveler: createEmptyTraveler() });
      },
    })),
  );
}
