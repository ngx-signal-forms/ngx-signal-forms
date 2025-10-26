import { signal } from '@angular/core';
import type { SubmittedStatus } from '@angular/forms/signals';
import { describe, expect, it } from 'vitest';
import type { ErrorDisplayStrategy } from '../types';
import { computeShowErrors, shouldShowErrors } from './error-strategies';

describe('error-strategies', () => {
  describe('computeShowErrors', () => {
    describe('immediate strategy', () => {
      it('should show errors immediately when field is invalid', () => {
        const fieldState = signal({
          invalid: () => true,
          touched: () => false,
        });
        const submittedStatus = signal<SubmittedStatus>('unsubmitted');

        const result = computeShowErrors(
          fieldState,
          'immediate',
          submittedStatus,
        );

        expect(result()).toBe(true);
      });

      it('should not show errors when field is valid', () => {
        const fieldState = signal({
          invalid: () => false,
          touched: () => false,
        });
        const submittedStatus = signal<SubmittedStatus>('unsubmitted');

        const result = computeShowErrors(
          fieldState,
          'immediate',
          submittedStatus,
        );

        expect(result()).toBe(false);
      });

      it('should update reactively when field state changes', () => {
        const invalid = signal(false);
        const fieldState = signal({
          invalid: () => invalid(),
          touched: () => false,
        });
        const submittedStatus = signal<SubmittedStatus>('unsubmitted');

        const result = computeShowErrors(
          fieldState,
          'immediate',
          submittedStatus,
        );

        expect(result()).toBe(false);

        invalid.set(true);
        expect(result()).toBe(true);

        invalid.set(false);
        expect(result()).toBe(false);
      });

      it('should not be affected by submission status', () => {
        const fieldState = signal({
          invalid: () => true,
          touched: () => false,
        });
        const submittedStatus = signal<SubmittedStatus>('unsubmitted');

        const result = computeShowErrors(
          fieldState,
          'immediate',
          submittedStatus,
        );

        expect(result()).toBe(true);

        // Should still show during submission
        submittedStatus.set('submitting');
        expect(result()).toBe(true);

        // Should still show after submission
        submittedStatus.set('submitted');
        expect(result()).toBe(true);
      });
    });

    describe('on-touch strategy', () => {
      it('should NOT show errors on initial load (CRITICAL BUG TEST)', () => {
        // WHAT: This is the most important test - validates the reported bug
        // WHY: Ensures errors don't appear immediately on page load with on-touch strategy
        // SCENARIO: User lands on form page, all fields are empty and invalid but untouched
        const fieldState = signal({
          invalid: () => true, // Field is invalid (e.g., required but empty)
          touched: () => false, // Field has NOT been interacted with yet
        });
        const submittedStatus = signal<SubmittedStatus>('unsubmitted');

        const result = computeShowErrors(
          fieldState,
          'on-touch',
          submittedStatus,
        );

        // EXPECT: NO errors should be visible on initial page load
        expect(result()).toBe(false);
      });

      it('should not show errors when field is invalid but not touched', () => {
        const fieldState = signal({
          invalid: () => true,
          touched: () => false,
        });
        const submittedStatus = signal<SubmittedStatus>('unsubmitted');

        const result = computeShowErrors(
          fieldState,
          'on-touch',
          submittedStatus,
        );

        expect(result()).toBe(false);
      });

      it('should show errors when field is invalid and touched', () => {
        const fieldState = signal({
          invalid: () => true,
          touched: () => true,
        });
        const submittedStatus = signal<SubmittedStatus>('unsubmitted');

        const result = computeShowErrors(
          fieldState,
          'on-touch',
          submittedStatus,
        );

        expect(result()).toBe(true);
      });

      it('should show errors when field is invalid and form is submitted', () => {
        const fieldState = signal({
          invalid: () => true,
          touched: () => false,
        });
        const submittedStatus = signal<SubmittedStatus>('submitted');

        const result = computeShowErrors(
          fieldState,
          'on-touch',
          submittedStatus,
        );

        expect(result()).toBe(true);
      });

      it('should not show errors when field is valid even if touched', () => {
        const fieldState = signal({
          invalid: () => false,
          touched: () => true,
        });
        const submittedStatus = signal<SubmittedStatus>('unsubmitted');

        const result = computeShowErrors(
          fieldState,
          'on-touch',
          submittedStatus,
        );

        expect(result()).toBe(false);
      });

      it('should update reactively when touched state changes', () => {
        const touched = signal(false);
        const fieldState = signal({
          invalid: () => true,
          touched: () => touched(),
        });
        const submittedStatus = signal<SubmittedStatus>('unsubmitted');

        const result = computeShowErrors(
          fieldState,
          'on-touch',
          submittedStatus,
        );

        expect(result()).toBe(false);

        touched.set(true);
        expect(result()).toBe(true);
      });

      it('should show errors during submission even if not touched', () => {
        const fieldState = signal({
          invalid: () => true,
          touched: () => false,
        });
        const submittedStatus = signal<SubmittedStatus>('submitting');

        const result = computeShowErrors(
          fieldState,
          'on-touch',
          submittedStatus,
        );

        expect(result()).toBe(true);
      });

      it('should maintain errors visibility throughout submission lifecycle', () => {
        const fieldState = signal({
          invalid: () => true,
          touched: () => false,
        });
        const submittedStatus = signal<SubmittedStatus>('unsubmitted');

        const result = computeShowErrors(
          fieldState,
          'on-touch',
          submittedStatus,
        );

        // Initially no errors (not touched, not submitted)
        expect(result()).toBe(false);

        // During submission - errors should appear
        submittedStatus.set('submitting');
        expect(result()).toBe(true);

        // After submission completes - errors should remain
        submittedStatus.set('submitted');
        expect(result()).toBe(true);
      });
    });

    describe('on-submit strategy', () => {
      it('should NOT show errors on initial load (CRITICAL BUG TEST)', () => {
        // WHAT: Validates on-submit strategy doesn't show errors before submission
        // WHY: Critical for UX - users shouldn't see errors before attempting to submit
        // SCENARIO: Form just loaded, fields are invalid and touched, but not submitted
        const fieldState = signal({
          invalid: () => true,
          touched: () => true, // Even if touched
        });
        const submittedStatus = signal<SubmittedStatus>('unsubmitted');

        const result = computeShowErrors(
          fieldState,
          'on-submit',
          submittedStatus,
        );

        // EXPECT: NO errors until form is submitted
        expect(result()).toBe(false);
      });

      it('should not show errors when form is not submitted', () => {
        const fieldState = signal({
          invalid: () => true,
          touched: () => true,
        });
        const submittedStatus = signal<SubmittedStatus>('unsubmitted');

        const result = computeShowErrors(
          fieldState,
          'on-submit',
          submittedStatus,
        );

        expect(result()).toBe(false);
      });

      it('should show errors when field is invalid and form is submitted', () => {
        const fieldState = signal({
          invalid: () => true,
          touched: () => false,
        });
        const submittedStatus = signal<SubmittedStatus>('submitted');

        const result = computeShowErrors(
          fieldState,
          'on-submit',
          submittedStatus,
        );

        expect(result()).toBe(true);
      });

      it('should not show errors when field is valid even if submitted', () => {
        const fieldState = signal({
          invalid: () => false,
          touched: () => true,
        });
        const submittedStatus = signal<SubmittedStatus>('submitted');

        const result = computeShowErrors(
          fieldState,
          'on-submit',
          submittedStatus,
        );

        expect(result()).toBe(false);
      });

      it('should update reactively when submission state changes', () => {
        const submitted = signal<SubmittedStatus>('unsubmitted');
        const fieldState = signal({
          invalid: () => true,
          touched: () => false,
        });

        const result = computeShowErrors(fieldState, 'on-submit', submitted);

        expect(result()).toBe(false);

        submitted.set('submitted');
        expect(result()).toBe(true);
      });

      it('should show errors during async submission', () => {
        const fieldState = signal({
          invalid: () => true,
          touched: () => false,
        });
        const submittedStatus = signal<SubmittedStatus>('submitting');

        const result = computeShowErrors(
          fieldState,
          'on-submit',
          submittedStatus,
        );

        expect(result()).toBe(true);
      });

      it('should show errors immediately when submission starts', () => {
        const fieldState = signal({
          invalid: () => true,
          touched: () => false,
        });
        const submittedStatus = signal<SubmittedStatus>('unsubmitted');

        const result = computeShowErrors(
          fieldState,
          'on-submit',
          submittedStatus,
        );

        // No errors before submission
        expect(result()).toBe(false);

        // Errors appear as soon as submission starts
        submittedStatus.set('submitting');
        expect(result()).toBe(true);

        // Errors persist after submission completes
        submittedStatus.set('submitted');
        expect(result()).toBe(true);
      });
    });

    describe('manual strategy', () => {
      it('should never show errors automatically', () => {
        const fieldState = signal({
          invalid: () => true,
          touched: () => true,
        });
        const submittedStatus = signal<SubmittedStatus>('submitted');

        const result = computeShowErrors(fieldState, 'manual', submittedStatus);

        expect(result()).toBe(false);
      });

      it('should remain false even when all conditions are met', () => {
        const fieldState = signal({
          invalid: () => true,
          touched: () => true,
        });
        const submittedStatus = signal<SubmittedStatus>('submitted');

        const result = computeShowErrors(fieldState, 'manual', submittedStatus);

        expect(result()).toBe(false);
      });

      it('should never show errors regardless of submission status', () => {
        const fieldState = signal({
          invalid: () => true,
          touched: () => true,
        });
        const submittedStatus = signal<SubmittedStatus>('unsubmitted');

        const result = computeShowErrors(fieldState, 'manual', submittedStatus);

        expect(result()).toBe(false);

        // Should not show during submission
        submittedStatus.set('submitting');
        expect(result()).toBe(false);

        // Should not show after submission
        submittedStatus.set('submitted');
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
        const submittedStatus = signal<SubmittedStatus>('unsubmitted');

        const result = computeShowErrors(fieldState, strategy, submittedStatus);

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
        const submittedStatus = signal<SubmittedStatus>('unsubmitted');

        const result = computeShowErrors(fieldState, strategy, submittedStatus);

        expect(result()).toBe(false);

        strategy.set('on-touch');
        expect(result()).toBe(true);
      });
    });

    describe('edge cases', () => {
      it('should handle null field state gracefully', () => {
        const fieldState = signal(null);
        const submittedStatus = signal<SubmittedStatus>('unsubmitted');

        const result = computeShowErrors(
          fieldState,
          'immediate',
          submittedStatus,
        );

        expect(result()).toBe(false);
      });

      it('should handle undefined field state gracefully', () => {
        const fieldState = signal(undefined);
        const submittedStatus = signal<SubmittedStatus>('unsubmitted');

        const result = computeShowErrors(
          fieldState,
          'immediate',
          submittedStatus,
        );

        expect(result()).toBe(false);
      });

      it('should handle field state without methods', () => {
        const fieldState = signal({});
        const submittedStatus = signal<SubmittedStatus>('unsubmitted');

        const result = computeShowErrors(
          fieldState,
          'immediate',
          submittedStatus,
        );

        expect(result()).toBe(false);
      });

      it('should default to on-touch behavior for unknown strategies', () => {
        const fieldState = signal({
          invalid: () => true,
          touched: () => false,
        });
        const submittedStatus = signal<SubmittedStatus>('unsubmitted');

        const result = computeShowErrors(
          fieldState,
          'unknown' as ErrorDisplayStrategy,
          submittedStatus,
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
          submittedStatus,
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

      expect(shouldShowErrors(fieldState, 'immediate', 'unsubmitted')).toBe(
        true,
      );
    });

    it('should work with on-touch strategy', () => {
      const fieldState = {
        invalid: () => true,
        touched: () => true,
      };

      expect(shouldShowErrors(fieldState, 'on-touch', 'unsubmitted')).toBe(
        true,
      );
      expect(
        shouldShowErrors(
          { invalid: () => true, touched: () => false },
          'on-touch',
          'unsubmitted',
        ),
      ).toBe(false);
    });

    it('should work with on-submit strategy', () => {
      const fieldState = {
        invalid: () => true,
        touched: () => false,
      };

      expect(shouldShowErrors(fieldState, 'on-submit', 'submitted')).toBe(true);
      expect(shouldShowErrors(fieldState, 'on-submit', 'unsubmitted')).toBe(
        false,
      );
    });

    it('should work with manual strategy', () => {
      const fieldState = {
        invalid: () => true,
        touched: () => true,
      };

      expect(shouldShowErrors(fieldState, 'manual', 'submitted')).toBe(false);
    });
  });
});
