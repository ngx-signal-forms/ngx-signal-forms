import { createEnvironmentInjector, EnvironmentInjector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import {
  createUniqueId,
  NGX_SIGNAL_FORM_ID_STRATEGY,
  NgxSignalFormIdCounter,
} from './create-unique-id';

/**
 * These specs lock the SSR-safety contract for `createUniqueId`:
 * when called from an injection context with its OWN `NgxSignalFormIdCounter`
 * (as a fresh SSR-request root or the client-side root would have), the
 * counter sequence restarts at 1. That is what enables server→client id
 * parity during hydration.
 *
 * `NgxSignalFormIdCounter` is declared `providedIn: 'root'` in production,
 * so Angular itself guarantees a fresh counter per root injector. These
 * tests model that by explicitly providing the service at the child-injector
 * level — simulating two independent roots from a single shared `TestBed`
 * root.
 */
describe('createUniqueId', () => {
  const runInInjector = <T>(injector: EnvironmentInjector, fn: () => T): T => {
    return injector.runInContext(fn);
  };

  /**
   * Creates a child environment injector that owns its own
   * `NgxSignalFormIdCounter` instance. Models one SSR request / the client
   * hydration root; the parent TestBed root is kept around only because
   * `createEnvironmentInjector` requires a parent.
   */
  const makeFreshRootInjector = () =>
    createEnvironmentInjector(
      [NgxSignalFormIdCounter],
      TestBed.inject(EnvironmentInjector),
    );

  it('produces the same sequence in two independent injectors (SSR parity)', () => {
    const serverInjector = makeFreshRootInjector();
    const clientInjector = makeFreshRootInjector();

    const serverIds = [
      runInInjector(serverInjector, () => createUniqueId('hint')),
      runInInjector(serverInjector, () => createUniqueId('hint')),
      runInInjector(serverInjector, () => createUniqueId('fieldset')),
    ];
    const clientIds = [
      runInInjector(clientInjector, () => createUniqueId('hint')),
      runInInjector(clientInjector, () => createUniqueId('hint')),
      runInInjector(clientInjector, () => createUniqueId('fieldset')),
    ];

    expect(clientIds).toEqual(serverIds);
    expect(serverIds).toEqual(['hint-1', 'hint-2', 'fieldset-3']);
  });

  it('mints monotonically increasing ids within a single injector', () => {
    const injector = makeFreshRootInjector();

    const ids = [
      runInInjector(injector, () => createUniqueId('id')),
      runInInjector(injector, () => createUniqueId('id')),
      runInInjector(injector, () => createUniqueId('id')),
    ];

    expect(ids).toEqual(['id-1', 'id-2', 'id-3']);
  });

  it('honors the NGX_SIGNAL_FORM_ID_STRATEGY override', () => {
    let calls = 0;
    const injector = createEnvironmentInjector(
      [
        NgxSignalFormIdCounter,
        {
          provide: NGX_SIGNAL_FORM_ID_STRATEGY,
          useValue: (prefix: string) => {
            calls += 1;
            return `custom-${prefix}-${calls}`;
          },
        },
      ],
      TestBed.inject(EnvironmentInjector),
    );

    const id1 = runInInjector(injector, () => createUniqueId('hint'));
    const id2 = runInInjector(injector, () => createUniqueId('fieldset'));

    expect(id1).toBe('custom-hint-1');
    expect(id2).toBe('custom-fieldset-2');
  });

  it('service exposes next() directly for advanced callers', () => {
    const injector = makeFreshRootInjector();
    const counter = injector.get(NgxSignalFormIdCounter);

    expect(counter.next('x')).toBe('x-1');
    expect(counter.next('y')).toBe('y-2');
  });

  it('falls back to a module-scoped counter when called outside injection context', () => {
    // Outside any injection context — the try/catch branch kicks in. Ids
    // still come back unique, just not SSR-safe. This exists for utility
    // usage / tests (see headless utilities.spec.ts).
    const a = createUniqueId('raw');
    const b = createUniqueId('raw');

    expect(a).toMatch(/^raw-\d+$/);
    expect(b).toMatch(/^raw-\d+$/);
    expect(a).not.toBe(b);
  });
});
