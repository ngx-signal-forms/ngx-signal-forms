import { computed } from '@angular/core';
import {
  patchState,
  signalStoreFeature,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';

import {
  Activity,
  createEmptyActivity,
  createEmptyDestination,
  createEmptyRequirement,
  Destination,
  Requirement,
} from '../../schemas/wizard.schemas';

type TripState = {
  destinations: Destination[];
};

export function withTripManagement() {
  return signalStoreFeature(
    withState<TripState>({
      destinations: [],
    }),

    withComputed((store) => ({
      totalDestinations: computed(() => store.destinations().length),
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
      // --- Destination CRUD ---
      addDestination(): void {
        patchState(store, (s) => ({
          destinations: [...s.destinations, createEmptyDestination()],
        }));
      },

      updateDestination(
        index: number,
        changes: Partial<Omit<Destination, 'activities'>>,
      ): void {
        patchState(store, (s) => ({
          destinations: s.destinations.map((d, i) =>
            i === index ? { ...d, ...changes } : d,
          ),
        }));
      },

      removeDestination(index: number): void {
        patchState(store, (s) => ({
          destinations: s.destinations.filter((_, i) => i !== index),
        }));
      },

      // --- Activity CRUD ---
      addActivity(destinationIndex: number): void {
        patchState(store, (s) => ({
          destinations: s.destinations.map((d, i) =>
            i === destinationIndex
              ? { ...d, activities: [...d.activities, createEmptyActivity()] }
              : d,
          ),
        }));
      },

      updateActivity(
        destinationIndex: number,
        activityIndex: number,
        changes: Partial<Omit<Activity, 'requirements'>>,
      ): void {
        patchState(store, (s) => ({
          destinations: s.destinations.map((d, di) =>
            di === destinationIndex
              ? {
                  ...d,
                  activities: d.activities.map((a, ai) =>
                    ai === activityIndex ? { ...a, ...changes } : a,
                  ),
                }
              : d,
          ),
        }));
      },

      removeActivity(destinationIndex: number, activityIndex: number): void {
        patchState(store, (s) => ({
          destinations: s.destinations.map((d, di) =>
            di === destinationIndex
              ? {
                  ...d,
                  activities: d.activities.filter(
                    (_, ai) => ai !== activityIndex,
                  ),
                }
              : d,
          ),
        }));
      },

      // --- Requirement CRUD ---
      addRequirement(destinationIndex: number, activityIndex: number): void {
        patchState(store, (s) => ({
          destinations: s.destinations.map((d, di) =>
            di === destinationIndex
              ? {
                  ...d,
                  activities: d.activities.map((a, ai) =>
                    ai === activityIndex
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

      updateRequirement(
        destinationIndex: number,
        activityIndex: number,
        requirementIndex: number,
        changes: Partial<Requirement>,
      ): void {
        patchState(store, (s) => ({
          destinations: s.destinations.map((d, di) =>
            di === destinationIndex
              ? {
                  ...d,
                  activities: d.activities.map((a, ai) =>
                    ai === activityIndex
                      ? {
                          ...a,
                          requirements: a.requirements.map((r, ri) =>
                            ri === requirementIndex ? { ...r, ...changes } : r,
                          ),
                        }
                      : a,
                  ),
                }
              : d,
          ),
        }));
      },

      removeRequirement(
        destinationIndex: number,
        activityIndex: number,
        requirementIndex: number,
      ): void {
        patchState(store, (s) => ({
          destinations: s.destinations.map((d, di) =>
            di === destinationIndex
              ? {
                  ...d,
                  activities: d.activities.map((a, ai) =>
                    ai === activityIndex
                      ? {
                          ...a,
                          requirements: a.requirements.filter(
                            (_, ri) => ri !== requirementIndex,
                          ),
                        }
                      : a,
                  ),
                }
              : d,
          ),
        }));
      },

      // --- Bulk operations ---
      setDestinations(destinations: Destination[]): void {
        patchState(store, { destinations });
      },
    })),
  );
}
