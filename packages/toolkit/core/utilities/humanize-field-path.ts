const ANGULAR_FORM_NAME_PREFIX = /^ng\.form\d+\./u;

/**
 * Strips the Angular internal form prefix (`ng.form0.`) from a field path,
 * splits camelCase, capitalizes each segment, and joins nested paths with
 * ` / `.
 *
 * This is the default field-label resolver used by error summaries. Override
 * it globally via `provideFieldLabels()` or `NGX_FIELD_LABEL_RESOLVER`.
 *
 * @example
 * ```typescript
 * humanizeFieldPath('address.postalCode'); // 'Address / Postal code'
 * humanizeFieldPath('ng.form0.email');     // 'Email'
 * ```
 *
 * @public
 */
export function humanizeFieldPath(fieldName: string): string {
  const strippedFieldName = fieldName
    .trim()
    .replace(ANGULAR_FORM_NAME_PREFIX, '');

  const segments = strippedFieldName
    .split('.')
    .map((segment) =>
      segment
        .replaceAll(/[_-]+/gu, ' ')
        .replaceAll(/([a-z\d])([A-Z])/gu, '$1 $2')
        .replaceAll(/\s+/gu, ' ')
        .trim(),
    )
    .filter((segment) => segment.length > 0);

  if (segments.length === 0) {
    return fieldName;
  }

  return segments
    .map(
      (segment) =>
        `${segment.charAt(0).toUpperCase()}${segment.slice(1).toLowerCase()}`,
    )
    .join(' / ');
}

/**
 * Strips the Angular internal form prefix from a raw field name.
 *
 * Resolver functions receive the stripped path, not the raw `ng.form0.*` name.
 *
 * @internal
 */
export function stripAngularFormPrefix(rawName: string): string {
  return rawName.trim().replace(ANGULAR_FORM_NAME_PREFIX, '');
}
