import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'ngx-page-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="mb-8 text-center">
      <h1 class="page-title">{{ title() }}</h1>
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
