import { describe, it, expect } from 'vitest';
import { signal, WritableSignal } from '@angular/core';
import {
  showErrors,
  createShowErrorsSignal,
  combineShowErrors,
} from './show-errors';
import type { ErrorDisplayStrategy } from '../types';

/**
 * Test suite for show-errors utility functions.
 *
 * Tests cover:
 * - showErrors (re-exported from error-strategies)
 * - createShowErrorsSignal (convenience wrapper)
 * - combineShowErrors (combining multiple signals)
 */
describe('show-errors utilities', () => {
  /**
   * Helper to create a mock field state for testing
   */
  const createMockFieldState = (invalid = false, touched = false) => {
    return signal({
      invalid: () => invalid,
      touched: () => touched,
    });
  };

  describe('showErrors', () => {
    it('should be a function', () => {
      expect(typeof showErrors).toBe('function');
    });

    it('should work with immediate strategy', () => {
      const fieldState = createMockFieldState(true, false);
      const hasSubmitted = signal(false);

      const result = showErrors(fieldState, 'immediate', hasSubmitted);

      expect(result()).toBe(true);
    });

    it('should work with on-touch strategy', () => {
      const fieldState = createMockFieldState(true, true);
      const hasSubmitted = signal(false);

      const result = showErrors(fieldState, 'on-touch', hasSubmitted);

      expect(result()).toBe(true);
    });

    it('should work with signal strategy', () => {
      const fieldState = createMockFieldState(true, false);
      const strategy = signal<ErrorDisplayStrategy>('immediate');
      const hasSubmitted = signal(false);

      const result = showErrors(fieldState, strategy, hasSubmitted);

      expect(result()).toBe(true);

      strategy.set('on-touch');
      expect(result()).toBe(false);
    });
  });

  describe('createShowErrorsSignal', () => {
    it('should create a signal with default on-touch strategy', () => {
      const fieldState = createMockFieldState(true, true);
      const hasSubmitted = signal(false);

      const result = createShowErrorsSignal(fieldState, { hasSubmitted });

      expect(result()).toBe(true);
    });

    it('should respect provided strategy', () => {
      const fieldState = createMockFieldState(true, false);
      const hasSubmitted = signal(false);

      const result = createShowErrorsSignal(fieldState, {
        strategy: 'immediate',
        hasSubmitted,
      });

      expect(result()).toBe(true);
    });

    it('should work with signal strategy', () => {
      const fieldState = createMockFieldState(true, false);
      const strategy = signal<ErrorDisplayStrategy>('on-touch');
      const hasSubmitted = signal(false);

      const result = createShowErrorsSignal(fieldState, {
        strategy,
        hasSubmitted,
      });

      expect(result()).toBe(false);

      strategy.set('immediate');
      expect(result()).toBe(true);
    });

    it('should react to field state changes', () => {
      const invalid = signal(false);
      const touched = signal(false);
      const fieldState = signal({
        invalid: () => invalid(),
        touched: () => touched(),
      });
      const hasSubmitted = signal(false);

      const result = createShowErrorsSignal(fieldState, {
        strategy: 'on-touch',
        hasSubmitted,
      });

      expect(result()).toBe(false);

      invalid.set(true);
      touched.set(true);
      expect(result()).toBe(true);

      invalid.set(false);
      expect(result()).toBe(false);
    });

    it('should react to hasSubmitted changes with on-touch strategy', () => {
      const fieldState = createMockFieldState(true, false);
      const hasSubmitted = signal(false);

      const result = createShowErrorsSignal(fieldState, {
        strategy: 'on-touch',
        hasSubmitted,
      });

      expect(result()).toBe(false);

      hasSubmitted.set(true);
      expect(result()).toBe(true);
    });

    it('should work with on-submit strategy', () => {
      const fieldState = createMockFieldState(true, true);
      const hasSubmitted = signal(false);

      const result = createShowErrorsSignal(fieldState, {
        strategy: 'on-submit',
        hasSubmitted,
      });

      expect(result()).toBe(false);

      hasSubmitted.set(true);
      expect(result()).toBe(true);
    });

    it('should work with manual strategy', () => {
      const fieldState = createMockFieldState(true, true);
      const hasSubmitted = signal(true);

      const result = createShowErrorsSignal(fieldState, {
        strategy: 'manual',
        hasSubmitted,
      });

      expect(result()).toBe(false);
    });
  });

  describe('combineShowErrors', () => {
    it('should return false when all signals are false', () => {
      const signal1 = signal(false);
      const signal2 = signal(false);
      const signal3 = signal(false);

      const result = combineShowErrors([signal1, signal2, signal3]);

      expect(result()).toBe(false);
    });

    it('should return true when any signal is true', () => {
      const signal1 = signal(false);
      const signal2 = signal(true);
      const signal3 = signal(false);

      const result = combineShowErrors([signal1, signal2, signal3]);

      expect(result()).toBe(true);
    });

    it('should return true when all signals are true', () => {
      const signal1 = signal(true);
      const signal2 = signal(true);
      const signal3 = signal(true);

      const result = combineShowErrors([signal1, signal2, signal3]);

      expect(result()).toBe(true);
    });

    it('should reactively update when signal values change', () => {
      const signal1 = signal(false);
      const signal2 = signal(false);
      const signal3 = signal(false);

      const result = combineShowErrors([signal1, signal2, signal3]);

      expect(result()).toBe(false);

      signal2.set(true);
      expect(result()).toBe(true);

      signal2.set(false);
      expect(result()).toBe(false);

      signal1.set(true);
      signal3.set(true);
      expect(result()).toBe(true);
    });

    it('should work with empty array', () => {
      const result = combineShowErrors([]);

      expect(result()).toBe(false);
    });

    it('should work with single signal', () => {
      const signal1 = signal(true);

      const result = combineShowErrors([signal1]);

      expect(result()).toBe(true);

      signal1.set(false);
      expect(result()).toBe(false);
    });

    it('should work with createShowErrorsSignal results', () => {
      const field1 = createMockFieldState(true, true);
      const field2 = createMockFieldState(false, true);
      const field3 = createMockFieldState(true, false);
      const hasSubmitted = signal(false);

      const showErrors1 = createShowErrorsSignal(field1, {
        strategy: 'on-touch',
        hasSubmitted,
      });
      const showErrors2 = createShowErrorsSignal(field2, {
        strategy: 'on-touch',
        hasSubmitted,
      });
      const showErrors3 = createShowErrorsSignal(field3, {
        strategy: 'on-touch',
        hasSubmitted,
      });

      const anyErrors = combineShowErrors([
        showErrors1,
        showErrors2,
        showErrors3,
      ]);

      // field1 is invalid and touched, so should show errors
      expect(anyErrors()).toBe(true);

      // After submission, field3 should also show errors
      hasSubmitted.set(true);
      expect(anyErrors()).toBe(true);
    });

    it('should work with many signals efficiently', () => {
      const signals: WritableSignal<boolean>[] = [];
      for (let i = 0; i < 100; i++) {
        signals.push(signal(false));
      }

      const result = combineShowErrors(signals);

      expect(result()).toBe(false);

      signals[50].set(true);
      expect(result()).toBe(true);

      signals[50].set(false);
      expect(result()).toBe(false);
    });
  });

  describe('Integration scenarios', () => {
    it('should combine multiple fields with different strategies', () => {
      const emailField = createMockFieldState(true, true);
      const passwordField = createMockFieldState(true, false);
      const hasSubmitted = signal(false);

      const emailErrors = createShowErrorsSignal(emailField, {
        strategy: 'on-touch',
        hasSubmitted,
      });

      const passwordErrors = createShowErrorsSignal(passwordField, {
        strategy: 'immediate',
        hasSubmitted,
      });

      const anyErrors = combineShowErrors([emailErrors, passwordErrors]);

      // Email is touched and invalid, password is immediately shown
      expect(anyErrors()).toBe(true);
    });

    it('should work with dynamic strategy changes', () => {
      const field1 = createMockFieldState(true, false);
      const field2 = createMockFieldState(true, false);
      const strategy = signal<ErrorDisplayStrategy>('on-touch');
      const hasSubmitted = signal(false);

      const errors1 = createShowErrorsSignal(field1, {
        strategy,
        hasSubmitted,
      });
      const errors2 = createShowErrorsSignal(field2, {
        strategy,
        hasSubmitted,
      });
      const anyErrors = combineShowErrors([errors1, errors2]);

      expect(anyErrors()).toBe(false);

      strategy.set('immediate');
      expect(anyErrors()).toBe(true);

      strategy.set('manual');
      expect(anyErrors()).toBe(false);
    });
  });
});
