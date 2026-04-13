/**
 * Predicates for Angular Signal Forms `FieldState` interactivity used across
 * focus management, error summaries, and wrapper rendering so every surface
 * asks the same "can the user interact with this field?" question.
 *
 * ## Consistency rules
 *
 * - `hidden()` → non-interactive. Angular documents that hidden fields must
 *   be removed from the DOM via `@if`; we treat a rendered hidden field as a
 *   consumer mistake and refuse to focus/surface its errors defensively.
 * - `disabled()` → non-interactive. Angular excludes disabled fields from
 *   validation entirely, so in practice `errors().length === 0` usually
 *   short-circuits before these helpers run, but we check anyway.
 * - `readonly()` → **interactive**. The field is visible and focusable and
 *   its errors remain meaningful; only editing is suppressed.
 *
 * ## Why duck-typed
 *
 * Callers here typically bridge from a bare `ValidationError` whose
 * `fieldTree()` result is typed as `FieldState<unknown>` but, in tests and
 * at framework boundaries, may be a partial shape without every signal.
 * Angular 21.2's stable `FieldState` guarantees the signals on real field
 * states, but these bridge helpers still need to tolerate the partial case
 * so they default to "interactive" when a signal is missing — nothing is
 * silently hidden from screen readers.
 *
 * @internal
 */
export function isFieldStateInteractive(fieldState: object): boolean {
  const hidden = (fieldState as { hidden?: () => boolean }).hidden;
  if (typeof hidden === 'function' && hidden()) return false;

  const disabled = (fieldState as { disabled?: () => boolean }).disabled;
  if (typeof disabled === 'function' && disabled()) return false;

  return true;
}

/**
 * Duck-typed `hidden()` read. Returns `false` for shapes missing the signal.
 *
 * The wrapper component uses this (not the broader interactivity predicate)
 * because it only wants to set `[attr.hidden]` when the *field* is hidden —
 * disabling a visible field should not mark the wrapper hidden.
 *
 * @internal
 */
export function isFieldStateHidden(fieldState: object): boolean {
  const hidden = (fieldState as { hidden?: () => boolean }).hidden;
  return typeof hidden === 'function' && hidden();
}
