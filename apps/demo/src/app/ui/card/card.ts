import { Component, input } from '@angular/core';

@Component({
  selector: 'ngx-card',

  host: {
    '[class]':
      "'block rounded-xl shadow-sm ' + (variant() === 'primary-outline' ? 'border border-indigo-300 dark:border-indigo-500' : variant() === 'educational' ? 'bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20' : '')",
  },
  template: `
    <div
      class="ngx-card__inner flex flex-col gap-4 rounded-xl p-6 dark:bg-gray-800"
    >
      <ng-content></ng-content>
    </div>
  `,
})
export class CardComponent {
  variant = input<'default' | 'primary-outline' | 'educational'>('default');
  labelledBy = input<string | null>(null);
}
