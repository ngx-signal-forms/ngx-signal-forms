import {
  computed,
  Directive,
  effect,
  inject,
  input,
  signal,
  type Signal,
} from '@angular/core';
import type { FieldTree, SubmittedStatus } from '@angular/forms/signals';
import { NGX_SIGNAL_FORM_CONTEXT, NGX_SIGNAL_FORMS_CONFIG } from '../tokens';
import type { ErrorDisplayStrategy, ReactiveOrStatic } from '../types';

/**
 * Form context provided to child directives and components.
 */
export interface NgxSignalFormContext {
  /**
   * The Signal Forms instance (FieldTree).
   */
  form: FieldTree<unknown>;

  /**
   * Submission status signal tracking the complete submission lifecycle.
   *
   * **Values**:
   * - `'unsubmitted'` - Form has never been submitted
   * - `'submitting'` - Form is currently being submitted (async operation in progress)
   * - `'submitted'` - Form has been submitted at least once (persists across submissions)
   *
   * **Note**: This signal is automatically managed by watching Angular's `submitting()` signal.
   * The `'submitted'` state persists until the form is reset.
   */
  submittedStatus: Signal<SubmittedStatus>;

  /**
   * The error display strategy for this form.
   */
  errorStrategy: Signal<ErrorDisplayStrategy>;
}

/**
 * Provides form context to child directives and components via DI.
 *
 * **Automatically tracks submission lifecycle** by watching Angular's `submitting()` signal.
 *
 * **Automatically adds `novalidate` attribute** to prevent HTML5 validation UI from conflicting
 * with Angular validation display.
 *
 * **Responsibilities**:
 * - Provides form instance to child directives via DI
 * - Tracks submission lifecycle (unsubmitted → submitting → submitted)
 * - Manages error display strategy for the form
 * - Prevents browser validation UI by adding `novalidate` attribute
 *
 * **Key Features**:
 * - **Automatic Submission Tracking**: Detects submission completion via `submitting()` transitions
 * - **Persistent 'submitted' State**: Once submitted, stays 'submitted' until form reset
 * - **DI-based Context**: Provides form context without prop drilling
 * - **Strategy Management**: Centralizes error display strategy for child components
 * - **HTML5 Validation**: Automatically adds `novalidate` to prevent browser validation UI
 *
 * **Submission State Transitions**:
 * ```
 * unsubmitted → submitting (when submit() called)
 *            ↓
 *        submitted (after async operation completes)
 *            ↓
 *        submitting (on next submission)
 *            ↓
 *        submitted (stays in 'submitted' state)
 * ```
 *
 * @example Basic usage with Angular's submit() helper
 * ```typescript
 * import { submit } from '@angular/forms/signals';
 *
 * @Component({
 *   template: `
 *     <!-- novalidate is automatically added by the directive -->
 *     <form [ngxSignalForm]="userForm" (ngSubmit)="handleSubmit()">
 *       <input [field]="userForm.email" type="email" />
 *       <ngx-signal-form-error [field]="userForm.email" fieldName="email" />
 *       <button type="submit">Submit</button>
 *     </form>
 *   `
 * })
 * export class UserFormComponent {
 *   readonly #model = signal({ email: '' });
 *   protected readonly userForm = form(this.#model, emailSchema);
 *
 *   readonly #submitHandler = submit(this.userForm, async (formData) => {
 *     await this.api.save(formData().value());
 *     return null; // No server errors
 *   });
 *
 *   protected handleSubmit(): void {
 *     void this.#submitHandler();
 *     // Directive automatically tracks:
 *     // 1. submittedStatus = 'submitting' (during async operation)
 *     // 2. submittedStatus = 'submitted' (after completion)
 *   }
 * }
 * ```
 *
 * @example With on-submit error strategy
 * ```html
 * <!-- novalidate is automatically added -->
 * <form
 *   [ngxSignalForm]="userForm"
 *   [errorStrategy]="'on-submit'"
 *   (ngSubmit)="handleSubmit()"
 * >
 *   <input [field]="userForm.email" type="email" />
 *   <!-- Errors appear AFTER user clicks submit (not on blur) -->
 * </form>
 * ```
 *
 * @example Reset submission state
 * ```typescript
 * protected resetForm(): void {
 *   this.userForm().reset();  // Resets touched/dirty states
 *   this.#model.set({ email: '' });  // Reset data
 *   // Note: Provider's submittedStatus will reset to 'unsubmitted'
 *   // when form().reset() is called
 * }
 * ```
 */
@Directive({
  selector: '[ngxSignalForm]',
  exportAs: 'ngxSignalForm',
  // Listen to form submit attempts so we can reflect an attempted submission
  // even when the form is invalid (submit() callback won't run, and submitting()
  // never flips to true). We avoid @HostListener per project rules and use host.
  host: {
    '(ngSubmit)': 'onFormSubmit()',
    '[attr.novalidate]': '""',
  },
  providers: [
    {
      provide: NGX_SIGNAL_FORM_CONTEXT,
      useFactory: () => {
        const directive = inject(NgxSignalFormDirective);
        return {
          get form() {
            return directive.form();
          },
          submittedStatus: directive.submittedStatus,
          errorStrategy: directive.resolvedErrorStrategy,
        };
      },
    },
  ],
})
export class NgxSignalFormDirective {
  readonly #config = inject(NGX_SIGNAL_FORMS_CONFIG);

