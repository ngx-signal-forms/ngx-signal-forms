import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { NgxFormFieldErrorComponent } from '@ngx-signal-forms/toolkit/assistive';
import { NgxHeadlessFieldsetDirective } from '@ngx-signal-forms/toolkit/headless';

export type FieldsetErrorPlacement = 'top' | 'bottom';

/**
 * Form fieldset component for grouping related form fields with aggregated error/warning display.
 *
 * Similar to HTML `<fieldset>`, this component groups form fields and displays
 * aggregated validation messages for all contained fields. It uses
 * `NgxFormFieldErrorComponent` internally for consistent error/warning styling.
 *
 * ## Composition
 *
 * The styled fieldset composes `NgxHeadlessFieldsetDirective` via
 * `hostDirectives`. All field-aggregation state — errors, warnings,
 * strategy resolution, submitted status, deduplication — lives in the
 * headless directive; this component only contributes UI-layer
 * concerns (`showErrors` toggle, `errorPlacement`, `describedByIds`).
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
  hostDirectives: [
    {
      directive: NgxHeadlessFieldsetDirective,
      inputs: [
        'fieldsetField',
        'fields',
        'fieldsetId',
        'strategy',
        'submittedStatus',
        'includeNestedErrors',
      ],
    },
  ],
  imports: [NgxFormFieldErrorComponent],
  styleUrl: './form-fieldset.component.scss',
  exportAs: 'ngxSignalFormFieldset',
  host: {
    class: 'ngx-signal-form-fieldset',
    '[class.ngx-signal-form-fieldset--invalid]': 'fieldset.shouldShowErrors()',
    '[class.ngx-signal-form-fieldset--warning]':
      'fieldset.shouldShowWarnings()',
    '[class.ngx-signal-form-fieldset--messages-top]': 'isTopPlacement()',
    '[class.ngx-signal-form-fieldset--messages-bottom]': '!isTopPlacement()',
    '[attr.aria-describedby]': 'describedByIds()',
    '[attr.data-error-placement]': 'errorPlacement()',
    '[attr.aria-busy]': 'fieldset.isPending() ? "true" : null',
  },
  template: `
    <ng-content select="legend" />

    <div class="ngx-signal-form-fieldset__surface">
      @if (showMessages() && isTopPlacement()) {
        <div class="ngx-signal-form-fieldset__messages">
          <ngx-form-field-error
            [errors]="filteredErrorsSignal"
            [fieldName]="fieldset.resolvedFieldsetId()"
            [strategy]="fieldset.resolvedStrategy()"
            [submittedStatus]="fieldset.resolvedSubmittedStatus()"
            listStyle="bullets"
          />
        </div>
      }

      <div class="ngx-signal-form-fieldset__content">
        <ng-content />
      </div>

      @if (showMessages() && !isTopPlacement()) {
        <div class="ngx-signal-form-fieldset__messages">
          <ngx-form-field-error
            [errors]="filteredErrorsSignal"
            [fieldName]="fieldset.resolvedFieldsetId()"
            [strategy]="fieldset.resolvedStrategy()"
            [submittedStatus]="fieldset.resolvedSubmittedStatus()"
            listStyle="bullets"
          />
        </div>
      }
    </div>
  `,
})
export class NgxSignalFormFieldset {
  /**
   * The composed headless fieldset directive that owns all aggregated
   * validation state. Exposed to the template so bindings stay short
   * (`fieldset.isPending()` rather than `this.#fieldset.isPending()`),
   * and protected so it doesn't leak into the component's public API.
   */
  protected readonly fieldset = inject(NgxHeadlessFieldsetDirective);

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

  protected readonly isTopPlacement = computed(() => {
    return this.errorPlacement() !== 'bottom';
  });

  protected readonly showMessages = computed(() => {
    return (
      this.showErrors() &&
      (this.fieldset.shouldShowErrors() || this.fieldset.shouldShowWarnings())
    );
  });

  /**
   * Filtered errors signal for NgxFormFieldErrorComponent.
   *
   * Passes blocking errors OR warnings, never both.
   * Warnings are suppressed when errors exist (UX best practice).
   */
  protected readonly filteredErrorsSignal = computed(() => {
    const blocking = this.fieldset.aggregatedErrors();
    return blocking.length > 0 ? blocking : this.fieldset.aggregatedWarnings();
  });

  readonly describedByIds = computed(() => {
    const ids: string[] = [];
    const fieldsetId = this.fieldset.resolvedFieldsetId();

    if (this.fieldset.shouldShowErrors()) {
      ids.push(`${fieldsetId}-error`);
    }

    if (this.fieldset.shouldShowWarnings()) {
      ids.push(`${fieldsetId}-warning`);
    }

    return ids.length > 0 ? ids.join(' ') : null;
  });
}
