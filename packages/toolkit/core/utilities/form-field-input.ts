import type { FormFieldAppearance, FormFieldOrientation } from '../types';

/**
 * The supported `appearance` literals, in the order they should be listed in
 * dev-mode diagnostics. Shared with {@link resolveUnionInput} call sites so
 * the runtime membership check and the `appearance` type can't drift apart.
 *
 * @internal
 */
export const FORM_FIELD_APPEARANCE_VALUES = [
  'standard',
  'outline',
  'plain',
] as const satisfies readonly FormFieldAppearance[];

/**
 * The supported `orientation` literals, in the order they should be listed
 * in dev-mode diagnostics. Shared with {@link resolveUnionInput} call sites
 * so the runtime membership check and the `orientation` type can't drift apart.
 *
 * @internal
 */
export const FORM_FIELD_ORIENTATION_VALUES = [
  'vertical',
  'horizontal',
] as const satisfies readonly FormFieldOrientation[];
