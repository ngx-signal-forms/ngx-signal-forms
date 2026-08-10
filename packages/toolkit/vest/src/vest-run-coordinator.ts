import type { SuiteResult } from 'vest';

/* oxlint-disable @typescript-eslint/prefer-readonly-parameter-types -- The coordinator drives real Vest suite objects and Vest's own field-exclusion arrays, neither of which the `vest` package models as readonly. */

/**
 * Vest 6.3.2's real field-exclusion argument, mirrored locally because the
 * public `vest` package entrypoint exports the `only()` *hook function* but
 * not the `FieldExclusion<F>` type it (and `Suite.only()`) accept — that type
 * lives in `vest-utils`, a transitive dependency this package does not
 * declare directly.
 *
 * Matches Vest's real shape: `FieldExclusion<F> = Maybe<OneOrMoreOf<F>>` (a
 * field name, a list of field names, or `undefined` for "no exclusion —
 * everything runs"), plus the `false` variant Vest's `only()` hook also
 * accepts to focus on nothing. `readonly F[]` (rather than `F[]`) admits
 * readonly arrays without a cast at the call site.
 */
export type VestFieldExclusion<F extends string = string> =
  | F
  | readonly F[]
  | undefined
  | false;

/**
 * Whole-suite failure map returned by Vest selector APIs such as
 * `result.getErrors()` and `result.getWarnings()`.
 *
 * Exported so `./vest-adapter` — the other module that talks about Vest
 * selector shapes — imports this one definition instead of re-declaring an
 * identical local copy.
 */
export type VestFailureMessages = Readonly<Record<string, readonly string[]>>;

/**
 * Field-scoped failure list returned by Vest selector APIs such as
 * `result.getErrors('fieldName')`.
 *
 * Exported for the same reason as {@link VestFailureMessages}.
 */
export type VestFieldMessages = readonly string[];

/**
 * Minimal subset of Vest's public result API required by the adapter.
 *
 * The overloads intentionally mirror Vest's real `getErrors`/`getWarnings`
 * selector signatures more precisely than a plain `Pick<SuiteResult, ...>`.
 * The adapter's OWN internal helpers only ever call the zero-argument,
 * whole-suite overload — every internal call site passes no field name (see
 * `toVestValidationEntries` in `./vest-adapter`, verified against
 * vest@6.3.2). The field-scoped `(fieldName: F)` overload exists so that
 * `RunVestSuiteResult.runResult`/`initialResult`, which this type also backs,
 * stay a faithful, typed mirror of Vest's public result object for consumers
 * calling `runVestSuite(...)` directly.
 *
 * `F` mirrors {@link VestOnlyFieldSelector}'s field-name union and defaults
 * to `string`, so the field-scoped overloads narrow to a typed suite's
 * `fields` union without affecting untyped suites.
 */
export interface VestResultLike<F extends string = string> extends Pick<
  SuiteResult,
  'isPending'
> {
  readonly getErrors: {
    (): VestFailureMessages;
    (fieldName: F): VestFieldMessages;
  };
  readonly getWarnings: {
    (): VestFailureMessages;
    (fieldName: F): VestFieldMessages;
  };
}

/**
 * Narrow runtime contract used by the adapter. The local type preserves the
 * documented Promise-like behavior of async `run()` results without requiring
 * the full generic `Suite` surface in consumers.
 *
 * `F` is the suite's own Vest field-name union, defaulting to `string` so an
 * untyped `create(…)` suite (no `create<{ fields: … }>` / schema) keeps
 * accepting any field name unchanged. A typed suite's `F` flows through
 * {@link only} and {@link get}'s `VestResultLike<F>` return, which is what
 * lets `VestOnlyFieldSelector`'s return type narrow at the call site without
 * the caller writing an explicit type argument — `F` is inferred from the
 * `suite` value itself. See ADR-0008 and issue #292.
 */
export interface VestRunnableSuite<TValue, F extends string = string> {
  /**
   * Declared as a readonly function property (not method shorthand) so its
   * parameter is contravariant under `strictFunctionTypes` — method
   * parameters stay bivariant regardless of that flag, which is what
   * previously let a suite typed for one value (e.g. the whole model) be
   * assigned where a suite for a narrower value (e.g. a single field) was
   * expected. See ADR-0008.
   *
   * `fieldName` is deliberately `string` (not `string | string[]`, and not
   * {@link VestFieldExclusion}): a real Vest suite's own `run()` signature is
   * derived from its callback's second parameter, which the documented
   * idiom types as plain `field?: string` (`create((data, field?: string) =>
   * {...})`). Contravariance means widening this beyond what real suites
   * declare would make an ordinary `create()` suite fail assignment here —
   * the same reasoning as {@link only}'s narrower-than-{@link
   * VestFieldExclusion} parameter type. Multi-field and `false` focus both
   * go through `only` instead — see {@link executeVestRun}. The returned
   * result's `getErrors`/`getWarnings` still narrow to `F` — only the focus
   * argument stays `string` here, not the result shape.
   */
  readonly run: (
    value: TValue,
    fieldName?: string,
  ) => VestResultLike<F> | PromiseLike<VestResultLike<F>>;
  reset?: () => void;
  /**
   * Declared as a readonly function property for the same contravariance
   * reason as {@link run}.
   *
   * Deliberately narrower than {@link VestFieldExclusion} (which the
   * public-facing `VestOnlyFieldSelector` and `RunVestSuiteParams.focus` DO
   * use): Vest 6.3.2's real `Suite.only()` method itself only accepts
   * `FieldExclusion<F>` (a field name, a list of field names, or
   * `undefined`) — no `false`, no readonly arrays. Widening this member's
   * parameter type to match {@link VestFieldExclusion} would make a real,
   * unwrapped `create()` suite (whose own `only` is that narrower type) fail
   * structural assignment to this interface, breaking the common case this
   * whole contract exists to describe. The coordinator narrows a wider
   * `VestFieldExclusion` value down to this shape before ever calling
   * `suite.only(...)` — see {@link executeVestRun}. `field` narrows from
   * `string | string[]` to `F | F[]` — matching Vest's real `Suite.only()` —
   * so a mistyped focus name is a compile error at the point the coordinator
   * calls it, not just at the caller-facing `VestOnlyFieldSelector`.
   */
  readonly only?: (field: F | F[]) => Pick<VestRunnableSuite<TValue, F>, 'run'>;
  /**
   * Optional Vest bus subscription (`suite.subscribe`). Used alongside {@link
   * get} to recover from a superseded run — see
   * {@link awaitVestRunSettlement}. Suites created via Vest's `create()`
   * expose this; hand-rolled suite shapes may omit it.
   */
  subscribe?: (
    event: 'ALL_RUNNING_TESTS_FINISHED',
    callback: () => void,
  ) => () => void;
  /**
   * Optional synchronous accessor for the suite's current accumulated result
   * (`suite.get`). Used alongside {@link subscribe} to recover from a
   * superseded run — see {@link awaitVestRunSettlement}.
   */
  get?: () => VestResultLike<F>;
}

