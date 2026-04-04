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
import { submit } from '@angular/forms/signals';
import { NGX_SIGNAL_FORM_CONTEXT, NGX_SIGNAL_FORMS_CONFIG } from '../tokens';
import type {
  ErrorDisplayStrategy,
  ResolvedErrorDisplayStrategy,
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
  errorStrategy: Signal<ResolvedErrorDisplayStrategy>;
}

/**
 * Directive that transparently enhances Angular's `[formRoot]` with toolkit context.
 *
 * Matches the same `form[formRoot]` selector as Angular's `FormRoot` directive,
 * replacing it with toolkit-specific features (DI context, submitted status
 * tracking, error strategy) while replicating the same base behavior
 * (`novalidate`, `preventDefault`, `submit()`).
 *
 * **Import `NgxSignalFormToolkit` instead of `FormRoot`** — do not import both.
 *
 * ### Why we replicate FormRoot instead of composing via `hostDirectives`
 *
 * Using `hostDirectives: [FormRoot]` on the same `form[formRoot]` selector risks
 * double-instantiation: if a user imports both `FormRoot` and `NgxSignalFormToolkit`,
 * both directives match independently, causing duplicate `submit()` calls.
 *
 * The replicated behavior is limited to 3 trivial host behaviors (see source reference
 * below). The actual submission logic lives in the `submit()` function imported from
 * `@angular/forms/signals`, so changes to Angular's submit handling are picked up
 * automatically.
 *
 * ### Replicated from Angular's FormRoot
 *
 * The following behavior is replicated from Angular's `FormRoot` directive:
 * - `host: { novalidate: '' }` — disables browser validation
 * - `host: { '(submit)': 'onSubmit($event)' }` — intercepts form submit
 * - `onSubmit`: calls `event.preventDefault()` and `submit(fieldTree())`
 *
 * @see {@link https://github.com/angular/angular/blob/main/packages/forms/signals/src/directive/ng_signal_form.ts Angular FormRoot source}
 *
 * ### Toolkit additions (on top of FormRoot behavior)
 *
 * 1. DI context for child toolkit components (`NGX_SIGNAL_FORM_CONTEXT`)
 * 2. Submitted status tracking (`unsubmitted` → `submitting` → `submitted`)
 * 3. Error display strategy management (`errorStrategy` input)
 *
 * ### Submission patterns
 *
 * - **Declarative** (recommended): Configure `submission: { action, onInvalid }` in `form()`.
 *   The directive calls `submit()` automatically on form submit.
 * - **Manual**: Add `(submit)="handler($event)"` for custom logic.
 *   The directive still handles `preventDefault()` and status tracking.
 *
 * @example Declarative submission (recommended)
 * ```typescript
 * @Component({
 *   template: `
 *     <form [formRoot]="userForm">
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
 * <form [formRoot]="userForm" (submit)="save($event)">
 *   <button type="submit">Submit</button>
 * </form>
 * ```
 *
 * @example With error strategy
 * ```html
 * <form [formRoot]="userForm" [errorStrategy]="'on-submit'">
 *   <!-- Errors appear only after form submission -->
 * </form>
 * ```
 */
@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector -- Matches Angular's FormRoot selector to transparently enhance it
  selector: 'form[formRoot]',
  exportAs: 'ngxFormRoot',
  /// Replicates Angular's FormRoot host config.
  /// @see https://github.com/angular/angular/blob/main/packages/forms/signals/src/directive/ng_signal_form.ts
  host: {
    novalidate: '',
    '(submit)': 'onSubmit($event)',
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

  /**
   * The Signal Forms instance (FieldTree) bound via `[formRoot]`.
   */
  readonly formRoot = input.required<FieldTree<unknown>>();

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
   * Tracks whether a submit has been attempted via the form's submit event.
   *
   * This is set in `onSubmit()` BEFORE calling Angular's `submit()`.
   * Unlike `submitting()`, which only fires for valid forms, this flag
   * captures ALL submit attempts — including invalid ones.
   *
   * This is critical for the `'on-submit'` error strategy: Angular's `submit()`
   * only sets `submitting()` to `true` when the form is valid. Without this flag,
   * errors would never appear for invalid forms with `'on-submit'` strategy.
   */
  readonly #submitAttempted = signal(false);

  /**
   * Watches for form reset to clear the `#submitAttempted` flag.
   *
   * When `form.reset()` is called, `touched()` transitions from `true` to `false`.
   * This effect detects that transition and resets submission state.
   */
  constructor() {
    const prevTouched = signal(false);
    effect(() => {
      const nowTouched = this.formRoot()().touched();
      if (prevTouched() && !nowTouched) {
        this.#submitAttempted.set(false);
      }
      prevTouched.set(nowTouched);
    });
  }

  /**
   * Submission status derived from Angular Signal Forms' native signals
   * and the directive's own submit-attempt tracking.
   *
   * Angular 21.2 provides a `submitting()` signal on `FieldState`,
   * but NOT a `submittedStatus()` signal. The toolkit derives it:
   *
   * - `'unsubmitted'` - No submission attempt yet
   * - `'submitting'` - `submitting()` is currently `true` (valid form, action running)
   * - `'submitted'` - A submit was attempted (via `onSubmit`), regardless of validity
   *
   * **Reset behavior**: When `form.reset()` is called, the status returns to `'unsubmitted'`.
   * This is detected by watching for `touched()` becoming `false` after being `true`.
   */
  readonly submittedStatus: Signal<SubmittedStatus> = computed(() => {
    const state = this.formRoot()();
    if (state.submitting()) return 'submitting';
    return this.#submitAttempted() ? 'submitted' : 'unsubmitted';
  });

  /// Replicates Angular's FormRoot.onSubmit behavior.
  /// @see https://github.com/angular/angular/blob/main/packages/forms/signals/src/directive/ng_signal_form.ts
  // oxlint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- DOM Event is a browser API type and is passed through Angular's submit host listener.
  protected onSubmit(event: Readonly<Event>): void {
    event.preventDefault();
    this.#submitAttempted.set(true);
    void submit(this.formRoot());
  }
}
