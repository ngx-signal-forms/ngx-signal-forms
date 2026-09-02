import { signal } from '@angular/core';
import type {
  AbstractControl,
  FormGroupDirective,
  NgForm,
} from '@angular/forms';
import {
  form as createForm,
  required,
  validate,
  type Field,
} from '@angular/forms/signals';
import { TestBed } from '@angular/core/testing';
import { warningError } from '@ngx-signal-forms/toolkit';
import { describe, expect, it } from 'vitest';
import { NgxMatWarningAwareErrorStateMatcher } from './warning-aware-error-state-matcher';

/**
 * Minimal shape the matcher actually reads off `control` / `form` — mirrors
 * what `InteropNgControl` (Angular Signal Forms' `NgControl` bridge) and
 * Material's `_ErrorStateTracker` pass at runtime, without depending on the
 * full `AbstractControl` class.
 */
function fakeControl(
  overrides: Partial<Pick<AbstractControl, 'errors' | 'touched'>>,
): AbstractControl {
  return {
    errors: null,
    touched: false,
    ...overrides,
  } as AbstractControl;
}

function createSignalField({
  value = '',
  blocking = false,
  warning = false,
  touched = false,
}: {
  value?: string;
  blocking?: boolean;
  warning?: boolean;
  touched?: boolean;
} = {}): Field<unknown> {
  const fields = TestBed.runInInjectionContext(() =>
    createForm(signal({ value }), (path) => {
      if (blocking) {
        required(path.value);
      }
      if (warning) {
        validate(path.value, () => warningError('test', 'Advisory warning'));
      }
    }),
  );

  if (touched) {
    fields.value().markAsTouched();
  }

  return fields.value;
}

describe('NgxMatWarningAwareErrorStateMatcher', () => {
  const matcher = new NgxMatWarningAwareErrorStateMatcher();

  describe('Signal Forms', () => {
    it('returns false for a null field', () => {
      expect(matcher.isSignalErrorState(null)).toBe(false);
    });

    it('returns false when there are no errors', () => {
      const field = createSignalField({ value: 'valid', touched: true });
      expect(matcher.isSignalErrorState(field)).toBe(false);
    });

    it('returns false for a warning-only field, even when touched', () => {
      const field = createSignalField({
        value: 'valid',
        warning: true,
        touched: true,
      });
      expect(matcher.isSignalErrorState(field)).toBe(false);
    });

    it('returns false for an untouched field with a blocking error', () => {
      const field = createSignalField({ blocking: true });
      expect(matcher.isSignalErrorState(field)).toBe(false);
    });

    it('returns true for a touched field with a blocking error', () => {
      const field = createSignalField({ blocking: true, touched: true });
      expect(matcher.isSignalErrorState(field)).toBe(true);
    });

    it('ignores a warning alongside a touched blocking error', () => {
      const field = createSignalField({
        blocking: true,
        warning: true,
        touched: true,
      });
      expect(matcher.isSignalErrorState(field)).toBe(true);
    });
  });

  it('returns false for a null control', () => {
    expect(matcher.isErrorState(null, null)).toBe(false);
  });

  it('returns false when there are no errors at all', () => {
    const control = fakeControl({ errors: null, touched: true });
    expect(matcher.isErrorState(control, null)).toBe(false);
  });

  it('returns false for a warning-only control, even when touched', () => {
    const control = fakeControl({
      errors: { 'warn:short-name': true },
      touched: true,
    });
    expect(matcher.isErrorState(control, null)).toBe(false);
  });

  it('returns false for a blocking-error control that is not yet touched/submitted', () => {
    const control = fakeControl({
      errors: { required: true },
      touched: false,
    });
    expect(matcher.isErrorState(control, null)).toBe(false);
  });

  it('returns true for a blocking-error control that is touched', () => {
    const control = fakeControl({
      errors: { required: true },
      touched: true,
    });
    expect(matcher.isErrorState(control, null)).toBe(true);
  });

  it('returns true for a blocking-error control when the parent form was submitted', () => {
    const control = fakeControl({
      errors: { required: true },
      touched: false,
    });
    const form = { submitted: true } as FormGroupDirective | NgForm;
    expect(matcher.isErrorState(control, form)).toBe(true);
  });

  it('ignores warnings alongside a blocking error and still reports true once touched', () => {
    const control = fakeControl({
      errors: { required: true, 'warn:short-name': true },
      touched: true,
    });
    expect(matcher.isErrorState(control, null)).toBe(true);
  });
});
