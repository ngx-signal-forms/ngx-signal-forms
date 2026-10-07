import { linkedSignal } from '@angular/core';
import {
  patchState,
  signalMethod,
  signalStoreFeature,
  type,
  withComputed,
  withLinkedState,
  withMethods,
} from '@ngrx/signals';

import {
  createEmptyTraveler,
  isPassportExpired,
  Traveler,
  type WizardDraft,
} from '../../schemas/wizard.schemas';
import { linkDraft } from './draft-link';

export function withTravelerManagement() {
  return signalStoreFeature(
    // Needs the saved draft from `withSavedDraft()`.
    { state: type<{ savedDraftValue: WizardDraft | undefined }>() },

    // Committed state follows the resumed draft, with no effect to copy it.
    // It stays writable, so the methods below still patch it.
    withLinkedState(({ savedDraftValue }) => ({
      traveler: () => savedDraftValue()?.traveler ?? createEmptyTraveler(),
    })),

    // Draft state: what the user has typed. It resets to the committed value
    // when that changes (a commit or a reset). When a saved draft loads, it
    // takes the saved in-progress value instead, or the committed one if the
    // draft has none.
    withLinkedState(({ traveler, savedDraftValue }) => ({
      travelerDraft: linkedSignal<
        { committed: Traveler; saved: WizardDraft | undefined },
        Traveler
      >({
        source: () => ({ committed: traveler(), saved: savedDraftValue() }),
        computation: linkDraft('traveler'),
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
        return !isPassportExpired(passport);
      },
    })),

    withMethods((store) => ({
      // Commit draft to permanent state
      commitTraveler(): void {
        patchState(store, { traveler: store.travelerDraft() });
      },

      /**
       * Copies the typed traveler into `travelerDraft`, so autosave sees it.
       * Call it with the form model in an injection context (a field
       * initializer). Typing does not commit the step.
       */
      syncTravelerDraft: signalMethod<Traveler>((travelerDraft) => {
        patchState(store, { travelerDraft });
      }),

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
