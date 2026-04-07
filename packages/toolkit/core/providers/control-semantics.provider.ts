import type { EnvironmentProviders, Provider } from '@angular/core';
import { inject, makeEnvironmentProviders } from '@angular/core';
import {
  DEFAULT_NGX_SIGNAL_FORM_CONTROL_PRESETS,
  NGX_SIGNAL_FORM_CONTROL_PRESETS,
} from '../tokens';
import type {
  NgxSignalFormControlPresetOverrides,
  NgxSignalFormControlPresetRegistry,
} from '../types';
import { isNgxSignalFormControlKind } from '../utilities/control-semantics';

function mergeNgxSignalFormControlPresets(
  base: NgxSignalFormControlPresetRegistry,
  presets: NgxSignalFormControlPresetOverrides,
): NgxSignalFormControlPresetRegistry {
  const normalized: NgxSignalFormControlPresetRegistry = {
    ...base,
  };

  for (const [rawKind, override] of Object.entries(presets)) {
    if (!isNgxSignalFormControlKind(rawKind)) {
      if (typeof ngDevMode === 'undefined' || ngDevMode) {
        console.warn(
          `[ngx-signal-forms] Ignoring unknown control kind "${rawKind}" in preset overrides. ` +
            `Valid kinds: text-like, textarea-select-like, switch, checkbox, radio-group, slider, composite.`,
        );
      }
      continue;
    }

    normalized[rawKind] = {
      ...normalized[rawKind],
      ...override,
    };
  }

  return normalized;
}

function createPresetFactory(
  presets: NgxSignalFormControlPresetOverrides,
): () => NgxSignalFormControlPresetRegistry {
  return () => {
    const parentPresets =
      inject(NGX_SIGNAL_FORM_CONTROL_PRESETS, {
        optional: true,
        skipSelf: true,
      }) ?? DEFAULT_NGX_SIGNAL_FORM_CONTROL_PRESETS;

    return mergeNgxSignalFormControlPresets(parentPresets, presets);
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
