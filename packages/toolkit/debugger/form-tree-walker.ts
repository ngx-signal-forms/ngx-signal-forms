type WalkableFormTree = Record<string | number, unknown>;

/**
 * Visitor invoked for every visited field in the form tree (including the
 * root). Each call receives the field function, the paired model value, and
 * the joined dotted path (e.g. `users.0.name`, or `''` for the root).
 */
type FormTreeVisitor = (
  childField: () => unknown,
  childModel: unknown,
  path: string,
) => void;

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
 * Runtime guard: `true` if `value` looks like an Angular Signal Forms
 * `FieldTree` — a callable whose invocation returns an object exposing at
 * least one of the `FieldState`-shaped signals (`errors`, `value`, or
 * `touched`).
 *
 * Used both as a public check (e.g. from the component) and as a safety net
 * inside the walker so that malformed inputs (a plain `() => 42`) never
 * propagate into `for…in`/`for…of` loops below.
 */
export function isFieldStateLike(value: unknown): value is () => unknown {
  if (typeof value !== 'function') return false;
  try {
    const result = (value as () => unknown)();
    if (result === null || typeof result !== 'object') return false;
    const state = result as {
      errors?: unknown;
      value?: unknown;
      touched?: unknown;
    };
    return (
      typeof state.errors === 'function' ||
      typeof state.value === 'function' ||
      typeof state.touched === 'function'
    );
  } catch {
    return false;
  }
}

/**
 * Walks a Signal Forms tree for object and array models.
 *
 * Traversal uses model keys/indices to access matching child field functions.
 * Signal Forms' `Field<T>` is both callable and indexable, so the recursive
 * call treats each child function as a subtree via a load-bearing cast — the
 * only `unknown`-widening step that the type system can't verify on its own.
 *
 * The visitor is invoked for the root node (with `path = ''`) and every
 * descendant. Each descendant receives a joined dotted path like
 * `users.0.name`, which the debugger uses as a stable track key and to tag
 * collected errors.
 *
 * @param tree The form tree node to walk.
 * @param model The model value paired with `tree`.
 * @param visitor Called for each field/model pair (root included).
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
  if (!isFieldStateLike(tree)) return;

  visitor(tree as unknown as () => unknown, model, '');
  walkFormTreeInternal(tree, model, visitor, maxDepth, 0, '');
}

function walkFormTreeInternal(
  tree: WalkableFormTree,
  model: unknown,
  visitor: FormTreeVisitor,
  maxDepth: number,
  depth: number,
  pathPrefix: string,
): void {
  if (depth >= maxDepth) return;

  if (isObjectModel(model)) {
    for (const key of Object.keys(model)) {
      const child = tree[key];
      if (!isFieldFunction(child)) continue;
      if (!isFieldStateLike(child)) continue;

      const nextModel = model[key];
      const childPath = pathPrefix === '' ? key : `${pathPrefix}.${key}`;
      visitor(child, nextModel, childPath);
      walkFormTreeInternal(
        child as unknown as WalkableFormTree,
        nextModel,
        visitor,
        maxDepth,
        depth + 1,
        childPath,
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
    if (!isFieldStateLike(child)) continue;

    const nextModel = model[i];
    const childPath = pathPrefix === '' ? String(i) : `${pathPrefix}.${i}`;
    visitor(child, nextModel, childPath);
    walkFormTreeInternal(
      child as unknown as WalkableFormTree,
      nextModel,
      visitor,
      maxDepth,
      depth + 1,
      childPath,
    );
  }
}
