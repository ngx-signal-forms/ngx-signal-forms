import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  signal,
} from '@angular/core';
import type { FieldTree } from '@angular/forms/signals';
import {
  createCharacterCount,
  type CharacterCountLimitState,
} from '@ngx-signal-forms/toolkit/headless';

/**
 * Form field character count component with progressive color states.
 *
 * This styled wrapper uses the headless `createCharacterCount()` utility internally,
 * demonstrating how to build custom character count displays with full styling control.
 *
 * Displays current/maximum character count with visual feedback as the limit is approached.
 * Color progression indicates usage level: ok → warning → danger → exceeded.
 *
 * Key features:
 * - Reactive character counting via headless utility
 * - Progressive color states (configurable thresholds)
 * - Optional disable color progression
 * - Themeable via CSS custom properties
 * - Position control (left/right alignment)
 *
 * @template TValue The type of the field value (must be compatible with string length check)
 *
 * @example Basic character count
 * ```html
 * <ngx-signal-form-field-wrapper [formField]="form.bio">
 *   <label for="bio">Bio</label>
 *   <textarea id="bio" [formField]="form.bio"></textarea>
 *   <ngx-form-field-character-count
 *     [formField]="form.bio"
 *     [maxLength]="500"
 *   />
 * </ngx-signal-form-field-wrapper>
 * ```
 *
 * @example Left-aligned
 * ```html
 * <ngx-form-field-character-count
 *   [formField]="form.tweet"
 *   [maxLength]="280"
 *   position="left"
 * />
 * ```
 *
 * @example Disable color progression
 * ```html
 * <ngx-form-field-character-count
 *   [formField]="form.message"
 *   [maxLength]="1000"
 *   [showLimitColors]="false"
 * />
 * ```
 *
 * @example Custom thresholds
 * ```html
 * <ngx-form-field-character-count
 *   [formField]="form.description"
 *   [maxLength]="500"
 *   [colorThresholds]="{ warning: 90, danger: 98 }"
 * />
 * ```
 *
 * Color States (aligned with Figma design tokens):
 * - **ok**: 0-80% of limit (text/secondary)
 * - **warning**: 80-95% of limit (amber)
 * - **danger**: 95-100% of limit (interaction/danger)
 * - **exceeded**: >100% of limit (darker red, bold)
 *
 * Customization:
 * Use CSS custom properties to theme character count appearance:
 *
 * ```css
 * :root {
 *   --ngx-form-field-char-count-font-size: 0.75rem;
 *   --ngx-form-field-char-count-line-height: 1rem;
 *   --ngx-form-field-char-count-color-ok: rgba(50, 65, 85, 0.75);
 *   --ngx-form-field-char-count-color-warning: #f59e0b;
 *   --ngx-form-field-char-count-color-danger: #db1818;
 *   --ngx-form-field-char-count-color-exceeded: #991b1b;
 *   --ngx-form-field-char-count-weight-exceeded: 600;
 * }
 * ```
 *
 * Accessibility:
 * - Ensure color is not the only indicator (text content also changes)
 * - Color contrast meets WCAG 2.2 Level AA (4.5:1 minimum)
 *
 * @see {@link createCharacterCount} for the underlying headless utility
 */
