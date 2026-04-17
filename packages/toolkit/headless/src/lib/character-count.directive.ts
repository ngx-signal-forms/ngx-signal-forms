import { computed, Directive, input, type Signal } from '@angular/core';
import type { FieldTree } from '@angular/forms/signals';
import type { CharacterCountValue } from './utilities';

/**
 * Character count limit state.
 */
export type CharacterCountLimitState = 'ok' | 'warning' | 'danger' | 'exceeded';

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
 * Default warning threshold percentage.
 */
export const DEFAULT_WARNING_THRESHOLD = 0.8;

/**
 * Default danger threshold percentage.
 */
export const DEFAULT_DANGER_THRESHOLD = 0.95;

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
 *   ngxSignalFormHeadlessCharacterCount
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
 * - **danger**: At/above danger, under exceeded (default 95-99%)
 * - **exceeded**: At or above 100%
 *
 * @example Custom thresholds
 * ```html
 * <div
 *   ngxSignalFormHeadlessCharacterCount
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
  selector: '[ngxSignalFormHeadlessCharacterCount]',
  exportAs: 'characterCount',
})
export class NgxHeadlessCharacterCountDirective implements CharacterCountStateSignals {
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
   * The current field state.
   */
  readonly #fieldState = computed(() => this.field()());

  /**
   * Current value length.
   */
  readonly currentLength = computed(() => {
    const state = this.#fieldState();
    const value = state.value();
    if (typeof value === 'string') return value.length;
    if (Array.isArray(value)) return value.length;
    return 0;
  });

  /**
   * Resolved maximum length.
   */
  readonly resolvedMaxLength = computed<number>(() => this.maxLength());

  /**
   * Whether a limit is configured.
   *
   * The directive requires a `maxLength` input, so this is always `true`.
   * Retained as a signal for API symmetry with `createCharacterCount()` and
   * for consumer templates that may swap directive/factory wiring.
   */
  readonly hasLimit = computed(() => true);

  /**
   * Remaining characters until limit.
   */
  readonly remaining = computed(
    () => this.resolvedMaxLength() - this.currentLength(),
  );

  /**
   * Percentage of limit used (0-100+).
   *
   * Returns `0` when `maxLength` is `0` to avoid division-by-zero while
   * keeping the signal non-nullable.
   */
  readonly percentUsed = computed(() => {
    const max = this.resolvedMaxLength();
    if (max === 0) return 0;
    return (this.currentLength() / max) * 100;
  });

  /**
   * Whether the limit has been exceeded.
   */
  readonly isExceeded = computed(() => this.remaining() < 0);

  /**
   * Current limit state based on thresholds.
   *
   * States:
   * - `ok`: Below warning threshold (default < 80%)
   * - `warning`: At/above warning, below danger (default 80-94%)
   * - `danger`: At/above danger, up to 100% (default 95-100%)
   * - `exceeded`: Over 100% of limit
   *
   * When `maxLength` is `0` (or negative), any content counts as exceeded
   * to stay consistent with `isExceeded` and `remaining`, which both treat
   * a 0 limit as "no characters allowed".
   */
  readonly limitState = computed<CharacterCountLimitState>(() => {
    const max = this.resolvedMaxLength();
    const current = this.currentLength();

    if (max <= 0) {
      return current > 0 ? 'exceeded' : 'ok';
    }

    const ratio = current / max;

    if (ratio > 1) return 'exceeded';

    const danger = this.dangerThreshold();
    if (ratio >= danger) return 'danger';

    const warning = this.warningThreshold();
    if (ratio >= warning) return 'warning';

    return 'ok';
  });
}
