import type { ReadonlyFieldTree } from '@angular/forms/signals';
import { describe, expect, it } from 'vitest';
import {
  createVestValidationSnapshot,
  mapVestValidationResult,
  shouldDeferVestWarnings,
  VEST_ERROR_KIND_PREFIX,
  VEST_WARNING_KIND_PREFIX,
  type VestValidationSnapshot,
} from './vest-result-mapper';
import type { VestResultLike } from './vest-run-coordinator';

/**
 * Unit coverage for the result-mapping pipeline in isolation -- no Vest
 * `create()`/`test()`/`warn()` suite, no `TestBed`, no rendered component.
 * `mapVestValidationResult`, `createVestValidationSnapshot` and
 * `shouldDeferVestWarnings` are driven directly with a hand-rolled
 * {@link VestResultLike}, the same way `vest-run-coordinator.spec.ts` drives
 * the coordinator with a hand-rolled suite. End-to-end behaviour through a
 * real suite stays covered by `validate-vest.spec.ts`,
 * `vest-adapter.spec.ts` and `vest-adapter-guarantees.spec.ts`.
 */

/** A field tree stand-in whose Vest field paths never resolve (no own
 * properties), so every entry lands on this SAME root tree via the
 * `'virtual'` fallback documented on `resolveVestFieldName` in
 * `./vest-adapter.ts`. That fallback is field-name-resolution behaviour, not
 * this module's concern -- these tests only assert on the mapped `kind`,
 * `message` and that `fieldTree` is passed through unchanged. */
const fieldTree = (() => undefined) as unknown as ReadonlyFieldTree<unknown>;

/** Builds a minimal {@link VestResultLike} from plain error/warning maps. */
function fakeResult(
  errors: Readonly<Record<string, readonly string[]>>,
  warnings: Readonly<Record<string, readonly string[]>> = {},
  pending = false,
): VestResultLike {
  return {
    getErrors: () => errors,
    getWarnings: () => warnings,
    isPending: () => pending,
  } as VestResultLike;
}

