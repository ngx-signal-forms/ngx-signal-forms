import { email, minLength, required, schema } from '@angular/forms/signals';
import type { I18nDemoModel } from './i18n.model';

/**
 * No `{ message }` option anywhere in this schema. The validators emit only
 * their `kind` (`required`, `minLength`, `email`) — the registry supplied by
 * `provideErrorMessages()` in `i18n.form.ts` is what turns those kinds into
 * display text, per the current language.
 */
export const i18nDemoSchema = schema<I18nDemoModel>((path) => {
  required(path.fullName);
  minLength(path.fullName, 3);

  required(path.email);
  email(path.email);
});
