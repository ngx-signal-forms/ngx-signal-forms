import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'ngx-split-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,

  styles: `
    :host {
      display: block;
    }
  `,
  template: `
    <!-- Pages put their section headings (h3) inside the example; this
         keeps the outline h1 → h2 → h3 for screen-reader navigation. -->
    <h2 class="sr-only">{{ heading() }}</h2>
    <div class="grid grid-cols-1 items-start gap-8 lg:grid-cols-2">
      <div class="w-full min-w-0">
        <ng-content select="[left]" />
      </div>
      <div class="w-full min-w-0">
        <ng-content select="[right]" />
      </div>
    </div>
  `,
})
export class SplitLayoutComponent {
  /** Visually hidden heading for the example region. */
  readonly heading = input('Live example');
}