/**
 * The exact slice of {@link VestRunnableSuite} the run coordinator drives:
 * it starts runs (`run` / `only`) and observes settlement (`subscribe` /
 * `get`). It never resets a suite — that is the registration layer's
 * `resetOnDestroy` concern.
 *
 * `subscribe` / `get` are optional on purpose. Suites created via Vest's
 * `create()` expose them and get the full guarantees (contention avoidance,
 * FIFO queueing, superseded-resolver recovery); a hand-rolled suite that
 * omits them degrades to best-effort behaviour driven solely by the value
 * `run()` returns — see {@link waitForSuiteIdle} and
 * {@link awaitVestRunSettlement}.
 */
export type VestCoordinatedSuite<TValue, F extends string = string> = Pick<
  VestRunnableSuite<TValue, F>,
  'run' | 'only' | 'subscribe' | 'get'
>;

/**
 * Identity a coordinated run is cached under, *within* a single suite.
 *
 * Deliberately a bare object reference rather than
 * `ReadonlyFieldTree<unknown>`: the coordinator never reads the key, it only
 * compares it by identity and uses it as a `WeakMap` key. Keeping it opaque
 * is what removes the `unknown`-typed field-tree casts the cache used to
 * need, and it lets a spec drive the coordinator with a plain `{}` instead of
 * a rendered Angular form.
 *
 * The built-in registration path passes the validator's bound
 * `ReadonlyFieldTree`, so caching and contention detection keep exactly the
 * per-(suite, field tree) semantics they always had.
 */
export type VestRunCacheKey = object;

/**
 * One request for a coordinated Vest run — the `(suite, cache key, value,
 * focus)` tuple the cache is keyed and gated on.
 */
export interface VestRunRequest<TValue, F extends string = string> {
  readonly suite: VestCoordinatedSuite<TValue, F>;
  readonly cacheKey: VestRunCacheKey;
  readonly value: TValue;
  readonly focus?: VestFieldExclusion<F>;
}

/**
 * Handle on a coordinated Vest run, returned by
 * {@link VestRunCoordinator.request}.
 */
export interface VestRunHandle<TValue, F extends string = string> {
  readonly value: TValue;
  /**
   * The canonical cache key derived from the requested `focus` — a field
   * name, a NUL-joined field-name list, or `undefined` for a whole-suite run.
   */
  readonly focus: string | undefined;
  /** The raw value `suite.run(...)` returned (or the deferred run's promise). */
  readonly runResult: VestResultLike<F> | PromiseLike<VestResultLike<F>>;
  /**
   * The synchronous `SuiteResult`, when this run produced one. `undefined`
   * when `run()` returned a bare thenable, and always `undefined` for a
   * {@link deferred} run (which has not called `suite.run()` yet).
   */
  readonly initialResult: VestResultLike<F> | undefined;
  /**
   * `true` when this run was queued behind another field tree's pending run
   * on the SAME suite instead of starting immediately — see
   * {@link isSuiteContestedByOtherTree}.
   */
  readonly deferred: boolean;
  /**
   * `true` when this request reused a previously cached execution for an
   * identical `(suite, cache key, value, focus)` tuple.
   */
  readonly fromCache: boolean;
  /**
   * Resolves once this run's outcome is observable, recovering from a
   * superseded Vest resolver where the suite makes that possible — see
   * {@link awaitVestRunSettlement}. Lazy on purpose: subscribing to the
   * suite bus costs nothing until a caller actually needs to await.
   */
  readonly settled: () => PromiseLike<unknown>;
}

/**
 * The Vest run coordinator: the cache, contention detection, FIFO queue, and
 * settlement machinery that lets several validators (and both validation
 * phases of one validator) share exactly one `suite.run()` execution without
 * two field trees ever overlapping on one suite instance.
 *
 * Deliberately Angular-free. It knows about suites, opaque cache keys,
 * values, and focus — nothing about field trees, validation errors, or
 * injection contexts. That is what makes its guarantees assertable without a
 * `TestBed` or a rendered component.
 */
