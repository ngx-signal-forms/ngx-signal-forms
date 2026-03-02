import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { FieldTree } from '@angular/forms/signals';
import { describe, expect, it, vi } from 'vitest';
import { hasSubmitted } from './submission-helpers';
/**
 * Test suite for submission helper utilities.
 *
 * Critical functionality: Reduce template boilerplate for submission state checks.
 * Medium risk areas: Runtime type checking, signal unwrapping, template usage patterns.
 */
describe('Submission Helpers', () => {
  describe('hasSubmitted', () => {
    describe('Happy Path', () => {
      it('should return false initially when form has not been submitted', () => {
        // Arrange: Form with submitting = false
        const submittingState = signal(false);
        const mockForm = createMockFormWithSubmitting(() => submittingState());

        // Act
        // Act: Call in injection context (hasSubmitted uses effect internally)
        const result = TestBed.runInInjectionContext(() =>
          hasSubmitted(mockForm),
        );

        // Assert: Initially not submitted
        expect(result()).toBe(false);
      });

      it('should return false when form is currently submitting', () => {
        // Arrange: Form currently submitting
        const submittingState = signal(true);
        const mockForm = createMockFormWithSubmitting(() => submittingState());

        // Act
        const result = TestBed.runInInjectionContext(() =>
          hasSubmitted(mockForm),
        );

        // Assert: Not yet submitted (still in progress)
        expect(result()).toBe(false);
      });

      it('should return true after submission completes (submitting: true → false)', async () => {
        // Arrange: Simulate submission lifecycle
        const submittingState = signal(false);
        const mockForm = createMockFormWithSubmitting(() => submittingState());

        // Act: Create hasSubmitted in injection context
        const result = TestBed.runInInjectionContext(() =>
          hasSubmitted(mockForm),
        );

        // Assert: Initially not submitted
        expect(result()).toBe(false);

        // Act: Start submission
        submittingState.set(true);
        await TestBed.inject(
          (await import('@angular/core')).ApplicationRef,
        ).whenStable();
        expect(result()).toBe(false);

        // Act: Complete submission (the key transition)
        submittingState.set(false);
        await TestBed.inject(
          (await import('@angular/core')).ApplicationRef,
        ).whenStable();

        // Assert: Now submitted (transition detected)
        expect(result()).toBe(true);
      });
    });

    describe('Reset Detection', () => {
      it('should return false after form reset (touched: true → false)', async () => {
        // Arrange: Form that was submitted
        const submittingState = signal(false);
        const touchedState = signal(false);
        const mockForm = createMockFormWithSubmittingAndTouched(
          () => submittingState(),
          () => touchedState(),
        );

        const result = TestBed.runInInjectionContext(() =>
          hasSubmitted(mockForm),
        );

        // Simulate full submission cycle
        submittingState.set(true);
        touchedState.set(true);
        await TestBed.inject(
          (await import('@angular/core')).ApplicationRef,
        ).whenStable();

        submittingState.set(false);
        await TestBed.inject(
          (await import('@angular/core')).ApplicationRef,
        ).whenStable();

        // Assert: Form is submitted
        expect(result()).toBe(true);

        // Act: Reset form (touched goes false)
        touchedState.set(false);
        await TestBed.inject(
          (await import('@angular/core')).ApplicationRef,
        ).whenStable();

        // Assert: Back to unsubmitted
        expect(result()).toBe(false);
      });
    });

    describe('Type Safety', () => {
      it('should work with typed form models', () => {
        // Arrange: Strongly typed form
        interface ContactForm {
          email: string;
          message: string;
        }
        const submittingState = signal(false);
        const mockForm = createMockFormWithSubmitting(() =>
          submittingState(),
        ) as FieldTree<ContactForm>;

        // Act
        const result = TestBed.runInInjectionContext(() =>
          hasSubmitted(mockForm),
        );

        // Assert
        expect(result()).toBe(false);
      });
    });
  });

  describe('Integration - Combined Usage', () => {
    it('should work together for complete submission flow', async () => {
      const isSubmittingState = signal(false);
      const touchedState = signal(false);

      const mockForm = createMockFormCompleteWithTouched(
        () => true,
        () => isSubmittingState(),
        () => touchedState(),
      );

      const hasSubmittedResult = TestBed.runInInjectionContext(() =>
        hasSubmitted(mockForm),
      );

      // Assert: Initial state
      expect(hasSubmittedResult()).toBe(false);

      // Act: Start submission
      isSubmittingState.set(true);
      touchedState.set(true);
      await TestBed.inject(
        (await import('@angular/core')).ApplicationRef,
      ).whenStable();

      // Assert: Submitting state
      expect(hasSubmittedResult()).toBe(false);

      // Act: Complete submission
      isSubmittingState.set(false);
      await TestBed.inject(
        (await import('@angular/core')).ApplicationRef,
      ).whenStable();

      // Assert: Submitted state
      expect(hasSubmittedResult()).toBe(true);
    });
  });
});

