import type { FieldTree, ValidationError } from '@angular/forms/signals';
import { describe, expect, it, vi } from 'vitest';
import { createOnInvalidHandler } from './on-invalid-handler';
import { createMockFieldTree as createMockFieldTreeShared } from './testing/mock-field-tree';

function createMockFieldTree(
  errors: readonly ValidationError.WithFieldTree[] = [],
): FieldTree<unknown> {
  return createMockFieldTreeShared({
    value: {},
    errors,
    valid: errors.length === 0,
    invalid: errors.length > 0,
  });
}

/**
 * A single required-field error whose `focusBoundControl()` calls the given
 * spy — enough for `createOnInvalidHandler`'s focus-then-`afterInvalid`
 * ordering tests, which only care that focus was attempted.
 *
 * Builds the mock field tree ONCE and reuses it as `fieldTree` directly,
 * rather than a `() => createMockFieldTreeShared(...)()` factory that would
 * mint a brand-new `FieldState` (with its own new `fieldTree` back-
 * reference) on every call — breaking the `state.fieldTree === fieldTree`
 * identity the walker relies on if `error.fieldTree()` is ever read more
 * than once.
 */
function createMockError(
  focusBoundControl: () => void,
): ValidationError.WithFieldTree {
  const fieldTree = createMockFieldTreeShared({
    value: '',
    invalid: true,
    valid: false,
    focusBoundControl,
  });

  return {
    kind: 'required',
    message: 'Required',
    fieldTree,
  } satisfies ValidationError.WithFieldTree;
}

describe('createOnInvalidHandler', () => {
  it('should return a function', () => {
    const handler = createOnInvalidHandler();
    expect(typeof handler).toBe('function');
  });

  it('should call focusFirstInvalid by default', () => {
    const focusSpy = vi.fn();
    const mockFieldTree = createMockFieldTree([createMockError(focusSpy)]);

    const handler = createOnInvalidHandler();
    handler(mockFieldTree);

    expect(focusSpy).toHaveBeenCalledOnce();
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

    const mockFieldTree = createMockFieldTree([createMockError(focusFn)]);

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
