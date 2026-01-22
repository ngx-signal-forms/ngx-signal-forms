import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
} from '@angular/core';
import type {
  FieldState,
  FieldTree,
  ValidationError,
} from '@angular/forms/signals';
import type {
  ErrorDisplayStrategy,
  ReactiveOrStatic,
} from '@ngx-signal-forms/toolkit';
import {
  injectFormConfig,
  injectFormContext,
  isWarningError,
  NgxSignalFormErrorComponent,
  showErrors,
} from '@ngx-signal-forms/toolkit';

/**
 * Boolean state keys available on FieldState.
 *
 * Angular Signal Forms does not export this type directly, but FieldState
 * exposes these as `Signal<boolean>` properties. We define it locally for
 * type-safe access to state flags.
 *
 * @see {@link https://angular.dev/api/forms/signals/FieldState FieldState API}
 */
type BooleanStateKey = 'invalid' | 'valid' | 'touched' | 'dirty' | 'pending';

/**
 * Type representing the shape of FieldState for reading error summary.
 * Used for duck-typing access to error properties.
 */
type StateLike = {
  invalid?: () => boolean;
  valid?: () => boolean;
  touched?: () => boolean;
  dirty?: () => boolean;
  pending?: () => boolean;
  errorSummary?: () => ValidationError[];
  errors?: () => ValidationError[];
};

let nextFieldsetId = 0;

function readFlag(state: unknown, key: BooleanStateKey): boolean {
  if (!state || typeof state !== 'object') {
    return false;
  }

  const fn = (state as Record<BooleanStateKey, (() => boolean) | undefined>)[
    key
  ];
  return typeof fn === 'function' ? fn() : false;
}

function readErrorSummary(state: unknown): ValidationError[] {
  if (!state || typeof state !== 'object') {
    return [];
  }

  const summary = (state as StateLike).errorSummary;
  if (typeof summary === 'function') {
    return summary() ?? [];
  }

  const errors = (state as StateLike).errors;
  if (typeof errors === 'function') {
    return errors() ?? [];
  }

  return [];
}

