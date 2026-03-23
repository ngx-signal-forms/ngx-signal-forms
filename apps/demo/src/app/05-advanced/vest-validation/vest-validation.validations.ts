import { create, enforce, test, warn } from 'vest';
import type { VestValidationModel } from './vest-validation.model';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EU_VAT_COUNTRIES = new Set(['DE', 'NL', 'BE']);
const FREE_EMAIL_DOMAINS = new Set(['gmail.com', 'outlook.com', 'yahoo.com']);
const PERSONAL_TEAM_LIMIT = 10;
const REFERRAL_TEAM_LIMIT = 3;
const ANNUAL_BILLING_REVIEW_THRESHOLD = 50;

function parseTeamSize(value: string): number | null {
  const normalized = value.trim();
  if (!/^\d+$/.test(normalized)) {
    return null;
  }

  return Number.parseInt(normalized, 10);
}

function getEmailDomain(email: string): string | null {
  const [, domain] = email.trim().toLowerCase().split('@');
  return domain || null;
}

export const vestOnlyAccountSuite = create(
  (data: Readonly<VestValidationModel>) => {
    test('accountType', 'Choose an account type', () => {
      enforce(data.accountType).isNotBlank();
    });

    test('country', 'Choose a billing country', () => {
      enforce(data.country).isNotBlank();
    });

    test('workEmail', 'Work email is required', () => {
      enforce(data.workEmail).isNotBlank();
    });

    test('workEmail', 'Enter a valid email address', () => {
      if (!data.workEmail.trim()) {
        return;
      }

      enforce(EMAIL_REGEX.test(data.workEmail.trim())).isTruthy();
    });

    test(
      'teamSize',
      'Team size must be a whole number between 1 and 200',
      () => {
        const teamSize = parseTeamSize(data.teamSize);
        enforce(
          teamSize !== null && teamSize >= 1 && teamSize <= 200,
        ).isTruthy();
      },
    );

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
      'teamSize',
      `Personal accounts support up to ${PERSONAL_TEAM_LIMIT} seats`,
      () => {
        const teamSize = parseTeamSize(data.teamSize);
        if (data.accountType === 'personal' && teamSize !== null) {
          enforce(teamSize <= PERSONAL_TEAM_LIMIT).isTruthy();
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

    test(
      'referralCode',
      `STARTER100 is only valid for personal accounts with up to ${REFERRAL_TEAM_LIMIT} seats`,
      () => {
        const normalizedCode = data.referralCode.trim().toUpperCase();
        const teamSize = parseTeamSize(data.teamSize);

        if (normalizedCode === 'STARTER100' && teamSize !== null) {
          enforce(
            data.accountType === 'personal' && teamSize <= REFERRAL_TEAM_LIMIT,
          ).isTruthy();
        }
      },
    );

    test(
      'workEmail',
      'Using a company email usually speeds up workspace approval',
      () => {
        const domain = getEmailDomain(data.workEmail);
        if (!domain) {
          return;
        }

        warn();
        enforce(!FREE_EMAIL_DOMAINS.has(domain)).isTruthy();
      },
    );

    test(
      'teamSize',
      `Teams above ${ANNUAL_BILLING_REVIEW_THRESHOLD} seats usually need annual billing review`,
      () => {
        const teamSize = parseTeamSize(data.teamSize);
        if (teamSize === null) {
          return;
        }

        warn();
        enforce(teamSize <= ANNUAL_BILLING_REVIEW_THRESHOLD).isTruthy();
      },
    );
  },
);
