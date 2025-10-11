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
  return { ...DEFAULT_NGX_SIGNAL_FORMS_CONFIG, ...config };
}
