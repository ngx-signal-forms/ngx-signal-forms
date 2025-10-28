import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  type TemplateRef,
} from '@angular/core';

@Component({
  selector: 'ngx-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  host: {
    '[class]':
      "'block rounded-xl shadow-sm ' + (variant() === 'primary-outline' ? 'border border-indigo-300 dark:border-indigo-500' : variant() === 'educational' ? 'bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20' : '')",
  },
  template: `
    <div
      class="ngx-card__inner flex flex-col gap-4 rounded-xl p-6 dark:bg-gray-800"
    >
      @if (headerTemplate()) {
        <ng-container [ngTemplateOutlet]="headerTemplate()!" />
      }
      <ng-content></ng-content>
    </div>
  `,
})
export class CardComponent {
  variant = input<'default' | 'primary-outline' | 'educational'>('default');
  labelledBy = input<string | null>(null);
  describedBy = input<string | null>(null);

  /// Template for card header (supports @for loops and dynamic content)
  headerTemplate = input<TemplateRef<unknown> | null>(null);
}
