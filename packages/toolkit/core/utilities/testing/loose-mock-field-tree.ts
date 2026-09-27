import type { FieldTree } from '@angular/forms/signals';

/**
 * Loosely-typed `FieldTree` mock: spreads a plain `state` record onto a
 * callable object, with a `.fieldTree` back-reference to itself.
 *
 * Deliberately untyped against `FieldState` (unlike
 * `./mock-field-tree.ts`'s `createMockFieldTree`) — callers that only need a
 * handful of ad-hoc accessors (`submitWithWarnings`'s tests read `submitting`,
 * `pending`, `errorSummary`, and a few callback spies, not the full
 * `FieldState` surface) use this instead of hand-rolling the same
 * spread-and-back-reference shape per spec file.
 *
 * Shared by `submission-helpers.delegate.spec.ts` and
 * `submission-helpers.coverage.spec.ts`, which used to each define this
 * function identically.
 *
 * @internal
 */
export function createLooseMockFieldTree<TValue>(
  state: Readonly<Record<string, unknown>>,
): FieldTree<TValue> {
  let fieldTree!: FieldTree<TValue>;

  fieldTree = (() => ({
    ...state,
    get fieldTree() {
      return fieldTree;
    },
  })) as FieldTree<TValue>;

  return fieldTree;
}
