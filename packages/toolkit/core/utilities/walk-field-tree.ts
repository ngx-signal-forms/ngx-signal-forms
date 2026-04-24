import type { FieldState, FieldTree } from '@angular/forms/signals';

type ArrayFieldTree = FieldTree<readonly unknown[]> & {
  readonly length: number;
  readonly [index: number]: FieldTree<unknown> | undefined;
};

type ObjectFieldTree = FieldTree<Record<string, unknown>> & {
  [Symbol.iterator](): Iterator<[string, FieldTree<unknown> | undefined]>;
};

type WalkFieldTreeEntry = {
  readonly path: string;
  readonly state: FieldState<unknown>;
};

/**
 * Visit every reachable `FieldState` in a field tree in depth-first order.
 *
 * @public
 */
export function walkFieldTree(
  root: FieldTree<unknown>,
  visitor: (state: FieldState<unknown>) => void,
): void {
  for (const state of walkFieldTreeIterable(root)) {
    visitor(state);
  }
}

/**
 * Iterate every reachable `FieldState` in a field tree in depth-first order.
 *
 * @yields Each reachable `FieldState` exactly once.
 *
 * @public
 */
export function* walkFieldTreeIterable(
  root: FieldTree<unknown>,
): Iterable<FieldState<unknown>> {
  for (const entry of walkFieldTreeEntries(root)) {
    yield entry.state;
  }
}

/**
 * Depth-first field-tree walk with stable dotted paths for internal consumers.
 *
 * @yields Each reachable `FieldState` plus its dotted path.
 *
 * @internal
 */
export function* walkFieldTreeEntries(
  root: FieldTree<unknown>,
): Iterable<WalkFieldTreeEntry> {
  const seen = new WeakSet<FieldTree<unknown>>();
  yield* walk(root, '', seen);
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

  if (Array.isArray(state.value())) {
    yield* walkArrayChildren(fieldTree as ArrayFieldTree, path, seen);
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

    yield* walk(child, joinPath(path, key), seen);
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

    yield* walk(child, joinPath(path, String(index)), seen);
  }
}

function readFieldState(
  fieldTree: FieldTree<unknown>,
  path: string,
): FieldState<unknown> {
  const state = fieldTree();

  if (
    state === null ||
    typeof state !== 'object' ||
    state.fieldTree !== fieldTree ||
    typeof state.value !== 'function' ||
    typeof state.touched !== 'function' ||
    typeof state.errors !== 'function' ||
    typeof state.errorSummary !== 'function' ||
    typeof state.submitting !== 'function' ||
    typeof state.markAsTouched !== 'function'
  ) {
    throw new Error(
      `[ngx-signal-forms] walkFieldTree expected ${formatPath(path)} to resolve to a FieldState.`,
    );
  }

  return state;
}

function hasIterator(
  fieldTree: FieldTree<unknown>,
): fieldTree is ObjectFieldTree {
  const iterator = (fieldTree as { [Symbol.iterator]?: unknown })[
    Symbol.iterator
  ];
  return typeof iterator === 'function';
}

function invalidChildError(parentPath: string, segment: string): Error {
  return new Error(
    `[ngx-signal-forms] walkFieldTree expected ${formatPath(joinPath(parentPath, segment))} to be a FieldTree.`,
  );
}

function joinPath(parentPath: string, segment: string): string {
  return parentPath === '' ? segment : `${parentPath}.${segment}`;
}

function formatPath(path: string): string {
  return path === '' ? 'the root field' : `field "${path}"`;
}
