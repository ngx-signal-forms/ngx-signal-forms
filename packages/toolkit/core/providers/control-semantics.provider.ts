import type { EnvironmentProviders, Provider } from '@angular/core';
import { inject, isDevMode, makeEnvironmentProviders } from '@angular/core';
import {
  DEFAULT_NGX_SIGNAL_FORM_CONTROL_PRESETS,
  NGX_SIGNAL_FORM_CONTROL_PRESETS,
} from '../tokens';
import type {
  NgxSignalFormControlPresetOverrides,
  NgxSignalFormControlPresetRegistry,
} from '../types';
import {
  isNgxSignalFormControlKind,
  NGX_SIGNAL_FORM_CONTROL_KIND_VALUES,
} from '../utilities/control-semantics';
import { createCascadingResolver } from '../utilities/cascading-resolver';

/**
 * Merges partial preset overrides onto a base registry, returning a new fully
 * resolved registry. Override fields cascade
 * (`input → parent → built-in default`) per kind, and unknown kinds are
 * ignored (with a dev-mode warning) so the result always satisfies the full
 * {@link NgxSignalFormControlPresetRegistry} shape.
 *
 * This is the single source of truth for preset cascade logic. The DI
 * providers use it. Call it yourself to extend a registry you read from
 * {@link NGX_SIGNAL_FORM_CONTROL_PRESETS} without mutating it.
 *
 * @param base Base registry to merge onto, or `null` to start
 *   from {@link DEFAULT_NGX_SIGNAL_FORM_CONTROL_PRESETS}.
 * @param presets Partial overrides to apply on top of the base registry.
 * @returns A new fully resolved preset registry (the input is not mutated).
 *
 * @example Extend the effective presets
 * ```ts
 * const presets = inject(NGX_SIGNAL_FORM_CONTROL_PRESETS);
 * // Only `slider.layout` changes. Every other kind and field is kept.
 * const next = mergeNgxSignalFormControlPresets(presets, {
 *   slider: { layout: 'custom' },
 * });
 * ```
 *
 * @public
 */
export function mergeNgxSignalFormControlPresets(
  base: NgxSignalFormControlPresetRegistry | null,
  presets: NgxSignalFormControlPresetOverrides,
): NgxSignalFormControlPresetRegistry {
  const parentPresets = base ?? DEFAULT_NGX_SIGNAL_FORM_CONTROL_PRESETS;
  const normalized: NgxSignalFormControlPresetRegistry = {
    ...parentPresets,
  };

  for (const [rawKind, override] of Object.entries(presets)) {
    if (!isNgxSignalFormControlKind(rawKind)) {
      if (isDevMode()) {
        console.warn(
          `[ngx-signal-forms] Ignoring unknown control kind "${rawKind}" in preset overrides. ` +
            `Valid kinds: ${NGX_SIGNAL_FORM_CONTROL_KIND_VALUES.join(', ')}.`,
        );
      }
      continue;
    }

    // isNgxSignalFormControlKind is a type predicate that narrowed rawKind
    // above; it is a valid NgxSignalFormControlKind from this point on.
    normalized[rawKind] = {
      layout: createCascadingResolver({
        input: override.layout,
        // NgxSignalFormControlPresetRegistry is Record<..., NgxSignalFormControlPreset>,
        // so [rawKind].layout is always defined when base is non-null.
        configDefault: base?.[rawKind].layout,
        fallback: DEFAULT_NGX_SIGNAL_FORM_CONTROL_PRESETS[rawKind].layout,
      }),
      ariaMode: createCascadingResolver({
        input: override.ariaMode,
        configDefault: base?.[rawKind].ariaMode,
        fallback: DEFAULT_NGX_SIGNAL_FORM_CONTROL_PRESETS[rawKind].ariaMode,
      }),
    };
  }

  return normalized;
}

function createPresetFactory(
  presets: NgxSignalFormControlPresetOverrides,
): () => NgxSignalFormControlPresetRegistry {
  return () => {
    const parentPresetsOrNull = inject(NGX_SIGNAL_FORM_CONTROL_PRESETS, {
      optional: true,
      skipSelf: true,
    });

    return mergeNgxSignalFormControlPresets(parentPresetsOrNull, presets);
  };
}

/**
 * Overrides semantic control presets for the current injector tree.
 *
 * Use this when you want a global or feature-level default for wrapper layout
 * or ARIA ownership without repeating `ngxSignalFormControlLayout` or
 * `ngxSignalFormControlAria` on every matching control.
 *
 * Explicit directive inputs still win over provider defaults.
 *
 * @example
 * ```typescript
 * providers: [
 *   provideNgxSignalFormControlPresets({
 *     slider: { layout: 'custom', ariaMode: 'manual' },
 *   }),
 * ];
 * ```
 */
export function provideNgxSignalFormControlPresets(
  presets: NgxSignalFormControlPresetOverrides,
): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: NGX_SIGNAL_FORM_CONTROL_PRESETS,
      useFactory: createPresetFactory(presets),
    },
  ]);
}

/**
 * Component-scoped variant of `provideNgxSignalFormControlPresets()`.
 *
 * This is useful for demos, feature shells, or isolated subtrees that need a
 * different semantic default without changing application-wide behavior.
 *
 * @example
 * ```typescript
 * providers: [
 *   ...provideNgxSignalFormControlPresetsForComponent({
 *     slider: { layout: 'custom', ariaMode: 'manual' },
 *   }),
 * ];
 * ```
 */
export function provideNgxSignalFormControlPresetsForComponent(
  presets: NgxSignalFormControlPresetOverrides,
): Provider[] {
  return [
    {
      provide: NGX_SIGNAL_FORM_CONTROL_PRESETS,
      useFactory: createPresetFactory(presets),
    },
  ];
}
