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
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'slider',
    tabindex: '0',
    '[attr.aria-valuemin]': '0',
    '[attr.aria-valuemax]': 'maxRating()',
    '[attr.aria-valuenow]': 'value()',
    '[attr.aria-valuetext]': 'valueText()',
    '[attr.aria-invalid]': 'invalid()',
    '[attr.aria-disabled]': 'disabled()',
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
      gap: 0.25rem;
      padding: 0.25rem;
      border-radius: 0.25rem;
      outline: none;
      cursor: pointer;
      transition: box-shadow 0.15s ease-in-out;
    }

    :host(:focus-visible) {
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);
    }

    :host(.rating-control--disabled) {
      opacity: 0.5;
      cursor: not-allowed;
    }

    :host(.rating-control--invalid) {
      box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.5);
    }

    .star {
      font-size: 1.5rem;
      line-height: 1;
      transition:
        transform 0.1s ease-in-out,
        color 0.15s ease-in-out;
      user-select: none;
    }

    .star:hover:not(.star--disabled) {
      transform: scale(1.2);
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
        [class.star--filled]="star <= value()"
        [class.star--empty]="star > value()"
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
   * Maximum rating value (number of stars).
   * @default 5
   */
  readonly maxRating = input<number>(5);

  /**
   * The current rating value - required by FormValueControl interface.
   * Bound bidirectionally with the form field via [formField] directive.
   */
  readonly value = model<number>(0);

  /**
   * Touched state - tracks user interaction.
   * Set to true on blur or when user selects a rating.
   */
  readonly touched = model<boolean>(false);

  /**
   * Disabled state - read-only input from form.
   */
  readonly disabled = input<boolean>(false);

  /**
   * Invalid state - read-only input from form validation.
   */
  readonly invalid = input<boolean>(false);

  /**
   * Validation errors - read-only input from form.
   * Using ValidationError to satisfy FormValueControl interface compatibility.
   */
  readonly errors = input<readonly ValidationError[]>([]);

  /**
   * Required constraint from form validation.
   */
  readonly required = input<boolean>(false);

  /**
   * Currently hovered star (for visual feedback).
   */
  readonly hoveredRating = model<number>(0);

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
   * Accessible value text for screen readers.
   */
  protected readonly valueText = computed(() =>
    this.value() === 0
      ? 'No rating'
      : `${this.value()} out of ${this.maxRating()} stars`,
  );

  /**
   * Handle keyboard navigation.
   */
  protected onKeydown(event: KeyboardEvent): void {
    if (this.disabled()) return;

    const current = this.value();
    const max = this.maxRating();

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        event.preventDefault();
        if (current < max) {
          this.value.set(current + 1);
          this.touched.set(true);
        }
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
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
