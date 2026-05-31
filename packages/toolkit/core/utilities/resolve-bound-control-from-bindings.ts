import type { FieldState } from '@angular/forms/signals';

/**
 * Minimal FieldState contract required to read Angular's native form-field
 * binding registry.
 *
 * Picked from the real `FieldState` so the type stays in lock-step with the
 * framework, while keeping the surface this module touches small enough to be
 * satisfied by partial/mock field states in tests. `formFieldBindings` is a
 * signal of the `[formField]` (and custom-control) directive instances Angular
 * has registered against this field — each exposes the DOM `element` hosting
 * the binding.
 */
export type FormFieldBindingsState = Pick<
  FieldState<unknown>,
  'formFieldBindings'
>;

/**
 * Resolve the bound control element from Angular's native binding registry.
 *
 * Prefers `fieldState.formFieldBindings()` — the canonical, framework-owned
 * source of truth for which DOM element a field is bound to — over probing the
 * host DOM with a CSS selector. Returns the first binding whose host `element`
 * is an `HTMLElement` mounted inside `hostEl`.
 *
 * Scoping to `hostEl.contains(...)` matters because a single `FieldTree` can be
 * bound to multiple controls (e.g. the same field rendered in two wrappers, or
 * a radio group spread across siblings); only the binding projected into *this*
 * wrapper host is relevant to the wrapper's chrome and ARIA derivations.
 *
 * Returns `null` (so callers fall back to their existing discovery path) when:
 * - `fieldState` is a partial/mock state without a `formFieldBindings` signal
 *   (the wrapper's unit tests bind a plain mock signal), or
 * - no control has registered a binding yet (the registry can be empty for a
 *   render or two before the projected `[formField]` directive initializes), or
 * - the wrapper hosts a plain control with no `[formField]` directive of its own
 *   (the wrapper carries the `FieldTree`; the inner control is a bare
 *   `<input id="...">`), which never appears in the registry.
 *
 * @internal
 */
export function resolveBoundControlFromBindings(
  fieldState: FormFieldBindingsState | null | undefined,
  // oxlint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- DOM APIs operate on mutable HTMLElement instances.
  hostEl: HTMLElement,
): HTMLElement | null {
  const formFieldBindings = fieldState?.formFieldBindings;
  if (typeof formFieldBindings !== 'function') {
    return null;
  }

  for (const binding of formFieldBindings()) {
    const element = binding.element;
    if (element instanceof HTMLElement && hostEl.contains(element)) {
      return element;
    }
  }

  return null;
}
