import { signal } from '@angular/core';
import type {
  DisabledReason,
  FieldState,
  FieldTree,
  FormField,
  MetadataKey,
  ValidationError,
} from '@angular/forms/signals';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { focusFirstInvalid } from './focus-first-invalid';

/**
 * Test suite for focus-first-invalid utility.
 *
 * Critical functionality: Focus management for accessibility (WCAG 2.2).
 * Uses Angular 21.2's native focusBoundControl() method.
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
        createMockError(() => {
          focusBoundControlSpy();
        }),
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
        createMockError(() => {
          firstFocusSpy();
        }),
        createMockError(() => {
          secondFocusSpy();
        }),
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
      const errorWithoutFieldTree = {
        kind: 'required',
        message: 'Required',
      } satisfies ValidationError.WithOptionalFieldTree;

      const mockField = createMockFieldWithErrors([errorWithoutFieldTree]);

      // Act
      const result = focusFirstInvalid(mockField);

      // Assert
      expect(result).toBe(false);
    });

    it('should skip error with missing fieldTree and focus the next focusable one', () => {
      const errorWithoutFieldTree = {
        kind: 'required',
        message: 'Required',
      } satisfies ValidationError.WithOptionalFieldTree;

      const nextFocusSpy = vi.fn();
      const mockField = createMockFieldWithErrors([
        errorWithoutFieldTree,
        createMockError(() => {
          nextFocusSpy();
        }),
      ]);

      const result = focusFirstInvalid(mockField);

      expect(result).toBe(true);
      expect(nextFocusSpy).toHaveBeenCalledOnce();
    });

    it('should return false when fieldTree returns invalid state', () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- This test intentionally simulates a malformed runtime error payload.
      const errorWithNullFieldTree = {
        kind: 'required',
        message: 'Required',
        fieldTree: () => null,
      } as unknown as ValidationError.WithOptionalFieldTree;

      const mockField = createMockFieldWithErrors([errorWithNullFieldTree]);

      // Act
      const result = focusFirstInvalid(mockField);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('Non-interactive fields (hidden/disabled)', () => {
    it('should skip errors on hidden fields and focus the next visible one', () => {
      const hiddenFocusSpy = vi.fn();
      const visibleFocusSpy = vi.fn();

      const mockField = createMockFieldWithErrors([
        createMockError(
          () => {
            hiddenFocusSpy();
          },
          { hidden: true },
        ),
        createMockError(() => {
          visibleFocusSpy();
        }),
      ]);

      const result = focusFirstInvalid(mockField);

      expect(result).toBe(true);
      expect(hiddenFocusSpy).not.toHaveBeenCalled();
      expect(visibleFocusSpy).toHaveBeenCalledOnce();
    });

    it('should skip errors on disabled fields and focus the next enabled one', () => {
      const disabledFocusSpy = vi.fn();
      const enabledFocusSpy = vi.fn();

      const mockField = createMockFieldWithErrors([
        createMockError(
          () => {
            disabledFocusSpy();
          },
          { disabled: true },
        ),
        createMockError(() => {
          enabledFocusSpy();
        }),
      ]);

      const result = focusFirstInvalid(mockField);

      expect(result).toBe(true);
      expect(disabledFocusSpy).not.toHaveBeenCalled();
      expect(enabledFocusSpy).toHaveBeenCalledOnce();
    });

    it('should return false when every error is on a hidden or disabled field', () => {
      const hiddenSpy = vi.fn();
      const disabledSpy = vi.fn();

      const mockField = createMockFieldWithErrors([
        createMockError(
          () => {
            hiddenSpy();
          },
          { hidden: true },
        ),
        createMockError(
          () => {
            disabledSpy();
          },
          { disabled: true },
        ),
      ]);

      const result = focusFirstInvalid(mockField);

      expect(result).toBe(false);
      expect(hiddenSpy).not.toHaveBeenCalled();
      expect(disabledSpy).not.toHaveBeenCalled();
    });

    it('should still focus readonly fields — their errors are user-actionable', () => {
      const readonlyFocusSpy = vi.fn();

      const mockField = createMockFieldWithErrors([
        createMockError(
          () => {
            readonlyFocusSpy();
          },
          { readonly: true },
        ),
      ]);

      const result = focusFirstInvalid(mockField);

      expect(result).toBe(true);
      expect(readonlyFocusSpy).toHaveBeenCalledOnce();
    });
  });
});

/**
 * Helper: Create mock FieldTree with specified errors in errorSummary.
 */
