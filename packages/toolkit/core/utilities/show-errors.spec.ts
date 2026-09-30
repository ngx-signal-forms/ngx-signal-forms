import { signal } from '@angular/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ErrorDisplayStrategy, SubmittedStatus } from '../types';
import { createShowErrorsComputed } from './show-errors';

/**
 * Test suite for show-errors utility functions.
 *
 * Tests cover:
 * - createShowErrorsComputed (the reactive visibility-timing computed)
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

  describe('createShowErrorsComputed', () => {
    it('should be a function', () => {
      expect(typeof createShowErrorsComputed).toBe('function');
    });

    it('should work with immediate strategy', () => {
      const fieldState = createMockFieldState(true, false);
      const submittedStatus = signal<SubmittedStatus>('unsubmitted');

      const result = createShowErrorsComputed(
        fieldState,
        'immediate',
        submittedStatus,
      );

      expect(result()).toBe(true);
    });

    it('should work with on-touch strategy', () => {
      const fieldState = createMockFieldState(true, true);
      const submittedStatus = signal<SubmittedStatus>('unsubmitted');

      const result = createShowErrorsComputed(
        fieldState,
        'on-touch',
        submittedStatus,
      );

      expect(result()).toBe(true);
    });

    it('should work with signal strategy', () => {
      const fieldState = createMockFieldState(true, false);
      const strategy = signal<ErrorDisplayStrategy>('immediate');
      const submittedStatus = signal<SubmittedStatus>('unsubmitted');

      const result = createShowErrorsComputed(
        fieldState,
        strategy,
        submittedStatus,
      );

      expect(result()).toBe(true);

      strategy.set('on-touch');
      expect(result()).toBe(false);
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

  describe("'on-submit' without submittedStatus", () => {
    // Regression: previously, omitting submittedStatus under `on-submit`
    // triggered a silent `touched → submitted` fallback. A touched-but-
    // not-submitted field would then behave as if the form had been
    // submitted, defeating the strategy. New contract: errors stay hidden
    // until a real status is wired; a dev-mode warning flags the miswiring.

    let warnSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      warnSpy.mockRestore();
    });

    it('keeps errors hidden for a touched invalid field', () => {
      const fieldState = createMockFieldState(true, true);

      const result = createShowErrorsComputed(fieldState, 'on-submit');

      expect(result()).toBe(false);
    });

    it('emits a dev-mode console.warn once', () => {
      const fieldState = createMockFieldState(true, true);

      const result = createShowErrorsComputed(fieldState, 'on-submit');
      result();
      result();

      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0][0]).toContain('on-submit');
      expect(warnSpy.mock.calls[0][0]).toContain('submittedStatus');
    });

    it('does not warn when an explicit submittedStatus is wired', () => {
      const fieldState = createMockFieldState(true, true);
      const submittedStatus = signal<SubmittedStatus>('unsubmitted');

      const result = createShowErrorsComputed(
        fieldState,
        'on-submit',
        submittedStatus,
      );
      result();

      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('does not warn for strategies other than on-submit', () => {
      const fieldState = createMockFieldState(true, true);

      const onTouch = createShowErrorsComputed(fieldState, 'on-touch');
      const immediate = createShowErrorsComputed(fieldState, 'immediate');
      onTouch();
      immediate();

      expect(warnSpy).not.toHaveBeenCalled();
    });
  });

  describe('Integration scenarios', () => {
    it('should follow a strategy signal that changes', () => {
      const field = createMockFieldState(true, false);
      const strategy = signal<ErrorDisplayStrategy>('on-touch');
      const submittedStatus = signal<SubmittedStatus>('unsubmitted');

      const errors = createShowErrorsComputed(field, strategy, submittedStatus);

      expect(errors()).toBe(false);

      strategy.set('immediate');
      expect(errors()).toBe(true);
    });
  });
});
