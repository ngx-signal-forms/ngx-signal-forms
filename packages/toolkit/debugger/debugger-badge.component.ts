import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  input,
} from '@angular/core';

export type DebuggerBadgeVariant = 'solid' | 'outline' | 'ghost';
export type DebuggerBadgeAppearance =
  | 'neutral'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger';

/**
 * Icon directive for debugger badges.
 * Apply to SVG elements to style them correctly within badges.
 *
 * ## Spinner variant
 *
 * Add the `ngx-debugger-badge__icon--spin` modifier class to run the
 * shared `ngx-debugger-spin` keyframe animation (1s linear infinite).
 * This is how the debugger renders the pending-validation indicator.
 *
 * @example Plain icon
 * ```html
 * <ngx-signal-form-debugger-badge>
 *   <svg ngxSignalFormDebuggerBadgeIcon fill="none" stroke="currentColor" viewBox="0 0 16 16">
 *     <circle cx="8" cy="8" r="5.5" />
 *   </svg>
 *   Status
 * </ngx-signal-form-debugger-badge>
 * ```
 *
 * @example Animated spinner
 * ```html
 * <ngx-signal-form-debugger-badge appearance="info">
 *   <svg
 *     ngxSignalFormDebuggerBadgeIcon
 *     class="ngx-debugger-badge__icon--spin"
 *     fill="none"
 *     stroke="currentColor"
 *     viewBox="0 0 16 16"
 *   >
 *     <circle cx="8" cy="8" r="5.5" stroke-dasharray="20 12" />
 *   </svg>
 *   Pending
 * </ngx-signal-form-debugger-badge>
 * ```
 */
@Directive({
  selector: '[ngxSignalFormDebuggerBadgeIcon]',
  host: {
    class: 'ngx-debugger-badge__icon',
  },
})
export class DebuggerBadgeIconDirective {}

/**
 * Internal badge component for the Signal Forms Debugger.
 * Styled with CSS custom properties - no Tailwind dependencies.
 *
 * @example
 * ```html
 * <ngx-signal-form-debugger-badge variant="solid" appearance="success">Valid</ngx-signal-form-debugger-badge>
 * ```
 */