export interface VestRunCoordinator {
  /**
   * Request a run for a `(suite, cache key, value, focus)` tuple. Returns the
   * cached run when that exact tuple is already held, and otherwise starts
   * (or, when the suite is contested, queues) a fresh one.
   */
  request<TValue, F extends string = string>(
    request: VestRunRequest<TValue, F>,
  ): VestRunHandle<TValue, F>;

  /**
   * Drop the run cache held for a suite, so the next identical
   * `(suite, cache key, value, focus)` tuple executes a fresh run.
   *
   * Deliberately leaves the contention bookkeeping and the queue tail alone.
   * A pending marker is not garbage the caller can identify as stale: the run
   * behind it can still be in flight, and dropping the marker would let the
   * next request overlap that run — the exact hazard the bookkeeping exists to
   * prevent. Markers retire on their own when their run settles (see
   * `trackPendingVestRun`), and the queue tail deletes itself once it drains.
   */
  invalidate(suite: object): void;
}

/**
 * Cached Vest run keyed by suite instance and {@link VestRunCacheKey} so sync
 * and async validation can share a single suite execution.
 *
 * Deliberately NOT parameterized by the suite's field-name union `F` (see
 * {@link VestRunnableSuite}): the underlying `WeakMap` is shared across every
 * run the coordinator ever sees, each potentially carrying a different `F`.
 * `runResult` is widened to the string-keyed {@link VestResultLike} when an
 * entry is created (see the cast in {@link createVestRunCoordinator}'s
 * `request`) — safe because every internal reader calls
 * `getErrors()`/`getWarnings()` with zero arguments only, and reading the
 * entry back out at a narrower `F` is free (a `string`-keyed selector
 * accepts an `F`-keyed call).
 */
interface VestRunCacheEntry<TValue> {
  readonly value: TValue;
  readonly focus: string | undefined;
  readonly runResult: VestResultLike | PromiseLike<VestResultLike>;
  readonly initialResult: VestResultLike | undefined;
  /**
   * `true` when this run was deferred via `deferVestRunUntilIdle` because
   * another cache key had a concurrently pending run against the SAME suite
   * instance when this one was requested — see
   * {@link isSuiteContestedByOtherTree}.
   *
   * This is NOT the same question as "is this run currently pending" —
   * it marks HOW the run was scheduled, for the lifetime of this cache entry,
   * so settlement knows to await `runResult` directly rather than racing it
   * against the suite-wide `ALL_RUNNING_TESTS_FINISHED` bus event (see
   * {@link createVestRunHandle}). That race is what
   * {@link awaitVestRunSettlement} uses to recover a SUPERSEDED run's
   * promise, but `runResult` here is a plain `Promise` that does not even
   * call `suite.run()` until the suite is idle — racing it against the
   * CURRENT bus event (fired by whichever OTHER run made the suite idle)
   * would resolve with `suite.get()`'s state from BEFORE this run started,
   * not this run's own outcome.
   */
  readonly deferred: boolean;
}

/**
 * Strongly typed per-suite cache used to share a single Vest run between the
 * sync and async Angular validation phases.
 */
type VestRunCache = WeakMap<VestRunCacheKey, VestRunCacheEntry<unknown>>;

/**
 * Internal composite-key separator. A NUL code point can never appear in a Vest
 * field path, message, or focus name, so it composes collision-free keys for the
 * baseline dedupe map and the focus cache key. Declared with an explicit
 * `\u0000` escape in a named constant (rather than a literal control character
 * embedded in template strings) so the separator stays visible and
 * tooling/formatter/diff-safe.
 */
export const VEST_KEY_SEPARATOR = '\u0000';

/**
 * Internal sentinel run-cache focus key for a "focus nothing" run —
 * {@link isVestFocusNothing}'s `true` case (the toolkit's own `false`
 * sentinel, or an empty field-name list) — distinguishing it from a `focus
 * === undefined` ("whole suite") run in the cache-hit comparison. Composed
 * so it can never collide with a real, string- or array-derived focus key.
 * Both `false` and `[]` share this ONE key (rather than each computing their
 * own) because they are the SAME semantic request — see
 * {@link isVestFocusNothing}'s doc comment for why a bare `focus.join(...)`
 * on `[]` is unsafe (it collides with a field literally named `''`).
 */
const VEST_FOCUS_NOTHING_SENTINEL = `${VEST_KEY_SEPARATOR}nothing${VEST_KEY_SEPARATOR}`;

/**
 * Runtime guard for the subset of Vest's public result object that the adapter
 * consumes.
 */
export function isVestResultLike(value: unknown): value is VestResultLike {
  return (
    value !== null &&
    (typeof value === 'object' || typeof value === 'function') &&
    typeof Reflect.get(value, 'getErrors') === 'function' &&
    typeof Reflect.get(value, 'getWarnings') === 'function'
  );
}

/**
 * Reports whether `focus` is a deliberate "run nothing" selection — the
 * toolkit's own `false` sentinel, or an empty field-name list.
 *
 * Vest cannot express this through either `suite.only()` or the legacy
 * `suite.run(value, fieldName)` form. Empirically verified against
 * `vest@6.3.2`: `suite.only([])`, `suite.only(false)`, and `suite.only('')`
 * all run the WHOLE suite — Vest treats an empty/falsy exclusion list as "no
 * filter", identically to calling `suite.run(value)` with no focus at all —
 * so there is no reliable, documented way to map "focus nothing" onto
 * `suite.only()`. (The one construction that DOES run zero tests —
 * `suite.only(['a-field-name-that-cannot-exist'])` — depends on the adapter
 * fabricating a name guaranteed never to collide with a real Vest field,
 * which nothing in Vest's public contract promises stays true.) Rather than
 * silently doing the OPPOSITE of what the caller asked for,
 * {@link executeVestRun} throws when this is `true`.
 */
