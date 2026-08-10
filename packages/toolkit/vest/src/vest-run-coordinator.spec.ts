import { describe, expect, it, vi } from 'vitest';
import {
  createVestRunCoordinator,
  type VestResultLike,
  type VestRunnableSuite,
} from './vest-run-coordinator';

/**
 * Coordinator-level coverage. Every test here drives the coordinator's own
 * `request` / `invalidate` interface with a hand-rolled suite -- no `TestBed`,
 * no rendered component, no Angular validators. That is the whole point of
 * the seam: the FIFO ordering and single-execution guarantees the adapter
 * documents used to be reachable only through a mounted form.
 *
 * The end-to-end behaviour through `validateVest` stays covered by
 * `validate-vest.spec.ts` and `vest-adapter.spec.ts`.
 */

/**
 * Vest's selector shape for a suite with no failures. Declared with real
 * overloads (rather than a cast) so it satisfies {@link VestResultLike}'s
 * whole-suite / field-scoped selector contract exactly.
 */
function noMessages(): Readonly<Record<string, readonly string[]>>;
function noMessages(fieldName: string): readonly string[];
function noMessages(
  fieldName?: string,
): Readonly<Record<string, readonly string[]>> | readonly string[] {
  return fieldName === undefined ? {} : [];
}

/** A Vest 6-shaped run result: both a synchronous result AND a thenable. */
type FakeRunResult = VestResultLike & PromiseLike<VestResultLike>;

interface ControllableSuite {
  /** The suite handed to the coordinator. */
  readonly suite: VestRunnableSuite<string>;
  /** Values passed to `suite.run(...)`, in the order the runs actually started. */
  readonly started: readonly string[];
  /** Field names passed to `suite.only(...)`, in call order. */
  readonly focused: readonly (string | readonly string[])[];
  /** The accumulated result a finished run settles with. */
  readonly settledResult: VestResultLike;
  /**
   * Settle one in-flight run, firing the suite bus once nothing is pending.
   * An arrow property (not a method) so tests can destructure it freely.
   */
  readonly finish: (label: string) => void;
}

/**
 * A suite whose runs complete synchronously -- nothing is ever pending, so
 * the coordinator never treats it as contested. Used by the cache-identity
 * tests, which are about the `(suite, cacheKey, value, focus)` key alone.
 */
function createInstantSuite(): {
  readonly suite: VestRunnableSuite<string>;
  readonly started: readonly string[];
  readonly focused: readonly (string | readonly string[])[];
} {
  const started: string[] = [];
  const focused: (string | readonly string[])[] = [];
  const run = (value: string): VestResultLike => {
    started.push(value);
    return {
      isPending: () => false,
      getErrors: noMessages,
      getWarnings: noMessages,
    };
  };

  return {
    suite: {
      run,
      only: (field: string | string[]) => {
        focused.push(field);
        return { run };
      },
    },
    started,
    focused,
  };
}

/**
 * A hand-rolled Vest suite whose runs stay pending until explicitly finished.
 *
 * Mirrors the parts of a real `create()` suite the coordinator actually
 * depends on: a dual sync-result/thenable `run()` return value, an
 * `isPending()` that reports suite-wide (not per-run) state, an
 * `ALL_RUNNING_TESTS_FINISHED` bus, and a `get()` accumulator.
 *
 * Pass `{ withEventBus: false }` to drop `subscribe`/`get` entirely -- the
 * degraded shape the coordinator explicitly documents a fallback for.
 */
