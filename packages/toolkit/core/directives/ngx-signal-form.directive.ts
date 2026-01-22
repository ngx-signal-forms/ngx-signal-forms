import {
  computed,
  Directive,
  effect,
  inject,
  input,
  signal,
  type Signal,
} from '@angular/core';
import type { FieldTree } from '@angular/forms/signals';
import { NGX_SIGNAL_FORM_CONTEXT, NGX_SIGNAL_FORMS_CONFIG } from '../tokens';
import type {
  ErrorDisplayStrategy,
  ReactiveOrStatic,
  SubmittedStatus,
} from '../types';

/**
 * Form context provided to child directives and components.
 *
 * Provides access to the Angular Signal Forms instance and error display configuration.
 * Child components can inject this context to access form state without prop drilling.
 */
export interface NgxSignalFormContext {
  /**
   * The Signal Forms instance (FieldTree).
   */
  form: FieldTree<unknown>;

  /**
   * Derived submission status based on Angular's native signals.
   *
   * **Values**:
   * - `'unsubmitted'` - Form hasn't been submitted yet
   * - `'submitting'` - Form is currently being submitted (`submitting()` is true)
   * - `'submitted'` - Form has completed at least one submission attempt
   *
   * This is derived from Angular's `submitting()` signal by tracking
   * submit lifecycle transitions. Resets to `'unsubmitted'` when `form.reset()`
   * is called (detected via `touched()` becoming false).
   */
  submittedStatus: Signal<SubmittedStatus>;

  /**
   * The error display strategy for this form.
   */
  errorStrategy: Signal<ErrorDisplayStrategy>;
}

/**
 * Directive to provide Signal Forms context to child components.
 *
 * **Selectors**:
 * - `form[ngxSignalForm]` - Explicit binding with full form context
 * - `form(submit)` - Auto-applies only (adds `novalidate` attribute)
 *
 * **Automatically adds `novalidate`** to prevent HTML5 validation UI from conflicting
 * with Angular Signal Forms validation display.
 *
 * **What this directive adds**:
 * 1. Automatic `novalidate` attribute (both selectors)
 * 2. DI context for child components (when using `[ngxSignalForm]`)
 * 3. Error display strategy management (when using `[ngxSignalForm]`)
 *
 * **Philosophy**: Stay close to Angular Signal Forms API.
 * The directive derives `submittedStatus` from Angular's native `submitting()`
 * signal by tracking submit transitions.
 *
 * @example Explicit form binding (recommended for toolkit components)
 * ```typescript
 * @Component({
 *   template: `
 *     <form [ngxSignalForm]="userForm" (submit)="handleSubmit($event)">
 *       <input [formField]="userForm.email" type="email" />
 *       <ngx-signal-form-error [formField]="userForm.email" fieldName="email" />
 *       <button type="submit">Submit</button>
 *     </form>
 *   `
 * })
 * ```
 *
 * @example Auto-apply novalidate only (minimal usage)
 * ```html
 * <!-- Just adds novalidate, no form context provided -->
 * <form (submit)="handleSubmit($event)">
 *   <input [formField]="form.email" />
 *   <button type="submit">Submit</button>
 * </form>
 * ```
 *
 * @example With error strategy
 * ```html
 * <form [ngxSignalForm]="userForm" [errorStrategy]="'on-submit'" (submit)="handleSubmit($event)">
 *   <!-- Errors appear only after form submission -->
 * </form>
 * ```
 */
@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector -- Directive for forms using Angular Signal Forms
  selector: 'form[ngxSignalForm], form(submit)',
  exportAs: 'ngxSignalForm',
  host: {
    '[attr.novalidate]': '""',
  },
  providers: [
    {
      provide: NGX_SIGNAL_FORM_CONTEXT,
      useFactory: () => {
        const directive = inject(NgxSignalFormDirective);
        return {
          get form() {
            const f = directive.form();
            if (!f) {
              throw new Error(
                'NgxSignalFormContext requires [ngxSignalForm] binding. ' +
                  'Use <form [ngxSignalForm]="yourForm"> to access form context.',
              );
            }
            return f;
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
  readonly #hasSubmitted = signal(false);
  readonly #wasSubmitting = signal(false);
  readonly #wasTouched = signal(false);

  /**
   * The Signal Forms instance (FieldTree) to provide.
   * Optional when using `form(submit)` selector (only adds `novalidate`).
   * Required when using `[ngxSignalForm]` for full form context.
   */
  readonly form = input<FieldTree<unknown> | undefined>(undefined, {
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

  /**
   * Submission status derived from Angular Signal Forms' native signals.
   *
   * Angular 21 provides a `submitting()` signal on `FieldState`,
   * but NOT a `submittedStatus()` signal. The toolkit derives `SubmittedStatus`
   * from these native signals:
   *
   * - `'unsubmitted'` - Form hasn't been submitted yet (no form bound OR no submit attempts)
   * - `'submitting'` - Form is currently being submitted (`submitting()` is true)
   * - `'submitted'` - Form has completed a submission (tracked via `submitting()` transition)
   *
   * **How derivation works**:
   * 1. If `submitting()` is true → `'submitting'`
   * 2. If a submission completed (submitting went from true to false) → `'submitted'`
   * 3. Otherwise → `'unsubmitted'`
   *
   * **Reset behavior**: When `form.reset()` is called, the status returns to `'unsubmitted'`.
   * This is detected by watching for `touched()` becoming `false` after being `true`.
   *
   * Returns `'unsubmitted'` when no form is bound (using `form(submit)` selector only).
   */
  readonly submittedStatus = computed<SubmittedStatus>(() => {
    const f = this.form();
    if (!f) return 'unsubmitted';

    const fieldState = f();

    // Derive SubmittedStatus from Angular's native signals
    if (fieldState.submitting()) {
      return 'submitting';
    }

    if (this.#hasSubmitted()) {
      return 'submitted';
    }

    return 'unsubmitted';
  });

  constructor() {
    effect(() => {
      const formTree = this.form();
      if (!formTree) {
        this.#wasSubmitting.set(false);
        this.#wasTouched.set(false);
        return;
      }

      const formState = formTree();
      const isSubmitting = formState.submitting();
      const isTouched = formState.touched();
      const wasSubmitting = this.#wasSubmitting();
      const wasTouched = this.#wasTouched();

      // Detect submit completion: submitting went from true to false
      if (wasSubmitting && !isSubmitting) {
        this.#hasSubmitted.set(true);
      }

      // Detect reset: touched went from true to false (form.reset() clears touched)
      // Only reset if not currently submitting to avoid false positives
      if (wasTouched && !isTouched && !isSubmitting) {
        this.#hasSubmitted.set(false);
      }

      this.#wasSubmitting.set(isSubmitting);
      this.#wasTouched.set(isTouched);
    });
  }
}
