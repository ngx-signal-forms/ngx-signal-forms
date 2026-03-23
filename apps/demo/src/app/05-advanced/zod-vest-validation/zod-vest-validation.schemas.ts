import { z } from 'zod';

export const ACCOUNT_TYPES = ['personal', 'business'] as const;
export const COUNTRIES = ['US', 'DE', 'NL', 'BE'] as const;

export type ZodVestAccountType = (typeof ACCOUNT_TYPES)[number];
export type ZodVestCountry = (typeof COUNTRIES)[number];

export interface ZodVestValidationModel {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  accountType: '' | ZodVestAccountType;
  country: '' | ZodVestCountry;
  companyName: string;
  vatNumber: string;
}

export const zodVestAccountSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(12, 'Password must be at least 12 characters'),
  accountType: z
    .string()
    .refine(
      (value): value is ZodVestAccountType =>
        ACCOUNT_TYPES.includes(value as ZodVestAccountType),
      { message: 'Choose an account type' },
    ),
  country: z
    .string()
    .refine(
      (value): value is ZodVestCountry =>
        COUNTRIES.includes(value as ZodVestCountry),
      { message: 'Choose a country' },
    ),
  companyName: z.string().optional(),
  vatNumber: z.string().optional(),
});

export function createZodVestValidationModel(): ZodVestValidationModel {
  return {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    accountType: '',
    country: '',
    companyName: '',
    vatNumber: '',
  };
}
