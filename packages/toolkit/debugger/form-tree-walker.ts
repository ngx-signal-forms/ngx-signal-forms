import { isDevMode, untracked } from '@angular/core';

type WalkableFormTree = Record<string | number, unknown>;

/**
 * Per-reference dev warning guards. Populated on first encounter so a
 * single malformed subtree doesn't spam the console on every render.
 * Keyed by the callable so the same function invocation is deduped
 * across successive walker passes within a session.
 */
const warnedSniffThrows = new WeakSet<() => unknown>();
const warnedMalformedChildren = new WeakSet<() => unknown>();

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
 *
 * Invoking a `FieldTree` reads reactive `FieldState` signals, so calling
 * this from inside a `computed`/`effect` would silently subscribe the
 * caller to every field the sniff touches. We wrap the call in
 * `untracked(...)` so the guard stays a pure shape-check regardless of the
 * surrounding reactive context.
 */
export function isFieldStateLike(value: unknown): value is () => unknown {
  if (typeof value !== 'function') return false;
  const candidate = value as () => unknown;
  try {
    const result = untracked(() => candidate());
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
  } catch (err) {
    if (isDevMode() && !warnedSniffThrows.has(candidate)) {
      warnedSniffThrows.add(candidate);
      // oxlint-disable-next-line no-console -- dev-mode misconfiguration signal
      console.warn(
        '[ngx-signal-forms/debugger] walker: candidate FieldTree threw when invoked; treating as non-field and skipping subtree.',
        err,
      );
    }
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
      // The root was already shape-validated at `walkFormTree` entry and
      // Angular's `FieldTree` typing guarantees nested children share the
      // shape. The `isFieldStateLike` call doubles field invocations, so
      // keep it as a dev-only defensive net against malformed inputs and
      // skip it in prod.
      if (isDevMode() && !isFieldStateLike(child)) {
        warnMalformedChild(child);
        continue;
      }

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
    // Dev-only defensive guard — see matching comment in the object branch.
    if (isDevMode() && !isFieldStateLike(child)) {
      warnMalformedChild(child);
      continue;
    }

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

function warnMalformedChild(child: () => unknown): void {
  if (warnedMalformedChildren.has(child)) return;
  warnedMalformedChildren.add(child);
  // oxlint-disable-next-line no-console -- dev-mode misconfiguration signal
  console.warn(
    '[ngx-signal-forms/debugger] walker: encountered a child callable that does not resolve to a `FieldState`-shaped value. ' +
      'The walker skipped it. This usually means the tree was hand-rolled or the Angular Signal Forms surface changed shape.',
  );
}
