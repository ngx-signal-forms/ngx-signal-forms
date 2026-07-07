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
import type { SuiteResult } from 'vest';

/* oxlint-disable @typescript-eslint/prefer-readonly-parameter-types -- Angular Signal Forms validator callbacks and lightweight path parsing helpers operate on framework/runtime types that are not modeled as readonly. */

/**
 * Public constant kind prefix used for Vest `warn()` messages surfaced through
 * the toolkit. Exported so downstream code (error strategies, tests, debug
 * tooling) can filter warning-mode validation errors without re-deriving the
 * string literal.
 */
export const VEST_WARNING_KIND_PREFIX = 'warn:vest:';

/**
 * Public constant kind prefix used for blocking Vest errors surfaced through
 * the toolkit. Mirrors {@link VEST_WARNING_KIND_PREFIX} so consumers can match
 * both shapes with a single source of truth.
 */
export const VEST_ERROR_KIND_PREFIX = 'vest:';

/**
 * Callback supplied via {@link VestRegisterOptions.only} to enable per-field
 * focused runs. Receives the Angular Signal Forms field context and returns
 * the Vest field name (or list of names) to focus on for the current run.
 * Returning `undefined` falls back to a whole-suite run.
 */
export type VestOnlyFieldSelector<TValue> = (
  ctx: FieldContext<TValue>,
) => string | readonly string[] | undefined;

/**
 * Schema path accepted by the adapter's `register` method and the built-in
 * `validateVest`/`validateVestWarnings` entry points.
 */
export type VestFieldPath<TValue> = SchemaPath<TValue> & SchemaPathTree<TValue>;

/**
 * Whole-suite failure map returned by Vest selector APIs such as
 * `result.getErrors()` and `result.getWarnings()`.
 */
type VestFailureMessages = Readonly<Record<string, readonly string[]>>;

/**
 * Field-scoped failure list returned by Vest selector APIs such as
 * `result.getErrors('fieldName')`.
 */
type VestFieldMessages = readonly string[];

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
 * Minimal subset of Vest's public result API required by the adapter.
 *
 * The overloads intentionally mirror Vest's selector behavior more precisely
 * than a plain `Pick<SuiteResult, ...>` so internal helpers can stay strict
 * about whole-suite versus field-scoped result shapes.
 */
export interface VestResultLike extends Pick<SuiteResult, 'isPending'> {
  getErrors(): VestFailureMessages;
  getErrors(fieldName: string): VestFieldMessages;
  getWarnings(): VestFailureMessages;
  getWarnings(fieldName: string): VestFieldMessages;
}

/**
 * Narrow runtime contract used by the adapter. The local type preserves the
 * documented Promise-like behavior of async `run()` results without requiring
 * the full generic `Suite` surface in consumers.
 */
export interface VestRunnableSuite<TValue> {
  run(
    value: TValue,
    fieldName?: string | string[],
  ): VestResultLike | PromiseLike<VestResultLike>;
  reset?: () => void;
  only?: (field: string | string[]) => Pick<VestRunnableSuite<TValue>, 'run'>;
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
  get?: () => VestResultLike;
}

/**
 * Cached Vest run keyed by suite instance and Angular field tree so sync and
 * async validation can share a single suite execution.
 */
interface VestRunCacheEntry<TValue> {
  readonly value: TValue;
  readonly focus: string | undefined;
  readonly runResult: VestResultLike | PromiseLike<VestResultLike>;
  readonly initialResult: VestResultLike | undefined;
}

/**
 * Internal registration flags that decide whether blocking errors, warnings, or
 * both should be mapped into Angular Signal Forms.
 */
interface VestValidationRegistrationOptions<TValue> {
  readonly includeErrors: boolean;
  readonly includeWarnings: boolean;
  readonly only?: VestOnlyFieldSelector<TValue>;
  readonly focusCurrentField?: boolean;
}

/**
 * Resource payload for pending Vest async validation.
 */
interface PendingVestValidationPayload {
  readonly runResult: VestResultLike | PromiseLike<VestResultLike>;
  readonly initialSnapshot: VestValidationSnapshot;
}

/**
 * Fully resolved async validation payload returned from the resource loader.
 */
