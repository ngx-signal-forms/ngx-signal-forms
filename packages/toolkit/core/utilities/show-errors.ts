import { computed, type Signal } from '@angular/core';
import type {
  ErrorDisplayStrategy,
  ReactiveOrStatic,
  ResolvedErrorDisplayStrategy,
  SubmittedStatus,
} from '../types';
import { createDevWarnOnce } from './dev-warn-once';
import { shouldShowErrors } from './error-strategies';
import type { ErrorVisibilityState } from './field-state-types';
import { unwrapValue } from './unwrap-signal-or-value';

/**
 * Creates a reactive computed signal that determines if a form field's errors
 * should be shown to the user based on the error display strategy.
 *
 * This is the shared visibility-timing primitive: `createErrorState()`,
 * `NgxHeadlessErrorState`, `NgxHeadlessErrorSummary`,
 * `NgxSignalFormAutoAria`, `NgxFormFieldError`, and the
 * form-field wrapper all route their visibility decisions through
 * `shouldShowErrors()` (via this computed) so the when-to-show rule stays
 * identical across surfaces. Individual consumers may layer their own
 * short-circuits on top — the wrapper additionally suppresses output when
 * `isFieldHidden()` or the `errors` array is empty — but the underlying
 * strategy evaluation is not reimplemented anywhere. Add layer-specific
 * filters at the call site rather than forking this primitive.
 *
 * **Not the same as {@link shouldShowErrors}.** That function is a pure,
 * synchronous boolean predicate — no signals, no reactivity, for imperative
 * one-off checks. This one returns a `Signal<boolean>` that recomputes as
 * the field's `invalid()` / `touched()` state changes. The `create*` prefix
 * is deliberate: it is the toolkit's convention for signal factories
 * (`createErrorVisibility`, `createUniqueId`, `createCharacterCount`,
 * `createCascadingResolver`, …), which reads unambiguously next to
 * `shouldShowErrors`'s different name and different return type.
 *
 * ## Simplified Architecture (aligned with Angular Signal Forms)
 *
 * Angular's `submit()` helper calls `markAllAsTouched()`, which means `field.touched()`
 * becomes true for all fields after submission. This makes `submittedStatus` **optional**
 * for the default `'on-touch'` strategy - we just check `field.touched()`.
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
 * import { createShowErrorsComputed } from '@ngx-signal-forms/toolkit';
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
 *   protected readonly shouldShowErrors = createShowErrorsComputed(
 *     this.form.email,
 *     'on-touch'
 *   );
 * }
 * ```
 *
 * @example With on-submit strategy (needs submittedStatus)
 * ```typescript
 * protected readonly shouldShowErrors = createShowErrorsComputed(
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
 *
 * @public
 */
export function createShowErrorsComputed(
  field: ReactiveOrStatic<Partial<ErrorVisibilityState> | null | undefined>,
  strategy: ReactiveOrStatic<ErrorDisplayStrategy>,
  submittedStatus?: ReactiveOrStatic<SubmittedStatus | undefined>,
): Signal<boolean> {
  const warnOnce = createDevWarnOnce();

  return computed(() => {
    const fieldState = unwrapValue(field);
    const strategyValue = unwrapValue(strategy);

    // Angular 22's `FieldState` guarantees `invalid`/`touched` signals, so
    // the only shapes we defend against here are nullish (no field yet) and
    // caller-supplied partials where a signal may be absent.
    const isInvalid = fieldState?.invalid?.() ?? false;
    const isTouched = fieldState?.touched?.() ?? false;

    const resolvedStatus =
      submittedStatus === undefined ? undefined : unwrapValue(submittedStatus);

    // `'inherit'` is only meaningful at the user-facing boundary: it signals
    // "use the form-context / global-config default". By the time we reach
    // here we have no further context to consult, so fall back to
    // `'on-touch'` — that matches the historical behavior of the
    // now-removed `'inherit'` branch in `shouldShowErrors`. Call sites that
    // own a context should resolve `'inherit'` themselves via
    // `resolveErrorDisplayStrategy` / `resolveStrategyFromContext` before
    // passing the value in.
    const resolvedStrategy: ResolvedErrorDisplayStrategy =
      strategyValue === 'inherit' ? 'on-touch' : strategyValue;

    // `on-submit` requires an explicit submission status to fire. Previously
    // the helper fell back to `touched → 'submitted'`, which silently
    // defeated the strategy for standalone `createShowErrorsComputed()` /
    // `createErrorState()` consumers who forgot to wire `submittedStatus`.
    // Default to `'unsubmitted'` instead — errors won't surface until a
    // real status is supplied, and in dev mode we emit a one-shot console
    // warning to make the miswiring obvious.
    if (resolvedStrategy === 'on-submit' && resolvedStatus === undefined) {
      warnOnce(
        'warn',
        "[ngx-signal-forms] createShowErrorsComputed(): 'on-submit' strategy requires an explicit submittedStatus signal. " +
          "Without it, errors will never surface. Wire the status from NgxSignalForm ('ngxSignalForm') or pass submittedStatus explicitly.",
      );
    }

    const fallbackStatus = resolvedStatus ?? 'unsubmitted';

    return shouldShowErrors(
      isInvalid,
      isTouched,
      resolvedStrategy,
      fallbackStatus,
    );
  });
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
 *   createShowErrorsComputed(form.email, 'on-touch', submitted),
 *   createShowErrorsComputed(form.password, 'on-touch', submitted),
 *   createShowErrorsComputed(form.confirmPassword, 'on-touch', submitted)
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
 *   createShowErrorsComputed(form.username, strategy, submitted),
 *   createShowErrorsComputed(form.email, strategy, submitted)
 * ]);
 *
 * /// In template
 * <button [disabled]="hasVisibleErrors()">Submit</button>
 * ```
 *
 * @example Section-level validation
 * ```typescript
 * const showAddressErrors = combineShowErrors([
 *   createShowErrorsComputed(form.street, strategy, submitted),
 *   createShowErrorsComputed(form.city, strategy, submitted),
 *   createShowErrorsComputed(form.zipCode, strategy, submitted)
 * ]);
 *
 * const showPaymentErrors = combineShowErrors([
 *   createShowErrorsComputed(form.cardNumber, strategy, submitted),
 *   createShowErrorsComputed(form.cvv, strategy, submitted)
 * ]);
 * ```
 *
 * @example Custom error count
 * ```typescript
 * const errorSignals = [
 *   createShowErrorsComputed(form.field1, 'on-touch', submitted),
 *   createShowErrorsComputed(form.field2, 'on-touch', submitted),
 *   createShowErrorsComputed(form.field3, 'on-touch', submitted)
 * ];
 *
 * const hasErrors = combineShowErrors(errorSignals);
 * const errorCount = computed(() =>
 *   errorSignals.filter(signal => signal()).length
 * );
 * ```
 *
 * @see {@link createShowErrorsComputed} For creating individual error visibility signals
 */
export function combineShowErrors(
  showErrorsSignals: readonly Signal<boolean>[],
): Signal<boolean> {
  return computed(() => showErrorsSignals.some((signal) => signal()));
}
