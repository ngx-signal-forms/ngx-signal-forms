import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  signal,
} from '@angular/core';
import type { FormValueControl, ValidationError } from '@angular/forms/signals';

/**
 * Custom star rating control implementing Angular Signal Forms FormValueControl interface.
 *
 * This component demonstrates how to create a custom form control that integrates
 * seamlessly with Angular Signal Forms and @ngx-signal-forms/toolkit.
 *
 * @example Basic usage with formField directive
 * ```html
 * <app-rating-control id="rating" [formField]="form.rating" />
 * ```
 *
 * @example With form field wrapper (auto-derives fieldName from id)
 * ```html
 * <ngx-signal-form-field-wrapper [formField]="form.rating">
 *   <label for="rating">Product Rating</label>
 *   <app-rating-control id="rating" [formField]="form.rating" />
 * </ngx-signal-form-field-wrapper>
 * ```
 */
@Component({
  selector: 'ngx-rating-control',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-ngx-signal-form-control': '',
    role: 'slider',
    tabindex: '0',
    '[attr.aria-labelledby]': 'labelledBy()',
    '[attr.aria-valuemin]': '0',
    '[attr.aria-valuemax]': 'maxRating()',
    '[attr.aria-valuenow]': 'currentValue()',
    '[attr.aria-valuetext]': 'valueText()',
    '[attr.aria-describedby]': 'describedBy()',
    '[attr.aria-invalid]': 'invalid() ? "true" : "false"',
    '[attr.aria-disabled]': 'disabled() ? "true" : "false"',
    '[attr.aria-required]': 'required() ? "true" : null',
    '[class.rating-control--disabled]': 'disabled()',
    '[class.rating-control--invalid]': 'invalid()',
    '[class.rating-control--focused]': 'focused()',
    '(keydown)': 'onKeydown($event)',
    '(focus)': 'onFocus()',
    '(blur)': 'onBlur()',
  },
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      min-block-size: 2rem;
      padding: 0.25rem 0.125rem;
      border-radius: 9999px;
      outline: none;
      cursor: pointer;
      transition:
        background-color 0.15s ease-in-out,
        box-shadow 0.15s ease-in-out,
        transform 0.15s ease-in-out;
    }

    :host(:focus-visible) {
      background-color: color-mix(in srgb, #fbbf24 10%, transparent);
      box-shadow: 0 0 0 3px color-mix(in srgb, #007bc7 55%, transparent);
    }

    :host([data-signal-field]:focus-visible) {
      box-shadow: none;
    }

    :host(.rating-control--disabled) {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .star {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-inline-size: 1.5rem;
      min-block-size: 1.5rem;
      font-size: 1.625rem;
      line-height: 1;
      transition:
        transform 0.1s ease-in-out,
        color 0.15s ease-in-out,
        filter 0.15s ease-in-out;
      user-select: none;
    }

    .star:hover:not(.star--disabled) {
      transform: scale(1.14);
      filter: drop-shadow(
        0 0 0.35rem color-mix(in srgb, #fbbf24 35%, transparent)
      );
    }

    .star--filled {
      color: #fbbf24;
    }

    .star--empty {
      color: #d1d5db;
    }

    .star--disabled {
      cursor: not-allowed;
    }

    @media (prefers-color-scheme: dark) {
      .star--empty {
        color: #4b5563;
      }
    }
  `,
  template: `
    @for (star of stars(); track star) {
      <!-- Accessibility handled by host (role=slider). Stars are presentational controls. -->
      <span
        class="star"
        aria-hidden="true"
        [class.star--filled]="star <= currentValue()"
        [class.star--empty]="star > currentValue()"
        [class.star--disabled]="disabled()"
        (click)="selectRating(star)"
        (mouseenter)="hoverRating(star)"
        (mouseleave)="clearHover()"
        [attr.data-star]="star"
      >
        {{ star <= (hoveredRating() || value()) ? '★' : '☆' }}
      </span>
    }
  `,
})
export class RatingControlComponent implements FormValueControl<number> {
  /**
   * Optional aria-labelledby source for visible labels projected outside
   * the custom control host.
   */
  readonly labelledBy = input<string | null>(null);

  /**
   * Maximum rating value (number of stars).
   * @default 5
   */
  readonly maxRating = input(5);

  /**
   * Optional aria-describedby chain for demos or wrappers that keep ARIA
   * ownership on the custom control host.
   */
  readonly describedBy = input<string | null>(null);

  /**
   * The current rating value - required by FormValueControl interface.
   * Bound bidirectionally with the form field via [formField] directive.
   */
  readonly value = model(0);

  /**
   * Touched state - tracks user interaction.
   * Set to true on blur or when user selects a rating.
   */
  readonly touched = model(false);

  /**
   * Disabled state - read-only input from form.
   */
  readonly disabled = input(false);

  /**
   * Invalid state - read-only input from form validation.
   */
  readonly invalid = input(false);

  /**
   * Validation errors - read-only input from form.
   * Using ValidationError to satisfy FormValueControl interface compatibility.
   */
  readonly errors = input<readonly ValidationError[]>([]);

  /**
   * Required constraint from form validation.
   */
  readonly required = input(false);

  /**
   * Currently hovered star (for visual feedback).
   */
  readonly hoveredRating = model(0);

  /**
   * Track focus state for styling.
   */
  protected readonly focused = signal(false);

  /**
   * Array of star indices for template iteration.
   */
  protected readonly stars = computed(() =>
    Array.from({ length: this.maxRating() }, (_, i) => i + 1),
  );

  /**
   * Normalized current value for ARIA attributes and keyboard handling.
   */
  protected readonly currentValue = computed(() => this.value());

  /**
   * Accessible value text for screen readers.
   */
  protected readonly valueText = computed(() =>
    this.currentValue() === 0
      ? 'No rating'
      : `${this.currentValue()} out of ${this.maxRating()} stars`,
  );

  /**
   * Handle keyboard navigation.
   */
  protected onKeydown(event: KeyboardEvent): void {
    if (this.disabled()) return;

    const current = this.currentValue();
    const max = this.maxRating();

    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault();
        if (current < max) {
          this.value.set(current + 1);
          this.touched.set(true);
        }
        break;
      case 'ArrowLeft':
        event.preventDefault();
        if (current > 0) {
          this.value.set(current - 1);
          this.touched.set(true);
        }
        break;
      case 'Home':
        event.preventDefault();
        this.value.set(0);
        this.touched.set(true);
        break;
      case 'End':
        event.preventDefault();
        this.value.set(max);
        this.touched.set(true);
        break;
    }
  }

  protected onFocus(): void {
    this.focused.set(true);
  }

  protected onBlur(): void {
    this.focused.set(false);
    this.touched.set(true);
  }

  /**
   * Select a specific rating.
   */
  protected selectRating(rating: number): void {
    if (this.disabled()) return;
    this.value.set(rating);
    this.touched.set(true);
  }

  /**
   * Handle hover for visual feedback.
   */
  protected hoverRating(rating: number): void {
    if (this.disabled()) return;
    this.hoveredRating.set(rating);
  }

  /**
   * Clear hover state.
   */
  protected clearHover(): void {
    this.hoveredRating.set(0);
  }
}
