import { Injector } from '@angular/core';
import { describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_NGX_SIGNAL_FORM_CONTROL_PRESETS,
  NGX_SIGNAL_FORM_CONTROL_PRESETS,
} from '../tokens';
import {
  provideNgxSignalFormControlPresets,
  provideNgxSignalFormControlPresetsForComponent,
} from './control-semantics.provider';

const createInjectorFromEnvProviders = (
  envProviders: unknown,
  parent?: Injector,
) => {
  const providersRecord = envProviders as {
    ɵproviders: Parameters<typeof Injector.create>[0]['providers'];
  };

  return Injector.create({ providers: providersRecord.ɵproviders, parent });
};

describe('provideNgxSignalFormControlPresets', () => {
  it('should return environment providers', () => {
    const providers = provideNgxSignalFormControlPresets({
      slider: {
        ariaMode: 'manual',
      },
    });

    expect(providers).toBeDefined();
    expect(typeof providers).toBe('object');
  });

  it('should merge partial overrides with default presets', () => {
    const providers = provideNgxSignalFormControlPresets({
      slider: {
        ariaMode: 'manual',
      },
    });
    const injector = createInjectorFromEnvProviders(providers);

    const resolved = injector.get(NGX_SIGNAL_FORM_CONTROL_PRESETS);
    expect(resolved.slider.ariaMode).toBe('manual');
    expect(resolved.slider.layout).toBe(
      DEFAULT_NGX_SIGNAL_FORM_CONTROL_PRESETS.slider.layout,
    );
    expect(resolved.switch).toEqual(
      DEFAULT_NGX_SIGNAL_FORM_CONTROL_PRESETS.switch,
    );
  });

  it('should warn in dev mode for invalid kind keys', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const providers = provideNgxSignalFormControlPresets({
      // @ts-expect-error — intentional typo to test dev-mode warning
      text_like: { ariaMode: 'manual' },
    });
    const injector = createInjectorFromEnvProviders(providers);

    injector.get(NGX_SIGNAL_FORM_CONTROL_PRESETS);

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Ignoring unknown control kind "text_like"'),
    );

    warnSpy.mockRestore();
  });

  it('should return defaults when given empty overrides', () => {
    const providers = provideNgxSignalFormControlPresets({});
    const injector = createInjectorFromEnvProviders(providers);

    const resolved = injector.get(NGX_SIGNAL_FORM_CONTROL_PRESETS);
    expect(resolved).toEqual(DEFAULT_NGX_SIGNAL_FORM_CONTROL_PRESETS);
  });
});

describe('provideNgxSignalFormControlPresetsForComponent', () => {
  it('should return providers array', () => {
    const providers = provideNgxSignalFormControlPresetsForComponent({
      composite: {
        ariaMode: 'manual',
      },
    });

    expect(Array.isArray(providers)).toBe(true);
    expect(providers.length).toBeGreaterThan(0);
  });

  it('should inherit parent preset overrides instead of resetting to defaults', () => {
    const parentInjector = createInjectorFromEnvProviders(
      provideNgxSignalFormControlPresets({
        slider: {
          layout: 'custom',
          ariaMode: 'manual',
        },
        composite: {
          ariaMode: 'manual',
        },
      }),
    );

    const childInjector = Injector.create({
      providers: provideNgxSignalFormControlPresetsForComponent({
        composite: {
          layout: 'group',
        },
      }),
      parent: parentInjector,
    });

    const resolved = childInjector.get(NGX_SIGNAL_FORM_CONTROL_PRESETS);

    expect(resolved.slider).toEqual({
      layout: 'custom',
      ariaMode: 'manual',
    });
    expect(resolved.composite).toEqual({
      layout: 'group',
      ariaMode: 'manual',
    });
  });
});
