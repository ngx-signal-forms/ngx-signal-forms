import { email, required, schema, validate } from '@angular/forms/signals';
import { warningError } from '@ngx-signal-forms/toolkit';
import type { ProfileFormModel } from './profile-form.model';

/**
 * Profile form schema.
 *
 * - blocking errors: `required` + `email` on the email field, `required` on role
 * - warnings: a non-blocking nudge on the email field when the value uses a
 *   personal-domain heuristic. Demonstrates the toolkit's warning support
 *   through the PrimeNG idiom (`<small class="p-warn">`).
 */
export const profileFormSchema = schema<ProfileFormModel>((path) => {
  required(path.email, { message: 'Email is required' });
  email(path.email, { message: 'Please enter a valid email address' });

  // Non-blocking warning — surfaces through the renderer's warning branch
  // without preventing submission.
  validate(path.email, (ctx) => {
    const value = ctx.value();
    if (value && /\S+@(gmail|yahoo|hotmail|outlook)\.\S+/i.test(value)) {
      return warningError(
        'personal-email',
        'Heads up — personal email domains may complicate account recovery.',
      );
    }
    return null;
  });

  required(path.role, { message: 'Role is required' });
});
