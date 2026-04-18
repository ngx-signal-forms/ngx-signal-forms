import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  linkedSignal,
  untracked,
} from '@angular/core';
import type { FieldTree } from '@angular/forms/signals';
import {
  createCharacterCount,
  type CharacterCountLimitState,
  type CharacterCountValue,
} from '@ngx-signal-forms/toolkit/headless';

/**
 * Supported value shape for the character-count `formField` input.
 *
 * Re-exports {@link CharacterCountValue} from the headless entry so the
 * styled component's input type cannot drift from what the underlying
 * `createCharacterCount()` utility actually supports.
 *
 * The component counts length of either:
 * - A `string` value (e.g. `<input>`, `<textarea>`)
 * - A `string[]` value (e.g. tokenized inputs where each array entry is
 *   one token). The displayed count is `array.length`, not the combined
 *   string length — this matches the intuitive "X of N tokens" UX.
 *
 * `null` / `undefined` are treated as length `0`. Any other value type
 * logs a dev-mode warning via `createCharacterCount` and renders `0`.
 */
export type NgxCharacterCountValue = CharacterCountValue;

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
 * @example Basic character count
 * ```html
 * <ngx-signal-form-field-wrapper [formField]="form.bio">
 *   <label for="bio">Bio</label>
 *   <textarea id="bio" [formField]="form.bio"></textarea>
 *   <ngx-signal-form-field-character-count
 *     [formField]="form.bio"
 *     [maxLength]="500"
 *   />
 * </ngx-signal-form-field-wrapper>
 * ```
 *
 * @example Left-aligned
 * ```html
 * <ngx-signal-form-field-character-count
 *   [formField]="form.tweet"
 *   [maxLength]="280"
 *   position="left"
 * />
 * ```
 *
 * @example Disable color progression
 * ```html
 * <ngx-signal-form-field-character-count
 *   [formField]="form.message"
 *   [maxLength]="1000"
 *   [showLimitColors]="false"
 * />
 * ```
 *
 * @example Custom thresholds
 * ```html
 * <ngx-signal-form-field-character-count
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
export class NgxFormFieldCharacterCount {
  /**
   * Form field to track character count from.
   *
   * Supported value shapes: `string`, `readonly string[]`, `null`, or
   * `undefined` — see {@link NgxCharacterCountValue}. Anything else
   * degrades to a displayed count of `0` and logs a dev-mode warning.
   */
  readonly formField = input.required<FieldTree<NgxCharacterCountValue>>();

  /**
   * Maximum character length for the field.
   *
   * If not provided, the component will attempt to auto-detect the limit
   * from the field's validation rules (maxLength validator).
   *
   * **Auto-detection:**
   * - Checks field state for `maxLength()` signal
   * - Only accepts a positive `number`; any other shape falls through to
   *   "no explicit limit"
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
   * <ngx-signal-form-field-character-count [formField]="form.bio" />
   * ```
   *
   * @example Manual override
   * ```html
   * <!-- Display limit is 300, even if validation allows 500 -->
   * <ngx-signal-form-field-character-count
   *   [formField]="form.bio"
   *   [maxLength]="300"
   * />
   * ```
   */
  readonly maxLength = input<number | undefined>();

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
  readonly showLimitColors = input(true);

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
  readonly colorThresholds = input({
    warning: 80,
    danger: 95,
  });

  /**
   * Resolved maximum length.
   *
   * Priority:
   * 1. Explicit `maxLength` input when it is a positive number
   * 2. `fieldState.maxLength()` when present AND numeric AND > 0
   * 3. `null` — no limit detected. Display falls back to a plain count
   *    (no `/max`) and color progression is disabled.
   *
   * `null` is the single sentinel for "no limit." `0`, negatives, and
   * non-numeric values all fall through to `null` so downstream computeds
   * never need to differentiate "zero-limit" from "unknown-limit" — the
   * styled wrapper treats both as the plain-count display.
   */
  readonly #resolvedMaxLength = computed<number | null>(() => {
    const manualMax = this.maxLength();

    if (typeof manualMax === 'number' && manualMax > 0) {
      return manualMax;
    }

    const fieldState = this.formField()();
    if (this.#hasMaxLengthSignal(fieldState)) {
      const validatorMax = fieldState.maxLength();
      // Structural narrowing only guarantees the call succeeds; the
      // returned value must still be a positive number we can use.
      if (typeof validatorMax === 'number' && validatorMax > 0) {
        return validatorMax;
      }
      // Any other shape (undefined, null, string, NaN, negative, 0) is
      // treated as "no limit declared" — do not silently coerce to 0.
    }

    return null;
  });

  /**
   * Headless character count state from the toolkit.
   * Re-created when maxLength or thresholds change (rare).
   */
  readonly #charCountState = computed(() => {
    const max = this.#resolvedMaxLength();
    if (max === null) return null;

    const thresholds = this.colorThresholds();
    return createCharacterCount({
      field: this.formField(),
      maxLength: max,
      warningThreshold: thresholds.warning / 100,
      dangerThreshold: thresholds.danger / 100,
    });
  });

  protected readonly currentLength = computed(() => {
    const state = this.#charCountState();
    if (state) return state.currentLength();

    const value = this.formField()().value() as unknown;
    if (typeof value === 'string') return value.length;
    if (Array.isArray(value)) return value.length;
    return 0;
  });

  /**
   * Formatted character count text (e.g., "42/500").
   */
  protected readonly characterCountText = computed(() => {
    const current = this.currentLength();
    const max = this.#resolvedMaxLength();

    if (max === null) return `${current}`;
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

  #hasMaxLengthSignal(
    fieldState: unknown,
  ): fieldState is { maxLength: () => unknown } {
    return (
      typeof fieldState === 'object' &&
      fieldState !== null &&
      'maxLength' in fieldState &&
      typeof (fieldState as { maxLength: unknown }).maxLength === 'function'
    );
  }

  /**
   * Last-announced state, exposed through `linkedSignal` so it resets
   * automatically whenever live-announce is disabled or the field loses
   * its maxLength (the source-based computation re-seeds to `null`).
   */
  readonly #lastAnnouncedState = linkedSignal<
    {
      liveAnnounce: boolean;
      max: number | null;
      state: CharacterCountLimitState | 'disabled';
    },
    CharacterCountLimitState | 'disabled' | null
  >({
    source: () => ({
      liveAnnounce: this.liveAnnounce(),
      max: this.#resolvedMaxLength(),
      state: this.displayLimitState(),
    }),
    computation: (source, previous) => {
      if (!source.liveAnnounce) return null;
      if (source.max === null || source.state === 'disabled') return null;

      const prev = previous?.value ?? null;
      // When the state hasn't changed we keep the prior memory so
      // `announcementText()` doesn't re-announce on unrelated renders.
      return source.state === prev ? prev : source.state;
    },
  });

  /**
   * Computed announcement text. Reads `#lastAnnouncedState` as the
   * change-trigger and produces a string per limit state. Unlike the
   * previous `effect()` + `signal.set` loop, this stays pure and
   * side-effect-free — Angular 21 idiom.
   */
  protected readonly announcementText = computed(() => {
    if (!this.liveAnnounce()) return '';

    const max = this.#resolvedMaxLength();
    if (max === null) return '';

    const state = this.#lastAnnouncedState();
    if (state === null || state === 'disabled' || state === 'ok') return '';

    // Snapshot the current length *without* subscribing. `#lastAnnouncedState`
    // is reference-stable inside a bucket (see `linkedSignal.computation`
    // above), so this computed only re-runs on state transitions. Reading
    // `currentLength()` reactively would instead re-fire the aria-live region
    // on every keystroke — screen readers would re-announce the new remaining
    // count each character, defeating the "announce on transition" UX.
    const current = untracked(() => this.currentLength());
    const remaining = Math.max(0, max - current);
    const over = Math.max(0, current - max);

    switch (state) {
      case 'warning':
        return `Approaching limit: ${remaining} characters remaining.`;
      case 'danger':
        return `Almost at limit: ${remaining} characters remaining.`;
      case 'exceeded':
        return `Character limit exceeded by ${over} characters.`;
      default:
        state satisfies never;
        return '';
    }
  });
}