describe('mapVestValidationResult', () => {
  it('maps a blocking error to a vest: kind with the bound field tree', () => {
    const result = fakeResult({ email: ['Email is required'] });

    const mapped = mapVestValidationResult(result, fieldTree, {
      includeErrors: true,
      includeWarnings: false,
    });

    expect(mapped).toHaveLength(1);
    expect(mapped[0]).toMatchObject({
      message: 'Email is required',
      fieldTree,
    });
    expect(mapped[0]?.kind.startsWith(VEST_ERROR_KIND_PREFIX)).toBe(true);
  });

  it('maps a warn() message to a warn:vest: kind', () => {
    const result = fakeResult({}, { email: ['Consider a longer email'] });

    const mapped = mapVestValidationResult(result, fieldTree, {
      includeErrors: false,
      includeWarnings: true,
    });

    expect(mapped).toHaveLength(1);
    expect(mapped[0]?.kind.startsWith(VEST_WARNING_KIND_PREFIX)).toBe(true);
  });

  it('skips errors when includeErrors is false, and warnings when includeWarnings is false', () => {
    const result = fakeResult(
      { email: ['Email is required'] },
      { email: ['Consider a longer email'] },
    );

    expect(
      mapVestValidationResult(result, fieldTree, {
        includeErrors: false,
        includeWarnings: true,
      }),
    ).toHaveLength(1);
    expect(
      mapVestValidationResult(result, fieldTree, {
        includeErrors: true,
        includeWarnings: false,
      }),
    ).toHaveLength(1);
    expect(
      mapVestValidationResult(result, fieldTree, {
        includeErrors: false,
        includeWarnings: false,
      }),
    ).toHaveLength(0);
  });

  describe('warning-kind segment normalization', () => {
    it('leaves an already-clean field/message pair unchanged (no hash suffix)', () => {
      const result = fakeResult({ email: ['too-long'] });

      const [mapped] = mapVestValidationResult(result, fieldTree, {
        includeErrors: true,
        includeWarnings: false,
      });

      // Both 'email' and 'too-long' are already lowercase, alnum-and-hyphen
      // only, and within VEST_KIND_SEGMENT_MAX_LEN -- normalization is a
      // no-op (non-lossy), so no FNV-1a hash suffix is appended.
      expect(mapped?.kind).toBe(`${VEST_ERROR_KIND_PREFIX}email:too-long:0`);
    });

    it('appends a hash suffix whenever folding changes the input (case, whitespace, punctuation)', () => {
      const result = fakeResult({ email: ['Required'] });

      const [mapped] = mapVestValidationResult(result, fieldTree, {
        includeErrors: true,
        includeWarnings: false,
      });

      // 'Required' folds to 'required', which differs from the original --
      // lossy, so an FNV-1a hash suffix of the ORIGINAL text is appended.
      expect(mapped?.kind).toBe(
        `${VEST_ERROR_KIND_PREFIX}email:required-51e4:0`,
      );
    });

    it('appends a distinct FNV-1a hash suffix so distinct inputs that fold to the same segment do not collide', () => {
      // 'user.email' and 'user_email' both fold to 'user-email', but are
      // different raw field paths -- each gets its own hash of the ORIGINAL
      // value, computed independently of this module's own hashing pass.
      const result = fakeResult({
        'user.email': ['Too long!'],
        user_email: ['Too long?'],
      });

      const mapped = mapVestValidationResult(result, fieldTree, {
        includeErrors: true,
        includeWarnings: false,
      });

      expect(mapped.map((entry) => entry.kind)).toEqual([
        `${VEST_ERROR_KIND_PREFIX}user-email-5ea7:too-long-7e11:0`,
        `${VEST_ERROR_KIND_PREFIX}user-email-2981:too-long-6411:0`,
      ]);
    });

    it('falls back to the bare hash (no leading hyphen) when a message folds to nothing', () => {
      const result = fakeResult({ email: ['!!!'] });

      const [mapped] = mapVestValidationResult(result, fieldTree, {
        includeErrors: true,
        includeWarnings: false,
      });

      expect(mapped?.kind).toBe(`${VEST_ERROR_KIND_PREFIX}email:2d53:0`);
    });
  });

  describe('occurrence-key dedup', () => {
    it('numbers repeated identical messages on the same field 0, 1, 2, ...', () => {
      // Same message repeated three times -> same rendered segment each
      // time (`required-51e4`), so the occurrence index is the ONLY thing
      // keeping the three kinds apart.
      const result = fakeResult({
        email: ['Required', 'Required', 'Required'],
      });

      const mapped = mapVestValidationResult(result, fieldTree, {
        includeErrors: true,
        includeWarnings: false,
      });

      expect(mapped.map((entry) => entry.kind)).toEqual([
        `${VEST_ERROR_KIND_PREFIX}email:required-51e4:0`,
        `${VEST_ERROR_KIND_PREFIX}email:required-51e4:1`,
        `${VEST_ERROR_KIND_PREFIX}email:required-51e4:2`,
      ]);
    });

    it('gives two DIFFERENT messages that fold to the same core segment distinct kinds without touching the occurrence counter', () => {
      // 'Too long!' and 'Too long?' both strip down to the same core
      // segment ('too-long'), but normalization is lossy for both (each
      // differs from its original), so each gets its own FNV-1a hash suffix
      // of its own original text. The two kinds are already distinct at
      // occurrence 0 -- no fold-collision ever reaches the occurrence
      // counter itself.
      const result = fakeResult({ email: ['Too long!', 'Too long?'] });

      const mapped = mapVestValidationResult(result, fieldTree, {
        includeErrors: true,
        includeWarnings: false,
      });

      expect(mapped.map((entry) => entry.kind)).toEqual([
        `${VEST_ERROR_KIND_PREFIX}email:too-long-7e11:0`,
        `${VEST_ERROR_KIND_PREFIX}email:too-long-6411:0`,
      ]);
    });
  });

  describe('sync/async delta filtering', () => {
    it('subtracts baseline entries so only the newly resolved delta is mapped', () => {
      const result = fakeResult({ email: ['Email is required'] });
      const baseline: VestValidationSnapshot = {
        errors: [
          { fieldPath: 'email', message: 'Email is required', occurrence: 0 },
        ],
        warnings: [],
      };

      const mapped = mapVestValidationResult(
        result,
        fieldTree,
        { includeErrors: true, includeWarnings: false },
        baseline,
      );

      expect(mapped).toHaveLength(0);
    });

    it('computes occurrence numbers from the FULL entry list before subtracting the baseline', () => {
      // Two identical messages; the baseline already reported ONE of them.
      // The occurrence index each entry gets is assigned against the full,
      // unfiltered list (0 then 1) -- filtering removes the FIRST matching
      // occurrence it walks into, so the entry that survives keeps its
      // ORIGINAL occurrence (1), not a renumbered 0.
      const result = fakeResult({ email: ['Required', 'Required'] });
      const baseline: VestValidationSnapshot = {
        errors: [{ fieldPath: 'email', message: 'Required', occurrence: 0 }],
        warnings: [],
      };

      const mapped = mapVestValidationResult(
        result,
        fieldTree,
        { includeErrors: true, includeWarnings: false },
        baseline,
      );

      expect(mapped).toHaveLength(1);
      expect(mapped[0]?.kind).toBe(
        `${VEST_ERROR_KIND_PREFIX}email:required-51e4:1`,
      );
    });

    it('only subtracts warnings from the warnings baseline, not from errors (and vice versa)', () => {
      const result = fakeResult(
        { email: ['Email is required'] },
        { email: ['Email is required'] },
      );
      const baseline: VestValidationSnapshot = {
        errors: [
          { fieldPath: 'email', message: 'Email is required', occurrence: 0 },
        ],
        warnings: [],
      };

      const mapped = mapVestValidationResult(
        result,
        fieldTree,
        { includeErrors: true, includeWarnings: true },
        baseline,
      );

      // The error was already in the baseline (subtracted); the identically
      // worded warning was not, so it still comes through.
      expect(mapped).toHaveLength(1);
      expect(mapped[0]?.kind.startsWith(VEST_WARNING_KIND_PREFIX)).toBe(true);
    });

    it('maps every entry when no baseline is supplied', () => {
      const result = fakeResult({ email: ['Email is required'] });

      const mapped = mapVestValidationResult(result, fieldTree, {
        includeErrors: true,
        includeWarnings: false,
      });

      expect(mapped).toHaveLength(1);
    });
  });
});

