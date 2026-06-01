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
 * Callback supplied via {@link ValidateVestOptions.only} to enable per-field
 * focused runs. Receives the Angular Signal Forms field context and returns
 * the Vest field name (or list of names) to focus on for the current run.
 * Returning `undefined` falls back to a whole-suite run.
 */
export type VestOnlyFieldSelector<TValue> = (
  ctx: FieldContext<TValue>,
) => string | readonly string[] | undefined;

export interface ValidateVestOptions<TValue = unknown> {
  /**
   * Include Vest warn-only tests as toolkit warnings.
   *
   * Warning messages are translated into Angular Signal Forms `ValidationError`
   * objects with a `kind` prefixed by `warn:` so existing toolkit components
   * render them as non-blocking guidance.
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
   * Enable per-field focused runs by passing a field name as the second
   * argument to `suite.run(value, fieldName)`. When provided as a function,
   * the callback receives the field context for the current validation pass
   * and should return the Vest field name(s) to focus, or `undefined` for a
   * whole-suite run.
   *
   * Works with suite callbacks that use `only(fieldName)` or with the
   * `suite.only(field).run(...)` shorthand. Default behavior remains a full
   * suite run for backward compatibility.
   *
   * @default undefined (full-suite run)
   */
  only?: VestOnlyFieldSelector<TValue>;

  /**
   * Derive the Vest field name to focus automatically from the field this
   * validator is bound to, giving you Vest's per-field focused run with zero
   * wiring. When `true` and {@link only} is not provided, the adapter resolves
   * the current field's dotted Vest name from `ctx.pathKeys()` and passes it to
   * the focused run (`suite.only(name).run(value)` or
   * `suite.run(value, name)`).
   *
   * Bind `validateVest` to the specific field path you want focused (e.g.
   * `validateVest(path.email, suite, { focusCurrentField: true })`) so the
   * derived name targets that field. When the validator is bound to the form
   * root the derived path is empty and the run falls back to a whole-suite run.
   *
   * Ignored when {@link only} is provided — an explicit selector always wins so
   * existing wiring keeps working unchanged.
   *
   * @default false (full-suite run)
   */
  focusCurrentField?: boolean;
}

type VestFieldPath<TValue> = SchemaPath<TValue> & SchemaPathTree<TValue>;

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
interface VestResultLike extends Pick<SuiteResult, 'isPending'> {
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
interface VestRunnableSuite<TValue> {
  run(
    value: TValue,
    fieldName?: string | string[],
  ): VestResultLike | PromiseLike<VestResultLike>;
  reset?: () => void;
  only?: (field: string | string[]) => Pick<VestRunnableSuite<TValue>, 'run'>;
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
const vestRunCache = new WeakMap<object, VestRunCache>();

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
 * Retrieves the per-suite validation cache, creating it on first access.
 */
function getVestSuiteRunCache(suite: object): VestRunCache {
  const existingCache = vestRunCache.get(suite);
  if (existingCache) {
    return existingCache;
  }

  const nextCache: VestRunCache = new WeakMap();
  vestRunCache.set(suite, nextCache);
  return nextCache;
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
): VestRunCacheEntry<TValue> {
  const suiteCache = getVestSuiteRunCache(suite as object);
  const cachedEntry = suiteCache.get(fieldTree as ReadonlyFieldTree<unknown>);
  const focusKey = Array.isArray(focus)
    ? focus.join('\u0000')
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
  return nextEntry;
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
    const key = `${entry.fieldPath}\u0000${entry.message}`;
    remainingCounts.set(key, (remainingCounts.get(key) ?? 0) + 1);
  }

