import { computed, Directive, input, type Signal } from '@angular/core';
import type { FieldTree } from '@angular/forms/signals';
import { unwrapValue, type ReactiveOrStatic } from '@ngx-signal-forms/toolkit';
import { createCharacterCountLengthSignal } from '@ngx-signal-forms/toolkit/core';
import {
  DEFAULT_DANGER_THRESHOLD,
  DEFAULT_WARNING_THRESHOLD,
  type CharacterCountLimitState,
  type CharacterCountState,
  type CharacterCountValue,
} from './character-count-types';

// Re-exported so the public barrel's `export { DEFAULT_DANGER_THRESHOLD,
// DEFAULT_WARNING_THRESHOLD, type CharacterCountLimitState } from
// './lib/character-count'` keeps resolving after these moved to the shared
// character-count-types module (see that file's docblock for why).
export {
  DEFAULT_DANGER_THRESHOLD,
  DEFAULT_WARNING_THRESHOLD,
  type CharacterCountLimitState,
  type CharacterCountState,
  type CharacterCountValue,
};

/**
 * Options for creating character count signals.
 *
 * @group Reactive Primitives
 */
export interface CreateCharacterCountOptions {
  /** Form field producing a {@link CharacterCountValue}. */
  readonly field: FieldTree<CharacterCountValue>;
  /**
   * Maximum length for the character count.
   *
   * `0` and negative numbers count as an explicit limit too. They are real
   * values, not "no limit" — see {@link createCharacterCount}'s non-positive
   * `maxLength` handling. An explicit value, of any sign, always wins and
   * blocks the `useValidatorMaxLength` fallback below.
   *
   * `undefined`, `null`, or omitting the option means "no explicit limit".
   * See `useValidatorMaxLength` for the fallback that applies then.
   */
  readonly maxLength?: ReactiveOrStatic<number | null>;
  /**
   * Falls back to the field's own `maxLength` validator signal when
   * `maxLength` resolves to no explicit limit. Only a present, positive
   * validator value counts. Lets a caller auto-detect the limit from the
   * form schema instead of passing an explicit `maxLength`.
   *
   * @default false
   */
  readonly useValidatorMaxLength?: boolean;
  /** Warning threshold (0-1), default 0.8 */
  readonly warningThreshold?: ReactiveOrStatic<number>;
  /** Danger threshold (0-1), default 0.95 */
  readonly dangerThreshold?: ReactiveOrStatic<number>;
  /**
   * Name reported in the unsupported-value-type dev warning, e.g.
   * `[ngx-signal-forms] <component>: unsupported value type — …`. Lets a
   * delegating caller (`NgxHeadlessCharacterCount`, `NgxFormFieldCharacterCount`)
   * report its own name instead of `'createCharacterCount'`, since the
   * message text is asserted in specs on both sides.
   *
   * @default 'createCharacterCount'
   */
  readonly component?: string;
}

/**
 * Reads a positive `maxLength` off a field's validator state, if present.
 *
 * `FieldState.maxLength` is a signal Angular Signal Forms adds only when a
 * `maxLength()` schema validator applies to the field — it's absent
 * otherwise, hence the structural check. Any other shape (missing, `0`,
 * negative, non-numeric) is treated as "no validator limit declared".
 */
function readValidatorMaxLength(fieldState: unknown): number | null {
  if (
    typeof fieldState !== 'object' ||
    fieldState === null ||
    !('maxLength' in fieldState) ||
    typeof fieldState.maxLength !== 'function'
  ) {
    return null;
  }

  const validatorMax = (fieldState as { maxLength: () => unknown }).maxLength();

  return typeof validatorMax === 'number' && validatorMax > 0
    ? validatorMax
    : null;
}

/**
 * Creates character count signals for a form field.
 *
 * This utility provides the same state management as NgxHeadlessCharacterCount
 * but as standalone signals for programmatic use.
 *
 * @remarks Does not require an injection context (only creates `computed()`
 * signals internally).
 *
 * ## Usage
 *
 * ```typescript
 * const formData = signal({ bio: '' });
 * const bioField = form(formData).bio;
 *
 * const charCount = createCharacterCount({
 *   field: bioField,
 *   maxLength: 500,
 *   warningThreshold: 0.8,
 *   dangerThreshold: 0.95,
 * });
 *
 * // Use in templates
 * effect(() => {
 *   console.log(`${charCount.currentLength()} / ${charCount.resolvedMaxLength()}`);
 *   console.log(`State: ${charCount.limitState()}`);
 * });
 * ```
 *
 * @group Reactive Primitives
 */
