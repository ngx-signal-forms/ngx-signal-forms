import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'ngx-split-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: block;
    }
  `,
  template: `
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
export class SplitLayoutComponent {}
