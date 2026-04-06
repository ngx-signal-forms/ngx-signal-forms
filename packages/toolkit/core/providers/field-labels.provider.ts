import { InjectionToken, type Provider } from '@angular/core';

/**
 * A function that resolves a raw field path (e.g. `'address.postalCode'`)
 * into a human-readable display label (e.g. `'Postcode'`).
 *
 * The raw path has the Angular internal prefix (`ng.form0.`) already stripped.
 */
export type FieldLabelResolver = (rawFieldPath: string) => string;

/**
 * A static map from field paths to display labels.
 *
 * Keys are dot-separated paths **without** the Angular internal prefix.
 * For nested fields, use the full path (e.g. `'address.postalCode'`).
 */
export type FieldLabelMap = Record<string, string>;

/**
 * Injection token for customizing how field paths are displayed in error
 * summaries.
 *
 * The default factory applies `humanizeFieldPath`, which splits camelCase,
 * capitalizes segments, and joins nested paths with ` / `.
 *
 * Override this token to:
 * - Provide translated labels (Dutch, German, Japanese, ...)
 * - Map internal field paths to user-facing names
 * - Integrate with `$localize`, `ngx-translate`, or any i18n library
 *
 * @see {@link provideFieldLabels}
 *
 * @internal
 */
export const NGX_FIELD_LABEL_RESOLVER = new InjectionToken<FieldLabelResolver>(
  'NGX_FIELD_LABEL_RESOLVER',
);

/**
 * Provides a field label resolver for customizing how field paths appear in
 * error summaries and other toolkit components.
 *
 * ## Usage
 *
 * ### Static label map
 *
 * Pass a record mapping field paths to display names. Unmapped paths fall
 * back to the default `humanizeFieldPath` behavior.
 *
 * ```typescript
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideFieldLabels({
 *       contactEmail: 'E-mailadres',
 *       'address.postalCode': 'Postcode',
 *       'address.street': 'Straat',
 *     }),
 *   ],
 * };
 * ```
 *
 * ### Custom resolver function
 *
 * For dynamic resolution (i18n libraries, locale-aware logic), pass a
 * factory function. The factory runs in an injection context so you can
 * call `inject()`.
 *
 * ```typescript
 * provideFieldLabels(() => {
 *   const translate = inject(TranslateService);
 *   return (fieldPath) => translate.instant(`fields.${fieldPath}`) || humanizeFieldPath(fieldPath);
 * })
 * ```
 *
 * ### With `@angular/localize`
 *
 * ```typescript
 * provideFieldLabels({
 *   contactEmail: $localize`:@@field.contactEmail:Contact email`,
 *   'address.postalCode': $localize`:@@field.postalCode:Postal code`,
 * })
 * ```
 *
 * @param configOrFactory - A static `FieldLabelMap` or a factory returning a `FieldLabelResolver`
 * @returns Provider for Angular DI
 *
 * @see {@link NGX_FIELD_LABEL_RESOLVER}
 * @see {@link humanizeFieldPath}
 */
export function provideFieldLabels(
  configOrFactory: FieldLabelMap | (() => FieldLabelResolver),
): Provider {
  return {
    provide: NGX_FIELD_LABEL_RESOLVER,
    useFactory:
      typeof configOrFactory === 'function'
        ? configOrFactory
        : () => createMapResolver(configOrFactory),
  };
}

function createMapResolver(map: FieldLabelMap): FieldLabelResolver {
  return (fieldPath) => map[fieldPath] ?? fieldPath;
}
