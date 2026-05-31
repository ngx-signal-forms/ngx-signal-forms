import type { NgxSignalFormsConfig, NgxSignalFormsUserConfig } from '../types';
import { DEFAULT_NGX_SIGNAL_FORMS_CONFIG } from '../tokens';

/**
 * Normalizes user-provided configuration by merging with defaults.
 * Ensures all required configuration values are present.
 *
 * **Two-tier merge only** — this function merges `config` with
 * `DEFAULT_NGX_SIGNAL_FORMS_CONFIG` and does NOT walk the DI injector tree.
 * Use `provideNgxSignalFormsConfig()` / `provideNgxSignalFormsConfigForComponent()`
 * in production code so parent-scope overrides are inherited correctly.
 * This utility is intended for unit tests, SSR server setups, or other
 * out-of-DI call sites where the three-tier DI cascade is not available.
 *
 * @param config - User-provided configuration (partial)
 * @returns Complete configuration with defaults applied
 */
export function normalizeSignalFormsConfig(
  config?: NgxSignalFormsUserConfig | null,
): NgxSignalFormsConfig {
  if (!config) {
    return {
      ...DEFAULT_NGX_SIGNAL_FORMS_CONFIG,
    };
  }

  return {
    autoAria: config.autoAria ?? DEFAULT_NGX_SIGNAL_FORMS_CONFIG.autoAria,
    defaultErrorStrategy:
      config.defaultErrorStrategy ??
      DEFAULT_NGX_SIGNAL_FORMS_CONFIG.defaultErrorStrategy,
    defaultFormFieldAppearance:
      config.defaultFormFieldAppearance ??
      DEFAULT_NGX_SIGNAL_FORMS_CONFIG.defaultFormFieldAppearance,
    defaultFormFieldOrientation:
      config.defaultFormFieldOrientation ??
      DEFAULT_NGX_SIGNAL_FORMS_CONFIG.defaultFormFieldOrientation,
    showMarkerWhen:
      config.showMarkerWhen ?? DEFAULT_NGX_SIGNAL_FORMS_CONFIG.showMarkerWhen,
    requiredMarker:
      config.requiredMarker ?? DEFAULT_NGX_SIGNAL_FORMS_CONFIG.requiredMarker,
    optionalMarker:
      config.optionalMarker ?? DEFAULT_NGX_SIGNAL_FORMS_CONFIG.optionalMarker,
    requiredLegendText:
      config.requiredLegendText ??
      DEFAULT_NGX_SIGNAL_FORMS_CONFIG.requiredLegendText,
    optionalLegendText:
      config.optionalLegendText ??
      DEFAULT_NGX_SIGNAL_FORMS_CONFIG.optionalLegendText,
  };
}
