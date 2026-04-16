import { createEnvironmentInjector, EnvironmentInjector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_NGX_SIGNAL_FORMS_CONFIG,
  NGX_SIGNAL_FORMS_CONFIG,
} from '../tokens';
import {
  provideNgxSignalFormsConfig,
  provideNgxSignalFormsConfigForComponent,
} from './config.provider';

const createInjectorFromEnvProviders = (
  providers: Parameters<typeof createEnvironmentInjector>[0],
  parent: EnvironmentInjector = TestBed.inject(EnvironmentInjector),
) => createEnvironmentInjector(providers, parent);

describe('provideNgxSignalFormsConfig', () => {
  it('should return environment providers', () => {
    const config = {
      autoAria: true,
      defaultErrorStrategy: 'immediate' as const,
    };

    const providers = provideNgxSignalFormsConfig(config);

    expect(providers).toBeDefined();
    expect(typeof providers).toBe('object');
  });

  it('should work with partial config', () => {
    const config = {
      autoAria: false,
    };

    const providers = provideNgxSignalFormsConfig(config);
    const injector = createInjectorFromEnvProviders([providers]);

    const resolved = injector.get(NGX_SIGNAL_FORMS_CONFIG);
    expect(resolved.autoAria).toBe(false);
    expect(resolved.defaultErrorStrategy).toBe(
      DEFAULT_NGX_SIGNAL_FORMS_CONFIG.defaultErrorStrategy,
    );
  });

  it('should work with empty config', () => {
    const providers = provideNgxSignalFormsConfig({});
    const injector = createInjectorFromEnvProviders([providers]);

    const resolved = injector.get(NGX_SIGNAL_FORMS_CONFIG);
    expect(resolved).toEqual({ ...DEFAULT_NGX_SIGNAL_FORMS_CONFIG });
  });
});

describe('provideNgxSignalFormsConfigForComponent', () => {
  it('should return providers array', () => {
    const config = { autoAria: true };
    const providers = provideNgxSignalFormsConfigForComponent(config);

    expect(Array.isArray(providers)).toBe(true);
    expect(providers.length).toBeGreaterThan(0);
  });

  it('should provide configured values', () => {
    const config = {
      autoAria: false,
    };

    const providers = provideNgxSignalFormsConfigForComponent(config);
    const injector = createInjectorFromEnvProviders(providers);

    const resolved = injector.get(NGX_SIGNAL_FORMS_CONFIG);
    expect(resolved.autoAria).toBe(false);
    expect(resolved.defaultErrorStrategy).toBe(
      DEFAULT_NGX_SIGNAL_FORMS_CONFIG.defaultErrorStrategy,
    );
  });

  it('inherits non-overridden values from the parent injector', () => {
    // Parent scope sets defaultErrorStrategy=immediate.
    const parentEnv = createInjectorFromEnvProviders([
      provideNgxSignalFormsConfig({ defaultErrorStrategy: 'immediate' }),
    ]);

    // Component-level override only changes autoAria. The parent
    // `defaultErrorStrategy` MUST bubble down — matches the factory+skipSelf
    // pattern in `provideNgxSignalFormControlPresetsForComponent`.
    const childProviders = provideNgxSignalFormsConfigForComponent({
      autoAria: false,
    });
    const childInjector = createInjectorFromEnvProviders(
      childProviders,
      parentEnv,
    );

    const resolved = childInjector.get(NGX_SIGNAL_FORMS_CONFIG);
    expect(resolved.autoAria).toBe(false);
    expect(resolved.defaultErrorStrategy).toBe('immediate');
    expect(resolved.defaultFormFieldAppearance).toBe(
      DEFAULT_NGX_SIGNAL_FORMS_CONFIG.defaultFormFieldAppearance,
    );
  });

  it('env-level provider also inherits from parent env', () => {
    const parentEnv = createInjectorFromEnvProviders([
      provideNgxSignalFormsConfig({ requiredMarker: ' (required)' }),
    ]);

    const childEnv = createInjectorFromEnvProviders(
      [provideNgxSignalFormsConfig({ autoAria: false })],
      parentEnv,
    );

    const resolved = childEnv.get(NGX_SIGNAL_FORMS_CONFIG);
    expect(resolved.autoAria).toBe(false);
    expect(resolved.requiredMarker).toBe(' (required)');
  });
});
