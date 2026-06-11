import { linkedSignal } from '@angular/core';
import type { Signal, WritableSignal } from '@angular/core';
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

export function normalizeOrientationForAppearance(
  appearance: FormFieldAppearance,
  orientation: FormFieldOrientation,
): FormFieldOrientation {
  return isOrientationDisabledForAppearance(appearance, orientation)
    ? 'vertical'
    : orientation;
}

/**
 * Writable orientation selection that snaps to a supported orientation
 * whenever the appearance changes — the canonical linkedSignal
 * previous-value pattern (replaces signal + effect write-back).
 */
export function createOrientationSelection(
  appearance: Signal<FormFieldAppearance>,
  initial: FormFieldOrientation = 'vertical',
): WritableSignal<FormFieldOrientation> {
  return linkedSignal<FormFieldAppearance, FormFieldOrientation>({
    source: appearance,
    computation: (currentAppearance, previous) =>
      normalizeOrientationForAppearance(
        currentAppearance,
        previous?.value ?? initial,
      ),
  });
}