function createControllableSuite(
  { withEventBus }: { withEventBus: boolean } = { withEventBus: true },
): ControllableSuite {
  const started: string[] = [];
  const focused: (string | readonly string[])[] = [];
  const listeners = new Set<() => void>();
  const pending = new Map<string, () => void>();

  const isPending = (): boolean => pending.size > 0;

  // What a finished run resolves WITH. Deliberately a different object from
  // the returned run result: a thenable that resolves with itself never
  // settles, which is not how a real Vest run behaves.
  const settledResult: VestResultLike = {
    isPending: () => false,
    getErrors: noMessages,
    getWarnings: noMessages,
  };

  const makeResult = (label: string): FakeRunResult => {
    let resolveRun: (result: VestResultLike) => void = () => {};
    const settlement = new Promise<VestResultLike>((resolve) => {
      resolveRun = resolve;
    });
    const result: FakeRunResult = {
      isPending,
      getErrors: noMessages,
      getWarnings: noMessages,
      // oxlint-disable-next-line unicorn/no-thenable -- Vest 6's `run()` deliberately returns a value that is BOTH a synchronous `SuiteResult` and a thenable; the coordinator's `initialResult` gating exists for exactly that shape, so the fake must reproduce it.
      then: (onFulfilled, onRejected) =>
        settlement.then(onFulfilled, onRejected),
    };
    pending.set(label, () => {
      resolveRun(settledResult);
    });
    return result;
  };

  const run = (value: string): FakeRunResult => {
    started.push(value);
    return makeResult(value);
  };

  const eventBus = {
    subscribe: (_event: 'ALL_RUNNING_TESTS_FINISHED', callback: () => void) => {
      listeners.add(callback);
      return () => {
        listeners.delete(callback);
      };
    },
    get: (): VestResultLike => ({
      isPending,
      getErrors: noMessages,
      getWarnings: noMessages,
    }),
  };

  const suite: VestRunnableSuite<string> = {
    run,
    only: (field: string | string[]) => {
      focused.push(field);
      return { run };
    },
    ...(withEventBus ? eventBus : {}),
  };

  return {
    suite,
    started,
    focused,
    settledResult,
    finish: (label: string): void => {
      const settle = pending.get(label);
      pending.delete(label);
      settle?.();
      if (pending.size === 0) {
        for (const listener of listeners) {
          listener();
        }
      }
    },
  };
}

/**
 * A suite that reproduces Vest 6's SUPERSEDED-RESOLVER behaviour.
 *
 * Vest tracks one resolver per suite root isolate, so every `run()` replaces
 * the previous call's resolver: the earlier call's returned thenable then
 * stays pending forever. Only the suite-wide `ALL_RUNNING_TESTS_FINISHED`
 * event still reports that the earlier run finished.
 */
function createSupersedingSuite(): {
  readonly suite: VestRunnableSuite<string>;
  readonly started: readonly string[];
  /** Finish every in-flight run and fire the suite bus once. */
  readonly finishAll: () => void;
} {
  const started: string[] = [];
  const listeners = new Set<() => void>();
  let pendingCount = 0;
  // The single resolver Vest keeps per suite. A new run overwrites it, which
  // is what strands the previous run's promise.
  let resolveLatest: ((result: VestResultLike) => void) | undefined;

  const isPending = (): boolean => pendingCount > 0;
  const settledResult: VestResultLike = {
    isPending: () => false,
    getErrors: noMessages,
    getWarnings: noMessages,
  };

  const run = (value: string): FakeRunResult => {
    started.push(value);
    pendingCount += 1;
    let resolveRun: (result: VestResultLike) => void = () => {};
    const settlement = new Promise<VestResultLike>((resolve) => {
      resolveRun = resolve;
    });
    resolveLatest = resolveRun;
    return {
      isPending,
      getErrors: noMessages,
      getWarnings: noMessages,
      // oxlint-disable-next-line unicorn/no-thenable -- see `createControllableSuite`: this fakes Vest's dual sync-result/thenable `run()` return value.
      then: (onFulfilled, onRejected) =>
        settlement.then(onFulfilled, onRejected),
    };
  };

  return {
    suite: {
      run,
      only: (_field: string | string[]) => ({ run }),
      subscribe: (
        _event: 'ALL_RUNNING_TESTS_FINISHED',
        callback: () => void,
      ) => {
        listeners.add(callback);
        return () => {
          listeners.delete(callback);
        };
      },
      get: (): VestResultLike => ({
        isPending,
        getErrors: noMessages,
        getWarnings: noMessages,
      }),
    },
    started,
    finishAll: (): void => {
      pendingCount = 0;
      resolveLatest?.(settledResult);
      resolveLatest = undefined;
      for (const listener of listeners) {
        listener();
      }
    },
  };
}

