import { FieldContext, ReadonlyFieldTree, SchemaPath, SchemaPathTree, ValidationError } from "@angular/forms/signals";
import { SuiteResult } from "vest";
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
type VestFieldExclusion<F extends string = string> = F | readonly F[] | undefined | false;
/**
 * Whole-suite failure map returned by Vest selector APIs such as
 * `result.getErrors()` and `result.getWarnings()`.
 *
 * Exported so `./vest-result-mapper` — the other module that talks about
 * Vest selector shapes — imports this one definition instead of
 * re-declaring an identical local copy.
 */
type VestFailureMessages = Readonly<Record<string, readonly string[]>>;
/**
 * Field-scoped failure list returned by Vest selector APIs such as
 * `result.getErrors('fieldName')`.
 *
 * Exported for the same reason as {@link VestFailureMessages}.
 */
type VestFieldMessages = readonly string[];
/**
 * Minimal subset of Vest's public result API required by the adapter.
 *
 * The overloads intentionally mirror Vest's real `getErrors`/`getWarnings`
 * selector signatures more precisely than a plain `Pick<SuiteResult, ...>`.
 * The adapter's OWN internal helpers only ever call the zero-argument,
 * whole-suite overload — every internal call site passes no field name (see
 * `toVestValidationEntries` in `./vest-result-mapper`, verified against
 * vest@6.3.2). The field-scoped `(fieldName: F)` overload exists so that
 * `RunVestSuiteResult.runResult`/`initialResult`, which this type also backs,
 * stay a faithful, typed mirror of Vest's public result object for consumers
 * calling `runVestSuite(...)` directly.
 *
 * `F` mirrors {@link VestOnlyFieldSelector}'s field-name union and defaults
 * to `string`, so the field-scoped overloads narrow to a typed suite's
 * `fields` union without affecting untyped suites.
 */
