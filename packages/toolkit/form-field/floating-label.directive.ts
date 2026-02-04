import { Directive } from '@angular/core';

/**
 * Attribute directive for backward compatibility with the `outline` boolean attribute.
 *
 * **Note**: The `outline` attribute is maintained for backward compatibility.
 * The recommended approach is to use the `appearance` input on `ngx-signal-form-field-wrapper`:
 *
 * ```html
 * <!-- Recommended: Use appearance input -->
 * <ngx-signal-form-field-wrapper [formField]="form.email" appearance="outline">
 *   <label for="email">Email Address</label>
 *   <input id="email" [formField]="form.email" />
 * </ngx-signal-form-field-wrapper>
 * ```
 *
 * The `outline` boolean attribute still works but `appearance="outline"` is preferred:
 *
 * ```html
 * <!-- Legacy: Still works via component's outline input -->
 * <ngx-signal-form-field-wrapper [formField]="form.email" outline>
 *   <label for="email">Email Address</label>
 *   <input id="email" [formField]="form.email" />
 * </ngx-signal-form-field-wrapper>
 * ```
 *
 * Applies modern outlined input styling where the label appears inside the input container,
 * matching contemporary design patterns like Material Design 3 outlined inputs.
 *
 * Key features:
 * - Container-based focus styling (uses CSS :has() selector)
 * - Label sits inside input container above the value
 * - Automatic required asterisk via CSS
 * - WCAG-compliant focus indicators on container
 * - Works with manual label content projection
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
 *
 * @deprecated The `outline` attribute is maintained for backward compatibility.
 * Use `appearance="outline"` instead for consistency with Angular Material.
 */
@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: 'ngx-signal-form-field-wrapper[outline]',
  standalone: true,
  host: {
    '[class.ngx-signal-forms-outline]': 'true',
  },
})
export class NgxFloatingLabelDirective {}
