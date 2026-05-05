import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Hint renderer dispatched by `NgxFormFieldHint` via `NGX_FORM_FIELD_HINT_RENDERER`.
 *
 * Wraps projected hint content in a `<span>` that applies Material's hint
 * typography class (`mat-mdc-form-field-hint`). The slot is left as
 * `<ng-content />` so consumers can project arbitrary HTML — matching what
 * `<mat-hint>` does internally.
 *
 * Registered globally by `provideNgxMatForms()` for `NGX_FORM_FIELD_HINT_RENDERER`.
 */
@Component({
  selector: 'ngx-material-hint-renderer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  styles: `
    :host {
      display: block;
      font-size: 0.75rem;
      line-height: 1rem;
      color: var(--mat-form-field-subscript-text-color, rgba(0, 0, 0, 0.6));
    }
  `,
})
export class MaterialHintRenderer {}
