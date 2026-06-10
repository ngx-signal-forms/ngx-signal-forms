import { Component, input } from '@angular/core';

/**
 * Default hint renderer for the Material reference wrapper.
 *
 * Dispatched by `<ngx-form-field-hint>` via `NGX_FORM_FIELD_HINT_RENDERER`
 * when consumers project that component into a `<mat-form-field>`. Renders a
 * Material-flavoured hint shell (matching `<mat-hint>` typography and colour)
 * around the consumer-supplied `<ng-content>` so the hint visually integrates
 * with surrounding Material chrome without requiring the consumer to swap
 * `<ngx-form-field-hint>` out for `<mat-hint>`.
 *
 * The renderer accepts (but does not require) the metadata
 * `<ngx-form-field-hint>` exposes (`resolvedFieldName`, `resolvedId`,
 * `position`); it consumes only what it needs for presentation. `position`
 * drives text alignment for parity with the toolkit's own hint chrome.
 *
 * Note: when consumers prefer the slot-directive flow
 * (`<mat-hint *ngxMatHintSlot>`), this renderer is not involved — that path
 * is owned by `NgxMatHintSlot` and does not consult
 * `NGX_FORM_FIELD_HINT_RENDERER`.
 */
@Component({
  selector: 'ngx-material-hint-renderer',

  template: `<span class="ngx-mat-hint__message"><ng-content /></span>`,
  host: {
    '[attr.data-position]': 'position() ?? null',
  },
  styles: `
    :host {
      display: block;
      font-size: 0.75rem;
      line-height: 1rem;
      color: rgba(0, 0, 0, 0.6);
    }

    :host([data-position='left']) {
      text-align: left;
    }

    :host([data-position='right']) {
      text-align: right;
    }

    .ngx-mat-hint__message {
      display: block;
    }
  `,
})
export class MaterialHintRenderer {
  /** Field name surfaced by `<ngx-form-field-hint>`; presentation-agnostic. */
  readonly resolvedFieldName = input<string | null>(null);

  /** Stable hint id surfaced by `<ngx-form-field-hint>`; informational. */
  readonly resolvedId = input<string | null>(null);

  /** Alignment hint forwarded to the host element for parity with Material chrome. */
  readonly position = input<'left' | 'right' | null>(null);
}
