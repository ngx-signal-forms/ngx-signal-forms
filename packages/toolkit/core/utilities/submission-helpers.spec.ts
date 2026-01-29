import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { FieldTree } from '@angular/forms/signals';
import { describe, expect, it, vi } from 'vitest';
import { canSubmit, hasSubmitted, isSubmitting } from './submission-helpers';

/**
 * Test suite for submission helper utilities.
 *
 * Critical functionality: Reduce template boilerplate for submission state checks.
 * Medium risk areas: Runtime type checking, signal unwrapping, template usage patterns.
 */
describe('Submission Helpers', () => {
  describe('canSubmit', () => {
    describe('Happy Path', () => {
      it('should return true when form is valid and not submitting', () => {
        // Arrange: Valid form, not submitting
        const mockForm = createMockForm(true, false);

        // Act
        const result = canSubmit(mockForm);

        // Assert
        expect(result()).toBe(true);
      });

      it('should update reactively when form validity changes', () => {
        // Arrange: Start invalid, then become valid
        const isValid = signal(false);
        const mockForm = createMockForm(() => isValid(), false);
        const result = canSubmit(mockForm);

        // Assert: Initially false
        expect(result()).toBe(false);

        // Act: Make form valid
        isValid.set(true);

        // Assert: Now true
        expect(result()).toBe(true);
      });

      it('should update reactively when submitting state changes', () => {
        // Arrange: Valid form, start not submitting
        const isSubmittingState = signal(false);
        const mockForm = createMockForm(true, () => isSubmittingState());
        const result = canSubmit(mockForm);

        // Assert: Initially true
        expect(result()).toBe(true);

        // Act: Start submitting
        isSubmittingState.set(true);

        // Assert: Now false
        expect(result()).toBe(false);
      });
    });

    describe('Edge Cases - Invalid Form', () => {
      it('should return false when form is invalid', () => {
        // Arrange: Invalid form, not submitting
        const mockForm = createMockForm(false, false);

        // Act
        const result = canSubmit(mockForm);

        // Assert
        expect(result()).toBe(false);
      });

      it('should return false when form is invalid AND submitting', () => {
        // Arrange: Invalid form, submitting
        const mockForm = createMockForm(false, true);

        // Act
        const result = canSubmit(mockForm);

        // Assert
        expect(result()).toBe(false);
      });
    });

    describe('Edge Cases - Submitting State', () => {
      it('should return false when form is submitting', () => {
        // Arrange: Valid form, but submitting
        const mockForm = createMockForm(true, true);

        // Act
        const result = canSubmit(mockForm);

        // Assert
        expect(result()).toBe(false);
      });

      it('should return true after submission completes', () => {
        // Arrange: Valid form, simulate submission lifecycle
        const isSubmittingState = signal(false);
        const mockForm = createMockForm(true, () => isSubmittingState());
        const result = canSubmit(mockForm);

        // Assert: Initially can submit
        expect(result()).toBe(true);

        // Act: Start submission
        isSubmittingState.set(true);
        expect(result()).toBe(false);

        // Act: Complete submission
        isSubmittingState.set(false);

        // Assert: Can submit again
        expect(result()).toBe(true);
      });
    });

    describe('Type Safety', () => {
      it('should work with typed form models', () => {
        // Arrange: Strongly typed form
        interface UserForm {
          email: string;
          password: string;
        }
        const mockForm = createMockForm(true, false) as FieldTree<UserForm>;

        // Act
        const result = canSubmit(mockForm);

        // Assert
        expect(result()).toBe(true);
      });

      it('should accept any FieldTree type', () => {
        // Arrange: Different data types
        const stringForm = createMockForm(true, false) as FieldTree<string>;
        const numberForm = createMockForm(true, false) as FieldTree<number>;
        const objectForm = createMockForm(true, false) as FieldTree<{
          name: string;
        }>;

        // Act & Assert: Should all work
        expect(canSubmit(stringForm)()).toBe(true);
        expect(canSubmit(numberForm)()).toBe(true);
        expect(canSubmit(objectForm)()).toBe(true);
      });
    });
  });

  describe('isSubmitting', () => {
    describe('Happy Path', () => {
      it('should return true when form is submitting', () => {
        // Arrange: Form in submitting state
        const mockForm = createMockForm(true, true);

        // Act
        const result = isSubmitting(mockForm);

        // Assert
        expect(result()).toBe(true);
      });

      it('should return false when form is not submitting', () => {
        // Arrange: Form not submitting
        const mockForm = createMockForm(true, false);

        // Act
        const result = isSubmitting(mockForm);

        // Assert
        expect(result()).toBe(false);
      });

      it('should update reactively when submitting state changes', () => {
        // Arrange: Dynamic submitting state
        const isSubmittingState = signal(false);
        const mockForm = createMockForm(true, () => isSubmittingState());
        const result = isSubmitting(mockForm);

        // Assert: Initially not submitting
        expect(result()).toBe(false);

        // Act: Start submitting
        isSubmittingState.set(true);

        // Assert: Now submitting
        expect(result()).toBe(true);

        // Act: Stop submitting
        isSubmittingState.set(false);

        // Assert: Not submitting again
        expect(result()).toBe(false);
      });
    });

    describe('Edge Cases', () => {
      it('should work regardless of form validity', () => {
        // Arrange: Invalid form, but submitting
        const mockForm = createMockForm(false, true);

        // Act
        const result = isSubmitting(mockForm);

        // Assert: Still reports submitting state
        expect(result()).toBe(true);
      });
    });

    describe('Type Safety', () => {
      it('should work with typed form models', () => {
        // Arrange: Strongly typed form
        interface LoginForm {
          username: string;
          password: string;
        }
        const mockForm = createMockForm(true, true) as FieldTree<LoginForm>;

        // Act
        const result = isSubmitting(mockForm);

        // Assert
        expect(result()).toBe(true);
      });
    });
  });

  describe('hasSubmitted', () => {
    describe('Happy Path', () => {
      it('should return false initially when form has not been submitted', () => {
        // Arrange: Form with submitting = false
        const submittingState = signal(false);
        const mockForm = createMockFormWithSubmitting(() => submittingState());

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

    describe('Edge Cases', () => {
      it('should return false when form state is null/undefined', () => {
        // Arrange: Form signal that returns null
        const mockForm = signal(null) as unknown as FieldTree<unknown>;

        // Act
        const result = TestBed.runInInjectionContext(() =>
          hasSubmitted(mockForm),
        );

        // Assert
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
      // Arrange: Simulate full submission lifecycle
      const isValid = signal(false);
      const isSubmittingState = signal(false);
      const touchedState = signal(false);

      const mockForm = createMockFormCompleteWithTouched(
        () => isValid(),
        () => isSubmittingState(),
        () => touchedState(),
      );

      const canSubmitResult = canSubmit(mockForm);
      const isSubmittingResult = isSubmitting(mockForm);
      // hasSubmitted needs injection context
      const hasSubmittedResult = TestBed.runInInjectionContext(() =>
        hasSubmitted(mockForm),
      );

      // Assert: Initial state (invalid, not submitting, not submitted)
      expect(canSubmitResult()).toBe(false);
      expect(isSubmittingResult()).toBe(false);
      expect(hasSubmittedResult()).toBe(false);

      // Act: Make form valid
      isValid.set(true);

      // Assert: Can now submit
      expect(canSubmitResult()).toBe(true);
      expect(isSubmittingResult()).toBe(false);
      expect(hasSubmittedResult()).toBe(false);

      // Act: Start submission
      isSubmittingState.set(true);
      touchedState.set(true);
      await TestBed.inject(
        (await import('@angular/core')).ApplicationRef,
      ).whenStable();

      // Assert: Submitting state
      expect(canSubmitResult()).toBe(false); // Can't submit while submitting
      expect(isSubmittingResult()).toBe(true);
      expect(hasSubmittedResult()).toBe(false);

      // Act: Complete submission
      isSubmittingState.set(false);
      await TestBed.inject(
        (await import('@angular/core')).ApplicationRef,
      ).whenStable();

      // Assert: Submitted state
      expect(canSubmitResult()).toBe(true); // Can submit again
      expect(isSubmittingResult()).toBe(false);
      expect(hasSubmittedResult()).toBe(true);
    });
  });
});

/**
 * Helper: Create mock FieldTree with valid() and submitting() signals.
 *
 * @param valid - Validity state (boolean or signal function)
 * @param submitting - Submitting state (boolean or signal function)
 */
function createMockForm(
  valid: boolean | (() => boolean),
  submitting: boolean | (() => boolean),
): FieldTree<unknown> {
  const validFn = typeof valid === 'function' ? valid : () => valid;
  const submittingFn =
    typeof submitting === 'function' ? submitting : () => submitting;

  return signal({
    value: () => ({}),
    valid: validFn,
    invalid: () => !validFn(),
    touched: () => false,
    dirty: () => false,
    errors: () => [],
    pending: () => false,
    disabled: () => false,
    readonly: () => false,
    hidden: () => false,
    submitting: submittingFn,
    submittedStatus: () => 'unsubmitted' as const,
    reset: vi.fn(),
    markAsTouched: vi.fn(),
    markAsDirty: vi.fn(),
    resetSubmittedStatus: vi.fn(),
    errorSummary: () => [],
  }) as unknown as FieldTree<unknown>;
}

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
