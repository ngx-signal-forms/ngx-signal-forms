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
  generateErrorId,
  generateWarningId,
  injectFormContext,
  NGX_ERROR_MESSAGES,
  NGX_SIGNAL_FORM_FIELD_CONTEXT,
  resolveErrorDisplayStrategy,
  resolveValidationErrorMessage,
  showErrors,
  type ErrorDisplayStrategy,
  type ErrorReadableState,
  type ReactiveOrStatic,
  type SubmittedStatus,
} from '@ngx-signal-forms/toolkit/core';

/**
 * Reusable error and warning display component with WCAG 2.2 compliance.
 *
 * Accepts a FieldTree from Angular Signal Forms.
 *
 * ## Simplified Architecture (aligned with Angular Signal Forms)
 *
 * This component **does not require** `[ngxSignalForm]` directive for the default
 * `'on-touch'` strategy. Angular's `submit()` helper calls `markAllAsTouched()`,
 * so `field.touched()` becomes true after submission - we just check that.
 *
 * **When to use `[ngxSignalForm]`:**
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
 * @example Simplest Usage (no ngxSignalForm needed!)
 * ```html
 * <form (submit)="save($event)" novalidate>
 *   <input [formField]="form.email" />
 *   <ngx-signal-form-error [formField]="form.email" fieldName="email" />
 *   <button type="submit">Submit</button>
 * </form>
 * ```
 *
 * @example With Form-Level Strategy Override
 * ```html
 * <form [ngxSignalForm]="form" [errorStrategy]="'immediate'">
 *   <ngx-signal-form-error [formField]="form.email" fieldName="email" />
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
  selector: 'ngx-signal-form-error',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Blocking Errors (ARIA role="alert" for assertive announcement) -->
    @if (showErrors() && hasErrors()) {
      <div
        [id]="errorId()"
        class="ngx-signal-form-error ngx-signal-form-error--error"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
      >
        @for (error of resolvedErrors(); track error.kind) {
          <p
            class="ngx-signal-form-error__message ngx-signal-form-error__message--error"
          >
            {{ error.message }}
          </p>
        }
      </div>
    }

    <!-- Non-blocking Warnings (ARIA role="status" for polite announcement) -->
    @if (showWarnings() && hasWarnings()) {
      <div
        [id]="warningId()"
        class="ngx-signal-form-error ngx-signal-form-error--warning"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        @for (warning of resolvedWarnings(); track warning.kind) {
          <p
            class="ngx-signal-form-error__message ngx-signal-form-error__message--warning"
          >
            {{ warning.message }}
          </p>
        }
      </div>
    }
  `,
  styleUrl: './form-error.component.scss',
})
export class NgxSignalFormErrorComponent<TValue = unknown> {
  readonly #readErrors = (state: unknown): ValidationError[] => {
    if (!state || typeof state !== 'object') {
      return [];
    }

    const errors = (state as Partial<ErrorReadableState>).errors;
    if (typeof errors === 'function') {
      return errors() ?? [];
    }

    return [];
  };

  #warnedUnknownField = false;

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
   * <ngx-signal-form-error
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
   * 3. Falls back to 'unknown-field' (should not happen in normal usage)
   */
  readonly #resolvedFieldName = computed(() => {
    const explicit = this.fieldName();
    if (explicit !== undefined) {
      return explicit;
    }

    const contextFieldName = this.#fieldContext?.fieldName();
    if (contextFieldName !== undefined) {
      return contextFieldName;
    }

    if (
      !this.#warnedUnknownField &&
      (typeof ngDevMode === 'undefined' || ngDevMode)
    ) {
      this.#warnedUnknownField = true;
      console.warn(
        '[ngx-signal-forms] Falling back to unknown field name. Provide fieldName or wrap with ngx-signal-form-field-wrapper.',
      );
    }

    // Fallback - should not happen in normal usage
    return 'unknown-field';
  });

  /**
   * Error display strategy for this specific field.
   *
   * Can be a SignalLike for dynamic strategy or a static value.
   * Use 'inherit' to explicitly inherit from form provider.
   * If undefined, automatically inherits from form provider or defaults to 'on-touch'.
   *
   * **Field-Level Override Use Cases:**
   * - Password fields: Use 'immediate' for real-time feedback
   * - Optional fields: Use 'on-submit' to avoid premature errors
   * - Critical fields: Use 'on-touch' for quick feedback
   *
   * @default undefined (inherits from form or 'on-touch')
   *
   * @example Field-level override
   * ```html
   * <form [ngxSignalForm]="form" [errorStrategy]="'on-touch'">
   *   <!-- Override: immediate feedback for password -->
   *   <ngx-signal-form-error
   *     [formField]="form.password"
   *     fieldName="password"
   *     strategy="immediate" />
   *
   *   <!-- Explicit inherit (same as omitting strategy) -->
   *   <ngx-signal-form-error
   *     [formField]="form.email"
   *     fieldName="email"
   *     strategy="inherit" />
   * </form>
   * ```
   */
  readonly strategy = input<ReactiveOrStatic<ErrorDisplayStrategy> | undefined>(
    undefined,
  );

  /**
   * Form submission status (optional).
   *
   * **For `'on-touch'` strategy (default): This input is NOT needed.**
   * Angular's `submit()` calls `markAllAsTouched()`, so `field.touched()` is true
   * after submission. The component uses `field.touched()` directly.
   *
   * **For `'on-submit'` strategy:** Pass a SubmittedStatus signal to distinguish
   * between "never submitted" and "submitted but field not yet touched".
   *
   * When used inside a form with `ngxSignalFormDirective`, this is automatically
   * injected from the form provider context.
   */
  readonly submittedStatus = input<
    ReactiveOrStatic<SubmittedStatus> | undefined
  >(undefined);

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

  /**
   * Resolved error display strategy (input or injected from context).
   *
   * Resolution priority:
   * 1. Field-level strategy (if not 'inherit' or undefined)
   * 2. Form-level strategy from context
   * 3. Default 'on-touch'
   */
  readonly #resolvedStrategy = computed<ErrorDisplayStrategy>(() => {
    return resolveErrorDisplayStrategy(
      this.strategy(),
      this.#injectedContext?.errorStrategy?.(),
      undefined,
    );
  });

  /**
   * Resolved submitted status (input or injected from context).
   * Returns undefined if not provided - this is fine for 'on-touch' strategy.
   */
  readonly #resolvedSubmittedStatus = computed<SubmittedStatus | undefined>(
    () => {
      const inputStatus = this.submittedStatus();
      if (inputStatus !== undefined && inputStatus !== null) {
        return typeof inputStatus === 'function' ? inputStatus() : inputStatus;
      }

      const contextStatus = this.#injectedContext?.submittedStatus?.();
      if (contextStatus !== undefined && contextStatus !== null) {
        return contextStatus;
      }

      // Return undefined - showErrors() handles this for 'on-touch' strategy
      return undefined;
    },
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
   * Computed signal for error visibility based on strategy.
   * Type assertion needed due to FieldState/CompatFieldState union type complexity.
   *
   * When using direct errors input (no formField), defaults to showing errors
   * since the parent component controls visibility.
   */
  protected readonly showErrors = computed(() => {
    const fieldState = this.#fieldState();

    // When using direct errors (no formField), always show
    // The parent component (e.g., fieldset) controls visibility
    if (!fieldState) {
      return true;
    }

    // Use strategy-based visibility for single fields
    return showErrors(
      () => fieldState,
      this.#resolvedStrategy,
      this.#resolvedSubmittedStatus,
    )();
  });

  /**
   * Computed signal for warning visibility.
   * Warnings are shown using the same strategy as errors.
   */
  protected readonly showWarnings = this.showErrors;

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
    return this.#readErrors(fieldState);
  });

  /**
   * Computed array of blocking errors (kind does NOT start with 'warn:').
   */
  readonly #blockingErrors = computed(() => {
    return this.#allMessages().filter(
      (msg) => msg.kind && !msg.kind.startsWith('warn:'),
    );
  });

  /**
   * Computed array of warnings (kind starts with 'warn:').
   */
  readonly #warningErrors = computed(() => {
    return this.#allMessages().filter(
      (msg) => msg.kind && msg.kind.startsWith('warn:'),
    );
  });

  /**
   * Whether the field has blocking errors.
   */
  protected readonly hasErrors = computed(
    () => this.#blockingErrors().length > 0,
  );

  /**
   * Whether the field has non-blocking warnings.
   */
  protected readonly hasWarnings = computed(
    () => this.#warningErrors().length > 0,
  );

  /**
   * Computed array of resolved error messages (not warnings).
   */
  protected readonly resolvedErrors = computed(() => {
    return this.#blockingErrors().map((error) => ({
      kind: error.kind,
      message: resolveValidationErrorMessage(
        error,
        this.#errorMessagesRegistry,
      ),
    }));
  });

  /**
   * Computed array of resolved warning messages.
   */
  protected readonly resolvedWarnings = computed(() => {
    return this.#warningErrors().map((warning) => ({
      kind: warning.kind,
      message: resolveValidationErrorMessage(
        warning,
        this.#errorMessagesRegistry,
      ),
    }));
  });
}
