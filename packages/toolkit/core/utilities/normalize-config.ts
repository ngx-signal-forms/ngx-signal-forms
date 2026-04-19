import type { NgxSignalFormsConfig, NgxSignalFormsUserConfig } from '../types';
import { DEFAULT_NGX_SIGNAL_FORMS_CONFIG } from '../tokens';

/**
 * Normalizes user-provided configuration by merging with defaults.
 * Ensures all required configuration values are present.
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
    showRequiredMarker:
      config.showRequiredMarker ??
      DEFAULT_NGX_SIGNAL_FORMS_CONFIG.showRequiredMarker,
    requiredMarker:
      config.requiredMarker ?? DEFAULT_NGX_SIGNAL_FORMS_CONFIG.requiredMarker,
  };
}
