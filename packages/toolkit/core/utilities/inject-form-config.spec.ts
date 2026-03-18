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
      autoAria: false,
    };

    const injector = Injector.create({
      providers: [{ provide: NGX_SIGNAL_FORMS_CONFIG, useValue: customConfig }],
    });

    const result = injectFormConfig(injector);
    expect(result).toMatchObject({
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
      autoAria: false,
    };

    const injector = Injector.create({
      providers: [
        { provide: NGX_SIGNAL_FORMS_CONFIG, useValue: partialConfig },
      ],
    });

    const result = injectFormConfig(injector);
    expect(result.autoAria).toBe(false);
    expect(result.showRequiredMarker).toBe(
      DEFAULT_NGX_SIGNAL_FORMS_CONFIG.showRequiredMarker,
    );
  });

  it('should throw when called outside injection context without injector', () => {
    expect(() => {
      injectFormConfig();
    }).toThrow(/can only be used within an injection context/i);
  });
});
