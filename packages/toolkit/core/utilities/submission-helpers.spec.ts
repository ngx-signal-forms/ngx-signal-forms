import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { FieldTree, ValidationError } from '@angular/forms/signals';
import { describe, expect, it, vi } from 'vitest';
import { hasSubmitted, submitWithWarnings } from './submission-helpers';
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
        const mockForm: FieldTree<ContactForm> = Object.assign(
          createMockFormWithSubmitting(() => submittingState()),
          {
            email: createMockLeafField(''),
            message: createMockLeafField(''),
          },
        );

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

  describe('submitWithWarnings', () => {
    it('should allow submission after touched state settles to warning-only', async () => {
      const action = vi.fn(async () => undefined);
      const markAsTouched = vi.fn(() => {
        queueMicrotask(() => {
          errorsState.set([
            { kind: 'warn:weak-password', message: 'Weak password' },
          ]);
        });
      });
      const errorsState = signal<ValidationError[]>([
        { kind: 'required', message: 'Password is required' },
      ]);
      const mockForm = createMockFormForSubmitWithWarnings(
        () => errorsState(),
        markAsTouched,
      );

      await submitWithWarnings(mockForm, action);

      expect(markAsTouched).toHaveBeenCalledOnce();
      expect(action).toHaveBeenCalledOnce();
    });

    it('should not submit when blocking errors remain after settling', async () => {
      const action = vi.fn(async () => undefined);
      const markAsTouched = vi.fn(() => {
        queueMicrotask(() => {
          errorsState.set([{ kind: 'required', message: 'Email is required' }]);
        });
      });
      const errorsState = signal<ValidationError[]>([
        { kind: 'required', message: 'Email is required' },
      ]);
      const mockForm = createMockFormForSubmitWithWarnings(
        () => errorsState(),
        markAsTouched,
      );

      await submitWithWarnings(mockForm, action);

      expect(markAsTouched).toHaveBeenCalledOnce();
      expect(action).not.toHaveBeenCalled();
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
    reset: createVoidSpy(),
    markAsTouched: createVoidSpy(),
    markAsDirty: createVoidSpy(),
    resetSubmittedStatus: createVoidSpy(),
    errorSummary: () => [],
  });
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
    reset: createVoidSpy(),
    markAsTouched: createVoidSpy(),
    markAsDirty: createVoidSpy(),
    resetSubmittedStatus: createVoidSpy(),
    errorSummary: () => [],
  });
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
    reset: createVoidSpy(),
    markAsTouched: createVoidSpy(),
    markAsDirty: createVoidSpy(),
    resetSubmittedStatus: createVoidSpy(),
    errorSummary: () => [],
  });
}

function createMockFormForSubmitWithWarnings(
  errors: () => readonly ValidationError[],
  markAsTouched: () => void,
): FieldTree<unknown> {
  const formTree = (() => ({
    value: () => ({}),
    valid: () => errors().length === 0,
    invalid: () => errors().length > 0,
    touched: () => false,
    dirty: () => true,
    errors,
    pending: () => false,
    disabled: () => false,
    readonly: () => false,
    hidden: () => false,
    submitting: () => false,
    submittedStatus: () => 'unsubmitted' as const,
    reset: createVoidSpy(),
    markAsTouched,
    markAsDirty: createVoidSpy(),
    resetSubmittedStatus: createVoidSpy(),
    errorSummary: errors,
  })) satisfies FieldTree<unknown>;

  return formTree;
}

function createMockLeafField(value: string): FieldTree<string> {
  return signal({
    value: () => value,
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
    keyInParent: () => '',
    formFieldBindings: () => [],
    controlValue: signal(value),
    markAsDirty: createVoidSpy(),
    markAsTouched: createVoidSpy(),
    reset: createVoidSpy(),
    focusBoundControl: createVoidSpy(),
    errorSummary: () => [],
    metadata: () => undefined,
  });
}

function createVoidSpy(): () => void {
  return vi.fn((): void => undefined);
}
