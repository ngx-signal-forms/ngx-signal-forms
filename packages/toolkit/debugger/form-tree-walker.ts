type WalkableFormTree = Record<string | number, unknown>;

type FormTreeVisitor = (childField: () => unknown, childModel: unknown) => void;

function isObjectModel(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isArrayModel(value: unknown): value is readonly unknown[] {
  return Array.isArray(value);
}

function isFieldFunction(value: unknown): value is () => unknown {
  return typeof value === 'function';
}

/**
 * Walks a Signal Forms tree for object and array models.
 *
 * Traversal uses model keys/indices to access matching child field functions.
 * Signal Forms' `Field<T>` is both callable and indexable, so the recursive
 * call treats each child function as a subtree via a load-bearing cast — the
 * only `unknown`-widening step that the type system can't verify on its own.
 */
export function walkFormTree(
  tree: WalkableFormTree,
  model: unknown,
  visitor: FormTreeVisitor,
): void {
  if (isObjectModel(model)) {
    for (const key of Object.keys(model)) {
      const child = tree[key];
      if (!isFieldFunction(child)) continue;

      const nextModel = model[key];
      visitor(child, nextModel);
      walkFormTree(child as unknown as WalkableFormTree, nextModel, visitor);
    }

    return;
  }

  if (!isArrayModel(model)) {
    return;
  }

  for (let i = 0; i < model.length; i++) {
    const child = tree[i];
    if (!isFieldFunction(child)) continue;

    const nextModel = model[i];
    visitor(child, nextModel);
    walkFormTree(child as unknown as WalkableFormTree, nextModel, visitor);
  }
}
