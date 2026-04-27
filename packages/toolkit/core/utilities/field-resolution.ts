import { computed, type Signal } from '@angular/core';

/**
 * Normalize a potential field name into the deterministic v1 identity form.
 *
 * Returns `null` for nullish or whitespace-only inputs, and trims leading
 * and trailing whitespace everywhere else. This is the single source of
 * truth for "is this a usable field name?" — wrappers, headless directives,
 * and consumer-built field-identity surfaces should call it before using
 * a name as the basis for an `id` or `aria-describedby` chain.
 *
 * @example
 * ```typescript
 * normalizeFieldName('email');      // 'email'
 * normalizeFieldName('  email  ');  // 'email'
 * normalizeFieldName('   ');        // null
 * normalizeFieldName('');           // null
 * normalizeFieldName(null);         // null
 * normalizeFieldName(undefined);    // null
 * ```
 */
export function normalizeFieldName(
  fieldName: string | null | undefined,
): string | null {
  if (fieldName == null) {
    return null;
  }

  const trimmed = fieldName.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Resolve the first usable field name from a list of candidates.
 *
 * Each candidate is run through {@link normalizeFieldName} and the first
 * non-null result wins. Returns `null` only when every candidate is
 * nullish, empty, or whitespace-only.
 *
 * Use this when assembling a field name from a precedence chain — explicit
 * input first, host element id second, parent context third — and you want
 * the same trimming/empty-collapse rules applied to every source.
 *
 * @example
 * ```typescript
 * // explicit input wins, then host id, then context
 * resolveFieldNameFromCandidates(
 *   this.fieldName(),
 *   this.#elementRef.nativeElement.id,
 *   this.#fieldContext?.fieldName(),
 * );
 * ```
 */
export function resolveFieldNameFromCandidates(
  ...fieldNameCandidates: readonly (string | null | undefined)[]
): string | null {
  for (const candidate of fieldNameCandidates) {
    const resolved = normalizeFieldName(candidate);
    if (resolved !== null) {
      return resolved;
    }
  }

  return null;
}

/**
 * Resolves the field name from an HTML element's `id`.
 *
 * Field identity is deterministic: the bound control must have an `id`.
 * Standalone error/headless APIs require an explicit `fieldName` input;
 * wrappers may infer from the control's `id`.
 *
 * Resolution rules (frozen for v1):
 * - Reads `getAttribute('id')` first, then the `element.id` property as a
 *   fallback. The two are equivalent for normal HTML hosts; the property
 *   read covers attribute-less / detached cases.
 * - Whitespace is trimmed. `"  email  "` → `"email"`. Whitespace-only and
 *   empty strings collapse to `null`, treated as "no id".
 *
 * @param element - The HTML element to resolve the field name from
 * @returns The trimmed `id`, or `null` if the element has no usable id
 */
export function resolveFieldName(element: HTMLElement): string | null {
  return resolveFieldNameFromCandidates(element.getAttribute('id'), element.id);
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
 * Computed ID signals for a resolved field name.
 *
 * @internal
 */
export interface FieldMessageIdSignals {
  readonly errorId: Signal<string | null>;
  readonly warningId: Signal<string | null>;
}

/**
 * Create computed error / warning IDs for a resolved field name.
 *
 * @internal
 */
export function createFieldMessageIdSignals(
  fieldName: () => string | null,
): FieldMessageIdSignals {
  return {
    errorId: computed(() => {
      const name = fieldName();
      return name === null ? null : generateErrorId(name);
    }),
    warningId: computed(() => {
      const name = fieldName();
      return name === null ? null : generateWarningId(name);
    }),
  };
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
