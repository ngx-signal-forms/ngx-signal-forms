import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import { NgxHeadlessErrorSummaryDirective } from '@ngx-signal-forms/toolkit/headless';

/**
 * Form-level error summary component with WCAG 2.2 compliance.
 *
 * Renders a clickable list of validation errors aggregated from a form tree.
 * Each entry focuses the associated control on click via Angular's `focusBoundControl()`.
 *
 * Built on top of `NgxHeadlessErrorSummaryDirective` which provides all the
 * error aggregation, deduplication, strategy resolution, and focus management.
 *
 * ## Accessibility
 *
 * - `role="alert"` with `aria-live="assertive"` for immediate screen reader announcement
 * - Error links are focusable buttons for keyboard navigation
 * - Each entry identifies the field and the error message
 *
 * ## Usage
 *
 * ```html
 * <ngx-signal-form-error-summary
 *   [formTree]="myForm"
 *   summaryLabel="Please fix the following errors:"
 * />
 * ```
 *
 * ## With Form-Level Strategy
 *
 * ```html
 * <form [formRoot]="myForm" ngxSignalForm [errorStrategy]="'on-submit'">
 *   ...fields...
 *   <ngx-signal-form-error-summary [formTree]="myForm" />
 *   <button type="submit">Submit</button>
 * </form>
 * ```
 */
@Component({
  selector: 'ngx-signal-form-error-summary',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    {
      directive: NgxHeadlessErrorSummaryDirective,
      inputs: ['formTree', 'strategy', 'submittedStatus'],
    },
  ],
  template: `
    @if (summary.shouldShow() && summary.hasErrors()) {
      <div
        class="ngx-signal-form-error-summary"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
      >
        @if (summaryLabel()) {
          <p class="ngx-signal-form-error-summary__label">
            {{ summaryLabel() }}
          </p>
        }
        <ul class="ngx-signal-form-error-summary__list" role="list">
          @for (
            entry of summary.entries();
            track entry.kind + entry.fieldName
          ) {
            <li class="ngx-signal-form-error-summary__item">
              <button
                type="button"
                class="ngx-signal-form-error-summary__link"
                (click)="entry.focus()"
              >
                <span class="ngx-signal-form-error-summary__field-name">{{
                  entry.fieldName
                }}</span
                >:
                {{ entry.message }}
              </button>
            </li>
          }
        </ul>
      </div>
    }
  `,
  styles: `
    .ngx-signal-form-error-summary {
      border: 2px solid var(--ngx-error-summary-border-color, #dc2626);
      border-radius: 0.375rem;
      padding: 1rem;
      margin-block: 1rem;
      background: var(--ngx-error-summary-bg, #fef2f2);
    }

    .ngx-signal-form-error-summary__label {
      font-weight: 600;
      margin-block-end: 0.5rem;
      color: var(--ngx-error-summary-label-color, #991b1b);
    }

    .ngx-signal-form-error-summary__list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .ngx-signal-form-error-summary__link {
      all: unset;
      cursor: pointer;
      color: var(--ngx-error-summary-link-color, #dc2626);
      text-decoration: underline;
      font-size: 0.875rem;

      &:hover {
        color: var(--ngx-error-summary-link-hover-color, #991b1b);
      }

      &:focus-visible {
        outline: 2px solid var(--ngx-error-summary-focus-color, #2563eb);
        outline-offset: 2px;
        border-radius: 2px;
      }
    }

    .ngx-signal-form-error-summary__field-name {
      font-weight: 600;
    }
  `,
})
export class NgxSignalFormErrorSummaryComponent {
  protected readonly summary = inject(NgxHeadlessErrorSummaryDirective);

  /**
   * Label displayed above the error list.
   * @default 'Please fix the following errors:'
   */
  readonly summaryLabel = input('Please fix the following errors:');
}
