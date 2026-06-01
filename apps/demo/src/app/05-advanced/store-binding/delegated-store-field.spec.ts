import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { delegatedStoreField } from './delegated-store-field';
import { type Settings, SettingsStore } from './settings.store';

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
});
