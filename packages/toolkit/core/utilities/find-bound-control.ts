import { isHtmlElement } from './dom-guards';

/**
 * CSS selector used to discover a bound control inside a wrapper host.
 *
 * Candidate branches (each may match a bound control):
 *
 * - `input[id], textarea[id], select[id], button[type="button"][id]` —
 *   native controls with an `id`. This is the canonical case and works in
 *   both dev and prod builds.
 * - `[role="combobox"][id]` — a non-native combobox trigger with an `id`.
 *   This covers readonly select widgets whose trigger is a `div` or another
 *   element that is not a native form control.
 * - `[id][formField]` — the Signal Forms host binding on a custom control.
 * - `[id][ng-reflect-form-field]` — Angular's reflection attribute. Since
 *   Angular 22 it is opt-in: an application only carries it when it calls
 *   `provideNgReflectAttributes()`, and even then only when the `formField`
 *   input serializes to a string. Kept as a courtesy branch for those
 *   applications; nothing in the toolkit depends on it.
 * - `[id][data-ngx-signal-form-control]` — the stable attribute written
 *   by `NgxSignalFormControlSemanticsDirective`. Recommended fallback for
 *   custom control hosts that don't carry a native `[formField]` binding
 *   themselves.
 *
 * **Not a tiered resolution order.** This is one comma-separated selector
 * passed to a single `querySelector` call, which returns the first match in
 * *document order* across the whole subtree — not the first branch above
 * that has a match. A `[prefix]`/label-slot element that happens to satisfy
 * any branch (e.g. `<button prefix type="button" id="toggle">`) can
 * therefore win over the real control found elsewhere in the subtree.
 * Callers that care about this (`NgxFormFieldWrapper`, via
 * `readFormFieldWrapperDomSnapshot`) scope the element passed to
 * {@link findBoundControl} to the region that can only contain the real
 * control (its `__main` slot) rather than the whole wrapper host.
 *
 * Centralized here (rather than co-located with the form-field wrapper) so
 * `NgxFieldIdentity` and any future surface that needs to discover a bound
 * control share one resolution rule.
 */
export const BOUND_CONTROL_SELECTOR =
  'input[id], textarea[id], select[id], button[type="button"][id], [role="combobox"][id], [id][formField], [id][ng-reflect-form-field], [id][data-ngx-signal-form-control]';

/**
 * Locate the bound form control inside a host element.
 *
 * Returns `null` when no match is found or when the first match isn't an
 * `HTMLElement` (guards against exotic host node types). The element check
 * goes through {@link isHtmlElement} so a server render pass, where the DOM
 * constructors are not global, gets `null` rather than a `ReferenceError`.
 *
 * `hostEl` should already be scoped to the region that can only contain the
 * real control — see the document-order caveat on {@link BOUND_CONTROL_SELECTOR}.
 */
export function findBoundControl(
  // oxlint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- DOM APIs operate on mutable HTMLElement instances.
  hostEl: HTMLElement,
): HTMLElement | null {
  const element = hostEl.querySelector(BOUND_CONTROL_SELECTOR);
  return isHtmlElement(element) ? element : null;
}
