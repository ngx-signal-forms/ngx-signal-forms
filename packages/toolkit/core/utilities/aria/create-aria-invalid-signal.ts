import { computed, type Signal } from '@angular/core';
import type { FieldState } from '@angular/forms/signals';
import { isBlockingError } from '../warning-error';

/**
 * Pure-signal factory that derives the `aria-invalid` ARIA attribute value
 * for a Signal Forms control.
 *
 * Returns one of:
 * - `'true'` — the control has at least one blocking error AND error
 *   visibility evaluates to `true` (per the configured display strategy).
 * - `'false'` — the control is reachable and visible, but is not currently
 *   announcing blocking errors, either because none exist or because error
 *   visibility currently evaluates to `false`.
 * - `null` — the field state is missing, OR the control is not currently
 *   laid out (collapsed `<details>`, `hidden`, `display: none`). Consumers
 *   should remove `aria-invalid` from the host element in this case so the
 *   attribute does not go stale on a hidden control.
 *
 * The factory is unconditional and contains no DI: callers thread DI-resolved
 * values (the visibility computed from `createErrorVisibility`, and an
 * optional `isControlVisible` predicate, typically from `NgxFieldIdentity`)
 * in as inputs. The `'manual'` ARIA-mode opt-out lives in the directive
 * shell that wires this factory, not here.
 *
 * @param fieldState A signal returning the bound `FieldState`, or `null`
 *   when no field is bound yet.
 * @param visibility A signal that is `true` when errors should be visible
 *   under the active display strategy. Typically the result of
 *   `createErrorVisibility(fieldState)`.
 * @param isControlVisible Optional signal that is `false` when the control
 *   is collapsed/hidden from layout. When omitted, visibility is assumed.
 * @returns A computed signal with the resolved `aria-invalid` value.
 *
 * @example
 * ```typescript
 * const fieldState = computed(() => formField.state());
 * const visibility = createErrorVisibility(fieldState);
 * const ariaInvalid = createAriaInvalidSignal(fieldState, visibility);
 * ```
 *
 * @public
 */
export function createAriaInvalidSignal(
  fieldState: Signal<FieldState<unknown> | null>,
  visibility: Signal<boolean>,
  isControlVisible?: Signal<boolean>,
): Signal<'true' | 'false' | null> {
  return computed(() => {
    const state = fieldState();

    if (!state) {
      return null;
    }

    if (isControlVisible && !isControlVisible()) {
      return null;
    }

    const hasBlockingError = state.errors().some(isBlockingError);

    return hasBlockingError && visibility() ? 'true' : 'false';
  });
}
