import { describe, it, expect } from 'vitest';
import { signal } from '@angular/core';
import type { FieldTree } from '@angular/forms/signals';
import { canSubmit, isSubmitting, hasSubmitted } from './submission-helpers';

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
        const objectForm = createMockForm(true, false) as FieldTree<{ name: string }>;

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
      it('should return true when form has been submitted', () => {
        // Arrange: Form with submitted status
        const mockForm = createMockFormWithStatus('submitted');

        // Act
        const result = hasSubmitted(mockForm);

        // Assert
        expect(result()).toBe(true);
      });

      it('should return false when form is unsubmitted', () => {
        // Arrange: Unsubmitted form
        const mockForm = createMockFormWithStatus('unsubmitted');

        // Act
        const result = hasSubmitted(mockForm);

        // Assert
        expect(result()).toBe(false);
      });

      it('should return false when form is submitting', () => {
        // Arrange: Currently submitting (not yet submitted)
        const mockForm = createMockFormWithStatus('submitting');

        // Act
        const result = hasSubmitted(mockForm);

        // Assert
        expect(result()).toBe(false);
      });

      it('should update reactively when submission completes', () => {
        // Arrange: Simulate submission lifecycle
        const status = signal<'unsubmitted' | 'submitting' | 'submitted'>('unsubmitted');
        const mockForm = createMockFormWithStatus(() => status());
        const result = hasSubmitted(mockForm);

        // Assert: Initially not submitted
        expect(result()).toBe(false);

        // Act: Start submitting
        status.set('submitting');
        expect(result()).toBe(false);

        // Act: Complete submission
        status.set('submitted');

        // Assert: Now submitted
        expect(result()).toBe(true);
      });
    });

    describe('Edge Cases - Missing submittedStatus', () => {
      it('should return false when form has no submittedStatus signal', () => {
        // Arrange: Field without submittedStatus (non-root field)
        const mockField = signal({
          value: () => ({}),
          valid: () => true,
          invalid: () => false,
          touched: () => false,
          dirty: () => false,
          errors: () => [],
          pending: () => false,
          disabled: () => false,
          readonly: () => false,
          hidden: () => false,
          submitting: () => false,
          // No submittedStatus
          reset: vi.fn(),
          markAsTouched: vi.fn(),
          markAsDirty: vi.fn(),
          resetSubmittedStatus: vi.fn(),
          errorSummary: () => [],
        });

        // Act
        const result = hasSubmitted(mockField as unknown as FieldTree<unknown>);

        // Assert: Should handle missing property gracefully
        expect(result()).toBe(false);
      });

      it('should return false when submittedStatus is undefined', () => {
        // Arrange: Form with undefined submittedStatus
        const mockForm = signal({
          value: () => ({}),
          valid: () => true,
          invalid: () => false,
          touched: () => false,
          dirty: () => false,
          errors: () => [],
          pending: () => false,
          disabled: () => false,
          readonly: () => false,
          hidden: () => false,
          submitting: () => false,
          submittedStatus: () => undefined,
          reset: vi.fn(),
          markAsTouched: vi.fn(),
          markAsDirty: vi.fn(),
          resetSubmittedStatus: vi.fn(),
          errorSummary: () => [],
        });

        // Act
        const result = hasSubmitted(mockForm as unknown as FieldTree<unknown>);

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
        const mockForm = createMockFormWithStatus('submitted') as FieldTree<ContactForm>;

        // Act
        const result = hasSubmitted(mockForm);

        // Assert
        expect(result()).toBe(true);
      });
    });
  });

  describe('Integration - Combined Usage', () => {
    it('should work together for complete submission flow', () => {
      // Arrange: Simulate full submission lifecycle
      const isValid = signal(false);
      const isSubmittingState = signal(false);
      const status = signal<'unsubmitted' | 'submitting' | 'submitted'>('unsubmitted');

      const mockForm = createMockFormComplete(
        () => isValid(),
        () => isSubmittingState(),
        () => status(),
      );

      const canSubmitResult = canSubmit(mockForm);
      const isSubmittingResult = isSubmitting(mockForm);
      const hasSubmittedResult = hasSubmitted(mockForm);

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
      status.set('submitting');

      // Assert: Submitting state
      expect(canSubmitResult()).toBe(false); // Can't submit while submitting
      expect(isSubmittingResult()).toBe(true);
      expect(hasSubmittedResult()).toBe(false);

      // Act: Complete submission
      isSubmittingState.set(false);
      status.set('submitted');

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
  const submittingFn = typeof submitting === 'function' ? submitting : () => submitting;

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
 * Helper: Create mock FieldTree with submittedStatus signal.
 *
 * @param status - Submitted status (string or signal function)
 */
function createMockFormWithStatus(
  status: 'unsubmitted' | 'submitting' | 'submitted' | (() => 'unsubmitted' | 'submitting' | 'submitted' | undefined),
): FieldTree<unknown> {
  const statusFn = typeof status === 'function' ? status : () => status;

  return signal({
    value: () => ({}),
    valid: () => true,
    invalid: () => false,
    touched: () => false,
    dirty: () => false,
    errors: () => [],
    pending: () => false,
    disabled: () => false,
    readonly: () => false,
    hidden: () => false,
    submitting: () => false,
    submittedStatus: statusFn,
    reset: vi.fn(),
    markAsTouched: vi.fn(),
    markAsDirty: vi.fn(),
    resetSubmittedStatus: vi.fn(),
    errorSummary: () => [],
  }) as unknown as FieldTree<unknown>;
}

/**
 * Helper: Create mock FieldTree with all submission-related signals.
 *
 * @param valid - Validity state function
 * @param submitting - Submitting state function
 * @param status - Submitted status function
 */
function createMockFormComplete(
  valid: () => boolean,
  submitting: () => boolean,
  status: () => 'unsubmitted' | 'submitting' | 'submitted',
): FieldTree<unknown> {
  return signal({
    value: () => ({}),
    valid,
    invalid: () => !valid(),
    touched: () => false,
    dirty: () => false,
    errors: () => [],
    pending: () => false,
    disabled: () => false,
    readonly: () => false,
    hidden: () => false,
    submitting,
    submittedStatus: status,
    reset: vi.fn(),
    markAsTouched: vi.fn(),
    markAsDirty: vi.fn(),
    resetSubmittedStatus: vi.fn(),
    errorSummary: () => [],
  }) as unknown as FieldTree<unknown>;
}
