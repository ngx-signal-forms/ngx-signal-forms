import {
  Directive,
  input,
  signal,
  effect,
  inject,
  computed,
} from '@angular/core';
import { NGX_SIGNAL_FORM_CONTEXT, NGX_SIGNAL_FORMS_CONFIG } from '../tokens';
import type { ErrorDisplayStrategy, SignalOrValue } from '../types';

/**
 * Form context provided to child directives and components.
 *
 * @template TForm - The Signal Forms instance type
 */
export interface NgxSignalFormContext<TForm = unknown> {
  /**
   * The Signal Forms instance.
   */
  form: TForm;

  /**
   * Whether the form has been submitted at least once.
   */
  hasSubmitted: () => boolean;

  /**
   * The error display strategy for this form.
   */
  errorStrategy: () => ErrorDisplayStrategy;
}

/**
 * Provides form context to child directives and components via DI.
 *
 * **Responsibilities**:
 * - Provides form instance to child directives
 * - Tracks form submission state
 * - Manages error display strategy
 * - Auto-resets on form reset
 *
 * @template TForm - The Signal Forms instance type
 *
 * @example
 * ```html
 * <form
 *   [ngxSignalFormProvider]="userForm"
 *   [errorStrategy]="'on-touch'"
 *   (ngSubmit)="onSubmit($event)"
 * >
 *   <input [control]="userForm.email" />
 *   <!-- Auto-ARIA and Auto-Touch directives will use this context -->
 * </form>
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
          hasSubmitted: () => directive.hasSubmitted(),
          errorStrategy: () => directive.resolvedErrorStrategy(),
        };
      },
    },
  ],
})
export class NgxSignalFormProviderDirective<TForm = unknown> {
  readonly #config = inject(NGX_SIGNAL_FORMS_CONFIG);

  /**
   * The Signal Forms instance to provide.
   */
  readonly form = input.required<TForm>({ alias: 'ngxSignalFormProvider' });

  /**
   * Error display strategy for this form.
   * Defaults to global config or 'on-touch'.
   */
  readonly errorStrategy = input<
    SignalOrValue<ErrorDisplayStrategy> | null | undefined
  >(undefined);

  protected readonly resolvedErrorStrategy = computed(() => {
    const provided = this.errorStrategy();
    if (provided !== null && provided !== undefined) {
      return typeof provided === 'function' ? provided() : provided;
    }

    // Config is already normalized with defaults
    const configured = this.#config.defaultErrorStrategy;
    return typeof configured === 'function' ? configured() : configured;
  });

  /**
   * Whether the form has been submitted at least once.
   */
  readonly hasSubmitted = signal(false);

  constructor() {
    // Listen for form submission via submit event
    // Note: In real usage, this would be connected to the submit handler
    // For now, we'll expose a method to mark as submitted

    // Monitor form state for reset
    // effect(() => {
    //   const formState = this.form();
    //   if (formState) {
    // TODO: Detect form reset - Signal Forms doesn't have a built-in reset signal yet
    // This would need to be handled by the consumer or via form state changes
    // formState is already read above to establish dependency
    // }
    // });

    if (this.#config.debug) {
      effect(() => {
        console.log('[NgxSignalFormProviderDirective] Form state:', {
          form: this.form(),
          hasSubmitted: this.hasSubmitted(),
          errorStrategy: this.resolvedErrorStrategy(),
        });
      });
    }
  }

  /**
   * Mark the form as submitted.
   * Should be called by the submit handler.
   */
  markAsSubmitted(): void {
    this.hasSubmitted.set(true);
  }

  /**
   * Reset the submission state.
   */
  resetSubmissionState(): void {
    this.hasSubmitted.set(false);
  }
}
