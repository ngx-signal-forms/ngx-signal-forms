import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import type { FieldState, FieldTree } from '@angular/forms/signals';
import type { ErrorDisplayStrategy } from '@ngx-signal-forms/toolkit';
import {
  injectFormContext,
  NGX_SIGNAL_FORMS_CONFIG,
  resolveErrorDisplayStrategy,
  showErrors,
  splitByKind,
} from '@ngx-signal-forms/toolkit';
import { NgxSignalFormErrorComponent } from '@ngx-signal-forms/toolkit/assistive';
import {
  createFieldStateFlags,
  createUniqueId,
  dedupeValidationErrors,
  readDirectErrors,
  readErrors,
} from '@ngx-signal-forms/toolkit/headless';

export type FieldsetErrorPlacement = 'top' | 'bottom';

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
 * - **Group-Only Mode**: Show only group-level errors when nested fields display their own
 * - **Deduplication**: Same error shown only once even if multiple fields have it
 * - **Warning Support**: Non-blocking warnings (with `warn:` prefix) shown when no errors
 * - **WCAG 2.2 Compliant**: Errors use `role="alert"`, warnings use `role="status"`
 * - **Strategy Aware**: Respects `ErrorDisplayStrategy` from form context or input
 * - **Configurable Placement**: Grouped messages can appear above or below the fieldset content
 *
 * ## Error Display Modes
 *
 * Use `includeNestedErrors` to control which errors are shown:
 * - `false` (default): Shows ONLY direct group-level errors (use when fields show their own errors)
 * - `true`: Shows ALL errors including nested field errors via `errorSummary()`
 *
 * @template TFieldset The type of the fieldset field value
 *
 * @example Group-Only Mode (when nested fields show their own errors)
 * ```html
 * <ngx-signal-form-fieldset
 *   [fieldsetField]="form.passwords"
 *   [includeNestedErrors]="false"
 * >
 *   <ngx-signal-form-field-wrapper [formField]="form.passwords.password">...</ngx-signal-form-field-wrapper>
 *   <ngx-signal-form-field-wrapper [formField]="form.passwords.confirm">...</ngx-signal-form-field-wrapper>
 *   <!-- Fieldset shows only "Passwords must match" cross-field error -->
 * </ngx-signal-form-fieldset>
 * ```
 *
 * @example Aggregated Mode (when nested fields don't show errors)
 * ```html
 * <ngx-signal-form-fieldset [fieldsetField]="form.address">
 *   <input [formField]="form.address.street" />
 *   <input [formField]="form.address.city" />
 *   <!-- Fieldset shows all nested field errors -->
 * </ngx-signal-form-fieldset>
 * ```
 */
@Component({
  selector: 'ngx-signal-form-fieldset, [ngxSignalFormFieldset]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgxSignalFormErrorComponent],
  styleUrl: './form-fieldset.component.scss',
  exportAs: 'ngxSignalFormFieldset',
  host: {
    class: 'ngx-signal-form-fieldset',
    '[class.ngx-signal-form-fieldset--invalid]': 'shouldShowErrors()',
    '[class.ngx-signal-form-fieldset--warning]': 'shouldShowWarnings()',
    '[class.ngx-signal-form-fieldset--messages-top]': 'isTopPlacement()',
    '[class.ngx-signal-form-fieldset--messages-bottom]': '!isTopPlacement()',
    '[attr.aria-describedby]': 'describedByIds()',
    '[attr.data-error-placement]': 'errorPlacement()',
    '[attr.aria-busy]': 'isPending() ? "true" : null',
  },
  template: `
    <ng-content select="legend" />

    @if (showMessages() && isTopPlacement()) {
      <div class="ngx-signal-form-fieldset__messages">
        <ngx-signal-form-error
          [errors]="filteredErrorsSignal"
          [fieldName]="resolvedFieldsetId()"
          [strategy]="resolvedStrategy()"
          [submittedStatus]="submittedStatus()"
          listStyle="bullets"
        />
      </div>
    }

    <div class="ngx-signal-form-fieldset__content">
      <ng-content />
    </div>

    @if (showMessages() && !isTopPlacement()) {
      <div class="ngx-signal-form-fieldset__messages">
        <ngx-signal-form-error
          [errors]="filteredErrorsSignal"
          [fieldName]="resolvedFieldsetId()"
          [strategy]="resolvedStrategy()"
          [submittedStatus]="submittedStatus()"
          listStyle="bullets"
        />
      </div>
    }
  `,
})
export class NgxSignalFormFieldset<TFieldset = unknown> {
  readonly #formContext = injectFormContext();
  readonly #config = inject(NGX_SIGNAL_FORMS_CONFIG, { optional: true });

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
  readonly strategy = input<ErrorDisplayStrategy | null>(null);

  /**
   * Whether to show the automatic error/warning display.
   * @default true
   */
  readonly showErrors = input(true, { transform: booleanAttribute });

  /**
   * Placement of the aggregated error or warning summary.
   *
   * This API is primarily intended for grouped fieldset summaries. The wrapper
   * component also supports message placement, but this fieldset placement is
   * the main design-alignment control for complex grouped forms.
   *
   * - `top` (default): display the summary directly below the legend/description
   * - `bottom`: display the summary after the projected field content
   */
  readonly errorPlacement = input<FieldsetErrorPlacement>('top');

  /**
   * Whether to include nested field errors in the aggregated display.
   *
   * - `false` (default): Shows ONLY group-level errors via `errors()`.
   *   Use when nested fields DO display their own errors (avoids duplication).
   * - `true`: Shows ALL errors from nested fields via `errorSummary()`.
   *   Use when nested fields do NOT display their own errors.
   *
   * @default false
   *
   * @example Show all nested field errors (when fields don't show their own)
   * ```html
   * <ngx-signal-form-fieldset
   *   [fieldsetField]="form.address"
   *   [includeNestedErrors]="true"
   * >
   *   <!-- Plain inputs without NgxSignalFormField wrapper -->
   *   <input [formField]="form.address.street" />
   *   <input [formField]="form.address.city" />
   *   <!-- Fieldset shows all errors from nested fields -->
   * </ngx-signal-form-fieldset>
   * ```
   */
  readonly includeNestedErrors = input(false, { transform: booleanAttribute });

  readonly #generatedFieldsetId = createUniqueId('fieldset');

  readonly resolvedFieldsetId = computed(() => {
    return this.fieldsetId() ?? this.#generatedFieldsetId;
  });

  readonly #fieldsetState = computed(() => this.fieldsetField()());

  readonly resolvedStrategy = computed<ErrorDisplayStrategy>(() => {
    const formContext = this.#formContext;

    return resolveErrorDisplayStrategy(
      this.strategy(),
      formContext ? formContext.errorStrategy() : undefined,
      this.#config?.defaultErrorStrategy ?? 'on-touch',
    );
  });

  readonly submittedStatus = computed(() => {
    const formContext = this.#formContext;

    return formContext ? formContext.submittedStatus() : 'unsubmitted';
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
    const includeNested = this.includeNestedErrors();

    const readFn = includeNested ? readErrors : readDirectErrors;

    if (override && override.length > 0) {
      const messages = override.flatMap((field) => readFn(field()));
      return dedupeValidationErrors(messages);
    }

    return dedupeValidationErrors(readFn(this.#fieldsetState()));
  });

  readonly #split = computed(() => splitByKind(this.#allMessages()));

  readonly blockingErrors = computed(() => this.#split().blocking);
  readonly warningErrors = computed(() => this.#split().warnings);

  readonly #flags = createFieldStateFlags(this.#fieldsetState);

  readonly isInvalid = this.#flags.isInvalid;
  readonly isValid = this.#flags.isValid;
  readonly isTouched = this.#flags.isTouched;
  readonly isDirty = this.#flags.isDirty;
  readonly isPending = this.#flags.isPending;

  readonly shouldShowErrors = computed(() => {
    return this.#showErrorsSignal() && this.blockingErrors().length > 0;
  });

  readonly shouldShowWarnings = computed(() => {
    if (this.shouldShowErrors()) {
      return false;
    }
    return this.#showErrorsSignal() && this.warningErrors().length > 0;
  });

  protected readonly isTopPlacement = computed(() => {
    return this.errorPlacement() !== 'bottom';
  });

  protected readonly showMessages = computed(() => {
    return (
      this.showErrors() &&
      (this.shouldShowErrors() || this.shouldShowWarnings())
    );
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
