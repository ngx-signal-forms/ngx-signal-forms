import { Directive } from '@angular/core';

/**
 * Directive for badge icons following Figma design specifications.
 *
 * Design specs:
 * - Icon container: 16×16px
 * - Inner SVG: ~11px (10.667px)
 * - Gap from text: 4px (handled by badge component)
 *
 * Usage:
 * ```html
 * <ngx-badge variant="solid" appearance="success">
 *   <svg ngxBadgeIcon class="stroke-current" viewBox="0 0 16 16">
 *     <circle cx="8" cy="8" r="5.5" />
 *   </svg>
 *   Valid
 * </ngx-badge>
 * ```
 */
@Directive({
  selector: '[ngxBadgeIcon]',
  standalone: true,
  host: {
    class: 'h-4 w-4 shrink-0', // 16px container, don't shrink in flex
  },
})
export class BadgeIconDirective {}
