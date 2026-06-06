import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';

/**
 * The slice of application settings this demo binds a Signal Form to.
 *
 * Kept deliberately small: the point of the example is the *binding seam*, not
 * the data model. Every field is a primitive so the write-through path is easy
 * to reason about.
 */
export type Settings = {
  displayName: string;
  email: string;
  theme: 'system' | 'light' | 'dark';
  newsletter: boolean;
};

export const INITIAL_SETTINGS: Settings = {
  displayName: 'Ada Lovelace',
  email: 'ada@example.com',
  theme: 'system',
  newsletter: true,
};

/**
 * A `providedIn: 'root'` signal store that owns the canonical settings state.
 *
 * There is intentionally **no draft buffer** here — contrast this with the
 * advanced-wizard store, whose `destinationsDraft` → `commitDestinations()`
 * pair is a deliberate draft/commit buffer. This store is the single source of
 * truth, and the form writes straight back into it.
 */
export const SettingsStore = signalStore(
  { providedIn: 'root' },
  withState<Settings>(INITIAL_SETTINGS),
  withMethods((store) => ({
    /**
     * Patch one or more settings fields. This is the only write path the
     * delegated-write helper calls — edits in the form land here immediately,
     * with no commit step.
     */
    updateSettings(changes: Partial<Settings>): void {
      patchState(store, changes);
    },

    /**
     * Simulate an out-of-band update arriving from somewhere other than the
     * form (a websocket push, another tab, an admin override, ...). The form is
     * expected to reflect this on its next read because it reads the store
     * through a `linkedSignal` seam.
     */
    simulateRemoteSync(remote: Partial<Settings>): void {
      patchState(store, remote);
    },
  })),
);
