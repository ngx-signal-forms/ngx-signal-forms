import {
  customError,
  email,
  max,
  maxLength,
  min,
  minLength,
  required,
  schema,
  validate,
} from '@angular/forms/signals';

/**
 * Form model for the basic usage example.
 *
 * Demonstrates various field types with NgxSignalFormField wrapper:
 * - Text input (name)
 * - Email input (email)
 * - URL input (website)
 * - Number input (age)
 * - Textarea (bio)
 * - Select dropdown (country)
 * - Checkbox (agreeToTerms)
 */
export interface BasicUsageModel {
  name: string;
  email: string;
  website: string;
  age: number;
  bio: string;
  country: string;
  agreeToTerms: boolean;
}

/**
 * Validation schema for the basic usage example.
 *
 * Demonstrates various validation patterns:
 * - Required fields
 * - Email format validation
 * - URL format validation (optional field)
 * - Number range validation
 * - Length constraints
 * - Checkbox requirement
 *
 * @example
 * ```typescript
 * const formData = signal({
 *   name: '',
 *   email: '',
 *   website: '',
 *   age: 0,
 *   bio: '',
 *   country: '',
 *   agreeToTerms: false
 * });
 * const myForm = form(formData, basicUsageSchema);
 * ```
 */
export const basicUsageSchema = schema<BasicUsageModel>((path) => {
  // Text input
  required(path.name, { message: 'Name is required' });
  minLength(path.name, 2, {
    message: 'Name must be at least 2 characters',
  });

  // Email input
  required(path.email, { message: 'Email is required' });
  email(path.email, { message: 'Email format is invalid' });

  // URL input (optional but must be valid if provided)
  validate(path.website, (ctx) => {
    const value = ctx.value();
    if (value && value.trim()) {
      if (!/^https?:\/\/.+\..+/i.test(value)) {
        return customError({
          kind: 'invalid-url',
          message: 'Website must be a valid URL',
        });
      }
    }
    return null;
  });

  // Number input
  required(path.age, { message: 'Age is required' });
  min(path.age, 18, { message: 'Age must be at least 18' });
  max(path.age, 119, { message: 'Age must be less than 120' });

  // Textarea
  required(path.bio, { message: 'Bio is required' });
  minLength(path.bio, 20, {
    message: 'Bio must be at least 20 characters',
  });
  maxLength(path.bio, 500, {
    message: 'Bio must be less than 500 characters',
  });

  // Select
  required(path.country, { message: 'Country is required' });

  // Checkbox
  validate(path.agreeToTerms, (ctx) => {
    if (!ctx.value()) {
      return customError({
        kind: 'required',
        message: 'You must agree to the terms and conditions',
      });
    }
    return null;
  });
});
