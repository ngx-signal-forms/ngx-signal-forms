import { computed, Directive, inject, input, type Signal } from '@angular/core';
import type { FieldTree } from '@angular/forms/signals';
import { FormRoot } from '@angular/forms/signals';
import { NGX_SIGNAL_FORM_CONTEXT, NGX_SIGNAL_FORMS_CONFIG } from '../tokens';
import type {
  ErrorDisplayStrategy,
  ReactiveOrStatic,
  SubmittedStatus,
} from '../types';
import { resolveErrorDisplayStrategy } from '../utilities/resolve-strategy';
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
  errorStrategy: Signal<ErrorDisplayStrategy>;
}

/**
 * Directive that composes Angular's `FormRoot` and provides toolkit context.
 *
 * Uses `FormRoot` as a host directive and enriches it with toolkit-specific features
 * (DI context, submitted status tracking, error strategy).
 *
 * **Use `[ngxSignalForm]` instead of `[formRoot]`** — do not use both on the same form.
 *
 * **What this directive provides**:
 * 1. Automatic `novalidate` attribute (same as `FormRoot`)
 * 2. Submit event handling with `preventDefault()` (same as `FormRoot`)
 * 3. Automatic `submit()` call when form has a `submission` config
 * 4. DI context for child toolkit components
 * 5. Submitted status tracking (`unsubmitted` → `submitting` → `submitted`)
 * 6. Error display strategy management
 *
 * **Submission patterns**:
 * - **Declarative** (recommended): Configure `submission: { action, onInvalid }` in `form()`.
 *   The directive calls `submit()` automatically on form submit.
 * - **Manual**: Add `(submit)="handler($event)"` for custom logic.
 *   The directive still handles `preventDefault()` and status tracking.
 *
 * @example Declarative submission (recommended)
 * ```typescript
 * @Component({
 *   template: `
 *     <form [ngxSignalForm]="userForm">
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
 * @example Manual submission
 * ```html
 * <form [ngxSignalForm]="userForm" (submit)="save($event)">
 *   <button type="submit">Submit</button>
 * </form>
 * ```
 *
 * @example With error strategy
 * ```html
 * <form [ngxSignalForm]="userForm" [errorStrategy]="'on-submit'">
 *   <!-- Errors appear only after form submission -->
 * </form>
 * ```
 */
@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector -- Directive for forms using Angular Signal Forms
  selector: 'form[ngxSignalForm]',
  exportAs: 'ngxSignalForm',
  hostDirectives: [
    {
      directive: FormRoot,
      inputs: ['formRoot: ngxSignalForm'],
    },
  ],
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
    return resolveErrorDisplayStrategy(
      this.errorStrategy(),
      undefined,
      this.#config.defaultErrorStrategy,
    );
  });

  /**
   * Submission status derived from Angular Signal Forms' native signals.
   *
   * Angular 21.2 provides a `submitting()` signal on `FieldState`,
   * but NOT a `submittedStatus()` signal. The toolkit derives `SubmittedStatus`
   * from these native signals:
   *
   * - `'unsubmitted'` - Form hasn't been submitted yet
   * - `'submitting'` - Form is currently being submitted (`submitting()` is true)
   * - `'submitted'` - Form has completed a submission (tracked via `submitting()` transition)
   *
   * **Reset behavior**: When `form.reset()` is called, the status returns to `'unsubmitted'`.
   * This is detected by watching for `touched()` becoming `false` after being `true`.
   */
  readonly submittedStatus = createSubmittedStatusTracker(this.form);
}
