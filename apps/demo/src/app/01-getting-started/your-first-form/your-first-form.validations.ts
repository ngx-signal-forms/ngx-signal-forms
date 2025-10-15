import { email, minLength, required, schema } from '@angular/forms/signals';
import type { ContactFormModel } from './your-first-form.model';

/**
 * Validation schema for contact form
 * Demonstrates basic validation patterns
 */
export const contactFormSchema = schema<ContactFormModel>((path) => {
  // Name validation
  required(path.name, { message: 'Name is required' });
  minLength(path.name, 2, { message: 'Name must be at least 2 characters' });

  // Email validation
  required(path.email, { message: 'Email is required' });
  email(path.email, { message: 'Please enter a valid email address' });

  // Message validation
  required(path.message, { message: 'Message is required' });
  minLength(path.message, 10, {
    message: 'Message must be at least 10 characters',
  });
});
