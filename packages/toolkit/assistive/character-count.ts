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
import { createCharacterCountLengthSignal } from '@ngx-signal-forms/toolkit/core';
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
 * Non-`'ok'` limit states that ever produce a live-announcement string.
 * `'ok'` is intentionally excluded — no announcement is emitted for it, so
 * an {@link NgxCharacterCountAnnouncementFormatter} is never invoked with it.
 */
export type NgxCharacterCountAnnouncementState = Exclude<
  CharacterCountLimitState,
  'ok'
>;

/**
 * Details passed to a custom {@link NgxCharacterCountAnnouncementFormatter}.
 */
export interface NgxCharacterCountAnnouncementInfo {
  /** Current character/token count. */
  readonly current: number;
  /** The resolved maximum length. */
  readonly max: number;
  /** Characters remaining before the limit (`0` once at or past it). */
  readonly remaining: number;
  /** Characters over the limit (`0` unless `state === 'exceeded'`). */
  readonly over: number;
}

/**
 * Formats the polite live-announcement text for a given limit-state
 * transition. Bind `[announcementFormatter]` to localize the built-in
 * English strings ("Approaching limit: N characters remaining.", etc.) —
 * the component has no other i18n hook, so non-English apps otherwise
 * cannot translate what screen readers announce without forking it.
 *
 * @example
 * ```typescript
 * announcementFormatter = (state, { remaining, over }) => {
 *   switch (state) {
 *     case 'warning': return `Plus que ${remaining} caractères.`;
 *     case 'danger': return `Attention, plus que ${remaining} caractères.`;
 *     case 'exceeded': return `Limite dépassée de ${over} caractères.`;
 *   }
 * };
 * ```
 */
