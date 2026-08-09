import {
  debounce,
  maxLength,
  minLength,
  required,
  schema,
} from '@angular/forms/signals';
import type { AutosaveProfileModel } from './autosave.model';

/**
 * `debounce(path, 500)` — the native Angular 22 schema rule — delays writing
 * a UI edit into the field's own value signal until 500ms after the user
 * stops typing that field. Everything downstream (`dirty()`, `valid()`, and
 * the autosave `httpResource` request built from them) only ever sees the
 * settled value, so no hand-rolled RxJS `debounceTime` is needed to get a
 * debounced autosave.
 *
 * Each field debounces independently — typing in `bio` does not reset or
 * extend `displayName`'s timer, and vice versa.
 */
export const autosaveProfileSchema = schema<AutosaveProfileModel>((path) => {
  debounce(path.displayName, 500);
  required(path.displayName, { message: 'Display name is required' });
  minLength(path.displayName, 2, {
    message: 'Display name must be at least 2 characters',
  });

  debounce(path.bio, 500);
  maxLength(path.bio, 280, { message: 'Bio must be 280 characters or fewer' });
});
