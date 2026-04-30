import { untracked } from '@angular/core';
import type {
  FieldState,
  FieldTree,
  MaybeFieldTree,
} from '@angular/forms/signals';
import {
  isFieldStateForTree,
  REQUIRED_FIELD_STATE_METHODS,
} from './field-tree-contract';

type ArrayFieldTree = FieldTree<readonly unknown[]> & {
  readonly length: number;
  readonly [index: number]: MaybeFieldTree<unknown> | undefined;
};

type ObjectFieldTree = FieldTree<Record<string, unknown>> & {
  [Symbol.iterator](): Iterator<[string, MaybeFieldTree<unknown> | undefined]>;
};

type WalkFieldTreeEntry = {
  readonly path: string;
  readonly state: FieldState<unknown>;
};

/**
 * Thrown when {@link walkFieldTreeEntries} encounters a value that does not satisfy
 * the FieldTree / FieldState contract. Always loud — never swallowed —
 * because malformed trees indicate a wiring mistake (mock missing required
 * methods, child typed as a non-callable value, etc.) rather than a runtime
 * condition the toolkit can recover from.
 *
 * @public
 */
export class InvalidFieldTreeError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'InvalidFieldTreeError';
  }
}

/**
 * Depth-first field-tree walk with stable dotted paths for consumers that
 * need stable per-field identity (e.g. `@for` track keys in the debugger).
 *
 * @yields Each reachable `FieldState` plus its dotted path.
 *
 * @public
 */
export function* walkFieldTreeEntries<TModel>(
  root: FieldTree<TModel>,
): Iterable<WalkFieldTreeEntry> {
  // Angular does not produce cycles, but a hand-rolled or malformed tree can.
  // Guarding by reference keeps traversal total and prevents infinite recursion.
  const seen = new WeakSet<FieldTree<unknown>>();
  yield* walk(root as FieldTree<unknown>, '', seen);
}

function* walk(
  fieldTree: FieldTree<unknown>,
  path: string,
  seen: WeakSet<FieldTree<unknown>>,
): Iterable<WalkFieldTreeEntry> {
  if (seen.has(fieldTree)) {
    return;
  }

  seen.add(fieldTree);

  const state = readFieldState(fieldTree, path);
  yield { path, state };

  // Detect array vs object via the model value but read it `untracked` so
  // consuming `computed()` calls (e.g. the debugger snapshot) do not subscribe
  // to every leaf field's value and recompute on unrelated value changes.
  // A purely structural check would be ideal, but Angular's `FieldTree` is a
  // callable whose `.length` is the function's arity (always 0) — collides
  // with empty-array length, ruling out the obvious property probe.
  if (isArrayFieldTree(fieldTree, state)) {
    yield* walkArrayChildren(fieldTree, path, seen);
    return;
  }

  if (!hasIterator(fieldTree)) {
    return;
  }

  for (const [key, child] of fieldTree) {
    if (child === undefined) {
      continue;
    }

    if (typeof child !== 'function') {
      throw invalidChildError(path, key);
    }

    yield* walk(child as FieldTree<unknown>, joinPath(path, key), seen);
  }
}

function* walkArrayChildren(
  fieldTree: ArrayFieldTree,
  path: string,
  seen: WeakSet<FieldTree<unknown>>,
): Iterable<WalkFieldTreeEntry> {
  for (let index = 0; index < fieldTree.length; index++) {
    const child = fieldTree[index];
    if (child === undefined) {
      continue;
    }

    if (typeof child !== 'function') {
      throw invalidChildError(path, String(index));
    }

    yield* walk(
      child as FieldTree<unknown>,
      joinPath(path, String(index)),
      seen,
    );
  }
}

function readFieldState(
  fieldTree: FieldTree<unknown>,
  path: string,
): FieldState<unknown> {
  const candidate: unknown = fieldTree();

  if (!isFieldStateForTree(candidate, fieldTree)) {
    throw invalidFieldStateError(path);
  }

  return candidate;
}

function isArrayFieldTree(
  fieldTree: FieldTree<unknown>,
  state: FieldState<unknown>,
): fieldTree is ArrayFieldTree {
  // Read the model value untracked so this structural decision does not
  // subscribe consuming `computed()` callers to every field's value signal.
  return Array.isArray(untracked(() => state.value()));
}

function hasIterator(
  fieldTree: FieldTree<unknown>,
): fieldTree is ObjectFieldTree {
  const iterator = (fieldTree as { [Symbol.iterator]?: unknown })[
    Symbol.iterator
  ];
  return typeof iterator === 'function';
}

function invalidFieldStateError(path: string): InvalidFieldTreeError {
  return new InvalidFieldTreeError(
    `[ngx-signal-forms] walkFieldTreeEntries expected ${formatPath(path)} to resolve to a FieldState. ` +
      `A FieldState must expose ${REQUIRED_FIELD_STATE_METHODS.join(', ')} as functions and a back-reference (\`state.fieldTree === fieldTree\`).`,
  );
}

function invalidChildError(
  parentPath: string,
  segment: string,
): InvalidFieldTreeError {
  return new InvalidFieldTreeError(
    `[ngx-signal-forms] walkFieldTreeEntries expected ${formatPath(joinPath(parentPath, segment))} to be a FieldTree.`,
  );
}

function joinPath(parentPath: string, segment: string): string {
  return parentPath === '' ? segment : `${parentPath}.${segment}`;
}

function formatPath(path: string): string {
  return path === '' ? 'the root field' : `field "${path}"`;
}
