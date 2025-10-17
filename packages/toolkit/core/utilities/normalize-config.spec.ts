import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_NGX_SIGNAL_FORMS_CONFIG } from '../tokens';
import { normalizeSignalFormsConfig } from './normalize-config';

describe('normalizeSignalFormsConfig', () => {
  it('should return defaults when config is undefined', () => {
    const result = normalizeSignalFormsConfig();

    expect(result).toEqual({ ...DEFAULT_NGX_SIGNAL_FORMS_CONFIG });
    expect(result).not.toBe(DEFAULT_NGX_SIGNAL_FORMS_CONFIG);
  });

  it('should merge supplied config with defaults', () => {
    const result = normalizeSignalFormsConfig({
      autoAria: false,
      debug: true,
    });

    expect(result.autoAria).toBe(false);
    expect(result.debug).toBe(true);
    expect(result.defaultErrorStrategy).toBe(
      DEFAULT_NGX_SIGNAL_FORMS_CONFIG.defaultErrorStrategy,
    );
  });

  it('should preserve provided defaultErrorStrategy signals', () => {
    const strategySpy = vi.fn().mockReturnValue('manual');

    const result = normalizeSignalFormsConfig({
      defaultErrorStrategy: strategySpy,
    });

    expect(result.defaultErrorStrategy).toBe(strategySpy);
  });
});
