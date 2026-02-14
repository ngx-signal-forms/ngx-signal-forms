import type { FieldTree } from '@angular/forms/signals';

/**
 * Focus the first invalid field in a form after failed submission.
 *
 * Uses Angular 21.1's native `focusBoundControl()` method to focus the input element
 * associated with the first validation error in the form's `errorSummary()`.
 *
 * This improves accessibility by:
 * - Reducing user frustration (no need to search for errors)
 * - Supporting keyboard navigation
 * - Meeting WCAG 2.2 guidelines for form error handling
 *
 * @param formTree The root form tree to search for invalid fields
 * @returns `true` if an invalid field was found and focused, `false` otherwise
 *
 * @example Basic usage
 * ```typescript
 * import { focusFirstInvalid } from '@ngx-signal-forms/toolkit';
 *
 * protected save(): void {
 *   if (this.userForm().invalid()) {
 *     focusFirstInvalid(this.userForm);
 *   }
 * }
 * ```
 *
 * @example With submit() helper
 * ```typescript
 * import { submit } from '@angular/forms/signals';
 * import { focusFirstInvalid } from '@ngx-signal-forms/toolkit';
 *
 * protected readonly onSubmit = submit(this.userForm, async (formData) => {
 *   /// submit() only runs this callback when form is valid
 *   await this.apiService.save(formData().value());
 *   return null;
 * });
 *
 * protected handleSubmit(): void {
 *   /// Focus first invalid field if form is invalid
 *   /// (submit() won't run callback in this case)
 *   if (this.userForm().invalid()) {
 *     focusFirstInvalid(this.userForm);
 *   }
 *   void this.onSubmit();
 * }
 * ```
 *
 * @remarks
 * **How it works (Angular 21.1+):**
 * 1. Gets `errorSummary()` from the form tree (contains all errors including child controls)
 * 2. Takes the first error's `fieldTree` property
 * 3. Calls native `focusBoundControl()` on that field's state
 *
 * **Custom controls:**
 * Custom control directives must implement a `focus()` method for `focusBoundControl()` to work.
 * Angular 21.1+ calls this method on the directive instance when `focusBoundControl()` is invoked.
 *
 * @see https://angular.dev/api/forms/signals - Angular Signal Forms documentation
 *
 * @public
 */
export function focusFirstInvalid(formTree: FieldTree<unknown>): boolean {
  const formState = formTree();

  // Get all validation errors from the form (including nested fields)
  const errors = formState.errorSummary();

  if (errors.length === 0) {
    return false;
  }

  // Get the first error's associated field tree
  const firstError = errors[0];

  if (!firstError.fieldTree) {
    return false;
  }

  // Use Angular 21.1's native focusBoundControl() method
  const fieldState = firstError.fieldTree();

  if (
    fieldState &&
    typeof fieldState === 'object' &&
    'focusBoundControl' in fieldState &&
    typeof fieldState.focusBoundControl === 'function'
  ) {
    fieldState.focusBoundControl();
    return true;
  }

  if (typeof ngDevMode === 'undefined' || ngDevMode) {
    console.warn(
      '[ngx-signal-forms] focusFirstInvalid could not focus the first invalid field. ' +
        'Ensure custom controls implement focus() for focusBoundControl().',
    );
  }

  return false;
}
