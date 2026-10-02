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
import { updateAt, updateNested } from '@ngx-signal-forms/toolkit';

import {
  Activity,
  createEmptyActivity,
  createEmptyDestination,
  createEmptyRequirement,
  Destination,
  Requirement,
  type WizardDraft,
} from '../../schemas/wizard.schemas';
import { linkDraft } from './draft-link';

// Compose nested updates for 3-level depth (destinations → activities → requirements)
function updateRequirementNested(
  destinations: Destination[],
  destIdx: number,
  actIdx: number,
  reqIdx: number,
  updater: (req: Requirement) => Requirement,
): Destination[] {
  return updateNested<Destination, 'activities', Activity>(
    destinations,
    destIdx,
    'activities',
    actIdx,
    (act) => ({
      ...act,
      requirements: updateAt(act.requirements, reqIdx, updater),
    }),
  );
}

export function withTripManagement() {
  return signalStoreFeature(
    // Needs the saved draft from `withSavedDraft()`.
    { state: type<{ savedDraftValue: WizardDraft | undefined }>() },

    // Committed state follows the resumed draft, with no effect to copy it.
    // It stays writable, so the methods below still patch it.
    withLinkedState(({ savedDraftValue }) => ({
      destinations: (): Destination[] =>
        savedDraftValue()?.destinations ?? [createEmptyDestination()],
    })),

    // Draft state: what the user has typed. See `travelerDraft` for the rules.
    withLinkedState(({ destinations, savedDraftValue }) => ({
      destinationsDraft: linkedSignal<
        { committed: Destination[]; saved: WizardDraft | undefined },
        Destination[]
      >({
        source: () => ({
          committed: destinations(),
          saved: savedDraftValue(),
        }),
        computation: linkDraft('destinations'),
      }),
    })),

    // Arrow function shorthand - auto-wrapped in computed()
    withComputed(({ destinations }) => ({
      totalDestinations: () => destinations().length,
      allActivities: () => destinations().flatMap((d) => d.activities),
      allRequirements: () =>
        destinations().flatMap((d) =>
          d.activities.flatMap((a) => a.requirements),
        ),
    })),

    withMethods((store) => ({
      // Commit draft to permanent state
      commitDestinations(): void {
        patchState(store, { destinations: store.destinationsDraft() });
      },

      /**
       * Copies the typed destinations into `destinationsDraft`, so autosave
       * sees them. Call it with the form model in an injection context.
       * Typing does not commit the step.
       */
      syncDestinationsDraft: signalMethod<Destination[]>(
        (destinationsDraft) => {
          patchState(store, { destinationsDraft });
        },
      ),

      // Discard draft changes
      discardDestinationChanges(): void {
        patchState(store, { destinationsDraft: store.destinations() });
      },

      // --- Destination CRUD (operates on draft) ---
      addDestination(): void {
        patchState(store, (s) => ({
          destinationsDraft: [...s.destinationsDraft, createEmptyDestination()],
        }));
      },

      updateDestination(
        index: number,
        changes: Partial<Omit<Destination, 'activities'>>,
      ): void {
        patchState(store, (s) => ({
          destinationsDraft: updateAt(s.destinationsDraft, index, (d) => ({
            ...d,
            ...changes,
          })),
        }));
      },

      removeDestination(index: number): void {
        patchState(store, (s) => ({
          destinationsDraft: s.destinationsDraft.filter((_, i) => i !== index),
        }));
      },

      // --- Activity CRUD (operates on draft) ---
      addActivity(destinationIndex: number): void {
        patchState(store, (s) => ({
          destinationsDraft: updateAt(
            s.destinationsDraft,
            destinationIndex,
            (d) => ({
              ...d,
              activities: [...d.activities, createEmptyActivity()],
            }),
          ),
        }));
      },

      updateActivity(
        destinationIndex: number,
        activityIndex: number,
        changes: Partial<Omit<Activity, 'requirements'>>,
      ): void {
        patchState(store, (s) => ({
          destinationsDraft: updateNested<Destination, 'activities', Activity>(
            s.destinationsDraft,
            destinationIndex,
            'activities',
            activityIndex,
            (a) => ({ ...a, ...changes }),
          ),
        }));
      },

      removeActivity(destinationIndex: number, activityIndex: number): void {
        patchState(store, (s) => ({
          destinationsDraft: updateAt(
            s.destinationsDraft,
            destinationIndex,
            (d) => ({
              ...d,
              activities: d.activities.filter((_, i) => i !== activityIndex),
            }),
          ),
        }));
      },

      // --- Requirement CRUD (operates on draft) ---
      addRequirement(destinationIndex: number, activityIndex: number): void {
        patchState(store, (s) => ({
          destinationsDraft: updateNested<Destination, 'activities', Activity>(
            s.destinationsDraft,
            destinationIndex,
            'activities',
            activityIndex,
            (a) => ({
              ...a,
              requirements: [...a.requirements, createEmptyRequirement()],
            }),
          ),
        }));
      },

      updateRequirement(
        destinationIndex: number,
        activityIndex: number,
        requirementIndex: number,
        changes: Partial<Requirement>,
      ): void {
        patchState(store, (s) => ({
          destinationsDraft: updateRequirementNested(
            s.destinationsDraft,
            destinationIndex,
            activityIndex,
            requirementIndex,
            (r) => ({ ...r, ...changes }),
          ),
        }));
      },

      removeRequirement(
        destinationIndex: number,
        activityIndex: number,
        requirementIndex: number,
      ): void {
        patchState(store, (s) => ({
          destinationsDraft: updateNested<Destination, 'activities', Activity>(
            s.destinationsDraft,
            destinationIndex,
            'activities',
            activityIndex,
            (a) => ({
              ...a,
              requirements: a.requirements.filter(
                (_: Requirement, i: number) => i !== requirementIndex,
              ),
            }),
          ),
        }));
      },

      // --- Bulk operations (direct to committed state) ---
      setDestinations(destinations: Destination[]): void {
        patchState(store, { destinations });
      },
    })),
  );
}
