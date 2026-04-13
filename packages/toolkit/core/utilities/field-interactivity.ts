/**
 * Duck-typed predicates for Angular Signal Forms `FieldState` interactivity.
 *
 * These helpers let toolkit code (focus management, error summaries, wrapper
 * rendering) consistently ask "is the user able to interact with this field?"
 * without hard-coupling to the `FieldState` interface — which keeps the
 * toolkit robust against `CompatFieldState`, mock states in tests, and
 * future Angular shape evolutions that may omit either signal.
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
 * When the shape is missing `hidden`/`disabled` signals, the defaults err on
 * the side of "treat as interactive" so nothing silently disappears.
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
