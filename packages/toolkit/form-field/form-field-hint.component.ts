import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Form field hint component for displaying helper text.
 *
 * Provides visual guidance and instructions without blocking form submission.
 * Commonly used for format examples, field instructions, or contextual help.
 *
 * Key features:
 * - Content projection for flexible hint text
 * - Semantic HTML for accessibility
 * - Themeable via CSS custom properties
 * - Optional position control (left/right alignment)
 *
 * @example Basic hint text
 * ```html
 * <ngx-signal-form-field-wrapper [formField]="form.phone">
 *   <label for="phone">Phone Number</label>
 *   <input id="phone" [formField]="form.phone" />
 *   <ngx-signal-form-field-wrapper-hint>
 *     Format: 123-456-7890
 *   </ngx-signal-form-field-wrapper-hint>
 * </ngx-signal-form-field-wrapper>
 * ```
 *
 * @example With position control
 * ```html
 * <ngx-signal-form-field-wrapper-hint position="left">
 *   Use at least 8 characters
 * </ngx-signal-form-field-wrapper-hint>
 * ```
 *
 * @example Rich content
 * ```html
 * <ngx-signal-form-field-wrapper-hint>
 *   <strong>Tip:</strong> Use keywords that describe your product
 * </ngx-signal-form-field-wrapper-hint>
 * ```
 *
 * Customization:
 * Use CSS custom properties to theme hint appearance:
 *
 * ```css
 * :root {
 *   --ngx-form-field-hint-font-size: 0.75rem;
 *   --ngx-form-field-hint-line-height: 1rem;
 *   --ngx-form-field-hint-color: rgba(71, 91, 119, 0.75);
 *   --ngx-form-field-hint-margin-top: 0.25rem;
 * }
 * ```
 *
 * Accessibility:
 * - Use semantic text content (avoid decorative images without alt text)
 * - Ensure sufficient color contrast (4.5:1 minimum)
 * - Consider using aria-describedby to link hint to input (handled by parent component)
 */
@Component({
  selector: 'ngx-signal-form-field-wrapper-hint',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ngx-form-field-hint">
      <ng-content />
    </div>
  `,
  styles: `
    .ngx-form-field-hint {
      font-size: var(
        --ngx-form-field-hint-font-size,
        var(--ngx-signal-form-feedback-font-size, 0.75rem)
      );
      line-height: var(
        --ngx-form-field-hint-line-height,
        var(--ngx-signal-form-feedback-line-height, 1.25)
      );
      color: var(--ngx-form-field-hint-color, rgba(71, 91, 119, 0.75));
      margin-top: var(
        --ngx-form-field-hint-margin-top,
        var(--ngx-signal-form-feedback-margin-top, 0.25rem)
      );
    }

    :host([position='left']) .ngx-form-field-hint {
      text-align: left;
    }

    :host([position='right']) .ngx-form-field-hint {
      text-align: right;
    }
  `,
  host: {
    '[attr.position]': 'position() ?? null',
  },
})
export class NgxSignalFormFieldHintComponent {
  /**
   * Text alignment position.
   *
   * @default undefined (inherits from parent)
   */
  readonly position = input<'left' | 'right' | null>(null);
}
