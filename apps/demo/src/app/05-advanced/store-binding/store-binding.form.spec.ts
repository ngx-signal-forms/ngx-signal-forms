import { effect, Injector, linkedSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import {
  INITIAL_SETTINGS,
  type Settings,
  SettingsStore,
} from './settings.store';

/**
 * These specs lock in the native `linkedSignal({ source, computation, set })`
 * binding seam that `StoreBindingFormComponent`'s model uses — see
 * `store-binding.form.ts`. They exist to prove, against the real store, the
 * open technical question from the linked-signal write-back migration: the
 * `set` callback delegates straight to `patchState` and never calls `rawSet`.
 * These specs confirm that omitting `rawSet` still keeps reads coherent,
 * because `source` reactively re-reads the store's own signals — there is no
 * local draft buffer to fall out of sync.
 */
function bindField() {
  return TestBed.runInInjectionContext(() => {
    const store = TestBed.inject(SettingsStore);
    const field = linkedSignal<Settings, Settings>({
      source: () => ({
        displayName: store.displayName(),
        email: store.email(),
        theme: store.theme(),
        newsletter: store.newsletter(),
      }),
      computation: (slice) => slice,
      set: (value) => {
        store.updateSettings(value);
      },
    });
    return { store, field };
  });
}

describe('store-binding field (native linkedSignal set)', () => {
  it('reads the current store slice through the field', () => {
    const { store, field } = bindField();

    expect(field().displayName).toBe(store.displayName());
    expect(field().email).toBe(store.email());
    expect(field().theme).toBe(store.theme());
    expect(field().newsletter).toBe(store.newsletter());
  });

  it('writes set(value) straight through to the store with no commit step, and no rawSet call', () => {
    const { store, field } = bindField();

    field.set({
      displayName: 'Grace Hopper',
      email: 'grace@navy.mil',
      theme: 'dark',
      newsletter: false,
    });

    // No commit() is called — the store is already updated.
    expect(store.displayName()).toBe('Grace Hopper');
    expect(store.email()).toBe('grace@navy.mil');
    expect(store.theme()).toBe('dark');
    expect(store.newsletter()).toBe(false);
    // The field reflects the same source of truth even though `set` never
    // called `rawSet` — the local value re-derives from `source` on read.
    expect(field().displayName).toBe('Grace Hopper');
  });

  it('writes update(fn) straight through to the store with no commit step', () => {
    const { store, field } = bindField();

    field.update((current) => ({ ...current, displayName: 'Updated Name' }));

    expect(store.displayName()).toBe('Updated Name');
    expect(field().displayName).toBe('Updated Name');
  });

  it('reflects an external store mutation when the field is read again', () => {
    const { store, field } = bindField();

    store.simulateRemoteSync({ displayName: 'Remote Sync', theme: 'light' });

    expect(field().displayName).toBe('Remote Sync');
    expect(field().theme).toBe('light');
  });

  it('re-fires a reactive consumer after an external store mutation', () => {
    const { store, field } = bindField();
    const injector = TestBed.inject(Injector);

    const seen: string[] = [];
    TestBed.runInInjectionContext(() => {
      effect(
        () => {
          seen.push(field().displayName);
        },
        { injector },
      );
    });

    // Flush the initial effect run.
    TestBed.tick();
    expect(seen).toEqual([INITIAL_SETTINGS.displayName]);

    // An out-of-band store mutation must flow through the linkedSignal read
    // seam and re-fire the consumer — proving the read genuinely tracks the
    // store rather than a stale local mirror.
    store.simulateRemoteSync({ displayName: 'Remote Sync' });
    TestBed.tick();

    expect(seen).toEqual([INITIAL_SETTINGS.displayName, 'Remote Sync']);
  });

  it('writes exactly once per set() — no write-back loop', () => {
    const store = TestBed.inject(SettingsStore);
    const updateSettings = vi.spyOn(store, 'updateSettings');
    const { field } = TestBed.runInInjectionContext(() => {
      const boundField = linkedSignal<Settings, Settings>({
        source: () => ({
          displayName: store.displayName(),
          email: store.email(),
          theme: store.theme(),
          newsletter: store.newsletter(),
        }),
        computation: (slice) => slice,
        set: (value) => {
          store.updateSettings(value);
        },
      });
      return { field: boundField };
    });

    field.set({
      displayName: 'Grace Hopper',
      email: 'grace@navy.mil',
      theme: 'dark',
      newsletter: false,
    });

    // A single set() must delegate exactly one store write. More than one
    // would mean the native `set` callback (or a local mirror) is feeding
    // back into `source` and re-triggering the write path.
    expect(updateSettings).toHaveBeenCalledTimes(1);
  });
});
