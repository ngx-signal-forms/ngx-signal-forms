import { computed, type Signal } from '@angular/core';
import type {
  ErrorDisplayStrategy,
  ReactiveOrStatic,
  SubmittedStatus,
} from '../types';
import { shouldShowErrors } from './error-strategies';
import type { ErrorVisibilityState } from './field-state-types';
import { unwrapValue } from './unwrap-signal-or-value';

/**
 * Creates a reactive computed signal that determines if a form field's errors should
 * be shown to the user based on the error display strategy.
 *
 * This is the shared visibility-timing primitive: `createErrorState()`,
 * `NgxHeadlessErrorStateDirective`, `NgxHeadlessErrorSummaryDirective`,
 * `NgxSignalFormAutoAriaDirective`, `NgxFormFieldErrorComponent`, and the
 * form-field wrapper all route their visibility decisions through
 * `shouldShowErrors()` (via this computed) so the when-to-show rule stays
 * identical across surfaces. Individual consumers may layer their own
 * short-circuits on top — the wrapper additionally suppresses output when
 * `isFieldHidden()` or the `errors` array is empty — but the underlying
 * strategy evaluation is not reimplemented anywhere. Add layer-specific
 * filters at the call site rather than forking this primitive.
 *
 * ## Simplified Architecture (aligned with Angular Signal Forms)
 *
 * Angular's `submit()` helper calls `markAllAsTouched()`, which means `field.touched()`
 * becomes true for all fields after submission. This makes `submittedStatus` **optional**
 * for the default `'on-touch'` strategy - we just check `field.touched()`.
 *
 * ## When to use it?
 * Use `showErrors()` when you need to:
 * - Implement error visibility logic for form fields
 * - Control when validation errors appear based on user interaction
 *
 * ## How does it work?
 * 1. Accepts field state, error display strategy, and optional submission status
 * 2. Evaluates whether errors should be shown based on the strategy:
 *    - `'immediate'`: Errors shown as soon as field is invalid
 *    - `'on-touch'`: Errors shown after blur or submit (WCAG recommended) - **default**
 *    - `'on-submit'`: Errors shown only after form submission
 * 3. Returns a computed signal that updates when field state changes
 *
 * @param field - The form field state (FieldTree from Angular Signal Forms)
 * @param strategy - The error display strategy (defaults to 'on-touch')
 * @param submittedStatus - Optional for `'on-touch'` and `'immediate'`.
 *   **Required** for `'on-submit'`: without it the helper defaults to
 *   `'unsubmitted'` and errors will never surface. In dev mode a one-shot
 *   `console.warn` is emitted to flag the miswiring.
 * @returns A computed signal returning `true` when errors should be displayed
 *
 * @example Simple usage (recommended - no submittedStatus needed)
 * ```typescript
 * import { showErrors } from '@ngx-signal-forms/toolkit';
 *
 * @Component({
 *   template: `
 *     @if (shouldShowErrors()) {
 *       <span>{{ form.email().errors()[0].message }}</span>
 *     }
 *   `
 * })
 * class MyComponent {
 *   readonly #model = signal({ email: '' });
 *   protected readonly form = form(this.#model, emailSchema);
 *
 *   // Simple! Angular's submit() marks fields touched, so this just works.
 *   protected readonly shouldShowErrors = showErrors(
 *     this.form.email,
 *     'on-touch'
 *   );
 * }
 * ```
 *
 * @example With on-submit strategy (needs submittedStatus)
 * ```typescript
 * protected readonly shouldShowErrors = showErrors(
 *   this.form.email,
 *   'on-submit',
 *   computed<SubmittedStatus>(() => {
 *     const state = this.form();
 *     if (state.submitting()) return 'submitting';
 *     return state.touched() ? 'submitted' : 'unsubmitted';
 *   })
 * );
 * ```
 *
 * @see {@link combineShowErrors} For combining multiple error signals
 */
export function showErrors(
  field: ReactiveOrStatic<Partial<ErrorVisibilityState> | null | undefined>,
  strategy: ReactiveOrStatic<ErrorDisplayStrategy>,
  submittedStatus?: ReactiveOrStatic<SubmittedStatus | undefined>,
): Signal<boolean> {
  return createShowErrorsComputed(field, strategy, submittedStatus);
}

/**
 * Creates a reactive visibility-timing computed for a `FieldState`.
 *
 * This is the single extraction point behind `showErrors()`, the wrapper
 * component's `shouldShowErrors`, `NgxSignalFormAutoAriaDirective`, and
 * `NgxFormFieldErrorComponent`. Each of those used to build its own
 * `computed(() => shouldShowErrors(field.invalid(), field.touched(), strategy, status))`
 * inline — consolidating here means visibility timing cannot drift between
 * them.
 *
 * **When to use directly:** internal toolkit code that already owns a
 * `FieldState` signal and wants the same visibility rules without routing
 * through `showErrors()`'s type-wide `ErrorVisibilityState` parameter.
 *
 * **When to use `showErrors()` instead:** public callers that want the
 * documented entry point and may pass partial shapes.
 *
 * @param field Reactive or static field state. `null`/`undefined` shapes
 *   short-circuit to `false`.
 * @param strategy Reactive or static `ErrorDisplayStrategy`.
 * @param submittedStatus Reactive or static submission status. **Required**
 *   for `'on-submit'` strategy — without it the helper defaults to
 *   `'unsubmitted'` and errors will never surface. A one-shot
 *   `console.warn` is emitted in dev mode (`ngDevMode`) when the miswiring
 *   is detected.
 * @returns A computed `Signal<boolean>` that is `true` when the strategy
 *   says errors should be visible.
 *
 * @public
 */
