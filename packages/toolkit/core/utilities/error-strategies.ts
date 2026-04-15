import type { ErrorDisplayStrategy, SubmittedStatus } from '../types';

/**
 * Determines if errors should be shown immediately without creating a reactive signal.
 *
 * ## What does it do?
 * Performs a synchronous check to determine if form field errors should be displayed,
 * without the overhead of creating a computed signal. This is a lightweight helper
 * for non-reactive scenarios or one-time checks.
 *
 * ## When to use it?
 * Use `shouldShowErrors()` when you need to:
 * - Check error visibility in imperative code (event handlers, functions)
 * - Perform one-time validation checks without reactivity
 * - Implement custom logic that doesn't need automatic updates
 * - Reduce memory overhead when reactivity isn't needed
 *
 * **Use {@link showErrors} instead when you need reactive updates.**
 *
 * ## How does it work?
 * 1. Accepts unwrapped (static) field state, strategy, and submission status
 * 2. Converts `submittedStatus` to boolean (`!== 'unsubmitted'`)
 * 3. Immediately evaluates the strategy logic
 * 4. Returns a boolean result without creating signals or subscriptions
 *
 * @param isInvalid - Whether the field is currently invalid
 * @param isTouched - Whether the field has been touched (blurred)
 * @param strategy - The error display strategy
 * @param submittedStatus - Angular's submission status
 * @returns `true` if errors should be displayed
 *
 * @example Imperative validation check
 * ```typescript
 * function handleSave() {
 *   const field = form.email();
 *   const status: SubmittedStatus = form().submitting()
 *     ? 'submitting'
 *     : form().touched()
 *       ? 'submitted'
 *       : 'unsubmitted';
 *   const visible = shouldShowErrors(field.invalid(), field.touched(), 'on-touch', status);
 *
 *   if (visible) {
 *     displayErrors(field.errors());
 *   }
 * }
 * ```
 *
 * @see {@link showErrors} For reactive version that creates a computed signal
 * @see {@link ErrorDisplayStrategy} For available strategies
 */
export function shouldShowErrors(
  isInvalid: boolean,
  isTouched: boolean,
  strategy: ErrorDisplayStrategy,
  submittedStatus: SubmittedStatus,
): boolean {
  const hasSubmitted = submittedStatus !== 'unsubmitted';

  switch (strategy) {
    case 'immediate':
      return isInvalid;

    case 'on-touch':
      return isInvalid && isTouched;

    case 'on-submit':
      return isInvalid && hasSubmitted;

    case 'inherit':
      return isInvalid && isTouched;

    default:
      strategy satisfies never;
      return isInvalid && isTouched;
  }
}
