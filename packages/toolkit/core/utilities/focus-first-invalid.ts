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
 * @param containerEl Optional container element to scope the search (defaults to document.body)
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
 * @example With container scoping
 * ```typescript
 * focusFirstInvalid(this.userForm, this.formRef.nativeElement);
 * ```
 *
 * @remarks
 * **How it works:**
 * 1. Recursively traverses the FieldTree structure to find first invalid leaf field
 * 2. Builds the field path (e.g., 'address.city') from the traversal
 * 3. Queries the DOM using field name resolution (id, name, data-signal-field)
 * 4. Calls `.focus()` on the native input element
 *
 * **Improvements over previous implementation:**
 * - Uses field tree traversal instead of `[aria-invalid="true"]` selector
 * - Works independently of auto-ARIA directive
 * - Scopes search to container element to avoid selecting inputs outside the form
 * - Uses same field name resolution as auto-ARIA for consistency
 *
 * **Limitations:**
 * - Only works with fields bound via `[formField]` directive
 * - Field must be visible and focusable in the DOM
 * - Custom controls must implement proper focus handling
 *
 * **Performance:**
 * - Early exit on first invalid field (doesn't traverse entire tree)
 * - DOM queries are scoped to minimize performance impact
 */
export function focusFirstInvalid(
  formTree: FieldTree<unknown>,
  containerEl?: HTMLElement,
): boolean {
  const container = containerEl ?? document.body;

  // Strategy 1: Try to find first invalid field path and focus by field name
  const firstInvalidPath = findFirstInvalidPath(formTree);

  if (firstInvalidPath) {
    const focused = focusFieldByName(firstInvalidPath, container);
    if (focused) {
      return true;
    }
  }

  // Strategy 2: Fallback to aria-invalid selector (for backwards compatibility)
  // This ensures focus works even when field names aren't properly set
  const invalidElements = container.querySelectorAll('[aria-invalid="true"]');

  if (invalidElements.length > 0) {
    const element = invalidElements[0] as HTMLElement;

    if (typeof element.focus === 'function') {
      element.focus();
      return true;
    }
  }

  return false;
}

/**
 * Recursively find the path to the first invalid leaf field in the form tree.
 *
 * @param fieldTree Current field tree node to check
 * @param currentPath Accumulated path from root (e.g., 'address.city')
 * @returns The path to the first invalid leaf field, or null if all fields are valid
 */
function findFirstInvalidPath(
  fieldTree: FieldTree<unknown>,
  currentPath = '',
): string | null {
  const fieldState = fieldTree();

  // Check if this is a valid FieldState
  if (!fieldState || typeof fieldState !== 'object') {
    return null;
  }

  // Check if this field is invalid
  const isInvalid =
    'invalid' in fieldState &&
    typeof fieldState.invalid === 'function' &&
    fieldState.invalid();

  // Try to find invalid children first (depth-first search for leaf nodes)
  const fieldTreeObj = fieldTree as unknown as Record<string, unknown>;
  const childKeys = Object.keys(fieldTreeObj).filter(
    (key) =>
      key !== 'prototype' &&
      typeof fieldTreeObj[key] === 'function' &&
      fieldTreeObj[key] !== fieldTree,
  );

  // If this field has children, recurse into them
  for (const key of childKeys) {
    const child = fieldTreeObj[key];

    // Skip if not a callable field tree
    if (typeof child !== 'function') {
      continue;
    }

    // Try to invoke and check if it returns a valid FieldState
    try {
      const childState = (child as () => unknown)();
      if (childState && typeof childState === 'object') {
        const childPath = currentPath ? `${currentPath}.${key}` : key;
        const invalidChildPath = findFirstInvalidPath(
          child as FieldTree<unknown>,
          childPath,
        );

        if (invalidChildPath) {
          return invalidChildPath;
        }
      }
    } catch {
      // Skip if child can't be invoked as a FieldTree
      continue;
    }
  }

  // If this field is invalid and has no invalid children, it's a leaf invalid field
  if (isInvalid && currentPath) {
    return currentPath;
  }

  return null;
}

/**
 * Focus an input element by field name using multiple selector strategies.
 *
 * Uses field name resolution strategies in order:
 * 1. `[data-signal-field="fieldName"]` - explicit binding
 * 2. `[id="fieldName"]` - WCAG preferred
 * 3. `[name="fieldName"]` - exact name match
 * 4. `[name$=".fieldName"]` - Signal Forms name suffix match (e.g., ng.form1.email)
 *
 * @param fieldName The field name/path (e.g., 'email' or 'address.city')
 * @param container The container element to scope the search
 * @returns `true` if element was found and focused, `false` otherwise
 */
function focusFieldByName(fieldName: string, container: HTMLElement): boolean {
  // Escape special characters in field name for use in CSS selectors
  const escapedName = CSS.escape(fieldName);

  // Try multiple selectors in order of specificity
  const selectors = [
    `[data-signal-field="${escapedName}"]`,
    `#${escapedName}`,
    `[name="${escapedName}"]`,
    // Signal Forms generates names like "ng.form1.email" - match suffix
    `[name$=".${escapedName}"]`,
  ];

  for (const selector of selectors) {
    try {
      const element = container.querySelector<HTMLElement>(selector);

      if (element && typeof element.focus === 'function') {
        element.focus();
        return true;
      }
    } catch {
      // Continue to next selector if this one is invalid
      continue;
    }
  }

  return false;
}