export type NgxCharacterCountAnnouncementFormatter = (
  state: NgxCharacterCountAnnouncementState,
  info: NgxCharacterCountAnnouncementInfo,
) => string;

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
 * <ngx-form-field-wrapper [formField]="form.bio">
 *   <label for="bio">Bio</label>
 *   <textarea id="bio" [formField]="form.bio"></textarea>
 *   <ngx-form-field-character-count
 *     [formField]="form.bio"
 *     [maxLength]="500"
 *   />
 * </ngx-form-field-wrapper>
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
 * @example Custom thresholds (CSS-only — no component input)
 * ```css
 * ngx-form-field-character-count {
 *   --ngx-form-field-char-count-warning-threshold: 90;
 *   --ngx-form-field-char-count-danger-threshold: 98;
 * }
 * ```
 *
 * Color States (aligned with Figma design tokens):
 * - **ok**: 0-80% of limit (text/secondary)
 * - **warning**: 80-95% of limit (amber)
 * - **danger**: 95-100% of limit (interaction/danger)
 * - **exceeded**: >100% of limit (darker red, bold)
 *
 * The 80%/95% warning/danger split is a *presentation* detail, not a
 * component input — see `--ngx-form-field-char-count-warning-threshold` /
 * `--ngx-form-field-char-count-danger-threshold` below. The "exceeded" state
 * (>100%) is not configurable — it is tied to the field's actual
 * `maxLength`, not a percentage.
 *
 * Customization:
 * Use CSS custom properties to theme character count appearance:
 *
 * ```css
 * :root {
 *   --ngx-form-field-char-count-font-size: 0.75rem;
 *   --ngx-form-field-char-count-line-height: 1.25;
 *   --ngx-form-field-char-count-color-ok: rgba(50, 65, 85, 0.75);
 *   --ngx-form-field-char-count-color-warning: #a16207;
 *   --ngx-form-field-char-count-color-danger: #db1818;
 *   --ngx-form-field-char-count-color-exceeded: #991b1b;
 *   --ngx-form-field-char-count-weight-exceeded: 600;
 *   --ngx-form-field-char-count-warning-threshold: 80;
 *   --ngx-form-field-char-count-danger-threshold: 95;
 * }
 * ```
 *
 * `-warning-threshold` / `-danger-threshold` are the two public, CSS-only
 * configuration knobs — plain numbers (percent of `maxLength`, no `%`
 * unit). The component publishes the live
 * `--ngx-form-field-char-count-percent-used` custom property (an internal
 * coordination hook, not a theming knob — same status as
 * `--ngx-form-field-hint-display`, see THEMING.md — set by the component,
 * not meant to be overridden), and a pure-CSS `color-mix()`/`clamp()`
 * expression compares it against the two threshold knobs to pick the
 * rendered color. No component input, no JS re-render on override — restyle
 * a wrapper (Material, PrimeNG, …) purely in CSS.
 *
 * Accessibility:
 * - Ensure color is not the only indicator (text content also changes)
 * - Color contrast meets WCAG 2.2 Level AA (4.5:1 minimum)
 * - `[liveAnnounce]` announcements ("Approaching limit…", "Almost at
 *   limit…", "Character limit exceeded…") always fire at the toolkit's
 *   fixed 80%/95% defaults, independent of any CSS threshold override.
 *   Announcement wording is accessible *behavior* and must stay predictable
 *   for screen reader users; restyling `-warning-threshold` /
 *   `-danger-threshold` only shifts when the *color* changes, never when the
 *   announcement fires.
 *
 * @see {@link createCharacterCount} for the underlying headless utility
 */
@Component({
  selector: 'ngx-form-field-character-count',
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
      font-size: var(
        --ngx-form-field-char-count-font-size,
        var(--ngx-signal-form-feedback-font-size, 0.75rem)
      );
      line-height: var(--ngx-form-field-char-count-line-height, 1.25);
      transition:
        color 0.2s ease,
        font-weight 0.2s ease;
      white-space: nowrap;
      padding-inline-start: var(
        --ngx-form-field-char-count-padding-inline-start,
        var(--ngx-signal-form-feedback-padding-horizontal, 0)
      );
      padding-inline-end: var(
        --ngx-form-field-char-count-padding-inline-end,
        var(--ngx-signal-form-feedback-padding-horizontal, 0.5rem)
      );

      /*
       * Warning/danger thresholds: --ngx-form-field-char-count-*-threshold
       * are the two PUBLIC, CSS-only configuration knobs — plain numbers
       * (percent of maxLength, no unit). Restyle a wrapper (Material,
       * PrimeNG, …) by overriding these two custom properties; no component
       * input exists for them (see class docblock).
       *
       * --_char-count-*-threshold below are the resolved, pseudo-private
       * copies the implementation actually consumes — same pattern as
       * --_error-panel-* resolving --ngx-signal-form-error-panel-* (see
       * THEMING.md). Keeps the public/internal split explicit instead of
       * scattering var(--ngx-form-field-char-count-*-threshold, …) calls
       * through every downstream expression.
       *
       * Default: Tailwind amber-700 (#a16207) for warning — ~5.17:1 on
       * white meets WCAG 1.4.3 AA for normal text (#f59e0b previously used
       * was 2.16:1). Kept consistent with the warning color in
       * form-field-error.css.
       */
      --_char-count-warning-threshold: var(
        --ngx-form-field-char-count-warning-threshold,
        80
      );
      --_char-count-danger-threshold: var(
        --ngx-form-field-char-count-danger-threshold,
        95
      );

      /*
       * Discrete 0/1 toggles for "percent used has crossed this threshold" —
       * internal intermediates, never a theming knob, hence the _ prefix.
       * Built from clamp()/calc() only (no @property, no container style
       * queries — both are less broadly supported than this baseline-safe
       * technique). The '+ 0.0001' before the large multiplier makes the
       * comparison inclusive (percent === threshold counts as "crossed",
       * matching the pre-CSS ratio >= threshold semantics), while the
       * multiplier collapses any positive difference straight to the 1
       * clamp() ceiling instead of a fractional (partially blended) value.
       */
      --_char-count-is-warning: clamp(
        0,
        (var(--ngx-form-field-char-count-percent-used, 0) -
            var(--_char-count-warning-threshold) + 0.0001) *
          1000000,
        1
      );
      --_char-count-is-danger: clamp(
        0,
        (var(--ngx-form-field-char-count-percent-used, 0) -
            var(--_char-count-danger-threshold) + 0.0001) *
          1000000,
        1
      );

      /*
       * ok -> warning -> danger as a two-stage color-mix() blend driven by
       * the toggles above. Each toggle is a plain 0/1 number; multiplying it
       * by 100% turns it into the <percentage> color-mix() expects, so the
       * blend always lands fully on one color, never a partial mix.
       */
      color: color-mix(
        in srgb,
        var(--ngx-form-field-char-count-color-danger, #db1818)
          calc(var(--_char-count-is-danger) * 100%),
        color-mix(
          in srgb,
          var(--ngx-form-field-char-count-color-warning, #a16207)
            calc(var(--_char-count-is-warning) * 100%),
          var(--ngx-form-field-char-count-color-ok, rgba(50, 65, 85, 0.75))
        )
      );
    }

    :host([position='left']) {
      text-align: left;
    }

    :host([position='right']) {
      text-align: right;
    }

    /*
     * 'exceeded' and 'disabled' stay attribute-selector overrides — both are
     * fixed states outside the configurable warning/danger CSS thresholds
     * above: 'exceeded' is tied to the field's actual maxLength (> 100% used,
     * not a percent threshold), and 'disabled' unconditionally forces the
     * neutral color regardless of percent-used.
     */
    :host([data-limit-state='exceeded']) {
      color: var(--ngx-form-field-char-count-color-exceeded, #991b1b);
      font-weight: var(--ngx-form-field-char-count-weight-exceeded, 600);
    }

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
    '[style.--ngx-form-field-char-count-percent-used]': 'percentUsed()',
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
   * Optional formatter for the polite live-announcement text, for
   * localizing the built-in English strings. See
   * {@link NgxCharacterCountAnnouncementFormatter}.
   *
   * @default undefined — falls back to the built-in English strings.
   */
  readonly announcementFormatter =
    input<NgxCharacterCountAnnouncementFormatter>();

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
   * Re-created when `maxLength` changes (rare).
   *
   * Uses `createCharacterCount()`'s own default thresholds (80%/95%) — the
   * component no longer accepts a `colorThresholds` input (removed pre-v1,
   * #355). Those defaults drive `displayLimitState` (the `data-limit-state`
   * attribute) and, in turn, the `[liveAnnounce]` announcement wording,
   * which must stay fixed and predictable for screen reader users. The
   * *visible color* is independently, continuously reconfigurable via the
   * `--ngx-form-field-char-count-warning-threshold` /
   * `-danger-threshold` CSS custom properties — see the class docblock.
   */
  readonly #charCountState = computed(() => {
    const max = this.#resolvedMaxLength();
    if (max === null) return null;

    return createCharacterCount({
      field: this.formField(),
      maxLength: max,
      // Without this, the unsupported-value dev warning would report the
      // factory's own default name ('createCharacterCount') instead of the
      // component the misconfigured `formField` binding actually lives on —
      // diverging from the `#fallbackLength` warning below for the exact
      // same misconfiguration.
      component: 'NgxFormFieldCharacterCount',
    });
  });

  /**
   * Length signal used when `#charCountState` is `null` (no `maxLength`
   * configured or auto-detected), so `createCharacterCount` is never
   * invoked. Created once as an instance field — not inline inside
   * `currentLength` — so its one-shot unsupported-value dev warning fires at
   * most once per directive instance rather than once per
   * `#charCountState()` recomputation.
   *
   * Shares its length logic (and dev warning) with `createCharacterCount`
   * via {@link createCharacterCountLengthSignal} so an unsupported
   * `formField` value warns identically whether or not `maxLength` happens
   * to be set.
   */
  readonly #fallbackLength = createCharacterCountLengthSignal(
    () => this.formField()().value(),
    'NgxFormFieldCharacterCount',
  );

  protected readonly currentLength = computed(() => {
    const state = this.#charCountState();
    if (state) return state.currentLength();

    return this.#fallbackLength();
  });

  /**
   * Percentage of `maxLength` used (0-100+), published as the
   * `--ngx-form-field-char-count-percent-used` custom property (see the
   * `host` binding) so the pure-CSS threshold comparison in `styles` above
   * can pick a color. `0` when no limit is resolved — the `disabled`
   * `data-limit-state` attribute selector takes over the color in that
   * case, so this value never actually feeds the color-mix() expression
   * for "no limit configured" fields.
   */
  protected readonly percentUsed = computed(() => {
    const state = this.#charCountState();
    return state ? state.percentUsed() : 0;
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
      typeof fieldState.maxLength === 'function'
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

    const formatter = this.announcementFormatter();
    if (formatter) {
      return formatter(state, { current, max, remaining, over });
    }

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
