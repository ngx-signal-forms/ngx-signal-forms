import { computed, isDevMode, type Signal } from '@angular/core';
import { createDevWarnOnce } from './dev-warn-once';

/**
 * Creates a `computed()` signal counting a character-count value's length:
 * `string.length` for strings, `array.length` for arrays, `0` for
 * `null`/`undefined` (treated as "empty"), and `0` — plus a one-shot dev-mode
 * `console.warn` — for anything else.
 *
 * Shared by every caller that needs "character-count length + unsupported
 * value diagnostic" semantics without necessarily going through the full
 * `createCharacterCount` factory (e.g. `NgxHeadlessCharacterCount`'s
 * `currentLength`, and `NgxFormFieldCharacterCount`'s no-`maxLength`
 * fallback, which has no limit to hand `createCharacterCount`). Both call
 * sites get the identical diagnostic instead of one silently re-deriving the
 * length logic without it.
 *
 * @remarks Does not require an injection context (only creates a `computed()`
 * signal internally).
 *
 * @param value - Reader for the field's raw value. Called reactively on
 *   every recomputation — pass a tracked signal read (e.g. `() =>
 *   field()().value()`).
 * @param component - Name reported in the dev warning, e.g.
 *   `[ngx-signal-forms] <component>: unsupported value type — …`. Required
 *   rather than defaulted — every current caller passes its own name so the
 *   warning always points at the component the misconfiguration lives in.
 */
export function createCharacterCountLengthSignal(
  value: () => unknown,
  component: string,
): Signal<number> {
  // One-shot guard so the dev warning for an unsupported value type fires at
  // most once per returned signal (i.e. once per caller) instead of on every
  // re-computation.
  const warnUnsupportedValue = createDevWarnOnce();

  return computed(() => {
    const currentValue = value();
    if (typeof currentValue === 'string') return currentValue.length;
    if (Array.isArray(currentValue)) return currentValue.length;
    // The type descriptor (including `constructor?.name`) is dev-diagnostic
    // work only — gate the whole branch on `isDevMode()` so production never
    // computes it, even though `devWarnOnce` itself would no-op the console
    // call.
    if (isDevMode() && currentValue !== null && currentValue !== undefined) {
      // Log a type descriptor only — never the raw value, which may contain
      // user-entered data and end up in dev consoles, CI logs, or screenshots.
      const valueType =
        typeof currentValue === 'object'
          ? (currentValue.constructor?.name ?? 'object')
          : typeof currentValue;
      warnUnsupportedValue(
        'warn',
        `[ngx-signal-forms] ${component}: unsupported value type — expected \`string\` or \`readonly string[]\`, got`,
        valueType,
        '— rendering length as 0.',
      );
    }
    return 0;
  });
}
