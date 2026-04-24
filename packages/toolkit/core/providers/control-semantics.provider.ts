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

function mergeNgxSignalFormControlPresets(
  parentPresetsOrNull: NgxSignalFormControlPresetRegistry | null,
  presets: NgxSignalFormControlPresetOverrides,
): NgxSignalFormControlPresetRegistry {
  const parentPresets =
    parentPresetsOrNull ?? DEFAULT_NGX_SIGNAL_FORM_CONTROL_PRESETS;
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

    // isNgxSignalFormControlKind is a type predicate — rawKind is narrowed here.
    normalized[rawKind] = {
      layout: createCascadingResolver({
        input: override.layout,
        // NgxSignalFormControlPresetRegistry is Record<..., NgxSignalFormControlPreset>,
        // so [rawKind].layout is always defined when parentPresetsOrNull is non-null.
        configDefault: parentPresetsOrNull?.[rawKind].layout,
        fallback: DEFAULT_NGX_SIGNAL_FORM_CONTROL_PRESETS[rawKind].layout,
      }),
      ariaMode: createCascadingResolver({
        input: override.ariaMode,
        configDefault: parentPresetsOrNull?.[rawKind].ariaMode,
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
