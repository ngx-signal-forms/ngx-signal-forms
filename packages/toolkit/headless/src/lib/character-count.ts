import { Directive, input, type Signal } from '@angular/core';
import type { FieldTree } from '@angular/forms/signals';
import {
  DEFAULT_DANGER_THRESHOLD,
  DEFAULT_WARNING_THRESHOLD,
  type CharacterCountLimitState,
  type CharacterCountValue,
} from './character-count-types';
import { createCharacterCount } from './utilities';

// Re-exported so the public barrel's `export { DEFAULT_DANGER_THRESHOLD,
// DEFAULT_WARNING_THRESHOLD, type CharacterCountLimitState } from
// './lib/character-count'` keeps resolving after these moved to the shared
// character-count-types module (see that file's docblock for why).
export {
  DEFAULT_DANGER_THRESHOLD,
  DEFAULT_WARNING_THRESHOLD,
  type CharacterCountLimitState,
};

/**
 * Character count state signals exposed by the headless directive.
 *
 * The directive requires a `maxLength` input, so the resolved numeric
 * signals are always non-nullable. `hasLimit` is retained for template
 * ergonomics and future extensibility.
 */
export interface CharacterCountStateSignals {
  /** Current value length */
  readonly currentLength: Signal<number>;
  /** Resolved maximum length */
  readonly resolvedMaxLength: Signal<number>;
  /** Remaining characters until limit */
  readonly remaining: Signal<number>;
  /** Current limit state */
  readonly limitState: Signal<CharacterCountLimitState>;
  /** Whether a limit is configured */
  readonly hasLimit: Signal<boolean>;
  /** Whether the limit has been exceeded */
  readonly isExceeded: Signal<boolean>;
  /** Percentage of limit used (0-100+) */
  readonly percentUsed: Signal<number>;
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
 */
@Directive({
  selector: '[ngxHeadlessCharacterCount]',
  exportAs: 'characterCount',
})
export class NgxHeadlessCharacterCount implements CharacterCountStateSignals {
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
   */
  readonly resolvedMaxLength = this.#result.resolvedMaxLength;

  /**
   * Whether a limit is configured.
   *
   * The directive requires a `maxLength` input, so this is always `true`.
   * Retained as a signal for API symmetry with `createCharacterCount()` and
   * for consumer templates that may swap directive/factory wiring.
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
