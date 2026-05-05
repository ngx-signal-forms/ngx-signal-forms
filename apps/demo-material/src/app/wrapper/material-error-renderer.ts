import { NgComponentOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  type Type,
} from '@angular/core';
import { NGX_FORM_FIELD_ERROR_RENDERER } from '@ngx-signal-forms/toolkit';

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
      class="ngx-mat-feedback"
      [class.ngx-mat-feedback--warning]="severity() === 'warning'"
    >
      <span class="ngx-mat-feedback__marker" aria-hidden="true"></span>
      <span class="ngx-mat-feedback__message">{{ message() }}</span>
    </span>
  `,
  styles: `
    :host {
      display: block;
    }

    .ngx-mat-feedback {
      display: inline-flex;
      align-items: flex-start;
      gap: 0.5rem;
      max-width: 62ch;
      color: inherit;
      font-weight: 500;
      letter-spacing: 0.01em;
    }

    .ngx-mat-feedback__marker {
      width: 0.5rem;
      height: 0.5rem;
      flex: 0 0 0.5rem;
      margin-top: 0.35rem;
      border-radius: 999px;
      background: currentColor;
      opacity: 0.9;
    }

    .ngx-mat-feedback__message {
      display: block;
    }

    .ngx-mat-feedback--warning {
      color: #8a5a12;
    }
  `,
})
export class MaterialFeedbackRenderer {
  /** Resolved message text — already filtered by strategy and severity. */
  readonly message = input.required<string>();

  /** Severity discriminator; drives visual presentation only. */
  readonly severity = input.required<NgxMatFeedbackSeverity>();
}

/**
 * Drop-in outlet that mounts the configured feedback renderer for a single
 * `{ message, severity }` pair. Lets consumer templates collapse the
 * `*ngComponentOutlet="renderer; inputs: {...}"` boilerplate to a single
 * self-contained tag inside `<mat-error>` / `<mat-hint>` / `*ngxMatFeedback`.
 *
 * Reads the same DI seam as `provideNgxMatForms({ feedbackRenderer })`, so
 * swapping the registered renderer at bootstrap (or at component scope via
 * `provideNgxMatFormsForComponent`) automatically swaps what this outlet
 * mounts — without any consumer-side wiring.
 *
 * @example
 * ```html
 * <mat-error *ngxMatErrorSlot="form.email; let message">
 *   <ngx-mat-feedback-outlet [message]="message" severity="error" />
 * </mat-error>
 * ```
 */
@Component({
  selector: 'ngx-mat-feedback-outlet',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgComponentOutlet],
  template: `
    <ng-container
      *ngComponentOutlet="rendererComponent(); inputs: rendererInputs()"
    />
  `,
})
export class NgxMatFeedbackOutlet {
  /** Resolved message text — already filtered by strategy and severity. */
  readonly message = input.required<string>();

  /** Severity discriminator forwarded to the configured renderer. */
  readonly severity = input.required<NgxMatFeedbackSeverity>();

  readonly #configured = inject(NGX_FORM_FIELD_ERROR_RENDERER, {
    optional: true,
  });

  protected readonly rendererComponent = computed<Type<unknown>>(
    () => this.#configured?.component ?? MaterialFeedbackRenderer,
  );

  protected readonly rendererInputs = computed<Record<string, unknown>>(() => ({
    message: this.message(),
    severity: this.severity(),
  }));
}