function dedupeMessages(messages: ValidationError[]): ValidationError[] {
  const seen = new Set<string>();
  const result: ValidationError[] = [];

  for (const message of messages) {
    const key = `${message.kind}::${message.message ?? ''}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(message);
  }

  return result;
}

/**
 * Form fieldset component for grouping related form fields with aggregated error/warning display.
 *
 * Similar to HTML `<fieldset>`, this component groups form fields and displays
 * aggregated validation messages for all contained fields. It uses
 * `NgxSignalFormErrorComponent` internally for consistent error/warning styling.
 *
 * ## Features
 *
 * - **Aggregated Errors**: Collects errors from all nested fields via `errorSummary()`
 * - **Deduplication**: Same error shown only once even if multiple fields have it
 * - **Warning Support**: Non-blocking warnings (with `warn:` prefix) shown when no errors
 * - **WCAG 2.2 Compliant**: Errors use `role="alert"`, warnings use `role="status"`
 * - **Strategy Aware**: Respects `ErrorDisplayStrategy` from form context or input
 *
 * ## Naming Rationale
 *
 * Named "fieldset" to align with HTML `<fieldset>` semantics - both group form
 * controls with a shared purpose. Unlike HTML fieldset, this component also
 * handles aggregated validation display.
 *
 * @template TFieldset The type of the fieldset field value
 *
 * @example Basic Usage - Group with Aggregated Errors
 * ```html
 * <ngx-signal-form-fieldset [fieldsetField]="form.address" fieldsetId="address">
 *   <ngx-signal-form-field [formField]="form.address.street">
 *     <label for="street">Street</label>
 *     <input id="street" [formField]="form.address.street" />
 *   </ngx-signal-form-field>
 *
 *   <ngx-signal-form-field [formField]="form.address.city">
 *     <label for="city">City</label>
 *     <input id="city" [formField]="form.address.city" />
 *   </ngx-signal-form-field>
 * </ngx-signal-form-fieldset>
 * ```
 *
 * @example Custom Field Collection
 * ```html
 * <ngx-signal-form-fieldset
 *   [fieldsetField]="form"
 *   [fields]="[form.password, form.confirmPassword]"
 *   fieldsetId="passwords"
 * >
 *   <!-- Fields content -->
 * </ngx-signal-form-fieldset>
 * ```
 */
@Component({
  selector:
    'ngx-signal-form-fieldset, [ngxSignalFormFieldset], [ngx-signal-form-fieldset]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgxSignalFormErrorComponent],
  styleUrl: './form-fieldset.component.scss',
  exportAs: 'ngxSignalFormFieldset',
  host: {
    class: 'ngx-signal-form-fieldset',
    '[class.ngx-signal-form-fieldset--invalid]': 'shouldShowErrors()',
    '[class.ngx-signal-form-fieldset--warning]': 'shouldShowWarnings()',
    '[attr.aria-busy]': 'isPending() ? "true" : null',
  },
  template: `
    <div class="ngx-signal-form-fieldset__content">
      <ng-content />
    </div>

    @if (showErrors() && (shouldShowErrors() || shouldShowWarnings())) {
      <div class="ngx-signal-form-fieldset__messages">
        <ngx-signal-form-error
          [formField]="syntheticField()"
          [fieldName]="resolvedFieldsetId()"
          [strategy]="resolvedStrategy()"
          [submittedStatus]="submittedStatus()"
        />
      </div>
    }
  `,
})
export class NgxSignalFormFieldsetComponent<TFieldset = unknown> {
  readonly #formContext = injectFormContext();
  readonly #config = injectFormConfig();

  /**
   * The primary fieldset field from Signal Forms.
   *
   * Required. This is the group root used to aggregate validation state and
   * errors via `errorSummary()` when `fields` is not provided.
   */
  readonly fieldsetField = input.required<FieldTree<TFieldset>>();

  /**
   * Optional explicit list of fields to aggregate errors from.
   * When provided, overrides the default `errorSummary()` from fieldsetField.
   * Useful for custom field groupings that don't match form structure.
   */
  readonly fields = input<FieldTree<unknown>[] | null>(null);

  /**
   * Unique identifier used to generate stable error/warning IDs.
   *
   * Optional. When omitted, an auto-generated ID is used. This is useful for
   * deterministic `aria-describedby` references or tests, but does not affect
   * validation logic.
   */
  readonly fieldsetId = input<string | undefined>(undefined);

  /**
   * Error display strategy for this fieldset.
   * Inherits from form context if not specified.
   */
  readonly strategy = input<ReactiveOrStatic<ErrorDisplayStrategy> | null>(
    null,
  );

  /**
   * Whether to show the automatic error/warning display.
   * @default true
   */
  readonly showErrors = input(true, { transform: booleanAttribute });

  readonly #generatedFieldsetId = `fieldset-${++nextFieldsetId}`;

  readonly resolvedFieldsetId = computed(() => {
    return this.fieldsetId() ?? this.#generatedFieldsetId;
  });

  readonly #fieldsetState = computed(() => this.fieldsetField()());

  readonly resolvedStrategy = computed<ErrorDisplayStrategy>(() => {
    const provided = this.strategy();
    if (provided !== null && provided !== undefined) {
      const resolved = typeof provided === 'function' ? provided() : provided;
      if (resolved !== 'inherit') {
        return resolved;
      }
    }

    const contextStrategy = this.#formContext?.errorStrategy?.();
    if (contextStrategy) {
      return contextStrategy;
    }

    const configured = this.#config.defaultErrorStrategy;
    return typeof configured === 'function' ? configured() : configured;
  });

  readonly submittedStatus = computed(() => {
    return this.#formContext?.submittedStatus?.() ?? 'unsubmitted';
  });

  readonly #showErrorsSignal = showErrors(
    this.#fieldsetState as () => FieldState<TFieldset>,
    this.resolvedStrategy,
    this.submittedStatus,
  );

  /**
   * Aggregated and deduplicated validation messages.
   */
  readonly #allMessages = computed(() => {
    const override = this.fields();

    if (override && override.length > 0) {
      const messages = override.flatMap((field) => readErrorSummary(field()));
      return dedupeMessages(messages);
    }

    return dedupeMessages(readErrorSummary(this.#fieldsetState()));
  });

  /**
   * Blocking errors (kind does NOT start with 'warn:').
   */
  readonly errors = computed(() => {
    return this.#allMessages().filter((error) => !isWarningError(error));
  });

  /**
   * Non-blocking warnings (kind starts with 'warn:').
   */
  readonly warnings = computed(() => {
    return this.#allMessages().filter((error) => isWarningError(error));
  });

  readonly isInvalid = computed(() =>
    readFlag(this.#fieldsetState(), 'invalid'),
  );
  readonly isValid = computed(() => readFlag(this.#fieldsetState(), 'valid'));
  readonly isTouched = computed(() =>
    readFlag(this.#fieldsetState(), 'touched'),
  );
  readonly isDirty = computed(() => readFlag(this.#fieldsetState(), 'dirty'));
  readonly isPending = computed(() =>
    readFlag(this.#fieldsetState(), 'pending'),
  );

  readonly shouldShowErrors = computed(() => {
    return this.#showErrorsSignal() && this.errors().length > 0;
  });

  readonly shouldShowWarnings = computed(() => {
    if (this.shouldShowErrors()) {
      return false;
    }
    return this.#showErrorsSignal() && this.warnings().length > 0;
  });

  /**
   * Creates a synthetic FieldTree for NgxSignalFormErrorComponent.
   *
   * NgxSignalFormErrorComponent expects a FieldTree, but we need to pass
   * our aggregated/deduplicated errors. We create a minimal synthetic
   * field that satisfies the component's interface.
   *
   * **Key Behavior:** Only passes blocking errors OR warnings, never both.
   * This ensures warnings are suppressed when errors exist (UX best practice).
   */
  readonly syntheticField = computed(() => {
    const state = this.#fieldsetState();

    /// Suppress warnings when blocking errors exist (UX best practice)
    /// NgxSignalFormErrorComponent would show both, so we filter at source
    const messages = this.errors().length > 0 ? this.errors() : this.warnings();

    /// Create a synthetic FieldState with our filtered errors
    const syntheticState = {
      errors: signal(messages),
      invalid: () => readFlag(state, 'invalid'),
      valid: () => readFlag(state, 'valid'),
      touched: () => readFlag(state, 'touched'),
      dirty: () => readFlag(state, 'dirty'),
      pending: () => readFlag(state, 'pending'),
    };

    /// Return a callable that returns the state (FieldTree signature)
    return (() => syntheticState) as unknown as FieldTree<TFieldset>;
  });

  readonly describedByIds = computed(() => {
    const ids: string[] = [];
    const fieldsetId = this.resolvedFieldsetId();

    if (this.shouldShowErrors()) {
      ids.push(`${fieldsetId}-error`);
    }

    if (this.shouldShowWarnings()) {
      ids.push(`${fieldsetId}-warning`);
    }

    return ids.length > 0 ? ids.join(' ') : null;
  });
}
