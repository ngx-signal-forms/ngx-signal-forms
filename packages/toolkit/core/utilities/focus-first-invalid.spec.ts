import { signal } from '@angular/core';
import type {
  DisabledReason,
  FieldState,
  FieldTree,
  FormField,
  MetadataKey,
  ValidationError,
} from '@angular/forms/signals';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

  afterEach(() => {
    for (const element of Array.from(
      document.body.querySelectorAll('[data-mock-focus-target]'),
    )) {
      element.remove();
    }
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

    it('warns once in dev mode when no error could be focused', () => {
      // Unit tests run in Angular dev mode (isDevMode() === true), so the
      // diagnostic warning is expected to fire exactly once.
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {
        // suppress the warning output during the test run
      });

      const mockField = createMockFieldWithErrors([
        createMockError(() => undefined, { hidden: true }),
        createMockError(() => undefined, { disabled: true }),
      ]);

      const result = focusFirstInvalid(mockField);

      expect(result).toBe(false);
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0]?.[0]).toContain('focusFirstInvalid');

      warnSpy.mockRestore();
    });

    it('should skip an error whose fieldTree state has no focusBoundControl method', () => {
      const nextFocusSpy = vi.fn();

      const mockField = createMockFieldWithErrors([
        createMockErrorWithoutFocusBoundControl(),
        createMockError(() => {
          nextFocusSpy();
        }),
      ]);

      const result = focusFirstInvalid(mockField);

      expect(result).toBe(true);
      expect(nextFocusSpy).toHaveBeenCalledOnce();
    });

    it('should return false when the only error has no focusBoundControl method', () => {
      const mockField = createMockFieldWithErrors([
        createMockErrorWithoutFocusBoundControl(),
      ]);

      const result = focusFirstInvalid(mockField);

      expect(result).toBe(false);
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

  describe('Silent no-op focusBoundControl (unregistered custom control binding)', () => {
    it('skips a field whose focusBoundControl() call does not move focus and focuses the next native field', () => {
      const noopFocusSpy = vi.fn();
      const nativeFocusSpy = vi.fn();

      const mockField = createMockFieldWithErrors([
        createMockNoopError(() => {
          noopFocusSpy();
        }),
        createMockError(() => {
          nativeFocusSpy();
        }),
      ]);

      const result = focusFirstInvalid(mockField);

      expect(result).toBe(true);
      expect(noopFocusSpy).toHaveBeenCalledOnce();
      expect(nativeFocusSpy).toHaveBeenCalledOnce();
    });

    it('returns false and warns once when every focusBoundControl() call is a silent no-op', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {
        // suppress the warning output during the test run
      });

      const mockField = createMockFieldWithErrors([
        createMockNoopError(() => undefined),
        createMockNoopError(() => undefined),
      ]);

      const result = focusFirstInvalid(mockField);

      expect(result).toBe(false);
      expect(warnSpy).toHaveBeenCalledTimes(1);

      warnSpy.mockRestore();
    });

    it('counts a descendant binding (composite whose child registered) as a hit', () => {
      // A composite control's focusBoundControl() descends into a child
      // binding — the moved focus target is not the field's own element, but
      // it is still a real, observable focus move that must count as success.
      const mockField = createMockFieldWithErrors([
        createMockDescendantFocusError(),
      ]);

      const result = focusFirstInvalid(mockField);

      expect(result).toBe(true);
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
 * Helper: Create mock ValidationError whose `focusBoundControl()` actually
 * moves DOM focus (as a real bound native control would), plus a spy so
 * tests can also assert call counts.
 */
function createMockError(
  focusBoundControlSpy: () => void,
  stateOverrides: Readonly<{
    hidden?: boolean;
    disabled?: boolean;
    readonly?: boolean;
  }> = {},
): ValidationError.WithFieldTree {
  const target = createFocusTarget();
  return {
    kind: 'required',
    message: 'Required',
    fieldTree: createMockFieldTree({
      errors: [],
      focusBoundControl: (_options?: FocusOptions): void => {
        focusBoundControlSpy();
        target.focus();
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

/**
 * Helper: Create a mock ValidationError whose resolved `FieldState` has no
 * `focusBoundControl` method — simulating a custom control that never called
 * `registerAsBinding()`. `focusFirstInvalid()` must skip such errors.
 */
function createMockErrorWithoutFocusBoundControl(): ValidationError.WithFieldTree {
  return {
    kind: 'required',
    message: 'Required',
    fieldTree: createMockFieldTree({
      errors: [],
      omitFocusBoundControl: true,
      invalid: true,
      valid: false,
      value: '',
    }),
  } satisfies ValidationError.WithFieldTree;
}

/**
 * Helper: Create a mock ValidationError whose `focusBoundControl()` method
 * exists (a real `FieldState` always has it) but is a **silent no-op** —
 * reproducing Angular's own `focusBoundControl()` behavior when the field
 * has no registered binding (`getBindingForFocus()` finds nothing to call
 * `.focus()` on). `focusFirstInvalid()` must detect that focus did not move
 * and continue to the next candidate.
 */
function createMockNoopError(
  focusBoundControlSpy: () => void,
): ValidationError.WithFieldTree {
  return {
    kind: 'required',
    message: 'Required',
    fieldTree: createMockFieldTree({
      errors: [],
      focusBoundControl: (_options?: FocusOptions): void => {
        focusBoundControlSpy();
        // Deliberately does not touch document.activeElement — mirrors
        // Angular's silent no-op for an unbound custom control.
      },
      invalid: true,
      valid: false,
      value: '',
    }),
  } satisfies ValidationError.WithFieldTree;
}

/**
 * Helper: Create a mock ValidationError simulating a composite control whose
 * `focusBoundControl()` descends into a child's registered binding. The
 * focused element is not the field's own element, but focus still moves.
 */
function createMockDescendantFocusError(): ValidationError.WithFieldTree {
  const descendantTarget = createFocusTarget();
  return {
    kind: 'required',
    message: 'Required',
    fieldTree: createMockFieldTree({
      errors: [],
      focusBoundControl: (_options?: FocusOptions): void => {
        descendantTarget.focus();
      },
      invalid: true,
      valid: false,
      value: '',
    }),
  } satisfies ValidationError.WithFieldTree;
}

/**
 * Helper: Append a focusable element to the document so tests can assert on
 * real `document.activeElement` transitions. Cleaned up in `afterEach`.
 */
function createFocusTarget(): HTMLElement {
  const element = document.createElement('button');
  element.setAttribute('data-mock-focus-target', '');
  document.body.append(element);
  return element;
}

function createMockFieldTree<TValue>({
  errors,
  focusBoundControl,
  omitFocusBoundControl = false,
  invalid,
  valid,
  value,
  hidden = false,
  disabled = false,
  isReadonly = false,
}: {
  errors: ValidationError.WithFieldTree[];
  focusBoundControl?: (options?: FocusOptions) => void;
  omitFocusBoundControl?: boolean;
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
    max: signal<NonNullable<TValue> | undefined>(undefined),
    maxLength: signal<number | undefined>(undefined),
    min: signal<NonNullable<TValue> | undefined>(undefined),
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
    hasMetadata: (_key: MetadataKey<unknown, unknown, unknown>): boolean =>
      false,
    getError: (_kind: string): undefined => undefined,
    reset: (_value?: TValue): void => undefined,
    reloadValidation: (): void => undefined,
  };

  if (omitFocusBoundControl) {
    // Simulate a custom control that never registered a binding: the native
    // FieldState surface still exists, but focusBoundControl is absent.
    delete (fieldState as Partial<FieldState<TValue>>).focusBoundControl;
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- This test helper only needs the callable FieldTree shape used by focusFirstInvalid().
  fieldTree = Object.assign(
    (): FieldState<TValue> => fieldState,
    {},
  ) as FieldTree<TValue>;

  return fieldTree;
}
