import { computed, type Signal } from '@angular/core';

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
 * Minimal structural surface the factory needs from a field-identity
 * service: a reactive, pre-filtered list of hint IDs for the current field.
 *
 * Exposed as a public option type so consumers building bespoke wrappers can
 * type-import the factory's inputs without crossing into `@internal`
 * territory. Production code passes its `NgxFieldIdentity` instance in
 * directly via structural assignability.
 */
export interface HintIdsIdentityLike {
  readonly hintIds: Signal<readonly string[]>;
}

/**
 * Minimal structural surface the factory needs from a hint registry: a
 * reactive list of `{ id, fieldName }` descriptors.
 *
 * `fieldName` is `string | null`. `null` means the hint is unscoped and
 * applies to any field; a non-null value scopes the hint to the field whose
 * resolved name matches exactly (empty string included — empty string is
 * **not** treated as unscoped).
 *
 * Exposed as a public option type so consumers building bespoke wrappers can
 * type-import the factory's inputs without crossing into `@internal`
 * territory. Production code passes its `NgxSignalFormHintRegistry` instance
 * in directly via structural assignability.
 */
export interface HintIdsRegistryLike {
  readonly hints: Signal<
    readonly { readonly id: string; readonly fieldName: string | null }[]
  >;
}

/**
 * Inputs for {@link createHintIdsSignal}.
 *
 * All three properties are optional — the factory must produce a stable
 * signal even when neither an identity service nor a registry is available,
 * matching the directive shell's "no wrapper context" branch.
 */
export interface CreateHintIdsSignalOptions {
  /**
   * Optional shared field-identity-like service (typically provided by a
   * form field wrapper). When present, its pre-filtered `hintIds()` signal
   * is used as-is and no registry filtering is performed.
   */
  readonly identity?: HintIdsIdentityLike | null;

  /**
   * Optional hint-registry-like source exposing the un-filtered hint
   * descriptors. Used as a fallback when
   * {@link CreateHintIdsSignalOptions.identity} is absent. Hints are
   * filtered to those whose `fieldName` is `null` (unscoped — applies to
   * any field) or matches the resolved field name from
   * {@link CreateHintIdsSignalOptions.fieldName}.
   */
  readonly registry?: HintIdsRegistryLike | null;

  /**
   * Optional reader for the resolved field name. Only consulted on the
   * registry-fallback path; ignored when an identity service is present.
   * When omitted, the registry is read with a `null` field name, so only
   * hints whose own `fieldName` is `null` are kept.
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
 *    the reader-supplied current field name. Empty-string `fieldName` is
 *    treated as a real, scoped value — it only matches when the current
 *    field name is also the empty string.
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
      .filter(
        (hint) =>
          hint.fieldName === null || hint.fieldName === currentFieldName,
      )
      .map((hint) => hint.id);
  });
}
