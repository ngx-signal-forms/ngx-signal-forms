import { DestroyRef, inject, isDevMode, resource } from '@angular/core';
import {
  type FieldContext,
  type ReadonlyFieldTree,
  type SchemaPath,
  type SchemaPathTree,
  type ValidationError,
  validateAsync,
  validateTree,
} from '@angular/forms/signals';
import {
  createVestRunCoordinator,
  isVestResultLike,
  type VestCoordinatedSuite,
  type VestFieldExclusion,
  type VestResultLike,
  type VestRunCoordinator,
  type VestRunHandle,
  type VestRunnableSuite,
} from './vest-run-coordinator';
import {
  createVestValidationSnapshot,
  mapVestValidationResult,
  shouldDeferVestWarnings,
  VEST_ERROR_KIND_PREFIX,
  VEST_WARNING_KIND_PREFIX,
  type VestValidationSnapshot,
} from './vest-result-mapper';

/* oxlint-disable @typescript-eslint/prefer-readonly-parameter-types -- Angular Signal Forms validator callbacks and lightweight path parsing helpers operate on framework/runtime types that are not modeled as readonly. */

// The Vest suite contract and the run coordinator's own types live in
// `./vest-run-coordinator`, which owns the cache, contention detection, FIFO
// queue, and settlement machinery. They are re-exported here because
// `./vest-adapter` is their documented public home (see `./index.ts`).
export type {
  VestCoordinatedSuite,
  VestFieldExclusion,
  VestResultLike,
  VestRunnableSuite,
} from './vest-run-coordinator';

// `VEST_WARNING_KIND_PREFIX` / `VEST_ERROR_KIND_PREFIX` are defined in
// `./vest-result-mapper.ts` (their kind-generation logic lives there) and
// re-exported below so `./index.ts` keeps importing them from this module
// unchanged.
export { VEST_ERROR_KIND_PREFIX, VEST_WARNING_KIND_PREFIX };

/**
 * Callback supplied via {@link VestRegisterOptions.only} to enable per-field
 * focused runs. Receives the Angular Signal Forms field context and returns
 * the Vest field name (or list of names) to focus on for the current run.
 * Returning `undefined` falls back to a whole-suite run.
 *
 * `F` is the suite's own field-name union (Vest 6.3.2 propagates one through
 * `create<{ fields: 'email' | 'password' }>(…)` or a schema-typed suite) and
 * defaults to `string` so an untyped suite still accepts any field name. `F`
 * is inferred from the {@link VestRunnableSuite} passed alongside this
 * selector (`validateVest`, `validateVestWarnings`,
 * `VestSuiteAdapter.register`) — callers never write it explicitly. See
 * ADR-0008 and issue #292.
 */
export type VestOnlyFieldSelector<TValue, F extends string = string> = (
  ctx: FieldContext<TValue>,
) => VestFieldExclusion<F>;

/**
 * Schema path accepted by the adapter's `register` method and the built-in
 * `validateVest`/`validateVestWarnings` entry points.
 */
export type VestFieldPath<TValue> = SchemaPath<TValue> & SchemaPathTree<TValue>;

// `VestValidationMode`, `VestValidationEntry` and `VestValidationSnapshot`
// (the mapping pipeline's own vocabulary) now live in
// `./vest-result-mapper.ts`. `VestValidationSnapshot` is imported above --
// `PendingVestValidationPayload` and `ResolvedVestValidationPayload` below
// still need it for the resource-loader payload shapes registration owns.

/**
 * Internal registration flags that decide whether blocking errors, warnings, or
 * both should be mapped into Angular Signal Forms.
 */
interface VestValidationRegistrationOptions<TValue, F extends string = string> {
  readonly includeErrors: boolean;
  readonly includeWarnings: boolean;
  readonly only?: VestOnlyFieldSelector<TValue, F>;
}

/**
 * Resource payload for pending Vest async validation.
 */
interface PendingVestValidationPayload {
  /** The coordinated run's settlement promise -- see {@link VestRunHandle}. */
  readonly settled: () => PromiseLike<unknown>;
  readonly initialSnapshot: VestValidationSnapshot;
}

/**
 * Fully resolved async validation payload returned from the resource loader.
 */