interface VestResultLike<F extends string = string> extends Pick<SuiteResult, 'isPending'> {
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
interface VestRunnableSuite<TValue, F extends string = string> {
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
  readonly run: (value: TValue, fieldName?: string) => VestResultLike<F> | PromiseLike<VestResultLike<F>>;
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
  subscribe?: (event: 'ALL_RUNNING_TESTS_FINISHED', callback: () => void) => () => void;
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
type VestCoordinatedSuite<TValue, F extends string = string> = Pick<VestRunnableSuite<TValue, F>, 'get' | 'only' | 'run' | 'subscribe'>;
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
type VestRunCacheKey = object;
/**
 * One request for a coordinated Vest run — the `(suite, cache key, value,
 * focus)` tuple the cache is keyed and gated on.
 */
interface VestRunRequest<TValue, F extends string = string> {
  readonly suite: VestCoordinatedSuite<TValue, F>;
  readonly cacheKey: VestRunCacheKey;
  readonly value: TValue;
  readonly focus?: VestFieldExclusion<F>;
}
/**
 * Handle on a coordinated Vest run, returned by
 * {@link VestRunCoordinator.request}.
 */
interface VestRunHandle<TValue, F extends string = string> {
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
interface VestRunCoordinator {
  /**
   * Request a run for a `(suite, cache key, value, focus)` tuple. Returns the
   * cached run when that exact tuple is already held, and otherwise starts
   * (or, when the suite is contested, queues) a fresh one.
   *
   * **Must be idempotent for a repeated tuple** — calling `request()` twice
   * with the identical `(suite, cache key, value, focus)` tuple must never
   * start a second `suite.run()`. This is not just a caching nicety: the
   * built-in registration path (`vest-adapter.ts`'s `registerVestValidation`)
   * calls `request()` from INSIDE the reactive computeds `validateTree` and
   * `validateAsync` register, which Angular's change-detection machinery can
   * re-run for reasons unrelated to this request (an unrelated signal read in
   * the same computed changing, a `markForCheck()`/re-evaluation pass, …) without
   * the tuple itself changing. A non-idempotent `request()` would re-execute
   * `suite.run()` — and the coordinator's other side effects (contention
   * bookkeeping, the FIFO queue) — on every such re-run, not just on a real
   * value/focus change.
   */
  request<TValue, F extends string = string>(request: VestRunRequest<TValue, F>): VestRunHandle<TValue, F>;
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
 * Internal composite-key separator. A NUL code point can never appear in a Vest
 * field path, message, or focus name, so it composes collision-free keys for the
 * baseline dedupe map and the focus cache key. Declared with an explicit
 * `\u0000` escape in a named constant (rather than a literal control character
 * embedded in template strings) so the separator stays visible and
 * tooling/formatter/diff-safe.
 */
declare const VEST_KEY_SEPARATOR = "\0";
/**
 * Runtime guard for the subset of Vest's public result object that the adapter
 * consumes.
 *
 * Checks all three members {@link VestResultLike} requires — `getErrors`,
 * `getWarnings`, AND `isPending` — are present and callable. `isPending` is
 * a METHOD on Vest's `SuiteResult` (not a boolean field), so it is checked
 * the same way as the other two. Omitting this check let a consumer-supplied
 * object with only `getErrors`/`getWarnings` pass the guard and then crash
 * later when the adapter invoked `.isPending()` on it (see the crash sites at
 * `suite.get().isPending()` and `entry.initialResult.isPending()` in this
 * file).
 */
declare function isVestResultLike(value: unknown): value is VestResultLike;
/**
 * Create a {@link VestRunCoordinator} backed by its own caches and queues.
 *
 * Every adapter instance owns exactly one coordinator, so two adapters never
 * share a cache — matching the pre-extraction closure-state semantics.
 */
declare function createVestRunCoordinator(): VestRunCoordinator;
/**
 * Public constant kind prefix used for Vest `warn()` messages surfaced through
 * the toolkit. Exported so downstream code (error strategies, tests, debug
 * tooling) can filter warning-mode validation errors without re-deriving the
 * string literal. Built from the shared {@link WARN_KIND_PREFIX} so the
 * `warn:` convention has one source of truth across the toolkit.
 */
export declare const VEST_WARNING_KIND_PREFIX = "warn:vest:";
/**
 * Public constant kind prefix used for blocking Vest errors surfaced through
 * the toolkit. Mirrors {@link VEST_WARNING_KIND_PREFIX} so consumers can match
 * both shapes with a single source of truth.
 */
export declare const VEST_ERROR_KIND_PREFIX = "vest:";
/**
 * Adapter-local severity mapping used to generate Angular validation error
 * kinds. Vest exposes warn/error behavior through result selectors, but not as
 * a public severity union type.
 */
type VestValidationMode = 'error' | 'warning';
/**
 * Canonical representation of a Vest message after normalizing field targeting
 * and duplicate-message occurrence tracking.
 */
interface VestValidationEntry {
  fieldPath: string;
  message: string;
  occurrence: number;
}
/**
 * Snapshot of the initial sync result from a Vest run. Async completion uses
 * this to emit only the delta once pending tests finish.
 */
interface VestValidationSnapshot {
  readonly errors: readonly VestValidationEntry[];
  readonly warnings: readonly VestValidationEntry[];
}
/**
 * The subset of the adapter's per-field registration options that
 * {@link createVestValidationSnapshot}, {@link mapVestValidationResult}, and
 * {@link shouldDeferVestWarnings} actually read. Narrowed to exclude `only`
 * deliberately: `only`'s type carries the suite's field-name union `F`, and
 * these three helpers never call it — Picking just the two flags they use
 * lets them stay non-generic in `F` and accept any registration options
 * object (of ANY `F`) without a cast (an object with a narrower, `F`-typed
 * `only` is still assignable to a type that never mentions `only`).
 *
 * Mirrors the `includeErrors`/`includeWarnings` members of the adapter's
 * `VestValidationRegistrationOptions` by hand — a `Pick` would add a type
 * edge back to `./vest-adapter.ts`, which imports this module. A rename there
 * must be mirrored here.
 */
interface VestValidationFlags {
  readonly includeErrors: boolean;
  readonly includeWarnings: boolean;
}
/**
 * Captures the sync snapshot from a Vest result so pending async validation can
 * later calculate only the newly resolved delta.
 */
declare function createVestValidationSnapshot<F extends string = string>(result: VestResultLike<F>, options: VestValidationFlags): VestValidationSnapshot;
/**
 * Converts a Vest result into Angular validation errors, optionally subtracting
 * the sync snapshot that was already surfaced on the initial pass.
 *
 * Every entry's `fieldPath` is resolved relative to the validator's own bound
 * field tree (`fieldTree` — per ADR-0008, the only base there is), so no
 * separate "which fields belong to this registration" filter is needed: each
 * entry already routes to its own correct target via
 * `resolveVestValidationFieldTree` (private to this module).
 */
declare function mapVestValidationResult<F extends string = string>(result: VestResultLike<F>, fieldTree: ReadonlyFieldTree<unknown>, options: VestValidationFlags, baseline?: VestValidationSnapshot): readonly ValidationError.WithFieldTree[];
/**
 * Reports whether sync warning surfacing should be deferred for this
 * validation pass.
 *
 * Angular's `validateAsync` only schedules its resource when the bound
 * node's `syncValid()` is true, and `syncValid()` requires zero sync errors
 * across the ENTIRE bound subtree. Toolkit warnings are ordinary
 * `ValidationError`s (`warn:vest:*`), so a sync warning surfaced while the
 * suite still has pending async tests would make `syncValid()` false and
 * permanently prevent the async phase — including blocking async Vest
 * errors — from ever running. Defer warnings only while pending; once the
 * suite settles, {@link mapVestValidationResult}'s async `onSuccess` mapping
 * surfaces them together with the final result.
 *
 * Deferral is gated on `includeErrors`: it exists solely to protect THIS
 * registration's own blocking async Vest errors from being masked by its own
 * sync warning. A warning-only registration (`includeErrors: false`, e.g.
 * `validateVestWarnings`) has no blocking error of its own to protect, so
 * deferring buys nothing — and costs a real risk. `validateAsync` needs the
 * WHOLE bound subtree sync-valid before it schedules, so a separate,
 * unrelated blocking validator on the same subtree (an Angular `required()`,
 * a Zod issue) can keep the async phase from ever running. A warning deferred
 * on the strength of `isPending()` alone would then never resurface. Skipping
 * deferral when there are no errors to protect keeps the warning-only path
 * safe from that starvation.
 */
declare function shouldDeferVestWarnings<F extends string = string>(options: VestValidationFlags, initialResult: VestResultLike<F>): boolean;
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
type VestOnlyFieldSelector<TValue, F extends string = string> = (ctx: FieldContext<TValue>) => VestFieldExclusion<F>;
/**
 * Schema path accepted by the adapter's `register` method and the built-in
 * `validateVest`/`validateVestWarnings` entry points.
 */
type VestFieldPath<TValue> = SchemaPath<TValue> & SchemaPathTree<TValue>;
/**
 * Options accepted by {@link createVestAdapter}.
 */
interface VestAdapterOptions {
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
interface VestRegisterOptions<TValue = unknown, F extends string = string> {
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
interface RunVestSuiteParams<TValue, F extends string = string> {
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
interface RunVestSuiteResult<TValue, F extends string = string> {
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
interface VestSuiteAdapter {
  /**
   * Wire a Vest suite into Angular Signal Forms for the given field path,
   * registering both the synchronous (`validateTree`) and asynchronous
   * (`validateAsync`) phases against the shared run cache.
   */
  register<TValue, F extends string = string>(path: VestFieldPath<TValue>, suite: VestRunnableSuite<TValue, F>, options?: VestRegisterOptions<TValue, F>): void;
  /**
   * Run a Vest suite once through the shared cache. Returns the cached run for
   * an identical `(suite, fieldTree, value, focus)` tuple, or executes a fresh
   * run (and caches it) when any of those change.
   */
  runVestSuite<TValue, F extends string = string>(params: RunVestSuiteParams<TValue, F>): RunVestSuiteResult<TValue, F>;
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
export declare function createVestAdapter(options?: VestAdapterOptions): VestSuiteAdapter;
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
export declare const sharedVestAdapter: VestSuiteAdapter;
/**
 * Options accepted by {@link validateVest} (and the focus/reset subset by
 * {@link validateVestWarnings}). Controls warning surfacing, suite-state reset
 * on destroy, and per-field focused runs.
 */
interface ValidateVestOptions<TValue = unknown, F extends string = string> {
  /**
   * Include Vest warn-only tests as toolkit warnings.
   *
   * Warning messages are translated into Angular Signal Forms `ValidationError`
   * objects with a `kind` prefixed by `warn:` so existing toolkit components
   * render them as non-blocking guidance.
   *
   * While the suite has pending async tests AND this registration also maps
   * blocking errors (`includeErrors: true`, `validateVest`'s default), a sync
   * warning is deferred (not yet surfaced) and re-emitted together with the
   * settled result once they finish — see the vest README's "Async caveats"
   * section for why. A warning-only registration (`validateVestWarnings`, or
   * `includeErrors: false`) has no blocking error of its own to protect and
   * never defers: its warnings surface immediately.
   *
   * @default false
   */
  includeWarnings?: boolean;
  /**
   * Call `suite.reset()` when the injection context that registered the
   * validator is destroyed.
   *
   * Vest suites created with `create()` retain state across runs (last result,
   * pending async tests, test memoization). When consumers declare suites at
   * module scope (the recommended pattern), that state leaks across component
   * mounts. The toolkit registers a `DestroyRef.onDestroy()` hook **by default**
   * that clears suite state when the hosting component tears down.
   *
   * Set to `false` only when you deliberately want suite state to persist
   * across mounts.
   *
   * @default true
   */
  resetOnDestroy?: boolean;
  /**
   * Enable per-field focused runs. The callback receives the field context
   * for the current validation pass and returns a {@link VestFieldExclusion}:
   * a single field name, a list of field names, `undefined` for a
   * whole-suite run, or `false` to focus nothing.
   *
   * The adapter prefers the canonical `suite.only(field).run(value)` form.
   * When the suite does not expose `only`, it falls back to the legacy
   * `suite.run(value, fieldName)` form, which supports a single field name
   * only — a returned array collapses to its first element. Vest has no way
   * to express "focus nothing" through either form (an empty selection runs
   * the WHOLE suite, not zero tests — verified against vest@6.3.2), so a
   * `false` return throws a descriptive error instead of silently doing the
   * opposite of what was asked.
   *
   * @default undefined (full-suite run)
   */
  only?: VestOnlyFieldSelector<TValue, F>;
}
/**
 * Register only the warning bridge for a Vest suite.
 *
 * Use this when blocking validation comes from another validator but Vest
 * `warn()` guidance should still render through the toolkit's warning UX.
 *
 * Implemented on top of the public {@link sharedVestAdapter}, so passing the
 * same suite to a blocking `validateVest` (or to
 * `sharedVestAdapter.runVestSuite(...)`) reuses a single suite execution.
 *
 * @example
 * ```typescript
 * import { signal } from '@angular/core';
 * import { form } from '@angular/forms/signals';
 * import { create, enforce, only, test, warn } from 'vest';
 * import { validateVestWarnings } from '@ngx-signal-forms/toolkit/vest';
 *
 * interface SignupModel {
 *   password: string;
 * }
 *
 * const strengthSuite = create((data: SignupModel, field?: string) => {
 *   only(field);
 *   test('password', 'Consider using 12+ characters', () => {
 *     warn();
 *     enforce(data.password.length).greaterThanOrEquals(12);
 *   });
 * });
 *
 * const signupModel = signal<SignupModel>({ password: '' });
 * const signupForm = form(signupModel, (path) => {
 *   validateVestWarnings(path, strengthSuite);
 * });
 * ```
 */
export declare function validateVestWarnings<TValue, F extends string = string>(path: VestFieldPath<TValue>, suite: VestRunnableSuite<TValue, F>, options?: Pick<ValidateVestOptions<TValue, F>, 'only' | 'resetOnDestroy'>): void;
/**
 * Register a Vest suite as a first-class Angular Signal Forms validator.
 *
 * **The bound path's value is the suite input.** `path` and `suite` must
 * agree: binding the form root gives the suite the whole model (the common
 * case — a suite whose callback takes the model shape); binding a subtree is
 * equally legal when the suite is authored for that subtree's value (e.g. a
 * suite over `{ city: string }` bound to an `address` path). Binding a suite
 * authored for one shape to a path of a different shape is a compile error —
 * see ADR-0008 for why a second, mismatched value source is not offered as an
 * alternative.
 *
 * Vest 6 suites remain Standard Schema-compatible, but this adapter consumes the
 * suite through Vest's richer `run()` result so Angular Signal Forms can map
 * blocking errors and optional `warn()` output in a single validation pass.
 *
 * Pass `{ includeWarnings: true }` to also surface Vest `warn()` results through
 * the toolkit's `warn:*` convention so `ngx-form-field-error`,
 * `ngx-form-field-wrapper`, and related components can render them as
 * polite, non-blocking guidance.
 *
 * By default the adapter calls `suite.reset()` when the hosting injection
 * context is destroyed, so module-scope suites (the documented Vest pattern)
 * do not bleed state across component mounts. Pass `{ resetOnDestroy: false }`
 * to opt out when you deliberately want suite state to persist.
 *
 * Pass `{ only: (ctx) => fieldName }` to enable per-field focused runs. The
 * adapter then prefers `suite.only(fieldName).run(value)`, which also accepts
 * a list of field names, and falls back to `suite.run(value, fieldName)` only
 * for a suite that exposes no `only()` — that legacy path takes one field name
 * and collapses a list to its first entry. Either way it replaces the
 * full-suite run, and works with suite callbacks that call `only(fieldName)`
 * internally.
 *
 * Built on the public {@link sharedVestAdapter}; advanced consumers can wire
 * the same machinery manually via `createVestAdapter` /
 * `sharedVestAdapter.runVestSuite`.
 *
 * @example
 * ```typescript
 * import { signal } from '@angular/core';
 * import { form } from '@angular/forms/signals';
 * import { create, enforce, only, test } from 'vest';
 * import { validateVest } from '@ngx-signal-forms/toolkit/vest';
 *
 * interface LoginModel {
 *   email: string;
 * }
 *
 * const loginSuite = create((data: LoginModel, field?: string) => {
 *   only(field);
 *   test('email', 'Email is required', () => {
 *     enforce(data.email).isNotBlank();
 *   });
 * });
 *
 * const loginModel = signal<LoginModel>({ email: '' });
 * const loginForm = form(loginModel, (path) => {
 *   validateVest(path, loginSuite); // resets on destroy by default
 * });
 * ```
 */
export declare function validateVest<TValue, F extends string = string>(path: VestFieldPath<TValue>, suite: VestRunnableSuite<TValue, F>, options?: ValidateVestOptions<TValue, F>): void;
export type { RunVestSuiteParams, RunVestSuiteResult, ValidateVestOptions, VestAdapterOptions, VestCoordinatedSuite, VestFieldExclusion, VestFieldPath, VestOnlyFieldSelector, VestRegisterOptions, VestResultLike, VestRunnableSuite, VestSuiteAdapter };