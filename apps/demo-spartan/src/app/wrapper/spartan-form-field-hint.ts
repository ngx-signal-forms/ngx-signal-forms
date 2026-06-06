import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Spartan-flavoured hint renderer.
 *
 * Registered via `provideFormFieldHintRenderer({ component: ... })` and
 * dispatched by `<ngx-form-field-hint>` through `NGX_FORM_FIELD_HINT_RENDERER`.
 * Wraps the projected hint content in a helm-styled `<small>` so consumer
 * copy inherits Spartan's secondary-text idiom (`text-muted-foreground`
 * + `text-xs`) without the consumer template having to learn helm classes.
 *
 * Accepts (but does not require) the metadata `<ngx-form-field-hint>`
 * exposes (`resolvedFieldName`, `resolvedId`, `position`); only `position`
 * is consumed for visual alignment, the rest stay informational.
 */
@Component({
  selector: 'spartan-form-field-hint',

  host: {
    '[attr.data-position]': 'position() ?? null',
    class: 'block',
  },
  styles: `
    :host([data-position='left']) {
      text-align: left;
    }

    :host([data-position='right']) {
      text-align: right;
    }
  `,
  template: `<small class="text-muted-foreground text-xs leading-snug"
    ><ng-content
  /></small>`,
})
export class NgxSpartanFormFieldHint {
  /** Field name surfaced by `<ngx-form-field-hint>`; presentation-agnostic. */
  readonly resolvedFieldName = input<string | null>(null);

  /** Stable hint id surfaced by `<ngx-form-field-hint>`; informational. */
  readonly resolvedId = input<string | null>(null);

  /** Alignment hint forwarded to the host element for parity. */
  readonly position = input<'left' | 'right' | null>(null);
}
