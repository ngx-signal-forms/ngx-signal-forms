import type { FieldTree } from '@angular/forms/signals';
import { describe, expect, it, vi } from 'vitest';
import { createOnInvalidHandler } from './on-invalid-handler';

function createMockFieldTree(errors: unknown[] = []): FieldTree<unknown> {
  const fieldTree = (() => ({
    errorSummary: () => errors,
    errors: () => errors,
    invalid: () => errors.length > 0,
    touched: () => false,
    dirty: () => false,
    valid: () => errors.length === 0,
    pending: () => false,
    submitting: () => false,
    value: () => ({}),
    markAsTouched: () => {},
  })) as unknown as FieldTree<unknown>;

  return fieldTree;
}

describe('createOnInvalidHandler', () => {
  it('should return a function', () => {
    const handler = createOnInvalidHandler();
    expect(typeof handler).toBe('function');
  });

  it('should call focusFirstInvalid by default', () => {
    const mockFieldTree = createMockFieldTree([
      {
        kind: 'required',
        message: 'Required',
        fieldTree: () => ({
          name: () => 'email',
          focusBoundControl: vi.fn(),
        }),
      },
    ]);

    const handler = createOnInvalidHandler();

    // Should not throw
    expect(() => {
      handler(mockFieldTree);
    }).not.toThrow();
  });

  it('should not throw when focusFirstInvalid is disabled', () => {
    const mockFieldTree = createMockFieldTree();

    const handler = createOnInvalidHandler({ focusFirstInvalid: false });

    expect(() => {
      handler(mockFieldTree);
    }).not.toThrow();
  });

  it('should call afterInvalid callback when provided', () => {
    const callbacks = {
      afterInvalid(_field: FieldTree<unknown>): void {},
    };
    const afterInvalid = vi.spyOn(callbacks, 'afterInvalid');
    const mockFieldTree = createMockFieldTree();

    const handler = createOnInvalidHandler({ afterInvalid });
    handler(mockFieldTree);

    expect(afterInvalid).toHaveBeenCalledOnce();
    expect(afterInvalid).toHaveBeenCalledWith(mockFieldTree);
  });

  it('should call afterInvalid after focus when both are enabled', () => {
    const callOrder: string[] = [];
    const focusFn = vi.fn(() => {
      callOrder.push('focus');
    });
    const afterInvalid = vi.fn(() => {
      callOrder.push('afterInvalid');
    });

    const mockFieldTree = createMockFieldTree([
      {
        kind: 'required',
        message: 'Required',
        fieldTree: () => ({
          name: () => 'email',
          focusBoundControl: focusFn,
        }),
      },
    ]);

    const handler = createOnInvalidHandler({ afterInvalid });
    handler(mockFieldTree);

    expect(afterInvalid).toHaveBeenCalledOnce();
    expect(callOrder).toEqual(['focus', 'afterInvalid']);
  });

  it('should skip focus but still call afterInvalid when focus is disabled', () => {
    const callbacks = {
      afterInvalid(_field: FieldTree<unknown>): void {},
    };
    const afterInvalid = vi.spyOn(callbacks, 'afterInvalid');
    const mockFieldTree = createMockFieldTree();

    const handler = createOnInvalidHandler({
      focusFirstInvalid: false,
      afterInvalid,
    });
    handler(mockFieldTree);

    expect(afterInvalid).toHaveBeenCalledOnce();
  });

  it('should handle empty options', () => {
    const handler = createOnInvalidHandler({});
    const mockFieldTree = createMockFieldTree();

    expect(() => {
      handler(mockFieldTree);
    }).not.toThrow();
  });
});
