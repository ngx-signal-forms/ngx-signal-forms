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
 *   <ngx-form-field-hint>
 *     Format: 123-456-7890
 *   </ngx-form-field-hint>
 * </ngx-signal-form-field-wrapper>
 * ```
 *
 * @example With position control
 * ```html
 * <ngx-form-field-hint position="left">
 *   Use at least 8 characters
 * </ngx-form-field-hint>
 * ```
 *
 * @example Rich content
 * ```html
 * <ngx-form-field-hint>
 *   <strong>Tip:</strong> Use keywords that describe your product
 * </ngx-form-field-hint>
 * ```
 *
 * Customization:
 * Use CSS custom properties to theme hint appearance:
 *
 * ```css
 * :root {
 *   --ngx-form-field-hint-font-size: 0.75rem;
 *   --ngx-form-field-hint-line-height: 1rem;
 *   --ngx-form-field-hint-color: rgba(50, 65, 85, 0.75);
 * }
 * ```
 *
 * Accessibility:
 * - Use semantic text content (avoid decorative images without alt text)
 * - Ensure sufficient color contrast (4.5:1 minimum)
 * - Consider using aria-describedby to link hint to input (handled by parent component)
 */
@Component({
  selector: 'ngx-signal-form-field-hint',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  styles: `
    :host {
      display: block;
      font-size: var(--ngx-form-field-hint-font-size, 0.75rem);
      line-height: var(--ngx-form-field-hint-line-height, 1rem);
      color: var(--ngx-form-field-hint-color, rgba(50, 65, 85, 0.75));
      padding-left: var(--ngx-form-field-hint-padding-horizontal, 0.5rem);
      padding-right: var(--ngx-form-field-hint-padding-horizontal, 0.5rem);
      text-align: var(--ngx-form-field-hint-align, right);
    }

    :host([position='left']) {
      text-align: left;
    }

    :host([position='right']) {
      text-align: right;
    }
  `,
  host: {
    '[attr.position]': 'position() ?? null',
  },
})
export class NgxFormFieldHintComponent {
  /**
   * Text alignment position.
   *
   * @default undefined (defaults to right-aligned, or left-aligned if character count is present)
   */
  readonly position = input<'left' | 'right' | null>(null);
}
