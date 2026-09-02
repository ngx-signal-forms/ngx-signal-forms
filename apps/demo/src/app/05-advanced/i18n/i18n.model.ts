/**
 * i18n Demo Model
 *
 * Two fields are enough to exercise the whole contract:
 * - `fullName` — required + minLength(3) → a static message and a
 *   parameterised message, both resolved through the registry.
 * - `email` — required + email format → a second static message, and a
 *   second field label.
 */
export interface I18nDemoModel {
  fullName: string;
  email: string;
}

export function createInitialI18nDemoModel(): I18nDemoModel {
  return { fullName: '', email: '' };
}
