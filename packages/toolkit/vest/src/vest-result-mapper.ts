import type {
  ReadonlyFieldTree,
  ValidationError,
} from '@angular/forms/signals';
import {
  VEST_KEY_SEPARATOR,
  type VestFailureMessages,
  type VestResultLike,
} from './vest-run-coordinator';
import { resolveVestValidationFieldTree } from './vest-adapter';

/* oxlint-disable @typescript-eslint/prefer-readonly-parameter-types -- mirrors the readonly-parameter suppression on the pipeline this module was extracted from (see `./vest-adapter.ts`); the underlying Angular Signal Forms / Vest types are not modeled as readonly. */

// This module is the private "result mapping" seam named by ADR-0009
// (`docs/decisions/0009-vest-run-coordination-is-its-own-seam.md`, closing
// note: "Further splitting (field-name resolution, result mapping) stays
// open. One seam at a time."). It owns the transformation from Vest
// `getErrors()`/`getWarnings()` output to typed
// `ValidationError.WithFieldTree[]` -- normalization, FNV-1a kind-segment
// hashing, occurrence dedup (keyed on the rendered segment), and sync/async
// delta filtering.
//
// Field-name RESOLUTION (walking a Vest field path against the bound Angular
// field tree) stays in `./vest-adapter.ts` per ADR-0009 -- it is a different
// concern from mapping the already-resolved messages into validation errors.
// `toVestValidationErrors` below still needs a per-entry resolved field tree,
// so it imports `resolveVestValidationFieldTree` from `./vest-adapter`. That
// import is the one deliberate two-way edge between this module and
// `./vest-adapter.ts` (which imports the mapping entry points back): both
// files are internal to this package, never reached directly from outside
// it, and the shared functions are only ever invoked from within other
// functions -- never at module top-level -- so the circular import resolves
// safely under ESM's live-binding semantics.
//
// Not exported from `./index.ts` or any other barrel: this module has zero
// public surface. `./vest-adapter.ts` is still the documented public home for
// every behavior this module implements.

const VEST_KIND_SEGMENT_MAX_LEN = 48;

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
 * Adapter-local severity mapping used to generate Angular validation error
 * kinds. Vest exposes warn/error behavior through result selectors, but not as
 * a public severity union type.
 */
export type VestValidationMode = 'error' | 'warning';

/**
 * Canonical representation of a Vest message after normalizing field targeting
 * and duplicate-message occurrence tracking.
 */
export interface VestValidationEntry {
  fieldPath: string;
  message: string;
  occurrence: number;
}

/**
 * Snapshot of the initial sync result from a Vest run. Async completion uses
 * this to emit only the delta once pending tests finish.
 */
export interface VestValidationSnapshot {
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
 * edge back to `./vest-adapter.ts` and deepen the module cycle. A rename
 * there must be mirrored here.
 */
export interface VestValidationFlags {
  readonly includeErrors: boolean;
  readonly includeWarnings: boolean;
}

// Those same three helpers stay generic in `F` for their `result` parameter:
// each calls `getErrors()`/`getWarnings()` with ZERO arguments only — the
// whole-suite overload, identical for every field-name union — so accepting
// `VestResultLike<F>` costs nothing and spares every call site holding a
// typed suite's narrower result a cast back to `VestResultLike<string>`.

/**
 * Compact FNV-1a hash returning a 4-character lowercase hex digest. Used by
 * {@link normalizeWarningKindSegment} as a collision-safe suffix whenever
 * normalization was lossy — whether from character folding/case folding or
 * from truncation past {@link VEST_KIND_SEGMENT_MAX_LEN}.
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
 * Despite the name, this is mode-agnostic: {@link createVestValidationKind}
 * calls it for BOTH blocking-error and warning kinds, not just warnings — the
 * name predates the toolkit surfacing Vest `test()` failures as `vest:*`
 * kinds alongside `warn()` results as `warn:vest:*`. Kept as-is (see the
 * caller's fallback-literal note below) rather than renamed, to avoid
 * unrelated churn across every call site.
 *
 * The sanitize step is LOSSY — case folding and collapsing every run of
 * non `[a-z0-9]` characters to a single `-` can map distinct inputs onto the
 * same segment (e.g. `'user.email'` and `'user_email'` both normalize to
 * `'user-email'`; so do `'Email'` and `'email'`). Whenever normalization was
 * lossy — i.e. the normalized string differs from the original `value` —
 * or the normalized value exceeds {@link VEST_KIND_SEGMENT_MAX_LEN}, a short
 * FNV-1a hash suffix of the *original* value is appended so that two inputs
 * which fold or truncate to the same segment do not collide. A `value` that
 * survives normalization unchanged (already lowercase, already
 * alnum-and-hyphen-only, within the length limit) is by definition
 * collision-free and returned as-is, with no hash suffix.
 *
 * A `value` that folds to nothing (e.g. punctuation-only, like `'!!!'`)
 * returns the BARE hash with no leading hyphen — joining an empty folded
 * segment to the hash with `-` would reintroduce the leading hyphen the trim
 * step above just stripped, producing both an invalid CSS-identifier start
 * and an ugly kind (`warn:vest:email:-a1b2:0`). Only a literal empty-string
 * `value` (which normalizes to `''` non-lossily, so no hash is appended)
 * still reaches the `|| 'field'`/`|| 'warning'` fallback in
 * {@link createVestValidationKind}.
 */
function normalizeWarningKindSegment(value: string): string {
  const normalized = value
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/gu, '-')
    .replaceAll(/^-+|-+$/gu, '');

