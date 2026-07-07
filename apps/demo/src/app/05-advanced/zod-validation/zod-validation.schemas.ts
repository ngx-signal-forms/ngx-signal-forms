import { z } from 'zod';

export const BASELINE_ACCOUNT_TYPES = ['personal', 'business'] as const;
export const BASELINE_COUNTRIES = ['US', 'DE', 'NL', 'BE'] as const;

function requiredSelect<const TValue extends readonly [string, ...string[]]>(
  values: TValue,
  message: string,
) {
  return z
    .union([z.literal(''), z.enum(values)])
    .refine((value): value is TValue[number] => value !== '', { message });
}

export const zodBaselineAccountSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .pipe(z.email('Enter a valid email address')),
  password: z.string().min(12, 'Password must be at least 12 characters'),
  accountType: requiredSelect(BASELINE_ACCOUNT_TYPES, 'Choose an account type'),
  country: requiredSelect(BASELINE_COUNTRIES, 'Choose a country'),
});

export type ZodValidationModel = z.input<typeof zodBaselineAccountSchema>;

export function createZodValidationModel(): ZodValidationModel {
  return {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    accountType: '',
    country: '',
  };
}
