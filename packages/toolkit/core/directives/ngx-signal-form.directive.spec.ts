import { Component, inject, signal } from '@angular/core';
import {
  form,
  FormField,
  required,
  schema,
  submit,
} from '@angular/forms/signals';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { NGX_SIGNAL_FORM_CONTEXT, NGX_SIGNAL_FORMS_CONFIG } from '../tokens';
import type { ErrorDisplayStrategy, NgxSignalFormsConfig } from '../types';
import { NgxSignalFormDirective } from './ngx-signal-form.directive';

/**
 * Helper to create complete test config.
 */
const createTestConfig = (
  overrides: Partial<NgxSignalFormsConfig>,
): NgxSignalFormsConfig => ({
  autoAria: true,
  defaultErrorStrategy: 'on-touch',
  strictFieldResolution: false,
  debug: false,
  ...overrides,
});

/**
 * Test suite for ngxSignalFormDirective.
 *
 * **Testing Philosophy:**
 * - Use REAL Signal Forms, not mocks
 * - Test what users SEE and DO, not implementation details
 * - Focus on observable behavior through the DOM
 * - Avoid accessing directive methods or internal state directly
 */
describe('ngxSignalFormDirective', () => {
  /**
   * Helper component that displays form context values.
   * This is what users "see" - the observable state.
   */
  @Component({
    selector: 'ngx-signal-form-context-display',
    template: `
      <div data-testid="form-present">{{ hasForm() ? 'yes' : 'no' }}</div>
      <div data-testid="submitted-status">{{ context.submittedStatus() }}</div>
      <div data-testid="error-strategy">{{ context.errorStrategy() }}</div>
    `,
  })
  class ContextDisplayComponent {
    readonly context = inject(NGX_SIGNAL_FORM_CONTEXT);
    readonly hasForm = () => this.context.form !== null;
  }

  describe('Form context provision', () => {
    it('should provide form context to child components', async () => {
      @Component({
        selector: 'ngx-test-form-context',
        imports: [NgxSignalFormDirective, ContextDisplayComponent],
        template: `
          <form [ngxSignalForm]="contactForm">
            <ngx-signal-form-context-display />
          </form>
        `,
      })
      class TestComponent {
        readonly #model = signal({ name: '' });
        readonly contactForm = form(this.#model);
      }

      await render(TestComponent);

      expect(screen.getByTestId('form-present')).toHaveTextContent('yes');
    });
  });

  describe('Error strategy configuration', () => {
    it('should use immediate error strategy when specified', async () => {
      @Component({
        selector: 'ngx-test-immediate-strategy',
        imports: [NgxSignalFormDirective, ContextDisplayComponent],
        template: `
          <form [ngxSignalForm]="contactForm" [errorStrategy]="'immediate'">
            <ngx-signal-form-context-display />
          </form>
        `,
      })
      class TestComponent {
        readonly #model = signal({ email: '' });
        readonly contactForm = form(this.#model);
      }

      await render(TestComponent);

      expect(screen.getByTestId('error-strategy')).toHaveTextContent(
        'immediate',
      );
    });

    it('should inherit strategy from global config', async () => {
      @Component({
        selector: 'ngx-test-inherit-strategy',
        imports: [NgxSignalFormDirective, ContextDisplayComponent],
        template: `
          <form [ngxSignalForm]="contactForm">
            <ngx-signal-form-context-display />
          </form>
        `,
      })
      class TestComponent {
        readonly #model = signal({ email: '' });
        readonly contactForm = form(this.#model);
      }

      await render(TestComponent, {
        providers: [
          {
            provide: NGX_SIGNAL_FORMS_CONFIG,
            useValue: createTestConfig({ defaultErrorStrategy: 'on-submit' }),
          },
        ],
      });

      expect(screen.getByTestId('error-strategy')).toHaveTextContent(
        'on-submit',
      );
    });

    it('should default to on-touch when no strategy provided', async () => {
      @Component({
        selector: 'ngx-test-default-strategy',
        imports: [NgxSignalFormDirective, ContextDisplayComponent],
        template: `
          <form [ngxSignalForm]="contactForm">
            <ngx-signal-form-context-display />
          </form>
        `,
      })
      class TestComponent {
        readonly #model = signal({ email: '' });
        readonly contactForm = form(this.#model);
      }

      await render(TestComponent);

      expect(screen.getByTestId('error-strategy')).toHaveTextContent(
        'on-touch',
      );
    });

    it('should allow strategy to be changed dynamically', async () => {
      @Component({
        selector: 'ngx-test-dynamic-strategy',
        imports: [NgxSignalFormDirective, ContextDisplayComponent],
        template: `
          <form [ngxSignalForm]="contactForm" [errorStrategy]="strategy()">
            <ngx-signal-form-context-display />
          </form>
        `,
      })
      class TestComponent {
        readonly #model = signal({ email: '' });
        readonly contactForm = form(this.#model);
        readonly strategy = signal<ErrorDisplayStrategy>('on-touch');
      }

      const { fixture } = await render(TestComponent);

      expect(screen.getByTestId('error-strategy')).toHaveTextContent(
        'on-touch',
      );

      // Change strategy using signal
      fixture.componentInstance.strategy.set('immediate');
      fixture.detectChanges();

      expect(screen.getByTestId('error-strategy')).toHaveTextContent(
        'immediate',
      );
    });
  });

  describe('Submission state tracking (user-facing behavior)', () => {
    it('should show submission state as unsubmitted initially', async () => {
      @Component({
        selector: 'ngx-test-initial-state',
        imports: [NgxSignalFormDirective, ContextDisplayComponent],
        template: `
          <form [ngxSignalForm]="contactForm">
            <ngx-signal-form-context-display />
          </form>
        `,
      })
      class TestComponent {
        readonly #model = signal({ email: '' });
        readonly contactForm = form(this.#model);
      }

      await render(TestComponent);

      // User sees form is not yet submitted
      expect(screen.getByTestId('submitted-status')).toHaveTextContent(
        'unsubmitted',
      );
    });

    it('should track submission lifecycle with submit() helper', async () => {
      @Component({
        selector: 'ngx-test-submit-tracking',
        imports: [FormField, NgxSignalFormDirective, ContextDisplayComponent],
        template: `
          <form [ngxSignalForm]="contactForm" (submit)="handleSubmit($event)">
            <ngx-signal-form-context-display />
            <input id="email" [formField]="contactForm.email" />
            <button type="submit">Submit</button>
          </form>
        `,
      })
      class TestComponent {
        readonly #model = signal({ email: 'test@example.com' });
        readonly contactForm = form(this.#model);

        async handleSubmit(event: Event) {
          event.preventDefault();
          await submit(this.contactForm, async () => {
            // Simulate async operation
            await new Promise((resolve) => setTimeout(resolve, 50));
            return null;
          });
        }
      }

      await render(TestComponent);

      expect(screen.getByTestId('submitted-status')).toHaveTextContent(
        'unsubmitted',
      );

      const user = userEvent.setup();
      // User submits the form
      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      // After completion, should show submitted
      await vi.waitFor(
        () => {
          expect(screen.getByTestId('submitted-status')).toHaveTextContent(
            'submitted',
          );
        },
        { timeout: 2000 },
      );
    });

    it('should reset submission state when form is reset', async () => {
      @Component({
        selector: 'ngx-test-reset',
        imports: [FormField, NgxSignalFormDirective, ContextDisplayComponent],
        template: `
          <form [ngxSignalForm]="contactForm" (submit)="handleSubmit($event)">
            <ngx-signal-form-context-display />
            <input id="email" [formField]="contactForm.email" />
            <button type="submit">Submit</button>
            <button type="button" (click)="resetForm()">Reset</button>
          </form>
        `,
      })
      class TestComponent {
        readonly #model = signal({ email: 'test@example.com' });
        readonly contactForm = form(this.#model);

        async handleSubmit(event: Event) {
          event.preventDefault();
          await submit(this.contactForm, async () => {
            await new Promise((resolve) => setTimeout(resolve, 50));
            return null;
          });
        }

        resetForm() {
          this.contactForm().reset();
          this.#model.set({ email: '' });
        }
      }

      await render(TestComponent);

      const user = userEvent.setup();
      // Submit form
      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await vi.waitFor(() => {
        expect(screen.getByTestId('submitted-status')).toHaveTextContent(
          'submitted',
        );
      });

      // Reset form
      const resetButton = screen.getByRole('button', { name: /reset/i });
      await user.click(resetButton);

      await vi.waitFor(() => {
        expect(screen.getByTestId('submitted-status')).toHaveTextContent(
          'unsubmitted',
        );
      });
    });

    describe('Combined host handler + submit() helper usage', () => {
      it('should handle valid form submission with both handlers', async () => {
        @Component({
          selector: 'ngx-test-combined',
          imports: [FormField, NgxSignalFormDirective, ContextDisplayComponent],
          template: `
            <form [ngxSignalForm]="contactForm" (submit)="onSubmit($event)">
              <ngx-signal-form-context-display />
              <input id="email" [formField]="contactForm.email" />
              <button type="submit">Submit</button>
            </form>
          `,
        })
        class TestComponent {
          readonly #model = signal({ email: 'test@example.com' });
          readonly contactForm = form(this.#model);

          async onSubmit(event: Event) {
            event.preventDefault();
            await submit(this.contactForm, async () => {
              await new Promise((resolve) => setTimeout(resolve, 50));
              return null;
            });
          }
        }

        await render(TestComponent);

        const user = userEvent.setup();
        // Simulate valid form submission
        const submitButton = screen.getByRole('button', { name: /submit/i });
        await user.click(submitButton);

        // Verify submission lifecycle completes
        await vi.waitFor(
          () => {
            expect(screen.getByTestId('submitted-status')).toHaveTextContent(
              'submitted',
            );
          },
          { timeout: 2000 },
        );
      });

      it('should show submitted status for invalid form (submit attempt without submitting transition)', async () => {
        @Component({
          selector: 'ngx-test-invalid',
          imports: [FormField, NgxSignalFormDirective, ContextDisplayComponent],
          template: `
            <form [ngxSignalForm]="contactForm" (submit)="onSubmit($event)">
              <ngx-signal-form-context-display />
              <input id="email" [formField]="contactForm.email" />
              <button type="submit">Submit</button>
            </form>
          `,
        })
        class TestComponent {
          readonly #model = signal({ email: '' });
          readonly contactForm = form(
            this.#model,
            schema((path) => {
              required(path.email, { message: 'Email is required' });
            }),
          );

          async onSubmit(event: Event) {
            event.preventDefault();
            await submit(this.contactForm, async () => {
              // This won't execute because form is invalid
              return null;
            });
          }
        }

        await render(TestComponent);

        const user = userEvent.setup();
        // Initial state
        expect(screen.getByTestId('submitted-status')).toHaveTextContent(
          'unsubmitted',
        );

        // User clicks submit on invalid form
        const submitButton = screen.getByRole('button', { name: /submit/i });
        await user.click(submitButton);

        // submitAttempted flag should set status to 'submitted' even though
        // submitting() never became true (because form is invalid)
        await vi.waitFor(() => {
          expect(screen.getByTestId('submitted-status')).toHaveTextContent(
            'submitted',
          );
        });
      });

      it('should maintain consistent state across multiple invalid submission attempts', async () => {
        @Component({
          selector: 'ngx-test-multi-invalid',
          imports: [FormField, NgxSignalFormDirective, ContextDisplayComponent],
          template: `
            <form [ngxSignalForm]="contactForm" (submit)="onSubmit($event)">
              <ngx-signal-form-context-display />
              <input id="email" [formField]="contactForm.email" />
              <button type="submit">Submit</button>
            </form>
          `,
        })
        class TestComponent {
          readonly #model = signal({ email: '' });
          readonly contactForm = form(
            this.#model,
            schema((path) => {
              required(path.email, { message: 'Email is required' });
            }),
          );

          async onSubmit(event: Event) {
            event.preventDefault();
            await submit(this.contactForm, async () => null);
          }
        }

        await render(TestComponent);

        const user = userEvent.setup();
        const submitButton = screen.getByRole('button', { name: /submit/i });

        // First invalid submit attempt
        await user.click(submitButton);
        await vi.waitFor(() => {
          expect(screen.getByTestId('submitted-status')).toHaveTextContent(
            'submitted',
          );
        });

        // Second invalid submit attempt
        await user.click(submitButton);
        await vi.waitFor(() => {
          expect(screen.getByTestId('submitted-status')).toHaveTextContent(
            'submitted',
          );
        });

        // Status should remain 'submitted'
        expect(screen.getByTestId('submitted-status')).toHaveTextContent(
          'submitted',
        );
      });

      it('should reset submitAttempted when form is reset', async () => {
        @Component({
          selector: 'ngx-test-reset-attempt',
          imports: [FormField, NgxSignalFormDirective, ContextDisplayComponent],
          template: `
            <form [ngxSignalForm]="contactForm" (submit)="onSubmit($event)">
              <ngx-signal-form-context-display />
              <input id="email" [formField]="contactForm.email" />
              <button type="submit">Submit</button>
              <button type="button" (click)="resetForm()">Reset</button>
            </form>
          `,
        })
        class TestComponent {
          readonly #model = signal({ email: '' });
          readonly contactForm = form(
            this.#model,
            schema((path) => {
              required(path.email, { message: 'Email is required' });
            }),
          );

          async onSubmit(event: Event) {
            event.preventDefault();
            await submit(this.contactForm, async () => null);
          }

          resetForm() {
            this.contactForm().reset();
            this.#model.set({ email: '' });
          }
        }

        await render(TestComponent);

        const user = userEvent.setup();
        const submitButton = screen.getByRole('button', { name: /submit/i });
        const resetButton = screen.getByRole('button', { name: /reset/i });

        // Submit invalid form
        await user.click(submitButton);
        await vi.waitFor(() => {
          expect(screen.getByTestId('submitted-status')).toHaveTextContent(
            'submitted',
          );
        });

        // Reset form
        await user.click(resetButton);
        await vi.waitFor(() => {
          expect(screen.getByTestId('submitted-status')).toHaveTextContent(
            'unsubmitted',
          );
        });

        // Verify state is truly reset by submitting again
        await user.click(submitButton);
        await vi.waitFor(() => {
          expect(screen.getByTestId('submitted-status')).toHaveTextContent(
            'submitted',
          );
        });
      });
    });
  });
});
