import {
  computed,
  Directive,
  inject,
  input,
  signal,
  type Signal,
} from '@angular/core';
import { FormRoot, type FieldTree } from '@angular/forms/signals';
import { NGX_SIGNAL_FORM_CONTEXT, NGX_SIGNAL_FORMS_CONFIG } from '../tokens';
import type {
  ErrorDisplayStrategy,
  ResolvedErrorDisplayStrategy,
  SubmittedStatus,
} from '../types';
import { createSubmittedStatusTracker } from '../utilities/submission-helpers';

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
  errorStrategy: Signal<ResolvedErrorDisplayStrategy>;
}

/**
 * Directive that enhances Angular's `FormRoot` with toolkit context.
 *
 * This directive is intentionally additive: Angular's public `FormRoot`
 * continues to own submission behavior while the toolkit layers on extra DI
 * context, submitted-status tracking, and form-level error strategy.
 *
 * Use it together with Angular's `[formRoot]` binding on the same `<form>`.
 *
 * ### Why this uses a separate selector instead of `hostDirectives`
 *
 * The toolkit does not compose Angular's `FormRoot` via `hostDirectives` because
 * that would either duplicate `FormRoot` on the host element or make the toolkit
 * proxy Angular's public API surface again. A separate additive attribute keeps
 * Angular's public API in the lead.
 *
 * ### Toolkit additions (on top of Angular's `FormRoot`)
 *
 * 1. DI context for child toolkit components (`NGX_SIGNAL_FORM_CONTEXT`)
 * 2. Submitted status tracking (`unsubmitted` → `submitting` → `submitted`)
 * 3. Error display strategy management (`errorStrategy` input)
 *
 * ### Submission ownership
 *
 * Angular's `FormRoot` remains the only directive that calls `submit()` and
 * prevents the native submit. The toolkit only observes submit attempts so the
 * `'on-submit'` strategy can also work for invalid submissions.
 *
 * @example Angular-led form with toolkit enhancement
 * ```typescript
 * @Component({
 *   template: `
 *     <form [formRoot]="userForm" ngxSignalForm>
 *       <input [formField]="userForm.email" type="email" />
 *       <ngx-signal-form-error [formField]="userForm.email" fieldName="email" />
 *       <button type="submit">Submit</button>
 *     </form>
 *   `
 * })
 * export class UserFormComponent {
 *   readonly #userData = signal({ email: '' });
 *   protected readonly userForm = form(this.#userData, {
 *     submission: {
 *       action: async (field) => {
 *         await this.save(field().value());
 *         return undefined;
 *       },
 *       onInvalid: createOnInvalidHandler(),
 *     },
 *   });
 * }
 * ```
 *
 * @example With error strategy
 * ```html
 * <form [formRoot]="userForm" ngxSignalForm [errorStrategy]="'on-submit'">
 *   <!-- Errors appear only after form submission -->
 * </form>
 * ```
 */
@Directive({
  selector: 'form[formRoot][ngxSignalForm]',
  exportAs: 'ngxSignalForm',
  host: {
    '(submit)': 'onSubmitAttempt()',
  },
  providers: [
    {
      provide: NGX_SIGNAL_FORM_CONTEXT,
      useFactory: () => {
        const directive = inject(NgxSignalFormDirective);
        return {
          get form() {
            return directive.formRoot();
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
  readonly #angularFormRoot = inject(FormRoot);

  /**
   * The Angular Signal Forms instance owned by Angular's public `FormRoot`.
   */
  readonly formRoot = computed<FieldTree<unknown>>(() => {
    return this.#angularFormRoot.fieldTree();
  });

  /**
   * Error display strategy for this form.
   * Overrides the global default for all fields in this form.
   */
  readonly errorStrategy = input<ErrorDisplayStrategy | null | undefined>(
    undefined,
  );

  /**
   * Resolved error display strategy (form-level or global default).
   */
  protected readonly resolvedErrorStrategy =
    computed<ResolvedErrorDisplayStrategy>(() => {
      const formStrategy = this.errorStrategy();
      if (
        formStrategy !== undefined &&
        formStrategy !== null &&
        formStrategy !== 'inherit'
      ) {
        return formStrategy;
      }

      return this.#config.defaultErrorStrategy;
    });

  /**
   * Tracks whether a submit has been attempted via the form's native submit event.
   *
   * Set in `onSubmitAttempt()` when the user clicks submit.
   * Unlike Angular's `submitting()`, which only fires for valid forms, this flag
   * captures ALL submit attempts — including invalid ones.
   *
   * This is critical for the `'on-submit'` error strategy: Angular's `submit()`
   * only sets `submitting()` to `true` when the form is valid. Without this flag,
   * errors would never appear for invalid forms with `'on-submit'` strategy.
   *
   * Reset lifecycle is owned by `createSubmittedStatusTracker`, which clears
   * this signal when `touched()` transitions from `true` to `false` (form reset).
   */
  readonly #submitAttempted = signal(false);

  /**
   * Submission status derived from Angular Signal Forms' native signals
   * and the directive's own submit-attempt tracking.
   *
   * Angular 21.2 provides a `submitting()` signal on `FieldState`,
   * but NOT a `submittedStatus()` signal. The toolkit derives it:
   *
   * - `'unsubmitted'` - No submission attempt yet
   * - `'submitting'` - `submitting()` is currently `true` (valid form, action running)
   * - `'submitted'` - A submit was attempted (via `onSubmitAttempt`), regardless of validity
   *
   * **Reset behavior**: When `form.reset()` is called, the status returns to `'unsubmitted'`.
   * This is detected by watching for `touched()` becoming `false` after being `true`.
   */
  readonly submittedStatus: Signal<SubmittedStatus> =
    createSubmittedStatusTracker(this.formRoot, this.#submitAttempted);

  protected onSubmitAttempt(): void {
    this.#submitAttempted.set(true);
  }
}
