import { describe, expect, it } from 'vitest';
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
    });

    expect(result.autoAria).toBe(false);
    expect(result.defaultErrorStrategy).toBe(
      DEFAULT_NGX_SIGNAL_FORMS_CONFIG.defaultErrorStrategy,
    );
  });

  it('should preserve provided defaultErrorStrategy values', () => {
    const strategy = 'immediate';

    const result = normalizeSignalFormsConfig({
      defaultErrorStrategy: strategy,
    });

    expect(result.defaultErrorStrategy).toBe(strategy);
  });

  it('should keep defaults when optional values are explicitly undefined', () => {
    const result = normalizeSignalFormsConfig({
      autoAria: undefined,
      defaultErrorStrategy: undefined,
      defaultFormFieldAppearance: undefined,
      showRequiredMarker: undefined,
      requiredMarker: undefined,
    });

    expect(result).toEqual(DEFAULT_NGX_SIGNAL_FORMS_CONFIG);
  });

  it('is a two-tier merge only — does not inherit from a parent config (documented divergence from provideNgxSignalFormsConfig)', () => {
    // Regression for Bug 4 (issue #73): normalizeSignalFormsConfig is intentionally
    // a simple two-tier utility (userConfig → defaults). It does NOT walk the DI
    // injector tree. This test documents that divergence so future contributors
    // do not accidentally "fix" the function by adding DI-based parent inheritance
    // (which would break out-of-DI call sites like SSR server setups and unit tests).
    //
    // Production code should use provideNgxSignalFormsConfig() instead.
    const result = normalizeSignalFormsConfig({ autoAria: false });

    // Only user overrides and defaults apply — no parent-scope config is consulted.
    expect(result.autoAria).toBe(false);
    expect(result.defaultErrorStrategy).toBe(
      DEFAULT_NGX_SIGNAL_FORMS_CONFIG.defaultErrorStrategy,
    );
    expect(result.defaultFormFieldAppearance).toBe(
      DEFAULT_NGX_SIGNAL_FORMS_CONFIG.defaultFormFieldAppearance,
    );
  });
});
