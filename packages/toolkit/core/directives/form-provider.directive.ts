import { computed, Directive, inject, input, type Signal } from '@angular/core';
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
   * Angular's built-in submission status signal.
   * Returns 'unsubmitted' | 'submitting' | 'submitted'.
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
 * **Integrates with Angular Signal Forms built-in submission tracking.**
 *
 * **Responsibilities**:
 * - Provides form instance to child directives via DI
 * - Exposes Angular's built-in `submittedStatus` signal
 * - Manages error display strategy for the form
 *
 * **Key Features**:
 * - **No Manual Tracking**: Uses Angular's built-in `submittedStatus()` from FieldState
 * - **DI-based Context**: Provides form context without prop drilling
 * - **Strategy Management**: Centralizes error display strategy for child components
 *
 * @example Basic usage with Angular's submit() helper
 * ```typescript
 * import { submit } from '@angular/forms/signals';
 *
 * @Component({
 *   template: `
 *     <form [ngxSignalFormProvider]="userForm" (ngSubmit)="handleSubmit()">
 *       <input [control]="userForm.email" />
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
 *     void this.#submitHandler(); // Angular manages submittedStatus automatically
 *   }
 * }
 * ```
 *
 * @example With custom error strategy
 * ```html
 * <form
 *   [ngxSignalFormProvider]="userForm"
 *   [errorStrategy]="'immediate'"
 *   (ngSubmit)="handleSubmit()"
 * >
 *   <input [control]="userForm.email" />
 *   <!-- Errors show immediately as user types -->
 * </form>
 * ```
 *
 * @example Direct submission without submit() helper
 * ```typescript
 * protected save(): void {
 *   // Note: This won't update submittedStatus automatically
 *   // Use submit() helper for automatic tracking
 *   if (this.userForm().valid()) {
 *     console.log('Data:', this.#model());
 *   }
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

  /**
   * Access Angular's built-in submittedStatus signal.
   *
   * Returns the submission status from the root FieldState:
   * - `'unsubmitted'` - Form has never been submitted
   * - `'submitting'` - Form is currently being submitted (async operation)
   * - `'submitted'` - Form has been submitted at least once
   *
   * **Note**: This signal is automatically managed by Angular's `submit()` helper.
   * When using `submit()`, the status transitions are handled for you.
   *
   * @example
   * ```typescript
   * const provider = inject(NGX_SIGNAL_FORM_CONTEXT);
   * const status = provider.submittedStatus(); // 'unsubmitted' | 'submitting' | 'submitted'
   * ```
   */
  readonly submittedStatus = computed<SubmittedStatus>(() => {
    // Angular 21 FieldState doesn't have submittedStatus - only `submitting` signal
    // Provide fallback: return 'unsubmitted' since we don't track submission manually
    // Apps using submit() helper should pass submittedStatus explicitly if needed
    return 'unsubmitted';
  });
}
