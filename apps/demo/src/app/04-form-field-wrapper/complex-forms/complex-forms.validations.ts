import {
  applyEach,
  email,
  max,
  min,
  minLength,
  pattern,
  required,
  schema,
  validate,
} from '@angular/forms/signals';
import type { ComplexFormModel } from './complex-forms.model';

/**
 * Complex Forms Validation Schema
 *
 * Demonstrates validation for:
 * - Nested objects
 * - Dynamic arrays
 * - Cross-field validation
 */
export const complexFormSchema = schema<ComplexFormModel>((path) => {
  // Personal Information
  required(path.personalInfo.firstName, { message: 'First name is required' });
  minLength(path.personalInfo.firstName, 2, {
    message: 'At least 2 characters',
  });

  required(path.personalInfo.lastName, { message: 'Last name is required' });
  minLength(path.personalInfo.lastName, 2, {
    message: 'At least 2 characters',
  });

  required(path.personalInfo.email, { message: 'Email is required' });
  email(path.personalInfo.email, { message: 'Valid email required' });

  required(path.personalInfo.age, { message: 'Age is required' });
  min(path.personalInfo.age, 18, { message: 'Must be 18 or older' });
  max(path.personalInfo.age, 120, { message: 'Invalid age' });

  // Address Information
  required(path.addressInfo.street, { message: 'Street is required' });
  required(path.addressInfo.city, { message: 'City is required' });
  required(path.addressInfo.zipCode, { message: 'Zip code is required' });
  pattern(path.addressInfo.zipCode, /^\d{5}(-\d{4})?$/, {
    message: 'Format: 12345 or 12345-6789',
  });
  required(path.addressInfo.country, { message: 'Country is required' });

  // Skills array validation
  applyEach(path.skills, (skill) => {
    required(skill.name, { message: 'Skill name is required' });
    minLength(skill.name, 2, { message: 'At least 2 characters' });
    required(skill.level, { message: 'Skill level is required' });
    min(skill.level, 1, { message: 'Level must be 1-10' });
    max(skill.level, 10, { message: 'Level must be 1-10' });
  });

  // Contacts array validation
  applyEach(path.contacts, (contact) => {
    required(contact.type, { message: 'Contact type is required' });
    required(contact.value, { message: 'Contact value is required' });

    // Conditional validation based on type
    // Note: In real app, would use conditional validation
    // For now, just ensure value is not empty
    minLength(contact.value, 3, { message: 'At least 3 characters' });
  });

  // Preferences
  required(path.preferences.contactMethod, {
    message: 'Preferred contact method is required',
  });
  validate(path.preferences.contactMethod, (ctx) => {
    const value = ctx.value();
    if (value === 'sms') {
      return {
        kind: 'warn:sms-rate',
        message: 'SMS messages may incur carrier charges',
      };
    }
    return null;
  });
});