/** Drains every pending microtask, including the coordinator's own callbacks. */
function drainMicrotasks(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

describe('createVestRunCoordinator', () => {
  describe('single execution', () => {
    it('runs the suite once for repeated requests on the same (suite, cacheKey, value, focus) tuple', () => {
      const coordinator = createVestRunCoordinator();
      const { suite, started } = createControllableSuite();
      const cacheKey = {};

      // The sync (`validateTree`) phase asks first...
      const sync = coordinator.request({ suite, cacheKey, value: 'a' });
      // ...and the async (`validateAsync`) phase asks for the identical tuple.
      const async = coordinator.request({ suite, cacheKey, value: 'a' });

      expect(started).toEqual(['a']);
      expect(sync.fromCache).toBe(false);
      expect(async.fromCache).toBe(true);
      // Both phases observe ONE execution, not two equivalent ones.
      expect(async.runResult).toBe(sync.runResult);
      expect(async.initialResult).toBe(sync.initialResult);
    });

    it('is idempotent for a repeated tuple across many redundant calls', () => {
      // Regression guard for the invariant `request()`'s doc comment states:
      // a reactive computed re-running for a reason unrelated to this
      // request (see `registerVestValidation`'s `validateTree`/
      // `validateAsync` callbacks, which call `request()` on every
      // re-evaluation) must never start a second `suite.run()` for the same
      // tuple. Five calls stand in for "however many times change detection
      // happens to re-run the computed".
      const coordinator = createVestRunCoordinator();
      const { suite, started } = createControllableSuite();
      const cacheKey = {};

      const results = Array.from({ length: 5 }, () =>
        coordinator.request({ suite, cacheKey, value: 'a' }),
      );

      expect(started).toEqual(['a']);
      expect(results[0]?.fromCache).toBe(false);
      expect(results.slice(1).every((result) => result.fromCache)).toBe(true);
      for (const result of results.slice(1)) {
        expect(result.runResult).toBe(results[0]?.runResult);
        expect(result.initialResult).toBe(results[0]?.initialResult);
      }
    });

    it('re-runs when the value reference, the focus, or the cache key changes', () => {
      const coordinator = createVestRunCoordinator();
      const { suite, started, focused } = createInstantSuite();
      const cacheKey = {};

      coordinator.request({ suite, cacheKey, value: 'a' });
      expect(
        coordinator.request({ suite, cacheKey, value: 'b' }).fromCache,
      ).toBe(false);
      // Same value, different focus -> different cache entry.
      expect(
        coordinator.request({ suite, cacheKey, value: 'b', focus: 'email' })
          .fromCache,
      ).toBe(false);
      expect(
        coordinator.request({ suite, cacheKey, value: 'b', focus: 'email' })
          .fromCache,
      ).toBe(true);
      // Same tuple, different cache key -> different cache entry.
      expect(
        coordinator.request({ suite, cacheKey: {}, value: 'b' }).fromCache,
      ).toBe(false);

      expect(started).toEqual(['a', 'b', 'b', 'b']);
      expect(focused).toEqual(['email']);
    });

    it('exposes the synchronous result when the suite produced one', () => {
      const coordinator = createVestRunCoordinator();
      const { suite } = createControllableSuite();

      const handle = coordinator.request({
        suite,
        cacheKey: {},
        value: 'a',
      });

      expect(handle.initialResult).toBe(handle.runResult);
      expect(handle.initialResult?.isPending()).toBe(true);
      expect(handle.deferred).toBe(false);
      expect(handle.focus).toBeUndefined();
    });

    it('reports no synchronous result when the suite returns a bare promise', async () => {
      const coordinator = createVestRunCoordinator();
      const settledResult: VestResultLike = {
        isPending: () => false,
        getErrors: noMessages,
        getWarnings: noMessages,
      };
      const suite: VestRunnableSuite<string> = {
        run: () => Promise.resolve(settledResult),
      };

      const handle = coordinator.request({ suite, cacheKey: {}, value: 'a' });

      expect(handle.initialResult).toBeUndefined();
      await expect(handle.settled()).resolves.toBe(settledResult);
    });
  });

  describe('FIFO ordering for contested runs', () => {
    it('serialises whole-suite runs from different cache keys in request order', async () => {
      const coordinator = createVestRunCoordinator();
      const { suite, started, finish } = createControllableSuite();

      // A starts immediately: nothing else is pending on this suite.
      const first = coordinator.request({ suite, cacheKey: {}, value: 'a' });
      expect(first.deferred).toBe(false);
      expect(started).toEqual(['a']);

      // B and C both arrive while A is still pending on the SAME suite but a
      // DIFFERENT cache key, so both are queued rather than overlapping A.
      const second = coordinator.request({ suite, cacheKey: {}, value: 'b' });
      const third = coordinator.request({ suite, cacheKey: {}, value: 'c' });
      expect(second.deferred).toBe(true);
      expect(third.deferred).toBe(true);
      // A deferred run has not called `suite.run()` yet.
      expect(second.initialResult).toBeUndefined();
      expect(started).toEqual(['a']);

      finish('a');
      await vi.waitFor(() => {
        expect(started).toEqual(['a', 'b']);
      });
      // C is still behind B -- the queue releases one contender at a time.
      expect(started).toEqual(['a', 'b']);

      finish('b');
      await vi.waitFor(() => {
        expect(started).toEqual(['a', 'b', 'c']);
      });

      finish('c');
      await expect(third.settled()).resolves.toBeDefined();
    });

    it('does not queue focused runs, which are the intentional shared-suite pattern', () => {
      const coordinator = createVestRunCoordinator();
      const { suite, started } = createControllableSuite();

      coordinator.request({ suite, cacheKey: {}, value: 'a', focus: 'email' });
      const second = coordinator.request({
        suite,
        cacheKey: {},
        value: 'b',
        focus: 'password',
      });

      expect(second.deferred).toBe(false);
      expect(started).toEqual(['a', 'b']);
    });

    it('starts a queued run immediately once the suite is no longer contested', async () => {
      const coordinator = createVestRunCoordinator();
      const { suite, started, finish } = createControllableSuite();

      coordinator.request({ suite, cacheKey: {}, value: 'a' });
      finish('a');
      // A macrotask boundary drains every pending microtask, including the
      // coordinator's own "this run settled, stop tracking it" callback.
      await drainMicrotasks();

      // A settled, so a request from another cache key is uncontested.
      const next = coordinator.request({ suite, cacheKey: {}, value: 'b' });
      expect(next.deferred).toBe(false);
      expect(started).toEqual(['a', 'b']);
    });

    it('stops tracking an unfocused run a focused run superseded, once the suite settles', async () => {
      // Regression guard for issue #322. A focused run is never deferred, so
      // it starts while an unfocused run is still pending on the same suite
      // and replaces that suite's single resolver -- the unfocused run's own
      // thenable can then never settle. Untracking off that thenable leaked
      // the pending marker (and the strongly held cache key and result) for
      // the suite's lifetime, and pinned the suite as contested for every
      // other cache key.
      const coordinator = createVestRunCoordinator();
      const { suite, started, finishAll } = createSupersedingSuite();

      const unfocused = coordinator.request({
        suite,
        cacheKey: {},
        value: 'a',
      });
      expect(unfocused.deferred).toBe(false);

      coordinator.request({ suite, cacheKey: {}, value: 'b', focus: 'email' });
      expect(started).toEqual(['a', 'b']);

      // The bus event is the ONLY signal that the superseded run finished.
      finishAll();
      await drainMicrotasks();

      const next = coordinator.request({ suite, cacheKey: {}, value: 'c' });
      expect(next.deferred).toBe(false);
      expect(started).toEqual(['a', 'b', 'c']);
    });
  });

  describe('suite bus subscriptions', () => {
    it('unsubscribes an idle listener whose callback fires synchronously during subscribe()', () => {
      // Regression guard for the PR #312 review finding: a `subscribe`
      // implementation that invokes its callback DURING the `subscribe()`
      // call reaches the callback's `unsubscribe?.()` before `unsubscribe`
      // has been assigned, so that cleanup was a no-op and the listener
      // stayed registered for the suite's lifetime -- re-firing on every
      // later idle event.
      const coordinator = createVestRunCoordinator();
      const listeners = new Set<() => void>();
      let invocations = 0;
      // Always pending, so `waitForSuiteIdle` never takes its early-return
      // path and always reaches `subscribe()`.
      const pendingResult: VestResultLike = {
        isPending: () => true,
        getErrors: noMessages,
        getWarnings: noMessages,
      };
      const suite: VestRunnableSuite<string> = {
        run: () => pendingResult,
        subscribe: (_event, callback) => {
          const listener = (): void => {
            invocations += 1;
            callback();
          };
          listeners.add(listener);
          // Fire DURING `subscribe()`, before the caller can store the
          // unsubscribe function this call is about to return.
          listener();
          return () => {
            listeners.delete(listener);
          };
        },
        get: () => pendingResult,
      };

      coordinator.request({ suite, cacheKey: {}, value: 'a' });

      // One request makes more than one subscription (the queue tail waits for
      // the suite to go idle, and the pending marker waits for the run to
      // settle), so assert the property that matters rather than a count: each
      // callback fired, and every subscription was torn down rather than
      // leaked.
      const synchronousInvocations = invocations;
      expect(synchronousInvocations).toBeGreaterThan(0);
      expect(listeners.size).toBe(0);

      // A later idle event must therefore reach nobody.
      for (const listener of listeners) {
        listener();
      }
      expect(invocations).toBe(synchronousInvocations);
    });
  });

  describe('settlement', () => {
    it('recovers a superseded run via the suite bus event', async () => {
      const coordinator = createVestRunCoordinator();
      const busResult: VestResultLike = {
        isPending: () => false,
        getErrors: noMessages,
        getWarnings: noMessages,
      };
      const listeners = new Set<() => void>();
      // A suite whose run thenable NEVER settles -- exactly what Vest does to
      // a run whose resolver a later run replaced.
      const suite: VestRunnableSuite<string> = {
        run: () => ({
          isPending: () => true,
          getErrors: noMessages,
          getWarnings: noMessages,
          // oxlint-disable-next-line unicorn/no-thenable -- see `createControllableSuite`: this fakes Vest's dual sync-result/thenable `run()` return value, here with a thenable that never settles.
          then: () => new Promise<never>(() => {}),
        }),
        subscribe: (_event, callback) => {
          listeners.add(callback);
          return () => {
            listeners.delete(callback);
          };
        },
        get: () => busResult,
      };

      const handle = coordinator.request({ suite, cacheKey: {}, value: 'a' });
      const settled = handle.settled();
      for (const listener of listeners) {
        listener();
      }

      await expect(settled).resolves.toBe(busResult);
      // The bus subscription is released once the race is decided.
      expect(listeners.size).toBe(0);
    });

    it('settles from the run itself for a suite WITHOUT subscribe/get', async () => {
      const coordinator = createVestRunCoordinator();
      const { suite, started, finish, settledResult } = createControllableSuite(
        {
          withEventBus: false,
        },
      );

      expect(suite.subscribe).toBeUndefined();
      expect(suite.get).toBeUndefined();

      const handle = coordinator.request({ suite, cacheKey: {}, value: 'a' });
      expect(started).toEqual(['a']);

      // No bus event will ever fire, so settlement can only come from the
      // run's own thenable.
      finish('a');
      await expect(handle.settled()).resolves.toBe(settledResult);
    });

    it('releases a queued run for a suite WITHOUT subscribe/get from the previous run thenable', async () => {
      const coordinator = createVestRunCoordinator();
      const { suite, started, finish } = createControllableSuite({
        withEventBus: false,
      });

      coordinator.request({ suite, cacheKey: {}, value: 'a' });
      const second = coordinator.request({ suite, cacheKey: {}, value: 'b' });

      // Contention IS still detected (a pending run on another cache key), so
      // the run is queued -- but with no idle signal to wait for it starts as
      // soon as the previous run's own thenable settles.
      expect(second.deferred).toBe(true);
      expect(started).toEqual(['a']);

      finish('a');
      await vi.waitFor(() => {
        expect(started).toEqual(['a', 'b']);
      });
    });

    it('propagates a rejected run through the settlement promise', async () => {
      const coordinator = createVestRunCoordinator();
      const failure = new Error('suite blew up');
      const suite: VestRunnableSuite<string> = {
        run: () => Promise.reject(failure),
      };

      const handle = coordinator.request({ suite, cacheKey: {}, value: 'a' });

      await expect(handle.settled()).rejects.toBe(failure);
    });
  });

  describe('focus', () => {
    it('throws for a "focus nothing" request, before touching the suite', () => {
      const coordinator = createVestRunCoordinator();
      const { suite, started } = createControllableSuite();

      expect(() =>
        coordinator.request({ suite, cacheKey: {}, value: 'a', focus: false }),
      ).toThrow(/focus nothing/i);
      expect(() =>
        coordinator.request({ suite, cacheKey: {}, value: 'a', focus: [] }),
      ).toThrow(/focus nothing/i);
      expect(started).toEqual([]);
    });

    it('composes a collision-free cache key for a field-name list', () => {
      const coordinator = createVestRunCoordinator();
      const { suite, focused } = createControllableSuite();
      const cacheKey = {};

      const list = coordinator.request({
        suite,
        cacheKey,
        value: 'a',
        focus: ['email', 'password'],
      });
      expect(list.fromCache).toBe(false);
      expect(
        coordinator.request({
          suite,
          cacheKey,
          value: 'a',
          focus: ['email', 'password'],
        }).fromCache,
      ).toBe(true);

      // The joined key uses a NUL separator, so it cannot collide with a
      // single field literally named `emailpassword`.
      expect(
        coordinator.request({
          suite,
          cacheKey,
          value: 'a',
          focus: 'emailpassword',
        }).fromCache,
      ).toBe(false);
      expect(focused).toEqual([['email', 'password'], 'emailpassword']);
    });

    it('falls back to run(value, fieldName) when the suite exposes no only()', () => {
      const coordinator = createVestRunCoordinator();
      const fieldNames: (string | undefined)[] = [];
      const suite: VestRunnableSuite<string> = {
        run: (_value: string, fieldName?: string) => {
          fieldNames.push(fieldName);
          return {
            isPending: () => false,
            getErrors: noMessages,
            getWarnings: noMessages,
          };
        },
      };

      coordinator.request({ suite, cacheKey: {}, value: 'a', focus: 'email' });
      // The legacy form takes a single name, so a list collapses to its first.
      coordinator.request({
        suite,
        cacheKey: {},
        value: 'a',
        focus: ['email', 'password'],
      });

      expect(fieldNames).toEqual(['email', 'email']);
    });
  });

  describe('invalidate', () => {
    it('drops the cached run so an identical tuple re-executes', () => {
      const coordinator = createVestRunCoordinator();
      const { suite, started } = createControllableSuite();
      const cacheKey = {};

      coordinator.request({ suite, cacheKey, value: 'a' });
      expect(
        coordinator.request({ suite, cacheKey, value: 'a' }).fromCache,
      ).toBe(true);

      coordinator.invalidate(suite);

      expect(
        coordinator.request({ suite, cacheKey, value: 'a' }).fromCache,
      ).toBe(false);
      expect(started).toEqual(['a', 'a']);
    });

    it('does not un-defer a run that is genuinely still in flight', () => {
      // Regression guard for issue #322. `invalidate` used to drop the
      // contention bookkeeping as well, which it cannot do safely: it has no
      // way to tell a stale marker from a live one, so it un-deferred runs
      // that were still executing and let the next request overlap them.
      const coordinator = createVestRunCoordinator();
      const { suite, started } = createControllableSuite();

      coordinator.request({ suite, cacheKey: {}, value: 'a' });
      coordinator.invalidate(suite);

      const next = coordinator.request({ suite, cacheKey: {}, value: 'b' });
      expect(next.deferred).toBe(true);
      expect(started).toEqual(['a']);
    });

    it('lets a pending run retire on its own, so a reused suite is not stuck "contested"', async () => {
      const coordinator = createVestRunCoordinator();
      const { suite, started, finish } = createControllableSuite();

      coordinator.request({ suite, cacheKey: {}, value: 'a' });
      coordinator.invalidate(suite);

      finish('a');
      await drainMicrotasks();

      const next = coordinator.request({ suite, cacheKey: {}, value: 'b' });
      expect(next.deferred).toBe(false);
      expect(started).toEqual(['a', 'b']);
    });

    it('leaves other suites untouched', () => {
      const coordinator = createVestRunCoordinator();
      const first = createControllableSuite();
      const second = createControllableSuite();
      const cacheKey = {};

      coordinator.request({ suite: first.suite, cacheKey, value: 'a' });
      coordinator.request({ suite: second.suite, cacheKey, value: 'a' });

      coordinator.invalidate(first.suite);

      expect(
        coordinator.request({ suite: first.suite, cacheKey, value: 'a' })
          .fromCache,
      ).toBe(false);
      expect(
        coordinator.request({ suite: second.suite, cacheKey, value: 'a' })
          .fromCache,
      ).toBe(true);
    });
  });
});
