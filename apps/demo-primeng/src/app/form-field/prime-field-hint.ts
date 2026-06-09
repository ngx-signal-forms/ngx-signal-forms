import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * PrimeNG-flavoured hint renderer.
 *
 * Registered via `provideFormFieldHintRenderer({ component: ... })` and
 * dispatched by `<ngx-form-field-hint>` through `NGX_FORM_FIELD_HINT_RENDERER`.
 * Wraps the projected hint content in a Prime-styled `<small>` so consumer
 * copy inherits the design system's secondary-text idiom without changing
 * the consumer template.
 *
 * Accepts (but does not require) the metadata `<ngx-form-field-hint>`
 * exposes (`resolvedFieldName`, `resolvedId`, `position`); only `position`
 * is consumed for visual alignment, the rest stay informational.
 */
@Component({
  selector: 'prime-field-hint',

  host: {
    '[attr.data-position]': 'position() ?? null',
  },
  styles: `
    :host {
      display: block;
      font-size: 0.85rem;
      line-height: 1.2;
      color: var(--p-text-muted-color, #6b7280);
    }

    :host([data-position='left']) {
      text-align: left;
    }

    :host([data-position='right']) {
      text-align: right;
    }
  `,
  template: `<small class="p-text-secondary"><ng-content /></small>`,
})
export class PrimeFieldHintComponent {
  /** Field name surfaced by `<ngx-form-field-hint>`; presentation-agnostic. */
  readonly resolvedFieldName = input<string | null>(null);

  /** Stable hint id surfaced by `<ngx-form-field-hint>`; informational. */
  readonly resolvedId = input<string | null>(null);

  /** Alignment hint forwarded to the host element for parity. */
  readonly position = input<'left' | 'right' | null>(null);
}
