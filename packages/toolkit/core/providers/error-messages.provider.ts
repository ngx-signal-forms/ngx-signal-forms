import { InjectionToken, type Provider } from '@angular/core';

/**
 * Error message registry for customizing validation error display.
 *
 * Maps error kinds to display messages. Supports:
 * - String literals for static messages
 * - Factory functions for dynamic messages with parameters
 *
 * ## Philosophy: Zero-config by default
 *
 * Standard Schema libraries (Zod, Valibot, ArkType) include error messages in validation results.
 * This registry provides optional overrides for:
 * - Centralized message management (DRY principle)
 * - Internationalization (i18n)
 * - Customizing Angular Signal Forms built-in validators
 *
 * ## Message Priority (3-tier system)
 *
 * 1. **Validator message** - From Zod/Valibot schema (e.g., `z.string().email('Invalid email')`)
 * 2. **Registry override** - From this provider (optional)
 * 3. **Default fallback** - Toolkit's built-in messages
 *
 * The registry is completely optional - if not provided, validator messages work automatically.
 *
 * @example Zero-config (recommended for Standard Schema users)
 * ```typescript
 * /// Zod schema with custom messages
 * const userSchema = z.object({
 *   email: z.string().email('Please enter a valid email address'),
 *   password: z.string().min(8, 'Password must be at least 8 characters'),
 * });
 *
 * /// ✅ No configuration needed! Messages from Zod schema work automatically
 * form(signal({ email: '', password: '' }), (path) => {
 *   validateStandardSchema(path, userSchema);
 * });
 * ```
 *
 * @example Centralized override (DRY for built-in validators)
 * ```typescript
 * /// Override Angular Signal Forms built-in validators
 * provideErrorMessages({
 *   required: 'This field is required',
 *   email: 'Please enter a valid email address',
 *   minLength: ({ minLength }) => `At least ${minLength} characters required`,
 *   maxLength: ({ maxLength }) => `Maximum ${maxLength} characters allowed`,
 *   username_taken: 'This username is already taken', // Custom async validator
 * })
 * ```
 *
 * @example Internationalization with JSON files
 * ```typescript
 * /// locales/en.json
 * {
 *   "validation": {
 *     "required": "This field is required",
 *     "email": "Please enter a valid email address",
 *     "minLength": "At least {minLength} characters required",
 *     "maxLength": "Maximum {maxLength} characters allowed"
 *   }
 * }
 *
 * /// locales/ja.json
 * {
 *   "validation": {
 *     "required": "このフィールドは必須です",
 *     "email": "有効なメールアドレスを入力してください",
 *     "minLength": "{minLength}文字以上入力してください",
 *     "maxLength": "{maxLength}文字以内で入力してください"
 *   }
 * }
 *
 * /// app.config.ts
 * import { LOCALE_ID } from '@angular/core';
 * import enMessages from './locales/en.json';
 * import jaMessages from './locales/ja.json';
 *
 * provideErrorMessages(() => {
 *   const locale = inject(LOCALE_ID);
 *   const messages = locale === 'ja' ? jaMessages.validation : enMessages.validation;
 *
 *   return {
 *     required: messages.required,
 *     email: messages.email,
 *     minLength: ({ minLength }) => messages.minLength.replace('{minLength}', String(minLength)),
 *     maxLength: ({ maxLength }) => messages.maxLength.replace('{maxLength}', String(maxLength)),
 *   };
 * })
 * ```
 *
 * @example With ngx-translate (alternative pattern)
 * ```typescript
 * import { TranslateService } from '@ngx-translate/core';
 *
 * provideErrorMessages(() => {
 *   const translate = inject(TranslateService);
 *
 *   return {
 *     required: translate.instant('validation.required'),
 *     email: translate.instant('validation.email'),
 *     minLength: ({ minLength }) =>
 *       translate.instant('validation.minLength', { minLength }),
 *   };
 * })
 * ```
 *
 * @see {@link provideErrorMessages} Provider factory function
 */