function isVestFocusNothing(focus: VestFieldExclusion): focus is false {
  // Declared as `focus is false` (rather than plain `boolean`) purely so
  // callers get a narrowed `focus` afterward — this function is used both
  // where that matters (`executeVestRun`, which throws in the `true` branch
  // without touching `focus` again) and where it doesn't (the cache-key
  // ternary below). An empty array satisfying this predicate is NOT
  // literally `false`, but every caller either throws or discards `focus`
  // in that branch, so the imprecision is harmless.
  return focus === false || (Array.isArray(focus) && focus.length === 0);
}

/**
 * Derives the canonical, collision-free cache key for a requested `focus`.
 */
function toVestFocusKey(focus: VestFieldExclusion): string | undefined {
  if (isVestFocusNothing(focus)) {
    return VEST_FOCUS_NOTHING_SENTINEL;
  }

  if (typeof focus === 'string' || focus === undefined) {
    return focus;
  }

  return focus.join(VEST_KEY_SEPARATOR);
}

/**
 * Executes `suite.run()` using the appropriate focused-run targeting.
 *
 * Prefers the Vest 6 canonical `suite.only(field).run(value)` form — that
 * matches the upgrade-guide idiom where focus logic is kept out of the suite
 * body. Falls back to the legacy `suite.run(value, fieldName)` form only when
 * the suite does not expose `only` (e.g. consumer-wrapped suites that
 * surface a `run`-only adapter).
 */
function executeVestRun<TValue, F extends string = string>(
  suite: Pick<VestCoordinatedSuite<TValue, F>, 'run' | 'only'>,
  value: TValue,
  focus: VestFieldExclusion<F>,
): VestResultLike<F> | PromiseLike<VestResultLike<F>> {
  if (focus === undefined) {
    return suite.run(value);
  }

  if (isVestFocusNothing(focus)) {
    throw new Error(
      '[ngx-signal-forms] A Vest `only` selector returned `false` (or an ' +
        'empty field-name list), requesting a "focus nothing" run. Vest has ' +
        'no reliable way to express that through `suite.only()` or ' +
        '`suite.run(value, fieldName)` — both treat an empty selection as ' +
        '"run the whole suite", the opposite of what was requested. Return ' +
        'a field name, a list of field names, or `undefined` for a ' +
        'whole-suite run.',
    );
  }

  if (typeof suite.only === 'function') {
    // `suite.only` (see {@link VestRunnableSuite.only}'s doc comment) only
    // accepts `F | F[]` — no readonly arrays. Clone a readonly array into a
    // mutable one.
    const focusArg: F | F[] = typeof focus === 'string' ? focus : [...focus];
    const focused = suite.only(focusArg);
    return focused.run(value);
  }

  // No `only` shorthand: fall back to `suite.run(value, fieldName)`, whose
  // second argument (see {@link VestRunnableSuite.run}'s doc comment) is a
  // single `string` — this legacy path predates multi-field focus, which is
  // expressed through `only` above and collapses to the first field name.
  return suite.run(value, typeof focus === 'string' ? focus : focus[0]);
}

/**
 * Resolves once `suite` has no test currently in flight.
 *
 * Vest suites created via `create()` are single-flight: calling ANY method
 * that re-executes the suite's callback (`run()`, `only().run()`, and even
 * `runStatic()` — verified empirically, since `runStatic()`'s persisted
 * binding re-enters the ORIGINAL suite's runtime context to invoke its
 * throwaway instance) while a PREVIOUS run on the SAME suite instance is
 * still pending corrupts that previous run's resolver, per
 * {@link awaitVestRunSettlement}'s doc comment. There is no supported way to
 * safely touch a Vest suite instance while it has an in-flight run.
 *
 * When the suite exposes `subscribe`/`get` (true for suites created via
 * Vest's `create()`), this checks `get().isPending()` and, if so, resolves on
 * the next suite-wide `ALL_RUNNING_TESTS_FINISHED` bus event — a pure
 * readiness signal, independent of which specific run's resolver ends up
 * firing it. Suites without `subscribe`/`get` resolve immediately (best
 * effort; contention avoidance is only guaranteed for real Vest suites).
 */
function waitForSuiteIdle<TValue, F extends string = string>(
  suite: Pick<VestCoordinatedSuite<TValue, F>, 'subscribe' | 'get'>,
): PromiseLike<void> {
  if (
    typeof suite.subscribe !== 'function' ||
    typeof suite.get !== 'function'
  ) {
    return Promise.resolve();
  }

  const subscribe = suite.subscribe;
  if (!suite.get().isPending()) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    // Defensive only: real Vest 6.3.2 suites never invoke the `subscribe`
    // callback synchronously (empirically verified), so this branch does not
    // protect against documented Vest behavior. It guards a hand-rolled
    // suite shape that DOES fire synchronously — capture `unsubscribe` as
    // `let` so such a callback doesn't read it before assignment (same TDZ
    // hazard `awaitVestRunSettlement` guards against below).
    let fired = false;
    let unsubscribe: (() => void) | undefined;
    unsubscribe = subscribe('ALL_RUNNING_TESTS_FINISHED', () => {
      fired = true;
      unsubscribe?.();
      resolve();
    });

    // If the callback above fired synchronously (during the `subscribe()`
    // call itself — not possible with a real Vest 6.3.2 suite, only with a
    // hand-rolled one), its own `unsubscribe?.()` ran before `unsubscribe`
    // had been assigned and was therefore a no-op — leaving this listener
    // subscribed for the suite's lifetime and re-firing on every LATER idle
    // event. Clean up here instead, now that we hold a reference to it. Same
    // fired-synchronously guard `awaitVestRunSettlement` uses below.
    // oxlint-disable-next-line @typescript-eslint/no-unnecessary-condition -- `fired` may be flipped synchronously by the subscribe callback above; static analysis cannot model that closure write.
    if (fired) {
      unsubscribe();
    }
  });
}