describe('createVestValidationSnapshot', () => {
  it('captures errors and warnings from the result when both flags are on', () => {
    const result = fakeResult(
      { email: ['Email is required'] },
      { email: ['Consider a longer email'] },
    );

    const snapshot = createVestValidationSnapshot(result, {
      includeErrors: true,
      includeWarnings: true,
    });

    expect(snapshot.errors).toEqual([
      { fieldPath: 'email', message: 'Email is required', occurrence: 0 },
    ]);
    expect(snapshot.warnings).toEqual([
      { fieldPath: 'email', message: 'Consider a longer email', occurrence: 0 },
    ]);
  });

  it('captures an empty array for a flag that is off, even when the result has messages', () => {
    const result = fakeResult(
      { email: ['Email is required'] },
      { email: ['Consider a longer email'] },
    );

    const snapshot = createVestValidationSnapshot(result, {
      includeErrors: true,
      includeWarnings: false,
    });

    expect(snapshot.errors).toHaveLength(1);
    expect(snapshot.warnings).toEqual([]);
  });
});

describe('shouldDeferVestWarnings', () => {
  it('defers only when errors and warnings are both included AND the result is pending', () => {
    const pending = fakeResult({}, {}, true);
    const settled = fakeResult({}, {}, false);

    expect(
      shouldDeferVestWarnings(
        { includeErrors: true, includeWarnings: true },
        pending,
      ),
    ).toBe(true);

    expect(
      shouldDeferVestWarnings(
        { includeErrors: true, includeWarnings: true },
        settled,
      ),
    ).toBe(false);

    // No blocking error of its own to protect (warning-only registration) --
    // never defers, even while pending.
    expect(
      shouldDeferVestWarnings(
        { includeErrors: false, includeWarnings: true },
        pending,
      ),
    ).toBe(false);

    // No warnings requested at all -- nothing to defer.
    expect(
      shouldDeferVestWarnings(
        { includeErrors: true, includeWarnings: false },
        pending,
      ),
    ).toBe(false);
  });
});
