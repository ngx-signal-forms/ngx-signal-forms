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
 * Options for building an `aria-describedby` chain in manual ARIA mode.
 */
export interface AriaDescribedByChainOptions {
  /** Base IDs that are always included (e.g. hint elements). */
  readonly baseIds?: readonly string[];
  /** Whether the error ID should be appended. */
  readonly showErrors?: boolean;
  /** Whether the warning ID should be appended. */
  readonly showWarnings?: boolean;
}

/**
 * Builds an `aria-describedby` ID chain for a field, following the same
 * conventions as the auto-ARIA layer.
 *
 * Use this when a custom control opts into `ngxSignalFormControlAria="manual"`
 * and needs to assemble its own described-by chain without duplicating the
 * ID-generation logic.
 *
 * @param fieldName - The field name (must match the control's `id`)
 * @param options - Controls which IDs are included in the chain
 * @returns A space-separated ID string, or `null` if no IDs apply
 *
 * @example
 * ```typescript
 * protected readonly describedBy = computed(() =>
 *   buildAriaDescribedBy('accessibilityAudit', {
 *     baseIds: ['accessibilityAudit-hint'],
 *     showErrors: shouldShowErrors(
 *       fieldState.invalid(), fieldState.touched(), strategy, submittedStatus,
 *     ),
 *   }),
 * );
 * ```
 */
export function buildAriaDescribedBy(
  fieldName: string,
  options: AriaDescribedByChainOptions = {},
): string | null {
  const parts: string[] = options.baseIds ? [...options.baseIds] : [];

  if (options.showErrors) {
    parts.push(generateErrorId(fieldName));
  }

  if (options.showWarnings) {
    parts.push(generateWarningId(fieldName));
  }

  return parts.length > 0 ? parts.join(' ') : null;
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