interface ResolvedVestValidationPayload {
  readonly result: VestResultLike;
  readonly initialSnapshot: VestValidationSnapshot;
}

/**
 * Strongly typed per-suite cache used to share a single Vest run between the
 * sync and async Angular validation phases.
 */
type VestRunCache = WeakMap<
  ReadonlyFieldTree<unknown>,
  VestRunCacheEntry<unknown>
>;

const VEST_PATH_SEGMENT = /[^.[\]]+/g;
const VEST_KIND_SEGMENT_MAX_LEN = 48;

/**
 * Internal composite-key separator. A NUL code point can never appear in a Vest
 * field path, message, or focus name, so it composes collision-free keys for the
 * baseline dedupe map and the focus cache key. Declared with an explicit
 * `\u0000` escape in a named constant (rather than a literal control character
 * embedded in template strings) so the separator stays visible and
 * tooling/formatter/diff-safe.
 */
const VEST_KEY_SEPARATOR = '\u0000';

/**
 * Runtime guard for the subset of Vest's public result object that the adapter
 * consumes.
 */
function isVestResultLike(value: unknown): value is VestResultLike {
  return (
    value !== null &&
    (typeof value === 'object' || typeof value === 'function') &&
    typeof Reflect.get(value, 'getErrors') === 'function' &&
    typeof Reflect.get(value, 'getWarnings') === 'function'
  );
}

function isThenable(value: unknown): value is PromiseLike<unknown> {
  return (
    value !== null &&
    (typeof value === 'object' || typeof value === 'function') &&
    typeof Reflect.get(value, 'then') === 'function'
  );
}

// Field tree nodes are callable proxies, so callability is a necessary (not
// sufficient) proxy for "is a tree node". The sole caller
// (`resolveVestWarningFieldTree`) only uses this to choose between a resolved
// node and a same-typed `ReadonlyFieldTree` fallback, so a false positive still
// yields a tree-shaped value — the loose predicate is intentional and contained.
function isFieldTree(value: unknown): value is ReadonlyFieldTree<unknown> {
  return typeof value === 'function';
}

/**
 * Compact FNV-1a hash returning a 4-character lowercase hex digest. Used as a
 * collision-safe suffix when the raw kind segment exceeds
 * {@link VEST_KIND_SEGMENT_MAX_LEN}.
 */
function fnv1a4Hex(value: string): string {
  let hash = 0x8_11c_9dc5;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.codePointAt(index) ?? 0;
    hash = Math.imul(hash, 0x01_00_01_93);
  }

  return (hash >>> 16).toString(16).padStart(4, '0');
}

/**
 * Sanitizes arbitrary Vest field/message fragments so generated validation
 * kinds remain stable and CSS/DOM-friendly.
 *
 * When the sanitized value exceeds {@link VEST_KIND_SEGMENT_MAX_LEN}, a short
 * FNV-1a hash suffix of the *original* value is appended to guarantee that
 * two long, otherwise-identical prefixes do not collide.
 */
function normalizeWarningKindSegment(value: string): string {
  const normalized = value
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/^-+|-+$/g, '');

  if (normalized.length <= VEST_KIND_SEGMENT_MAX_LEN) {
    return normalized;
  }

  return `${normalized.slice(0, VEST_KIND_SEGMENT_MAX_LEN)}-${fnv1a4Hex(value)}`;
}

/**
 * Creates a deterministic Angular validation error kind for a mapped Vest
 * error or warning.
 */
function createVestValidationKind(
  mode: VestValidationMode,
  fieldPath: string,
  message: string,
  occurrence: number,
): string {
  const normalizedField = normalizeWarningKindSegment(fieldPath) || 'field';
  const normalizedMessage = normalizeWarningKindSegment(message) || 'warning';

  if (mode === 'warning') {
    return `${VEST_WARNING_KIND_PREFIX}${normalizedField}:${normalizedMessage}:${occurrence}`;
  }

  return `${VEST_ERROR_KIND_PREFIX}${normalizedField}:${normalizedMessage}:${occurrence}`;
}

/**
 * Parses a Vest dotted/bracket field path into object/array segments that can
 * be traversed against an Angular field tree.
 */
