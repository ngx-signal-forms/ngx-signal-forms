import { Injectable } from '@angular/core';
import type {
  AbstractControl,
  FormGroupDirective,
  NgForm,
} from '@angular/forms';
import type { Field, ValidationError } from '@angular/forms/signals';
import { ErrorStateMatcher } from '@angular/material/core';
import { isBlockingError } from '@ngx-signal-forms/toolkit';

/**
 * Warning-aware replacement for Material's default `ErrorStateMatcher`.
 *
 * The default matcher (`invalid && (touched || form.submitted)`) treats
 * *any* validation result as an error, including the toolkit's non-blocking
 * `warn:*` results — Angular Signal Forms' `InteropNgControl` flips
 * `invalid` to `true` for warnings too (they're ordinary `ValidationError`s
 * under the hood). Left unpatched, a warning-only field gets
 * `aria-invalid="true"` and full `mat-form-field-invalid` styling on
 * `matInput` / `mat-select`, contradicting the toolkit's own
 * `shouldShowErrors()` / `shouldShowWarnings()` distinction and the "gentle
 * warning, not a blocker" UX the reference form advertises.
 *
 * Material 22.0.5+ evaluates controls bound with `[formField]` through
 * `isSignalErrorState`, passing the native Signal Forms {@link Field}. The
 * legacy `isErrorState` path remains for reactive and template-driven forms.
 * Both paths use {@link isBlockingError} so `warn:*` results never produce
 * Material's invalid styling or `aria-invalid="true"`.
 *
 * Registered app-wide by `provideNgxMatForms()` / at component scope by
 * `provideNgxMatFormsForComponent()` — see `index.ts`.
 */
@Injectable()
export class NgxMatWarningAwareErrorStateMatcher implements ErrorStateMatcher {
  isSignalErrorState(field: Field<unknown> | null): boolean {
    if (!field) {
      return false;
    }

    const state = field();
    return (
      state.touched() &&
      state
        .errors()
        .some((error: Readonly<ValidationError>) => isBlockingError(error))
    );
  }

  isErrorState(
    control: AbstractControl | null,
    form: FormGroupDirective | NgForm | null,
  ): boolean {
    if (!control) {
      return false;
    }

    const errors = control.errors;
    const hasBlockingError =
      !!errors && Object.keys(errors).some((kind) => isBlockingError({ kind }));
    if (!hasBlockingError) {
      return false;
    }

    return !!(control.touched || form?.submitted);
  }
}
