import type { ValidationError } from '@angular/forms/signals';
import { describe, expect, it } from 'vitest';
import type { ErrorMessageRegistry } from '../providers/error-messages.provider';
import {
  getDefaultValidationMessage,
  resolveValidationErrorMessage,
} from './resolve-error-message';

describe('resolveValidationErrorMessage — 3-tier priority', () => {
  const registry: ErrorMessageRegistry = {
    required: 'Registry: field is required',
    email: ({ domain }: Record<string, unknown>) =>
      `Registry: invalid email (domain: ${typeof domain === 'string' ? domain : 'unknown'})`,
  };

  it('should prefer validator message (tier 1) over registry and default', () => {
    const error: ValidationError = {
      kind: 'required',
      message: 'Validator: you must fill this in',
    };

    expect(resolveValidationErrorMessage(error, registry)).toBe(
      'Validator: you must fill this in',
    );
  });

  it('should fall back to registry (tier 2) when no validator message', () => {
    const error: ValidationError = { kind: 'required' };

    expect(resolveValidationErrorMessage(error, registry)).toBe(
      'Registry: field is required',
    );
  });

  it('should call registry factory functions with error params', () => {
    const error = { kind: 'email', domain: 'test.com' } as ValidationError;

    expect(resolveValidationErrorMessage(error, registry)).toBe(
      'Registry: invalid email (domain: test.com)',
    );
  });

  it('should fall back to default (tier 3) when no validator message and no registry entry', () => {
    const error: ValidationError = { kind: 'required' };

    expect(resolveValidationErrorMessage(error, null)).toBe(
      'This field is required',
    );
  });

  it('should fall back to default when registry has no entry for kind', () => {
    const error: ValidationError = { kind: 'minLength', minLength: 5 };

    expect(resolveValidationErrorMessage(error, registry)).toBe(
      'Minimum 5 characters required',
    );
  });

  it('should fall back to kind string for unknown error kinds', () => {
    const error: ValidationError = { kind: 'custom_check' };

    expect(resolveValidationErrorMessage(error)).toBe('custom check');
  });

  it('should use default messages when registry is undefined', () => {
    const error: ValidationError = { kind: 'email' };

    expect(resolveValidationErrorMessage(error)).toBe(
      'Please enter a valid email address',
    );
  });
});

describe('getDefaultValidationMessage', () => {
  it('should return correct defaults for built-in validators', () => {
    expect(getDefaultValidationMessage({ kind: 'required' })).toBe(
      'This field is required',
    );
    expect(getDefaultValidationMessage({ kind: 'email' })).toBe(
      'Please enter a valid email address',
    );
    expect(getDefaultValidationMessage({ kind: 'pattern' })).toBe(
      'Invalid format',
    );
    expect(getDefaultValidationMessage({ kind: 'parse' })).toBe(
      'Invalid value',
    );
  });

  it('should interpolate numeric params for minLength/maxLength', () => {
    expect(
      getDefaultValidationMessage({
        kind: 'minLength',
        minLength: 8,
      } as ValidationError),
    ).toBe('Minimum 8 characters required');

    expect(
      getDefaultValidationMessage({
        kind: 'maxLength',
        maxLength: 100,
      } as ValidationError),
    ).toBe('Maximum 100 characters allowed');
  });

  it('should interpolate numeric params for min/max', () => {
    expect(
      getDefaultValidationMessage({ kind: 'min', min: 0 } as ValidationError),
    ).toBe('Minimum value is 0');

    expect(
      getDefaultValidationMessage({
        kind: 'max',
        max: 999,
      } as ValidationError),
    ).toBe('Maximum value is 999');
  });

  it('should strip warn: prefix when stripWarningPrefix option is set', () => {
    expect(getDefaultValidationMessage({ kind: 'warn:weak_password' })).toBe(
      'warn:weak password',
    );

    expect(
      getDefaultValidationMessage(
        { kind: 'warn:weak_password' },
        { stripWarningPrefix: true },
      ),
    ).toBe('weak password');
  });

  it('should replace underscores with spaces for unknown kinds', () => {
    expect(getDefaultValidationMessage({ kind: 'password_mismatch' })).toBe(
      'password mismatch',
    );
  });
});
