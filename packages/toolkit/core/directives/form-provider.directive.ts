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
 * ⚠️ **CRITICAL: Always include `novalidate` on the form element.**
 * Signal Forms doesn't auto-disable HTML5 validation like Reactive Forms does.
 * Without `novalidate`, browser validation bubbles will conflict with Angular error display.
 *
 * **Responsibilities**:
 * - Provides form instance to child directives via DI
 * - Tracks submission lifecycle (unsubmitted → submitting → submitted)
 * - Manages error display strategy for the form
 *
 * **Key Features**:
 * - **Automatic Submission Tracking**: Detects submission completion via `submitting()` transitions
 * - **Persistent 'submitted' State**: Once submitted, stays 'submitted' until form reset
 * - **DI-based Context**: Provides form context without prop drilling
 * - **Strategy Management**: Centralizes error display strategy for child components
 * - **HTML5 Validation**: Requires `novalidate` to prevent conflicting browser UI
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
 *     <!-- ✅ ALWAYS include novalidate -->
 *     <form [ngxSignalFormProvider]="userForm" (ngSubmit)="handleSubmit()" novalidate>
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
 * <!-- ✅ Errors only show after form submission -->
 * <form
 *   [ngxSignalFormProvider]="userForm"
 *   [errorStrategy]="'on-submit'"
 *   (ngSubmit)="handleSubmit()"
 *   novalidate
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
  selector: '[ngxSignalFormProvider]',
  providers: [
    {
      provide: NGX_SIGNAL_FORM_CONTEXT,
      useFactory: () => {
        const directive = inject(NgxSignalFormProviderDirective);
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
export class NgxSignalFormProviderDirective {
  readonly #config = inject(NGX_SIGNAL_FORMS_CONFIG);

  /**
   * Tracks whether the form has ever been submitted.
   * Set to true when a submission completes (submitting goes true → false).
   * Reset to false when form().reset() is called.
   */
  readonly #hasEverSubmitted = signal(false);

  /**
   * The Signal Forms instance (FieldTree) to provide.
   */
  readonly form = input.required<FieldTree<unknown>>({
    alias: 'ngxSignalFormProvider',
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
        this.#hasEverSubmitted()
      ) {
        // Form was reset, clear submission history
        this.#hasEverSubmitted.set(false);
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

    if (isCurrentlySubmitting) return 'submitting';
    if (wasSubmitted) return 'submitted';
    return 'unsubmitted';
  });
}
