import { Injector } from '@angular/core';
import { describe, it, expect } from 'vitest';
import { injectFormConfig } from './inject-form-config';
import { NGX_SIGNAL_FORMS_CONFIG } from '../tokens';
import type { NgxSignalFormsConfig } from '../types';

describe('injectFormConfig', () => {
  it('should return provided config when available', () => {
    const customConfig: NgxSignalFormsConfig = {
      strictFieldResolution: true,
      debug: true,
      autoAria: false,
    };

    const injector = Injector.create({
      providers: [{ provide: NGX_SIGNAL_FORMS_CONFIG, useValue: customConfig }],
    });

    const result = injectFormConfig(injector);
    expect(result).toBe(customConfig);
  });

  it('should return default config when no config provided', () => {
    const injector = Injector.create({ providers: [] });

    const result = injectFormConfig(injector);
    expect(result).toEqual({
      strictFieldResolution: false,
      debug: false,
    });
  });

  it('should merge partial config with defaults', () => {
    const partialConfig: NgxSignalFormsConfig = {
      strictFieldResolution: true,
    };

    const injector = Injector.create({
      providers: [
        { provide: NGX_SIGNAL_FORMS_CONFIG, useValue: partialConfig },
      ],
    });

    const result = injectFormConfig(injector);
    expect(result.strictFieldResolution).toBe(true);
  });

  it('should throw when called outside injection context without injector', () => {
    expect(() => {
      injectFormConfig();
    }).toThrow(/can only be used within an injection context/i);
  });
});