/**
 * Runs `suite` for `(value, focus)` after the previous queued run has settled
 * and once the suite is idle. Calls `onRunStarted` synchronously after this
 * contender's own `suite.run()` begins, so its queue tail cannot be released
 * by an earlier contender's idle event.
 *
 * This trades a small amount of latency (the deferred run genuinely waits for
 * the other cache key's async work to finish before its own even starts) for
 * full correctness, using only the same `run()` / `subscribe()` / `get()`
 * surface every other code path already relies on — no suite-internal API
 * beyond what {@link awaitVestRunSettlement} already uses.
 */
async function deferVestRunUntilIdle<TValue, F extends string = string>(
  suite: VestCoordinatedSuite<TValue, F>,
  value: TValue,
  focus: VestFieldExclusion<F>,
  previousRun: PromiseLike<void>,
  onRunStarted: (
    runResult: VestResultLike<F> | PromiseLike<VestResultLike<F>>,
  ) => void,
): Promise<VestResultLike<F>> {
  await previousRun;
  await waitForSuiteIdle(suite);
  const runResult = executeVestRun(suite, value, focus);
  onRunStarted(runResult);
  return runResult;
}

/**
 * Awaits a Vest run's settlement, recovering from a superseded resolver.
 *
 * Vest 6's `suite.run()` promise resolves via a single resolver tracked per
 * suite root isolate: `ALL_RUNNING_TESTS_FINISHED` fires `root.data.resolver()`
 * once, and any LATER `suite.run()` call on the SAME suite instance replaces
 * that resolver before the earlier call's promise ever settles. Two
 * registrations of the same suite with different `only` focus (e.g. two
 * root-bound validators each focused on a different field) each call `run()`
 * independently, so the earlier one's promise can be superseded and never
 * settle — leaving that field `pending()` forever.
 *
 * When the suite exposes `subscribe`/`get` (true for suites created via
 * Vest's `create()`), race the run's own promise against the suite-wide
 * `ALL_RUNNING_TESTS_FINISHED` bus event, which only fires once ALL pending
 * tests — including this run's — have finished, regardless of which `run()`
 * call's resolver ends up firing it. On that event, `suite.get()` returns the
 * suite's current accumulated result, which by then reflects this run's
 * outcome. Suites without `subscribe`/`get` fall back to the original
 * (potentially superseded) promise unchanged.
 */
function awaitVestRunSettlement<TValue, F extends string = string>(
  runResult: VestResultLike<F> | PromiseLike<VestResultLike<F>>,
  suite: Pick<VestCoordinatedSuite<TValue, F>, 'subscribe' | 'get'>,
): PromiseLike<unknown> {
  if (
    typeof suite.subscribe !== 'function' ||
    typeof suite.get !== 'function'
  ) {
    return Promise.resolve(runResult);
  }
  const subscribe = suite.subscribe;
  const get = suite.get;

  return new Promise((resolve, reject) => {
    let settled = false;
    // Declared as `let` (not `const subscribe(...)` return) and guarded with
    // `?.()`: defensive only, since real Vest 6.3.2 suites never invoke the
    // `subscribe` callback synchronously (empirically verified) — but a
    // hand-rolled suite that DOES (e.g. because it reports all tests already
    // finished before this call) would otherwise try to read `unsubscribe`
    // before its initializer has run — a TDZ `ReferenceError` that would
    // leave this promise unsettled forever.
    let unsubscribe: (() => void) | undefined;

    const settle = (fn: (value: unknown) => void, value: unknown): void => {
      if (settled) {
        return;
      }
      settled = true;
      unsubscribe?.();
      fn(value);
    };

    Promise.resolve(runResult).then(
      (value) => {
        settle(resolve, value);
        return undefined;
      },
      (error: unknown) => {
        settle(reject, error);
        return undefined;
      },
    );

    unsubscribe = subscribe('ALL_RUNNING_TESTS_FINISHED', () => {
      settle(resolve, get());
    });

    // If the callback above fired synchronously (during the `subscribe()`
    // call itself — not possible with a real Vest 6.3.2 suite, only with a
    // hand-rolled one), `settle()` ran before `unsubscribe` was assigned, so
    // its `unsubscribe?.()` was a no-op. Clean up the now-stale subscription
    // here instead, now that we hold a reference to it.
    // oxlint-disable-next-line @typescript-eslint/no-unnecessary-condition -- `settled` may be flipped synchronously by the subscribe callback above; static analysis cannot model that closure write.
    if (settled) {
      unsubscribe();
    }
  });
}

