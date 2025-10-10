import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideNgxSignalFormsConfig } from './config.provider';
import { NGX_SIGNAL_FORMS_CONFIG } from '../tokens';

describe('provideNgxSignalFormsConfig', () => {
  it('should provide the config to the injector', () => {
    const config = {
      autoAria: true,
      autoTouch: false,
      defaultErrorStrategy: 'immediate' as const,
    };

    TestBed.configureTestingModule({
      providers: [provideNgxSignalFormsConfig(config)],
    });

    const injectedConfig = TestBed.inject(NGX_SIGNAL_FORMS_CONFIG);
    expect(injectedConfig).toEqual(config);
  });

  it('should allow partial config', () => {
    const config = {
      autoAria: false,
      debug: true,
    };

    TestBed.configureTestingModule({
      providers: [provideNgxSignalFormsConfig(config)],
    });

    const injectedConfig = TestBed.inject(NGX_SIGNAL_FORMS_CONFIG);
    expect(injectedConfig).toEqual(config);
    expect(injectedConfig.autoAria).toBe(false);
    expect(injectedConfig.debug).toBe(true);
  });
});
