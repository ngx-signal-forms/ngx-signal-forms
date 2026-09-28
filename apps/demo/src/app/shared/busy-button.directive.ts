import { Directive, input } from '@angular/core';

/**
 * Blocks a button while work is in flight without `[disabled]`.
 *
 * A disabled button drops keyboard focus to `<body>` the moment the submit
 * starts, so keyboard and screen-reader users lose their place. This keeps
 * the button focusable, marks it `aria-disabled="true"` (the global
 * `.btn-*` styles give it the disabled look), and swallows clicks, which
 * also stops implicit form submission from Enter.
 *
 * @example
 * <button type="submit" class="btn-primary" [ngxBusy]="form().submitting()">
 */
@Directive({
  selector: 'button[ngxBusy]',
  host: {
    '[attr.aria-disabled]': "ngxBusy() ? 'true' : null",
    '(click)': 'onClick($event)',
  },
})
export class BusyButtonDirective {
  readonly ngxBusy = input.required<boolean>();

  protected onClick(event: Event): void {
    if (this.ngxBusy()) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }
}