  const lossy =
    normalized !== value || normalized.length > VEST_KIND_SEGMENT_MAX_LEN;

  if (!lossy) {
    return normalized;
  }

  const truncated =
    normalized.length > VEST_KIND_SEGMENT_MAX_LEN
      ? normalized.slice(0, VEST_KIND_SEGMENT_MAX_LEN)
      : normalized;

  const hash = fnv1a4Hex(value);

  return truncated === '' ? hash : `${truncated}-${hash}`;
}

/**
 * Creates a deterministic Angular validation error kind for a mapped Vest
 * error or warning.
 *
 * The `'field'`/`'warning'` fallback literals below are generic placeholders
 * for "the sanitized segment came out empty" — which, since
 * {@link normalizeWarningKindSegment} now appends a hash suffix to any
 * lossily-normalized input (including one that folds to nothing, e.g. a
 * message that is only punctuation), can only happen for a literal empty
 * `''` fieldPath/message: normalizing `''` is non-lossy (it stays `''`), so
 * no hash is appended and the fallback literal applies. They are NOT a mode
 * indicator. In particular, the
 * `'warning'` fallback also applies when `mode === 'error'`, so a blocking
 * error whose message sanitizes to empty can produce a kind that literally
 * contains the substring `warning` (e.g. `vest:field:warning:0`). This is a
 * cosmetic quirk of the placeholder text, not a mode misclassification: the
 * kind's PREFIX (`vest:` vs `warn:vest:`, from {@link VEST_ERROR_KIND_PREFIX}
 * / {@link VEST_WARNING_KIND_PREFIX}) is what callers actually match on to
 * tell errors and warnings apart.
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
 * Annotates repeated messages with an occurrence index so duplicate kinds
 * remain deterministic and unique.
 *
 * The occurrence count is keyed on the EXACT message segment
 * {@link createVestValidationKind} renders into the `kind` string — the
 * normalized segment (see {@link normalizeWarningKindSegment}), falling
 * back to the literal `'warning'` when normalization empties it out (a
 * message like `'!!!'` has no alphanumeric characters to keep). Two
 * distinct raw messages can render the same segment two different ways:
 *
 * - Both normalize to the same non-empty segment (e.g. `'Too long!'` and
 *   `'Too long?'` both normalize to `too-long`).
 * - One normalizes to empty and falls back to `'warning'`, while another
 *   message is literally `'warning'` (e.g. `'!!!'` and `'warning'` both
 *   render the `warning` segment).
 *
 * Keying on anything other than the rendered segment — the raw message, or
 * the normalized segment without the fallback — would give two such
 * messages the same `occurrence: 0` and let
 * {@link createVestValidationKind} emit the same `kind` for two different
 * `ValidationError`s.
 */
function createVestEntriesForField(
  fieldPath: string,
  messages: readonly string[],
): readonly VestValidationEntry[] {
  const occurrences = new Map<string, number>();

  return messages.map((message) => {
    const renderedSegment = normalizeWarningKindSegment(message) || 'warning';
    const occurrence = occurrences.get(renderedSegment) ?? 0;
    occurrences.set(renderedSegment, occurrence + 1);

    return {
      fieldPath,
      message,
      occurrence,
    };
  });
}

/**
 * Normalizes Vest selector output into a flat list of field-targeted messages.
 *
 * Only takes the whole-suite {@link VestFailureMessages} map, not Vest's
 * field-scoped `getErrors('fieldName')`/`getWarnings('fieldName')` array
 * shape: every internal call site (`createVestValidationSnapshot`,
 * `mapVestValidationResult`) calls `getErrors()`/`getWarnings()` with zero
 * arguments only, so the array shape never reaches this function — verified
 * against vest@6.3.2. A prior version of this helper also accepted and
 * branched on the array shape; that branch was dead code and has been
 * removed. See {@link VestResultLike}'s doc comment for why the array-typed
 * overload still exists on the result type itself.
 */
function toVestValidationEntries(
  messages: VestFailureMessages | undefined,
): readonly VestValidationEntry[] {
  if (!messages) {
    return [];
  }

  return Object.entries(messages).flatMap(([fieldPath, fieldMessages]) =>
    createVestEntriesForField(fieldPath, fieldMessages),
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
    const targetFieldTree = resolveVestValidationFieldTree(
      fieldTree,
      fieldPath,
    );

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
export function createVestValidationSnapshot<F extends string = string>(
  result: VestResultLike<F>,
  options: VestValidationFlags,
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
 * Every entry's `fieldPath` is resolved relative to the validator's own bound
 * field tree (`fieldTree` — per ADR-0008, the only base there is), so no
 * separate "which fields belong to this registration" filter is needed: each
 * entry already routes to its own correct target via
 * `resolveVestValidationFieldTree` (`./vest-adapter.ts`, per ADR-0009).
 */
export function mapVestValidationResult<F extends string = string>(
  result: VestResultLike<F>,
  fieldTree: ReadonlyFieldTree<unknown>,
  options: VestValidationFlags,
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
export function shouldDeferVestWarnings<F extends string = string>(
  options: VestValidationFlags,
  initialResult: VestResultLike<F>,
): boolean {
  return (
    options.includeErrors &&
    options.includeWarnings &&
    initialResult.isPending()
  );
}

/* oxlint-enable @typescript-eslint/prefer-readonly-parameter-types */