interface ResolvedVestValidationPayload {
  readonly result: VestResultLike;
  readonly initialSnapshot: VestValidationSnapshot;
}

function isThenable(value: unknown): value is PromiseLike<unknown> {
  return (
    value !== null &&
    (typeof value === 'object' || typeof value === 'function') &&
    typeof Reflect.get(value, 'then') === 'function'
  );
}

// `toVestValidationEntries`, `createVestEntriesForField`,
// `filterExistingVestEntries`, `toVestValidationErrors`,
// `VestValidationFlags`, `createVestValidationSnapshot`,
// `mapVestValidationResult` and `shouldDeferVestWarnings` (the result-mapping
// pipeline itself) now live in `./vest-result-mapper.ts`, imported above.

/**
 * Options accepted by {@link createVestAdapter}.
 */
export interface VestAdapterOptions {
  /**
   * Whether the adapter's `register` should default to clearing suite state on
   * destroy. Individual `register` calls can still override this per-field via
   * {@link VestRegisterOptions.resetOnDestroy}.
   *
   * @default true
   */
  readonly resetOnDestroy?: boolean;
}

/**
 * Per-field registration options accepted by {@link VestSuiteAdapter.register}.
 */
export interface VestRegisterOptions<
  TValue = unknown,
  F extends string = string,
> {
  /**
   * Map Vest blocking `test()` failures onto the field as Angular validation
   * errors.
   *
   * @default true
   */
  readonly includeErrors?: boolean;

  /**
   * Map Vest warn-only `warn()` results onto the field as non-blocking
   * `warn:vest:*` validation errors.
   *
   * @default false
   */
  readonly includeWarnings?: boolean;

  /**
   * Call `suite.reset()` (and invalidate the shared run cache) when the
   * injection context that registered the validator is destroyed. Falls back
   * to the adapter-level default from {@link VestAdapterOptions.resetOnDestroy}
   * when omitted.
   */
  readonly resetOnDestroy?: boolean;

  /**
   * Enable per-field focused runs by deriving the Vest field name from the
   * supplied selector. See {@link VestOnlyFieldSelector}.
   */
  readonly only?: VestOnlyFieldSelector<TValue, F>;
}

/**
 * Input describing a single shared, cache-aware Vest run. Consumed by
 * {@link VestSuiteAdapter.runVestSuite}.
 */
export interface RunVestSuiteParams<TValue, F extends string = string> {
  /**
   * The exact slice of {@link VestRunnableSuite} the run coordinator drives —
   * see {@link VestCoordinatedSuite}'s doc comment. Using that one named type
   * here (rather than re-spelling the identical `Pick` inline) keeps this
   * public parameter and the coordinator's own internal request shape
   * structurally and nominally the same type.
   */
  readonly suite: VestCoordinatedSuite<TValue, F>;
  readonly fieldTree: ReadonlyFieldTree<TValue>;
  readonly value: TValue;
  readonly focus?: VestFieldExclusion<F>;
}

/**
 * Result of a shared, cache-aware single Vest run. `initialResult` is the
 * synchronous `SuiteResult` (or `undefined` when the suite's `run()` returns a
 * raw thenable — including a run the coordinator deferred to avoid
 * contention, see {@link VestRunHandle}), `runResult` is the underlying
 * sync-or-async run value, and `fromCache` reports whether this run reused a
 * previously cached execution for the identical `(suite, fieldTree, value,
 * focus)` tuple.
 *
 * **Do not `await runResult` directly.** In older Vest 6 releases, `suite.run()` promises
 * resolves through a single resolver tracked per suite instance: a LATER
 * `suite.run()` call on the SAME suite (e.g. a second `runVestSuite` call, or
 * a second focused `validateVest` registration on the same suite) replaces
 * that resolver before an earlier, still-pending call's promise ever settles
 * — empirically verified against `vest@6.3.2`. Newer releases can settle both
 * raw promises. Await {@link settled} for a version-independent guarantee;
 * it recovers from that supersession the same way the built-in
 * `validateVest`/`validateVestWarnings` pipeline does. See
 * {@link VestRunHandle.settled}.
 */
