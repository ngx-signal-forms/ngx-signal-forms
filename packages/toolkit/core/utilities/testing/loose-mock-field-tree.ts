import type { FieldTree } from '@angular/forms/signals';

/** Wraps a partial test state in a callable field tree with a back-reference. */
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
