import { computed, isDevMode, type Signal } from '@angular/core';
import type { FieldTree } from '@angular/forms/signals';

/**
 * Whether a form tree contains any required and/or any optional leaf field.
 *
 * Both flags can be `true` at once (a mixed form). An empty form — or one with
 * no leaf fields — reports `false` for both.
 *
 * @public
 */
export interface FieldOptionality {
  readonly hasRequired: boolean;
  readonly hasOptional: boolean;
}

type AnyFieldTree = FieldTree<unknown>;

/**
 * A `FieldTree` node is iterable when it is a container (object subfields or an
 * array). Object subfields iterate as `[key, childTree]` entries; array-likes
 * iterate as the child `FieldTree`s directly. Leaf (control) nodes are plain
 * callables without `[Symbol.iterator]`.
 */
function isIterableNode(node: unknown): node is Iterable<unknown> {
  return (
    (typeof node === 'object' || typeof node === 'function') &&
    node !== null &&
    typeof (node as { [Symbol.iterator]?: unknown })[Symbol.iterator] ===
      'function'
  );
}

/**
 * Yield every leaf (control) `FieldTree` reachable from `node`, depth-first.
 *
 * Container nodes are descended into and never yielded themselves; only leaves
 * carry the `required()` state that marking decisions are based on.
 *
 * Caveat: an array of primitives (e.g. a `string[]` token field bound to one
 * control) is treated as a container, so its elements — not the array node —
 * are visited. For the common case (required-ness on scalar leaves) this is
 * correct; arrays bound as a single control are a known edge that does not
 * contribute its array-level required state.
 *
 * @yields Each leaf (control) `FieldTree` in depth-first order.
 */
function* walkLeaves(node: AnyFieldTree): Generator<AnyFieldTree> {
  if (!isIterableNode(node)) {
    yield node;
    return;
  }

  for (const entry of node as Iterable<unknown>) {
    // Array-like nodes yield the child FieldTree (a callable) directly; object
    // subfields yield `[key, childTree]` tuples.
    const child: AnyFieldTree | undefined =
      typeof entry === 'function'
        ? (entry as AnyFieldTree)
        : Array.isArray(entry)
          ? (entry[1] as AnyFieldTree | undefined)
          : undefined;

    if (child === undefined) {
      // A `[key, undefined]` tuple (a sparse / unresolved child) is a benign
      // skip. Anything else means the FieldTree iteration shape is not what we
      // expect — its leaves are silently dropped from the summary, so surface
      // it in dev mode rather than letting the legend quietly under-count.
      if (isDevMode() && !(Array.isArray(entry) && entry[1] == null)) {
        // oxlint-disable-next-line no-console -- dev-mode shape-mismatch signal
        console.error(
          '[ngx-signal-forms] field-optionality: unrecognised FieldTree ' +
            `iteration entry (${typeof entry}); its leaves are NOT counted. ` +
            'This usually means the @angular/forms FieldTree structure changed.',
        );
      }
      continue;
    }

    yield* walkLeaves(child);
  }
}

function readRequired(leaf: AnyFieldTree): boolean {
  const state = leaf() as { required?: () => boolean } | null | undefined;

  if (state == null || typeof state.required !== 'function') {
    // Degrade to "optional" rather than throwing, so a single unexpected node
    // can't break the whole legend. But a present-yet-non-callable `required`
    // (or a nullish state) is a contract violation, not a normal leaf — flag it
    // in dev mode so a FieldTree API change is loud rather than silent.
    if (isDevMode() && (state == null || 'required' in state)) {
      // oxlint-disable-next-line no-console -- dev-mode shape-mismatch signal
      console.error(
        '[ngx-signal-forms] field-optionality: leaf state is missing a ' +
          'callable `required()`; treating the field as optional. The ' +
          '@angular/forms FieldState contract may have changed.',
      );
    }
    return false;
  }

  return state.required();
}

/**
 * Synchronously summarise whether a form tree has any required / optional leaf
 * fields. Reads each leaf's `required()` signal, so calling this inside a
 * `computed()` (or `effect()`) makes the result reactive — conditionally
 * required fields update it automatically.
 *
 * @param tree A form `FieldTree` (typically a form root or a subtree).
 * @public
 */
export function summarizeFieldOptionality(
  tree: AnyFieldTree,
): FieldOptionality {
  let hasRequired = false;
  let hasOptional = false;

  for (const leaf of walkLeaves(tree)) {
    if (readRequired(leaf)) {
      hasRequired = true;
    } else {
      hasOptional = true;
    }

    // Both flags are OR-accumulators. Once both are `true` the result is
    // saturated — no leaf, tracked or not, can change `{ true, true }` — so
    // breaking early is safe. (Only leaves read before the break are
    // signal-tracked, but any transition that could matter re-runs the whole
    // computed anyway, re-reading from the top.)
    if (hasRequired && hasOptional) {
      break;
    }
  }

  return { hasRequired, hasOptional };
}

/**
 * Reactive summary of required / optional leaf fields across a form tree.
 *
 * Accepts a reader so the source tree can be reactive (e.g. an `input()` that
 * may be `undefined` until resolved). When the reader returns `null` /
 * `undefined`, both flags are `false`.
 *
 * Does not require an injection context (only creates `computed`s).
 *
 * @example
 * ```ts
 * const { hasRequired, hasOptional } = createFieldOptionalitySummary(
 *   () => this.formTree(),
 * );
 * ```
 *
 * @public
 */
export function createFieldOptionalitySummary(
  treeSource: () => AnyFieldTree | null | undefined,
): {
  readonly hasRequired: Signal<boolean>;
  readonly hasOptional: Signal<boolean>;
} {
  const summary = computed<FieldOptionality>(() => {
    const tree = treeSource();
    return tree
      ? summarizeFieldOptionality(tree)
      : { hasRequired: false, hasOptional: false };
  });

  return {
    hasRequired: computed(() => summary().hasRequired),
    hasOptional: computed(() => summary().hasOptional),
  };
}
