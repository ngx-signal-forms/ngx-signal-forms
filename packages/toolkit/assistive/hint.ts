import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  signal,
} from '@angular/core';
import {
  createUniqueId,
  NGX_SIGNAL_FORM_FIELD_CONTEXT,
} from '@ngx-signal-forms/toolkit';

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
 * <ngx-form-field-wrapper [formField]="form.phone">
 *   <label for="phone">Phone Number</label>
 *   <input id="phone" [formField]="form.phone" />
 *   <ngx-form-field-hint>
 *     Format: 123-456-7890
 *   </ngx-form-field-hint>
 * </ngx-form-field-wrapper>
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
  selector: 'ngx-form-field-hint',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <ng-content /> `,
  styles: `
    :host {
      display: block;
      font-size: var(--ngx-form-field-hint-font-size, 0.75rem);
      line-height: var(--ngx-form-field-hint-line-height, 1rem);
      color: var(--ngx-form-field-hint-color, rgba(50, 65, 85, 0.75));
      padding-inline-start: var(
        --ngx-form-field-hint-padding-inline-start,
        var(--ngx-form-field-hint-padding-horizontal, 0.5rem)
      );
      padding-inline-end: var(
        --ngx-form-field-hint-padding-inline-end,
        var(--ngx-form-field-hint-padding-horizontal, 0.5rem)
      );
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
    '[attr.id]': 'resolvedId()',
    '[attr.data-ngx-signal-form-hint]': '"true"',
    '[attr.data-signal-field]': 'resolvedFieldName()',
  },
})
export class NgxFormFieldHint {
  readonly #elementRef = inject(ElementRef<HTMLElement>);
  readonly #fieldContext = inject(NGX_SIGNAL_FORM_FIELD_CONTEXT, {
    optional: true,
  });

  readonly #explicitId = signal<string | null>(null);

  /**
   * Text alignment position.
   *
   * @default undefined (defaults to right-aligned, or left-aligned if character count is present)
   */
  readonly position = input<'left' | 'right' | null>(null);

  /**
   * Resolved field name from the wrapper's `NGX_SIGNAL_FORM_FIELD_CONTEXT`,
   * or `null` when the hint is rendered outside a wrapper. Public so wrappers
   * can expose it through `NGX_SIGNAL_FORM_HINT_REGISTRY` for auto-ARIA.
   */
  readonly resolvedFieldName = computed(() => {
    return this.#fieldContext?.fieldName() ?? null;
  });

  /**
   * Stable DOM id used by `aria-describedby`. Public so wrappers can forward
   * it to auto-ARIA via the hint registry without reading the DOM.
   * An empty-string explicit id or fieldName is treated as "not set" and falls through to the generated id.
   */
  readonly resolvedId = computed(() => {
    const explicit = this.#explicitId();
    // oxlint-disable-next-line @typescript-eslint/strict-boolean-expressions -- empty-string id/fieldName is intentionally treated as "not set"; freezing semantic for v1
    if (explicit) return explicit;

    const fieldName = this.resolvedFieldName();
    // oxlint-disable-next-line @typescript-eslint/strict-boolean-expressions -- empty-string id/fieldName is intentionally treated as "not set"; freezing semantic for v1
    if (fieldName) return `${fieldName}-hint`;

    return createUniqueId('hint');
  });

  constructor() {
    // Read the host `id` attribute at construction time so downstream
    // consumers (auto-aria directive, hint registry) see the explicit
    // id synchronously during their own initialisation. Runs on both
    // platforms: Angular's server DOM supports `getAttribute`, and we
    // want the server-rendered `id` to match what the client picks up
    // on hydration (otherwise author-supplied ids would hydrate as a
    // different generated value and the DOM would mismatch).
    const existingId = this.#elementRef.nativeElement.getAttribute('id');
    if (existingId !== null && existingId.length > 0) {
      this.#explicitId.set(existingId);
    }
  }
}
