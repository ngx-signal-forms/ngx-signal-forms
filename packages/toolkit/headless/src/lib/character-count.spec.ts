import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NgxHeadlessCharacterCount } from './character-count';

describe('NgxHeadlessCharacterCount', () => {
  describe('character count signals', () => {
    it('should expose currentLength signal', async () => {
      @Component({
        selector: 'ngx-test-current-length',
        imports: [FormField, NgxHeadlessCharacterCount],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <div>
            <textarea id="bio" [formField]="contactForm.bio"></textarea>
            <div
              ngxHeadlessCharacterCount
              #charCount="characterCount"
              [field]="contactForm.bio"
              [maxLength]="100"
            >
              <span data-testid="current-length">{{
                charCount.currentLength()
              }}</span>
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
        imports: [FormField, NgxHeadlessCharacterCount],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <div>
            <textarea id="bio" [formField]="contactForm.bio"></textarea>
            <div
              ngxHeadlessCharacterCount
              #charCount="characterCount"
              [field]="contactForm.bio"
              [maxLength]="200"
            >
              <span data-testid="max-length">{{
                charCount.resolvedMaxLength()
              }}</span>
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
        imports: [FormField, NgxHeadlessCharacterCount],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <div>
            <textarea id="bio" [formField]="contactForm.bio"></textarea>
            <div
              ngxHeadlessCharacterCount
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
        imports: [FormField, NgxHeadlessCharacterCount],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <div>
            <textarea id="bio" [formField]="contactForm.bio"></textarea>
            <div
              ngxHeadlessCharacterCount
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
        imports: [FormField, NgxHeadlessCharacterCount],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <div>
            <textarea id="bio" [formField]="contactForm.bio"></textarea>
            <div
              ngxHeadlessCharacterCount
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
        imports: [FormField, NgxHeadlessCharacterCount],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <div>
            <textarea id="bio" [formField]="contactForm.bio"></textarea>
            <div
              ngxHeadlessCharacterCount
              #charCount="characterCount"
              [field]="contactForm.bio"
              [maxLength]="100"
            >
              <span data-testid="percent-used">{{
                charCount.percentUsed()
              }}</span>
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

    it('should clamp percentUsed to 0 or 100 when maxLength is negative', async () => {
      // Regression guard: a negative `maxLength` must never yield a negative
      // `percentUsed` — consumers bind this to progress bars / `aria-valuenow`
      // and negative values would render nonsense.
      @Component({
        selector: 'ngx-test-negative-percent',
        imports: [FormField, NgxHeadlessCharacterCount],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <div>
            <input id="title" [formField]="form.title" />
            <div
              ngxHeadlessCharacterCount
              #charCount="characterCount"
              [field]="form.title"
              [maxLength]="-5"
            >
              <span data-testid="percent-used">{{
                charCount.percentUsed()
              }}</span>
            </div>
          </div>
        `,
      })
      class TestComponent {
        readonly model = signal({ title: 'anything' });
        readonly form = form(this.model);
      }

      const { fixture } = await render(TestComponent);

      expect(screen.getByTestId('percent-used').textContent).toBe('100');

      fixture.componentInstance.model.set({ title: '' });
      await fixture.whenStable();
      fixture.detectChanges();

      expect(screen.getByTestId('percent-used').textContent).toBe('0');
    });
  });

  describe('limit state transitions', () => {
    it('should be "ok" state when under warning threshold', async () => {
      @Component({
        selector: 'ngx-test-ok-state',
        imports: [FormField, NgxHeadlessCharacterCount],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <div>
            <textarea id="bio" [formField]="contactForm.bio"></textarea>
            <div
              ngxHeadlessCharacterCount
              #charCount="characterCount"
              [field]="contactForm.bio"
              [maxLength]="100"
            >
              <span data-testid="limit-state">{{
                charCount.limitState()
              }}</span>
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
        imports: [FormField, NgxHeadlessCharacterCount],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <div>
            <textarea id="bio" [formField]="contactForm.bio"></textarea>
            <div
              ngxHeadlessCharacterCount
              #charCount="characterCount"
              [field]="contactForm.bio"
              [maxLength]="100"
              [warningThreshold]="0.8"
            >
              <span data-testid="limit-state">{{
                charCount.limitState()
              }}</span>
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
        imports: [FormField, NgxHeadlessCharacterCount],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <div>
            <textarea id="bio" [formField]="contactForm.bio"></textarea>
            <div
              ngxHeadlessCharacterCount
              #charCount="characterCount"
              [field]="contactForm.bio"
              [maxLength]="100"
              [dangerThreshold]="0.95"
            >
              <span data-testid="limit-state">{{
                charCount.limitState()
              }}</span>
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
        imports: [FormField, NgxHeadlessCharacterCount],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <div>
            <textarea id="bio" [formField]="contactForm.bio"></textarea>
            <div
              ngxHeadlessCharacterCount
              #charCount="characterCount"
              [field]="contactForm.bio"
              [maxLength]="10"
            >
              <span data-testid="limit-state">{{
                charCount.limitState()
              }}</span>
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

    it('should align limitState with isExceeded and remaining when maxLength is 0', async () => {
      // Regression guard: when `maxLength` is `0`, `remaining` reports a
      // negative value and `isExceeded` reports `true`, so `limitState`
      // must not cheerfully report `'ok'` for non-empty content.
      @Component({
        selector: 'ngx-test-zero-limit',
        imports: [FormField, NgxHeadlessCharacterCount],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <div>
            <input id="title" [formField]="form.title" />
            <div
              ngxHeadlessCharacterCount
              #charCount="characterCount"
              [field]="form.title"
              [maxLength]="0"
            >
              <span data-testid="limit-state">{{
                charCount.limitState()
              }}</span>
              <span data-testid="is-exceeded">{{
                charCount.isExceeded()
              }}</span>
              <span data-testid="remaining">{{ charCount.remaining() }}</span>
            </div>
          </div>
        `,
      })
      class TestComponent {
        readonly model = signal({ title: 'anything' });
        readonly form = form(this.model);
      }

      const { fixture } = await render(TestComponent);

      expect(screen.getByTestId('limit-state').textContent).toBe('exceeded');
      expect(screen.getByTestId('is-exceeded').textContent).toBe('true');
      expect(screen.getByTestId('remaining').textContent).toBe('-8');

      fixture.componentInstance.model.set({ title: '' });
      await fixture.whenStable();
      fixture.detectChanges();

      expect(screen.getByTestId('limit-state').textContent).toBe('ok');
      expect(screen.getByTestId('is-exceeded').textContent).toBe('false');
      expect(screen.getByTestId('remaining').textContent).toBe('0');
    });
  });

  describe('custom thresholds', () => {
    it('should respect custom warning threshold', async () => {
      @Component({
        selector: 'ngx-test-custom-warning',
        imports: [FormField, NgxHeadlessCharacterCount],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <div>
            <textarea id="bio" [formField]="contactForm.bio"></textarea>
            <div
              ngxHeadlessCharacterCount
              #charCount="characterCount"
              [field]="contactForm.bio"
              [maxLength]="100"
              [warningThreshold]="0.5"
            >
              <span data-testid="limit-state">{{
                charCount.limitState()
              }}</span>
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
        imports: [FormField, NgxHeadlessCharacterCount],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <div>
            <textarea id="bio" [formField]="contactForm.bio"></textarea>
            <div
              ngxHeadlessCharacterCount
              #charCount="characterCount"
              [field]="contactForm.bio"
              [maxLength]="100"
              [warningThreshold]="0.5"
              [dangerThreshold]="0.7"
            >
              <span data-testid="limit-state">{{
                charCount.limitState()
              }}</span>
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
        imports: [FormField, NgxHeadlessCharacterCount],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <div>
            <textarea id="bio" [formField]="contactForm.bio"></textarea>
            <div
              ngxHeadlessCharacterCount
              #charCount="characterCount"
              [field]="contactForm.bio"
              [maxLength]="100"
            >
              <div class="custom-counter" [class]="charCount.limitState()">
                <span data-testid="count">
                  {{ charCount.currentLength() }} /
                  {{ charCount.resolvedMaxLength() }}
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

  describe('unsupported value type dev warning (regression for Bug 3 / #73)', () => {
    // NgxHeadlessCharacterCount was silently returning 0 for unsupported types
    // with no warning. The createCharacterCount factory already had a one-shot
    // console.warn; this suite pins the same behaviour for the directive.

    beforeEach(() => {
      vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('emits a console.warn once when the field value is an unsupported type', async () => {
      @Component({
        selector: 'ngx-test-unsupported-value',
        imports: [FormField, NgxHeadlessCharacterCount],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <div
            ngxHeadlessCharacterCount
            #charCount="characterCount"
            [field]="objectField"
            [maxLength]="100"
          >
            <span data-testid="length">{{ charCount.currentLength() }}</span>
          </div>
        `,
      })
      class TestComponent {
        // An object value is unsupported by the character count directive.
        readonly #model = signal({ data: { nested: 'value' } });
        readonly objectForm = form(this.#model);
        readonly objectField = this.objectForm.data;
      }

      const { fixture } = await render(TestComponent);
      await fixture.whenStable();

      // currentLength should still return 0 (no crash).
      expect(screen.getByTestId('length').textContent).toBe('0');

      // A single console.warn should have been emitted.
      expect(console.warn).toHaveBeenCalledOnce();
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('NgxHeadlessCharacterCount'),
        expect.anything(),
        expect.stringContaining('0'),
      );

      // Trigger another change-detection cycle; warn must NOT fire again.
      fixture.detectChanges();
      await fixture.whenStable();
      expect(console.warn).toHaveBeenCalledOnce();
    });

    it('does NOT warn for null or undefined values (treated as empty)', async () => {
      @Component({
        selector: 'ngx-test-null-value',
        imports: [FormField, NgxHeadlessCharacterCount],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <div
            ngxHeadlessCharacterCount
            #charCount="characterCount"
            [field]="nullableField"
            [maxLength]="100"
          >
            <span data-testid="length">{{ charCount.currentLength() }}</span>
          </div>
        `,
      })
      class TestComponent {
        readonly #model = signal({ tag: null as string | null });
        readonly tagForm = form(this.#model);
        readonly nullableField = this.tagForm.tag;
      }

      await render(TestComponent);

      expect(screen.getByTestId('length').textContent).toBe('0');
      expect(console.warn).not.toHaveBeenCalled();
    });
  });

  describe('interaction with user input', () => {
    it('should update signals as user types', async () => {
      @Component({
        selector: 'ngx-test-user-typing',
        imports: [FormField, NgxHeadlessCharacterCount],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <div>
            <textarea id="bio" [formField]="contactForm.bio"></textarea>
            <div
              ngxHeadlessCharacterCount
              #charCount="characterCount"
              [field]="contactForm.bio"
              [maxLength]="20"
            >
              <span data-testid="current-length">{{
                charCount.currentLength()
              }}</span>
              <span data-testid="limit-state">{{
                charCount.limitState()
              }}</span>
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
