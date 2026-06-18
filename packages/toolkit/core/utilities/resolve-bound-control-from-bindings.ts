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
 * is an `HTMLElement` mounted inside `hostEl` **and carrying a non-empty `id`**.
 *
 * Scoping to `hostEl.contains(...)` matters because a single `FieldTree` can be
 * bound to multiple controls (e.g. the same field rendered in two wrappers, or
 * a radio group spread across siblings); only the binding projected into *this*
 * wrapper host is relevant to the wrapper's chrome and ARIA derivations.
 *
 * ## Why the `id` guard is load-bearing (native-vs-fallback invariant)
 *
 * The legacy discovery path (`findBoundControl`'s `BOUND_CONTROL_SELECTOR`)
 * only ever matches elements that carry an `[id]`. To preserve PR #92's
 * "identical output" invariant, the native path must agree: it may only win
 * for an element the fallback could also have produced. Without this guard, an
 * id-less `[formField]` host — e.g. `<my-control formField><input id="x">…` —
 * would let the wrapper element (`my-control`, no id) win over the inner
 * `<input id="x">`, nulling out `inputId`/`resolvedFieldName` and diverging
 * from the established CSS-selector behaviour. By skipping id-less binding
 * elements here, an id-less native host falls through to the existing probe,
 * which still finds the inner `<input id="x">`.
 *
 * Returns `null` (so callers fall back to their existing discovery path) when:
 * - `fieldState` is a partial/mock state without a `formFieldBindings` signal
 *   (the wrapper's unit tests bind a plain mock signal), or
 * - no control has registered a binding yet (the registry can be empty for a
 *   render or two before the projected `[formField]` directive initializes), or
 * - the wrapper hosts a plain control with no `[formField]` directive of its own
 *   (the wrapper carries the `FieldTree`; the inner control is a bare
 *   `<input id="...">`), which never appears in the registry, or
 * - every registered binding element inside this host lacks an `id` (the native
 *   match would diverge from the CSS-selector fallback — see above).
 *
 * @packageInternal Used only within `@ngx-signal-forms/toolkit` package entries.
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
    // Require a non-empty `id`: the CSS-selector fallback only ever matches
    // elements with an `[id]`, so accepting an id-less native host here would
    // break the "identical output" invariant (an id-less `[formField]` wrapper
    // would shadow its inner `<input id>`). Falling through lets the probe find
    // that inner control instead.
    if (
      element instanceof HTMLElement &&
      element.id.length > 0 &&
      hostEl.contains(element)
    ) {
      return element;
    }
  }

  return null;
}