export function createShowErrorsComputed(
  field: ReactiveOrStatic<Partial<ErrorVisibilityState> | null | undefined>,
  strategy: ReactiveOrStatic<ErrorDisplayStrategy>,
  submittedStatus?: ReactiveOrStatic<SubmittedStatus | undefined>,
): Signal<boolean> {
  return computeShowErrorsInternal(field, strategy, submittedStatus);
}

/**
 * Combines multiple error visibility signals into a single signal.
 *
 * ## What does it do?
 * Creates a computed signal that returns `true` if ANY of the provided error
 * visibility signals are `true`. This is useful for showing aggregate error
 * states, form-level validation, or section-level error indicators.
 *
 * ## When to use it?
 * Use `combineShowErrors()` when you need to:
 * - Show form-level error indicator if any field has errors
 * - Disable submit button when any field should show errors
 * - Display section-level validation status (e.g., "Address has errors")
 * - Implement custom error aggregation logic
 *
 * ## How does it work?
 * 1. Accepts an array of error visibility signals
 * 2. Creates a computed signal that checks all inputs
 * 3. Returns `true` if ANY signal is `true` (logical OR operation)
 * 4. Updates automatically when any input signal changes
 *
 * @param showErrorsSignals - Array of error visibility signals to combine
 * @returns A computed signal that is `true` if any input signal is `true`
 *
 * @example Form-level error indicator
 * ```typescript
 * const showAnyFormErrors = combineShowErrors([
 *   showErrors(form.email, 'on-touch', submitted),
 *   showErrors(form.password, 'on-touch', submitted),
 *   showErrors(form.confirmPassword, 'on-touch', submitted)
 * ]);
 *
 * /// Use in template
 * @if (showAnyFormErrors()) {
 *   <div class="form-error-banner">
 *     Please fix the errors below before submitting
 *   </div>
 * }
 * ```
 *
 * @example Disable submit button
 * ```typescript
 * const hasVisibleErrors = combineShowErrors([
 *   showErrors(form.username, strategy, submitted),
 *   showErrors(form.email, strategy, submitted)
 * ]);
 *
 * /// In template
 * <button [disabled]="hasVisibleErrors()">Submit</button>
 * ```
 *
 * @example Section-level validation
 * ```typescript
 * const showAddressErrors = combineShowErrors([
 *   showErrors(form.street, strategy, submitted),
 *   showErrors(form.city, strategy, submitted),
 *   showErrors(form.zipCode, strategy, submitted)
 * ]);
 *
 * const showPaymentErrors = combineShowErrors([
 *   showErrors(form.cardNumber, strategy, submitted),
 *   showErrors(form.cvv, strategy, submitted)
 * ]);
 * ```
 *
 * @example Custom error count
 * ```typescript
 * const errorSignals = [
 *   showErrors(form.field1, 'on-touch', submitted),
 *   showErrors(form.field2, 'on-touch', submitted),
 *   showErrors(form.field3, 'on-touch', submitted)
 * ];
 *
 * const hasErrors = combineShowErrors(errorSignals);
 * const errorCount = computed(() =>
 *   errorSignals.filter(signal => signal()).length
 * );
 * ```
 *
 * @see {@link showErrors} For creating individual error visibility signals
 */
export function combineShowErrors(
  showErrorsSignals: readonly Signal<boolean>[],
): Signal<boolean> {
  return computed(() => showErrorsSignals.some((signal) => signal()));
}

function computeShowErrorsInternal(
  field: ReactiveOrStatic<Partial<ErrorVisibilityState> | null | undefined>,
  strategy: ReactiveOrStatic<ErrorDisplayStrategy>,
  submittedStatus?: ReactiveOrStatic<SubmittedStatus | undefined>,
): Signal<boolean> {
  let warnedMissingStatus = false;

  return computed(() => {
    const fieldState = unwrapValue(field);
    const strategyValue = unwrapValue(strategy);

    // Angular 21.2's `FieldState` guarantees `invalid`/`touched` signals, so
    // the only shapes we defend against here are nullish (no field yet) and
    // caller-supplied partials where a signal may be absent.
    const isInvalid = fieldState?.invalid?.() ?? false;
    const isTouched = fieldState?.touched?.() ?? false;

    const resolvedStatus =
      submittedStatus === undefined ? undefined : unwrapValue(submittedStatus);

    // `on-submit` requires an explicit submission status to fire. Previously
    // the helper fell back to `touched → 'submitted'`, which silently
    // defeated the strategy for standalone `showErrors()` / `createErrorState()`
    // consumers who forgot to wire `submittedStatus`. Default to
    // `'unsubmitted'` instead — errors won't surface until a real status is
    // supplied, and in dev mode we emit a one-shot console warning to make
    // the miswiring obvious.
    if (
      (typeof ngDevMode === 'undefined' || ngDevMode) &&
      strategyValue === 'on-submit' &&
      resolvedStatus === undefined &&
      !warnedMissingStatus
    ) {
      warnedMissingStatus = true;
      // oxlint-disable-next-line no-console -- dev-only diagnostic
      console.warn(
        "[ngx-signal-forms] showErrors(): 'on-submit' strategy requires an explicit submittedStatus signal. " +
          "Without it, errors will never surface. Wire the status from NgxSignalFormDirective ('ngxSignalForm') or pass submittedStatus explicitly.",
      );
    }

    const fallbackStatus = resolvedStatus ?? 'unsubmitted';

    return shouldShowErrors(
      isInvalid,
      isTouched,
      strategyValue,
      fallbackStatus,
    );
  });
}
