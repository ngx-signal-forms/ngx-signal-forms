import { pattern, required, schema } from '@angular/forms/signals';
import type { FieldIdentityModel } from './field-identity.model';

/**
 * Both fields are invalid while empty, so the page shows real
 * `aria-invalid` / `aria-describedby` wiring the moment it loads in
 * "Immediate" mode — which is what makes the collapse behavior in section 2
 * observable without typing first.
 */
export const fieldIdentitySchema = schema<FieldIdentityModel>((path) => {
  required(path.emailAddress, { message: 'Email address is required' });
  pattern(path.emailAddress, /^[^@\s]+@[^@\s]+\.[^@\s]+$/u, {
    message: 'Enter a valid email address',
  });

  required(path.deliveryNote, { message: 'Delivery note is required' });
});
