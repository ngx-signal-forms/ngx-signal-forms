import type { ResolvedNgxSignalFormControlSemantics } from '@ngx-signal-forms/toolkit';

/**
 * Wrapper-visible control families derived from resolved control semantics.
 */
export type FormFieldControlKind =
  ResolvedNgxSignalFormControlSemantics['kind'];

/**
 * Determines whether a control family can safely render with outline chrome.
 *
 * @param controlKind Resolved control kind for the projected host.
 * @returns True when outlined appearance is supported for that control family.
 */
export function supportsOutlinedAppearance(
  controlKind: FormFieldControlKind,
): boolean {
  return (
    controlKind !== 'checkbox' &&
    controlKind !== 'radio-group' &&
    controlKind !== 'switch'
  );
}

/**
 * Determines whether a control family uses the standard text-like field shell.
 *
 * @param controlKind Resolved control kind for the projected host.
 * @returns True when the wrapper should treat the control as textual.
 */
export function isTextualControlKind(
  controlKind: FormFieldControlKind,
): boolean {
  return (
    controlKind === null ||
    controlKind === 'text-like' ||
    controlKind === 'textarea-select-like'
  );
}

/**
 * Determines whether a control family should use grouped selection-row layout.
 *
 * @param controlKind Resolved control kind for the projected host.
 * @returns True for checkbox and radio-group wrapper layouts.
 */
export function isSelectionGroupKind(
  controlKind: FormFieldControlKind,
): boolean {
  return controlKind === 'checkbox' || controlKind === 'radio-group';
}

/**
 * Determines whether the wrapper should keep shared padding around the control.
 *
 * @param controlKind Resolved control kind for the projected host.
 * @returns True when the control family benefits from padded content chrome.
 */
export function hasPaddedControlContent(
  controlKind: FormFieldControlKind,
): boolean {
  return controlKind === 'slider' || controlKind === 'composite';
}
