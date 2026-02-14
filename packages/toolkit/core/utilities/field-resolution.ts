import { Injector } from '@angular/core';
import { injectFormConfig } from './inject-form-config';
import { unwrapValue } from './unwrap-signal-or-value';

/**
 * Resolves the field name from an HTML element using a 4-tier priority system.
 *
 * Priority order:
 * 1. `data-signal-field` attribute (explicit nested paths like "address.city")
 * 2. Custom resolver from global configuration
 * 3. `id` attribute (WCAG preferred for label association)
 * 4. `name` attribute (fallback)
 *
 * @param element - The HTML element to resolve the field name from
 * @param injector - Optional injector for use outside injection context
 * @returns The resolved field name or null if not found
 * @throws Error in strict mode when field name cannot be resolved
 *
 * @example
 * ```html
 * <!-- Priority 1: Explicit field path -->
 * <input [formField]="form.address.city" data-signal-field="address.city" />
 *
 * <!-- Priority 3: Using id (WCAG best practice) -->
 * <label for="email">Email</label>
 * <input id="email" [formField]="form.email" />
 *
 * <!-- Priority 4: Using name -->
 * <input name="phone" [formField]="form.phone" />
 * ```
 */
export function resolveFieldName(
  element: HTMLElement,
  injector?: Injector,
): string | null {
  const config = injectFormConfig(injector);

  // Priority 1: data-signal-field attribute
  const dataAttribute = element.getAttribute('data-signal-field');
  if (dataAttribute) {
    return dataAttribute;
  }

  // Priority 2: Custom resolver
  if (config.fieldNameResolver) {
    const resolver = unwrapValue(config.fieldNameResolver) as (
      element: HTMLElement,
    ) => string | null;
    const customName = resolver(element);
    if (customName) {
      return customName;
    }
  }

  // Priority 3: id attribute (WCAG preferred)
  const id = element.getAttribute('id');
  if (id) {
    return id;
  }

  // Priority 4: name attribute (fallback)
  const name = element.getAttribute('name');
  if (name) {
    return name;
  }

  // Strict mode: throw error if field name cannot be resolved
  if (config.strictFieldResolution) {
    throw new Error(
      `[ngx-signal-forms] Cannot resolve field name for element. ` +
        `Please add one of: data-signal-field, id, or name attribute. ` +
        `Element tag: <${element.tagName.toLowerCase()}>`,
    );
  }

  if (config.debug || typeof ngDevMode === 'undefined' || ngDevMode) {
    console.warn(
      '[ngx-signal-forms] Could not resolve field name for element:',
      element,
    );
  }

  return null;
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