@Component({
  selector: 'ngx-signal-form-field-character-count',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="ngx-signal-form-field-char-count__text">
      {{ characterCountText() }}
    </span>
    @if (liveAnnounce()) {
      <span
        class="ngx-signal-form-field-char-count__sr"
        aria-live="polite"
        aria-atomic="true"
      >
        {{ announcementText() }}
      </span>
    }
  `,
  styles: `
    :host {
      display: block;
      position: relative;
      font-size: var(--ngx-form-field-char-count-font-size, 0.75rem);
      line-height: var(--ngx-form-field-char-count-line-height, 1.25);
      color: var(--ngx-form-field-char-count-color-ok, rgba(50, 65, 85, 0.75));
      transition:
        color 0.2s ease,
        font-weight 0.2s ease;
      white-space: nowrap;
      padding-left: var(--ngx-form-field-char-count-padding-horizontal, 0);
      padding-right: var(
        --ngx-form-field-char-count-padding-horizontal,
        0.5rem
      );
    }

    :host([position='left']) {
      text-align: left;
    }

    :host([position='right']) {
      text-align: right;
    }

    /* Color progression states */
    :host([data-limit-state='ok']) {
      color: var(--ngx-form-field-char-count-color-ok, rgba(50, 65, 85, 0.75));
    }

    :host([data-limit-state='warning']) {
      color: var(--ngx-form-field-char-count-color-warning, #f59e0b);
    }

    :host([data-limit-state='danger']) {
      color: var(--ngx-form-field-char-count-color-danger, #db1818);
    }

    :host([data-limit-state='exceeded']) {
      color: var(--ngx-form-field-char-count-color-exceeded, #991b1b);
      font-weight: var(--ngx-form-field-char-count-weight-exceeded, 600);
    }

    /* Disabled color progression */
    :host([data-limit-state='disabled']) {
      color: var(--ngx-form-field-char-count-color-ok, rgba(50, 65, 85, 0.75));
    }

    .ngx-signal-form-field-char-count__sr {
      border: 0;
      clip: rect(0 0 0 0);
      clip-path: inset(50%);
      height: 1px;
      margin: -1px;
      overflow: hidden;
      padding: 0;
      position: absolute;
      white-space: nowrap;
      width: 1px;
    }
  `,
  host: {
    '[attr.position]': 'position()',
    '[attr.data-limit-state]': 'displayLimitState()',
  },
})
export class NgxFormFieldCharacterCountComponent<TValue = unknown> {
  /**
   * Form field to track character count from.
   * Must contain a value compatible with string length calculation.
   */
  readonly formField = input.required<FieldTree<TValue>>();

  /**
   * Maximum character length for the field.
   *
   * If not provided, the component will attempt to auto-detect the limit
   * from the field's validation rules (maxLength validator).
   *
   * **Auto-detection:**
   * - Checks field state for `maxLength()` signal
   * - Falls back to manual input if validation doesn't define maxLength
   *
   * **When to provide manually:**
   * - Display limit differs from validation limit
   * - No maxLength validator defined
   * - Custom validation logic determines limit
   *
   * @example Auto-detect from validation
   * ```typescript
   * // In form schema:
   * maxLength(path.bio, 500);
   * ```
   * ```html
   * <!-- maxLength auto-detected as 500 -->
   * <ngx-form-field-character-count [formField]="form.bio" />
   * ```
   *
   * @example Manual override
   * ```html
   * <!-- Display limit is 300, even if validation allows 500 -->
   * <ngx-form-field-character-count
   *   [formField]="form.bio"
   *   [maxLength]="300"
   * />
   * ```
   */
  readonly maxLength = input<number | undefined>(undefined);

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
   * Enable polite live announcements when approaching or exceeding the limit.
   *
   * Announcements are only triggered when the limit state changes.
   *
   * @default false
   */
  readonly liveAnnounce = input(false, {
    transform: booleanAttribute,
  });

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
   * Resolved maximum length with auto-detection from field validation.
   */
  readonly #resolvedMaxLength = computed(() => {
    const manualMax = this.maxLength();

    if (manualMax !== undefined && manualMax !== null) {
      return Math.max(0, manualMax);
    }

    /// Try to auto-detect from field validation
    const fieldState = this.formField()() as { maxLength?: () => number };
    if (
      'maxLength' in fieldState &&
      typeof fieldState.maxLength === 'function'
    ) {
      const validatorMax = fieldState.maxLength();
      if (typeof validatorMax === 'number' && validatorMax > 0) {
        return validatorMax;
      }
    }

    return 0;
  });

  /**
   * Headless character count state from the toolkit.
   * Provides currentLength, remaining, limitState, etc.
   */
  readonly #charCountState = computed(() => {
    const max = this.#resolvedMaxLength();
    if (max === 0) return null;

    const thresholds = this.colorThresholds();
    return createCharacterCount({
      field: this.formField() as FieldTree<string | null | undefined>,
      maxLength: max,
      warningThreshold: thresholds.warning / 100,
      dangerThreshold: thresholds.danger / 100,
    });
  });

  /**
   * Current character length from the field value.
   */
  protected readonly currentLength = computed(() => {
    const state = this.#charCountState();
    if (state) return state.currentLength();

    const value = this.formField()().value() as unknown;
    return typeof value === 'string' ? (value as string).length : 0;
  });

  /**
   * Formatted character count text (e.g., "42/500").
   */
  protected readonly characterCountText = computed(() => {
    const current = this.currentLength();
    const max = this.#resolvedMaxLength();

    if (max === 0) return `${current}`;
    return `${current}/${max}`;
  });

  /**
   * Current limit state for display, accounting for disabled color progression.
   */
  protected readonly displayLimitState = computed<
    CharacterCountLimitState | 'disabled'
  >(() => {
    if (!this.showLimitColors()) return 'disabled';

    const state = this.#charCountState();
    if (!state) return 'disabled';

    return state.limitState();
  });

  readonly #lastAnnouncedState = signal<
    CharacterCountLimitState | 'disabled' | null
  >(null);

  readonly #announcementText = signal<string>('');

  protected readonly announcementText = computed(() =>
    this.#announcementText(),
  );

  constructor() {
    effect(() => {
      if (!this.liveAnnounce()) {
        this.#lastAnnouncedState.set(null);
        this.#announcementText.set('');
        return;
      }

      const state = this.displayLimitState();
      const max = this.#resolvedMaxLength();
      if (max === 0 || state === 'disabled') {
        this.#lastAnnouncedState.set(null);
        this.#announcementText.set('');
        return;
      }

      const current = this.currentLength();
      const remaining = Math.max(0, max - current);
      const over = Math.max(0, current - max);
      const last = this.#lastAnnouncedState();

      if (state === last) return;

      this.#lastAnnouncedState.set(state);

      switch (state) {
        case 'warning':
          this.#announcementText.set(
            `Approaching limit: ${remaining} characters remaining.`,
          );
          break;
        case 'danger':
          this.#announcementText.set(
            `Almost at limit: ${remaining} characters remaining.`,
          );
          break;
        case 'exceeded':
          this.#announcementText.set(
            `Character limit exceeded by ${over} characters.`,
          );
          break;
        default:
          this.#announcementText.set('');
          break;
      }
    });
  }
}
