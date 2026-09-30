import { Component, input } from '@angular/core';

@Component({
  selector: 'ngx-page-header',

  // `tabindex="-1"` lets the shell move focus here after a route change, so a
  // screen reader announces the new page (#571). It keeps the heading out of
  // the Tab order.
  template: `
    <header class="mb-8 text-center">
      <h1 class="page-title" tabindex="-1">{{ title() }}</h1>
      @if (subtitle(); as sub) {
        <p class="page-subtitle">{{ sub }}</p>
      }
    </header>
  `,
})
export class PageHeaderComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>();
}
