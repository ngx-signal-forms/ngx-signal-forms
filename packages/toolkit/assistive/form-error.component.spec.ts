import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  email,
  form,
  FormField,
  required,
  schema,
} from '@angular/forms/signals';
import type { SubmittedStatus } from '@ngx-signal-forms/toolkit/core';
import { NGX_SIGNAL_FORM_FIELD_CONTEXT } from '@ngx-signal-forms/toolkit/core';
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { NgxSignalFormErrorComponent } from './form-error.component';

describe('NgxSignalFormErrorComponent', () => {
  describe('BUG REPRODUCTION - Initial Render', () => {
    it('should NOT show errors on initial render with untouched field (on-touch strategy)', async () => {
      @Component({
        selector: 'ngx-test-initial-render',
        imports: [FormField, NgxSignalFormErrorComponent],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <input id="email" [formField]="contactForm.email" />
          <ngx-signal-form-error
            [formField]="contactForm.email"
            fieldName="email"
            [strategy]="'on-touch'"
            [submittedStatus]="submittedStatus()"
          />
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
        readonly submittedStatus = signal<SubmittedStatus>('unsubmitted');
      }

      await render(TestComponent);

      // Field is invalid but untouched, no error should be visible
      const alert = screen.queryByRole('alert');
      expect(alert).toBeFalsy();
    });

    it('should NOT show errors when form is unsubmitted and field untouched (on-submit strategy)', async () => {
      @Component({
        selector: 'ngx-test-on-submit-untouched',
        imports: [FormField, NgxSignalFormErrorComponent],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <input id="email" [formField]="contactForm.email" />
          <ngx-signal-form-error
            [formField]="contactForm.email"
            fieldName="email"
            [strategy]="'on-submit'"
            [submittedStatus]="submittedStatus()"
          />
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
        readonly submittedStatus = signal<SubmittedStatus>('unsubmitted');
      }

      await render(TestComponent);

      const alert = screen.queryByRole('alert');
      expect(alert).toBeFalsy();
    });
  });

  describe('error rendering', () => {
    it('should render errors when field is invalid and touched (on-touch strategy)', async () => {
      @Component({
        selector: 'ngx-test-touched-invalid',
        imports: [FormField, NgxSignalFormErrorComponent],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <input id="email" [formField]="contactForm.email" />
          <ngx-signal-form-error
            [formField]="contactForm.email"
            fieldName="email"
            [strategy]="'on-touch'"
            [submittedStatus]="submittedStatus()"
          />
        `,
      })
      class TestComponent {
        readonly #model = signal({ email: '' });
        readonly contactForm = form(
          this.#model,
          schema((path) => {
            required(path.email, { message: 'This field is required' });
          }),
        );
        readonly submittedStatus = signal<SubmittedStatus>('unsubmitted');
      }

      const { fixture } = await render(TestComponent);

      // Mark field as touched programmatically
      fixture.componentInstance.contactForm.email().markAsTouched();
      fixture.detectChanges();

      const alert = await screen.findByRole('alert');
      expect(alert).toBeTruthy();
      expect(alert.textContent).toContain('This field is required');
    });

    it('should not render errors when field is valid', async () => {
      @Component({
        selector: 'ngx-test-valid-field',
        imports: [FormField, NgxSignalFormErrorComponent],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <input id="email" [formField]="contactForm.email" />
          <ngx-signal-form-error
            [formField]="contactForm.email"
            fieldName="email"
            [strategy]="'on-touch'"
            [submittedStatus]="submittedStatus()"
          />
        `,
      })
      class TestComponent {
        readonly #model = signal({ email: 'valid@example.com' });
        readonly contactForm = form(
          this.#model,
          schema((path) => {
            required(path.email, { message: 'Email is required' });
          }),
        );
        readonly submittedStatus = signal<SubmittedStatus>('unsubmitted');
      }

      const user = userEvent.setup();
      await render(TestComponent);

      // Trigger touch
      const input = screen.getByRole('textbox');
      await user.click(input);
      await user.tab();

      const alert = screen.queryByRole('alert');
      expect(alert).toBeFalsy();
    });

    it('should not render errors when field is invalid but not touched (on-touch strategy)', async () => {
      @Component({
        selector: 'ngx-test-invalid-untouched',
        imports: [FormField, NgxSignalFormErrorComponent],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <input id="email" [formField]="contactForm.email" />
          <ngx-signal-form-error
            [formField]="contactForm.email"
            fieldName="email"
            [strategy]="'on-touch'"
            [submittedStatus]="submittedStatus()"
          />
        `,
      })
      class TestComponent {
        readonly #model = signal({ email: '' });
        readonly contactForm = form(
          this.#model,
          schema((path) => {
            required(path.email, { message: 'This field is required' });
          }),
        );
        readonly submittedStatus = signal<SubmittedStatus>('unsubmitted');
      }

      await render(TestComponent);

      // Don't touch the field
      const alert = screen.queryByRole('alert');
      expect(alert).toBeFalsy();
    });

    it('should render multiple errors', async () => {
      @Component({
        selector: 'ngx-test-multiple-errors',
        imports: [FormField, NgxSignalFormErrorComponent],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <input id="email" [formField]="contactForm.email" />
          <ngx-signal-form-error
            [formField]="contactForm.email"
            fieldName="email"
            [strategy]="'immediate'"
            [submittedStatus]="submittedStatus()"
          />
        `,
      })
      class TestComponent {
        readonly #model = signal({ email: '' });
        readonly contactForm = form(
          this.#model,
          schema((path) => {
            required(path.email, { message: 'This field is required' });
            email(path.email, { message: 'Must be a valid email' });
          }),
        );
        readonly submittedStatus = signal<SubmittedStatus>('unsubmitted');
      }

      const { container } = await render(TestComponent);

      // With immediate strategy, errors show right away
      await screen.findByRole('alert');

      const messages = container.querySelectorAll(
        '.ngx-signal-form-error__message',
      );
      // Should have at least the required error
      expect(messages.length).toBeGreaterThan(0);
    });
  });

  describe('strategy switching', () => {
    it('should show errors immediately with immediate strategy)', async () => {
      @Component({
        selector: 'ngx-test-immediate-strategy',
        imports: [FormField, NgxSignalFormErrorComponent],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <input id="email" [formField]="contactForm.email" />
          <ngx-signal-form-error
            [formField]="contactForm.email"
            fieldName="email"
            [strategy]="'immediate'"
            [submittedStatus]="submittedStatus()"
          />
        `,
      })
      class TestComponent {
        readonly #model = signal({ email: '' });
        readonly contactForm = form(
          this.#model,
          schema((path) => {
            required(path.email, { message: 'This field is required' });
          }),
        );
        readonly submittedStatus = signal<SubmittedStatus>('unsubmitted');
      }

      await render(TestComponent);

      // Immediate strategy shows errors right away
      const alert = screen.getByRole('alert');
      expect(alert).toBeTruthy();
      expect(alert.textContent).toContain('This field is required');
    });

    it('should only show errors after submit with on-submit strategy', async () => {
      @Component({
        selector: 'ngx-test-on-submit-strategy',
        imports: [FormField, NgxSignalFormErrorComponent],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <input id="email" [formField]="contactForm.email" />
          <ngx-signal-form-error
            [formField]="contactForm.email"
            fieldName="email"
            [strategy]="'on-submit'"
            [submittedStatus]="submittedStatus()"
          />
        `,
      })
      class TestComponent {
        readonly #model = signal({ email: '' });
        readonly contactForm = form(
          this.#model,
          schema((path) => {
            required(path.email, { message: 'This field is required' });
          }),
        );
        readonly submittedStatus = signal<SubmittedStatus>('unsubmitted');
      }

      const { fixture } = await render(TestComponent);

      const user = userEvent.setup();
      // Touch the field
      const input = screen.getByRole('textbox');
      await user.click(input);
      await user.tab();

      // No error yet (on-submit strategy)
      let alert = screen.queryByRole('alert');
      expect(alert).toBeFalsy();

      // After submission
      fixture.componentInstance.submittedStatus.set('submitted');
      fixture.detectChanges();

      alert = await screen.findByRole('alert');
      expect(alert).toBeTruthy();
    });

    it('should never show errors with manual strategy', async () => {
      @Component({
        selector: 'ngx-test-manual-strategy',
        imports: [FormField, NgxSignalFormErrorComponent],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <input id="email" [formField]="contactForm.email" />
          <ngx-signal-form-error
            [formField]="contactForm.email"
            fieldName="email"
            [strategy]="'manual'"
            [submittedStatus]="submittedStatus()"
          />
        `,
      })
      class TestComponent {
        readonly #model = signal({ email: '' });
        readonly contactForm = form(
          this.#model,
          schema((path) => {
            required(path.email, { message: 'This field is required' });
          }),
        );
        readonly submittedStatus = signal<SubmittedStatus>('submitted');
      }

      await render(TestComponent);

      const user = userEvent.setup();
      // Touch the field
      const input = screen.getByRole('textbox');
      await user.click(input);
      await user.tab();

      const alert = screen.queryByRole('alert');
      expect(alert).toBeFalsy();
    });

    it('should NOT show errors after submit if not touched (on-touch strategy)', async () => {
      // Simplified architecture: on-touch only checks touched()
      // Angular's submit() calls markAllAsTouched(), so in real usage touched() would be true
      @Component({
        selector: 'ngx-test-submitted-untouched',
        imports: [FormField, NgxSignalFormErrorComponent],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <input id="email" [formField]="contactForm.email" />
          <ngx-signal-form-error
            [formField]="contactForm.email"
            fieldName="email"
            [strategy]="'on-touch'"
            [submittedStatus]="submittedStatus()"
          />
        `,
      })
      class TestComponent {
        readonly #model = signal({ email: '' });
        readonly contactForm = form(
          this.#model,
          schema((path) => {
            required(path.email, { message: 'This field is required' });
          }),
        );
        readonly submittedStatus = signal<SubmittedStatus>('submitted');
      }

      await render(TestComponent);

      // submittedStatus is ignored for on-touch - field must be touched
      const alert = screen.queryByRole('alert');
      expect(alert).toBeFalsy();
    });

    it('should NOT show errors during async submission if not touched (on-touch strategy)', async () => {
      // Simplified architecture: on-touch only checks touched()
      // In real usage, Angular's submit() would have called markAllAsTouched()
      @Component({
        selector: 'ngx-test-submitting-on-touch',
        imports: [FormField, NgxSignalFormErrorComponent],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <input id="email" [formField]="contactForm.email" />
          <ngx-signal-form-error
            [formField]="contactForm.email"
            fieldName="email"
            [strategy]="'on-touch'"
            [submittedStatus]="submittedStatus()"
          />
        `,
      })
      class TestComponent {
        readonly #model = signal({ email: '' });
        readonly contactForm = form(
          this.#model,
          schema((path) => {
            required(path.email, { message: 'This field is required' });
          }),
        );
        readonly submittedStatus = signal<SubmittedStatus>('submitting');
      }

      await render(TestComponent);

      // submittedStatus is ignored for on-touch - field must be touched
      const alert = screen.queryByRole('alert');
      expect(alert).toBeFalsy();
    });

    it('should show errors during async submission (on-submit strategy)', async () => {
      @Component({
        selector: 'ngx-test-submitting-on-submit',
        imports: [FormField, NgxSignalFormErrorComponent],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <input id="email" [formField]="contactForm.email" />
          <ngx-signal-form-error
            [formField]="contactForm.email"
            fieldName="email"
            [strategy]="'on-submit'"
            [submittedStatus]="submittedStatus()"
          />
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
        readonly submittedStatus = signal<SubmittedStatus>('submitting');
      }

      await render(TestComponent);

      const alert = screen.getByRole('alert');
      expect(alert).toBeTruthy();
      expect(alert.textContent).toContain('Email is required');
    });

    it('should maintain error visibility throughout submission lifecycle', async () => {
      @Component({
        selector: 'ngx-test-submission-lifecycle',
        imports: [FormField, NgxSignalFormErrorComponent],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <input id="email" [formField]="contactForm.email" />
          <ngx-signal-form-error
            [formField]="contactForm.email"
            fieldName="email"
            [strategy]="'on-submit'"
            [submittedStatus]="submittedStatus()"
          />
        `,
      })
      class TestComponent {
        readonly #model = signal({ email: '' });
        readonly contactForm = form(
          this.#model,
          schema((path) => {
            required(path.email, { message: 'This field is required' });
          }),
        );
        readonly submittedStatus = signal<SubmittedStatus>('unsubmitted');
      }

      const { fixture } = await render(TestComponent);

      // Initially no errors (not submitted)
      let alert = screen.queryByRole('alert');
      expect(alert).toBeFalsy();

      // During submission - errors should appear
      fixture.componentInstance.submittedStatus.set('submitting');
      fixture.detectChanges();

      alert = await screen.findByRole('alert');
      expect(alert).toBeTruthy();

      // After submission completes - errors should remain
      fixture.componentInstance.submittedStatus.set('submitted');
      fixture.detectChanges();

      alert = screen.getByRole('alert');
      expect(alert).toBeTruthy();
    });
  });

  describe('WCAG compliance', () => {
    it('should have role="alert" for screen reader announcements', async () => {
      @Component({
        selector: 'ngx-test-wcag-role',
        imports: [FormField, NgxSignalFormErrorComponent],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <input id="email" [formField]="contactForm.email" />
          <ngx-signal-form-error
            [formField]="contactForm.email"
            fieldName="email"
            [strategy]="'immediate'"
            [submittedStatus]="submittedStatus()"
          />
        `,
      })
      class TestComponent {
        readonly #model = signal({ email: '' });
        readonly contactForm = form(
          this.#model,
          schema((path) => {
            required(path.email, { message: 'This field is required' });
          }),
        );
        readonly submittedStatus = signal<SubmittedStatus>('unsubmitted');
      }

      await render(TestComponent);

      const alert = screen.getByRole('alert');
      expect(alert).toBeTruthy();
      expect(alert.getAttribute('role')).toBe('alert');
    });

    it('should have aria-live="assertive" for errors (immediate announcement)', async () => {
      @Component({
        selector: 'ngx-test-aria-live',
        imports: [FormField, NgxSignalFormErrorComponent],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <input id="email" [formField]="contactForm.email" />
          <ngx-signal-form-error
            [formField]="contactForm.email"
            fieldName="email"
            [strategy]="'immediate'"
            [submittedStatus]="submittedStatus()"
          />
        `,
      })
      class TestComponent {
        readonly #model = signal({ email: '' });
        readonly contactForm = form(
          this.#model,
          schema((path) => {
            required(path.email, { message: 'This field is required' });
          }),
        );
        readonly submittedStatus = signal<SubmittedStatus>('unsubmitted');
      }

      await render(TestComponent);

      const alert = screen.getByRole('alert');
      expect(alert.getAttribute('aria-live')).toBe('assertive');
    });

    it('should have correct error ID for aria-describedby linking', async () => {
      @Component({
        selector: 'ngx-test-error-id',
        imports: [FormField, NgxSignalFormErrorComponent],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <input id="email" [formField]="contactForm.email" />
          <ngx-signal-form-error
            [formField]="contactForm.email"
            fieldName="email"
            [strategy]="'immediate'"
            [submittedStatus]="submittedStatus()"
          />
        `,
      })
      class TestComponent {
        readonly #model = signal({ email: '' });
        readonly contactForm = form(
          this.#model,
          schema((path) => {
            required(path.email, { message: 'This field is required' });
          }),
        );
        readonly submittedStatus = signal<SubmittedStatus>('unsubmitted');
      }

      await render(TestComponent);

      const alert = screen.getByRole('alert');
      expect(alert.getAttribute('id')).toBe('email-error');
    });

    it('should generate correct error ID for nested fields', async () => {
      @Component({
        selector: 'ngx-test-nested-field-id',
        imports: [FormField, NgxSignalFormErrorComponent],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <input
            id="user.profile.email"
            [formField]="contactForm.user.profile.email"
          />
          <ngx-signal-form-error
            [formField]="contactForm.user.profile.email"
            fieldName="user.profile.email"
            [strategy]="'immediate'"
            [submittedStatus]="submittedStatus()"
          />
        `,
      })
      class TestComponent {
        readonly #model = signal({ user: { profile: { email: '' } } });
        readonly contactForm = form(
          this.#model,
          schema((path) => {
            required(path.user.profile.email, { message: 'Email is required' });
          }),
        );
        readonly submittedStatus = signal<SubmittedStatus>('unsubmitted');
      }

      await render(TestComponent);

      const alert = screen.getByRole('alert');
      expect(alert.getAttribute('id')).toBe('user.profile.email-error');
    });
  });

  describe('edge cases', () => {
    it('should handle field without errors gracefully', async () => {
      @Component({
        selector: 'ngx-test-no-errors',
        imports: [FormField, NgxSignalFormErrorComponent],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <input id="email" [formField]="contactForm.email" />
          <ngx-signal-form-error
            [formField]="contactForm.email"
            fieldName="email"
            [strategy]="'on-touch'"
            [submittedStatus]="submittedStatus()"
          />
        `,
      })
      class TestComponent {
        readonly #model = signal({ email: 'valid@example.com' });
        readonly contactForm = form(this.#model);
        readonly submittedStatus = signal<SubmittedStatus>('unsubmitted');
      }

      await render(TestComponent);

      const user = userEvent.setup();
      // Touch the field
      const input = screen.getByRole('textbox');
      await user.click(input);
      await user.tab();

      const alert = screen.queryByRole('alert');
      expect(alert).toBeFalsy();
    });

    it('should handle empty errors array', async () => {
      @Component({
        selector: 'ngx-test-empty-errors',
        imports: [FormField, NgxSignalFormErrorComponent],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <input id="email" [formField]="contactForm.email" />
          <ngx-signal-form-error
            [formField]="contactForm.email"
            fieldName="email"
            [strategy]="'on-touch'"
            [submittedStatus]="submittedStatus()"
          />
        `,
      })
      class TestComponent {
        readonly #model = signal({ email: 'test@example.com' });
        readonly contactForm = form(this.#model);
        readonly submittedStatus = signal<SubmittedStatus>('unsubmitted');
      }

      await render(TestComponent);

      const user = userEvent.setup();
      // Touch the field
      const input = screen.getByRole('textbox');
      await user.click(input);
      await user.tab();

      const alert = screen.queryByRole('alert');
      expect(alert).toBeFalsy();
    });
  });

  describe('fieldName resolution from DI context', () => {
    it('should resolve fieldName from NGX_SIGNAL_FORM_FIELD_CONTEXT when not provided', async () => {
      /**
       * Test that error component can resolve fieldName from parent context
       * when used inside ngx-signal-form-field-wrapper.
       *
       * The context provides { fieldName: Signal<string> } which error component
       * uses when its own fieldName input is undefined.
       */
      @Component({
        selector: 'ngx-test-context-resolution',
        imports: [FormField, NgxSignalFormErrorComponent],
        changeDetection: ChangeDetectionStrategy.OnPush,
        providers: [
          {
            provide: NGX_SIGNAL_FORM_FIELD_CONTEXT,
            useValue: {
              fieldName: signal('context-provided-name'),
            },
          },
        ],
        template: `
          <input id="email" [formField]="contactForm.email" />
          <ngx-signal-form-error
            [formField]="contactForm.email"
            [strategy]="'immediate'"
          />
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
      }

      const { container } = await render(TestComponent);

      // Error ID should use the context-provided fieldName
      const errorElement = container.querySelector(
        '[id="context-provided-name-error"]',
      );
      expect(errorElement).toBeTruthy();
    });

    it('should prefer explicit fieldName input over DI context', async () => {
      /**
       * Priority order:
       * 1. Explicit fieldName input (highest)
       * 2. DI context from parent wrapper
       * 3. Fallback to 'unknown-field'
       */
      @Component({
        selector: 'ngx-test-explicit-priority',
        imports: [FormField, NgxSignalFormErrorComponent],
        changeDetection: ChangeDetectionStrategy.OnPush,
        providers: [
          {
            provide: NGX_SIGNAL_FORM_FIELD_CONTEXT,
            useValue: {
              fieldName: signal('context-name'),
            },
          },
        ],
        template: `
          <input id="email" [formField]="contactForm.email" />
          <ngx-signal-form-error
            [formField]="contactForm.email"
            fieldName="explicit-name"
            [strategy]="'immediate'"
          />
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
      }

      const { container } = await render(TestComponent);

      // Explicit fieldName should take priority over context
      const errorElement = container.querySelector(
        '[id="explicit-name-error"]',
      );
      expect(errorElement).toBeTruthy();

      // Context name should NOT be used
      const contextError = container.querySelector('[id="context-name-error"]');
      expect(contextError).toBeFalsy();
    });

    it('should fallback to unknown-field when no context and no input', async () => {
      /**
       * When error component is used standalone without context or fieldName input,
       * it falls back to 'unknown-field' to avoid undefined errors.
       */
      @Component({
        selector: 'ngx-test-fallback',
        imports: [FormField, NgxSignalFormErrorComponent],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <input id="email" [formField]="contactForm.email" />
          <ngx-signal-form-error
            [formField]="contactForm.email"
            [strategy]="'immediate'"
          />
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
      }

      const { container } = await render(TestComponent);

      // Should fallback to 'unknown-field'
      const errorElement = container.querySelector(
        '[id="unknown-field-error"]',
      );
      expect(errorElement).toBeTruthy();
    });

    it('should react to context signal changes', async () => {
      /**
       * The context provides a signal, not a static value.
       * This test verifies the error component responds to signal updates.
       */
      const fieldNameSignal = signal('initial-name');

      @Component({
        selector: 'ngx-test-signal-reactivity',
        imports: [FormField, NgxSignalFormErrorComponent],
        changeDetection: ChangeDetectionStrategy.OnPush,
        providers: [
          {
            provide: NGX_SIGNAL_FORM_FIELD_CONTEXT,
            useValue: {
              fieldName: fieldNameSignal,
            },
          },
        ],
        template: `
          <input id="email" [formField]="contactForm.email" />
          <ngx-signal-form-error
            [formField]="contactForm.email"
            [strategy]="'immediate'"
          />
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
      }

      const { fixture, container } = await render(TestComponent);

      // Initial error ID
      expect(container.querySelector('[id="initial-name-error"]')).toBeTruthy();

      // Update the signal
      fieldNameSignal.set('updated-name');
      fixture.detectChanges();

      // Error ID should update
      expect(container.querySelector('[id="updated-name-error"]')).toBeTruthy();
    });
  });
});
