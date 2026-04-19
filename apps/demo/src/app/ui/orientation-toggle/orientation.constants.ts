import type {
  FormFieldAppearance,
  FormFieldOrientation,
} from '@ngx-signal-forms/toolkit';

export const ORIENTATION_OPTIONS = [
  'vertical',
  'horizontal',
] as const satisfies readonly FormFieldOrientation[];

export const ORIENTATION_LABELS = {
  vertical: 'Vertical',
  horizontal: 'Horizontal',
} as const satisfies Record<FormFieldOrientation, string>;

type OrientationLabel = (typeof ORIENTATION_LABELS)[FormFieldOrientation];

export function getOrientationLabel(
  orientation: FormFieldOrientation,
): OrientationLabel {
  return ORIENTATION_LABELS[orientation];
}

export function isOrientationDisabledForAppearance(
  appearance: FormFieldAppearance,
  orientation: FormFieldOrientation,
): boolean {
  return appearance === 'outline' && orientation === 'horizontal';
}
