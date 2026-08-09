import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { NgxFieldVisibilityRegistry } from './field-visibility-registry';

function createRegistry(): NgxFieldVisibilityRegistry {
  return TestBed.runInInjectionContext(() => new NgxFieldVisibilityRegistry());
}

/**
 * `NgxSignalFormAutoAria` reads this registry from inside a `computed()`
 * (`#registryVisibilityEntry`, in `auto-aria.ts`). Unlike the hint registry
 * — whose `hints` is itself a `Signal` backed by `contentChildren` — this
 * registry is a plain `Map`: `register()`/the returned unregister function
 * mutate it imperatively, which is invisible to Angular's reactive graph on
 * its own. `get()` must read a signal (the version counter) on every call
 * so a `computed()` that already evaluated once still re-runs after a later
 * `register()`/unregister — the exact "mount/unmount after the computed
 * already ran" case a plain `Map` lookup would silently miss.
 */
describe('NgxFieldVisibilityRegistry reactivity', () => {
  it('invalidates a computed() reading get() when a descriptor registers after the first read', () => {
    const registry = createRegistry();
    const entryFor = computed(() => registry.get('password'));

    // First read: nothing registered yet. This also caches the computed's
    // dependency graph — with a non-reactive `Map`, that graph would never
    // include anything that changes on a later `register()`.
    expect(entryFor()).toBeUndefined();

    registry.register({
      fieldName: 'password',
      errorContainerVisible: signal(true),
      warningContainerVisible: signal(false),
    });

    // Without a reactive dependency on registry membership, `entryFor()`
    // would still return the cached `undefined` from before registration.
    const entry = entryFor();
    expect(entry).toBeDefined();
    expect(entry?.errorContainerVisible()).toBe(true);
    expect(entry?.warningContainerVisible()).toBe(false);
  });

  it('invalidates a computed() reading get() when a descriptor unregisters after the first read', () => {
    const registry = createRegistry();
    const unregister = registry.register({
      fieldName: 'password',
      errorContainerVisible: signal(true),
      warningContainerVisible: signal(false),
    });

    const entryFor = computed(() => registry.get('password'));
    expect(entryFor()).toBeDefined();

    unregister();

    // Without a reactive dependency, `entryFor()` would still return the
    // cached (now-stale) descriptor instead of noticing the removal.
    expect(entryFor()).toBeUndefined();
  });

  it('invalidates a computed() for one field name when an unrelated field name registers', () => {
    // The version counter is global, not per-field-name, so a computed
    // watching "email" also re-evaluates when "password" registers. This is
    // the intentional over-invalidation the class docstring calls out —
    // confirm it doesn't accidentally under-invalidate instead.
    const registry = createRegistry();
    const entryFor = computed(() => registry.get('email'));
    expect(entryFor()).toBeUndefined();

    registry.register({
      fieldName: 'password',
      errorContainerVisible: signal(false),
      warningContainerVisible: signal(false),
    });

    expect(entryFor()).toBeUndefined();

    registry.register({
      fieldName: 'email',
      errorContainerVisible: signal(true),
      warningContainerVisible: signal(false),
    });

    expect(entryFor()?.errorContainerVisible()).toBe(true);
  });

  it('warns once in dev mode when a second descriptor registers for a still-live field name', () => {
    const registry = createRegistry();
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const first = {
      fieldName: 'password',
      errorContainerVisible: signal(false),
      warningContainerVisible: signal(false),
    };
    const second = {
      fieldName: 'password',
      errorContainerVisible: signal(true),
      warningContainerVisible: signal(false),
    };

    registry.register(first);
    expect(warnSpy).not.toHaveBeenCalled();

    registry.register(second);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0]?.[0]).toContain('password');

    // A third registration for the same field name doesn't spam the console
    // again — the guard is one-shot per field name.
    registry.register(second);
    expect(warnSpy).toHaveBeenCalledTimes(1);

    warnSpy.mockRestore();
  });

  it('does not warn when a descriptor re-registers after its own unregister', () => {
    const registry = createRegistry();
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const descriptor = {
      fieldName: 'password',
      errorContainerVisible: signal(false),
      warningContainerVisible: signal(false),
    };

    const unregister = registry.register(descriptor);
    unregister();
    registry.register(descriptor);

    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
