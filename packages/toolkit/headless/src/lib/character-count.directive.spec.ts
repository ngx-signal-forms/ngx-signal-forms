import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { NgxHeadlessCharacterCountDirective } from './character-count.directive';

describe('NgxHeadlessCharacterCountDirective', () => {
  describe('character count signals', () => {
    it('should expose currentLength signal', async () => {
      @Component({
        selector: 'ngx-test-current-length',
        imports: [FormField, NgxHeadlessCharacterCountDirective],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <div>
            <textarea id="bio" [formField]="contactForm.bio"></textarea>
            <div
              ngxSignalFormHeadlessCharacterCount
              #charCount="characterCount"
              [field]="contactForm.bio"
              [maxLength]="100"
            >
              <span data-testid="current-length">{{ charCount.currentLength() }}</span>
            </div>
          </div>
        `,
      })
      class TestComponent {
        readonly #model = signal({ bio: 'Hello World' });
        readonly contactForm = form(this.#model);
      }

      await render(TestComponent);

      expect(screen.getByTestId('current-length').textContent).toBe('11');
    });

    it('should expose resolvedMaxLength signal', async () => {
      @Component({
        selector: 'ngx-test-max-length',
        imports: [FormField, NgxHeadlessCharacterCountDirective],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <div>
            <textarea id="bio" [formField]="contactForm.bio"></textarea>
            <div
              ngxSignalFormHeadlessCharacterCount
              #charCount="characterCount"
              [field]="contactForm.bio"
              [maxLength]="200"
            >
              <span data-testid="max-length">{{ charCount.resolvedMaxLength() }}</span>
            </div>
          </div>
        `,
      })
      class TestComponent {
        readonly #model = signal({ bio: '' });
        readonly contactForm = form(this.#model);
      }

      await render(TestComponent);

      expect(screen.getByTestId('max-length').textContent).toBe('200');
    });

    it('should expose remaining signal', async () => {
      @Component({
        selector: 'ngx-test-remaining',
        imports: [FormField, NgxHeadlessCharacterCountDirective],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <div>
            <textarea id="bio" [formField]="contactForm.bio"></textarea>
            <div
              ngxSignalFormHeadlessCharacterCount
              #charCount="characterCount"
              [field]="contactForm.bio"
              [maxLength]="100"
            >
              <span data-testid="remaining">{{ charCount.remaining() }}</span>
            </div>
          </div>
        `,
      })
      class TestComponent {
        readonly #model = signal({ bio: 'Hello World' }); // 11 chars
        readonly contactForm = form(this.#model);
      }

      await render(TestComponent);

      expect(screen.getByTestId('remaining').textContent).toBe('89');
    });

    it('should show negative remaining when exceeded', async () => {
      @Component({
        selector: 'ngx-test-negative-remaining',
        imports: [FormField, NgxHeadlessCharacterCountDirective],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <div>
            <textarea id="bio" [formField]="contactForm.bio"></textarea>
            <div
              ngxSignalFormHeadlessCharacterCount
              #charCount="characterCount"
              [field]="contactForm.bio"
              [maxLength]="5"
            >
              <span data-testid="remaining">{{ charCount.remaining() }}</span>
              <span data-testid="exceeded">{{ charCount.isExceeded() }}</span>
            </div>
          </div>
        `,
      })
      class TestComponent {
        readonly #model = signal({ bio: 'Hello World' }); // 11 chars
        readonly contactForm = form(this.#model);
      }

      await render(TestComponent);

      expect(screen.getByTestId('remaining').textContent).toBe('-6');
      expect(screen.getByTestId('exceeded').textContent).toBe('true');
    });

    it('should expose hasLimit signal', async () => {
      @Component({
        selector: 'ngx-test-has-limit',
        imports: [FormField, NgxHeadlessCharacterCountDirective],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <div>
            <textarea id="bio" [formField]="contactForm.bio"></textarea>
            <div
              ngxSignalFormHeadlessCharacterCount
              #charCount="characterCount"
              [field]="contactForm.bio"
              [maxLength]="100"
            >
              <span data-testid="has-limit">{{ charCount.hasLimit() }}</span>
            </div>
          </div>
        `,
      })
      class TestComponent {
        readonly #model = signal({ bio: '' });
        readonly contactForm = form(this.#model);
      }

      await render(TestComponent);

      expect(screen.getByTestId('has-limit').textContent).toBe('true');
    });

    it('should expose percentUsed signal', async () => {
      @Component({
        selector: 'ngx-test-percent-used',
        imports: [FormField, NgxHeadlessCharacterCountDirective],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <div>
            <textarea id="bio" [formField]="contactForm.bio"></textarea>
            <div
              ngxSignalFormHeadlessCharacterCount
              #charCount="characterCount"
              [field]="contactForm.bio"
              [maxLength]="100"
            >
              <span data-testid="percent-used">{{ charCount.percentUsed() }}</span>
            </div>
          </div>
        `,
      })
      class TestComponent {
        readonly #model = signal({ bio: '1234567890' }); // 10 chars
        readonly contactForm = form(this.#model);
      }

      await render(TestComponent);

      expect(screen.getByTestId('percent-used').textContent).toBe('10');
    });
  });

  describe('limit state transitions', () => {
    it('should be "ok" state when under warning threshold', async () => {
      @Component({
        selector: 'ngx-test-ok-state',
        imports: [FormField, NgxHeadlessCharacterCountDirective],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <div>
            <textarea id="bio" [formField]="contactForm.bio"></textarea>
            <div
              ngxSignalFormHeadlessCharacterCount
              #charCount="characterCount"
              [field]="contactForm.bio"
              [maxLength]="100"
            >
              <span data-testid="limit-state">{{ charCount.limitState() }}</span>
            </div>
          </div>
        `,
      })
      class TestComponent {
        readonly #model = signal({ bio: '12345' }); // 5% used
        readonly contactForm = form(this.#model);
      }

      await render(TestComponent);

      expect(screen.getByTestId('limit-state').textContent).toBe('ok');
    });

    it('should be "warning" state when at warning threshold', async () => {
      @Component({
        selector: 'ngx-test-warning-state',
        imports: [FormField, NgxHeadlessCharacterCountDirective],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <div>
            <textarea id="bio" [formField]="contactForm.bio"></textarea>
            <div
              ngxSignalFormHeadlessCharacterCount
              #charCount="characterCount"
              [field]="contactForm.bio"
              [maxLength]="100"
              [warningThreshold]="0.8"
            >
              <span data-testid="limit-state">{{ charCount.limitState() }}</span>
            </div>
          </div>
        `,
      })
      class TestComponent {
        // 80 chars = exactly at 80% threshold
        readonly #model = signal({
          bio: '12345678901234567890123456789012345678901234567890123456789012345678901234567890',
        });
        readonly contactForm = form(this.#model);
      }

      await render(TestComponent);

      expect(screen.getByTestId('limit-state').textContent).toBe('warning');
    });

    it('should be "danger" state when at danger threshold', async () => {
      @Component({
        selector: 'ngx-test-danger-state',
        imports: [FormField, NgxHeadlessCharacterCountDirective],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <div>
            <textarea id="bio" [formField]="contactForm.bio"></textarea>
            <div
              ngxSignalFormHeadlessCharacterCount
              #charCount="characterCount"
              [field]="contactForm.bio"
              [maxLength]="100"
              [dangerThreshold]="0.95"
            >
              <span data-testid="limit-state">{{ charCount.limitState() }}</span>
            </div>
          </div>
        `,
      })
      class TestComponent {
        // 95 chars = exactly at 95% threshold
        readonly #model = signal({
          bio: '12345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345',
        });
        readonly contactForm = form(this.#model);
      }

      await render(TestComponent);

      expect(screen.getByTestId('limit-state').textContent).toBe('danger');
    });

    it('should be "exceeded" state when at or over 100%', async () => {
      @Component({
        selector: 'ngx-test-exceeded-state',
        imports: [FormField, NgxHeadlessCharacterCountDirective],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <div>
            <textarea id="bio" [formField]="contactForm.bio"></textarea>
            <div
              ngxSignalFormHeadlessCharacterCount
              #charCount="characterCount"
              [field]="contactForm.bio"
              [maxLength]="10"
            >
              <span data-testid="limit-state">{{ charCount.limitState() }}</span>
            </div>
          </div>
        `,
      })
      class TestComponent {
        readonly #model = signal({ bio: '1234567890123456' }); // 16 chars, over 10
        readonly contactForm = form(this.#model);
      }

      await render(TestComponent);

      expect(screen.getByTestId('limit-state').textContent).toBe('exceeded');
    });
  });

  describe('custom thresholds', () => {
    it('should respect custom warning threshold', async () => {
      @Component({
        selector: 'ngx-test-custom-warning',
        imports: [FormField, NgxHeadlessCharacterCountDirective],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <div>
            <textarea id="bio" [formField]="contactForm.bio"></textarea>
            <div
              ngxSignalFormHeadlessCharacterCount
              #charCount="characterCount"
              [field]="contactForm.bio"
              [maxLength]="100"
              [warningThreshold]="0.5"
            >
              <span data-testid="limit-state">{{ charCount.limitState() }}</span>
            </div>
          </div>
        `,
      })
      class TestComponent {
        // 50 chars = at custom 50% threshold
        readonly #model = signal({
          bio: '12345678901234567890123456789012345678901234567890',
        });
        readonly contactForm = form(this.#model);
      }

      await render(TestComponent);

      expect(screen.getByTestId('limit-state').textContent).toBe('warning');
    });

    it('should respect custom danger threshold', async () => {
      @Component({
        selector: 'ngx-test-custom-danger',
        imports: [FormField, NgxHeadlessCharacterCountDirective],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <div>
            <textarea id="bio" [formField]="contactForm.bio"></textarea>
            <div
              ngxSignalFormHeadlessCharacterCount
              #charCount="characterCount"
              [field]="contactForm.bio"
              [maxLength]="100"
              [warningThreshold]="0.5"
              [dangerThreshold]="0.7"
            >
              <span data-testid="limit-state">{{ charCount.limitState() }}</span>
            </div>
          </div>
        `,
      })
      class TestComponent {
        // 70 chars = at custom 70% danger threshold
        readonly #model = signal({
          bio: '1234567890123456789012345678901234567890123456789012345678901234567890',
        });
        readonly contactForm = form(this.#model);
      }

      await render(TestComponent);

      expect(screen.getByTestId('limit-state').textContent).toBe('danger');
    });
  });

  describe('custom template rendering', () => {
    it('should allow custom character count display', async () => {
      @Component({
        selector: 'ngx-test-custom-display',
        imports: [FormField, NgxHeadlessCharacterCountDirective],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <div>
            <textarea id="bio" [formField]="contactForm.bio"></textarea>
            <div
              ngxSignalFormHeadlessCharacterCount
              #charCount="characterCount"
              [field]="contactForm.bio"
              [maxLength]="100"
            >
              <div class="custom-counter" [class]="charCount.limitState()">
                <span data-testid="count">
                  {{ charCount.currentLength() }} / {{ charCount.resolvedMaxLength() }}
                </span>
                @if (charCount.isExceeded()) {
                  <span data-testid="over-limit">Over limit!</span>
                }
              </div>
            </div>
          </div>
        `,
      })
      class TestComponent {
        readonly #model = signal({ bio: 'Hello' });
        readonly contactForm = form(this.#model);
      }

      await render(TestComponent);

      expect(screen.getByTestId('count').textContent?.trim()).toBe('5 / 100');
      expect(screen.queryByTestId('over-limit')).toBeFalsy();
    });
  });

  describe('interaction with user input', () => {
    it('should update signals as user types', async () => {
      @Component({
        selector: 'ngx-test-user-typing',
        imports: [FormField, NgxHeadlessCharacterCountDirective],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <div>
            <textarea id="bio" [formField]="contactForm.bio"></textarea>
            <div
              ngxSignalFormHeadlessCharacterCount
              #charCount="characterCount"
              [field]="contactForm.bio"
              [maxLength]="20"
            >
              <span data-testid="current-length">{{ charCount.currentLength() }}</span>
              <span data-testid="limit-state">{{ charCount.limitState() }}</span>
            </div>
          </div>
        `,
      })
      class TestComponent {
        readonly #model = signal({ bio: '' });
        readonly contactForm = form(this.#model);
      }

      await render(TestComponent);
      const user = userEvent.setup();

      expect(screen.getByTestId('current-length').textContent).toBe('0');
      expect(screen.getByTestId('limit-state').textContent).toBe('ok');

      // Type some text
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Hello World');

      expect(screen.getByTestId('current-length').textContent).toBe('11');
    });
  });
});
