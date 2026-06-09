import { createEnvironmentInjector, EnvironmentInjector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import {
  provideNgxSignalFormControlPresets,
  provideNgxSignalFormControlPresetsForComponent,
} from '../providers/control-semantics.provider';
import { DEFAULT_NGX_SIGNAL_FORM_CONTROL_PRESETS } from '../tokens';
import { NGX_SIGNAL_FORM_CONTROL_KIND_VALUES } from '../utilities/control-semantics';
import { NgxControlPresetRegistry } from './control-preset-registry';

const createInjectorFromEnvProviders = (
  providers: Parameters<typeof createEnvironmentInjector>[0],
  parent: EnvironmentInjector = TestBed.inject(EnvironmentInjector),
) => createEnvironmentInjector(providers, parent);

const injectRegistry = (injector: EnvironmentInjector) =>
  injector.get(NgxControlPresetRegistry);

describe('NgxControlPresetRegistry', () => {
  it('resolve(kind) returns the default preset when no override is registered', () => {
    const injector = createInjectorFromEnvProviders([NgxControlPresetRegistry]);

    const registry = injectRegistry(injector);

    expect(registry.resolve('switch')).toEqual(
      DEFAULT_NGX_SIGNAL_FORM_CONTROL_PRESETS.switch,
    );
  });

  it('kinds() set-equals the default registered kinds', () => {
    const injector = createInjectorFromEnvProviders([NgxControlPresetRegistry]);

    const registry = injectRegistry(injector);

    expect(new Set(registry.kinds())).toEqual(
      new Set(NGX_SIGNAL_FORM_CONTROL_KIND_VALUES),
    );
  });

  it('reflects an environment-scoped override in resolve() while keeping other kinds at default', () => {
    const injector = createInjectorFromEnvProviders([
      provideNgxSignalFormControlPresets({
        slider: { ariaMode: 'manual' },
      }),
      NgxControlPresetRegistry,
    ]);

    const registry = injectRegistry(injector);

    expect(registry.resolve('slider')).toEqual({
      layout: DEFAULT_NGX_SIGNAL_FORM_CONTROL_PRESETS.slider.layout,
      ariaMode: 'manual',
    });
    // merge-not-replace: untouched kinds stay at their defaults.
    expect(registry.resolve('switch')).toEqual(
      DEFAULT_NGX_SIGNAL_FORM_CONTROL_PRESETS.switch,
    );
  });

  it('respects the calling injector: a component-scoped override IS reflected by resolve()', () => {
    const parentInjector = createInjectorFromEnvProviders([
      NgxControlPresetRegistry,
    ]);
    const childInjector = createInjectorFromEnvProviders(
      [
        ...provideNgxSignalFormControlPresetsForComponent({
          composite: { layout: 'group' },
        }),
        NgxControlPresetRegistry,
      ],
      parentInjector,
    );

    const childRegistry = injectRegistry(childInjector);
    const parentRegistry = injectRegistry(parentInjector);

    // The child injector's registry observes the component-scoped override...
    expect(childRegistry.resolve('composite')).toEqual({
      layout: 'group',
      ariaMode: DEFAULT_NGX_SIGNAL_FORM_CONTROL_PRESETS.composite.ariaMode,
    });
    // ...while the parent injector's registry still sees the default.
    expect(parentRegistry.resolve('composite')).toEqual(
      DEFAULT_NGX_SIGNAL_FORM_CONTROL_PRESETS.composite,
    );
  });

  it('extend() merges with current presets rather than replacing the whole map', () => {
    const injector = createInjectorFromEnvProviders([NgxControlPresetRegistry]);

    const registry = injectRegistry(injector);
    const extended = registry.extend({ slider: { layout: 'custom' } });

    // The overridden field is applied...
    expect(extended.slider).toEqual({
      layout: 'custom',
      ariaMode: DEFAULT_NGX_SIGNAL_FORM_CONTROL_PRESETS.slider.ariaMode,
    });
    // ...every other kind is preserved (merge-not-replace).
    expect(extended.switch).toEqual(
      DEFAULT_NGX_SIGNAL_FORM_CONTROL_PRESETS.switch,
    );
    // The registry's own resolve() is not mutated by extend().
    expect(registry.resolve('slider')).toEqual(
      DEFAULT_NGX_SIGNAL_FORM_CONTROL_PRESETS.slider,
    );
  });
});
