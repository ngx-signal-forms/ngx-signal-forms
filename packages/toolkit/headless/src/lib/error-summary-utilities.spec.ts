import type { ValidationError } from '@angular/forms/signals';
import { humanizeFieldPath } from '@ngx-signal-forms/toolkit/core';
import { describe, expect, it, vi } from 'vitest';
import {
  dedupeValidationErrorsByField,
  errorHasFocusableTarget,
  toErrorSummaryEntry,
} from './error-summary-utilities';

/**
 * Direct unit tests for the error-summary mapping utilities, split out of
 * `utilities.ts` in issue #354 (headless module split in #512/#545).
 * Field-name resolution and focus delegation are steps inside
 * `toErrorSummaryEntry`, so they are covered through it.
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

    // `toBe`, not `toEqual`: proves the survivor is the SAME object as
    // `first` (the actual "kept the first occurrence" claim), not merely a
    // structurally-equal copy that could have come from `second`.
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(first);
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

  it('calling the returned focus() calls focusBoundControl() on the field tree', () => {
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

describe('ErrorSummaryEntryData.key', () => {
  const sameLabel = (): string => 'Street';

  it('differs for two fields that share a label, kind and message', () => {
    // The key is the `@for` track key. A label-based key would collide here.
    const first = toErrorSummaryEntry(
      errorWithFieldTree({ fieldName: 'ngf-0.rows.0.street' }),
      undefined,
      undefined,
      sameLabel,
    );
    const second = toErrorSummaryEntry(
      errorWithFieldTree({ fieldName: 'ngf-0.rows.1.street' }),
      undefined,
      undefined,
      sameLabel,
    );

    expect(first.fieldName).toBe(second.fieldName);
    expect(first.key).not.toBe(second.key);
  });

  it('stays the same when the same error is mapped again on a later render', () => {
    const error = errorWithFieldTree({ fieldName: 'ngf-0.email' });

    expect(toErrorSummaryEntry(error).key).toBe(toErrorSummaryEntry(error).key);
  });

  it('changes with the message, because one field can keep two errors of one kind', () => {
    // Dedupe keeps both of these, so their keys must differ.
    const required = errorWithFieldTree({ message: 'Required' });
    const format = errorWithFieldTree({ message: 'Invalid format' });

    expect(dedupeValidationErrorsByField([required, format])).toHaveLength(2);
    expect(toErrorSummaryEntry(required).key).not.toBe(
      toErrorSummaryEntry(format).key,
    );
  });

  it('never matches a bound field, even one with an empty name', () => {
    const unbound: ValidationError = { kind: 'required', message: 'Required' };
    const emptyName = errorWithFieldTree({ fieldName: '' });

    expect(toErrorSummaryEntry(unbound).key).not.toBe(
      toErrorSummaryEntry(emptyName).key,
    );
  });

  it('keeps the name, kind and message apart when they contain separators', () => {
    // A plain `name::kind::message` join would make these two identical.
    const a = errorWithFieldTree({ fieldName: 'a::b', kind: 'c' });
    const b = errorWithFieldTree({ fieldName: 'a', kind: 'b::c' });

    expect(toErrorSummaryEntry(a).key).not.toBe(toErrorSummaryEntry(b).key);
  });
});

describe('toErrorSummaryEntry focus()', () => {
  it('calls focusBoundControl() on the error field tree', () => {
    const focusSpy = vi.fn();
    const error = errorWithFieldTree({ focusBoundControl: focusSpy });

    toErrorSummaryEntry(error).focus();

    expect(focusSpy).toHaveBeenCalledOnce();
  });

  it('does nothing when the error has no focusable target', () => {
    // `focusBoundControl` here is a non-function truthy value, not merely
    // absent: `?.()` optional chaining alone would NOT protect a blind call
    // against this (it only guards a nullish callee, not a non-callable
    // one) — that call would throw "focusBoundControl is not a function".
    // Not throwing here proves `focus()` actually checks
    // `errorHasFocusableTarget` first, agreeing with it, rather than calling
    // through unconditionally.
    const error = {
      kind: 'required',
      message: 'Required',
      fieldTree: () => ({
        name: () => 'email',
        focusBoundControl: 'not-a-function',
      }),
    } as unknown as ValidationError.WithFieldTree;

    expect(() => {
      toErrorSummaryEntry(error).focus();
    }).not.toThrow();
  });

  it('does nothing when the error has no fieldTree at all', () => {
    expect(() => {
      toErrorSummaryEntry({ kind: 'custom', message: 'x' }).focus();
    }).not.toThrow();
  });
});

function fieldNameOf(
  error: ValidationError,
  resolver?: (path: string) => string,
): string {
  return toErrorSummaryEntry(error, undefined, undefined, resolver).fieldName;
}

describe('toErrorSummaryEntry field name', () => {
  it('should strip Angular internal form prefixes and humanize nested paths', () => {
    const error = {
      kind: 'required',
      message: 'Postal code is required',
      fieldTree: () => ({
        name: () => 'ng.form0.address.postalCode',
      }),
    } as ValidationError;

    expect(fieldNameOf(error)).toBe('Address / Postal code');
  });

  it('should humanize fallback kinds when no field tree is available', () => {
    expect(fieldNameOf({ kind: 'passwordMismatch' })).toBe('Password mismatch');
  });

  it('should use a custom resolver when provided', () => {
    const dutchLabels: Record<string, string> = {
      'address.postalCode': 'Postcode',
      contactEmail: 'E-mailadres',
    };
    const resolver = (path: string) =>
      dutchLabels[path] ?? humanizeFieldPath(path);

    const error = {
      kind: 'required',
      message: 'required',
      fieldTree: () => ({
        name: () => 'ng.form0.address.postalCode',
      }),
    } as ValidationError;

    expect(fieldNameOf(error, resolver)).toBe('Postcode');
  });

  it('should fall back to humanizeFieldPath for unmapped paths in custom resolver', () => {
    const resolver = (path: string) => {
      const map: Record<string, string> = { email: 'E-mail' };
      return map[path] ?? humanizeFieldPath(path);
    };

    const error = {
      kind: 'required',
      message: 'required',
      fieldTree: () => ({
        name: () => 'ng.form0.address.street',
      }),
    } as ValidationError;

    expect(fieldNameOf(error, resolver)).toBe('Address / Street');
  });

  it('should pass the kind to the resolver when no fieldTree exists', () => {
    const resolver = (path: string) =>
      path === 'passwordMismatch' ? 'Wachtwoord mismatch' : path;

    expect(fieldNameOf({ kind: 'passwordMismatch' }, resolver)).toBe(
      'Wachtwoord mismatch',
    );
  });
});
