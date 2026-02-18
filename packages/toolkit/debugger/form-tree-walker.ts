type WalkableFormTree = Record<string | number, unknown>;

type FormTreeVisitor = (childField: () => unknown, childModel: unknown) => void;

/**
 * Walks a Signal Forms tree for object and array models.
 *
 * Traversal uses model keys/indices to access matching child field functions.
 */
export function walkFormTree(
  tree: WalkableFormTree,
  model: unknown,
  visitor: FormTreeVisitor,
): void {
  if (model && typeof model === 'object' && !Array.isArray(model)) {
    for (const key of Object.keys(model as Record<string, unknown>)) {
      const child = tree[key];
      if (typeof child !== 'function') {
        continue;
      }

      const nextModel = (model as Record<string, unknown>)[key];
      visitor(child as () => unknown, nextModel);
      walkFormTree(child as unknown as WalkableFormTree, nextModel, visitor);
    }

    return;
  }

  if (!Array.isArray(model)) {
    return;
  }

  for (let i = 0; i < model.length; i++) {
    const child = tree[i];
    if (typeof child !== 'function') {
      continue;
    }

    const nextModel = model[i];
    visitor(child as () => unknown, nextModel);
    walkFormTree(child as unknown as WalkableFormTree, nextModel, visitor);
  }
}
