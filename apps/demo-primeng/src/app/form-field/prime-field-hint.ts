import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * PrimeNG-flavoured hint renderer.
 *
 * Registered via `provideFormFieldHintRenderer({ component: ... })` and
 * referenced through `NGX_FORM_FIELD_HINT_RENDERER`. The first-party toolkit
 * wrapper currently projects `<ngx-form-field-hint>` content directly rather
 * than going through this token (the token is reserved for future parity);
 * the PrimeNG wrapper keeps that same projection model, but we still register
 * a hint renderer here so the seam is exercised end-to-end and so consumers
 * who switch to the dynamic-outlet model in the future inherit Prime's
 * `<small class="p-text-secondary">` idiom by default.
 */
@Component({
  selector: 'prime-field-hint',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: block;
      font-size: 0.85rem;
      line-height: 1.2;
      color: var(--p-text-muted-color, #6b7280);
    }
  `,
  template: `<ng-content />`,
})
export class PrimeFieldHintComponent {}
