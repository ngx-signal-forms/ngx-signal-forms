/**
 * CSS selector used to discover a bound control inside a wrapper host.
 *
 * Candidate branches (each may match a bound control):
 *
 * - `input[id], textarea[id], select[id], button[type="button"][id]` —
 *   native controls with an `id`. This is the canonical case and works in
 *   both dev and prod builds.
 * - `[id][formField]` — the Signal Forms host binding on a custom control.
 * - `[id][ng-reflect-form-field]` — Angular's dev-mode reflection
 *   attribute. Populated only in dev builds and only when the `formField`
 *   input serializes to a string, so it's safe to ignore in production.
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
  'input[id], textarea[id], select[id], button[type="button"][id], [id][formField], [id][ng-reflect-form-field], [id][data-ngx-signal-form-control]';

/**
 * Locate the bound form control inside a host element.
 *
 * Returns `null` when no match is found or when the first match isn't an
 * `HTMLElement` (guards against exotic host node types).
 *
 * `hostEl` should already be scoped to the region that can only contain the
 * real control — see the document-order caveat on {@link BOUND_CONTROL_SELECTOR}.
 */
export function findBoundControl(
  // oxlint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- DOM APIs operate on mutable HTMLElement instances.
  hostEl: HTMLElement,
): HTMLElement | null {
  const element = hostEl.querySelector(BOUND_CONTROL_SELECTOR);
  return element instanceof HTMLElement ? element : null;
}
