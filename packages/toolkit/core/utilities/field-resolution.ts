/**
 * Resolves the field name from an HTML element's `id` attribute.
 *
 * Field identity is deterministic: the bound control must have an `id`.
 * Standalone error/headless APIs require an explicit `fieldName` input;
 * wrappers may infer from the control's `id`.
 *
 * @param element - The HTML element to resolve the field name from
 * @returns The element's `id` attribute value, or `null` if absent
 */
export function resolveFieldName(element: HTMLElement): string | null {
  const id = element.getAttribute('id');
  return id || null;
}

/**
 * Generates an error ID for a field, following WCAG best practices.
 *
 * @param fieldName - The field name
 * @returns The error ID in format: `{fieldName}-error`
 *
 * @example
 * ```typescript
 * generateErrorId('email') // Returns: 'email-error'
 * generateErrorId('address.city') // Returns: 'address.city-error'
 * ```
 */
export function generateErrorId(fieldName: string): string {
  return `${fieldName}-error`;
}

/**
 * Generates a warning ID for a field, following WCAG best practices.
 *
 * @param fieldName - The field name
 * @returns The warning ID in format: `{fieldName}-warning`
 *
 * @example
 * ```typescript
 * generateWarningId('password') // Returns: 'password-warning'
 * generateWarningId('address.zipCode') // Returns: 'address.zipCode-warning'
 * ```
 */
export function generateWarningId(fieldName: string): string {
  return `${fieldName}-warning`;
}
