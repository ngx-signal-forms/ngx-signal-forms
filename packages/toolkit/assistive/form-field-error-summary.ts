import { NgTemplateOutlet } from '@angular/common';
import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  untracked,
} from '@angular/core';
import {
  createUniqueId,
  devWarnOnce,
  type WarnOnceRef,
} from '@ngx-signal-forms/toolkit/core';
import { NgxHeadlessErrorSummary } from '@ngx-signal-forms/toolkit/headless';

/**
 * Heading levels `NgxFormFieldErrorSummary` can render its label as.
 *
 * @group Directives
 */
export type NgxErrorSummaryHeadingLevel = 2 | 3 | 4 | 5 | 6;

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
 * - The label renders as a native heading (`h2`–`h6`, default `h2`,
 *   configurable via `headingLevel`), matching WCAG 2.4.6. Native elements
 *   are preferred over `role="heading"` + `aria-level` — they get
 *   heading-navigation (NVDA/JAWS "H" key) without relying on ARIA.
 * - The summary host has `role="group"` — a role-less custom element
 *   computes to the generic role, and ARIA 1.2 forbids naming a generic
 *   element, so the host needs a namable role for its `aria-labelledby`
 *   (below) to be valid. Not `role="region"`: a region is a page landmark,
 *   and one per form-level error summary would be landmark noise most
 *   forms don't want.
 * - The summary host's `aria-labelledby` points at the heading, so
 *   focusing the host (see below) announces the label as its accessible
 *   name (WCAG 1.3.1, 2.4.6, 4.1.2).
 * - Error links are focusable buttons for keyboard navigation
 * - Each entry identifies the field and the error message
 * - An entry whose error has no focusable bound control renders as plain
 *   text instead of a button — a control that calls a no-op `focus()`
 *   looks interactive but does nothing (WCAG 4.1.2).
 * - The summary host has `tabindex="-1"` and is **programmatically focused**
 *   the first time it appears with non-zero entries under the resolved
 *   `'on-submit'` strategy (GOV.UK / WAI tutorial pattern for WCAG 2.4.3 +
 *   3.3.1). This guarantees screen reader users land on the summary after a
 *   failed submit instead of being left where they were. Auto-focus is
 *   intentionally skipped for `'on-touch'` / `'immediate'` strategies: the
 *   root FieldTree's `touched()` aggregates children, so the summary can
 *   appear the moment the user blurs the first invalid field — focusing it
 *   then would be an unexpected mid-fill context change (WCAG 3.2.1/3.2.2),
 *   not the documented "arrive after a failed submit" contract. Opt out of
 *   the on-submit auto-focus with `[autoFocus]="false"`.
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
    // `aria-labelledby` on a role-less custom element is invalid ARIA — a
    // custom element with no role computes to the generic role, and ARIA
    // 1.2 prohibits naming a generic element. `role="group"` gives the host
    // a namable role. Not `role="region"`: a region is a page landmark, and
    // one per form-level error summary would add landmark noise most forms
    // don't want.
    role: 'group',
    // Names the focused host after the heading, when one is rendered
    // (WCAG 1.3.1, 2.4.6, 4.1.2). `null` removes the attribute rather than
    // pointing at a heading that does not exist when `summaryLabel` is
    // empty.
    '[attr.aria-labelledby]': 'ariaLabelledBy()',
  },
  hostDirectives: [
    {
      directive: NgxHeadlessErrorSummary,
      inputs: ['formTree', 'strategy', 'warningStrategy', 'submittedStatus'],
    },
  ],
  imports: [NgTemplateOutlet],
  template: `
    <!--
      The role="alert" container is rendered UNCONDITIONALLY (even when
      empty), the same always-mounted live-region pattern NgxFormFieldError
      uses (both its inline and panel presentations): role="alert" only fires reliably on
      content insertion into a pre-existing live region, so inserting the
      container and its content in the same tick risks the NVDA + Chrome
      missed-first-announcement bug. aria-hidden/[hidden] are intentionally
      never toggled — the @if below already guarantees zero content while
      empty, so an empty live region announces nothing on its own.
    -->
    <div
      class="ngx-form-field-error-summary"
      [class.ngx-form-field-error-summary--empty]="
        !(summary.shouldShow() && summary.hasErrors())
      "
      role="alert"
    >
      @if (summary.shouldShow() && summary.hasErrors()) {
        @if (summaryLabel()) {
          <ng-template #labelText>{{ summaryLabel() }}</ng-template>
          @switch (headingLevel()) {
            @case (2) {
              <h2 [id]="headingId" class="ngx-form-field-error-summary__label">
                <ng-container [ngTemplateOutlet]="labelText" />
              </h2>
            }
            @case (3) {
              <h3 [id]="headingId" class="ngx-form-field-error-summary__label">
                <ng-container [ngTemplateOutlet]="labelText" />
              </h3>
            }
            @case (4) {
              <h4 [id]="headingId" class="ngx-form-field-error-summary__label">
                <ng-container [ngTemplateOutlet]="labelText" />
              </h4>
            }
            @case (5) {
              <h5 [id]="headingId" class="ngx-form-field-error-summary__label">
                <ng-container [ngTemplateOutlet]="labelText" />
              </h5>
            }
            @default {
              <h6 [id]="headingId" class="ngx-form-field-error-summary__label">
                <ng-container [ngTemplateOutlet]="labelText" />
              </h6>
            }
          }
        }
        <ul class="ngx-form-field-error-summary__list" role="list">
          @for (
            entry of summary.entries();
            track entry.fieldName + '::' + entry.kind + '::' + entry.message
          ) {
            <li class="ngx-form-field-error-summary__item">
              @if (entry.canFocus) {
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
              } @else {
                <span class="ngx-form-field-error-summary__text">
                  <span class="ngx-form-field-error-summary__field-name">{{
                    entry.fieldName
                  }}</span
                  >:
                  {{ entry.message }}
                </span>
              }
            </li>
          }
        </ul>
      }
    </div>
  `,
  styles: `
    /* Without this, the host's default inline box does not contain the
     * block content it wraps, so the focus-visible outline (and the
     * programmatic-focus ring) draws around a zero-height inline box
     * instead of the visible summary card. */
    :host {
      display: block;
    }

    /* Default colors are light-dark() pairs that follow the inherited
     * color-scheme (see THEMING.md, "Scenario C: Dark Mode"). Dark side, WCAG 1.4.3 on
     * the #450a0a summary background: label #fecaca 11.16:1, link #fca5a5
     * 8.51:1. Non-text (1.4.11): focus ring #60a5fa 6.35:1 on #450a0a;
     * border #f87171 5.31:1 on the #1f2937 dark surface. */
    .ngx-form-field-error-summary {
      border: 2px solid
        var(--ngx-error-summary-border-color, light-dark(#dc2626, #f87171));
      border-radius: 0.375rem;
      padding: 1rem;
      margin-block: 1rem;
      background: var(--ngx-error-summary-bg, light-dark(#fef2f2, #450a0a));
    }

    /* Empty live-region shell: the @if in the template guarantees zero
     * content while empty, so we additionally zero the box model to
     * collapse it visually — mirrors the --empty pattern in
     * NgxFormFieldError's own --empty presentation. */
    .ngx-form-field-error-summary--empty {
      border-width: 0;
      padding: 0;
      margin-block: 0;
    }

    /* Applied to a native h2-h6, whichever headingLevel resolves to.
     * Reset the user-agent heading defaults (larger font-size, bold
     * weight, margin on both block ends) so the label looks the same
     * regardless of level -- the class, not the tag, controls its look. */
    .ngx-form-field-error-summary__label {
      margin: 0 0 0.5rem;
      font: inherit;
      font-weight: 600;
      color: var(--ngx-error-summary-label-color, light-dark(#991b1b, #fecaca));
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
      /* all: unset resets display to its initial value (inline), and
       * min-block-size/min-inline-size have no effect on non-replaced
       * inline elements per spec -- so the WCAG 2.5.8 24x24px target-size
       * minimum below would be silently ignored without switching to
       * inline-flex here. The minimum is applied in BOTH directions
       * (block and inline): a short/empty fieldName or message could
       * otherwise render narrower than 24px even with the block-size
       * floor in place. justify-content centers short text within the
       * enforced inline minimum. */
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-block-size: var(--ngx-error-summary-link-min-target-size, 1.5rem);
      min-inline-size: var(--ngx-error-summary-link-min-target-size, 1.5rem);
      padding-inline: var(--ngx-error-summary-link-padding-inline, 0.25rem);
      cursor: pointer;
      /* #b91c1c (Tailwind red-700) on the #fef2f2 summary background
       * resolves to ~5.9:1, clearing the WCAG 1.4.3 AA minimum of 4.5:1 for
       * this 14px text -- the previous #dc2626 default only reached ~4.4:1. */
      color: var(--ngx-error-summary-link-color, light-dark(#b91c1c, #fca5a5));
      text-decoration: underline;
      font-size: 0.875rem;

      &:hover {
        color: var(
          --ngx-error-summary-link-hover-color,
          light-dark(#991b1b, #fecaca)
        );
      }

      &:focus-visible {
        outline: 2px solid
          var(--ngx-error-summary-focus-color, light-dark(#2563eb, #60a5fa));
        outline-offset: 2px;
        border-radius: 2px;
      }
    }

    .ngx-form-field-error-summary__field-name {
      font-weight: 600;
    }

    /* Non-focusable entry (no bound control): plain text at the same size
     * as a link, but without the link's color, underline, or pointer
     * cursor — it must not look interactive (WCAG 4.1.2). */
    .ngx-form-field-error-summary__text {
      display: inline-flex;
      align-items: center;
      padding-inline: var(--ngx-error-summary-link-padding-inline, 0.25rem);
      font-size: 0.875rem;
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
  readonly #warnedFocusFailure: WarnOnceRef = { current: false };

  /**
   * Stable id for the label heading, minted once in the injection context
   * (class-field initializer — see `createUniqueId`'s SSR-safety notes).
   * Used both as the heading's `id` and as the target of the host's
   * `aria-labelledby`.
   */
  protected readonly headingId = createUniqueId(
    'ngx-form-field-error-summary-heading',
  );

  /**
   * Label displayed above the error list.
   * @default 'Please fix the following errors:'
   */
  readonly summaryLabel = input('Please fix the following errors:');

  /**
   * Heading level the label renders as (a native `h2`–`h6` element).
   *
   * @default 2
   */
  readonly headingLevel = input<NgxErrorSummaryHeadingLevel>(2);

  /**
   * The host's `aria-labelledby`, pointing at the label heading. `null`
   * whenever the heading is not actually in the DOM — either the summary
   * itself is empty/hidden (`summary.shouldShow() && summary.hasErrors()`
   * is `false`, e.g. before the first submit) or `summaryLabel` is empty.
   * The heading only renders inside that same visibility condition (see
   * the template), so this must match it exactly: pointing `aria-
   * labelledby` at an id that is not yet in the DOM is an invalid ARIA
   * reference.
   */
  protected readonly ariaLabelledBy = computed(() =>
    this.summary.shouldShow() && this.summary.hasErrors() && this.summaryLabel()
      ? this.headingId
      : null,
  );

  /**
   * Whether to programmatically focus the summary host the first time it
   * appears with non-zero entries **under the resolved `'on-submit'`
   * strategy**.
   *
   * The default (`true`) follows the GOV.UK / WAI error-summary pattern so
   * screen-reader users hear the announcement and arrive at the summary
   * after a failed submit. Set to `false` if your flow already moves focus
   * elsewhere (e.g. straight to the first invalid field) or if focus
   * theft is undesirable in your design.
   *
   * This input has no effect under `'on-touch'` or `'immediate'` strategies
   * — auto-focus is always skipped for those, regardless of this value,
   * because the summary can appear mid-fill (e.g. on blurring the first
   * invalid field) and stealing focus then would be an unexpected context
   * change (WCAG 3.2.1/3.2.2), not the documented "arrive after a failed
   * submit" contract.
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
          // Only the resolved 'on-submit' strategy matches the documented
          // GOV.UK/WAI "arrive at the summary after a failed submit"
          // contract. Under 'on-touch'/'immediate' the summary can appear
          // mid-fill (e.g. blurring the first invalid field, or on initial
          // render for an already-invalid form) — auto-focusing there would
          // be an unexpected context change (WCAG 3.2.1/3.2.2).
          if (this.summary.resolvedStrategy() !== 'on-submit') return;

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
            typeof document !== 'undefined' &&
            document.activeElement !== host
          ) {
            devWarnOnce(
              this.#warnedFocusFailure,
              'warn',
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
