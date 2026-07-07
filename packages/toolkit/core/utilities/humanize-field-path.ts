// Angular's real prefix is `${APP_ID}.form{n}.` — APP_ID defaults to `'ng'`
// in production but is configurable (e.g. `provideAppId()`) and differs in
// test environments (`BrowserTestingModule` uses `'a'`). Match any app-id
// segment (no dots) rather than hardcoding `ng`, or the prefix silently
// survives stripping whenever APP_ID isn't the production default.
const ANGULAR_FORM_NAME_PREFIX = /^[^.]+\.form\d+\./u;

/**
 * Strips the Angular internal form prefix (`{appId}.form0.`) from a field
 * path, splits camelCase, capitalizes each segment, and joins nested paths
 * with ` / `.
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
 * @param fieldName - Raw field path, optionally prefixed with `ng.form{n}.`
 * @returns Human-readable label; nested segments are joined with ` / `
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
 * Resolver functions receive the stripped path, not the raw `{appId}.form0.*`
 * name.
 *
 * @param rawName - Raw field name that may include Angular's
 *   `{appId}.form{n}.` prefix
 * @returns Field name with the Angular internal form prefix removed
 *
 * @packageInternal Used only within `@ngx-signal-forms/toolkit` package entries.
 */
export function stripAngularFormPrefix(rawName: string): string {
  return rawName.trim().replace(ANGULAR_FORM_NAME_PREFIX, '');
}
