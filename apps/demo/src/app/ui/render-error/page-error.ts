import {
  afterNextRender,
  Component,
  ElementRef,
  output,
  viewChild,
} from '@angular/core';

/**
 * Shown by the app shell's `@boundary` in place of a page that threw while it
 * rendered.
 *
 * The page it replaces is gone, and focus may have gone with it, so the
 * heading takes focus once it renders. The message is the heading's
 * description, so a screen reader announces both on focus. The heading has
 * `tabindex="-1"`, like every page heading, so the shell's focus-on-navigation
 * behaviour also lands here.
 */
@Component({
  selector: 'ngx-page-error',
  template: `
    <header class="mb-8 text-center">
      <h1
        #heading
        class="page-title"
        tabindex="-1"
        aria-describedby="page-error-message"
      >
        This page could not be shown
      </h1>
      <p id="page-error-message" class="page-subtitle">
        Something went wrong while this page was rendering. Try again, or choose
        another example in the navigation.
      </p>
    </header>
    <p class="text-center">
      <button type="button" class="btn-primary" (click)="retry.emit()">
        Try again
      </button>
    </p>
  `,
})
export class PageErrorComponent {
  /** Emits when the visitor asks to render the page again. */
  readonly retry = output();

  // TS `private`, not `#`: see the note on AppComponent's queries.
  private readonly heading =
    viewChild.required<ElementRef<HTMLHeadingElement>>('heading');

  constructor() {
    afterNextRender(() => {
      this.heading().nativeElement.focus({ preventScroll: true });
    });
  }
}
