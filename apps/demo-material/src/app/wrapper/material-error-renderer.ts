import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Severity discriminator carried alongside the resolved message string.
 *
 * - `'error'` — blocking validation failure rendered inside `<mat-error>`
 *   (or the error block of `*ngxMatFeedback`).
 * - `'warning'` — non-blocking `warn:*` message rendered inside
 *   `<mat-hint>` (or the warning block of `*ngxMatFeedback`).
 *
 * The renderer chooses presentation (icon, colour, typography) from this
 * discriminator; visibility, message resolution, and ID generation are all
 * owned by the slot directive that hosts it.
 */
export type NgxMatFeedbackSeverity = 'error' | 'warning';

/**
 * Default presentational renderer for `*ngxMatErrorSlot`,
 * `*ngxMatHintSlot`, and `*ngxMatFeedback`.
 *
 * Accepts `{ message, severity }` only — the slot directives resolve
 * `formField` → message text via `readDirectErrors` + the toolkit's
 * strategy and hand the resolved string to this component. The renderer is
 * the single seam consumers swap (icon prefix, custom typography) without
 * touching the toolkit's resolution logic.
 *
 * @example Component-scoped override:
 * ```ts
 * providers: [
 *   provideNgxMatForms({ feedbackRenderer: { component: MyIconRenderer } }),
 * ],
 * ```
 *
 * @see ADR-0002 §7 for the contract simplification rationale.
 */
@Component({
  selector: 'ngx-material-feedback-renderer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="ngx-mat-feedback__message"
      [class.ngx-mat-feedback__message--warning]="severity() === 'warning'"
      >{{ message() }}</span
    >
  `,
  styles: `
    :host {
      display: block;
    }

    .ngx-mat-feedback__message {
      display: block;
    }

    .ngx-mat-feedback__message--warning {
      color: #92400e;
    }
  `,
})
export class MaterialFeedbackRenderer {
  /** Resolved message text — already filtered by strategy and severity. */
  readonly message = input.required<string>();

  /** Severity discriminator; drives visual presentation only. */
  readonly severity = input.required<NgxMatFeedbackSeverity>();
}
