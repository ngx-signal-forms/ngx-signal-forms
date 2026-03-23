import { create, enforce, test, warn } from 'vest';
import type { ZodVestValidationModel } from './zod-vest-validation.schemas';

const EU_VAT_COUNTRIES = new Set(['DE', 'NL', 'BE']);
const FREE_EMAIL_DOMAINS = new Set(['gmail.com', 'outlook.com', 'yahoo.com']);
const PASSWORD_SYMBOL_REGEX = /[!@#$%^&*]/;

function getEmailDomain(email: string): string | null {
  const [, domain] = email.trim().toLowerCase().split('@');
  return domain || null;
}

export const zodVestBusinessSuite = create(
  (data: Readonly<ZodVestValidationModel>) => {
    test(
      'companyName',
      'Company name is required for business accounts',
      () => {
        if (data.accountType === 'business') {
          enforce(data.companyName).isNotBlank();
        }
      },
    );

    test(
      'vatNumber',
      'VAT number is required for business accounts in DE, NL, or BE',
      () => {
        if (
          data.accountType === 'business' &&
          EU_VAT_COUNTRIES.has(data.country)
        ) {
          enforce(data.vatNumber).isNotBlank();
        }
      },
    );

    test('vatNumber', 'Personal accounts should leave VAT number empty', () => {
      if (data.accountType === 'personal' && data.vatNumber.trim()) {
        enforce(false).isTruthy();
      }
    });

    test('email', 'Business accounts must use a company email domain', () => {
      if (data.accountType !== 'business') {
        return;
      }

      const domain = getEmailDomain(data.email);
      if (!domain) {
        return;
      }

      enforce(!FREE_EMAIL_DOMAINS.has(domain)).isTruthy();
    });

    test(
      'password',
      'Password must not include your first or last name',
      () => {
        const password = data.password.trim().toLowerCase();
        const firstName = data.firstName.trim().toLowerCase();
        const lastName = data.lastName.trim().toLowerCase();

        if (!password || (!firstName && !lastName)) {
          return;
        }

        enforce(
          (!firstName || !password.includes(firstName)) &&
            (!lastName || !password.includes(lastName)),
        ).isTruthy();
      },
    );

    test('password', 'Add a symbol to make the password stronger', () => {
      if (!data.password.trim()) {
        return;
      }

      warn();
      enforce(PASSWORD_SYMBOL_REGEX.test(data.password)).isTruthy();
    });

    test(
      'vatNumber',
      'Include the country prefix in the VAT number for faster review',
      () => {
        if (data.accountType !== 'business' || !data.vatNumber.trim()) {
          return;
        }

        warn();
        enforce(
          data.vatNumber.trim().toUpperCase().startsWith(data.country),
        ).isTruthy();
      },
    );
  },
);
