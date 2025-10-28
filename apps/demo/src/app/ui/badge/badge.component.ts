import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type BadgeVariant = 'solid' | 'outline' | 'ghost';
export type BadgeAppearance =
  | 'neutral'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger';

@Component({
  selector: 'ngx-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'badgeClasses()',
    '[attr.data-variant]': 'variant()',
    '[attr.data-appearance]': 'appearance()',
  },
  template: `<ng-content></ng-content>`,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 0.375rem; /* 6px */
      padding: 0.25rem 0.5rem; /* 4px 8px */
      font-family: 'Inter Variable', sans-serif;
      font-size: 0.75rem; /* 12px */
      font-weight: 400;
      line-height: 1rem; /* 16px */
      white-space: nowrap;
    }
  `,
})
export class BadgeComponent {
  variant = input<BadgeVariant>('solid');
  appearance = input<BadgeAppearance>('neutral');

  protected badgeClasses = () => {
    const variant = this.variant();
    const appearance = this.appearance();

    const baseClasses = 'inline-flex items-center justify-center gap-1'; // gap-1 = 4px

    // Solid variant classes
    const solidClasses: Record<BadgeAppearance, string> = {
      neutral: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
      info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      success:
        'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      warning:
        'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
      danger: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    };

    // Outline variant classes
    const outlineClasses: Record<BadgeAppearance, string> = {
      neutral:
        'bg-transparent border border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300',
      info: 'bg-transparent border border-blue-500 text-blue-700 dark:border-blue-400 dark:text-blue-300',
      success:
        'bg-transparent border border-green-500 text-green-700 dark:border-green-400 dark:text-green-300',
      warning:
        'bg-transparent border border-amber-500 text-amber-700 dark:border-amber-400 dark:text-amber-300',
      danger:
        'bg-transparent border border-red-500 text-red-700 dark:border-red-400 dark:text-red-300',
    };

    // Ghost variant classes
    const ghostClasses: Record<BadgeAppearance, string> = {
      neutral: 'bg-transparent text-gray-700 dark:text-gray-300',
      info: 'bg-transparent text-blue-700 dark:text-blue-300',
      success: 'bg-transparent text-green-700 dark:text-green-300',
      warning: 'bg-transparent text-amber-700 dark:text-amber-300',
      danger: 'bg-transparent text-red-700 dark:text-red-300',
    };

    let variantClass = '';
    if (variant === 'solid') {
      variantClass = solidClasses[appearance];
    } else if (variant === 'outline') {
      variantClass = outlineClasses[appearance];
    } else if (variant === 'ghost') {
      variantClass = ghostClasses[appearance];
    }

    return `${baseClasses} ${variantClass}`;
  };
}
