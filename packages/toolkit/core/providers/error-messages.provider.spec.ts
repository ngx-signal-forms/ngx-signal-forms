import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import {
  NGX_ERROR_MESSAGES,
  provideErrorMessages,
  type ErrorMessageRegistry,
} from './error-messages.provider';

describe('provideErrorMessages', () => {
  describe('Static Configuration', () => {
    it('should provide static error messages as string literals', () => {
      TestBed.configureTestingModule({
        providers: [
          provideErrorMessages({
            required: 'This field is required',
            email: 'Please enter a valid email',
            custom_error: 'Custom error message',
          }),
        ],
      });

      const registry = TestBed.inject(NGX_ERROR_MESSAGES);

      expect(registry['required']).toBe('This field is required');
      expect(registry['email']).toBe('Please enter a valid email');
      expect(registry['custom_error']).toBe('Custom error message');
    });

    it('should provide error messages as factory functions', () => {
      TestBed.configureTestingModule({
        providers: [
          provideErrorMessages({
            minLength: (params: Record<string, unknown>) =>
              `At least ${(params as { minLength: number }).minLength} characters`,
            maxLength: (params: Record<string, unknown>) =>
              `Maximum ${(params as { maxLength: number }).maxLength} characters`,
          }),
        ],
      });

      const registry = TestBed.inject(NGX_ERROR_MESSAGES);

      const minLengthFn = registry['minLength'];
      expect(typeof minLengthFn).toBe('function');
      if (typeof minLengthFn === 'function') {
        expect(minLengthFn({ minLength: 5 })).toBe('At least 5 characters');
      }

      const maxLengthFn = registry['maxLength'];
      expect(typeof maxLengthFn).toBe('function');
      if (typeof maxLengthFn === 'function') {
        expect(maxLengthFn({ maxLength: 100 })).toBe('Maximum 100 characters');
      }
    });

    it('should support custom validators with string messages', () => {
      TestBed.configureTestingModule({
        providers: [
          provideErrorMessages({
            phone_invalid: 'Invalid phone number format',
            password_weak: 'Password is too weak',
            age_under_18: 'Must be 18 or older',
          }),
        ],
      });

      const registry = TestBed.inject(NGX_ERROR_MESSAGES);

      expect(registry['phone_invalid']).toBe('Invalid phone number format');
      expect(registry['password_weak']).toBe('Password is too weak');
      expect(registry['age_under_18']).toBe('Must be 18 or older');
    });

    it('should support mixed string and function messages', () => {
      TestBed.configureTestingModule({
        providers: [
          provideErrorMessages({
            required: 'Required field',
            minLength: (params: Record<string, unknown>) =>
              `Min ${(params as { minLength: number }).minLength} chars`,
            email: 'Invalid email',
            max: (params: Record<string, unknown>) =>
              `Cannot exceed ${(params as { max: number }).max}`,
          }),
        ],
      });

      const registry = TestBed.inject(NGX_ERROR_MESSAGES);

      expect(registry['required']).toBe('Required field');
      expect(registry['email']).toBe('Invalid email');

      const minLengthFn = registry['minLength'];
      if (typeof minLengthFn === 'function') {
        expect(minLengthFn({ minLength: 3 })).toBe('Min 3 chars');
      }

      const maxFn = registry['max'];
      if (typeof maxFn === 'function') {
        expect(maxFn({ max: 10 })).toBe('Cannot exceed 10');
      }
    });
  });

  describe('Dynamic Provider (Factory Function)', () => {
    it('should support locale injection for i18n messages', () => {
      TestBed.configureTestingModule({
        providers: [
          { provide: LOCALE_ID, useValue: 'en-US' },
          provideErrorMessages(() => {
            const locale = TestBed.inject(LOCALE_ID);
            const messages = {
              'en-US': {
                required: 'This field is required',
                email: 'Please enter a valid email',
              },
              'ja-JP': {
                required: 'このフィールドは必須です',
                email: '有効なメールアドレスを入力してください',
              },
            };
            return (
              messages[locale as keyof typeof messages] || messages['en-US']
            );
          }),
        ],
      });

      const registry = TestBed.inject(NGX_ERROR_MESSAGES);

      expect(registry['required']).toBe('This field is required');
      expect(registry['email']).toBe('Please enter a valid email');
    });

    it('should support parameter interpolation in factory function', () => {
      TestBed.configureTestingModule({
        providers: [
          provideErrorMessages(() => ({
            minLength: (params: Record<string, unknown>) =>
              `Minimum length is ${(params as { minLength: number }).minLength} characters`,
            maxLength: (params: Record<string, unknown>) =>
              `Maximum length is ${(params as { maxLength: number }).maxLength} characters`,
            min: (params: Record<string, unknown>) =>
              `Minimum value is ${(params as { min: number }).min}`,
            max: (params: Record<string, unknown>) =>
              `Maximum value is ${(params as { max: number }).max}`,
          })),
        ],
      });

      const registry = TestBed.inject(NGX_ERROR_MESSAGES);

      const minLengthFn = registry['minLength'];
      if (typeof minLengthFn === 'function') {
        expect(minLengthFn({ minLength: 8 })).toBe(
          'Minimum length is 8 characters',
        );
      }

      const maxFn = registry['max'];
      if (typeof maxFn === 'function') {
        expect(maxFn({ max: 100 })).toBe('Maximum value is 100');
      }
    });

    it('should support environment-based error messages', () => {
      const mockEnv = 'production';

      TestBed.configureTestingModule({
        providers: [
          provideErrorMessages(() => {
            if (mockEnv === 'production') {
              return {
                required: 'Required',
                email: 'Invalid email',
              };
            }
            return {
              required: '[DEV] This field is required',
              email: '[DEV] Please enter a valid email address',
            };
          }),
        ],
      });

      const registry = TestBed.inject(NGX_ERROR_MESSAGES);

      expect(registry['required']).toBe('Required');
      expect(registry['email']).toBe('Invalid email');
    });
  });

  describe('Zero-Config (No Provider)', () => {
    it('should return empty registry by default', () => {
      TestBed.configureTestingModule({
        providers: [],
      });

      const registry = TestBed.inject(NGX_ERROR_MESSAGES);

      expect(registry).toEqual({});
      expect(registry['required']).toBeUndefined();
      expect(registry['email']).toBeUndefined();
    });

    it('should work without any provider configured', () => {
      TestBed.configureTestingModule({});

      const registry = TestBed.inject(NGX_ERROR_MESSAGES);

      expect(registry).toEqual({});
      expect(Object.keys(registry).length).toBe(0);
    });
  });

  describe('Type Safety', () => {
    it('should accept ErrorMessageRegistry type for static config', () => {
      const messages: ErrorMessageRegistry = {
        required: 'Required field',
        email: 'Invalid email',
        minLength: (params: Record<string, unknown>) =>
          `Min ${(params as { minLength: number }).minLength} chars`,
      };

      TestBed.configureTestingModule({
        providers: [provideErrorMessages(messages)],
      });

      const registry = TestBed.inject(NGX_ERROR_MESSAGES);

      expect(registry['required']).toBe('Required field');
    });

    it('should accept factory function returning ErrorMessageRegistry', () => {
      const messageFactory = (): ErrorMessageRegistry => ({
        required: 'Required',
        custom: (params: Record<string, unknown>) =>
          `Invalid: ${(params as { value: string }).value}`,
      });

      TestBed.configureTestingModule({
        providers: [provideErrorMessages(messageFactory)],
      });

      const registry = TestBed.inject(NGX_ERROR_MESSAGES);

      expect(registry['required']).toBe('Required');
      const customFn = registry['custom'];
      if (typeof customFn === 'function') {
        expect(customFn({ value: 'test' })).toBe('Invalid: test');
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined values in registry', () => {
      TestBed.configureTestingModule({
        providers: [
          provideErrorMessages({
            required: 'Required',
            email: undefined,
          }),
        ],
      });

      const registry = TestBed.inject(NGX_ERROR_MESSAGES);

      expect(registry['required']).toBe('Required');
      expect(registry['email']).toBeUndefined();
    });

    it('should handle empty registry object', () => {
      TestBed.configureTestingModule({
        providers: [provideErrorMessages({})],
      });

      const registry = TestBed.inject(NGX_ERROR_MESSAGES);

      expect(registry).toEqual({});
      expect(Object.keys(registry).length).toBe(0);
    });

    it('should handle special characters in error kinds', () => {
      TestBed.configureTestingModule({
        providers: [
          provideErrorMessages({
            'error:kind:with:colons': 'Error message',
            'error-kind-with-dashes': 'Another message',
            error_kind_with_underscores: 'Third message',
          }),
        ],
      });

      const registry = TestBed.inject(NGX_ERROR_MESSAGES);

      expect(registry['error:kind:with:colons']).toBe('Error message');
      expect(registry['error-kind-with-dashes']).toBe('Another message');
      expect(registry['error_kind_with_underscores']).toBe('Third message');
    });

    it('should preserve function references in registry', () => {
      const minLengthMessage = (params: Record<string, unknown>) =>
        `Min ${(params as { minLength: number }).minLength}`;
      const maxLengthMessage = (params: Record<string, unknown>) =>
        `Max ${(params as { maxLength: number }).maxLength}`;

      TestBed.configureTestingModule({
        providers: [
          provideErrorMessages({
            minLength: minLengthMessage,
            maxLength: maxLengthMessage,
          }),
        ],
      });

      const registry = TestBed.inject(NGX_ERROR_MESSAGES);

      expect(registry['minLength']).toBe(minLengthMessage);
      expect(registry['maxLength']).toBe(maxLengthMessage);
    });

    it('should handle factory function returning empty object', () => {
      TestBed.configureTestingModule({
        providers: [provideErrorMessages(() => ({}))],
      });

      const registry = TestBed.inject(NGX_ERROR_MESSAGES);

      expect(registry).toEqual({});
      expect(Object.keys(registry).length).toBe(0);
    });
  });
});