export function createCharacterCount(
  options: Readonly<CreateCharacterCountOptions>,
): CharacterCountState {
  const {
    field,
    maxLength,
    useValidatorMaxLength = false,
    warningThreshold = DEFAULT_WARNING_THRESHOLD,
    dangerThreshold = DEFAULT_DANGER_THRESHOLD,
    component = 'createCharacterCount',
  } = options;

  const fieldState = computed(() => field());

  const currentLength = createCharacterCountLengthSignal(
    () => fieldState().value(),
    component,
  );

  // Priority: an explicit `maxLength` (any number, including `0` or
  // negative — see the non-positive handling below) wins outright. Falling
  // back to the field's own validator only applies when `maxLength` itself
  // resolves to no explicit limit (`null`/`undefined`), and only when the
  // caller opted in via `useValidatorMaxLength`.
  const resolvedMaxLength = computed<number | null>(() => {
    const explicit = maxLength === undefined ? null : unwrapValue(maxLength);
    if (typeof explicit === 'number') return explicit;

    if (useValidatorMaxLength) {
      const validatorMax = readValidatorMaxLength(fieldState());
      if (validatorMax !== null) return validatorMax;
    }

    return null;
  });

  const hasLimit = computed(() => resolvedMaxLength() !== null);

  const remaining = computed(() => {
    const max = resolvedMaxLength();
    return max === null ? 0 : max - currentLength();
  });

  // A non-positive limit ("no characters allowed") is handled identically here
  // to NgxHeadlessCharacterCount so the factory and directive return the same
  // values for the same inputs. Without this guard, percentUsed would go
  // negative (when max < 0) or NaN (when max === 0).
  const percentUsed = computed(() => {
    const max = resolvedMaxLength();
    if (max === null) return 0;
    if (max <= 0) return currentLength() > 0 ? 100 : 0;
    return (currentLength() / max) * 100;
  });

  const limitState = computed<CharacterCountLimitState>(() => {
    const max = resolvedMaxLength();
    if (max === null) return 'ok';

    const current = currentLength();

    if (max <= 0) {
      return current > 0 ? 'exceeded' : 'ok';
    }

    const ratio = current / max;

    if (ratio > 1) return 'exceeded';

    const danger = unwrapValue(dangerThreshold);
    if (ratio >= danger) return 'danger';

    const warning = unwrapValue(warningThreshold);
    if (ratio >= warning) return 'warning';

    return 'ok';
  });

  // Derived from `limitState()`, not from `remaining() < 0`, so the two
  // never disagree. For a non-positive `maxLength`, `remaining` can be
  // negative even for an empty value (e.g. `max = -5` gives `remaining =
  // -5` at `currentLength = 0`), while `limitState` — correctly — reports
  // `'ok'` there (no characters typed, none can be, so nothing is
  // "exceeded" yet). `remaining() < 0` would have called that `isExceeded`.
  // For a positive `maxLength`, `ratio > 1` (limitState's rule) and
  // `remaining < 0` are the same condition, so this changes nothing there.
  const isExceeded = computed(() => limitState() === 'exceeded');

  return {
    currentLength,
    resolvedMaxLength,
    remaining,
    limitState,
    hasLimit,
    isExceeded,
    percentUsed,
  };
}