/**
 * Helper: Create mock FieldTree with controllable submitting signal.
 * Used for testing hasSubmitted which internally tracks submitting transitions.
 *
 * @param submitting - Submitting state function
 */
function createMockFormWithSubmitting(
  submitting: () => boolean,
): FieldTree<unknown> {
  return signal({
    value: () => ({}),
    valid: () => true,
    invalid: () => false,
    touched: () => true, // Default to touched (forms are touched after interaction)
    dirty: () => false,
    errors: () => [],
    pending: () => false,
    disabled: () => false,
    readonly: () => false,
    hidden: () => false,
    submitting,
    submittedStatus: () => 'unsubmitted' as const,
    reset: vi.fn(),
    markAsTouched: vi.fn(),
    markAsDirty: vi.fn(),
    resetSubmittedStatus: vi.fn(),
    errorSummary: () => [],
  }) as unknown as FieldTree<unknown>;
}

/**
 * Helper: Create mock FieldTree with controllable submitting and touched signals.
 * Used for testing reset detection (when touched transitions from true to false).
 *
 * @param submitting - Submitting state function
 * @param touched - Touched state function
 */
function createMockFormWithSubmittingAndTouched(
  submitting: () => boolean,
  touched: () => boolean,
): FieldTree<unknown> {
  return signal({
    value: () => ({}),
    valid: () => true,
    invalid: () => false,
    touched,
    dirty: () => false,
    errors: () => [],
    pending: () => false,
    disabled: () => false,
    readonly: () => false,
    hidden: () => false,
    submitting,
    submittedStatus: () => 'unsubmitted' as const,
    reset: vi.fn(),
    markAsTouched: vi.fn(),
    markAsDirty: vi.fn(),
    resetSubmittedStatus: vi.fn(),
    errorSummary: () => [],
  }) as unknown as FieldTree<unknown>;
}

/**
 * Helper: Create mock FieldTree with all submission-related signals including touched.
 * Used for integration tests that need full control.
 *
 * @param valid - Validity state function
 * @param submitting - Submitting state function
 * @param touched - Touched state function
 */
function createMockFormCompleteWithTouched(
  valid: () => boolean,
  submitting: () => boolean,
  touched: () => boolean,
): FieldTree<unknown> {
  return signal({
    value: () => ({}),
    valid,
    invalid: () => !valid(),
    touched,
    dirty: () => false,
    errors: () => [],
    pending: () => false,
    disabled: () => false,
    readonly: () => false,
    hidden: () => false,
    submitting,
    submittedStatus: () => 'unsubmitted' as const,
    reset: vi.fn(),
    markAsTouched: vi.fn(),
    markAsDirty: vi.fn(),
    resetSubmittedStatus: vi.fn(),
    errorSummary: () => [],
  }) as unknown as FieldTree<unknown>;
}
