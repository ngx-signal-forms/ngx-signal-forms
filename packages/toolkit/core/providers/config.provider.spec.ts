import { describe, it, expect } from 'vitest';
import { provideNgxSignalFormsConfig } from './config.provider';

describe('provideNgxSignalFormsConfig', () => {
  it('should return environment providers', () => {
    const config = {
      autoAria: true,
      autoTouch: false,
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

    expect(providers).toBeDefined();
  });

  it('should work with empty config', () => {
    const providers = provideNgxSignalFormsConfig({});

    expect(providers).toBeDefined();
  });
});
