import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import type { FieldTree } from '@angular/forms/signals';

/**
 * Form field character count component with progressive color states.
 *
 * Displays current/maximum character count with visual feedback as the limit is approached.
 * Color progression indicates usage level: ok → warning → danger → exceeded.
 *
 * Key features:
 * - Reactive character counting from form field
 * - Progressive color states (configurable thresholds)
 * - Optional disable color progression
 * - Themeable via CSS custom properties
 * - Position control (left/right alignment)
 *
 * @template TValue The type of the field value (must be compatible with string length check)
 *
 * @example Basic character count
 * ```html
 * <ngx-signal-form-field [field]="form.bio">
 *   <label for="bio">Bio</label>
 *   <textarea id="bio" [field]="form.bio"></textarea>
 *   <ngx-signal-form-field-character-count
 *     [field]="form.bio"
 *     [maxLength]="500"
 *   />
 * </ngx-signal-form-field>
 * ```
 *
 * @example Left-aligned
 * ```html
 * <ngx-signal-form-field-character-count
 *   [field]="form.tweet"
 *   [maxLength]="280"
 *   position="left"
 * />
 * ```
 *
 * @example Disable color progression
 * ```html
 * <ngx-signal-form-field-character-count
 *   [field]="form.message"
 *   [maxLength]="1000"
 *   [showLimitColors]="false"
 * />
 * ```
 *
 * @example Custom thresholds
 * ```html
 * <ngx-signal-form-field-character-count
 *   [field]="form.description"
 *   [maxLength]="500"
 *   [colorThresholds]="{ warning: 90, danger: 98 }"
 * />
 * ```
 *
 * Color States:
 * - **ok**: 0-80% of limit (default gray)
 * - **warning**: 80-95% of limit (default amber)
 * - **danger**: 95-100% of limit (default red)
 * - **exceeded**: >100% of limit (default dark red, bold)
 *
 * Customization:
 * Use CSS custom properties to theme character count appearance:
 *
 * ```css
 * :root {
 *   --ngx-form-field-char-count-font-size: 0.75rem;
 *   --ngx-form-field-char-count-line-height: 1rem;
 *
 *   // Color states (0-80%)
 *   --ngx-form-field-char-count-color-ok: #6b7280;
 *
 *   // Warning state (80-95%)
 *   --ngx-form-field-char-count-color-warning: #f59e0b;
 *
 *   // Danger state (95-100%)
 *   --ngx-form-field-char-count-color-danger: #dc2626;
 *
 *   // Exceeded state (>100%)
 *   --ngx-form-field-char-count-color-exceeded: #991b1b;
 *   --ngx-form-field-char-count-weight-exceeded: 700;
 * }
 * ```
 *
 * Accessibility:
 * - Ensure color is not the only indicator (text content also changes)
 * - Color contrast meets WCAG 2.2 Level AA (4.5:1 minimum)
 * - Consider announcing state changes for screen readers (future enhancement)
 */
@Component({
  selector: 'ngx-signal-form-field-character-count',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="ngx-form-field-char-count"
      [attr.data-limit-state]="limitState()"
    >
      {{ characterCountText() }}
    </div>
  `,
  styles: `
    .ngx-form-field-char-count {
      font-size: var(--ngx-form-field-char-count-font-size, 0.75rem);
      line-height: var(--ngx-form-field-char-count-line-height, 1rem);
      color: var(--ngx-form-field-char-count-color-ok, rgba(71, 91, 119, 0.75));
      margin-top: var(--ngx-form-field-char-count-margin-top, 0.25rem);
      transition:
        color 0.2s ease,
        font-weight 0.2s ease;
      white-space: nowrap;
    }

    :host([position='left']) .ngx-form-field-char-count {
      text-align: left;
    }

    :host([position='right']) .ngx-form-field-char-count {
      text-align: right;
    }

    /* Color progression states */
    .ngx-form-field-char-count[data-limit-state='ok'] {
      color: var(--ngx-form-field-char-count-color-ok, rgba(71, 91, 119, 0.75));
    }

    .ngx-form-field-char-count[data-limit-state='warning'] {
      color: var(--ngx-form-field-char-count-color-warning, #f59e0b);
    }

    .ngx-form-field-char-count[data-limit-state='danger'] {
      color: var(--ngx-form-field-char-count-color-danger, #dc2626);
    }

    .ngx-form-field-char-count[data-limit-state='exceeded'] {
      color: var(--ngx-form-field-char-count-color-exceeded, #991b1b);
      font-weight: var(--ngx-form-field-char-count-weight-exceeded, 600);
    }

    /* Disabled color progression */
    .ngx-form-field-char-count[data-limit-state='disabled'] {
      color: var(--ngx-form-field-char-count-color-ok, rgba(71, 91, 119, 0.75));
    }
  `,
  host: {
    '[attr.position]': 'position()',
  },
})
export class NgxSignalFormFieldCharacterCountComponent<TValue = unknown> {
  /**
   * Form field to track character count from.
   * Must contain a value compatible with string length calculation.
   */
  readonly field = input.required<FieldTree<TValue>>();

  /**
   * Maximum character length for the field.
   */
  readonly maxLength = input.required<number>();

  /**
   * Text alignment position.
   *
   * @default 'right'
   */
  readonly position = input<'left' | 'right'>('right');

  /**
   * Enable/disable color progression based on character limit.
   *
   * When disabled, the character count displays in the default color
   * regardless of how close to the limit the user is.
   *
   * @default true
   */
  readonly showLimitColors = input<boolean>(true);

  /**
   * Percentage thresholds for color state changes.
   *
   * - `warning`: Percentage at which color changes to warning (default: 80%)
   * - `danger`: Percentage at which color changes to danger (default: 95%)
   *
   * @default { warning: 80, danger: 95 }
   */
  readonly colorThresholds = input<{ warning: number; danger: number }>({
    warning: 80,
    danger: 95,
  });

  /**
   * Current character length from the field value.
   */
  protected readonly currentLength = computed(() => {
    const fieldValue = this.field();
    const value = fieldValue().value();
    return typeof value === 'string' ? value.length : 0;
  });

  /**
   * Formatted character count text (e.g., "42/500").
   */
  protected readonly characterCountText = computed(() => {
    const current = this.currentLength();
    const max = Math.max(0, this.maxLength());
    return `${current}/${max}`;
  });

  /**
   * Current limit state based on percentage of limit used.
   *
   * States:
   * - `disabled`: Color progression is disabled
   * - `ok`: Below warning threshold
   * - `warning`: Between warning and danger thresholds
   * - `danger`: Between danger threshold and 100%
   * - `exceeded`: Above 100% (over limit)
   */
  protected readonly limitState = computed(() => {
    if (!this.showLimitColors()) return 'disabled';

    const max = this.maxLength();
    const current = this.currentLength();
    if (max <= 0) {
      return current > 0 ? 'exceeded' : 'disabled';
    }

    const percentage = (current / max) * 100;
    const thresholds = this.colorThresholds();
    const warningThreshold = Math.max(0, Math.min(100, thresholds.warning));
    const dangerThreshold = Math.max(
      warningThreshold,
      Math.min(100, thresholds.danger),
    );

    if (current > max) return 'exceeded';
    if (percentage >= dangerThreshold) return 'danger';
    if (percentage >= warningThreshold) return 'warning';
    return 'ok';
  });
}
