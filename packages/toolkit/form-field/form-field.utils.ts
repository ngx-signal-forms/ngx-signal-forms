import type { ResolvedNgxSignalFormControlSemantics } from '@ngx-signal-forms/toolkit';

export type FormFieldControlKind =
  ResolvedNgxSignalFormControlSemantics['kind'];

export function supportsOutlinedAppearance(
  controlKind: FormFieldControlKind,
): boolean {
  return (
    controlKind !== 'checkbox' &&
    controlKind !== 'radio-group' &&
    controlKind !== 'switch'
  );
}

export function isTextualControlKind(
  controlKind: FormFieldControlKind,
): boolean {
  return (
    controlKind === null ||
    controlKind === 'text-like' ||
    controlKind === 'textarea-select-like'
  );
}

export function isSelectionGroupKind(
  controlKind: FormFieldControlKind,
): boolean {
  return controlKind === 'checkbox' || controlKind === 'radio-group';
}

export function hasPaddedControlContent(
  controlKind: FormFieldControlKind,
): boolean {
  return controlKind === 'slider' || controlKind === 'composite';
}