/**
 * Resolves once a cached run's outcome is observable — the ONE settlement
 * strategy both the caller-facing handle and the internal pending-marker
 * bookkeeping use.
 *
 * A run that has already started gets {@link awaitVestRunSettlement}, which
 * races the run's own promise against the suite bus and therefore survives a
 * superseded resolver. Awaiting the raw promise instead is unsafe: a LATER
 * `run()` on the same suite — a focused run, for example, which is never
 * deferred — replaces the resolver, and the earlier promise then stays pending
 * forever.
 *
 * A DEFERRED run (see {@link deferVestRunUntilIdle}) is the one exception. It
 * has not called `suite.run()` yet, so racing it against the suite-wide
 * `ALL_RUNNING_TESTS_FINISHED` event would resolve with `suite.get()`'s state
 * from BEFORE this run started (whatever made the suite idle in the first
 * place), not this run's own outcome. Its plain `Promise` already resolves
 * correctly on its own once the deferred run completes, so await it directly.
 */
function awaitVestRunOutcome<TValue, F extends string = string>(
  suite: Pick<VestCoordinatedSuite<TValue, F>, 'subscribe' | 'get'>,
  runResult: VestResultLike<F> | PromiseLike<VestResultLike<F>>,
  deferred: boolean,
): PromiseLike<unknown> {
  return deferred
    ? Promise.resolve(runResult)
    : awaitVestRunSettlement(runResult, suite);
}

/**
 * Create a {@link VestRunCoordinator} backed by its own caches and queues.
 *
 * Every adapter instance owns exactly one coordinator, so two adapters never
 * share a cache — matching the pre-extraction closure-state semantics.
 */
