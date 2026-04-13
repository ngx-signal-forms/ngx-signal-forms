import { signal, WritableSignal } from '@angular/core';
import { describe, expect, it } from 'vitest';
import type { ErrorDisplayStrategy, SubmittedStatus } from '../types';
import {
  combineShowErrors,
  createShowErrorsComputed,
  showErrors,
} from './show-errors';

/**
 * Test suite for show-errors utility functions.
 *
 * Tests cover:
 * - showErrors (re-exported from error-strategies)
 * - combineShowErrors (combining multiple signals)
 */
describe('show-errors utilities', () => {
  /**
   * Helper to create a mock field state for testing
   */
  const createMockFieldState = (invalid = false, touched = false) => {
    return signal({
      invalid: signal(invalid),
      touched: signal(touched),
    });
  };

  describe('showErrors', () => {
    it('should be a function', () => {
      expect(typeof showErrors).toBe('function');
    });

    it('should work with immediate strategy', () => {
      const fieldState = createMockFieldState(true, false);
      const submittedStatus = signal<SubmittedStatus>('unsubmitted');

      const result = showErrors(fieldState, 'immediate', submittedStatus);

      expect(result()).toBe(true);
    });

    it('should work with on-touch strategy', () => {
      const fieldState = createMockFieldState(true, true);
      const submittedStatus = signal<SubmittedStatus>('unsubmitted');

      const result = showErrors(fieldState, 'on-touch', submittedStatus);

      expect(result()).toBe(true);
    });

    it('should work with signal strategy', () => {
      const fieldState = createMockFieldState(true, false);
      const strategy = signal<ErrorDisplayStrategy>('immediate');
      const submittedStatus = signal<SubmittedStatus>('unsubmitted');

      const result = showErrors(fieldState, strategy, submittedStatus);

      expect(result()).toBe(true);

      strategy.set('on-touch');
      expect(result()).toBe(false);
    });
  });

  describe('createShowErrorsComputed', () => {
    it('should be a function and match showErrors behavior', () => {
      // Extraction target: the helper must be the canonical path behind
      // showErrors(). Keeping them observationally equivalent is load-bearing
      // for the wrapper/auto-aria/form-field-error dedupe.
      expect(typeof createShowErrorsComputed).toBe('function');

      const fieldState = createMockFieldState(true, true);
      const submittedStatus = signal<SubmittedStatus>('unsubmitted');

      const viaFactory = createShowErrorsComputed(
        fieldState,
        'on-touch',
        submittedStatus,
      );
      const viaPublicApi = showErrors(fieldState, 'on-touch', submittedStatus);

      expect(viaFactory()).toBe(viaPublicApi());
    });

    it('should return false for null field state', () => {
      const strategy = signal<ErrorDisplayStrategy>('on-touch');
      const submittedStatus = signal<SubmittedStatus>('unsubmitted');

      const result = createShowErrorsComputed(
        () => null,
        strategy,
        submittedStatus,
      );

      expect(result()).toBe(false);
    });

    it('should react to strategy and status changes', () => {
      const fieldState = createMockFieldState(true, false);
      const strategy = signal<ErrorDisplayStrategy>('on-submit');
      const submittedStatus = signal<SubmittedStatus>('unsubmitted');

      const result = createShowErrorsComputed(
        fieldState,
        strategy,
        submittedStatus,
      );

      expect(result()).toBe(false);

      submittedStatus.set('submitted');
      expect(result()).toBe(true);

      strategy.set('on-touch');
      submittedStatus.set('unsubmitted');
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

    it('should work with showErrors results', () => {
      const field1 = createMockFieldState(true, true);
      const field2 = createMockFieldState(false, true);
      const field3 = createMockFieldState(true, false);
      const submittedStatus = signal<SubmittedStatus>('unsubmitted');

      const showErrors1 = showErrors(field1, 'on-touch', submittedStatus);
      const showErrors2 = showErrors(field2, 'on-touch', submittedStatus);
      const showErrors3 = showErrors(field3, 'on-touch', submittedStatus);

      const anyErrors = combineShowErrors([
        showErrors1,
        showErrors2,
        showErrors3,
      ]);

      // field1 is invalid and touched, so should show errors
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
      const submittedStatus = signal<SubmittedStatus>('unsubmitted');

      const emailErrors = showErrors(emailField, 'on-touch', submittedStatus);
      const passwordErrors = showErrors(
        passwordField,
        'immediate',
        submittedStatus,
      );

      const anyErrors = combineShowErrors([emailErrors, passwordErrors]);

      // Email is touched and invalid, password is immediately shown
      expect(anyErrors()).toBe(true);
    });

    it('should work with dynamic strategy changes', () => {
      const field1 = createMockFieldState(true, false);
      const field2 = createMockFieldState(true, false);
      const strategy = signal<ErrorDisplayStrategy>('on-touch');
      const submittedStatus = signal<SubmittedStatus>('unsubmitted');

      const errors1 = showErrors(field1, strategy, submittedStatus);
      const errors2 = showErrors(field2, strategy, submittedStatus);
      const anyErrors = combineShowErrors([errors1, errors2]);

      expect(anyErrors()).toBe(false);

      strategy.set('immediate');
      expect(anyErrors()).toBe(true);
    });
  });
});
