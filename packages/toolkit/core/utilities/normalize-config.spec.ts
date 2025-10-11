import { describe, it, expect, vi } from 'vitest';
import { normalizeSignalFormsConfig } from './normalize-config';
import { DEFAULT_NGX_SIGNAL_FORMS_CONFIG } from '../tokens';

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
    expect(result.autoTouch).toBe(DEFAULT_NGX_SIGNAL_FORMS_CONFIG.autoTouch);
  });

  it('should preserve provided defaultErrorStrategy signals', () => {
    const strategySpy = vi.fn().mockReturnValue('manual');

    const result = normalizeSignalFormsConfig({
      defaultErrorStrategy: strategySpy,
    });

    expect(result.defaultErrorStrategy).toBe(strategySpy);
  });
});
