import { computed, Directive, input, type Signal } from '@angular/core';
import type { FieldTree } from '@angular/forms/signals';
import { unwrapValue, type ReactiveOrStatic } from '@ngx-signal-forms/toolkit';

/**
 * Character count limit state.
 */
export type CharacterCountLimitState = 'ok' | 'warning' | 'danger' | 'exceeded';

/**
 * Character count state signals exposed by the headless directive.
 */
export interface CharacterCountStateSignals {
  /** Current value length */
  readonly currentLength: Signal<number>;
  /** Resolved maximum length */
  readonly resolvedMaxLength: Signal<number | null>;
  /** Remaining characters until limit */
  readonly remaining: Signal<number | null>;
  /** Current limit state */
  readonly limitState: Signal<CharacterCountLimitState>;
  /** Whether a limit is configured */
  readonly hasLimit: Signal<boolean>;
  /** Whether the limit has been exceeded */
  readonly isExceeded: Signal<boolean>;
  /** Percentage of limit used (0-100+) */
  readonly percentUsed: Signal<number | null>;
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
  readonly field = input.required<FieldTree<string | null | undefined>>();

  /**
   * Maximum length for the character count.
   */
  readonly maxLength = input.required<ReactiveOrStatic<number>>();

  /**
   * Warning threshold as percentage (0-1). Default: 0.8 (80%).
   */
  readonly warningThreshold = input<ReactiveOrStatic<number>>(
    DEFAULT_WARNING_THRESHOLD,
  );

  /**
   * Danger threshold as percentage (0-1). Default: 0.95 (95%).
   */
  readonly dangerThreshold = input<ReactiveOrStatic<number>>(
    DEFAULT_DANGER_THRESHOLD,
  );

  /**
   * The current field state.
   */
  readonly #fieldState = computed(() => this.field()());

  /**
   * Current value length.
   */
  readonly currentLength = computed(() => {
    const state = this.#fieldState();
    const value = state?.value?.() ?? '';
    return typeof value === 'string' ? value.length : 0;
  });

  /**
   * Resolved maximum length.
   */
  readonly resolvedMaxLength = computed<number | null>(() => {
    const maxLengthInput = this.maxLength();
    return unwrapValue(maxLengthInput);
  });

  /**
   * Whether a limit is configured.
   */
  readonly hasLimit = computed(() => this.resolvedMaxLength() !== null);

  /**
   * Remaining characters until limit.
   */
  readonly remaining = computed(() => {
    const max = this.resolvedMaxLength();
    if (max === null) return null;
    return max - this.currentLength();
  });

  /**
   * Percentage of limit used (0-100+).
   */
  readonly percentUsed = computed(() => {
    const max = this.resolvedMaxLength();
    if (max === null || max === 0) return null;
    return (this.currentLength() / max) * 100;
  });

  /**
   * Whether the limit has been exceeded.
   */
  readonly isExceeded = computed(() => {
    const remaining = this.remaining();
    return remaining !== null && remaining < 0;
  });

  /**
   * Current limit state based on thresholds.
   *
   * States:
   * - `ok`: Below warning threshold (default < 80%)
   * - `warning`: At/above warning, below danger (default 80-94%)
   * - `danger`: At/above danger, up to 100% (default 95-100%)
   * - `exceeded`: Over 100% of limit
   */
  readonly limitState = computed<CharacterCountLimitState>(() => {
    const max = this.resolvedMaxLength();
    if (max === null) return 'ok';

    const current = this.currentLength();
    const ratio = current / max;

    /// Exceeded only when OVER the limit, not at exactly 100%
    if (ratio > 1) return 'exceeded';

    const danger = unwrapValue(this.dangerThreshold());
    if (ratio >= danger) return 'danger';

    const warning = unwrapValue(this.warningThreshold());
    if (ratio >= warning) return 'warning';

    return 'ok';
  });
}
