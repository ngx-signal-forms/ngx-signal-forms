import type {
  FormFieldAppearance,
  FormFieldAppearanceInput,
} from '@ngx-signal-forms/toolkit';

export const APPEARANCE_OPTIONS = [
  'stacked',
  'outline',
  'plain',
] as const satisfies readonly FormFieldAppearance[];

export const APPEARANCE_LABELS = {
  stacked: 'Stacked',
  outline: 'Outline',
  plain: 'Plain',
} as const satisfies Record<FormFieldAppearance, string>;

type AppearanceLabel = (typeof APPEARANCE_LABELS)[FormFieldAppearance];

export function getAppearanceLabel(
  appearance: FormFieldAppearanceInput,
): AppearanceLabel {
  switch (appearance) {
    case 'stacked':
    case 'outline':
    case 'plain':
      return APPEARANCE_LABELS[appearance];
    case 'inherit':
      return APPEARANCE_LABELS.stacked;
    default:
      appearance satisfies never;
      return APPEARANCE_LABELS.stacked;
  }
}
