import { Directive, input } from '@angular/core';

/**
 * Attribute directive that transforms NgxSignalFormFieldWrapperComponent into ann outlined/outlined/floating label layout.
 *
 * Applies modern outlined input styling where the label appears inside the input container,
 * matching contemporary design patterns like Material Design 3 outlined inputs and similar systems.
 *
 * Key features:
 * - Container-based focus styling (uses CSS :has() selector)
 * - Label sits inside input container above the value
 * - Automatic required asterisk via CSS
 * - WCAG-compliant focus indicators on container
 * - Works with manual label content projection
 *
 * @example Basic outlined field
 * ```html
 * <ngx-signal-form-field-wrapper [formField]="form.email" outline>
 *   <label for="email">Email Address</label>
 *   <input id="email" type="email" [formField]="form.email" required placeholder="you@example.com" />
 * </ngx-signal-form-field-wrapper>
 * ```
 *
 * @example Hide required marker
 * ```html
 * <ngx-signal-form-field-wrapper [formField]="form.email" outline [showRequiredMarker]="false">
 *   <label for="email">Email Address</label>
 *   <input id="email" type="email" [formField]="form.email" required placeholder="you@example.com" />
 * </ngx-signal-form-field-wrapper>
 * ```
 *
 * @example Custom required marker
 * ```html
 * <ngx-signal-form-field-wrapper [formField]="form.email" outline requiredMarker="(required)">
 *   <label for="email">Email Address</label>
 *   <input id="email" type="email" [formField]="form.email" required placeholder="you@example.com" />
 * </ngx-signal-form-field-wrapper>
 * ```
 *
 * Note: By default, the required marker (*) is shown when the input has
 * the 'required' attribute or 'aria-required="true"'. Use [showRequiredMarker]="false"
 * to hide it, or provide a custom requiredMarker string.
 *
 * @example With character count
 * ```html
 * <ngx-signal-form-field-wrapper [formField]="form.bio" outline>
 *   <label for="bio">Bio</label>
 *   <textarea id="bio" [formField]="form.bio"></textarea>
 *   <ngx-signal-form-field-wrapper-character-count [formField]="form.bio" [maxLength]="500" />
 * </ngx-signal-form-field-wrapper>
 * ```
 *
 * @example With hint text
 * ```html
 * <ngx-signal-form-field-wrapper [formField]="form.phone" outline>
 *   <label for="phone">Phone Number</label>
 *   <input id="phone" [formField]="form.phone" required />
 *   <ngx-signal-form-field-wrapper-hint>Format: 123-456-7890</ngx-signal-form-field-wrapper-hint>
 * </ngx-signal-form-field-wrapper>
 * ```
 *
 * Browser Support:
 * - Requires CSS :has() selector (Chrome 105+, Firefox 121+, Safari 15.4+, Edge 105+)
 * - 95%+ global browser support as of 2025
 *
 * Accessibility:
 * - Focus state applied to container meets WCAG 2.2 Level AA
 * - Input outline removed safely (container provides visible focus indicator)
 * - Required fields automatically detected via CSS :has() selector
 * - Required asterisk (*) shown when input has 'required' or 'aria-required="true"'
 * - No duplicate required attributes needed
 *
 * Customization:
 * Use CSS custom properties to theme the outlined field appearance:
 *
 * @example Custom styling
 * ```css
 * :root {
 *   --ngx-form-field-outline-padding: 0.5rem 0.75rem;
 *   --ngx-form-field-outline-bg: #ffffff;
 *   --ngx-form-field-outline-border: 1px solid rgba(50, 65, 85, 0.25);
 *   --ngx-form-field-outline-border-radius: 0.25rem;
 *   --ngx-form-field-outline-min-height: 3.5rem;
 *
 *   --ngx-form-field-outline-label-font-size: 0.75rem;
 *   --ngx-form-field-outline-label-color: rgba(71, 91, 119, 0.75);
 *
 *   --ngx-form-field-outline-input-font-size: 0.875rem;
 *   --ngx-form-field-outline-input-color: #324155;
 *
 *   --ngx-form-field-outline-focus-border-color: #005fcc;
 *   --ngx-form-field-outline-focus-box-shadow: 0 0 0 2px rgba(0, 95, 204, 0.25);
 * }
 * ```
 */
@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: 'ngx-signal-form-field-wrapper[outline]',
  standalone: true,
  host: {
    '[class.ngx-signal-forms-outline]': 'true',
    '[attr.data-show-required]': 'showRequiredMarker() ? "true" : null',
    '[attr.data-required-marker]': 'requiredMarker()',
  },
})
export class NgxFloatingLabelDirective {
  /**
   * Whether to show the required marker (asterisk or custom character) for required fields.
   * @default true
   */
  readonly showRequiredMarker = input<boolean>(true);

  /**
   * Custom character(s) to display for required fields.
   * @default ' *'
   */
  readonly requiredMarker = input<string>(' *');
}
