import { describe, expect, expectTypeOf, it } from 'vitest';
import type { FormFieldAppearance } from '../types';
import {
  isFormFieldAppearance,
  isFormFieldOrientation,
} from './form-field-input';

describe('isFormFieldAppearance', () => {
  it.each(['standard', 'outline', 'plain'] as const)(
    'returns true for the supported literal %s',
    (value) => {
      expect(isFormFieldAppearance(value)).toBe(true);
    },
  );

  it('returns false for an unknown string', () => {
    expect(isFormFieldAppearance('horizonal')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isFormFieldAppearance(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isFormFieldAppearance(undefined)).toBe(false);
  });

  it('returns false for the empty string', () => {
    expect(isFormFieldAppearance('')).toBe(false);
  });

  it('narrows the type to FormFieldAppearance when true', () => {
    const value: string | null = 'outline';
    expect(isFormFieldAppearance(value)).toBe(true);

    // Compile-time-only assertion: TypeScript must narrow `value` to
    // `FormFieldAppearance` inside this guard. `expectTypeOf` performs no
    // runtime check, so it stays outside the vitest/no-conditional-expect
    // rule the block above already satisfies.
    if (isFormFieldAppearance(value)) {
      expectTypeOf(value).toEqualTypeOf<FormFieldAppearance>();
    }
  });
});

describe('isFormFieldOrientation', () => {
  it.each(['vertical', 'horizontal'] as const)(
    'returns true for the supported literal %s',
    (value) => {
      expect(isFormFieldOrientation(value)).toBe(true);
    },
  );

  it('returns false for an unknown string (e.g. a common typo)', () => {
    expect(isFormFieldOrientation('horizonal')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isFormFieldOrientation(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isFormFieldOrientation(undefined)).toBe(false);
  });

  it('returns false for the empty string', () => {
    expect(isFormFieldOrientation('')).toBe(false);
  });

  it('is case-sensitive — does not accept differently-cased literals', () => {
    expect(isFormFieldOrientation('Vertical')).toBe(false);
    expect(isFormFieldOrientation('HORIZONTAL')).toBe(false);
  });
});
