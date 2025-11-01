import { Component, effect, input, inputBinding, signal } from '@angular/core';
import { form } from '@angular/forms/signals';
import { render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { NgxSignalFormFieldCharacterCountComponent } from './form-field-character-count.component';

/**
 * Test suite for NgxSignalFormFieldCharacterCountComponent.
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
  selector: 'test-wrapper',
  standalone: true,
  imports: [NgxSignalFormFieldCharacterCountComponent],
  template: `
    @if (colorThresholds(); as thresholds) {
      <ngx-signal-form-field-character-count
        [field]="testForm.text"
        [maxLength]="maxLength()"
        [position]="position()"
        [showLimitColors]="showLimitColors()"
        [colorThresholds]="thresholds"
      />
    } @else {
      <ngx-signal-form-field-character-count
        [field]="testForm.text"
        [maxLength]="maxLength()"
        [position]="position()"
        [showLimitColors]="showLimitColors()"
      />
    }
  `,
})
class TestWrapperComponent {
  readonly textModel = input<string>('');
  readonly maxLength = input<number>(100);
  readonly position = input<'left' | 'right'>('right');
  readonly showLimitColors = input<boolean>(true);
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

describe('NgxSignalFormFieldCharacterCountComponent', () => {
  describe('Basic rendering', () => {
    it('should render the component with character count text', async () => {
      await render(TestWrapperComponent, {
        bindings: [inputBinding('textModel', signal('test'))],
      });

      expect(screen.getByText('4/100')).toBeInTheDocument();
    });

    it('should display character count for longer text', async () => {
      await render(TestWrapperComponent, {
        bindings: [
          inputBinding('textModel', signal('Hello World')),
          inputBinding('maxLength', signal(50)),
        ],
      });

      expect(screen.getByText('11/50')).toBeInTheDocument();
    });

    it('should handle empty field value', async () => {
      await render(TestWrapperComponent, {
        bindings: [inputBinding('textModel', signal(''))],
      });

      expect(screen.getByText('0/100')).toBeInTheDocument();
    });
  });

  describe('Position attribute', () => {
    it('should default to right position', async () => {
      const { container } = await render(TestWrapperComponent, {
        bindings: [inputBinding('textModel', signal(''))],
      });

      const host = container.querySelector(
        'ngx-signal-form-field-character-count',
      );
      expect(host).toHaveAttribute('position', 'right');
    });

    it('should accept left position via input', async () => {
      const { container } = await render(TestWrapperComponent, {
        bindings: [
          inputBinding('textModel', signal('')),
          inputBinding('position', signal('left' as const)),
        ],
      });

      const host = container.querySelector(
        'ngx-signal-form-field-character-count',
      );
      expect(host).toHaveAttribute('position', 'left');
    });

    it('should accept right position via input', async () => {
      const { container } = await render(TestWrapperComponent, {
        bindings: [
          inputBinding('textModel', signal('')),
          inputBinding('position', signal('right' as const)),
        ],
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
        bindings: [
          inputBinding('textModel', signal('a'.repeat(79))),
          inputBinding('maxLength', signal(100)),
        ],
      });

      const element = container.querySelector('.ngx-form-field-char-count');
      expect(element).toHaveAttribute('data-limit-state', 'ok');
      expect(screen.getByText('79/100')).toBeInTheDocument();
    });

    it('should set "warning" state when at 80% threshold', async () => {
      const { container } = await render(TestWrapperComponent, {
        bindings: [
          inputBinding('textModel', signal('a'.repeat(80))),
          inputBinding('maxLength', signal(100)),
        ],
      });

      const element = container.querySelector('.ngx-form-field-char-count');
      expect(element).toHaveAttribute('data-limit-state', 'warning');
      expect(screen.getByText('80/100')).toBeInTheDocument();
    });

    it('should set "warning" state between 80% and 95%', async () => {
      const { container } = await render(TestWrapperComponent, {
        bindings: [
          inputBinding('textModel', signal('a'.repeat(90))),
          inputBinding('maxLength', signal(100)),
        ],
      });

      const element = container.querySelector('.ngx-form-field-char-count');
      expect(element).toHaveAttribute('data-limit-state', 'warning');
      expect(screen.getByText('90/100')).toBeInTheDocument();
    });

    it('should set "danger" state when at 95% threshold', async () => {
      const { container } = await render(TestWrapperComponent, {
        bindings: [
          inputBinding('textModel', signal('a'.repeat(95))),
          inputBinding('maxLength', signal(100)),
        ],
      });

      const element = container.querySelector('.ngx-form-field-char-count');
      expect(element).toHaveAttribute('data-limit-state', 'danger');
      expect(screen.getByText('95/100')).toBeInTheDocument();
    });

    it('should set "danger" state between 95% and 100%', async () => {
      const { container } = await render(TestWrapperComponent, {
        bindings: [
          inputBinding('textModel', signal('a'.repeat(99))),
          inputBinding('maxLength', signal(100)),
        ],
      });

      const element = container.querySelector('.ngx-form-field-char-count');
      expect(element).toHaveAttribute('data-limit-state', 'danger');
      expect(screen.getByText('99/100')).toBeInTheDocument();
    });

    it('should set "danger" state when exactly at limit', async () => {
      const { container } = await render(TestWrapperComponent, {
        bindings: [
          inputBinding('textModel', signal('a'.repeat(100))),
          inputBinding('maxLength', signal(100)),
        ],
      });

      const element = container.querySelector('.ngx-form-field-char-count');
      expect(element).toHaveAttribute('data-limit-state', 'danger');
      expect(screen.getByText('100/100')).toBeInTheDocument();
    });

    it('should set "exceeded" state when over 100%', async () => {
      const { container } = await render(TestWrapperComponent, {
        bindings: [
          inputBinding('textModel', signal('a'.repeat(101))),
          inputBinding('maxLength', signal(100)),
        ],
      });

      const element = container.querySelector('.ngx-form-field-char-count');
      expect(element).toHaveAttribute('data-limit-state', 'exceeded');
      expect(screen.getByText('101/100')).toBeInTheDocument();
    });

    it('should set "exceeded" state when significantly over limit', async () => {
      const { container } = await render(TestWrapperComponent, {
        bindings: [
          inputBinding('textModel', signal('a'.repeat(150))),
          inputBinding('maxLength', signal(100)),
        ],
      });

      const element = container.querySelector('.ngx-form-field-char-count');
      expect(element).toHaveAttribute('data-limit-state', 'exceeded');
      expect(screen.getByText('150/100')).toBeInTheDocument();
    });
  });

  describe('Custom thresholds', () => {
    it('should use custom warning threshold', async () => {
      const { container } = await render(TestWrapperComponent, {
        bindings: [
          inputBinding('textModel', signal('a'.repeat(85))),
          inputBinding('maxLength', signal(100)),
          inputBinding('colorThresholds', signal({ warning: 85, danger: 95 })),
        ],
      });

      const element = container.querySelector('.ngx-form-field-char-count');
      expect(element).toHaveAttribute('data-limit-state', 'warning');
      expect(screen.getByText('85/100')).toBeInTheDocument();
    });

    it('should use custom danger threshold', async () => {
      const { container } = await render(TestWrapperComponent, {
        bindings: [
          inputBinding('textModel', signal('a'.repeat(98))),
          inputBinding('maxLength', signal(100)),
          inputBinding('colorThresholds', signal({ warning: 90, danger: 98 })),
        ],
      });

      const element = container.querySelector('.ngx-form-field-char-count');
      expect(element).toHaveAttribute('data-limit-state', 'danger');
      expect(screen.getByText('98/100')).toBeInTheDocument();
    });

    it('should clamp custom thresholds to valid range (0-100)', async () => {
      const { container } = await render(TestWrapperComponent, {
        bindings: [
          inputBinding('textModel', signal('a'.repeat(50))),
          inputBinding('maxLength', signal(100)),
          inputBinding(
            'colorThresholds',
            signal({ warning: 150, danger: 200 }),
          ),
        ],
      });

      const element = container.querySelector('.ngx-form-field-char-count');
      // When thresholds are clamped to 100, 50% is below the warning threshold
      expect(element).toHaveAttribute('data-limit-state', 'ok');
      expect(screen.getByText('50/100')).toBeInTheDocument();
    });
  });

  describe('showLimitColors option', () => {
    it('should apply color states by default', async () => {
      const { container } = await render(TestWrapperComponent, {
        bindings: [
          inputBinding('textModel', signal('a'.repeat(90))),
          inputBinding('maxLength', signal(100)),
        ],
      });

      const element = container.querySelector('.ngx-form-field-char-count');
      expect(element).toHaveAttribute('data-limit-state', 'warning');
      expect(screen.getByText('90/100')).toBeInTheDocument();
    });

    it('should set "disabled" state when showLimitColors is false', async () => {
      const { container } = await render(TestWrapperComponent, {
        bindings: [
          inputBinding('textModel', signal('a'.repeat(90))),
          inputBinding('maxLength', signal(100)),
          inputBinding('showLimitColors', signal(false)),
        ],
      });

      const element = container.querySelector('.ngx-form-field-char-count');
      expect(element).toHaveAttribute('data-limit-state', 'disabled');
      expect(screen.getByText('90/100')).toBeInTheDocument();
    });

    it('should set "disabled" state even when over limit if showLimitColors is false', async () => {
      const { container } = await render(TestWrapperComponent, {
        bindings: [
          inputBinding('textModel', signal('a'.repeat(110))),
          inputBinding('maxLength', signal(100)),
          inputBinding('showLimitColors', signal(false)),
        ],
      });

      const element = container.querySelector('.ngx-form-field-char-count');
      expect(element).toHaveAttribute('data-limit-state', 'disabled');
      expect(screen.getByText('110/100')).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('should handle maxLength of 0', async () => {
      const { container } = await render(TestWrapperComponent, {
        bindings: [
          inputBinding('textModel', signal('test')),
          inputBinding('maxLength', signal(0)),
        ],
      });

      const element = container.querySelector('.ngx-form-field-char-count');
      // maxLength of 0 means "no limit", so state is 'disabled'
      expect(element).toHaveAttribute('data-limit-state', 'disabled');
      // Display shows current count only (no /0)
      expect(screen.getByText('4')).toBeInTheDocument();
    });

    it('should handle negative maxLength by treating as 0', async () => {
      await render(TestWrapperComponent, {
        bindings: [
          inputBinding('textModel', signal('test')),
          inputBinding('maxLength', signal(-5)),
        ],
      });

      // Negative maxLength is clamped to 0, which means "no limit"
      expect(screen.getByText('4')).toBeInTheDocument();
    });

    it('should handle very long text', async () => {
      const { container } = await render(TestWrapperComponent, {
        bindings: [
          inputBinding('textModel', signal('a'.repeat(10000))),
          inputBinding('maxLength', signal(100)),
        ],
      });

      expect(screen.getByText('10000/100')).toBeInTheDocument();
      const element = container.querySelector('.ngx-form-field-char-count');
      expect(element).toHaveAttribute('data-limit-state', 'exceeded');
    });

    it('should handle special characters in field value', async () => {
      await render(TestWrapperComponent, {
        bindings: [
          inputBinding('textModel', signal('Hello 🎉 World! 你好')),
          inputBinding('maxLength', signal(100)),
        ],
      });

      const expectedLength = 'Hello 🎉 World! 你好'.length;
      expect(screen.getByText(`${expectedLength}/100`)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it.skip('should have aria-live region', async () => {
      // TODO: Add aria-live="polite" to component template
      const { container } = await render(TestWrapperComponent, {
        bindings: [
          inputBinding('textModel', signal('test')),
          inputBinding('maxLength', signal(100)),
        ],
      });

      const element = container.querySelector('.ngx-form-field-char-count');
      expect(element).toHaveAttribute('aria-live', 'polite');
    });

    it.skip('should have aria-atomic for complete announcements', async () => {
      // TODO: Add aria-atomic="true" to component template
      const { container } = await render(TestWrapperComponent, {
        bindings: [
          inputBinding('textModel', signal('test')),
          inputBinding('maxLength', signal(100)),
        ],
      });

      const element = container.querySelector('.ngx-form-field-char-count');
      expect(element).toHaveAttribute('aria-atomic', 'true');
    });
  });

  describe('Component structure', () => {
    it('should have correct CSS class', async () => {
      const { container } = await render(TestWrapperComponent, {
        bindings: [inputBinding('textModel', signal(''))],
      });

      const element = container.querySelector('.ngx-form-field-char-count');
      expect(element).toBeTruthy();
      expect(screen.getByText('0/100')).toBeInTheDocument();
    });

    it('should render inside host element', async () => {
      const { container } = await render(TestWrapperComponent, {
        bindings: [
          inputBinding('textModel', signal('')),
          inputBinding('maxLength', signal(100)),
        ],
      });

      const host = container.querySelector(
        'ngx-signal-form-field-character-count',
      );
      const innerElement = host?.querySelector('.ngx-form-field-char-count');

      expect(host).toBeTruthy();
      expect(innerElement).toBeTruthy();
    });
  });
});