function parseVestFieldPath(fieldPath: string): Array<string | number> {
  return Array.from(fieldPath.matchAll(VEST_PATH_SEGMENT), ([segment]) => {
    return /^\d+$/.test(segment) ? Number(segment) : segment;
  });
}

/**
 * Derives the Vest field name for the field a validator is bound to from the
 * Angular field context's `pathKeys` (the keys leading from the form root to
 * the current field). Produces the dotted notation Vest uses for field
 * targeting (e.g. `['user', 'email'] -> 'user.email'`, `['items', '0', 'sku']
 * -> 'items.0.sku'`), which is the inverse of {@link parseVestFieldPath}.
 *
 * Returns `undefined` for a root-bound validator (empty path) so the caller
 * falls back to a whole-suite run instead of focusing an empty field name.
 *
 * **Limitation:** field keys that themselves contain `.`, `[`, or `]` are not
 * supported — the dot-joined encoding intentionally matches how users register
 * field names in their Vest suite, so these characters cannot be losslessly
 * escaped. In practice, Angular Signal Forms field keys are TypeScript object
 * property names (camelCase strings) and do not contain these characters.
 */
function deriveVestFieldNameFromContext<TValue>(
  ctx: FieldContext<TValue>,
): string | undefined {
  const pathKeys = ctx.pathKeys();
  if (pathKeys.length === 0) {
    return undefined;
  }

  return pathKeys.join('.');
}

/**
 * Resolves a Vest warning path to the matching Angular field tree. When the
 * target path is missing, the current field tree is used as a safe fallback.
 *
 * Traversal uses an own-property guard (`Object.hasOwn`) before reading via
 * `Reflect.get` so prototype-chain entries (e.g. `toString`, `constructor`)
 * cannot accidentally be resolved as field tree nodes.
 */
