import { Injector } from '@angular/core';
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_NGX_SIGNAL_FORMS_CONFIG,
  NGX_SIGNAL_FORMS_CONFIG,
} from '../tokens';
import {
  provideNgxSignalFormsConfig,
  provideNgxSignalFormsConfigForComponent,
} from './config.provider';

const createInjectorFromEnvProviders = (envProviders: unknown) => {
  const providersRecord = envProviders as {
    ɵproviders: Parameters<typeof Injector.create>[0]['providers'];
  };

  return Injector.create({ providers: providersRecord.ɵproviders });
};

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
      debug: true,
    };

    const providers = provideNgxSignalFormsConfig(config);
    const injector = createInjectorFromEnvProviders(providers);

    const resolved = injector.get(NGX_SIGNAL_FORMS_CONFIG);
    expect(resolved.autoAria).toBe(false);
    expect(resolved.defaultErrorStrategy).toBe(
      DEFAULT_NGX_SIGNAL_FORMS_CONFIG.defaultErrorStrategy,
    );
  });

  it('should work with empty config', () => {
    const providers = provideNgxSignalFormsConfig({});
    const injector = createInjectorFromEnvProviders(providers);

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
      debug: true,
    };

    const providers = provideNgxSignalFormsConfigForComponent(config);
    const injector = Injector.create({ providers });

    const resolved = injector.get(NGX_SIGNAL_FORMS_CONFIG);
    expect(resolved.autoAria).toBe(false);
    expect(resolved.debug).toBe(true);
    expect(resolved.defaultErrorStrategy).toBe(
      DEFAULT_NGX_SIGNAL_FORMS_CONFIG.defaultErrorStrategy,
    );
  });
});
