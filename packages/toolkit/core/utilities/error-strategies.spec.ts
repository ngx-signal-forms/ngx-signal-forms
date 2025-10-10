import { describe, it, expect } from 'vitest';
import { signal } from '@angular/core';
import { computeShowErrors, shouldShowErrors } from './error-strategies';
import type { ErrorDisplayStrategy } from '../types';

describe('error-strategies', () => {
  describe('computeShowErrors', () => {
    describe('immediate strategy', () => {
      it('should show errors immediately when field is invalid', () => {
        const fieldState = signal({
          invalid: () => true,
          touched: () => false,
        });
        const hasSubmitted = signal(false);

        const result = computeShowErrors(fieldState, 'immediate', hasSubmitted);

        expect(result()).toBe(true);
      });

      it('should not show errors when field is valid', () => {
        const fieldState = signal({
          invalid: () => false,
          touched: () => false,
        });
        const hasSubmitted = signal(false);

        const result = computeShowErrors(fieldState, 'immediate', hasSubmitted);

        expect(result()).toBe(false);
      });

      it('should update reactively when field state changes', () => {
        const invalid = signal(false);
        const fieldState = signal({
          invalid: () => invalid(),
          touched: () => false,
        });
        const hasSubmitted = signal(false);

        const result = computeShowErrors(fieldState, 'immediate', hasSubmitted);

        expect(result()).toBe(false);

        invalid.set(true);
        expect(result()).toBe(true);

        invalid.set(false);
        expect(result()).toBe(false);
      });
    });

    describe('on-touch strategy', () => {
      it('should not show errors when field is invalid but not touched', () => {
        const fieldState = signal({
          invalid: () => true,
          touched: () => false,
        });
        const hasSubmitted = signal(false);

        const result = computeShowErrors(fieldState, 'on-touch', hasSubmitted);

        expect(result()).toBe(false);
      });

      it('should show errors when field is invalid and touched', () => {
        const fieldState = signal({
          invalid: () => true,
          touched: () => true,
        });
        const hasSubmitted = signal(false);

        const result = computeShowErrors(fieldState, 'on-touch', hasSubmitted);

        expect(result()).toBe(true);
      });

      it('should show errors when field is invalid and form is submitted', () => {
        const fieldState = signal({
          invalid: () => true,
          touched: () => false,
        });
        const hasSubmitted = signal(true);

        const result = computeShowErrors(fieldState, 'on-touch', hasSubmitted);

        expect(result()).toBe(true);
      });

      it('should not show errors when field is valid even if touched', () => {
        const fieldState = signal({
          invalid: () => false,
          touched: () => true,
        });
        const hasSubmitted = signal(false);

        const result = computeShowErrors(fieldState, 'on-touch', hasSubmitted);

        expect(result()).toBe(false);
      });

      it('should update reactively when touched state changes', () => {
        const touched = signal(false);
        const fieldState = signal({
          invalid: () => true,
          touched: () => touched(),
        });
        const hasSubmitted = signal(false);

        const result = computeShowErrors(fieldState, 'on-touch', hasSubmitted);

        expect(result()).toBe(false);

        touched.set(true);
        expect(result()).toBe(true);
      });
    });

    describe('on-submit strategy', () => {
      it('should not show errors when form is not submitted', () => {
        const fieldState = signal({
          invalid: () => true,
          touched: () => true,
        });
        const hasSubmitted = signal(false);

        const result = computeShowErrors(fieldState, 'on-submit', hasSubmitted);

        expect(result()).toBe(false);
      });

      it('should show errors when field is invalid and form is submitted', () => {
        const fieldState = signal({
          invalid: () => true,
          touched: () => false,
        });
        const hasSubmitted = signal(true);

        const result = computeShowErrors(fieldState, 'on-submit', hasSubmitted);

        expect(result()).toBe(true);
      });

      it('should not show errors when field is valid even if submitted', () => {
        const fieldState = signal({
          invalid: () => false,
          touched: () => true,
        });
        const hasSubmitted = signal(true);

        const result = computeShowErrors(fieldState, 'on-submit', hasSubmitted);

        expect(result()).toBe(false);
      });

      it('should update reactively when submission state changes', () => {
        const submitted = signal(false);
        const fieldState = signal({
          invalid: () => true,
          touched: () => false,
        });

        const result = computeShowErrors(fieldState, 'on-submit', submitted);

        expect(result()).toBe(false);

        submitted.set(true);
        expect(result()).toBe(true);
      });
    });

    describe('manual strategy', () => {
      it('should never show errors automatically', () => {
        const fieldState = signal({
          invalid: () => true,
          touched: () => true,
        });
        const hasSubmitted = signal(true);

        const result = computeShowErrors(fieldState, 'manual', hasSubmitted);

        expect(result()).toBe(false);
      });

      it('should remain false even when all conditions are met', () => {
        const fieldState = signal({
          invalid: () => true,
          touched: () => true,
        });
        const hasSubmitted = signal(true);

        const result = computeShowErrors(fieldState, 'manual', hasSubmitted);

        expect(result()).toBe(false);
      });
    });

    describe('strategy as signal', () => {
      it('should support strategy as a signal', () => {
        const strategy = signal<ErrorDisplayStrategy>('on-touch');
        const fieldState = signal({
          invalid: () => true,
          touched: () => false,
        });
        const hasSubmitted = signal(false);

        const result = computeShowErrors(fieldState, strategy, hasSubmitted);

        expect(result()).toBe(false);

        // Switch to immediate strategy
        strategy.set('immediate');
        expect(result()).toBe(true);

        // Switch to manual strategy
        strategy.set('manual');
        expect(result()).toBe(false);
      });

      it('should react to strategy changes', () => {
        const strategy = signal<ErrorDisplayStrategy>('on-submit');
        const fieldState = signal({
          invalid: () => true,
          touched: () => true,
        });
        const hasSubmitted = signal(false);

        const result = computeShowErrors(fieldState, strategy, hasSubmitted);

        expect(result()).toBe(false);

        strategy.set('on-touch');
        expect(result()).toBe(true);
      });
    });

    describe('edge cases', () => {
      it('should handle null field state gracefully', () => {
        const fieldState = signal(null);
        const hasSubmitted = signal(false);

        const result = computeShowErrors(fieldState, 'immediate', hasSubmitted);

        expect(result()).toBe(false);
      });

      it('should handle undefined field state gracefully', () => {
        const fieldState = signal(undefined);
        const hasSubmitted = signal(false);

        const result = computeShowErrors(fieldState, 'immediate', hasSubmitted);

        expect(result()).toBe(false);
      });

      it('should handle field state without methods', () => {
        const fieldState = signal({});
        const hasSubmitted = signal(false);

        const result = computeShowErrors(fieldState, 'immediate', hasSubmitted);

        expect(result()).toBe(false);
      });

      it('should default to on-touch behavior for unknown strategies', () => {
        const fieldState = signal({
          invalid: () => true,
          touched: () => false,
        });
        const hasSubmitted = signal(false);

        const result = computeShowErrors(
          fieldState,
          'unknown' as ErrorDisplayStrategy,
          hasSubmitted,
        );

        expect(result()).toBe(false);

        // Should behave like 'on-touch'
        const touchedState = signal({
          invalid: () => true,
          touched: () => true,
        });
        const result2 = computeShowErrors(
          touchedState,
          'unknown' as ErrorDisplayStrategy,
          hasSubmitted,
        );

        expect(result2()).toBe(true);
      });
    });
  });

  describe('shouldShowErrors', () => {
    it('should work with immediate strategy', () => {
      const fieldState = {
        invalid: () => true,
        touched: () => false,
      };

      expect(shouldShowErrors(fieldState, 'immediate', false)).toBe(true);
    });

    it('should work with on-touch strategy', () => {
      const fieldState = {
        invalid: () => true,
        touched: () => true,
      };

      expect(shouldShowErrors(fieldState, 'on-touch', false)).toBe(true);
      expect(
        shouldShowErrors(
          { invalid: () => true, touched: () => false },
          'on-touch',
          false,
        ),
      ).toBe(false);
    });

    it('should work with on-submit strategy', () => {
      const fieldState = {
        invalid: () => true,
        touched: () => false,
      };

      expect(shouldShowErrors(fieldState, 'on-submit', true)).toBe(true);
      expect(shouldShowErrors(fieldState, 'on-submit', false)).toBe(false);
    });

    it('should work with manual strategy', () => {
      const fieldState = {
        invalid: () => true,
        touched: () => true,
      };

      expect(shouldShowErrors(fieldState, 'manual', true)).toBe(false);
    });
  });
});
