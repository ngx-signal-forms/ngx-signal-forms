import type { ValidationError } from '@angular/forms/signals';
import { describe, expect, it, vi } from 'vitest';
import {
  dedupeValidationErrorsByField,
  errorHasFocusableTarget,
  focusBoundControlFromError,
  toErrorSummaryEntry,
} from './error-summary-utilities';

/**
 * Direct unit tests for the error-summary mapping utilities, split out of
 * `utilities.ts` in issue #354 (headless module split in #512/#545). Only
 * `resolveFieldNameFromError` had a direct spec (via `utilities.spec.ts`,
 * which re-exercises it through `./utilities`); this file covers the other
 * four exports directly, at their own module.
 */

function errorWithFieldTree(
  overrides: Readonly<{
    kind?: string;
    message?: string;
    fieldName?: string | null;
    focusBoundControl?: (() => void) | null;
  }> = {},
): ValidationError.WithFieldTree {
  const {
    kind = 'required',
    message = 'Required',
    fieldName = 'email',
    focusBoundControl = (): void => undefined,
  } = overrides;

  return {
    kind,
    message,
    fieldTree: () => ({
      name: () => fieldName,
      ...(focusBoundControl ? { focusBoundControl } : {}),
    }),
  } as ValidationError.WithFieldTree;
}

describe('dedupeValidationErrorsByField', () => {
  it('keeps two errors with the same kind and message on different fields', () => {
    const errors = [
      errorWithFieldTree({ fieldName: 'email' }),
      errorWithFieldTree({ fieldName: 'username' }),
    ];

    expect(dedupeValidationErrorsByField(errors)).toHaveLength(2);
  });

  it('drops a duplicate kind + message + field combination, keeping the first', () => {
    const first = errorWithFieldTree({ fieldName: 'email' });
    const second = errorWithFieldTree({ fieldName: 'email' });

    const result = dedupeValidationErrorsByField([first, second]);

    expect(result).toEqual([first]);
  });

  it('treats two different messages on the same field as distinct entries', () => {
    const errors = [
      errorWithFieldTree({ fieldName: 'email', message: 'Required' }),
      errorWithFieldTree({ fieldName: 'email', message: 'Invalid format' }),
    ];

    expect(dedupeValidationErrorsByField(errors)).toHaveLength(2);
  });

  it('falls back to a field-blind key for errors with no resolvable fieldTree', () => {
    const withoutFieldTree: ValidationError = {
      kind: 'custom',
      message: 'Passwords must match',
    };

    const result = dedupeValidationErrorsByField([
      withoutFieldTree,
      { ...withoutFieldTree },
    ]);

    expect(result).toHaveLength(1);
  });

  it('preserves first-occurrence order', () => {
    const a = errorWithFieldTree({ fieldName: 'a', kind: 'required' });
    const b = errorWithFieldTree({ fieldName: 'b', kind: 'required' });
    const c = errorWithFieldTree({ fieldName: 'c', kind: 'required' });

    expect(dedupeValidationErrorsByField([a, b, c])).toEqual([a, b, c]);
  });
});

describe('errorHasFocusableTarget', () => {
  it('is true when the error has a fieldTree exposing focusBoundControl', () => {
    expect(errorHasFocusableTarget(errorWithFieldTree())).toBe(true);
  });

  it('is false when the error has no fieldTree function at all', () => {
    expect(errorHasFocusableTarget({ kind: 'custom', message: 'x' })).toBe(
      false,
    );
  });

  it('is false when the resolved field state has no focusBoundControl method', () => {
    const error = errorWithFieldTree({ focusBoundControl: null });
    expect(errorHasFocusableTarget(error)).toBe(false);
  });

  it('is false when fieldTree() itself returns a falsy value', () => {
    const error = {
      kind: 'required',
      message: 'Required',
      fieldTree: () => null,
    } as unknown as ValidationError.WithFieldTree;

    expect(errorHasFocusableTarget(error)).toBe(false);
  });
});

describe('focusBoundControlFromError', () => {
  it('calls focusBoundControl() on the error field tree', () => {
    const focusSpy = vi.fn();
    const error = errorWithFieldTree({ focusBoundControl: focusSpy });

    focusBoundControlFromError(error);

    expect(focusSpy).toHaveBeenCalledOnce();
  });

  it('does nothing when the error has no focusable target', () => {
    // Would throw if it called through blindly, since there is no
    // `focusBoundControl` to call — this proves the two functions agree.
    const error = errorWithFieldTree({ focusBoundControl: null });

    expect(() => {
      focusBoundControlFromError(error);
    }).not.toThrow();
  });

  it('does nothing when the error has no fieldTree at all', () => {
    expect(() => {
      focusBoundControlFromError({ kind: 'custom', message: 'x' });
    }).not.toThrow();
  });
});

describe('toErrorSummaryEntry', () => {
  it('maps kind, resolved message, resolved field name, and canFocus onto one entry', () => {
    const error = errorWithFieldTree({
      kind: 'required',
      message: 'Email is required',
      fieldName: 'email',
    });

    const entry = toErrorSummaryEntry(error);

    expect(entry.kind).toBe('required');
    expect(entry.message).toBe('Email is required');
    expect(entry.fieldName).toBe('Email');
    expect(entry.canFocus).toBe(true);
  });

  it('sets canFocus to false for an error with no focusable target', () => {
    const error = errorWithFieldTree({ focusBoundControl: null });

    const entry = toErrorSummaryEntry(error);

    expect(entry.canFocus).toBe(false);
  });

  it('calling the returned focus() delegates to focusBoundControlFromError', () => {
    const focusSpy = vi.fn();
    const error = errorWithFieldTree({ focusBoundControl: focusSpy });

    const entry = toErrorSummaryEntry(error);
    entry.focus();

    expect(focusSpy).toHaveBeenCalledOnce();
  });

  it('uses a custom label resolver when provided', () => {
    const error = errorWithFieldTree({ fieldName: 'email' });

    const entry = toErrorSummaryEntry(
      error,
      undefined,
      undefined,
      () => 'E-mail',
    );

    expect(entry.fieldName).toBe('E-mail');
  });
});
