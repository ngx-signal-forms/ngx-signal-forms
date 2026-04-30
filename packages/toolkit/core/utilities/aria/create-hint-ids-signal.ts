import { computed, type Signal } from '@angular/core';
import type { NgxSignalFormHintRegistry } from '../../tokens';
import type { NgxFieldIdentity } from '../../services/field-identity';

/**
 * Reactive reader for the current field's name. Accepts a plain getter or a
 * `Signal<string | null>`; both are invoked inside the resulting computed so
 * signal-based readers stay tracked.
 */
export type HintIdsFieldNameReader = () => string | null;

/**
 * Public alias for the signal returned by {@link createHintIdsSignal}.
 *
 * Exposed so consumers composing custom wrappers can type their own
 * `aria-describedby` aggregators without re-deriving the shape.
 */
export type HintIdsSignal = Signal<readonly string[]>;

/**
 * Inputs for {@link createHintIdsSignal}.
 *
 * All three properties are optional — the factory must produce a stable
 * signal even when neither an identity service nor a registry is available,
 * matching the directive shell's "no wrapper context" branch.
 */
export interface CreateHintIdsSignalOptions {
  /**
   * Optional shared field-identity service (typically provided by a form
   * field wrapper). When present, its pre-filtered `hintIds()` signal is
   * used as-is and no registry filtering is performed.
   */
  readonly identity?: NgxFieldIdentity | null;

  /**
   * Optional hint registry exposing the un-filtered hint descriptors. Used
   * as a fallback when {@link CreateHintIdsSignalOptions.identity} is
   * absent. Hints are filtered to those that either have no `fieldName`
   * (treated as "applies to any field") or whose `fieldName` matches the
   * resolved field name from {@link CreateHintIdsSignalOptions.fieldName}.
   */
  readonly registry?: NgxSignalFormHintRegistry | null;

  /**
   * Optional reader for the resolved field name. Only consulted on the
   * registry-fallback path; ignored when an identity service is present.
   * When omitted, the registry is read with a `null` field name, so only
   * hints without an own `fieldName` are kept.
   */
  readonly fieldName?: HintIdsFieldNameReader;
}

/**
 * Pure-signal factory that produces the `aria-describedby` hint-ID list for
 * a single field.
 *
 * Mirrors the resolution order previously inlined in
 * `NgxSignalFormAutoAria.#hintIds`:
 *
 * 1. If an identity service is provided, return its pre-filtered
 *    `hintIds()` signal verbatim — the wrapper has already correlated
 *    hints to this field.
 * 2. Otherwise, if a registry is provided, return the registry's hints
 *    filtered to those whose `fieldName` is `null` (unscoped) or matches
 *    the reader-supplied current field name.
 * 3. Otherwise, return an empty list.
 *
 * No DI is performed inside the factory; consumers thread DI-resolved
 * values in via {@link CreateHintIdsSignalOptions}. This keeps the factory
 * testable without `TestBed` and reusable from any injection context.
 *
 * @public
 */
export function createHintIdsSignal(
  options: CreateHintIdsSignalOptions = {},
): HintIdsSignal {
  const { identity, registry, fieldName } = options;

  return computed((): readonly string[] => {
    if (identity) {
      return identity.hintIds();
    }

    if (!registry) {
      return [];
    }

    const currentFieldName = fieldName ? fieldName() : null;

    return registry
      .hints()
      .filter((hint) => !hint.fieldName || hint.fieldName === currentFieldName)
      .map((hint) => hint.id);
  });
}
