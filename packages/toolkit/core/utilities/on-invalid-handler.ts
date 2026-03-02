import type { FieldTree } from '@angular/forms/signals';
import { focusFirstInvalid } from './focus-first-invalid';

/**
 * Options for configuring the `onInvalid` handler.
 */
export interface OnInvalidHandlerOptions {
  /**
   * Whether to focus the first invalid field on invalid submission.
   * @default true
   */
  focusFirstInvalid?: boolean;

  /**
   * Additional callback to run when the form is invalid on submission.
   * Called after focus (if enabled).
   */
  afterInvalid?: (field: FieldTree<unknown>) => void;
}

/**
 * Creates an `onInvalid` handler for `FormSubmitOptions.onInvalid`.
 *
 * By default, focuses the first invalid field for WCAG-compliant form error handling.
 * Can be customized with additional callbacks or disabled focus behavior.
 *
 * @param options Configuration for the handler
 * @returns A function suitable for `FormSubmitOptions.onInvalid`
 *
 * @example Default (focus first invalid)
 * ```typescript
 * const myForm = form(this.#data, {
 *   submission: {
 *     action: async (field) => { ... },
 *     onInvalid: createOnInvalidHandler(),
 *   },
 * });
 * ```
 *
 * @example With additional callback
 * ```typescript
 * const myForm = form(this.#data, {
 *   submission: {
 *     action: async (field) => { ... },
 *     onInvalid: createOnInvalidHandler({
 *       afterInvalid: () => this.showErrorNotification(),
 *     }),
 *   },
 * });
 * ```
 *
 * @example Without focus
 * ```typescript
 * const myForm = form(this.#data, {
 *   submission: {
 *     action: async (field) => { ... },
 *     onInvalid: createOnInvalidHandler({ focusFirstInvalid: false }),
 *   },
 * });
 * ```
 *
 * @public
 */
export function createOnInvalidHandler(
  options: OnInvalidHandlerOptions = {},
): (field: FieldTree<unknown>) => void {
  const { focusFirstInvalid: shouldFocus = true, afterInvalid } = options;

  return (field: FieldTree<unknown>) => {
    if (shouldFocus) {
      focusFirstInvalid(field);
    }

    afterInvalid?.(field);
  };
}