export interface RunVestSuiteResult<TValue, F extends string = string> {
  readonly value: TValue;
  /**
   * The `focus` exactly as requested in {@link RunVestSuiteParams.focus} — a
   * field name, a list of field names, `false`, or `undefined` for a
   * whole-suite run. Not the coordinator's internal, NUL-joined cache key.
   */
  readonly focus: VestFieldExclusion<F>;
  readonly runResult: VestResultLike<F> | PromiseLike<VestResultLike<F>>;
  readonly initialResult: VestResultLike<F> | undefined;
  readonly fromCache: boolean;
  /**
   * `true` when this run was queued behind another field tree's pending run
   * on the SAME suite instead of starting immediately. Forwarded from
   * {@link VestRunHandle.deferred}.
   */
  readonly deferred: boolean;
  /**
   * Resolves once this run's outcome is observable, recovering from a
   * superseded Vest resolver where the suite makes that possible. The safe
   * thing to await for a manual flow — see this interface's doc comment.
   * Forwarded from {@link VestRunHandle.settled}.
   */
  readonly settled: () => PromiseLike<unknown>;
}

/**
 * A documented, public adapter around the per-(suite + field-tree) shared run
 * cache and the sync/async delta machinery that powers `validateVest` and
 * `validateVestWarnings`.
 *
 * The adapter owns a single shared run cache so that:
 *
 * - the `validateTree` (sync) and `validateAsync` (async) phases of one
 *   `register` call share exactly one `suite.run()` execution, and
 * - multiple validators bound to the same `(suite, fieldTree, value, focus)`
 *   tuple reuse that one execution instead of re-running the suite.
 *
 * Advanced consumers can call {@link runVestSuite} directly to obtain the
 * cached run for a manual validation flow, and {@link invalidate} to drop the
 * cache for a suite (the `resetOnDestroy` hook calls this internally).
 */
export interface VestSuiteAdapter {
  /**
   * Wire a Vest suite into Angular Signal Forms for the given field path,
   * registering both the synchronous (`validateTree`) and asynchronous
   * (`validateAsync`) phases against the shared run cache.
   */
  register<TValue, F extends string = string>(
    path: VestFieldPath<TValue>,
    suite: VestRunnableSuite<TValue, F>,
    options?: VestRegisterOptions<TValue, F>,
  ): void;

  /**
   * Run a Vest suite once through the shared cache. Returns the cached run for
   * an identical `(suite, fieldTree, value, focus)` tuple, or executes a fresh
   * run (and caches it) when any of those change.
   */
  runVestSuite<TValue, F extends string = string>(
    params: RunVestSuiteParams<TValue, F>,
  ): RunVestSuiteResult<TValue, F>;

  /**
   * Drop the shared run cache for a suite so the next run re-executes
   * `suite.run()` even when the field tree reference is reused.
   */
  invalidate(suite: object): void;
}

/**
 * Create a {@link VestSuiteAdapter} backed by its own shared run cache.
 *
 * The built-in `validateVest` / `validateVestWarnings` entry points are wired
 * onto the {@link sharedVestAdapter} instance, so passing the same suite to
 * both a built-in validator and `sharedVestAdapter.runVestSuite(...)` reuses a
 * single suite execution.
 *
 * @example
 * ```typescript
 * import { form } from '@angular/forms/signals';
 * import { create, enforce, test } from 'vest';
 * import { createVestAdapter } from '@ngx-signal-forms/toolkit/vest';
 *
 * const adapter = createVestAdapter();
 * const suite = create((data: { email: string }) => {
 *   test('email', 'Email is required', () => {
 *     enforce(data.email).isNotBlank();
 *   });
 * });
 *
 * const loginForm = form(signal({ email: '' }), (path) => {
 *   adapter.register(path, suite); // resets on destroy by default
 * });
 * ```
 */