export function createVestRunCoordinator(): VestRunCoordinator {
  const runCache = new WeakMap<object, VestRunCache>();
  // Tracks, per suite, which cache keys currently have a run PENDING against
  // it -- see `isSuiteContestedByOtherTree`. A plain (non-weak) Map is
  // required here (unlike `runCache`) because contention detection needs to
  // enumerate/count entries, which `WeakMap` cannot do. Entries are removed
  // as soon as their run settles (`trackPendingVestRun`), so this only ever
  // holds cache keys with a run genuinely in flight -- bounded, self-cleaning
  // bookkeeping, not a suite-lifetime membership list.
  const pendingKeysBySuite = new Map<
    object,
    Map<VestRunCacheKey, VestRunCacheEntry<unknown>>
  >();
  // The latest queued run for each suite. The first, uncontested run still
  // executes synchronously; its settlement is recorded here so subsequent
  // contenders wait for it. Every queued run replaces the tail before it
  // starts, making B and C serialize even when both were deferred behind A.
  const runQueueBySuite = new WeakMap<object, Promise<void>>();

  /**
   * Retrieves the per-suite validation cache, creating it on first access.
   */
  function getVestSuiteRunCache(suite: object): VestRunCache {
    const existingCache = runCache.get(suite);
    if (existingCache) {
      return existingCache;
    }

    const nextCache: VestRunCache = new WeakMap();
    runCache.set(suite, nextCache);
    return nextCache;
  }

  /**
   * Reports whether `suite` currently has a PENDING, UNFOCUSED (whole-suite)
   * run for some cache key OTHER than `cacheKey`.
   *
   * This is the precise condition under which Vest's shared, reconciled
   * isolate tree is at risk: the reconciler merges/cancels pending test nodes
   * from an in-flight run when a NEW `run()` call lands on the SAME suite
   * before the earlier one settles (see {@link awaitVestRunSettlement}'s doc
   * comment) -- if that overlap involves two DIFFERENT field trees, either
   * one's final result can end up reflecting a blend of both trees' data
   * (issue #214). When no OTHER cache key is currently pending, the shared
   * path is safe and preserves full Vest statefulness (memoization, retained
   * `warn()` state across runs, etc.) for the common single-tree-per-suite
   * case.
   *
   * Deliberately scoped to UNFOCUSED runs only (see the `focus === undefined`
   * guards at both call sites, {@link trackPendingVestRun} and this
   * function's caller): a suite backing several `only`-focused registrations
   * for DIFFERENT fields of the SAME overall form (each bound to its own
   * child `ReadonlyFieldTree`) is the documented, intentional
   * wave-3 (#174) pattern -- Vest's `only()` mode is SUPPOSED to retain other
   * fields' state on the one shared suite there, and that pattern already has
   * its own settlement recovery via `awaitVestRunSettlement`'s subscribe/get
   * race. It is indistinguishable from the issue #214 shape (same suite
   * object, different cache key) by key identity alone; `focus` is the one
   * signal the coordinator has that tells them apart -- two unrelated forms
   * sharing a suite have no reason to pass a focus field name, while the
   * multi-field-single-form pattern always does.
   */
  function isSuiteContestedByOtherKey(
    suiteKey: object,
    cacheKey: VestRunCacheKey,
  ): boolean {
    const pendingKeys = pendingKeysBySuite.get(suiteKey);
    if (!pendingKeys || pendingKeys.size === 0) {
      return false;
    }

    return pendingKeys.size > 1 || !pendingKeys.has(cacheKey);
  }

  /**
   * Records `cacheKey` as having a pending, UNFOCUSED run for `suiteKey`
   * when `entry`'s run has not yet settled, and removes it once the run
   * settles. No-op for a focused run -- see
   * {@link isSuiteContestedByOtherKey}'s doc comment for why focused runs
   * are excluded from contention tracking entirely.
   *
   * The removal is guarded by identity (`pendingKeys.get(cacheKey) ===
   * entry`) so a LATER run for the same cache key -- which replaces this
   * entry in the run cache before this one settles -- is never accidentally
   * un-tracked by this entry's own settlement callback.
   *
   * The removal hangs off {@link awaitVestRunOutcome}, NOT off the raw
   * `entry.runResult`. That raw promise is precisely the one a later
   * `suite.run()` can supersede so that it never settles at all -- and a
   * focused run is never deferred, so it can start (and supersede) while an
   * unfocused run is pending on the same suite. Untracking off it therefore
   * leaked the marker, the cache key and the cached result for the lifetime of
   * the suite, and pinned the suite as permanently contested for every other
   * cache key.
   */
  function trackPendingVestRun<TValue, F extends string = string>(
    suiteKey: object,
    suite: Pick<VestCoordinatedSuite<TValue, F>, 'subscribe' | 'get'>,
    cacheKey: VestRunCacheKey,
    entry: VestRunCacheEntry<unknown>,
    focus: VestFieldExclusion,
  ): void {
    if (focus !== undefined) {
      return;
    }

    const isPending = !entry.initialResult || entry.initialResult.isPending();
    if (!isPending) {
      return;
    }

    let pendingKeys = pendingKeysBySuite.get(suiteKey);
    if (!pendingKeys) {
      pendingKeys = new Map();
      pendingKeysBySuite.set(suiteKey, pendingKeys);
    }
    pendingKeys.set(cacheKey, entry);

    const untrack = (): void => {
      const currentPendingKeys = pendingKeysBySuite.get(suiteKey);
      if (!currentPendingKeys || currentPendingKeys.get(cacheKey) !== entry) {
        return;
      }

      currentPendingKeys.delete(cacheKey);
      if (currentPendingKeys.size === 0) {
        pendingKeysBySuite.delete(suiteKey);
      }
    };

    void awaitVestRunOutcome(suite, entry.runResult, entry.deferred).then(
      untrack,
      untrack,
    );
  }

  /**
   * Waits for a started run to leave the suite idle state. Vest 6's
   * `SuiteResult` is thenable, but a later run can supersede its resolver and
   * leave that thenable pending forever. The idle event is tied to the suite
   * lifecycle instead, so it is the reliable queue boundary for real Vest
   * suites. Hand-rolled suites retain the thenable-based best-effort fallback.
   */
  function waitForStartedVestRunTail<TValue, F extends string = string>(
    suite: Pick<VestCoordinatedSuite<TValue, F>, 'subscribe' | 'get'>,
    runResult: VestResultLike<F> | PromiseLike<VestResultLike<F>>,
  ): Promise<void> {
    const settleRunResult = (): Promise<void> => {
      return Promise.resolve(runResult).then(
        () => undefined,
        () => undefined,
      );
    };

    if (
      typeof suite.subscribe !== 'function' ||
      typeof suite.get !== 'function'
    ) {
      return settleRunResult();
    }

    return new Promise((resolve) => {
      // A rejected run must not hold the queue forever. Successful Vest 6
      // thenables are intentionally ignored here because they can be
      // superseded; the suite idle event settles the normal path.
      void Promise.resolve(runResult).then(
        () => undefined,
        () => {
          resolve();
          return undefined;
        },
      );
      void Promise.resolve(waitForSuiteIdle(suite)).then(resolve, resolve);
    });
  }

  /**
   * Extends the per-suite queue boundary with a pre-built tail. This must retain
   * an earlier reserved deferred boundary when an immediate focused run starts:
   * later whole-suite contenders must still wait for that reserved work.
   */
  function recordVestRunTail(suiteKey: object, settled: Promise<void>): void {
    const previousTail = runQueueBySuite.get(suiteKey) ?? Promise.resolve();
    // Absorb either tail's rejection so a failed run cannot strand later
    // contenders. `tail` represents the complete serialized boundary, not
    // merely the most recently started run.
    const tail = previousTail
      .then(
        () => settled,
        () => settled,
      )
      .then(
        () => undefined,
        () => undefined,
      );
    runQueueBySuite.set(suiteKey, tail);
    void tail.then(() => {
      if (runQueueBySuite.get(suiteKey) === tail) {
        runQueueBySuite.delete(suiteKey);
      }
      return undefined;
    });
  }

  /**
   * Records an immediately started run as the per-suite queue tail.
   */
  function recordVestRun<TValue, F extends string = string>(
    suiteKey: object,
    suite: Pick<VestCoordinatedSuite<TValue, F>, 'subscribe' | 'get'>,
    runResult: VestResultLike<F> | PromiseLike<VestResultLike<F>>,
  ): void {
    recordVestRunTail(suiteKey, waitForStartedVestRunTail(suite, runResult));
  }

  /**
   * Adds a contested run to the per-suite exclusive queue. The prior tail is
   * captured before this run is recorded as the new tail, so multiple callers
   * deferred behind one pending run start in FIFO order rather than together.
   */
  function enqueueVestRun<TValue, F extends string = string>(
    suiteKey: object,
    suite: VestCoordinatedSuite<TValue, F>,
    value: TValue,
    focus: VestFieldExclusion<F>,
  ): Promise<VestResultLike<F>> {
    const previousRun = runQueueBySuite.get(suiteKey) ?? Promise.resolve();
    // The `Promise` executor below runs synchronously, so `resolveTail` is
    // always assigned before this function returns — the definite-assignment
    // assertion documents that rather than working around a real gap.
    let resolveTail!: () => void;
    const tail = new Promise<void>((resolve) => {
      resolveTail = resolve;
    });
    // Reserve this slot before the contender begins. Its tail remains pending
    // until this contender has actually started and the suite subsequently
    // becomes idle, preserving FIFO ordering for every later contender.
    recordVestRunTail(suiteKey, tail);
    const runResult = deferVestRunUntilIdle(
      suite,
      value,
      focus,
      previousRun,
      (startedRunResult) => {
        void waitForStartedVestRunTail(suite, startedRunResult).then(
          resolveTail,
          resolveTail,
        );
      },
    );
    void runResult.then(
      () => undefined,
      () => {
        resolveTail();
        return undefined;
      },
    );
    return runResult;
  }

  /**
   * Builds the caller-facing handle for a cache entry, binding the lazy
   * settlement strategy to the suite that produced the run.
   */
  function createVestRunHandle<TValue, F extends string = string>(
    suite: VestCoordinatedSuite<TValue, F>,
    entry: VestRunCacheEntry<TValue>,
    fromCache: boolean,
  ): VestRunHandle<TValue, F> {
    return {
      value: entry.value,
      focus: entry.focus,
      runResult: entry.runResult,
      initialResult: entry.initialResult,
      deferred: entry.deferred,
      fromCache,
      settled: () =>
        awaitVestRunOutcome(suite, entry.runResult, entry.deferred),
    };
  }

  /**
   * Reuses an existing Vest run for the same suite, cache key, model
   * reference, and focus key; or executes the suite once and caches the result.
   *
   * When `suite.run()` returns a thenable directly (rather than the documented
   * synchronous `SuiteResult`), we capture `initialResult` as `undefined` and
   * rely on the async branch to drive completion from the promise. This guards
   * against consumer-wrapped suites that coerce `run()` into a Promise.
   *
   * Before executing a NEW run, checks whether `suite` currently has another
   * cache key's run pending (`isSuiteContestedByOtherKey`) -- i.e. the same
   * suite instance backs two concurrently-live field trees with overlapping
   * in-flight validation (issue #214). When contested, the run is deferred
   * until the suite is idle (`deferVestRunUntilIdle`) so it can never overlap
   * with -- and thus never observe or corrupt -- the other tree's in-flight
   * state; otherwise it runs against the suite's normal shared state
   * immediately, exactly as before.
   */
  function request<TValue, F extends string = string>(
    runRequest: VestRunRequest<TValue, F>,
  ): VestRunHandle<TValue, F> {
    const { suite, cacheKey, value, focus } = runRequest;
    const suiteKey: object = suite;
    const suiteCache = getVestSuiteRunCache(suiteKey);
    const cachedEntry = suiteCache.get(cacheKey);
    const focusKey = toVestFocusKey(focus);

    if (
      cachedEntry &&
      Object.is(cachedEntry.value, value) &&
      cachedEntry.focus === focusKey
    ) {
      return createVestRunHandle(
        suite,
        {
          value,
          focus: focusKey,
          runResult: cachedEntry.runResult,
          initialResult: cachedEntry.initialResult,
          deferred: cachedEntry.deferred,
        },
        true,
      );
    }

    const isContested =
      focus === undefined && isSuiteContestedByOtherKey(suiteKey, cacheKey);
    const runResult = isContested
      ? enqueueVestRun(suiteKey, suite, value, focus)
      : executeVestRun(suite, value, focus);
    if (!isContested) {
      recordVestRun(suiteKey, suite, runResult);
    }

    const nextEntry: VestRunCacheEntry<TValue> = {
      value,
      focus: focusKey,
      // `runResult` is typed `VestResultLike<F>` here (the suite's own
      // field-name union), but the shared run cache entry is intentionally
      // NOT parameterized by `F` — one `WeakMap` stores runs for every suite
      // this coordinator ever sees, each with its own, potentially
      // different, `F`. Every internal consumer of a cached `runResult` only
      // ever calls `getErrors()`/`getWarnings()` with ZERO arguments — the
      // whole-suite overload, unaffected by `F` — so widening to the shared,
      // string-keyed shape here is safe. Reading it back out at a narrower
      // `F` needs no cast, because a `string`-keyed selector already accepts
      // an `F`-keyed call. See {@link VestRunCacheEntry}.
      runResult: runResult as VestResultLike | PromiseLike<VestResultLike>,
      // Vest 6's `suite.run(...)` returns a dual-shaped object that is *both*
      // a synchronous `SuiteResult` (with `getErrors`/`isPending`) and a
      // thenable. Previously we gated `initialResult` with `!isThenable(...)`,
      // which would always be false for Vest 6 suites and forced every
      // validation run through the async pipeline — hiding sync errors until
      // the next microtask. Check the sync surface directly instead. A
      // deferred (contested) run's `runResult` is a plain `Promise` (not
      // Vest-result-like) until it actually starts, so it correctly falls
      // into the "no sync result yet" branch below regardless.
      initialResult: isVestResultLike(runResult) ? runResult : undefined,
      deferred: isContested,
    };

    suiteCache.set(cacheKey, nextEntry);
    trackPendingVestRun(suiteKey, suite, cacheKey, nextEntry, focus);
    return createVestRunHandle(suite, nextEntry, false);
  }

  function invalidate(suite: object): void {
    // The run cache only. Contention bookkeeping and the queue tail stay:
    // `invalidate` cannot tell a stale marker from a live one, and dropping a
    // LIVE marker would let the next request overlap a run that is genuinely
    // still in flight. Markers now retire on their own once their run settles
    // (see `trackPendingVestRun`), so there is no stale marker left to clean
    // up here.
    runCache.delete(suite);
  }

  return { request, invalidate };
}

/* oxlint-enable @typescript-eslint/prefer-readonly-parameter-types */
