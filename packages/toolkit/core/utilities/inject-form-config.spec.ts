import { Injector } from '@angular/core';
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_NGX_SIGNAL_FORMS_CONFIG,
  NGX_SIGNAL_FORMS_CONFIG,
} from '../tokens';
import type { NgxSignalFormsConfig } from '../types';
import { injectFormConfig } from './inject-form-config';

describe('injectFormConfig', () => {
  it('should return provided config when available', () => {
    const customConfig: NgxSignalFormsConfig = {
      ...DEFAULT_NGX_SIGNAL_FORMS_CONFIG,
      strictFieldResolution: true,
      debug: true,
      autoAria: false,
    };

    const injector = Injector.create({
      providers: [{ provide: NGX_SIGNAL_FORMS_CONFIG, useValue: customConfig }],
    });

    const result = injectFormConfig(injector);
    expect(result).toMatchObject({
      strictFieldResolution: true,
      debug: true,
      autoAria: false,
    });
  });

  it('should return default config when no config provided', () => {
    const injector = Injector.create({ providers: [] });

    const result = injectFormConfig(injector);
    expect(result).toEqual({
      ...DEFAULT_NGX_SIGNAL_FORMS_CONFIG,
    });
  });

  it('should merge partial config with defaults', () => {
    const partialConfig: NgxSignalFormsConfig = {
      ...DEFAULT_NGX_SIGNAL_FORMS_CONFIG,
      strictFieldResolution: true,
    };

    const injector = Injector.create({
      providers: [
        { provide: NGX_SIGNAL_FORMS_CONFIG, useValue: partialConfig },
      ],
    });

    const result = injectFormConfig(injector);
    expect(result.strictFieldResolution).toBe(true);
    expect(result.autoAria).toBe(DEFAULT_NGX_SIGNAL_FORMS_CONFIG.autoAria);
  });

  it('should throw when called outside injection context without injector', () => {
    expect(() => {
      injectFormConfig();
    }).toThrow(/can only be used within an injection context/i);
  });
});