@Component({
  selector: 'ngx-signal-form-debugger-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ngx-debugger-badge',
    '[attr.data-variant]': 'variant()',
    '[attr.data-appearance]': 'appearance()',
  },
  template: ` <ng-content></ng-content> `,
  styles: `
    :host {
      /* Base badge styles */
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.25rem;
      border-radius: var(--ngx-debugger-badge-border-radius, 0.375rem);
      padding: var(--ngx-debugger-badge-padding-y, 0.25rem)
        var(--ngx-debugger-badge-padding-x, 0.5rem);
      font-family: var(
        --ngx-debugger-font-family,
        system-ui,
        -apple-system,
        sans-serif
      );
      font-size: var(--ngx-debugger-badge-font-size, 0.75rem);
      font-weight: var(--ngx-debugger-badge-font-weight, 500);
      line-height: var(--ngx-debugger-badge-line-height, 1rem);
      white-space: nowrap;
      border: 1px solid transparent;
      transition:
        background-color 0.15s ease,
        border-color 0.15s ease,
        color 0.15s ease;
    }

    /* Icon styling */
    :host .ngx-debugger-badge__icon {
      width: var(--ngx-debugger-badge-icon-size, 0.875rem);
      height: var(--ngx-debugger-badge-icon-size, 0.875rem);
      flex-shrink: 0;
    }

    /* ============================================ */
    /* SOLID VARIANT                                */
    /* ============================================ */

    :host([data-variant='solid'][data-appearance='neutral']) {
      background-color: var(--ngx-debugger-badge-neutral-bg, #f3f4f6);
      color: var(--ngx-debugger-badge-neutral-text, #374151);
    }

    :host([data-variant='solid'][data-appearance='info']) {
      background-color: var(--ngx-debugger-badge-info-bg, #dbeafe);
      color: var(--ngx-debugger-badge-info-text, #1e40af);
    }

    :host([data-variant='solid'][data-appearance='success']) {
      background-color: var(--ngx-debugger-badge-success-bg, #dcfce7);
      color: var(--ngx-debugger-badge-success-text, #166534);
    }

    :host([data-variant='solid'][data-appearance='warning']) {
      background-color: var(--ngx-debugger-badge-warning-bg, #fef3c7);
      color: var(--ngx-debugger-badge-warning-text, #92400e);
    }

    :host([data-variant='solid'][data-appearance='danger']) {
      background-color: var(--ngx-debugger-badge-danger-bg, #fee2e2);
      color: var(--ngx-debugger-badge-danger-text, #991b1b);
    }

    /* ============================================ */
    /* OUTLINE VARIANT                              */
    /* ============================================ */

    :host([data-variant='outline']) {
      background-color: transparent;
    }

    :host([data-variant='outline'][data-appearance='neutral']) {
      border-color: var(--ngx-debugger-badge-neutral-border, #d1d5db);
      color: var(--ngx-debugger-badge-neutral-text, #374151);
    }

    :host([data-variant='outline'][data-appearance='info']) {
      border-color: var(--ngx-debugger-badge-info-border, #3b82f6);
      color: var(--ngx-debugger-badge-info-text, #1e40af);
    }

    :host([data-variant='outline'][data-appearance='success']) {
      border-color: var(--ngx-debugger-badge-success-border, #22c55e);
      color: var(--ngx-debugger-badge-success-text, #166534);
    }

    :host([data-variant='outline'][data-appearance='warning']) {
      border-color: var(--ngx-debugger-badge-warning-border, #f59e0b);
      color: var(--ngx-debugger-badge-warning-text, #92400e);
    }

    :host([data-variant='outline'][data-appearance='danger']) {
      border-color: var(--ngx-debugger-badge-danger-border, #ef4444);
      color: var(--ngx-debugger-badge-danger-text, #991b1b);
    }

    /* ============================================ */
    /* GHOST VARIANT                                */
    /* ============================================ */

    :host([data-variant='ghost']) {
      background-color: transparent;
      border-color: transparent;
    }

    :host([data-variant='ghost'][data-appearance='neutral']) {
      color: var(--ngx-debugger-badge-neutral-text, #374151);
    }

    :host([data-variant='ghost'][data-appearance='info']) {
      color: var(--ngx-debugger-badge-info-text, #1e40af);
    }

    :host([data-variant='ghost'][data-appearance='success']) {
      color: var(--ngx-debugger-badge-success-text, #166534);
    }

    :host([data-variant='ghost'][data-appearance='warning']) {
      color: var(--ngx-debugger-badge-warning-text, #92400e);
    }

    :host([data-variant='ghost'][data-appearance='danger']) {
      color: var(--ngx-debugger-badge-danger-text, #991b1b);
    }

    /* ============================================ */
    /* DARK MODE SUPPORT (class-based)              */
    /* ============================================ */

    :host-context(.dark) {
      --ngx-debugger-badge-neutral-bg: var(
        --ngx-debugger-badge-neutral-bg-dark,
        #374151
      );
      --ngx-debugger-badge-neutral-text: var(
        --ngx-debugger-badge-neutral-text-dark,
        #e5e7eb
      );
      --ngx-debugger-badge-info-bg: var(
        --ngx-debugger-badge-info-bg-dark,
        rgba(59, 130, 246, 0.2)
      );
      --ngx-debugger-badge-info-text: var(
        --ngx-debugger-badge-info-text-dark,
        #93c5fd
      );
      --ngx-debugger-badge-success-bg: var(
        --ngx-debugger-badge-success-bg-dark,
        rgba(34, 197, 94, 0.2)
      );
      --ngx-debugger-badge-success-text: var(
        --ngx-debugger-badge-success-text-dark,
        #86efac
      );
      --ngx-debugger-badge-warning-bg: var(
        --ngx-debugger-badge-warning-bg-dark,
        rgba(245, 158, 11, 0.2)
      );
      --ngx-debugger-badge-warning-text: var(
        --ngx-debugger-badge-warning-text-dark,
        #fcd34d
      );
      --ngx-debugger-badge-danger-bg: var(
        --ngx-debugger-badge-danger-bg-dark,
        rgba(239, 68, 68, 0.2)
      );
      --ngx-debugger-badge-danger-text: var(
        --ngx-debugger-badge-danger-text-dark,
        #fca5a5
      );

      --ngx-debugger-badge-neutral-border: var(
        --ngx-debugger-badge-neutral-border-dark,
        #4b5563
      );
      --ngx-debugger-badge-info-border: var(
        --ngx-debugger-badge-info-border-dark,
        #60a5fa
      );
      --ngx-debugger-badge-success-border: var(
        --ngx-debugger-badge-success-border-dark,
        #4ade80
      );
      --ngx-debugger-badge-warning-border: var(
        --ngx-debugger-badge-warning-border-dark,
        #fbbf24
      );
      --ngx-debugger-badge-danger-border: var(
        --ngx-debugger-badge-danger-border-dark,
        #f87171
      );
    }

    /* Spinning animation for pending states */
    :host .ngx-debugger-badge__icon.ngx-debugger-badge__icon--spin {
      animation: ngx-debugger-spin 1s linear infinite;
    }

    @keyframes ngx-debugger-spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }
  `,
})
export class DebuggerBadgeComponent {
  readonly variant = input<DebuggerBadgeVariant>('solid');
  readonly appearance = input<DebuggerBadgeAppearance>('neutral');
}
