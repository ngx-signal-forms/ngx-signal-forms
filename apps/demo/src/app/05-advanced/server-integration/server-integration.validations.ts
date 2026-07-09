import { email, minLength, required, schema } from '@angular/forms/signals';
import type { ProfileFormModel } from './server-integration.model';

/**
 * Client-side validation for the profile edit form.
 *
 * Kept intentionally small: this demo's teaching point is the *server*-side
 * error path (see the `action` in `server-integration.form.ts`), not an
 * elaborate client schema.
 */
export const profileSchema = schema<ProfileFormModel>((path) => {
  required(path.name, { message: 'Name is required' });
  minLength(path.name, 2, { message: 'Name must be at least 2 characters' });

  required(path.email, { message: 'Email is required' });
  email(path.email, { message: 'Enter a valid email address' });
});
