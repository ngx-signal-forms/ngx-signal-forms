import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  type Signal,
} from '@angular/core';
import type { FieldTree, ValidationError } from '@angular/forms/signals';
import {
  createShowErrorsComputed,
  generateErrorId,
  generateWarningId,
  injectFormContext,
  NGX_SIGNAL_FORM_FIELD_CONTEXT,
  readDirectErrors,
  resolveStrategyFromContext,
  resolveSubmittedStatusFromContext,
  resolveValidationErrorMessage,
  splitByKind,
  type ErrorDisplayStrategy,
  type SubmittedStatus,
} from '@ngx-signal-forms/toolkit';
import { NGX_ERROR_MESSAGES } from '@ngx-signal-forms/toolkit/core';

export type NgxFormFieldErrorListStyle = 'plain' | 'bullets';

/**
 * Reusable error and warning display component with WCAG 2.2 compliance.
 *
 * Accepts a FieldTree from Angular Signal Forms.
 *
 * ## Simplified Architecture (aligned with Angular Signal Forms)
 *
 * This component **does not require** `[formRoot]` directive for the default
 * `'on-touch'` strategy. Angular's `submit()` helper calls `markAllAsTouched()`,
 * so `field.touched()` becomes true after submission - we just check that.
 *
 * **When to use `ngxSignalForm` alongside `[formRoot]`:**
 * - Form-level `errorStrategy` override
 * - Auto-linked `aria-describedby` (via auto-aria directive)
 * - Access to form context in custom components
 *
 * **Signal Forms Limitation: No Native Warning Support**
 *
 * Signal Forms only has "errors" - it doesn't have a built-in concept of "warnings".
 * This component provides warnings support using a **convention-based approach**:
 *
 * - **Errors** (blocking): `kind` does NOT start with `'warn:'`
 * - **Warnings** (non-blocking): `kind` starts with `'warn:'`
 *
 * @template TValue The type of the field value (defaults to unknown)
 *
 * @example Simplest Usage (no NgxSignalFormToolkit needed!)
 * ```html
 * <form (submit)="save($event)" novalidate>
 *   <input [formField]="form.email" />
 *   <ngx-form-field-error [formField]="form.email" fieldName="email" />
 *   <button type="submit">Submit</button>
 * </form>
 * ```
 *
 * @example With Form-Level Strategy Override
 * ```html
 * <form [formRoot]="form" ngxSignalForm errorStrategy="immediate">
 *   <ngx-form-field-error [formField]="form.email" fieldName="email" />
 * </form>
 * ```
 *
 * @example Error (blocks submission)
 * ```typescript
 * { kind: 'required', message: 'Email is required' }
 * { kind: 'email', message: 'Invalid email format' }
 * ```
 *
 * @example Warning (does not block submission)
 * ```typescript
 * /// Using warningError() helper (recommended)
 * warningError('weak-password', 'Consider a stronger password')
 *
 * /// Or directly with 'warn:' prefix
 * { kind: 'warn:weak-password', message: 'Consider a stronger password' }
 * ```
 *
 * Features:
 * - **Errors**: `role="alert"` with `aria-live="assertive"` for immediate announcement
 * - **Warnings**: `role="status"` with `aria-live="polite"` for non-intrusive guidance
 * - Strategy-aware error/warning display
 * - Structured rendering from Signal Forms
 * - Auto-generated IDs for aria-describedby linking
 */
