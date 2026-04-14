import { resource } from '@angular/core';
import {
  type FieldTree,
  type SchemaPath,
  type SchemaPathTree,
  type ValidationError,
  validateAsync,
  validateTree,
} from '@angular/forms/signals';
import type { SuiteResult } from 'vest';

/* oxlint-disable @typescript-eslint/prefer-readonly-parameter-types -- Angular Signal Forms validator callbacks and lightweight path parsing helpers operate on framework/runtime types that are not modeled as readonly. */

export interface ValidateVestOptions {
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
  run(value: TValue): VestResultLike | PromiseLike<VestResultLike>;
}

/**
 * Cached Vest run keyed by suite instance and Angular field tree so sync and
 * async validation can share a single suite execution.
 */
interface VestRunCacheEntry<TValue> {
  readonly value: TValue;
  readonly runResult: VestResultLike | PromiseLike<VestResultLike>;
  readonly initialResult: VestResultLike | undefined;
}

/**
 * Internal registration flags that decide whether blocking errors, warnings, or
 * both should be mapped into Angular Signal Forms.
 */
interface VestValidationRegistrationOptions {
  readonly includeErrors: boolean;
  readonly includeWarnings: boolean;
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
type VestRunCache = WeakMap<FieldTree<unknown>, VestRunCacheEntry<unknown>>;

const VEST_PATH_SEGMENT = /[^.[\]]+/g;
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

function isFieldTree(value: unknown): value is FieldTree<unknown> {
  return typeof value === 'function';
}

/**
 * Sanitizes arbitrary Vest field/message fragments so generated validation
 * kinds remain stable and CSS/DOM-friendly.
 */
function normalizeWarningKindSegment(value: string): string {
  return value
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/^-+|-+$/g, '')
    .slice(0, 48);
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
    return `warn:vest:${normalizedField}:${normalizedMessage}:${occurrence}`;
  }

  return `vest:${normalizedField}:${normalizedMessage}:${occurrence}`;
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
 * Resolves a Vest warning path to the matching Angular field tree. When the
 * target path is missing, the current field tree is used as a safe fallback.
 */
function resolveVestWarningFieldTree(
  fieldTree: FieldTree<unknown>,
  fieldPath: string,
): FieldTree<unknown> {
  let current: unknown = fieldTree;

  for (const segment of parseVestFieldPath(fieldPath)) {
    if (
      !current ||
      (typeof current !== 'function' && typeof current !== 'object')
    ) {
      return fieldTree;
    }

    const next = Reflect.get(Object(current), segment);
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
 * Reuses an existing Vest run for the same suite, Angular field tree, and model
 * reference, or executes the suite once and caches the result.
 */
function getOrCreateVestRun<TValue>(
  suite: Pick<VestRunnableSuite<TValue>, 'run'>,
  fieldTree: FieldTree<TValue>,
  value: TValue,
): VestRunCacheEntry<TValue> {
  const suiteCache = getVestSuiteRunCache(suite as object);
  const cachedEntry = suiteCache.get(fieldTree as FieldTree<unknown>);

  if (cachedEntry && Object.is(cachedEntry.value, value)) {
    return {
      value,
      runResult: cachedEntry.runResult,
      initialResult: cachedEntry.initialResult,
    };
  }

  const runResult = suite.run(value);
  const nextEntry: VestRunCacheEntry<TValue> = {
    value,
    runResult,
    initialResult: isVestResultLike(runResult) ? runResult : undefined,
  };

  suiteCache.set(fieldTree as FieldTree<unknown>, nextEntry);
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
  fieldTree: FieldTree<unknown>,
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
  options: VestValidationRegistrationOptions,
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
  fieldTree: FieldTree<unknown>,
  options: VestValidationRegistrationOptions,
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
  suite: Pick<VestRunnableSuite<TValue>, 'run'>,
  options: VestValidationRegistrationOptions,
): void {
  validateTree(path, ({ fieldTree, value }) => {
    const entry = getOrCreateVestRun(suite, fieldTree, value());

    if (!entry.initialResult) {
      return [];
    }

    return mapVestValidationResult(entry.initialResult, fieldTree, options);
  });

  validateAsync(path, {
    params: ({ fieldTree, value }) => {
      const entry = getOrCreateVestRun(suite, fieldTree, value());

      if (!entry.initialResult?.isPending()) {
        return;
      }

      return {
        runResult: entry.runResult,
        initialSnapshot: createVestValidationSnapshot(
          entry.initialResult,
          options,
        ),
      } satisfies PendingVestValidationPayload;
    },
    factory: (pendingValidation) => {
      return resource({
        params: pendingValidation,
        loader: async ({ params }) => {
          const result = await params.runResult;
          if (!isVestResultLike(result)) {
            return;
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
        options,
        pendingResult.initialSnapshot,
      );
    },
    onError: () => [],
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
  suite: Pick<VestRunnableSuite<TValue>, 'run'>,
): void {
  registerVestValidation(path, suite, {
    includeErrors: false,
    includeWarnings: true,
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
 * `ngx-signal-form-field-wrapper`, and related components can render them as
 * polite, non-blocking guidance.
 *
 * @example
 * ```typescript
 * import { form } from '@angular/forms/signals';
 * import { create, enforce, test } from 'vest';
 * import { validateVest } from '@ngx-signal-forms/toolkit/vest';
 *
 * interface LoginModel {
 *   email: string;
 * }
 *
 * const loginSuite = create((data: LoginModel) => {
 *   test('email', 'Email is required', () => {
 *     enforce(data.email).isNotBlank();
 *   });
 * });
 *
 * const loginModel = signal<LoginModel>({ email: '' });
 * const loginForm = form(loginModel, (path) => {
 *   validateVest(path, loginSuite, { includeWarnings: true });
 * });
 * ```
 */
export function validateVest<TValue>(
  path: VestFieldPath<TValue>,
  suite: Pick<VestRunnableSuite<TValue>, 'run'>,
  options: ValidateVestOptions = {},
): void {
  registerVestValidation(path, suite, {
    includeErrors: true,
    includeWarnings: options.includeWarnings ?? false,
  });
}

/* oxlint-enable @typescript-eslint/prefer-readonly-parameter-types */
