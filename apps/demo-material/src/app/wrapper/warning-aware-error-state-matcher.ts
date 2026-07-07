import { Injectable } from '@angular/core';
import type {
  AbstractControl,
  FormGroupDirective,
  NgForm,
} from '@angular/forms';
import type { ValidationError } from '@angular/forms/signals';
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
 * `control.errors` (as surfaced by `InteropNgControl`) is a
 * `{ [kind]: value }` map — the same shape reactive forms uses — so this
 * matcher inspects the *keys* for any kind that {@link isBlockingError}
 * (the toolkit's canonical `warn:*` predicate) says is NOT a warning, and
 * only then falls through to the default touched/submitted timing check.
 *
 * Registered app-wide by `provideNgxMatForms()` / at component scope by
 * `provideNgxMatFormsForComponent()` — see `index.ts`.
 */
@Injectable()
export class NgxMatWarningAwareErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(
    control: AbstractControl | null,
    form: FormGroupDirective | NgForm | null,
  ): boolean {
    if (!control) {
      return false;
    }

    const errors = control.errors as Record<string, unknown> | null;
    const hasBlockingError =
      !!errors &&
      Object.keys(errors).some((kind) =>
        isBlockingError({ kind } as ValidationError),
      );
    if (!hasBlockingError) {
      return false;
    }

    return !!(control.touched || form?.submitted);
  }
}
