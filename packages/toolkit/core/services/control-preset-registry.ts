import { Injectable, inject } from '@angular/core';
import { mergeNgxSignalFormControlPresets } from '../providers/control-semantics.provider';
import { NGX_SIGNAL_FORM_CONTROL_PRESETS } from '../tokens';
import type {
  NgxSignalFormControlKind,
  NgxSignalFormControlPreset,
  NgxSignalFormControlPresetOverrides,
  NgxSignalFormControlPresetRegistry,
} from '../types';

/**
 * Injectable read/merge surface over the {@link NGX_SIGNAL_FORM_CONTROL_PRESETS}
 * token.
 *
 * The token stays the source of truth: this service reads whatever effective
 * registry the *calling injector* resolves, so component- and feature-scoped
 * `provideNgxSignalFormControlPresetsForComponent(...)` overrides are observed
 * exactly like a direct token injection would. Because it is
 * `providedIn: null`, the service must be listed in a `providers` array (or
 * environment injector); each provided node captures the presets effective at
 * that node.
 *
 * It exposes an ergonomic, typed alternative to reaching into the token
 * directly:
 *
 * - {@link resolve} — the effective preset for a single control kind.
 * - {@link kinds} — the registered control kinds (drives the control-semantics
 *   directive's recognized-kind set).
 * - {@link extend} — a merge-not-replace helper that layers partial overrides
 *   on top of the current registry without discarding untouched kinds.
 *
 * @example Read the effective preset for a kind
 * ```ts
 * const registry = inject(NgxControlPresetRegistry);
 * const slider = registry.resolve('slider'); // { layout, ariaMode }
 * ```
 *
 * @example Merge-not-replace extension
 * ```ts
 * const registry = inject(NgxControlPresetRegistry);
 * // Only `slider.layout` changes; every other kind (and `slider.ariaMode`)
 * // is preserved from the current registry.
 * const next = registry.extend({ slider: { layout: 'custom' } });
 * ```
 *
 * @public
 */
@Injectable({ providedIn: null })
export class NgxControlPresetRegistry {
  // Resolved within the providing injector's context, so component- and
  // feature-scoped overrides of NGX_SIGNAL_FORM_CONTROL_PRESETS are honored.
  readonly #presets = inject(NGX_SIGNAL_FORM_CONTROL_PRESETS);

  /**
   * Returns the effective preset for a control kind in the calling injector.
   *
   * @param kind Control kind to look up.
   * @returns The resolved preset (`layout` + `ariaMode`) for the kind.
   */
  resolve(kind: NgxSignalFormControlKind): NgxSignalFormControlPreset {
    return this.#presets[kind];
  }

  /**
   * Returns the registered control kinds, derived from the effective registry.
   *
   * Consumed by `NgxSignalFormControlSemanticsDirective` as its
   * recognized-kind set so the runtime list never drifts from the registry.
   *
   * @returns A readonly array of registered control kinds.
   */
  kinds(): readonly NgxSignalFormControlKind[] {
    return Object.keys(this.#presets) as NgxSignalFormControlKind[];
  }

  /**
   * Merges partial overrides on top of the current registry and returns a new
   * fully resolved registry. Untouched kinds (and untouched fields within an
   * overridden kind) keep their current values — this merges rather than
   * replacing the whole map. The service's own state is not mutated.
   *
   * Reuses {@link mergeNgxSignalFormControlPresets} so cascade rules stay in
   * one place.
   *
   * @param overrides Partial preset overrides to layer on the current registry.
   * @returns A new fully resolved preset registry.
   */
  extend(
    overrides: NgxSignalFormControlPresetOverrides,
  ): NgxSignalFormControlPresetRegistry {
    return mergeNgxSignalFormControlPresets(this.#presets, overrides);
  }
}
