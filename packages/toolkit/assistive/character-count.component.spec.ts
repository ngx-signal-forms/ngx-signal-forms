import {
  ApplicationRef,
  Component,
  effect,
  input,
  signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { form } from '@angular/forms/signals';
import { render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { NgxFormFieldCharacterCountComponent } from './character-count.component';

/**
 * Test suite for NgxFormFieldCharacterCountComponent.
 *
 * Tests cover:
 * - Character count display with real Signal Forms field
 * - Position attribute on host element
 * - Limit state calculation based on thresholds
 * - Custom threshold configuration
 * - showLimitColors toggle
 * - Edge cases (zero/negative maxLength, special characters)
 * - Accessibility attributes
 * - Component structure
 *
 * Testing Strategy:
 * - Uses real FieldTree from Angular Signal Forms (not mocks)
 * - Uses Testing Library queries (screen.getByText) instead of querySelector
 * - Tests user-facing behavior and DOM attributes
 */

/**
 * Test wrapper component that creates a real Signal Forms field.
 * This is needed because form() requires Angular's injection context.
 */
@Component({
  selector: 'ngx-test-wrapper',
  standalone: true,
  imports: [NgxFormFieldCharacterCountComponent],
  template: `
    @if (colorThresholds(); as thresholds) {
      <ngx-signal-form-field-character-count
        [formField]="testForm.text"
        [maxLength]="maxLength()"
        [position]="position()"
        [showLimitColors]="showLimitColors()"
        [liveAnnounce]="liveAnnounce()"
        [colorThresholds]="thresholds"
      />
    } @else {
      <ngx-signal-form-field-character-count
        [formField]="testForm.text"
        [maxLength]="maxLength()"
        [position]="position()"
        [showLimitColors]="showLimitColors()"
        [liveAnnounce]="liveAnnounce()"
      />
    }
  `,
})
class TestWrapperComponent {
  readonly textModel = input<string>('');
  readonly maxLength = input<number>(100);
  readonly position = input<'left' | 'right'>('right');
  readonly showLimitColors = input<boolean>(true);
  readonly liveAnnounce = input<boolean>(false);
  readonly colorThresholds = input<
    { warning: number; danger: number } | undefined
  >(undefined);

  readonly #model = signal<{ text: string }>({ text: '' });
  protected readonly testForm = form(this.#model);

  constructor() {
    // Sync textModel input to the form model
    effect(() => {
      this.#model.set({ text: this.textModel() });
    });
  }
}

describe('NgxFormFieldCharacterCountComponent', () => {
  describe('Basic rendering', () => {
    it('should render the component with character count text', async () => {
      await render(TestWrapperComponent, {
        componentInputs: { textModel: 'test' },
      });

      expect(screen.getByText('4/100')).toBeInTheDocument();
    });

    it('should display character count for longer text', async () => {
      await render(TestWrapperComponent, {
        componentInputs: { textModel: 'Hello World', maxLength: 50 },
      });

      expect(screen.getByText('11/50')).toBeInTheDocument();
    });

    it('should handle empty field value', async () => {
      await render(TestWrapperComponent, {
        componentInputs: { textModel: '' },
      });

      expect(screen.getByText('0/100')).toBeInTheDocument();
    });
  });

  describe('Position attribute', () => {
    it('should default to right position', async () => {
      const { container } = await render(TestWrapperComponent, {
        componentInputs: { textModel: '' },
      });

      const host = container.querySelector(
        'ngx-signal-form-field-character-count',
      );
      expect(host).toHaveAttribute('position', 'right');
    });

    it('should accept left position via input', async () => {
      const { container } = await render(TestWrapperComponent, {
        componentInputs: { textModel: '', position: 'left' as const },
      });

      const host = container.querySelector(
        'ngx-signal-form-field-character-count',
      );
      expect(host).toHaveAttribute('position', 'left');
    });

    it('should accept right position via input', async () => {
      const { container } = await render(TestWrapperComponent, {
        componentInputs: { textModel: '', position: 'right' as const },
      });

      const host = container.querySelector(
        'ngx-signal-form-field-character-count',
      );
      expect(host).toHaveAttribute('position', 'right');
    });
  });

  describe('Limit state calculation', () => {
    it('should set "ok" state when below 80% threshold', async () => {
      const { container } = await render(TestWrapperComponent, {
        componentInputs: { textModel: 'a'.repeat(79), maxLength: 100 },
      });

      const host = container.querySelector(
        'ngx-signal-form-field-character-count',
      );
      expect(host).toHaveAttribute('data-limit-state', 'ok');
      expect(screen.getByText('79/100')).toBeInTheDocument();
    });

    it('should set "warning" state when at 80% threshold', async () => {
      const { container } = await render(TestWrapperComponent, {
        componentInputs: { textModel: 'a'.repeat(80), maxLength: 100 },
      });

      const host = container.querySelector(
        'ngx-signal-form-field-character-count',
      );
      expect(host).toHaveAttribute('data-limit-state', 'warning');
      expect(screen.getByText('80/100')).toBeInTheDocument();
    });

    it('should set "warning" state between 80% and 95%', async () => {
      const { container } = await render(TestWrapperComponent, {
        componentInputs: { textModel: 'a'.repeat(90), maxLength: 100 },
      });

      const host = container.querySelector(
        'ngx-signal-form-field-character-count',
      );
      expect(host).toHaveAttribute('data-limit-state', 'warning');
      expect(screen.getByText('90/100')).toBeInTheDocument();
    });

    it('should set "danger" state when at 95% threshold', async () => {
      const { container } = await render(TestWrapperComponent, {
        componentInputs: { textModel: 'a'.repeat(95), maxLength: 100 },
      });

      const host = container.querySelector(
        'ngx-signal-form-field-character-count',
      );
      expect(host).toHaveAttribute('data-limit-state', 'danger');
      expect(screen.getByText('95/100')).toBeInTheDocument();
    });

    it('should set "danger" state between 95% and 100%', async () => {
      const { container } = await render(TestWrapperComponent, {
        componentInputs: { textModel: 'a'.repeat(99), maxLength: 100 },
      });

      const host = container.querySelector(
        'ngx-signal-form-field-character-count',
      );
      expect(host).toHaveAttribute('data-limit-state', 'danger');
      expect(screen.getByText('99/100')).toBeInTheDocument();
    });

    it('should set "danger" state when exactly at limit', async () => {
      const { container } = await render(TestWrapperComponent, {
        componentInputs: { textModel: 'a'.repeat(100), maxLength: 100 },
      });

      const host = container.querySelector(
        'ngx-signal-form-field-character-count',
      );
      expect(host).toHaveAttribute('data-limit-state', 'danger');
      expect(screen.getByText('100/100')).toBeInTheDocument();
    });

    it('should set "exceeded" state when over 100%', async () => {
      const { container } = await render(TestWrapperComponent, {
        componentInputs: { textModel: 'a'.repeat(101), maxLength: 100 },
      });

      const host = container.querySelector(
        'ngx-signal-form-field-character-count',
      );
      expect(host).toHaveAttribute('data-limit-state', 'exceeded');
      expect(screen.getByText('101/100')).toBeInTheDocument();
    });

    it('should set "exceeded" state when significantly over limit', async () => {
      const { container } = await render(TestWrapperComponent, {
        componentInputs: { textModel: 'a'.repeat(150), maxLength: 100 },
      });

      const host = container.querySelector(
        'ngx-signal-form-field-character-count',
      );
      expect(host).toHaveAttribute('data-limit-state', 'exceeded');
      expect(screen.getByText('150/100')).toBeInTheDocument();
    });
  });

  describe('Custom thresholds', () => {
    it('should use custom warning threshold', async () => {
      const { container } = await render(TestWrapperComponent, {
        componentInputs: {
          textModel: 'a'.repeat(85),
          maxLength: 100,
          colorThresholds: { warning: 85, danger: 95 },
        },
      });

      const host = container.querySelector(
        'ngx-signal-form-field-character-count',
      );
      expect(host).toHaveAttribute('data-limit-state', 'warning');
      expect(screen.getByText('85/100')).toBeInTheDocument();
    });

    it('should use custom danger threshold', async () => {
      const { container } = await render(TestWrapperComponent, {
        componentInputs: {
          textModel: 'a'.repeat(98),
          maxLength: 100,
          colorThresholds: { warning: 90, danger: 98 },
        },
      });

      const host = container.querySelector(
        'ngx-signal-form-field-character-count',
      );
      expect(host).toHaveAttribute('data-limit-state', 'danger');
      expect(screen.getByText('98/100')).toBeInTheDocument();
    });

    it('should clamp custom thresholds to valid range (0-100)', async () => {
      const { container } = await render(TestWrapperComponent, {
        componentInputs: {
          textModel: 'a'.repeat(50),
          maxLength: 100,
          colorThresholds: { warning: 150, danger: 200 },
        },
      });

      const host = container.querySelector(
        'ngx-signal-form-field-character-count',
      );
      // When thresholds are clamped to 100, 50% is below the warning threshold
      expect(host).toHaveAttribute('data-limit-state', 'ok');
      expect(screen.getByText('50/100')).toBeInTheDocument();
    });
  });

  describe('showLimitColors option', () => {
    it('should apply color states by default', async () => {
      const { container } = await render(TestWrapperComponent, {
        componentInputs: { textModel: 'a'.repeat(90), maxLength: 100 },
      });

      const host = container.querySelector(
        'ngx-signal-form-field-character-count',
      );
      expect(host).toHaveAttribute('data-limit-state', 'warning');
      expect(screen.getByText('90/100')).toBeInTheDocument();
    });

    it('should set "disabled" state when showLimitColors is false', async () => {
      const { container } = await render(TestWrapperComponent, {
        componentInputs: {
          textModel: 'a'.repeat(90),
          maxLength: 100,
          showLimitColors: false,
        },
      });

      const host = container.querySelector(
        'ngx-signal-form-field-character-count',
      );
      expect(host).toHaveAttribute('data-limit-state', 'disabled');
      expect(screen.getByText('90/100')).toBeInTheDocument();
    });

    it('should set "disabled" state even when over limit if showLimitColors is false', async () => {
      const { container } = await render(TestWrapperComponent, {
        componentInputs: {
          textModel: 'a'.repeat(110),
          maxLength: 100,
          showLimitColors: false,
        },
      });

      const host = container.querySelector(
        'ngx-signal-form-field-character-count',
      );
      expect(host).toHaveAttribute('data-limit-state', 'disabled');
      expect(screen.getByText('110/100')).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('should handle maxLength of 0', async () => {
      const { container } = await render(TestWrapperComponent, {
        componentInputs: { textModel: 'test', maxLength: 0 },
      });

      const host = container.querySelector(
        'ngx-signal-form-field-character-count',
      );
      // maxLength of 0 means "no limit", so state is 'disabled'
      expect(host).toHaveAttribute('data-limit-state', 'disabled');
      // Display shows current count only (no /0)
      expect(screen.getByText('4')).toBeInTheDocument();
    });

    it('should handle negative maxLength by treating as 0', async () => {
      await render(TestWrapperComponent, {
        componentInputs: { textModel: 'test', maxLength: -5 },
      });

      // Negative maxLength is clamped to 0, which means "no limit"
      expect(screen.getByText('4')).toBeInTheDocument();
    });

    it('should handle very long text', async () => {
      const { container } = await render(TestWrapperComponent, {
        componentInputs: { textModel: 'a'.repeat(10000), maxLength: 100 },
      });

      expect(screen.getByText('10000/100')).toBeInTheDocument();
      const host = container.querySelector(
        'ngx-signal-form-field-character-count',
      );
      expect(host).toHaveAttribute('data-limit-state', 'exceeded');
    });

    it('should handle special characters in field value', async () => {
      await render(TestWrapperComponent, {
        componentInputs: {
          textModel: 'Hello 🎉 World! 你好',
          maxLength: 100,
        },
      });

      const expectedLength = 'Hello 🎉 World! 你好'.length;
      expect(screen.getByText(`${expectedLength}/100`)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should not render a live region when liveAnnounce is false', async () => {
      const { container } = await render(TestWrapperComponent, {
        componentInputs: { textModel: 'test', maxLength: 100 },
      });

      const liveRegion = container.querySelector(
        '.ngx-signal-form-field-char-count__sr',
      );
      expect(liveRegion).toBeNull();
    });

    it('should render a polite live region when liveAnnounce is true', async () => {
      const { container } = await render(TestWrapperComponent, {
        componentInputs: {
          textModel: 'a'.repeat(80),
          maxLength: 100,
          liveAnnounce: true,
        },
      });

      const liveRegion = container.querySelector(
        '.ngx-signal-form-field-char-count__sr',
      );
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
      expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
      expect(liveRegion).toHaveTextContent(
        'Approaching limit: 20 characters remaining.',
      );
    });

    it('should update announcement text when limit state changes', async () => {
      const { container, rerender } = await render(TestWrapperComponent, {
        componentInputs: {
          textModel: 'a'.repeat(79),
          maxLength: 100,
          liveAnnounce: true,
        },
      });

      const liveRegion = () =>
        container.querySelector('.ngx-signal-form-field-char-count__sr');

      expect(liveRegion()).toHaveTextContent('');

      await rerender({
        componentInputs: {
          textModel: 'a'.repeat(95),
          maxLength: 100,
          liveAnnounce: true,
        },
      });

      await TestBed.inject(ApplicationRef).whenStable();

      expect(liveRegion()).toHaveTextContent(
        'Almost at limit: 5 characters remaining.',
      );

      await rerender({
        componentInputs: {
          textModel: 'a'.repeat(105),
          maxLength: 100,
          liveAnnounce: true,
        },
      });

      await TestBed.inject(ApplicationRef).whenStable();

      expect(liveRegion()).toHaveTextContent(
        'Character limit exceeded by 5 characters.',
      );
    });
  });

  describe('Component structure', () => {
    it('should have correct element tag', async () => {
      const { container } = await render(TestWrapperComponent, {
        componentInputs: { textModel: '' },
      });

      const host = container.querySelector(
        'ngx-signal-form-field-character-count',
      );
      expect(host).toBeTruthy();
      expect(screen.getByText('0/100')).toBeInTheDocument();
    });

    it('should render inside host element', async () => {
      const { container } = await render(TestWrapperComponent, {
        componentInputs: { textModel: '', maxLength: 100 },
      });

      const host = container.querySelector(
        'ngx-signal-form-field-character-count',
      );
      expect(host).toBeTruthy();
      expect(host?.textContent).toContain('0/100');
    });
  });
});
