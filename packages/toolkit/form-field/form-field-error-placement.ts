/**
 * Placement of the validation summary relative to the control or fieldset
 * content. Shared by `NgxFormFieldWrapper` and `NgxFormFieldset` so a
 * single value binds cleanly across both APIs.
 *
 * - `'top'`: render the summary directly below the legend / above the inputs
 * - `'bottom'`: render the summary after the projected content
 *
 * @public
 */
export type NgxFormFieldErrorPlacement = 'top' | 'bottom';
