import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import type { FieldState, FieldTree } from '@angular/forms/signals';
import type {
  ErrorDisplayStrategy,
  ReactiveOrStatic,
} from '@ngx-signal-forms/toolkit';
import {
  injectFormConfig,
  injectFormContext,
  isBlockingError,
  isWarningError,
  NgxSignalFormErrorComponent,
  showErrors,
} from '@ngx-signal-forms/toolkit';
import {
  createUniqueId,
  dedupeValidationErrors,
  readErrors,
  readFieldFlag,
} from '@ngx-signal-forms/toolkit/headless';

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
          [errors]="filteredErrorsSignal"
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

  readonly #generatedFieldsetId = createUniqueId('fieldset');

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
   * Uses headless utilities for reading and deduplication.
   */
  readonly #allMessages = computed(() => {
    const override = this.fields();

    if (override && override.length > 0) {
      const messages = override.flatMap((field) => readErrors(field()));
      return dedupeValidationErrors(messages);
    }

    return dedupeValidationErrors(readErrors(this.#fieldsetState()));
  });

  /**
   * Blocking errors (kind does NOT start with 'warn:').
   * Uses shared `isBlockingError` utility from toolkit.
   */
  readonly blockingErrors = computed(() =>
    this.#allMessages().filter(isBlockingError),
  );

  /**
   * Non-blocking warnings (kind starts with 'warn:').
   * Uses shared `isWarningError` utility from toolkit.
   */
  readonly warningErrors = computed(() =>
    this.#allMessages().filter(isWarningError),
  );

  readonly isInvalid = computed(() =>
    readFieldFlag(this.#fieldsetState(), 'invalid'),
  );
  readonly isValid = computed(() =>
    readFieldFlag(this.#fieldsetState(), 'valid'),
  );
  readonly isTouched = computed(() =>
    readFieldFlag(this.#fieldsetState(), 'touched'),
  );
  readonly isDirty = computed(() =>
    readFieldFlag(this.#fieldsetState(), 'dirty'),
  );
  readonly isPending = computed(() =>
    readFieldFlag(this.#fieldsetState(), 'pending'),
  );

  readonly shouldShowErrors = computed(() => {
    return this.#showErrorsSignal() && this.blockingErrors().length > 0;
  });

  readonly shouldShowWarnings = computed(() => {
    if (this.shouldShowErrors()) {
      return false;
    }
    return this.#showErrorsSignal() && this.warningErrors().length > 0;
  });

  /**
   * Filtered errors signal for NgxSignalFormErrorComponent.
   *
   * Passes blocking errors OR warnings, never both.
   * Warnings are suppressed when errors exist (UX best practice).
   */
  protected readonly filteredErrorsSignal = computed(() => {
    return this.blockingErrors().length > 0
      ? this.blockingErrors()
      : this.warningErrors();
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
