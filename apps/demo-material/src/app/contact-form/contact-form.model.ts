/**
 * Model for the Material reference contact form.
 *
 * Three control kinds covered by the demo:
 * - text input (`name`, `email`)
 * - select (`topic`)
 * - checkbox (`agree`)
 */
export interface ContactFormModel {
  name: string;
  email: string;
  topic: '' | 'support' | 'sales' | 'feedback';
  agree: boolean;
}

export const INITIAL_CONTACT_MODEL: ContactFormModel = {
  name: '',
  email: '',
  topic: '',
  agree: false,
};