@Component({
  selector: 'ngx-form-field-error',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Blocking Errors (ARIA role="alert" for assertive announcement) -->
    @if (showErrors() && hasErrors()) {
      <div
        [id]="errorId()"
        class="ngx-form-field-error ngx-form-field-error--error"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
      >
        @if (usesBulletList()) {
          <ul class="ngx-form-field-error__list" role="list">
            @for (error of resolvedErrors(); track error.kind) {
              <li
                class="ngx-form-field-error__message ngx-form-field-error__message--error"
              >
                {{ error.message }}
              </li>
            }
          </ul>
        } @else {
          @for (error of resolvedErrors(); track error.kind) {
            <p
              class="ngx-form-field-error__message ngx-form-field-error__message--error"
            >
              {{ error.message }}
            </p>
          }
        }
      </div>
    }

    <!-- Non-blocking Warnings (ARIA role="status" for polite announcement) -->
    @if (showWarnings() && hasWarnings()) {
      <div
        [id]="warningId()"
        class="ngx-form-field-error ngx-form-field-error--warning"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        @if (usesBulletList()) {
          <ul class="ngx-form-field-error__list" role="list">
            @for (warning of resolvedWarnings(); track warning.kind) {
              <li
                class="ngx-form-field-error__message ngx-form-field-error__message--warning"
              >
                {{ warning.message }}
              </li>
            }
          </ul>
        } @else {
          @for (warning of resolvedWarnings(); track warning.kind) {
            <p
              class="ngx-form-field-error__message ngx-form-field-error__message--warning"
            >
              {{ warning.message }}
            </p>
          }
        }
      </div>
    }
  `,
  styleUrl: './form-field-error.component.scss',
})
export class NgxFormFieldErrorComponent<TValue = unknown> {
  /**
   * Try to inject form context (optional - may not be available).
   */
  readonly #injectedContext = injectFormContext();

  /**
   * Try to inject field context (optional - provided by form field wrapper).
   * Used to automatically resolve field name when not explicitly provided.
   */
  readonly #fieldContext = inject(NGX_SIGNAL_FORM_FIELD_CONTEXT, {
    optional: true,
  });

  /**
   * Try to inject error messages registry (optional - may not be provided).
   *
   * Used for 3-tier message priority:
   * 1. error.message (from validator/Zod schema) ← Use first!
   * 2. Registry override (from provideErrorMessages())
   * 3. Default fallback (built-in toolkit messages)
   */
  readonly #errorMessagesRegistry = inject(NGX_ERROR_MESSAGES, {
    optional: true,
  });

  /**
   * The Signal Forms field to display errors/warnings for.
   * Accepts a FieldTree from Angular Signal Forms.
   *
   * **Use `formField` for single fields:**
   * Automatically extracts errors from the field's state.
   *
   * **Use `errors` input for aggregated/custom errors:**
   * Pass a pre-filtered ValidationError[] signal directly (e.g., from fieldsets).
   */
  readonly formField = input<FieldTree<TValue>>();

  /**
   * Direct errors input for pre-aggregated/custom error arrays.
   *
   * When provided, this takes priority over extracting errors from `formField`.
   * Useful for:
   * - Fieldsets that aggregate errors from multiple fields
   * - Custom components that compute their own error lists
   * - Testing with mock error data
   *
   * @example Fieldset with aggregated errors
   * ```html
   * <ngx-form-field-error
   *   [errors]="aggregatedErrors"
   *   [fieldName]="'address'"
   *   [strategy]="strategy()"
   *   [submittedStatus]="submittedStatus()"
   * />
   * ```
   */
  readonly errors = input<Signal<ValidationError[]>>();

  /**
   * The field name used for generating error/warning IDs.
   * This should match the field name used in aria-describedby.
   *
   * **Automatic resolution (when used inside `ngx-signal-form-field-wrapper`):**
   * When omitted, the field name is automatically inherited from the parent
   * wrapper component via dependency injection. This allows simplified usage:
   *
   * ```html
   * <ngx-signal-form-field-wrapper [formField]="form.email">
   *   <label for="email">Email</label>
   *   <input id="email" [formField]="form.email" />
   *   <!-- fieldName is automatically resolved from wrapper -->
   * </ngx-signal-form-field-wrapper>
   * ```
   *
   * **Explicit override:**
   * Provide an explicit field name when using the component standalone
   * or when you need to override the automatic behavior.
   */
  readonly fieldName = input<string>();

  /**
   * Resolved field name computed from input or field context.
   *
   * Priority:
   * 1. Explicit `fieldName` input
   * 2. Field context from parent wrapper (via NGX_SIGNAL_FORM_FIELD_CONTEXT)
   * 3. Throws when neither is available
   */
  readonly #resolvedFieldName = computed(() => {
    const explicit = this.fieldName();
    if (explicit !== undefined) {
      const trimmed = explicit.trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
    }

    const contextFieldName = this.#fieldContext?.fieldName();
    if (contextFieldName !== undefined) {
      return contextFieldName;
    }

    throw new Error(
      '[ngx-signal-forms] ngx-form-field-error requires an explicit `fieldName` input or a parent ngx-signal-form-field-wrapper context.',
    );
  });

  /**
   * Error display strategy for this specific field.
   *
   * Use 'inherit' to explicitly inherit from form provider.
   * If undefined, automatically inherits from form provider or defaults to 'on-touch'.
   *
   * @default undefined (inherits from form or 'on-touch')
   */
  readonly strategy = input<ErrorDisplayStrategy | undefined>();

  /**
   * Visual layout for rendered validation messages.
   *
   * - `plain` (default): stacked paragraph messages for inline field feedback
   * - `bullets`: unordered list for grouped summaries such as fieldsets
   */
  readonly listStyle = input<NgxFormFieldErrorListStyle>('plain');

  /**
   * Form submission status (optional).
   *
   * For `'on-touch'` strategy (default), this input is NOT needed.
   * Only needed for `'on-submit'` strategy.
   * When inside `ngxSignalForm`, this is automatically injected from context.
   */
  readonly submittedStatus = input<SubmittedStatus | undefined>();

  /**
   * Computed error ID for aria-describedby linking.
   */
  protected readonly errorId = computed(() =>
    generateErrorId(this.#resolvedFieldName()),
  );

  /**
   * Computed warning ID for aria-describedby linking.
   */
  protected readonly warningId = computed(() =>
    generateWarningId(this.#resolvedFieldName()),
  );

  readonly #resolvedStrategy = computed<ErrorDisplayStrategy>(() =>
    resolveStrategyFromContext(this.strategy(), this.#injectedContext),
  );

  readonly #resolvedSubmittedStatus = computed<SubmittedStatus | undefined>(
    () =>
      resolveSubmittedStatusFromContext(
        this.submittedStatus(),
        this.#injectedContext,
      ),
  );

  /**
   * Extract FieldState from FieldTree for use with showErrors utility.
   * FieldTree is a callable signal: () => FieldState
   *
   * Returns null when using direct errors input (no field available).
   */
  readonly #fieldState = computed(() => {
    const fieldTree = this.formField();
    return fieldTree ? fieldTree() : null;
  });

  /**
   * Shared visibility-timing computed. Routed through `createShowErrorsComputed`
   * so this component stays in lockstep with the wrapper, auto-aria, and
   * `showErrors()` itself. The `direct-errors` escape hatch (where `formField`
   * is absent and the component renders caller-provided `ValidationError[]`)
   * is layered on top in `showErrors` below.
   */
  readonly #showErrorsByStrategy = createShowErrorsComputed(
    this.#fieldState,
    this.#resolvedStrategy,
    this.#resolvedSubmittedStatus,
  );

  /**
   * Computed signal for error visibility based on strategy.
   *
   * When using direct errors input (no formField), defaults to showing errors
   * since the parent component controls visibility.
   */
  protected readonly showErrors = computed(() => {
    // When using direct errors (no formField), always show
    // The parent component (e.g., fieldset) controls visibility
    if (!this.#fieldState()) {
      return true;
    }
    return this.#showErrorsByStrategy();
  });

  /**
   * Computed signal for warning visibility.
   * Warnings are shown using the same strategy as errors.
   */
  protected readonly showWarnings = this.showErrors;

  protected readonly usesBulletList = computed(() => {
    return this.listStyle() === 'bullets';
  });

  /**
   * All validation messages from the field or direct errors input.
   *
   * Priority:
   * 1. Direct `errors` input (for aggregated/custom errors)
   * 2. Extract from `formField` FieldTree
   */
  readonly #allMessages = computed(() => {
    // Priority 1: Direct errors input
    const directErrors = this.errors();
    if (directErrors) {
      return directErrors();
    }

    // Priority 2: Extract from formField
    const fieldTree = this.formField();
    if (!fieldTree) {
      return [];
    }

    const fieldState = fieldTree();
    return readDirectErrors(fieldState);
  });

  readonly #split = computed(() => splitByKind(this.#allMessages()));

  protected readonly hasErrors = computed(
    () => this.#split().blocking.length > 0,
  );

  protected readonly hasWarnings = computed(
    () => this.#split().warnings.length > 0,
  );

  protected readonly resolvedErrors = computed(() =>
    this.#split().blocking.map((error) => ({
      kind: error.kind,
      message: resolveValidationErrorMessage(
        error,
        this.#errorMessagesRegistry,
      ),
    })),
  );

  protected readonly resolvedWarnings = computed(() =>
    this.#split().warnings.map((warning) => ({
      kind: warning.kind,
      message: resolveValidationErrorMessage(
        warning,
        this.#errorMessagesRegistry,
      ),
    })),
  );
}