export interface ErrorMessageRegistry {
  /**
   * Map error kinds to display messages.
   *
   * Keys are error kinds (e.g., 'required', 'email', 'minLength', 'custom_error_kind').
   * Values are either:
   * - String literals for static messages
   * - Factory functions for dynamic messages with parameters
   *
   * ## Built-in Angular Signal Forms validators:
   * - `required` - Required field validation
   * - `email` - Email format validation
   * - `minLength` - Minimum length validation (params: `{ minLength: number }`)
   * - `maxLength` - Maximum length validation (params: `{ maxLength: number }`)
   * - `min` - Minimum value validation (params: `{ min: number }`)
   * - `max` - Maximum value validation (params: `{ max: number }`)
   * - `pattern` - Pattern validation (params: `{ pattern: string }`)
   *
   * ## Custom validator kinds:
   * - Any string key for custom validators (e.g., 'username_taken', 'password_weak')
   * - Use 'warn:*' prefix for non-blocking warnings (e.g., 'warn:weak-password')
   *
   * @example Static messages
   * ```typescript
   * const registry: ErrorMessageRegistry = {
   *   required: 'This field is required',
   *   email: 'Invalid email address',
   * };
   * ```
   *
   * @example Factory functions with parameters
   * ```typescript
   * const registry: ErrorMessageRegistry = {
   *   minLength: ({ minLength }) => `At least ${minLength} characters`,
   *   maxLength: ({ maxLength }) => `Maximum ${maxLength} characters`,
   *   min: ({ min }) => `Must be at least ${min}`,
   *   max: ({ max }) => `Must be at most ${max}`,
   * };
   * ```
   *
   * @example Custom validators
   * ```typescript
   * const registry: ErrorMessageRegistry = {
   *   username_taken: 'This username is already taken',
   *   password_weak: ({ score }) => `Password strength: ${score}/5`,
   *   'warn:weak-password': 'Consider using 12+ characters',
   * };
   * ```
   */
  // Use index signature for extensibility (built-in + custom validators)
  [errorKind: string]:
    | string
    | ((params: Record<string, unknown>) => string)
    | undefined;
}

/**
 * Injection token for error message registry.
 *
 * Used by NgxSignalFormErrorComponent to resolve error messages.
 * Completely optional - if not provided, validator messages work automatically.
 *
 * @see {@link ErrorMessageRegistry}
 * @see {@link provideErrorMessages}
 *
 * @internal
 */
export const NGX_ERROR_MESSAGES = new InjectionToken<ErrorMessageRegistry>(
  'NGX_ERROR_MESSAGES',
  {
    providedIn: 'root',
    factory: () => ({}), // Empty registry by default (zero-config)
  },
);

/**
 * Provides error message registry for customizing validation error display.
 *
 * ## Philosophy: Zero-config by default
 *
 * Standard Schema libraries (Zod, Valibot, ArkType) include error messages.
 * This provider is **completely optional** and only needed for:
 * - Centralized message management (DRY principle)
 * - Internationalization (i18n)
 * - Customizing Angular Signal Forms built-in validators
 *
 * ## Message Priority (3-tier system)
 *
 * 1. **Validator message** - From Zod/Valibot schema (used first!)
 * 2. **Registry override** - From this provider (optional fallback)
 * 3. **Default fallback** - Toolkit's built-in messages
 *
 * @param configOrFactory Static config object or factory function for dynamic messages
 * @returns Provider for Angular DI
 *
 * @example Zero-config (recommended)
 * ```typescript
 * /// No provider needed! Zod messages work automatically
 * const userSchema = z.object({
 *   email: z.string().email('Invalid email'),
 * });
 *
 * form(signal({}), (path) => {
 *   validateStandardSchema(path, userSchema);
 * });
 * ```
 *
 * @example Static configuration
 * ```typescript
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideErrorMessages({
 *       required: 'This field is required',
 *       email: 'Invalid email address',
 *       minLength: ({ minLength }) => `At least ${minLength} characters`,
 *     }),
 *   ],
 * };
 * ```
 *
 * @example Dynamic provider (i18n with locale injection)
 * ```typescript
 * import enMessages from './locales/en.json';
 * import jaMessages from './locales/ja.json';
 *
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideErrorMessages(() => {
 *       const locale = inject(LOCALE_ID);
 *       const messages = locale === 'ja' ? jaMessages.validation : enMessages.validation;
 *
 *       return {
 *         required: messages.required,
 *         email: messages.email,
 *         minLength: ({ minLength }) =>
 *           messages.minLength.replace('{minLength}', String(minLength)),
 *       };
 *     }),
 *   ],
 * };
 * ```
 *
 * @example With ngx-translate
 * ```typescript
 * provideErrorMessages(() => {
 *   const translate = inject(TranslateService);
 *
 *   return {
 *     required: translate.instant('validation.required'),
 *     email: translate.instant('validation.email'),
 *   };
 * })
 * ```
 *
 * @example With @angular/localize
 * ```typescript
 * provideErrorMessages({
 *   required: $localize`:@@validation.required:This field is required`,
 *   email: $localize`:@@validation.email:Invalid email address`,
 * })
 * ```
 *
 * @see {@link ErrorMessageRegistry}
 * @see {@link NGX_ERROR_MESSAGES}
 */
export function provideErrorMessages(
  configOrFactory: ErrorMessageRegistry | (() => ErrorMessageRegistry),
): Provider {
  return {
    provide: NGX_ERROR_MESSAGES,
    useFactory:
      typeof configOrFactory === 'function'
        ? configOrFactory
        : () => configOrFactory,
  };
}
