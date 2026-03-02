import type { FieldTree, ValidationError } from '@angular/forms/signals';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { focusFirstInvalid } from './focus-first-invalid';

/**
 * Test suite for focus-first-invalid utility.
 *
 * Critical functionality: Focus management for accessibility (WCAG 2.2).
 * Uses Angular 21.1's native focusBoundControl() method.
 */
describe('focusFirstInvalid', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Happy Path', () => {
    it('should call focusBoundControl on first invalid field and return true', () => {
      // Arrange
      const focusBoundControlSpy = vi.fn();
      const mockField = createMockFieldWithErrors([
        createMockError(focusBoundControlSpy),
      ]);

      // Act
      const result = focusFirstInvalid(mockField);

      // Assert
      expect(result).toBe(true);
      expect(focusBoundControlSpy).toHaveBeenCalledOnce();
    });

    it('should focus first error when multiple errors exist', () => {
      // Arrange
      const firstFocusSpy = vi.fn();
      const secondFocusSpy = vi.fn();
      const mockField = createMockFieldWithErrors([
        createMockError(firstFocusSpy),
        createMockError(secondFocusSpy),
      ]);

      // Act
      const result = focusFirstInvalid(mockField);

      // Assert
      expect(result).toBe(true);
      expect(firstFocusSpy).toHaveBeenCalledOnce();
      expect(secondFocusSpy).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases - Valid Form', () => {
    it('should return false when form has no errors', () => {
      // Arrange
      const mockField = createMockFieldWithErrors([]);

      // Act
      const result = focusFirstInvalid(mockField);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when errorSummary returns empty array', () => {
      // Arrange
      const mockField = createMockField(true);

      // Act
      const result = focusFirstInvalid(mockField);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('Edge Cases - Missing fieldTree', () => {
    it('should return false when first error has no fieldTree', () => {
      // Arrange: Error without fieldTree property
      const errorWithoutFieldTree = {
        kind: 'required',
        message: 'Required',
        // No fieldTree property
      } as unknown as ValidationError<unknown>;

      const mockField = createMockFieldWithErrors([errorWithoutFieldTree]);

      // Act
      const result = focusFirstInvalid(mockField);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when fieldTree returns invalid state', () => {
      // Arrange: Error with fieldTree that returns null
      const errorWithNullFieldTree = {
        kind: 'required',
        message: 'Required',
        fieldTree: () => null,
      } as unknown as ValidationError<unknown>;

      const mockField = createMockFieldWithErrors([errorWithNullFieldTree]);

      // Act
      const result = focusFirstInvalid(mockField);

      // Assert
      expect(result).toBe(false);
    });
  });
});

/**
 * Helper: Create mock FieldTree with specified errors in errorSummary.
 */
function createMockFieldWithErrors(
  errors: ValidationError<unknown>[],
): FieldTree<unknown> {
  const fieldState = {
    value: () => ({}),
    valid: () => errors.length === 0,
    invalid: () => errors.length > 0,
    touched: () => false,
    dirty: () => false,
    errors: () => errors,
    errorSummary: () => errors,
    pending: () => false,
    disabled: () => false,
    readonly: () => false,
    hidden: () => false,
    submitting: () => false,
    reset: vi.fn(),
    markAsTouched: vi.fn(),
    markAsDirty: vi.fn(),
    focusBoundControl: vi.fn(),
  };

  return (() => fieldState) as unknown as FieldTree<unknown>;
}

/**
 * Helper: Create mock FieldTree for valid form.
 */
function createMockField(valid: boolean): FieldTree<unknown> {
  const fieldState = {
    value: () => ({}),
    valid: () => valid,
    invalid: () => !valid,
    touched: () => false,
    dirty: () => false,
    errors: () => [],
    errorSummary: () => [],
    pending: () => false,
    disabled: () => false,
    readonly: () => false,
    hidden: () => false,
    submitting: () => false,
    reset: vi.fn(),
    markAsTouched: vi.fn(),
    markAsDirty: vi.fn(),
    focusBoundControl: vi.fn(),
  };

  return (() => fieldState) as unknown as FieldTree<unknown>;
}

/**
 * Helper: Create mock ValidationError with focusBoundControl spy.
 */
function createMockError(
  focusBoundControlSpy: ReturnType<typeof vi.fn>,
): ValidationError<unknown> {
  return {
    kind: 'required',
    message: 'Required',
    fieldTree: () => ({
      value: () => '',
      valid: () => false,
      invalid: () => true,
      touched: () => false,
      dirty: () => false,
      errors: () => [],
      errorSummary: () => [],
      pending: () => false,
      disabled: () => false,
      readonly: () => false,
      hidden: () => false,
      submitting: () => false,
      reset: vi.fn(),
      markAsTouched: vi.fn(),
      markAsDirty: vi.fn(),
      focusBoundControl: focusBoundControlSpy,
    }),
  } as unknown as ValidationError<unknown>;
}
