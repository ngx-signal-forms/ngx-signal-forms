import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Assistive content row container for form fields.
 *
 * Provides a fixed-height container that holds assistive content (hints, errors, warnings)
 * on the left and supplementary content (character count) on the right.
 *
 * Key features:
 * - Fixed min-height prevents layout shift when content (e.g., errors) appears
 * - Flexbox layout with space-between for proper alignment
 * - Content projection slots for left (assistive) and right (supplementary) content
 * - Themeable via CSS custom properties
 *
 * Layout structure (matches Figma design node 2017:704):
 * ```
 * ┌──────────────────────────────────────────────────────┐
 * │ [assistive text & errors]          [character count] │
 * └──────────────────────────────────────────────────────┘
 * ```
 *
 * @example Basic usage with hint and character count
 * ```html
 * <ngx-form-field-assistive-row>
 *   <ngx-form-field-hint>Format: 123-456-7890</ngx-form-field-hint>
 *   <ngx-form-field-character-count [formField]="form.phone" [maxLength]="14" />
 * </ngx-form-field-assistive-row>
 * ```
 *
 * @example With error component
 * ```html
 * <ngx-form-field-assistive-row>
 *   <ngx-signal-form-error [formField]="form.email" />
 *   <ngx-form-field-character-count [formField]="form.email" [maxLength]="100" />
 * </ngx-form-field-assistive-row>
 * ```
 *
 * @example Hint only (no character count)
 * ```html
 * <ngx-form-field-assistive-row>
 *   <ngx-form-field-hint>Enter your full legal name</ngx-form-field-hint>
 * </ngx-form-field-assistive-row>
 * ```
 *
 * Customization:
 * Use CSS custom properties to theme the assistive row:
 *
 * ```css
 * :root {
 *   --ngx-form-field-assistive-min-height: 1.25rem;
 *   --ngx-form-field-assistive-gap: 0.5rem;
 *   --ngx-form-field-assistive-margin-top: 2px;
 * }
 * ```
 *
 * Accessibility notes:
 * - Content within this row should be linked to the input via aria-describedby
 * - Ensure sufficient color contrast for all text content
 * - Error messages should have aria-live="polite" for screen reader announcements
 */
@Component({
  selector: 'ngx-signal-form-field-assistive-row',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ngx-form-field-assistive-row__left">
      <ng-content />
    </div>
    <div class="ngx-form-field-assistive-row__right">
      <ng-content select="ngx-form-field-character-count, [characterCount]" />
    </div>
  `,
  styles: `
    :host {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: var(--ngx-form-field-assistive-gap, 0.5rem);
      min-height: var(--ngx-form-field-assistive-min-height, 1.25rem);
      margin-top: var(--ngx-form-field-assistive-margin-top, 2px);
      width: 100%;
    }

    .ngx-form-field-assistive-row__left {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-width: 0;
    }

    .ngx-form-field-assistive-row__right {
      display: flex;
      align-items: flex-start;
      flex-shrink: 0;
    }

    /* Hide empty slots to prevent unnecessary spacing */
    .ngx-form-field-assistive-row__left:empty,
    .ngx-form-field-assistive-row__right:empty {
      display: none;
    }
  `,
  host: {
    '[attr.align]': 'align() ?? null',
  },
})
export class NgxFormFieldAssistiveRowComponent {
  /**
   * Vertical alignment of content within the row.
   *
   * @default 'start'
   */
  readonly align = input<'start' | 'center' | 'end'>('start');
}