function createMockFieldWithErrors(
  errors: readonly ValidationError.WithOptionalFieldTree[],
): FieldTree<unknown> {
  return createMockFieldTree({
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- These edge-case tests intentionally feed malformed runtime errors into errorSummary().
    errors: [...errors] as ValidationError.WithFieldTree[],
    valid: errors.length === 0,
    invalid: errors.length > 0,
    value: {},
  });
}

/**
 * Helper: Create mock FieldTree for valid form.
 */
function createMockField(valid: boolean): FieldTree<unknown> {
  return createMockFieldTree({
    errors: [],
    valid,
    invalid: !valid,
    value: {},
  });
}

/**
 * Helper: Create mock ValidationError with focusBoundControl spy.
 */
function createMockError(
  focusBoundControlSpy: () => void,
  stateOverrides: Readonly<{
    hidden?: boolean;
    disabled?: boolean;
    readonly?: boolean;
  }> = {},
): ValidationError.WithFieldTree {
  return {
    kind: 'required',
    message: 'Required',
    fieldTree: createMockFieldTree({
      errors: [],
      focusBoundControl: (_options?: FocusOptions): void => {
        focusBoundControlSpy();
      },
      invalid: true,
      valid: false,
      value: '',
      hidden: stateOverrides.hidden ?? false,
      disabled: stateOverrides.disabled ?? false,
      isReadonly: stateOverrides.readonly ?? false,
    }),
  } satisfies ValidationError.WithFieldTree;
}

function createMockFieldTree<TValue>({
  errors,
  focusBoundControl,
  invalid,
  valid,
  value,
  hidden = false,
  disabled = false,
  isReadonly = false,
}: {
  errors: ValidationError.WithFieldTree[];
  focusBoundControl?: (options?: FocusOptions) => void;
  invalid: boolean;
  valid: boolean;
  value: TValue;
  hidden?: boolean;
  disabled?: boolean;
  isReadonly?: boolean;
}): FieldTree<TValue> {
  let fieldTree!: FieldTree<TValue>;

  const valueSignal = signal(value);
  const errorSignal = signal(errors);
  const focusBoundControlFn =
    focusBoundControl ?? ((_options?: FocusOptions): void => undefined);

  const fieldState: FieldState<TValue> = {
    get fieldTree() {
      return fieldTree;
    },
    value: valueSignal,
    controlValue: valueSignal,
    disabled: signal(disabled),
    disabledReasons: signal<DisabledReason[]>([]),
    dirty: signal(false),
    errorSummary: errorSignal,
    errors: errorSignal,
    formFieldBindings: signal<FormField<unknown>[]>([]),
    hidden: signal(hidden),
    invalid: signal(invalid),
    keyInParent: signal<string | number>('root'),
    max: signal<number | undefined>(undefined),
    maxLength: signal<number | undefined>(undefined),
    min: signal<number | undefined>(undefined),
    minLength: signal<number | undefined>(undefined),
    name: signal('root'),
    pattern: signal<readonly RegExp[]>([]),
    pending: signal(false),
    readonly: signal(isReadonly),
    required: signal(false),
    submitting: signal(false),
    touched: signal(false),
    valid: signal(valid),
    focusBoundControl: focusBoundControlFn,
    markAsDirty: (): void => undefined,
    markAsTouched: (): void => undefined,
    metadata: <M>(_key: MetadataKey<M, unknown, unknown>): M | undefined =>
      undefined,
    reset: (_value?: TValue): void => undefined,
  };

  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- This test helper only needs the callable FieldTree shape used by focusFirstInvalid().
  fieldTree = Object.assign(
    (): FieldState<TValue> => fieldState,
    {},
  ) as FieldTree<TValue>;

  return fieldTree;
}
