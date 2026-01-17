import {
  email,
  required,
  schema,
  validate,
} from '@angular/forms/signals';
import type { GlobalConfigModel } from './global-configuration.model';

/**
 * Validation schema for global configuration example
 */
export const globalConfigSchema = schema<GlobalConfigModel>((path) => {
  // Email validation
  required(path.userEmail, { message: 'Email is required' });
  email(path.userEmail, { message: 'Invalid email format' });

  // Phone validation (US format)
  required(path.userPhone, { message: 'Phone number is required' });
  validate(path.userPhone, (ctx) => {
    const value = ctx.value();
    if (value && !/^\d{3}-\d{3}-\d{4}$/.test(value)) {
      return {
        kind: 'invalid-phone',
        message: 'Phone must be in format: 123-456-7890',
      };
    }
    return null;
  });

  // Website validation (optional but must be valid)
  validate(path.userWebsite, (ctx) => {
    const value = ctx.value();
    if (value && value.trim() && !/^https?:\/\/.+\..+/i.test(value)) {
      return {
        kind: 'invalid-url',
        message: 'Website must be a valid URL',
      };
    }
    return null;
  });
});
