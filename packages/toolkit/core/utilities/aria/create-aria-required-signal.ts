import { computed, type Signal } from '@angular/core';
import type { FieldState } from '@angular/forms/signals';

/**
 * Minimal FieldState contract required for aria-required resolution.
 */
export type AriaRequiredFieldState = Pick<FieldState<unknown>, 'required'>;

/**
 * Pure signal factory that resolves the `aria-required` attribute value from
 * a reactive `FieldState`.
 *
 * Returns `'true'` when the field's `required()` signal is `true`, and `null`
 * otherwise (so the caller can drop the attribute entirely rather than
 * emitting `aria-required="false"`).
 *
 * The factory is unconditional — manual-mode opt-out lives in the directive
 * shell that consumes this factory, not here. That keeps the contract clean:
 * `fieldState in → ARIA out`.
 *
 * @param fieldState Reactive field state. `null` short-circuits to `null` so
 *   consumers don't have to inline the null branch at every call site.
 * @returns A computed `Signal<'true' | null>` driven by `fieldState().required()`.
 *
 * @example Compose inside a custom wrapper
 * ```typescript
 * const ariaRequired = createAriaRequiredSignal(
 *   computed(() => this.formField()()),
 * );
 * // ariaRequired() → 'true' | null
 * ```
 *
 * @public
 */
export function createAriaRequiredSignal(
  fieldState: Signal<AriaRequiredFieldState | null>,
): Signal<'true' | null> {
  return computed(() => {
    const state = fieldState();

    if (!state) {
      return null;
    }

    return state.required() ? 'true' : null;
  });
}