function resolveVestWarningFieldTree(
  fieldTree: ReadonlyFieldTree<unknown>,
  fieldPath: string,
): ReadonlyFieldTree<unknown> {
  let current: unknown = fieldTree;

  for (const segment of parseVestFieldPath(fieldPath)) {
    if (
      !current ||
      (typeof current !== 'function' && typeof current !== 'object')
    ) {
      return fieldTree;
    }

    // oxlint-disable-next-line unicorn/new-for-builtins -- Object() coercion is intentional runtime wrap for own-property probing on callable field trees.
    const container = Object(current) as object;
    const segmentKey = typeof segment === 'number' ? String(segment) : segment;

    // Angular Signal Forms field trees are proxies whose traps throw
    // `Reflect.getOwnPropertyDescriptor called on non-object` when probed on a
    // leaf node (no further children). This happens when a Vest field name is
    // resolved against a validator bound to that leaf — e.g. the
    // `focusCurrentField` auto-focus path, where the bound field *is* the
    // target. Treat any probe failure as "no such child" and fall back to the
    // bound field tree, which is the correct target in that case.
    let next: unknown;
    try {
      if (!Object.hasOwn(container, segmentKey)) {
        return fieldTree;
      }
      next = Reflect.get(container, segmentKey);
    } catch {
      return fieldTree;
    }
    if (next === undefined) {
      return fieldTree;
    }

    current = next;
  }

  return isFieldTree(current) ? current : fieldTree;
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
function executeVestRun<TValue>(
  suite: Pick<VestRunnableSuite<TValue>, 'run' | 'only'>,
  value: TValue,
  focus: string | readonly string[] | undefined,
): VestResultLike | PromiseLike<VestResultLike> {
  if (focus === undefined) {
    return suite.run(value);
  }

  // Vest's `only`/`run` field selectors require a mutable string[]. We clone
  // readonly inputs so toolkit consumers can pass `readonly string[]` through
  // without widening their own types.
  const focusArg = Array.isArray(focus) ? [...focus] : (focus as string);

  if (typeof suite.only === 'function') {
    const focused = suite.only(focusArg);
    return focused.run(value);
  }

  return suite.run(value, focusArg);
}

/**
 * Awaits a Vest run's settlement, recovering from a superseded resolver.
 *
 * Vest 6's `suite.run()` promise resolves via a single resolver tracked per
 * suite root isolate: `ALL_RUNNING_TESTS_FINISHED` fires `root.data.resolver()`
 * once, and any LATER `suite.run()` call on the SAME suite instance replaces
 * that resolver before the earlier call's promise ever settles. Two
 * registrations of the same suite with different field trees (e.g. two
 * `focusCurrentField` validators on different fields) each call `run()`
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
function awaitVestRunSettlement<TValue>(
  runResult: VestResultLike | PromiseLike<VestResultLike>,
  suite: Pick<VestRunnableSuite<TValue>, 'subscribe' | 'get'>,
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
    // `?.()`: some suites invoke the `subscribe` callback SYNCHRONOUSLY (e.g.
    // if all tests already finished before this call), which would otherwise
    // try to read `unsubscribe` before its initializer has run — a TDZ
    // `ReferenceError` that would leave this promise unsettled forever.
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
    // call itself), `settle()` ran before `unsubscribe` was assigned, so its
    // `unsubscribe?.()` was a no-op. Clean up the now-stale subscription here
    // instead, now that we hold a reference to it.
    if (settled) {
      unsubscribe();
    }
  });
}

/**
 * Normalizes Vest selector output into a flat list of field-targeted messages.
 */
function toVestValidationEntries(
  messages: VestFailureMessages,
): readonly VestValidationEntry[];
function toVestValidationEntries(
  messages: VestFieldMessages,
): readonly VestValidationEntry[];
function toVestValidationEntries(
  messages: VestFailureMessages | VestFieldMessages | undefined,
): readonly VestValidationEntry[] {
  if (!messages) {
    return [];
  }

  if (Array.isArray(messages)) {
    return createVestEntriesForField('root', messages);
  }

  return Object.entries(messages).flatMap(([fieldPath, fieldMessages]) => {
    return createVestEntriesForField(fieldPath, fieldMessages);
  });
}

/**
 * Annotates repeated messages with an occurrence index so duplicate kinds remain
 * deterministic and unique.
 */
function createVestEntriesForField(
  fieldPath: string,
  messages: readonly string[],
): readonly VestValidationEntry[] {
  const occurrences = new Map<string, number>();

  return messages.map((message) => {
    const occurrence = occurrences.get(message) ?? 0;
    occurrences.set(message, occurrence + 1);

    return {
      fieldPath,
      message,
      occurrence,
    };
  });
}

/**
 * Restricts mapped Vest entries to the validator's own bound field when it is
 * NOT root-bound.
 *
 * Vest field paths are root-relative and Vest is stateful: fields excluded by
 * `only()` retain their previous failures, so a focused run's result can
 * still contain OTHER fields' retained messages. For a root-bound validator
 * every field is a legitimate target, so no filtering is needed. For a
 * subfield-bound validator (e.g. `focusCurrentField`), only entries for the
 * bound field itself or one of its descendants belong to this registration —
 * entries for unrelated fields are dropped rather than mis-attributed via
 * {@link resolveVestWarningFieldTree}'s bound-field fallback.
 */
function filterEntriesForBoundField(
  entries: readonly VestValidationEntry[],
  boundFieldPath: string | undefined,
): readonly VestValidationEntry[] {
  if (boundFieldPath === undefined) {
    return entries;
  }

  const descendantPrefix = `${boundFieldPath}.`;
  return entries.filter(
    (entry) =>
      entry.fieldPath === boundFieldPath ||
      entry.fieldPath.startsWith(descendantPrefix),
  );
}

/**
 * Removes messages already emitted during the initial sync pass so async
 * completion only contributes newly resolved Vest errors or warnings.
 */
function filterExistingVestEntries(
  entries: readonly VestValidationEntry[],
  baseline: readonly VestValidationEntry[],
): readonly VestValidationEntry[] {
  if (baseline.length === 0) {
    return entries;
  }

  const remainingCounts = new Map<string, number>();

  for (const entry of baseline) {
    const key = `${entry.fieldPath}${VEST_KEY_SEPARATOR}${entry.message}`;
    remainingCounts.set(key, (remainingCounts.get(key) ?? 0) + 1);
  }

  return entries.filter((entry) => {
    const key = `${entry.fieldPath}${VEST_KEY_SEPARATOR}${entry.message}`;
    const remainingCount = remainingCounts.get(key) ?? 0;

    if (remainingCount === 0) {
      return true;
    }

    remainingCounts.set(key, remainingCount - 1);
    return false;
  });
}

/**
 * Maps normalized Vest messages into Angular validation errors targeted at the
 * correct field tree.
 */
function toVestValidationErrors(
  entries: readonly VestValidationEntry[],
  fieldTree: ReadonlyFieldTree<unknown>,
  mode: VestValidationMode,
): readonly ValidationError.WithFieldTree[] {
  return entries.map(({ fieldPath, message, occurrence }) => {
    const targetFieldTree =
      fieldPath === 'root'
        ? fieldTree
        : resolveVestWarningFieldTree(fieldTree, fieldPath);

    return {
      kind: createVestValidationKind(mode, fieldPath, message, occurrence),
      message,
      fieldTree: targetFieldTree,
    };
  });
}

/**
 * Captures the sync snapshot from a Vest result so pending async validation can
 * later calculate only the newly resolved delta.
 */
function createVestValidationSnapshot(
  result: VestResultLike,
  options: VestValidationRegistrationOptions<unknown>,
): VestValidationSnapshot {
  return {
    errors: options.includeErrors
      ? toVestValidationEntries(result.getErrors())
      : [],
    warnings: options.includeWarnings
      ? toVestValidationEntries(result.getWarnings())
      : [],
  };
}

/**
 * Converts a Vest result into Angular validation errors, optionally subtracting
 * the sync snapshot that was already surfaced on the initial pass.
 *
 * `boundFieldPath` is the validator's own dotted field name from
 * `ctx.pathKeys()` (`undefined` for a root-bound validator). When defined,
 * entries for other fields are dropped — see
 * {@link filterEntriesForBoundField}.
 */
function mapVestValidationResult(
  result: VestResultLike,
  fieldTree: ReadonlyFieldTree<unknown>,
  options: VestValidationRegistrationOptions<unknown>,
  boundFieldPath: string | undefined,
  baseline?: VestValidationSnapshot,
): readonly ValidationError.WithFieldTree[] {
  const errors = options.includeErrors
    ? toVestValidationErrors(
        filterExistingVestEntries(
          filterEntriesForBoundField(
            toVestValidationEntries(result.getErrors()),
            boundFieldPath,
          ),
          baseline?.errors ?? [],
        ),
        fieldTree,
        'error',
      )
    : [];

  const warnings = options.includeWarnings
    ? toVestValidationErrors(
        filterExistingVestEntries(
          filterEntriesForBoundField(
            toVestValidationEntries(result.getWarnings()),
            boundFieldPath,
          ),
          baseline?.warnings ?? [],
        ),
        fieldTree,
        'warning',
      )
    : [];

  return [...errors, ...warnings];
}

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
 */
function shouldDeferVestWarnings(
  options: VestValidationRegistrationOptions<unknown>,
  initialResult: VestResultLike,
): boolean {
  return options.includeWarnings && initialResult.isPending();
}

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
export interface VestRegisterOptions<TValue = unknown> {
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
  readonly only?: VestOnlyFieldSelector<TValue>;

  /**
   * Derive the Vest field name to focus automatically from the field this
   * validator is bound to. Ignored when {@link only} is provided.
   *
   * @default false
   */
  readonly focusCurrentField?: boolean;
}

/**
 * Input describing a single shared, cache-aware Vest run. Consumed by
 * {@link VestSuiteAdapter.runVestSuite}.
 */
export interface RunVestSuiteParams<TValue> {
  readonly suite: Pick<VestRunnableSuite<TValue>, 'run' | 'only'>;
  readonly fieldTree: ReadonlyFieldTree<TValue>;
  readonly value: TValue;
  readonly focus?: string | readonly string[] | undefined;
}

/**
 * Result of a shared, cache-aware single Vest run. `initialResult` is the
 * synchronous `SuiteResult` (or `undefined` when the suite's `run()` returns a
 * raw thenable), `runResult` is the underlying sync-or-async run value, and
 * `fromCache` reports whether this run reused a previously cached execution for
 * the identical `(suite, fieldTree, value, focus)` tuple.
 */
export interface RunVestSuiteResult<TValue> {
  readonly value: TValue;
  readonly focus: string | undefined;
  readonly runResult: VestResultLike | PromiseLike<VestResultLike>;
  readonly initialResult: VestResultLike | undefined;
  readonly fromCache: boolean;
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
  register<TValue>(
    path: VestFieldPath<TValue>,
    suite: VestRunnableSuite<TValue>,
    options?: VestRegisterOptions<TValue>,
  ): void;

  /**
   * Run a Vest suite once through the shared cache. Returns the cached run for
   * an identical `(suite, fieldTree, value, focus)` tuple, or executes a fresh
   * run (and caches it) when any of those change.
   */
  runVestSuite<TValue>(
    params: RunVestSuiteParams<TValue>,
  ): RunVestSuiteResult<TValue>;

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
  const runCache = new WeakMap<object, VestRunCache>();

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
   * Reuses an existing Vest run for the same suite, Angular field tree, model
   * reference, and focus key; or executes the suite once and caches the result.
   *
   * When `suite.run()` returns a thenable directly (rather than the documented
   * synchronous `SuiteResult`), we capture `initialResult` as `undefined` and
   * rely on the async branch to drive completion from the promise. This guards
   * against consumer-wrapped suites that coerce `run()` into a Promise.
   */
  function getOrCreateVestRun<TValue>(
    suite: Pick<VestRunnableSuite<TValue>, 'run' | 'only'>,
    fieldTree: ReadonlyFieldTree<TValue>,
    value: TValue,
    focus: string | readonly string[] | undefined,
  ): VestRunCacheEntry<TValue> & { readonly fromCache: boolean } {
    const suiteCache = getVestSuiteRunCache(suite as object);
    const cachedEntry = suiteCache.get(fieldTree as ReadonlyFieldTree<unknown>);
    const focusKey = Array.isArray(focus)
      ? focus.join(VEST_KEY_SEPARATOR)
      : (focus as string | undefined);

    if (
      cachedEntry &&
      Object.is(cachedEntry.value, value) &&
      cachedEntry.focus === focusKey
    ) {
      return {
        value,
        focus: focusKey,
        runResult: cachedEntry.runResult,
        initialResult: cachedEntry.initialResult,
        fromCache: true,
      };
    }

    const runResult = executeVestRun(suite, value, focus);
    const nextEntry: VestRunCacheEntry<TValue> = {
      value,
      focus: focusKey,
      runResult,
      // Vest 6's `suite.run(...)` returns a dual-shaped object that is *both*
      // a synchronous `SuiteResult` (with `getErrors`/`isPending`) and a
      // thenable. Previously we gated `initialResult` with `!isThenable(...)`,
      // which would always be false for Vest 6 suites and forced every
      // validation run through the async pipeline — hiding sync errors until
      // the next microtask. Check the sync surface directly instead.
      initialResult: isVestResultLike(runResult) ? runResult : undefined,
    };

    suiteCache.set(fieldTree as ReadonlyFieldTree<unknown>, nextEntry);
    return { ...nextEntry, fromCache: false };
  }

  function register<TValue>(
    path: VestFieldPath<TValue>,
    suite: VestRunnableSuite<TValue>,
    registerOptions: VestRegisterOptions<TValue> = {},
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
      ...(registerOptions.focusCurrentField !== undefined && {
        focusCurrentField: registerOptions.focusCurrentField,
      }),
    });
  }

  function runVestSuite<TValue>(
    params: RunVestSuiteParams<TValue>,
  ): RunVestSuiteResult<TValue> {
    return getOrCreateVestRun(
      params.suite,
      params.fieldTree,
      params.value,
      params.focus,
    );
  }

  function invalidate(suite: object): void {
    runCache.delete(suite);
  }

  /**
   * Registers a `DestroyRef.onDestroy()` hook that calls `suite.reset()` when
   * the current injection context is torn down. No-op when `resetOnDestroy` is
   * false or when the suite does not expose a `reset` callable. The hook clears
   * the SAME shared run cache so a subsequent mount re-executes `run()`.
   */
  function maybeRegisterResetOnDestroy<TValue>(
    suite: VestRunnableSuite<TValue>,
    resetOnDestroy: boolean | undefined,
  ): void {
    if (!resetOnDestroy) {
      return;
    }

    const reset = (suite as { reset?: unknown }).reset;
    if (typeof reset !== 'function') {
      return;
    }

    inject(DestroyRef).onDestroy(() => {
      // Also clear the per-suite run cache so a subsequent mount re-executes
      // `run()` even when the field tree reference happens to be reused.
      invalidate(suite as object);
      (suite as { reset: () => void }).reset();
    });
  }

  /**
   * Registers the shared sync/async Vest validation pipeline for the given
   * field path.
   */
  function registerVestValidation<TValue>(
    path: VestFieldPath<TValue>,
    suite: VestRunnableSuite<TValue>,
    validationOptions: VestValidationRegistrationOptions<TValue>,
  ): void {
    const resolveFocus = (
      ctx: FieldContext<TValue>,
    ): string | readonly string[] | undefined => {
      // An explicit `only` selector always wins so existing wiring is unchanged.
      if (validationOptions.only) {
        return validationOptions.only(ctx);
      }

      // Opt-in auto-focus: derive the Vest field name from the bound field.
      if (validationOptions.focusCurrentField) {
        return deriveVestFieldNameFromContext(ctx);
      }

      return undefined;
    };

    validateTree(path, (ctx) => {
      const { fieldTree, value } = ctx;
      const entry = getOrCreateVestRun(
        suite,
        fieldTree,
        value(),
        resolveFocus(ctx),
      );

      if (!entry.initialResult) {
        return [];
      }

      const syncOptions = shouldDeferVestWarnings(
        validationOptions as VestValidationRegistrationOptions<unknown>,
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
        syncOptions as VestValidationRegistrationOptions<unknown>,
        deriveVestFieldNameFromContext(ctx),
      );
    });

    validateAsync(path, {
      params: (ctx) => {
        const { fieldTree, value } = ctx;
        const entry = getOrCreateVestRun(
          suite,
          fieldTree,
          value(),
          resolveFocus(ctx),
        );

        // When `run()` returned a raw Promise (no sync SuiteResult), drive the
        // async pipeline directly from the thenable. Otherwise require the sync
        // result to report pending tests before scheduling async work.
        if (!entry.initialResult) {
          if (!isThenable(entry.runResult)) {
            return undefined;
          }

          return {
            runResult: entry.runResult,
            initialSnapshot: { errors: [], warnings: [] },
          } satisfies PendingVestValidationPayload;
        }

        if (!entry.initialResult.isPending()) {
          return undefined;
        }

        // Match the sync `validateTree` pass above: while pending, warnings
        // are deferred (not yet surfaced), so the baseline used to compute
        // the async delta must NOT already count them as shown — otherwise
        // `onSuccess`'s `filterExistingVestEntries` would treat them as
        // already-emitted and drop them from the final, settled result.
        const snapshotOptions = shouldDeferVestWarnings(
          validationOptions as VestValidationRegistrationOptions<unknown>,
          entry.initialResult,
        )
          ? {
              ...validationOptions,
              includeWarnings: false,
            }
          : validationOptions;

        return {
          runResult: entry.runResult,
          initialSnapshot: createVestValidationSnapshot(
            entry.initialResult,
            snapshotOptions as VestValidationRegistrationOptions<unknown>,
          ),
        } satisfies PendingVestValidationPayload;
      },
      factory: (pendingValidation) => {
        return resource({
          params: pendingValidation,
          loader: async ({ params }) => {
            const result = await awaitVestRunSettlement(
              params.runResult,
              suite,
            );
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
          validationOptions as VestValidationRegistrationOptions<unknown>,
          deriveVestFieldNameFromContext(ctx),
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
 */
export const sharedVestAdapter: VestSuiteAdapter = createVestAdapter();

/* oxlint-enable @typescript-eslint/prefer-readonly-parameter-types */