/**
 * Headless character count directive for form field length tracking.
 *
 * Provides signals for implementing custom character count displays
 * with progressive visual feedback (ok → warning → danger → exceeded).
 *
 * ## Features
 *
 * - **Progressive States**: ok, warning, danger, exceeded based on thresholds
 * - **Flexible Display**: Exposes all data for full UI customization
 * - **Configurable Thresholds**: Customize warning (80%) and danger (95%)
 *
 * ## Usage
 *
 * ```html
 * <div
 *   ngxHeadlessCharacterCount
 *   #charCount="characterCount"
 *   [field]="form.bio"
 *   [maxLength]="500"
 * >
 *   @if (charCount.hasLimit()) {
 *     <span [class]="charCount.limitState()">
 *       {{ charCount.currentLength() }} / {{ charCount.resolvedMaxLength() }}
 *       ({{ charCount.remaining() }} remaining)
 *     </span>
 *   }
 * </div>
 * ```
 *
 * ## Threshold Configuration
 *
 * The limit state transitions based on configurable thresholds:
 * - **ok**: Under warning threshold (default < 80%)
 * - **warning**: At/above warning, under danger (default 80-94%)
 * - **danger**: At/above danger, up to and including 100% (default 95-100%)
 * - **exceeded**: Over 100%
 *
 * @example Custom thresholds
 * ```html
 * <div
 *   ngxHeadlessCharacterCount
 *   #charCount="characterCount"
 *   [field]="form.title"
 *   [maxLength]="100"
 *   [warningThreshold]="0.7"
 *   [dangerThreshold]="0.9"
 * >
 *   <!-- Display with 70%/90% thresholds -->
 * </div>
 * ```
 *
 * @group Directives
 */
@Directive({
  selector: '[ngxHeadlessCharacterCount]',
  exportAs: 'characterCount',
})
export class NgxHeadlessCharacterCount implements CharacterCountState {
  /**
   * The form field to track character count.
   */
  readonly field = input.required<FieldTree<CharacterCountValue>>();

  /**
   * Maximum length for the character count.
   */
  readonly maxLength = input.required<number>();

  /**
   * Warning threshold as percentage (0-1). Default: 0.8 (80%).
   */
  readonly warningThreshold = input(DEFAULT_WARNING_THRESHOLD);

  /**
   * Danger threshold as percentage (0-1). Default: 0.95 (95%).
   */
  readonly dangerThreshold = input(DEFAULT_DANGER_THRESHOLD);

  /**
   * Delegates all state computation to {@link createCharacterCount} — see
   * that function for the shared algorithm (thresholds, the non-positive
   * `maxLength` edge case, the unsupported-value-type dev warning).
   *
   * `field` can't be passed as `this.field` directly: `createCharacterCount`
   * invokes its `field` option once per recomputation to get the current
   * `FieldState` (`field()`), so the option is typed as a plain `FieldTree`,
   * not a `Signal<FieldTree>`. A trampoline closure — created once, so
   * `createCharacterCount` (and its per-instance warn-once guard) is also
   * created exactly once for this directive's lifetime — forwards each call
   * to the *current* `this.field()`, which keeps the delegate reactive to a
   * rebound `field` input without re-running the factory (and resetting the
   * one-shot warning) on every recomputation.
   */
  readonly #result = createCharacterCount({
    field: () => this.field()(),
    maxLength: this.maxLength,
    warningThreshold: this.warningThreshold,
    dangerThreshold: this.dangerThreshold,
    component: 'NgxHeadlessCharacterCount',
  });

  /**
   * Current value length.
   */
  readonly currentLength = this.#result.currentLength;

  /**
   * Resolved maximum length.
   *
   * The directive requires a `maxLength` input, so `createCharacterCount()`
   * always resolves a real limit here — never `null`. Narrowed back to
   * `Signal<number>`, unlike `CharacterCountState.resolvedMaxLength` (which
   * is nullable for callers that allow no limit), so directive consumers
   * see no type change from before `createCharacterCount()` started
   * supporting an optional `maxLength`.
   */
  readonly resolvedMaxLength: Signal<number> = this.#result
    .resolvedMaxLength as Signal<number>;

  /**
   * Whether a limit is configured.
   *
   * The directive requires a `maxLength` input, so this always resolves to
   * `true`. Retained as a signal for API symmetry with
   * `createCharacterCount()` and for consumer templates that may swap
   * directive/factory wiring.
   */
  readonly hasLimit = this.#result.hasLimit;

  /**
   * Remaining characters until limit.
   */
  readonly remaining = this.#result.remaining;

  /**
   * Percentage of limit used (0-100+).
   *
   * @see {@link createCharacterCount} for the non-positive `maxLength`
   *   edge-case handling.
   */
  readonly percentUsed = this.#result.percentUsed;

  /**
   * Whether the limit has been exceeded.
   */
  readonly isExceeded = this.#result.isExceeded;

  /**
   * Current limit state based on thresholds (ok → warning → danger →
   * exceeded).
   *
   * @see {@link createCharacterCount} for the threshold/edge-case algorithm.
   */
  readonly limitState = this.#result.limitState;
}
