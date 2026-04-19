import type { FormFieldAppearance, FormFieldOrientation } from '../types';

const FORM_FIELD_APPEARANCE_VALUES = [
  'standard',
  'outline',
  'plain',
] as const satisfies readonly FormFieldAppearance[];

const FORM_FIELD_APPEARANCES = new Set<string>(FORM_FIELD_APPEARANCE_VALUES);

const FORM_FIELD_ORIENTATION_VALUES = [
  'vertical',
  'horizontal',
] as const satisfies readonly FormFieldOrientation[];

const FORM_FIELD_ORIENTATIONS = new Set<string>(FORM_FIELD_ORIENTATION_VALUES);

/**
 * Checks whether a raw value is one of the supported form-field appearances.
 *
 * Used by the wrapper to validate the `appearance` input at runtime so that
 * dynamic bindings (template attribute strings, JIT compiled templates, value
 * crossings from external config) cannot silently feed an unknown literal
 * into the resolution branch.
 *
 * @param value Raw value to validate.
 * @returns True when the value matches a supported appearance literal.
 */
export function isFormFieldAppearance(
  value: string | null | undefined,
): value is FormFieldAppearance {
  return (
    value !== null && value !== undefined && FORM_FIELD_APPEARANCES.has(value)
  );
}

/**
 * Checks whether a raw value is one of the supported form-field orientations.
 *
 * Mirrors {@link isFormFieldAppearance} for the `orientation` input. Lets the
 * wrapper convert silent rendering bugs (typo `"horizonal"`, leftover legacy
 * literals) into one-shot dev-mode diagnostics with a clear remediation
 * message.
 *
 * @param value Raw value to validate.
 * @returns True when the value matches a supported orientation literal.
 */
export function isFormFieldOrientation(
  value: string | null | undefined,
): value is FormFieldOrientation {
  return (
    value !== null && value !== undefined && FORM_FIELD_ORIENTATIONS.has(value)
  );
}
