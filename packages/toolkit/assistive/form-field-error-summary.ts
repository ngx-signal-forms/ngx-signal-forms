import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  isDevMode,
  untracked,
} from '@angular/core';
import { NgxHeadlessErrorSummary } from '@ngx-signal-forms/toolkit/headless';

/**
 * Form-level error summary component with WCAG 2.2 compliance.
 *
 * Renders a clickable list of validation errors aggregated from a form tree.
 * Each entry focuses the associated control on click via Angular's `focusBoundControl()`.
 *
 * Built on top of `NgxHeadlessErrorSummary` which provides all the
 * error aggregation, deduplication, strategy resolution, and focus management.
 *
 * ## Accessibility
 *
 * - `role="alert"` (implicit `aria-live="assertive"` + `aria-atomic="true"`)
 *   for immediate screen reader announcement — the explicit live/atomic
 *   attributes are intentionally omitted to avoid duplicate announcements
 *   on NVDA+Firefox.
 * - Error links are focusable buttons for keyboard navigation
 * - Each entry identifies the field and the error message
 * - The summary host has `tabindex="-1"` and is **programmatically focused**
 *   the first time it appears with non-zero entries (GOV.UK / WAI tutorial
 *   pattern for WCAG 2.4.3 + 3.3.1). This guarantees screen reader users
 *   land on the summary after submit instead of being left where they were.
 *   Opt out with `[autoFocus]="false"`.
 *
 * ## Usage
 *
 * ```html
 * <ngx-form-field-error-summary
 *   [formTree]="myForm"
 *   summaryLabel="Please fix the following errors:"
 * />
 * ```
 *
 * ## With Form-Level Strategy
 *
 * ```html
 * <form [formRoot]="myForm" ngxSignalForm errorStrategy="on-submit">
 *   ...fields...
 *   <ngx-form-field-error-summary [formTree]="myForm" />
 *   <button type="submit">Submit</button>
 * </form>
 * ```
 */
@Component({
  selector: 'ngx-form-field-error-summary',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    // `tabindex="-1"` makes the host programmatically focusable without
    // injecting it into the natural Tab order. The `:focus-visible` outline
    // on individual error buttons is intentionally untouched.
    tabindex: '-1',
  },
  hostDirectives: [
    {
      directive: NgxHeadlessErrorSummary,
      inputs: ['formTree', 'strategy', 'submittedStatus'],
    },
  ],
  template: `
    @if (summary.shouldShow() && summary.hasErrors()) {
      <div class="ngx-form-field-error-summary" role="alert">
        @if (summaryLabel()) {
          <p class="ngx-form-field-error-summary__label">
            {{ summaryLabel() }}
          </p>
        }
        <ul class="ngx-form-field-error-summary__list" role="list">
          @for (
            entry of summary.entries();
            track entry.kind + entry.fieldName
          ) {
            <li class="ngx-form-field-error-summary__item">
              <button
                type="button"
                class="ngx-form-field-error-summary__link"
                (click)="entry.focus()"
              >
                <span class="ngx-form-field-error-summary__field-name">{{
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
    .ngx-form-field-error-summary {
      border: 2px solid var(--ngx-error-summary-border-color, #dc2626);
      border-radius: 0.375rem;
      padding: 1rem;
      margin-block: 1rem;
      background: var(--ngx-error-summary-bg, #fef2f2);
    }

    .ngx-form-field-error-summary__label {
      font-weight: 600;
      margin-block-end: 0.5rem;
      color: var(--ngx-error-summary-label-color, #991b1b);
    }

    .ngx-form-field-error-summary__list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .ngx-form-field-error-summary__link {
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

    .ngx-form-field-error-summary__field-name {
      font-weight: 600;
    }
  `,
})
export class NgxFormFieldErrorSummary {
  protected readonly summary = inject(NgxHeadlessErrorSummary);
  readonly #host = inject<ElementRef<HTMLElement>>(ElementRef);

  /**
   * One-shot guard for the dev-mode focus-failure diagnostic. Without this,
   * a host that is detached / `display: none` / covered by a modal would
   * trigger the warning on every render pass while the latch is held. We
   * mirror the `#warnedMissingName` pattern used in
   * `form-field-error.ts` and `NgxHeadlessFieldName`.
   */
  #warnedFocusFailure = false;

  /**
   * Label displayed above the error list.
   * @default 'Please fix the following errors:'
   */
  readonly summaryLabel = input('Please fix the following errors:');

  /**
   * Whether to programmatically focus the summary host the first time it
   * appears with non-zero entries.
   *
   * The default (`true`) follows the GOV.UK / WAI error-summary pattern so
   * screen-reader users hear the announcement and arrive at the summary
   * after a failed submit. Set to `false` if your flow already moves focus
   * elsewhere (e.g. straight to the first invalid field) or if focus
   * theft is undesirable in your design.
   *
   * @default true
   */
  readonly autoFocus = input(true);

  constructor() {
    /**
     * Track whether we have already moved focus into the summary so that
     * subsequent entry-list mutations (a new error appearing while the
     * summary is visible, the user editing a field, etc.) do not steal
     * focus from wherever the user currently is. We re-arm the latch when
     * the summary disappears so the next "0 → N" transition focuses again.
     */
    let hasFocused = false;

    afterRenderEffect({
      // `read` phase: we only need to inspect signals + (optionally) call
      // `.focus()` on the host. No DOM writes that would invalidate other
      // components' layouts.
      read: () => {
        const visible = this.summary.shouldShow() && this.summary.hasErrors();

        if (!visible) {
          hasFocused = false;
          return;
        }

        // `untracked` so reading these once-per-mount signals does not
        // cause the effect to retrigger every time the entry list, label,
        // or focus flag changes after the initial focus has happened.
        untracked(() => {
          if (hasFocused) return;
          if (!this.autoFocus()) return;

          const host = this.#host.nativeElement;
          // Defensive: in jsdom-based test environments `focus()` is
          // present but a missing element should never crash production.
          if (typeof host.focus === 'function') {
            host.focus();
          }
          hasFocused = true;

          // Dev-mode diagnostic: `focus()` is silent — if the host is
          // detached, `display: none`, covered by a modal/inert ancestor,
          // or otherwise unfocusable, we no-op without telling anyone and
          // the WCAG 2.4.3 + 3.3.1 contract silently breaks. Once-per-
          // instance warning so we don't spam the console.
          if (
            isDevMode() &&
            !this.#warnedFocusFailure &&
            typeof document !== 'undefined' &&
            document.activeElement !== host
          ) {
            this.#warnedFocusFailure = true;
            // oxlint-disable-next-line no-console -- dev-mode a11y signal
            console.warn(
              '[ngx-signal-forms] NgxFormFieldErrorSummary: ' +
                'host.focus() did not move focus (likely detached, ' +
                'display:none, covered by a modal, or has tabindex ' +
                'blocked). The WCAG 2.4.3 contract requires focus to ' +
                'land on the summary on first appearance. Set ' +
                '`[autoFocus]="false"` to opt out, or ensure the summary ' +
                'host is visible and focusable.',
            );
          }
        });
      },
    });
  }
}