  return entries.filter((entry) => {
    const key = `${entry.fieldPath}\u0000${entry.message}`;
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
 */
function mapVestValidationResult(
  result: VestResultLike,
  fieldTree: ReadonlyFieldTree<unknown>,
  options: VestValidationRegistrationOptions<unknown>,
  baseline?: VestValidationSnapshot,
): readonly ValidationError.WithFieldTree[] {
  const errors = options.includeErrors
    ? toVestValidationErrors(
        filterExistingVestEntries(
          toVestValidationEntries(result.getErrors()),
          baseline?.errors ?? [],
        ),
        fieldTree,
        'error',
      )
    : [];

  const warnings = options.includeWarnings
    ? toVestValidationErrors(
        filterExistingVestEntries(
          toVestValidationEntries(result.getWarnings()),
          baseline?.warnings ?? [],
        ),
        fieldTree,
        'warning',
      )
    : [];

  return [...errors, ...warnings];
}

/**
 * Registers the shared sync/async Vest validation pipeline for the given field
 * path.
 */
function registerVestValidation<TValue>(
  path: VestFieldPath<TValue>,
  suite: VestRunnableSuite<TValue>,
  options: VestValidationRegistrationOptions<TValue>,
): void {
  const resolveFocus = (
    ctx: FieldContext<TValue>,
  ): string | readonly string[] | undefined => {
    // An explicit `only` selector always wins so existing wiring is unchanged.
    if (options.only) {
      return options.only(ctx);
    }

    // Opt-in auto-focus: derive the Vest field name from the bound field.
    if (options.focusCurrentField) {
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

    return mapVestValidationResult(
      entry.initialResult,
      fieldTree,
      options as VestValidationRegistrationOptions<unknown>,
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

      return {
        runResult: entry.runResult,
        initialSnapshot: createVestValidationSnapshot(
          entry.initialResult,
          options as VestValidationRegistrationOptions<unknown>,
        ),
      } satisfies PendingVestValidationPayload;
    },
    factory: (pendingValidation) => {
      return resource({
        params: pendingValidation,
        loader: async ({ params }) => {
          const result = await params.runResult;
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
    onSuccess: (pendingResult, { fieldTree }) => {
      return mapVestValidationResult(
        pendingResult.result,
        fieldTree,
        options as VestValidationRegistrationOptions<unknown>,
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
      if (!options.includeErrors) {
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

/**
 * Register only the warning bridge for a Vest suite.
 *
 * Use this when blocking validation comes from another validator but Vest
 * `warn()` guidance should still render through the toolkit's warning UX.
 */
export function validateVestWarnings<TValue>(
  path: VestFieldPath<TValue>,
  suite: VestRunnableSuite<TValue>,
  options: Pick<
    ValidateVestOptions<TValue>,
    'resetOnDestroy' | 'only' | 'focusCurrentField'
  > = {},
): void {
  maybeRegisterResetOnDestroy(suite, options.resetOnDestroy ?? true);
  registerVestValidation(path, suite, {
    includeErrors: false,
    includeWarnings: true,
    only: options.only,
    focusCurrentField: options.focusCurrentField,
  });
}

/**
 * Register a Vest suite as a first-class Angular Signal Forms validator.
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
 * adapter then invokes `suite.run(value, fieldName)` (or
 * `suite.only(fieldName).run(value)` where supported) rather than a full-suite
 * run. Works with suite callbacks that use `only(fieldName)` internally.
 *
 * Pass `{ focusCurrentField: true }` (without `only`) to get the same focused
 * run with zero wiring: the adapter derives the Vest field name from the field
 * this validator is bound to. Bind to the specific field path you want focused,
 * e.g. `validateVest(path.email, suite, { focusCurrentField: true })`.
 *
 * @example
 * ```typescript
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
export function validateVest<TValue>(
  path: VestFieldPath<TValue>,
  suite: VestRunnableSuite<TValue>,
  options: ValidateVestOptions<TValue> = {},
): void {
  maybeRegisterResetOnDestroy(suite, options.resetOnDestroy ?? true);
  registerVestValidation(path, suite, {
    includeErrors: true,
    includeWarnings: options.includeWarnings ?? false,
    only: options.only,
    focusCurrentField: options.focusCurrentField,
  });
}

/**
 * Registers a `DestroyRef.onDestroy()` hook that calls `suite.reset()` when the
 * current injection context is torn down. No-op when `resetOnDestroy` is false
 * or when the suite does not expose a `reset` callable.
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
    vestRunCache.delete(suite as object);
    (suite as { reset: () => void }).reset();
  });
}

/* oxlint-enable @typescript-eslint/prefer-readonly-parameter-types */
