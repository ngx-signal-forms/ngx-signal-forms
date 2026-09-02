import { required, schema, validate } from '@angular/forms/signals';
import type { SingleModelWizardValue } from './single-model-wizard.model';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Free/consumer email providers. Express shipping is reserved for accounts
 * using a work email — a rule that reads step 1's `email` while validating
 * step 2's `expressShipping` field.
 */
const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'icloud.com',
]);

/**
 * Single schema for the whole wizard model. Every rule — single-field and
 * cross-step alike — is declared once, against the one shared `form()`
 * model. There is no per-step schema to keep in sync.
 */
export const singleModelWizardSchema = schema<SingleModelWizardValue>(
  (path) => {
    required(path.account.fullName, { message: 'Full name is required' });
    required(path.account.email, { message: 'Email is required' });
    validate(path.account.email, (ctx) => {
      const value = ctx.value();
      if (!value || EMAIL_PATTERN.test(value)) return null;
      return { kind: 'email', message: 'Enter a valid email address' };
    });

    required(path.shipping.street, { message: 'Street address is required' });
    required(path.shipping.city, { message: 'City is required' });
    required(path.shipping.postalCode, {
      message: 'Postal code is required',
    });

    // Cross-step rule: express shipping (step 2) is gated on the email
    // domain entered on step 1. Reading `ctx.valueOf(path.account.email)`
    // is the whole trick — no store, no event, no manual sync.
    validate(path.shipping.expressShipping, (ctx) => {
      if (!ctx.value()) return null; // unchecked: nothing to validate

      const email = ctx.valueOf(path.account.email);
      const domain = email.split('@')[1]?.toLowerCase();

      if (!domain || FREE_EMAIL_DOMAINS.has(domain)) {
        return {
          kind: 'expressShippingRequiresWorkEmail',
          message: 'Express shipping requires a work email address (step 1)',
        };
      }
      return null;
    });
  },
);