  /**
   * Tracks whether the form has ever been submitted.
   * Set to true when a submission completes (submitting goes true → false).
   * Reset to false when form().reset() is called.
   */
  readonly #hasEverSubmitted = signal(false);

  /**
   * Tracks whether the user has attempted to submit the form at least once.
   *
   * **Why This Matters**:
   * When a form is INVALID and the user clicks submit:
   * - Angular's `submit()` helper marks all fields as touched
   * - But it does NOT execute the callback (form is invalid)
   * - Therefore `submitting()` never becomes true
   * - Without this flag, `submittedStatus` would stay 'unsubmitted'
   * - Errors wouldn't show with 'on-submit' strategy
   *
   * **Use Cases**:
   * 1. **'on-submit' Error Strategy**: Shows errors after submit attempt, even when form is invalid
   * 2. **Multi-step Forms**: Display validation only after user tries to proceed
   * 3. **Clean Slate UX**: Keep form "pristine" visually until explicit submission attempt
   * 4. **Compliance Patterns**: Some UX guidelines require explicit submission before showing errors
   *
   * **Example Flow**:
   * ```
   * User fills invalid form → Clicks submit button
   * → submit() marks fields touched but doesn't run callback
   * → #submitAttempted = true (via onFormSubmit host handler)
   * → submittedStatus = 'submitted'
   * → 'on-submit' strategy reveals validation errors
   * ```
   */
  readonly #submitAttempted = signal(false);

  /**
   * The Signal Forms instance (FieldTree) to provide.
   */
  readonly form = input.required<FieldTree<unknown>>({
    alias: 'ngxSignalForm',
  });

  /**
   * Error display strategy for this form.
   * Overrides the global default for all fields in this form.
   */
  readonly errorStrategy = input<
    ReactiveOrStatic<ErrorDisplayStrategy> | null | undefined
  >(undefined);

  /**
   * Resolved error display strategy (form-level or global default).
   */
  protected readonly resolvedErrorStrategy = computed(() => {
    const provided = this.errorStrategy();
    if (provided !== null && provided !== undefined) {
      return typeof provided === 'function' ? provided() : provided;
    }

    const configured = this.#config.defaultErrorStrategy;
    return typeof configured === 'function' ? configured() : configured;
  });

  constructor() {
    // Watch for submission lifecycle transitions
    // When submitting goes true → false, it means submission completed
    let previousSubmitting = false;

    effect(() => {
      const currentSubmitting = this.form()().submitting();

      // Detect submission completion: was submitting, now not submitting
      if (previousSubmitting && !currentSubmitting) {
        this.#hasEverSubmitted.set(true);
      }

      // Detect form reset: touched() becomes false means reset() was called
      // Reset our submission tracking when the form is reset
      const formState = this.form()();
      if (
        typeof formState.touched === 'function' &&
        !formState.touched() &&
        (this.#hasEverSubmitted() || this.#submitAttempted())
      ) {
        // Form was reset, clear submission history
        this.#hasEverSubmitted.set(false);
        this.#submitAttempted.set(false);
      }

      previousSubmitting = currentSubmitting;
    });
  }

  /**
   * Submission status signal tracking the complete submission lifecycle.
   *
   * **State Machine**:
   * - `'unsubmitted'` → Form has never been submitted
   * - `'submitting'` → Form is currently being submitted (async operation)
   * - `'submitted'` → Form completed submission (persists until reset)
   *
   * **Automatic Tracking**:
   * - Detects `submit()` helper usage by watching `submitting()` signal
   * - Transitions to 'submitted' when async operation completes
   * - Resets to 'unsubmitted' when `form().reset()` is called
   *
   * **Usage with Error Strategies**:
   * - `'on-submit'`: Shows errors when submittedStatus !== 'unsubmitted'
   * - `'on-touch'`: Shows errors when touched OR submitted
   *
   * @example Accessing in child components
   * ```typescript
   * const context = inject(NGX_SIGNAL_FORM_CONTEXT);
   * const status = context.submittedStatus(); // 'unsubmitted' | 'submitting' | 'submitted'
   * ```
   */
  readonly submittedStatus = computed<SubmittedStatus>(() => {
    const isCurrentlySubmitting = this.form()().submitting();
    const wasSubmitted = this.#hasEverSubmitted();
    const wasAttempted = this.#submitAttempted();

    const result: SubmittedStatus = isCurrentlySubmitting
      ? 'submitting'
      : wasSubmitted || wasAttempted
        ? 'submitted'
        : 'unsubmitted';

    // DEBUG: Log submitted status computation
    if (
      (window as unknown as { __DEBUG_SHOW_ERRORS__?: boolean })
        .__DEBUG_SHOW_ERRORS__
    ) {
      console.log('[FormProvider] submittedStatus computed:', {
        isCurrentlySubmitting,
        wasSubmitted,
        wasAttempted,
        result,
      });
    }

    return result;
  });

  /**
   * Host handler for (ngSubmit) on the same form element.
   * Ensures that an attempted submission (even when invalid) transitions
   * the provider's submission state out of 'unsubmitted', enabling
   * 'on-submit' error strategies to reveal validation messages.
   */
  protected onFormSubmit(): void {
    // Mark that a submit was attempted at least once
    this.#submitAttempted.set(true);
  }
}
