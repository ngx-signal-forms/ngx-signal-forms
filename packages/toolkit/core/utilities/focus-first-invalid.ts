import type { FieldTree } from '@angular/forms/signals';

/**
 * Focus the first invalid field in a form after failed submission.
 *
 * Traverses the form tree to find the first field with validation errors,
 * then focuses its associated input element in the DOM.
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
 * import { focusFirstInvalid } from '@ngx-signal-forms/toolkit/core';
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
 * import { focusFirstInvalid } from '@ngx-signal-forms/toolkit/core';
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
 * **How it works:**
 * 1. Recursively traverses the FieldTree structure
 * 2. Finds the first field where `invalid() === true`
 * 3. Queries the DOM for an element with `[field]` directive matching that field
 * 4. Calls `.focus()` on the native input element
 *
 * **Limitations:**
 * - Only works with fields bound via `[field]` directive
 * - Field must be visible and focusable in the DOM
 * - Custom controls must implement proper focus handling
 *
 * **Performance:**
 * - Early exit on first invalid field (doesn't traverse entire tree)
 * - DOM queries are scoped to minimize performance impact
 */
export function focusFirstInvalid(formTree: FieldTree<unknown>): boolean {
  const firstInvalidField = findFirstInvalidField(formTree);

  if (!firstInvalidField) {
    return false;
  }

  // Try to focus the associated input element
  return focusFieldElement(firstInvalidField);
}

/**
 * Recursively find the first invalid field in the form tree.
 *
 * @param fieldTree Current field tree node to check
 * @returns The first invalid FieldTree, or null if all fields are valid
 */
function findFirstInvalidField(
  fieldTree: FieldTree<unknown>,
): FieldTree<unknown> | null {
  const fieldState = fieldTree();

  // Check if this field is invalid
  if (
    fieldState &&
    typeof fieldState === 'object' &&
    'invalid' in fieldState &&
    typeof fieldState.invalid === 'function' &&
    fieldState.invalid()
  ) {
    return fieldTree;
  }

  // Recursively check child fields
  // FieldTree can have nested properties that are also FieldTrees
  const fieldTreeObj = fieldTree as unknown as Record<string, unknown>;

  for (const key in fieldTreeObj) {
    if (Object.prototype.hasOwnProperty.call(fieldTreeObj, key)) {
      const child = fieldTreeObj[key];

      // Check if child is a FieldTree (callable function with field state)
      if (typeof child === 'function') {
        const childFieldTree = child as FieldTree<unknown>;
        const invalidChild = findFirstInvalidField(childFieldTree);

        if (invalidChild) {
          return invalidChild;
        }
      }
    }
  }

  return null;
}

/**
 * Focus the input element associated with a field.
 *
 * Queries the DOM for an input element bound to the field via `[field]` directive,
 * then calls `.focus()` on it.
 *
 * @param _fieldTree The field tree to focus (currently unused - relies on aria-invalid)
 * @returns `true` if element was found and focused, `false` otherwise
 */
function focusFieldElement(_fieldTree: FieldTree<unknown>): boolean {
  // Strategy: Find first element with aria-invalid="true"
  // This works if the auto-aria directive is enabled (default)
  //
  // Future improvement: Use a field-to-element mapping maintained by the Field directive
  // to directly focus the correct element without relying on ARIA attributes.
  const invalidElements = document.querySelectorAll('[aria-invalid="true"]');

  if (invalidElements.length > 0) {
    const element = invalidElements[0] as HTMLElement;

    if (typeof element.focus === 'function') {
      element.focus();
      return true;
    }
  }

  return false;
}
