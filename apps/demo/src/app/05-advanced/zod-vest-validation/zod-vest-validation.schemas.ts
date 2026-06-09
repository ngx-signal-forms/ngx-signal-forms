import { z } from 'zod';

export const ACCOUNT_TYPES = ['personal', 'business'] as const;
export const COUNTRIES = ['US', 'DE', 'NL', 'BE'] as const;

function requiredSelect<const TValue extends readonly [string, ...string[]]>(
  values: TValue,
  message: string,
) {
  return z
    .union([z.literal(''), z.enum(values)])
    .refine((value): value is TValue[number] => value !== '', { message });
}

export const zodVestAccountSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .pipe(z.email('Enter a valid email address')),
  password: z.string().min(12, 'Password must be at least 12 characters'),
  accountType: requiredSelect(ACCOUNT_TYPES, 'Choose an account type'),
  country: requiredSelect(COUNTRIES, 'Choose a country'),
  companyName: z.string(),
  vatNumber: z.string(),
});

export type ZodVestValidationModel = z.input<typeof zodVestAccountSchema>;

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
