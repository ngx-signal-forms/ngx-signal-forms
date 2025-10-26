import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import type { SubmittedStatus } from '@angular/forms/signals';
import { email, Field, form, required, schema } from '@angular/forms/signals';
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@vitest/browser/context';
import { describe, expect, it } from 'vitest';
import { NgxSignalFormErrorComponent } from './form-error.component';

describe('NgxSignalFormErrorComponent', () => {
  describe('BUG REPRODUCTION - Initial Render', () => {
    it('should NOT show errors on initial render with untouched field (on-touch strategy)', async () => {
      @Component({
        selector: 'ngx-test-initial-render',
        imports: [Field, NgxSignalFormErrorComponent],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <input id="email" [field]="contactForm.email" />
          <ngx-signal-form-error
            [field]="contactForm.email"
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
        imports: [Field, NgxSignalFormErrorComponent],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <input id="email" [field]="contactForm.email" />
          <ngx-signal-form-error
            [field]="contactForm.email"
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
        imports: [Field, NgxSignalFormErrorComponent],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <input id="email" [field]="contactForm.email" />
          <ngx-signal-form-error
            [field]="contactForm.email"
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
        imports: [Field, NgxSignalFormErrorComponent],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <input id="email" [field]="contactForm.email" />
          <ngx-signal-form-error
            [field]="contactForm.email"
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

      await render(TestComponent);

      // Trigger touch
      const input = screen.getByRole('textbox');
      await userEvent.click(input);
      await userEvent.tab();

      const alert = screen.queryByRole('alert');
      expect(alert).toBeFalsy();
    });

    it('should not render errors when field is invalid but not touched (on-touch strategy)', async () => {
      @Component({
        selector: 'ngx-test-invalid-untouched',
        imports: [Field, NgxSignalFormErrorComponent],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <input id="email" [field]="contactForm.email" />
          <ngx-signal-form-error
            [field]="contactForm.email"
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
        imports: [Field, NgxSignalFormErrorComponent],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <input id="email" [field]="contactForm.email" />
          <ngx-signal-form-error
            [field]="contactForm.email"
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
        imports: [Field, NgxSignalFormErrorComponent],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <input id="email" [field]="contactForm.email" />
          <ngx-signal-form-error
            [field]="contactForm.email"
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
        imports: [Field, NgxSignalFormErrorComponent],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <input id="email" [field]="contactForm.email" />
          <ngx-signal-form-error
            [field]="contactForm.email"
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

      // Touch the field
      const input = screen.getByRole('textbox');
      await userEvent.click(input);
      await userEvent.tab();

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
        imports: [Field, NgxSignalFormErrorComponent],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <input id="email" [field]="contactForm.email" />
          <ngx-signal-form-error
            [field]="contactForm.email"
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

      // Touch the field
      const input = screen.getByRole('textbox');
      await userEvent.click(input);
      await userEvent.tab();

      const alert = screen.queryByRole('alert');
      expect(alert).toBeFalsy();
    });

    it('should show errors after submit even if not touched (on-touch strategy)', async () => {
      @Component({
        selector: 'ngx-test-submitted-untouched',
        imports: [Field, NgxSignalFormErrorComponent],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <input id="email" [field]="contactForm.email" />
          <ngx-signal-form-error
            [field]="contactForm.email"
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

      const alert = screen.getByRole('alert');
      expect(alert).toBeTruthy();
    });

    it('should show errors during async submission (on-touch strategy)', async () => {
      @Component({
        selector: 'ngx-test-submitting-on-touch',
        imports: [Field, NgxSignalFormErrorComponent],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <input id="email" [field]="contactForm.email" />
          <ngx-signal-form-error
            [field]="contactForm.email"
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

      const alert = screen.getByRole('alert');
      expect(alert).toBeTruthy();
      expect(alert.textContent).toContain('This field is required');
    });

    it('should show errors during async submission (on-submit strategy)', async () => {
      @Component({
        selector: 'ngx-test-submitting-on-submit',
        imports: [Field, NgxSignalFormErrorComponent],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <input id="email" [field]="contactForm.email" />
          <ngx-signal-form-error
            [field]="contactForm.email"
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
        imports: [Field, NgxSignalFormErrorComponent],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <input id="email" [field]="contactForm.email" />
          <ngx-signal-form-error
            [field]="contactForm.email"
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
        imports: [Field, NgxSignalFormErrorComponent],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <input id="email" [field]="contactForm.email" />
          <ngx-signal-form-error
            [field]="contactForm.email"
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
        imports: [Field, NgxSignalFormErrorComponent],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <input id="email" [field]="contactForm.email" />
          <ngx-signal-form-error
            [field]="contactForm.email"
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
        imports: [Field, NgxSignalFormErrorComponent],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <input id="email" [field]="contactForm.email" />
          <ngx-signal-form-error
            [field]="contactForm.email"
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
        imports: [Field, NgxSignalFormErrorComponent],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <input
            id="user.profile.email"
            [field]="contactForm.user.profile.email"
          />
          <ngx-signal-form-error
            [field]="contactForm.user.profile.email"
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
        imports: [Field, NgxSignalFormErrorComponent],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <input id="email" [field]="contactForm.email" />
          <ngx-signal-form-error
            [field]="contactForm.email"
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

      // Touch the field
      const input = screen.getByRole('textbox');
      await userEvent.click(input);
      await userEvent.tab();

      const alert = screen.queryByRole('alert');
      expect(alert).toBeFalsy();
    });

    it('should handle empty errors array', async () => {
      @Component({
        selector: 'ngx-test-empty-errors',
        imports: [Field, NgxSignalFormErrorComponent],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <input id="email" [field]="contactForm.email" />
          <ngx-signal-form-error
            [field]="contactForm.email"
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

      // Touch the field
      const input = screen.getByRole('textbox');
      await userEvent.click(input);
      await userEvent.tab();

      const alert = screen.queryByRole('alert');
      expect(alert).toBeFalsy();
    });
  });
});
