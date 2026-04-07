import type { ResolvedFormFieldAppearance } from '@ngx-signal-forms/toolkit';

export const APPEARANCE_OPTIONS = [
  'stacked',
  'outline',
  'plain',
] as const satisfies readonly ResolvedFormFieldAppearance[];

export const APPEARANCE_LABELS = {
  stacked: 'Stacked',
  outline: 'Outline',
  plain: 'Plain',
} as const satisfies Record<ResolvedFormFieldAppearance, string>;
