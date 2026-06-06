import { effect, Injector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import { delegatedStoreField } from './delegated-store-field';
import {
  INITIAL_SETTINGS,
  type Settings,
  SettingsStore,
} from './settings.store';

function setup() {
  return TestBed.runInInjectionContext(() => {
    const store = TestBed.inject(SettingsStore);
    const field = delegatedStoreField<Settings>({
      source: () => ({
        displayName: store.displayName(),
        email: store.email(),
        theme: store.theme(),
        newsletter: store.newsletter(),
      }),
      write: (changes) => {
        store.updateSettings(changes);
      },
    });
    return { store, field };
  });
}

describe('delegatedStoreField', () => {
  it('reads the current store slice through the field', () => {
    const { store, field } = setup();

    expect(field().displayName).toBe(store.displayName());
    expect(field().email).toBe(store.email());
    expect(field().theme).toBe(store.theme());
    expect(field().newsletter).toBe(store.newsletter());
  });

  it('writes set(value) straight through to the store with no commit step', () => {
    const { store, field } = setup();

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
    // And the field reflects the same source of truth.
    expect(field().displayName).toBe('Grace Hopper');
  });

  it('writes update(fn) straight through to the store with no commit step', () => {
    const { store, field } = setup();

    field.update((current) => ({ ...current, displayName: 'Updated Name' }));

    expect(store.displayName()).toBe('Updated Name');
    expect(field().displayName).toBe('Updated Name');
  });

  it('reflects an external store mutation when the field is read again', () => {
    const { store, field } = setup();

    store.simulateRemoteSync({ displayName: 'Remote Sync', theme: 'light' });

    expect(field().displayName).toBe('Remote Sync');
    expect(field().theme).toBe('light');
  });

  // The two specs below lock in the load-bearing *reactive* behaviour that the
  // imperative read/write specs above can't prove. They guard the eventual 22.1
  // migration to the native custom-`set` overload from silently regressing the
  // two properties the demo actually leans on:
  //   (a) a read inside a reactive consumer re-fires after an external sync, and
  //   (b) a single set() produces exactly one store write (no write-back loop).
  it('re-fires a reactive consumer after an external store mutation', () => {
    const { store, field } = setup();
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

    // An out-of-band store mutation must flow through the linkedSignal read seam
    // and re-fire the consumer — proving the read genuinely tracks the store.
    store.simulateRemoteSync({ displayName: 'Remote Sync' });
    TestBed.tick();

    expect(seen).toEqual([INITIAL_SETTINGS.displayName, 'Remote Sync']);
  });

  it('writes exactly once per set() — no write-back loop', () => {
    const store = TestBed.inject(SettingsStore);
    const write = vi.fn<(changes: Partial<Settings>) => void>((changes) => {
      store.updateSettings(changes);
    });
    const field = TestBed.runInInjectionContext(() =>
      delegatedStoreField<Settings>({
        source: () => ({
          displayName: store.displayName(),
          email: store.email(),
          theme: store.theme(),
          newsletter: store.newsletter(),
        }),
        write,
      }),
    );

    field.set({
      displayName: 'Grace Hopper',
      email: 'grace@navy.mil',
      theme: 'dark',
      newsletter: false,
    });

    // A single set() must delegate exactly one store write. More than one would
    // mean the local mirror is feeding back into the source and re-triggering
    // the write path.
    expect(write).toHaveBeenCalledTimes(1);
  });
});
