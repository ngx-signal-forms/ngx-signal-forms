type WalkableFormTree = Record<string | number, unknown>;

type FormTreeVisitor = (childField: () => unknown, childModel: unknown) => void;

/**
 * Default recursion depth limit for `walkFormTree`. Real Signal Forms trees
 * are shallow (rarely past ~5 levels), so 100 is a wide safety margin that
 * still catches accidental cycles without truncating legitimate forms.
 */
const DEFAULT_MAX_DEPTH = 100;

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
 *
 * @param tree The form tree node to walk.
 * @param model The model value paired with `tree`.
 * @param visitor Called for each child field/model pair before recursing.
 * @param maxDepth Defensive recursion limit. The walker stops descending past
 *   `maxDepth` levels, which guards against pathological cyclic structures
 *   without affecting realistic forms (default: 100).
 */
export function walkFormTree(
  tree: WalkableFormTree,
  model: unknown,
  visitor: FormTreeVisitor,
  maxDepth: number = DEFAULT_MAX_DEPTH,
): void {
  walkFormTreeInternal(tree, model, visitor, maxDepth, 0);
}

function walkFormTreeInternal(
  tree: WalkableFormTree,
  model: unknown,
  visitor: FormTreeVisitor,
  maxDepth: number,
  depth: number,
): void {
  if (depth >= maxDepth) return;

  if (isObjectModel(model)) {
    for (const key of Object.keys(model)) {
      const child = tree[key];
      if (!isFieldFunction(child)) continue;

      const nextModel = model[key];
      visitor(child, nextModel);
      walkFormTreeInternal(
        child as unknown as WalkableFormTree,
        nextModel,
        visitor,
        maxDepth,
        depth + 1,
      );
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
    walkFormTreeInternal(
      child as unknown as WalkableFormTree,
      nextModel,
      visitor,
      maxDepth,
      depth + 1,
    );
  }
}
