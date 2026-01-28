/**
 * Complex Forms Model - Demonstrates nested objects and dynamic arrays
 *
 * This model showcases realistic form complexity with:
 * - Nested objects (personal info, address)
 * - Dynamic arrays (skills, contacts)
 * - Mixed field types (text, number, boolean, select)
 */

export interface SkillModel {
  name: string;
  level: number; // 1-10
}

export interface ContactModel {
  type: 'email' | 'phone';
  value: string;
}

export interface ComplexFormModel {
  // Personal Information (nested object)
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    age: number;
  };

  // Address Information (nested object)
  addressInfo: {
    street: string;
    city: string;
    zipCode: string;
    country: string;
  };

  // Skills (dynamic array)
  skills: SkillModel[];

  // Contact Methods (dynamic array with mixed types)
  contacts: ContactModel[];

  // Preferences
  preferences: {
    newsletter: boolean;
    notifications: boolean;
    contactMethod: string;
  };
}