export function createVestAdapter(
  options: VestAdapterOptions = {},
): VestSuiteAdapter {
  const defaultResetOnDestroy = options.resetOnDestroy ?? true;
  // The run coordinator owns the cache, contention detection, FIFO queue and
  // settlement machinery. Each adapter instance gets its own, so two adapters
  // never share a run cache. See `./vest-run-coordinator.ts`.
  const coordinator: VestRunCoordinator = createVestRunCoordinator();
  // Tracks how many live `resetOnDestroy`-enabled registrations currently
  // reference each suite, so a suite shared across concurrently mounted forms
  // (the README-recommended module-scope pattern) is only reset once the
  // LAST registration tears down -- see `maybeRegisterResetOnDestroy`.
  const resetOnDestroyRefCounts = new WeakMap<object, number>();

  function register<TValue, F extends string = string>(
    path: VestFieldPath<TValue>,
    suite: VestRunnableSuite<TValue, F>,
    registerOptions: VestRegisterOptions<TValue, F> = {},
  ): void {
    const includeErrors = registerOptions.includeErrors ?? true;
    const includeWarnings = registerOptions.includeWarnings ?? false;
    maybeRegisterResetOnDestroy(
      suite,
      registerOptions.resetOnDestroy ?? defaultResetOnDestroy,
    );
    registerVestValidation(path, suite, {
      includeErrors,
      includeWarnings,
      ...(registerOptions.only !== undefined && { only: registerOptions.only }),
    });
  }

  function runVestSuite<TValue, F extends string = string>(
    params: RunVestSuiteParams<TValue, F>,
  ): RunVestSuiteResult<TValue, F> {
    const handle = coordinator.request({
      suite: params.suite,
      // Per-(suite, field tree) caching: the bound field tree IS the cache
      // key on the built-in path.
      cacheKey: params.fieldTree,
      value: params.value,
      ...(params.focus !== undefined && { focus: params.focus }),
    });

    return {
      value: handle.value,
      // The original requested shape, not `handle.focus` (the coordinator's
      // internal, NUL-joined cache key) — see this interface's doc comment.
      focus: params.focus,
      runResult: handle.runResult,
      initialResult: handle.initialResult,
      fromCache: handle.fromCache,
      deferred: handle.deferred,
      settled: handle.settled,
    };
  }

  function invalidate(suite: object): void {
    coordinator.invalidate(suite);
  }

  /**
   * Registers a `DestroyRef.onDestroy()` hook that calls `suite.reset()` when
   * the current injection context is torn down. No-op when `resetOnDestroy` is
   * false or when the suite does not expose a `reset` callable. The hook clears
   * the SAME shared run cache so a subsequent mount re-executes `run()`.
   *
   * Registrations are reference-counted per suite: a module-scope suite
   * shared by multiple concurrently mounted forms (the README-recommended
   * pattern) increments this count on each opted-in registration and only
   * actually resets once the LAST one tears down. Without this, destroying
   * any one mount would reset (and drop the run cache for) a suite that a
   * SURVIVING mount is still relying on -- wiping its retained `only()`-run
   * state and, for an in-flight async run, orphaning its promise.
   */
  function maybeRegisterResetOnDestroy<TValue>(
    // Narrowed to just `reset` (rather than the whole `VestRunnableSuite`):
    // this function never touches `only`/`get`, whose types carry the
    // suite's field-name union `F` — Picking only what's used lets any
    // `VestRunnableSuite<TValue, F>`, for any `F`, satisfy this parameter
    // without threading `F` through here too.
    suite: Pick<VestRunnableSuite<TValue>, 'reset'>,
    resetOnDestroy: boolean | undefined,
  ): void {
    if (resetOnDestroy !== true) {
      return;
    }

    const reset = suite.reset;
    if (typeof reset !== 'function') {
      return;
    }

    const suiteKey: object = suite;
    // `inject(DestroyRef)` first, ref count second: if the injection throws
    // (this `register` call happened outside an injection context), the
    // count must stay untouched -- otherwise it is permanently one too high
    // and no surviving registration's teardown ever brings it back to zero,
    // so the suite is never reset.
    const destroyRef = inject(DestroyRef);
    resetOnDestroyRefCounts.set(
      suiteKey,
      (resetOnDestroyRefCounts.get(suiteKey) ?? 0) + 1,
    );

    destroyRef.onDestroy(() => {
      const remaining = (resetOnDestroyRefCounts.get(suiteKey) ?? 1) - 1;
      if (remaining > 0) {
        // Another registration is still relying on this suite -- leave its
        // state (and run cache) alone.
        resetOnDestroyRefCounts.set(suiteKey, remaining);
        return;
      }

      resetOnDestroyRefCounts.delete(suiteKey);
      // Also clear the per-suite run cache so a subsequent mount re-executes
      // `run()` even when the field tree reference happens to be reused.
      invalidate(suiteKey);
      reset();
    });
  }

  /**
   * Registers the shared sync/async Vest validation pipeline for the given
   * field path.
   */
  function registerVestValidation<TValue, F extends string = string>(
    path: VestFieldPath<TValue>,
    suite: VestRunnableSuite<TValue, F>,
    validationOptions: VestValidationRegistrationOptions<TValue, F>,
  ): void {
    const resolveFocus = (ctx: FieldContext<TValue>): VestFieldExclusion<F> => {
      return validationOptions.only ? validationOptions.only(ctx) : undefined;
    };

    /**
     * Asks the run coordinator for this pass's run. The validator's bound
     * field tree doubles as the coordinator's cache key, which is what keeps
     * the sync (`validateTree`) and async (`validateAsync`) phases of one
     * registration -- and every other registration bound to the same tuple --
     * on a single `suite.run()` execution.
     */
    const requestRun = (
      ctx: FieldContext<TValue>,
    ): VestRunHandle<TValue, F> => {
      const focus = resolveFocus(ctx);
      return coordinator.request({
        suite,
        cacheKey: ctx.fieldTree,
        value: ctx.value(),
        ...(focus !== undefined && { focus }),
      });
    };

    /**
     * Memoizes the async `params` payload by the run's own `runResult`
     * object -- stable across every re-evaluation that resolves to the same
     * coordinator cache entry (a cache hit reuses `runResult` unchanged; see
     * `createVestRunCoordinator`'s `request`). Angular's `resource` compares
     * `params` by identity, so returning a freshly built object on every
     * evaluation reloaded the resource — re-awaiting an already-finished
     * (and possibly superseded) run — even when nothing about the run
     * itself had changed, e.g. a `hidden`/`disabled` toggle on the bound
     * path, or an `only` selector that reads an unrelated signal. Building
     * the payload at most once per run, and handing back that SAME object on
     * every later evaluation for the same run, keeps `resource`'s params
     * identity stable so it neither reloads nor re-awaits `settled()`.
     */
    const pendingPayloadByRun = new WeakMap<
      object,
      PendingVestValidationPayload
    >();
    const getStablePendingPayload = (
      runResult: VestResultLike<F> | PromiseLike<VestResultLike<F>>,
      build: () => PendingVestValidationPayload,
    ): PendingVestValidationPayload => {
      const key = runResult as object;
      const cached = pendingPayloadByRun.get(key);
      if (cached) {
        return cached;
      }

      const payload = build();
      pendingPayloadByRun.set(key, payload);
      return payload;
    };

    validateTree(path, (ctx) => {
      const { fieldTree } = ctx;
      const entry = requestRun(ctx);

      if (!entry.initialResult) {
        return [];
      }

      const syncOptions = shouldDeferVestWarnings(
        validationOptions,
        entry.initialResult,
      )
        ? {
            ...validationOptions,
            includeWarnings: false,
          }
        : validationOptions;

      return mapVestValidationResult(
        entry.initialResult,
        fieldTree,
        syncOptions,
      );
    });

    validateAsync(path, {
      params: (ctx) => {
        const entry = requestRun(ctx);

        // When `run()` returned a raw Promise (no sync SuiteResult), drive the
        // async pipeline directly from the thenable. Otherwise require the sync
        // result to report pending tests before scheduling async work.
        if (!entry.initialResult) {
          if (!isThenable(entry.runResult)) {
            return undefined;
          }

          return getStablePendingPayload(
            entry.runResult,
            () =>
              ({
                settled: entry.settled,
                initialSnapshot: { errors: [], warnings: [] },
              }) satisfies PendingVestValidationPayload,
          );
        }

        const initialResult = entry.initialResult;
        if (!initialResult.isPending()) {
          return undefined;
        }

        return getStablePendingPayload(entry.runResult, () => {
          // Match the sync `validateTree` pass above: while pending,
          // warnings are deferred (not yet surfaced), so the baseline used
          // to compute the async delta must NOT already count them as shown
          // — otherwise `onSuccess`'s `filterExistingVestEntries` would treat
          // them as already-emitted and drop them from the final, settled
          // result.
          const snapshotOptions = shouldDeferVestWarnings(
            validationOptions,
            initialResult,
          )
            ? {
                ...validationOptions,
                includeWarnings: false,
              }
            : validationOptions;

          return {
            settled: entry.settled,
            initialSnapshot: createVestValidationSnapshot(
              initialResult,
              snapshotOptions,
            ),
          } satisfies PendingVestValidationPayload;
        });
      },
      factory: (pendingValidation) => {
        return resource({
          params: pendingValidation,
          loader: async ({ params }) => {
            // The coordinator owns the settlement strategy (bus-event race
            // for an immediate run, direct await for a deferred one) -- this
            // layer only awaits the handle it was given.
            const result = await params.settled();
            if (!isVestResultLike(result)) {
              // Throw so this lands in the validator's `onError` handler below,
              // which already encodes the right policy: blocking validators
              // synthesize `vest:internal-error`, warning-only ones log and
              // skip. Returning `undefined` here used to silently report
              // valid (no result -> no errors), which was the worst outcome:
              // the form would submit with broken validation and zero signal.
              throw new Error(
                '[ngx-signal-forms] Vest async run resolved with a payload that does ' +
                  'not match the expected result shape. Check that the suite returns ' +
                  'a Vest `SuiteResult` (the default `run()` return value).',
              );
            }

            return {
              result,
              initialSnapshot: params.initialSnapshot,
            } satisfies ResolvedVestValidationPayload;
          },
        });
      },
      onSuccess: (pendingResult, ctx) => {
        return mapVestValidationResult(
          pendingResult.result,
          ctx.fieldTree,
          validationOptions,
          pendingResult.initialSnapshot,
        );
      },
      // Surface async crashes instead of silently reporting "no errors".
      // A thrown `enforce`, a broken async predicate, or a rejected Promise
      // from the suite would otherwise cause the field to report valid with
      // no diagnostic. Policy:
      //   - blocking validator (`validateVest`, `includeErrors: true`):
      //     synthesize a `vest:internal-error` so the form stays invalid
      //     and the misconfiguration is visible to tooling.
      //   - warning-only bridge (`validateVestWarnings`): log in dev but do
      //     not synthesize — warnings are best-effort guidance, and a
      //     broken warning suite should not flip a field into an error
      //     state when blocking validation elsewhere is healthy.
      onError: (error, { fieldTree }) => {
        if (isDevMode()) {
          // oxlint-disable-next-line no-console -- dev-mode misconfiguration signal
          console.error(
            '[ngx-signal-forms] Vest async validation failed. Check the suite implementation for thrown errors, misconfigured `enforce`, or rejected async predicates.',
            error,
          );
        }
        if (!validationOptions.includeErrors) {
          return [];
        }
        const message =
          error instanceof Error
            ? error.message
            : 'Vest async validation crashed.';
        return [
          {
            kind: `${VEST_ERROR_KIND_PREFIX}internal-error`,
            message,
            fieldTree,
          } satisfies ValidationError.WithFieldTree,
        ];
      },
    });
  }

  return { register, runVestSuite, invalidate };
}

/**
 * The shared {@link VestSuiteAdapter} instance used by the built-in
 * `validateVest` / `validateVestWarnings` entry points. Exposed so advanced
 * consumers can run a suite through {@link VestSuiteAdapter.runVestSuite} and
 * reuse the SAME cached execution that the built-in validators consume.
 *
 * @example
 * ```typescript
 * import { signal } from '@angular/core';
 * import { form } from '@angular/forms/signals';
 * import { create, enforce, test } from 'vest';
 * import { sharedVestAdapter } from '@ngx-signal-forms/toolkit/vest';
 *
 * const contactSuite = create((data: { email: string }) => {
 *   test('email', 'Email is required', () => {
 *     enforce(data.email).isNotBlank();
 *   });
 * });
 *
 * const contactForm = form(signal({ email: '' }));
 *
 * const result = sharedVestAdapter.runVestSuite({
 *   suite: contactSuite,
 *   fieldTree: contactForm,
 *   value: contactForm().value(),
 * });
 * ```
 */
export const sharedVestAdapter: VestSuiteAdapter = createVestAdapter();

/* oxlint-enable @typescript-eslint/prefer-readonly-parameter-types */
