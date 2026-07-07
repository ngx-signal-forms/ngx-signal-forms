import type {
  AbstractControl,
  FormGroupDirective,
  NgForm,
} from '@angular/forms';
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

describe('NgxMatWarningAwareErrorStateMatcher', () => {
  const matcher = new NgxMatWarningAwareErrorStateMatcher();

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
