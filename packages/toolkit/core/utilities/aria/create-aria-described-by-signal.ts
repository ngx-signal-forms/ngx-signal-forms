import { computed, type Signal } from '@angular/core';
import type { FieldState } from '@angular/forms/signals';
import { generateErrorId, generateWarningId } from '../field-resolution';
import { isBlockingError, isWarningError } from '../warning-error';

/**
 * Reactive reader for the resolved field name. Invoked inside the resulting
 * computed so signal-backed readers stay tracked. Returns `null` when no
 * field name has been resolved yet.
 */
export type AriaDescribedByFieldNameReader = () => string | null;

/**
 * Reader for non-managed `aria-describedby` IDs that should be preserved
 * verbatim (hints stamped by template, descriptions, etc.). Called per
 * computed evaluation so consumers re-evaluating their preserved list see
 * fresh values without re-creating the factory.
 */
export type AriaDescribedByPreservedIdsReader = () => string | null;

/**
 * Inputs for {@link createAriaDescribedBySignal}.
 *
 * `fieldState`, `hintIds`, and `visibility` are signals so the resulting
 * `aria-describedby` value tracks each of them reactively. `preservedIds`
 * and `fieldName` are plain readers so consumers can thread DOM reads or
 * service queries through without forcing them into a `Signal` shape.
 */
export interface CreateAriaDescribedBySignalOptions {
  /**
   * The bound `FieldState` (or `null` when no field is bound yet).
   * Drives error/warning detection on the same source of truth as the
   * sibling factories (`createAriaInvalidSignal`, `createAriaRequiredSignal`).
   */
  readonly fieldState: Signal<FieldState<unknown> | null>;

  /**
   * Hint IDs to append after the preserved list. Typically comes from
   * {@link createHintIdsSignal} but can be any signal of strings.
   */
  readonly hintIds: Signal<readonly string[]>;

  /**
   * Visibility computed (typically from `createErrorVisibility`). When
   * `true`, error/warning IDs are appended whenever the field has matching
   * errors. When `false`, no error or warning IDs are appended even if the
   * field is invalid.
   */
  readonly visibility: Signal<boolean>;

  /**
   * Reader for non-managed IDs (e.g. existing hint IDs stamped into the
   * DOM by the template, or description IDs the wrapper has registered).
   * Called per computed evaluation; consumers re-evaluating their preserved
   * list see fresh values automatically.
   */
  readonly preservedIds: AriaDescribedByPreservedIdsReader;

  /**
   * Reader for the resolved field name. Without a field name no managed
   * error / warning IDs can be generated, so the factory falls back to
   * returning the preserved list verbatim.
   */
  readonly fieldName: AriaDescribedByFieldNameReader;
}

/**
 * Pure-signal factory that composes the `aria-describedby` attribute value
 * for a Signal Forms control.
 *
 * Mirrors the resolution previously inlined in
 * `NgxSignalFormAutoAria.ariaDescribedBy`:
 *
 * 1. Read the preserved (non-managed) ID list — these are IDs the toolkit
 *    does not own (template-stamped hints, descriptions, etc.).
 * 2. Append every hint ID from the supplied `hintIds` signal that is not
 *    already preserved. Hints are managed by the toolkit, but consumers
 *    may still preserve them when re-binding.
 * 3. When `visibility()` is `true` AND the field has at least one blocking
 *    error, append `generateErrorId(fieldName)`.
 * 4. When `visibility()` is `true` AND the field has at least one warning
 *    error, append `generateWarningId(fieldName)`.
 * 5. Deduplicate while preserving insertion order.
 * 6. Return the joined list, or `null` when nothing accumulated, so
 *    consumers can drop the attribute entirely.
 *
 * The factory is unconditional and contains no DI: the manual-mode opt-out
 * lives in the directive shell that wires this factory, not here. That
 * keeps the contract clean and the factory reusable from any composition
 * surface (custom wrappers built on Material, PrimeNG, Spartan, etc.).
 *
 * @public
 */
export function createAriaDescribedBySignal(
  options: CreateAriaDescribedBySignalOptions,
): Signal<string | null> {
  const { fieldState, hintIds, visibility, preservedIds, fieldName } = options;

  return computed((): string | null => {
    const resolvedFieldName = fieldName();
    const preserved = preservedIds();

    // Without a field name no managed IDs can be generated. Mirror the
    // directive's historical behaviour and return the preserved list
    // verbatim so existing aria-describedby values remain intact.
    if (!resolvedFieldName) {
      return preserved;
    }

    const parts: string[] = preserved
      ? preserved.split(/\s+/).filter(Boolean)
      : [];

    for (const hintId of hintIds()) {
      if (!parts.includes(hintId)) {
        parts.push(hintId);
      }
    }

    const state = fieldState();
    const isVisible = visibility();

    if (state && isVisible) {
      const errors = state.errors();

      if (errors.some(isBlockingError)) {
        const errorId = generateErrorId(resolvedFieldName);
        if (!parts.includes(errorId)) {
          parts.push(errorId);
        }
      }

      if (errors.some(isWarningError)) {
        const warningId = generateWarningId(resolvedFieldName);
        if (!parts.includes(warningId)) {
          parts.push(warningId);
        }
      }
    }

    return parts.length > 0 ? parts.join(' ') : null;
  });
}
