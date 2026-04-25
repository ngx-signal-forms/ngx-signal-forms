import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  email,
  form,
  FormField,
  required,
  schema,
  validate,
} from '@angular/forms/signals';
import type {
  ErrorDisplayStrategy,
  SubmittedStatus,
} from '@ngx-signal-forms/toolkit';
import { NGX_SIGNAL_FORM_FIELD_CONTEXT } from '@ngx-signal-forms/toolkit';
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { NgxFormFieldError } from './form-field-error';

// jsdom does not compute custom-property values from emulated component
// stylesheets, so theme-default specs read the CSS source directly. Runtime
// resolution is covered by the *.browser.spec.ts suite and e2e snapshots.
const errorCssSource = readFileSync(
  resolve(import.meta.dirname, './form-field-error.css'),
  'utf8',
);

describe('NgxFormFieldError', () => {
  describe('BUG REPRODUCTION - Initial Render', () => {
    it('should NOT show errors on initial render with untouched field (on-touch strategy)', async () => {
      @Component({
        selector: 'ngx-test-initial-render',
        imports: [FormField, NgxFormFieldError],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <input id="email" [formField]="contactForm.email" />
          <ngx-form-field-error
            [formField]="contactForm.email"
            fieldName="email"
            strategy="on-touch"
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
        imports: [FormField, NgxFormFieldError],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <input id="email" [formField]="contactForm.email" />
          <ngx-form-field-error
            [formField]="contactForm.email"
            fieldName="email"
            strategy="on-submit"
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
    it('exposes token-backed theme defaults through pseudo-private properties', () => {
      // The pseudo-private variables flow design tokens (`--_error-clr-*`)
      // into the public-facing names (`--_error-color`, `--_warning-color`)
      // via `var(--ngx-…, var(--_error-clr-…))`. Asserting on the source keeps
      // the WCAG-AA contrast contract documented and prevents accidental
      // overrides — runtime resolution is covered in browser-mode specs.
      expect(errorCssSource).toMatch(/--_error-clr-danger:\s*#db1818\b/);
      expect(errorCssSource).toMatch(/--_error-color:[^;]*--_error-clr-danger/);
      expect(errorCssSource).toMatch(/--_error-clr-warning:\s*#a16207\b/);
      expect(errorCssSource).toMatch(
        /--_warning-color:[^;]*--_error-clr-warning/,
      );
    });

    it('should render errors when field is invalid and touched (on-touch strategy)', async () => {
      @Component({
        selector: 'ngx-test-touched-invalid',
        imports: [FormField, NgxFormFieldError],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <input id="email" [formField]="contactForm.email" />
          <ngx-form-field-error
            [formField]="contactForm.email"
            fieldName="email"
            strategy="on-touch"
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
        imports: [FormField, NgxFormFieldError],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <input id="email" [formField]="contactForm.email" />
          <ngx-form-field-error
            [formField]="contactForm.email"
            fieldName="email"
            strategy="on-touch"
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
        imports: [FormField, NgxFormFieldError],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <input id="email" [formField]="contactForm.email" />
          <ngx-form-field-error
            [formField]="contactForm.email"
            fieldName="email"
            strategy="on-touch"
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
        imports: [FormField, NgxFormFieldError],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <input id="email" [formField]="contactForm.email" />
          <ngx-form-field-error
            [formField]="contactForm.email"
            fieldName="email"
            strategy="immediate"
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
        '.ngx-form-field-error__message',
      );
      // Should have at least the required error
      expect(messages.length).toBeGreaterThan(0);
    });

    it('should keep the default inline layout as paragraphs', async () => {
      @Component({
        selector: 'ngx-test-default-paragraph-layout',
        imports: [FormField, NgxFormFieldError],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <input id="email" [formField]="contactForm.email" />
          <ngx-form-field-error
            [formField]="contactForm.email"
            fieldName="email"
            strategy="immediate"
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
      }

      const { container } = await render(TestComponent);

      expect(
        container.querySelector('.ngx-form-field-error__message')?.tagName,
      ).toBe('P');
      expect(
        container.querySelector('.ngx-form-field-error__list'),
      ).toBeFalsy();
    });

    it('should render bullet lists when requested', async () => {
      @Component({
        selector: 'ngx-test-bullet-layout',
        imports: [NgxFormFieldError],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <ngx-form-field-error
            fieldName="address"
            listStyle="bullets"
            [errors]="errors"
          />
        `,
      })
      class TestComponent {
        readonly errors = signal([
          { kind: 'required', message: 'Street is required' },
          { kind: 'required-city', message: 'City is required' },
        ]);
      }

      const { container } = await render(TestComponent);

      const list = container.querySelector('.ngx-form-field-error__list');
      expect(list?.tagName).toBe('UL');
      expect(list?.querySelectorAll('li')).toHaveLength(2);
    });
  });

  describe('strategy switching', () => {
    it('should show errors immediately with immediate strategy)', async () => {
      @Component({
        selector: 'ngx-test-immediate-strategy',
        imports: [FormField, NgxFormFieldError],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <input id="email" [formField]="contactForm.email" />
          <ngx-form-field-error
            [formField]="contactForm.email"
            fieldName="email"
            strategy="immediate"
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
        imports: [FormField, NgxFormFieldError],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <input id="email" [formField]="contactForm.email" />
          <ngx-form-field-error
            [formField]="contactForm.email"
            fieldName="email"
            strategy="on-submit"
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

    it('should NOT show errors after submit if not touched (on-touch strategy)', async () => {
      // Simplified architecture: on-touch only checks touched()
      // Angular's submit() calls markAllAsTouched(), so in real usage touched() would be true
      @Component({
        selector: 'ngx-test-submitted-untouched',
        imports: [FormField, NgxFormFieldError],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <input id="email" [formField]="contactForm.email" />
          <ngx-form-field-error
            [formField]="contactForm.email"
            fieldName="email"
            strategy="on-touch"
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
        imports: [FormField, NgxFormFieldError],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <input id="email" [formField]="contactForm.email" />
          <ngx-form-field-error
            [formField]="contactForm.email"
            fieldName="email"
            strategy="on-touch"
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
        imports: [FormField, NgxFormFieldError],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <input id="email" [formField]="contactForm.email" />
          <ngx-form-field-error
            [formField]="contactForm.email"
            fieldName="email"
            strategy="on-submit"
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
        imports: [FormField, NgxFormFieldError],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <input id="email" [formField]="contactForm.email" />
          <ngx-form-field-error
            [formField]="contactForm.email"
            fieldName="email"
            strategy="on-submit"
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
        imports: [FormField, NgxFormFieldError],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <input id="email" [formField]="contactForm.email" />
          <ngx-form-field-error
            [formField]="contactForm.email"
            fieldName="email"
            strategy="immediate"
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

    it('should keep an empty role="alert" live region mounted before any errors appear (WCAG 4.1.3)', async () => {
      /**
       * WCAG 4.1.3 (Status Messages): role="alert" only fires reliably on
       * NVDA + Chrome when content is inserted into a *pre-existing* live
       * region. If the alert container itself is added to the DOM at the
       * same moment as the first error, the very first announcement can be
       * silently dropped. v1 keeps the role="alert" container always
       * mounted (and aria-hidden="true" while empty) so that timing
       * edge case never trips screen readers.
       */
      @Component({
        selector: 'ngx-test-empty-live-region',
        imports: [FormField, NgxFormFieldError],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <input id="email" [formField]="contactForm.email" />
          <ngx-form-field-error
            [formField]="contactForm.email"
            fieldName="email"
            strategy="on-touch"
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

      const { container } = await render(TestComponent);

      // Untouched + on-touch ⇒ no error is *announced* (nothing to read)
      // but the live-region container itself MUST already be in the DOM
      // with role="alert" so a future insertion fires the announcement.
      // The container carries the `--empty` marker class so CSS can
      // collapse it visually; `aria-hidden="true"` keeps AT silent until
      // content arrives, and `[hidden]` removes the empty shell from
      // layout flow.
      const alertContainer = container.querySelector('[role="alert"]');
      expect(alertContainer).toBeTruthy();
      expect(
        alertContainer?.classList.contains('ngx-form-field-error--empty'),
      ).toBe(true);
      expect(alertContainer?.getAttribute('aria-hidden')).toBe('true');
      expect(alertContainer?.hasAttribute('hidden')).toBe(true);
      // No id leaks while empty — aria-describedby targets must not point
      // at an element with no message text. Angular renders `null`
      // bindings as either a missing attribute or the literal string
      // "null" depending on the jsdom path; what matters here is that
      // the auto-generated `*-error` id is not exposed.
      const idAttr = alertContainer?.getAttribute('id') ?? null;
      expect(idAttr === null || idAttr === '' || idAttr === 'null').toBe(true);
      // No error text either.
      expect(alertContainer?.textContent?.trim()).toBe('');

      // The same applies to the warning role="status" sibling.
      const statusContainer = container.querySelector('[role="status"]');
      expect(statusContainer).toBeTruthy();
      expect(
        statusContainer?.classList.contains('ngx-form-field-error--empty'),
      ).toBe(true);
      expect(statusContainer?.getAttribute('aria-hidden')).toBe('true');
      expect(statusContainer?.hasAttribute('hidden')).toBe(true);
    });

    it('should rely on role="alert" implicit semantics (no redundant aria-live/aria-atomic)', async () => {
      /**
       * `role="alert"` already implies `aria-live="assertive"` and
       * `aria-atomic="true"`. Setting them explicitly triggers duplicate
       * announcements on NVDA + Firefox, so v1 exposes only the role.
       */
      @Component({
        selector: 'ngx-test-aria-live',
        imports: [FormField, NgxFormFieldError],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <input id="email" [formField]="contactForm.email" />
          <ngx-form-field-error
            [formField]="contactForm.email"
            fieldName="email"
            strategy="immediate"
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
      expect(alert.getAttribute('role')).toBe('alert');
      expect(alert.hasAttribute('aria-live')).toBe(false);
      expect(alert.hasAttribute('aria-atomic')).toBe(false);
    });

    it('should have correct error ID for aria-describedby linking', async () => {
      @Component({
        selector: 'ngx-test-error-id',
        imports: [FormField, NgxFormFieldError],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <input id="email" [formField]="contactForm.email" />
          <ngx-form-field-error
            [formField]="contactForm.email"
            fieldName="email"
            strategy="immediate"
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
        imports: [FormField, NgxFormFieldError],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <input
            id="user.profile.email"
            [formField]="contactForm.user.profile.email"
          />
          <ngx-form-field-error
            [formField]="contactForm.user.profile.email"
            fieldName="user.profile.email"
            strategy="immediate"
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
        imports: [FormField, NgxFormFieldError],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <input id="email" [formField]="contactForm.email" />
          <ngx-form-field-error
            [formField]="contactForm.email"
            fieldName="email"
            strategy="on-touch"
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
        imports: [FormField, NgxFormFieldError],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <input id="email" [formField]="contactForm.email" />
          <ngx-form-field-error
            [formField]="contactForm.email"
            fieldName="email"
            strategy="on-touch"
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
       * when used inside ngx-form-field-wrapper.
       *
       * The context provides { fieldName: Signal<string> } which error component
       * uses when its own fieldName input is undefined.
       */
      @Component({
        selector: 'ngx-test-context-resolution',
        imports: [FormField, NgxFormFieldError],
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
          <ngx-form-field-error
            [formField]="contactForm.email"
            strategy="immediate"
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
       * 3. Throw when neither is available
       */
      @Component({
        selector: 'ngx-test-explicit-priority',
        imports: [FormField, NgxFormFieldError],
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
          <ngx-form-field-error
            [formField]="contactForm.email"
            fieldName="explicit-name"
            strategy="immediate"
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

    it('should render without crashing and log a dev-mode console.error when no context and no input are available', async () => {
      /**
       * Previously the component threw from `#resolvedFieldName`, which crashed
       * the entire view. v1 behaviour: log a dev-mode `console.error`, return
       * `null` from `errorId()` / `warningId()`, and still render the alert
       * container (without an `id` — aria-describedby wiring is skipped until
       * a field name becomes available).
       */
      @Component({
        selector: 'ngx-test-fallback',
        imports: [FormField, NgxFormFieldError],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <input id="email" [formField]="contactForm.email" />
          <ngx-form-field-error
            [formField]="contactForm.email"
            strategy="immediate"
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

      const errorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);

      try {
        await render(TestComponent);

        const alert = screen.getByRole('alert');
        expect(alert).toBeTruthy();
        // Without a field name the auto-generated id would look like
        // `-error` / `-warning`, which is a broken aria-describedby
        // target. The v1 contract is simply: no resolvable field name →
        // no id chain exposed. We accept any "empty-ish" id value here
        // (null, "", or literally "null" which some JSDOM pathways emit
        // when binding null) — the important assertion is that no
        // `*-error` id leaks into the DOM.
        const idAttr = alert.getAttribute('id');
        expect(idAttr?.endsWith('-error') ?? false).toBe(false);
        expect(alert.textContent).toContain('Email is required');

        expect(errorSpy).toHaveBeenCalled();
        const message = String(errorSpy.mock.calls[0]?.[0] ?? '');
        expect(message).toMatch(/requires an explicit `fieldName` input/u);
      } finally {
        errorSpy.mockRestore();
      }
    });

    it('should react to context signal changes', async () => {
      /**
       * The context provides a signal, not a static value.
       * This test verifies the error component responds to signal updates.
       */
      const fieldNameSignal = signal('initial-name');

      @Component({
        selector: 'ngx-test-signal-reactivity',
        imports: [FormField, NgxFormFieldError],
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
          <ngx-form-field-error
            [formField]="contactForm.email"
            strategy="immediate"
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

  describe('warningStrategy', () => {
    /**
     * The PR #17 v1 audit introduced `warningStrategy` as a dedicated input
     * that decouples warning-visibility timing from error-visibility timing.
     * Default is `'immediate'` so informational guidance stays visible even
     * while errors are still gated by `'on-touch'` / `'on-submit'`.
     *
     * These tests lock that contract: errors and warnings resolve their
     * visibility through independent strategy inputs and share only the
     * submitted-status signal when `on-submit` is involved.
     */
    @Component({
      selector: 'ngx-test-warning-strategy',
      imports: [FormField, NgxFormFieldError],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
        <input id="password" [formField]="contactForm.password" />
        <ngx-form-field-error
          [formField]="contactForm.password"
          fieldName="password"
          [strategy]="strategy()"
          [warningStrategy]="warningStrategy()"
          [submittedStatus]="submittedStatus()"
        />
      `,
    })
    class WarningStrategyHost {
      readonly #model = signal({ password: 'weak' });
      readonly contactForm = form(
        this.#model,
        schema((path) => {
          validate(path.password, (ctx) => {
            const value = ctx.value();
            if (value.length > 0 && value.length < 8) {
              return {
                kind: 'warn:weak-password',
                message: 'Consider 8+ characters',
              };
            }
            return null;
          });
        }),
      );
      readonly strategy = signal<ErrorDisplayStrategy | undefined>('on-touch');
      readonly warningStrategy = signal<ErrorDisplayStrategy | undefined>(
        undefined,
      );
      readonly submittedStatus = signal<SubmittedStatus>('unsubmitted');
    }

    it('surfaces warnings immediately by default even when error strategy gates errors', async () => {
      // Default warningStrategy is 'immediate'. With strategy='on-touch' and
      // an untouched field, errors are hidden — but the warning must still
      // surface. This is the whole point of decoupling.
      await render(WarningStrategyHost);

      const status = screen.getByRole('status');
      expect(status).toBeTruthy();
      expect(status.textContent).toContain('Consider 8+ characters');

      // Errors stay hidden — only the warning is visible.
      expect(screen.queryByRole('alert')).toBeFalsy();
    });

    it('gates warnings behind touch when warningStrategy is on-touch', async () => {
      const { fixture } = await render(WarningStrategyHost);
      fixture.componentInstance.warningStrategy.set('on-touch');
      fixture.detectChanges();

      // Untouched: warning hidden.
      expect(screen.queryByRole('status')).toBeFalsy();

      // Touching the field surfaces the warning.
      fixture.componentInstance.contactForm.password().markAsTouched();
      fixture.detectChanges();

      const status = await screen.findByRole('status');
      expect(status.textContent).toContain('Consider 8+ characters');
    });

    it('gates warnings behind submit when warningStrategy is on-submit', async () => {
      const { fixture } = await render(WarningStrategyHost);
      fixture.componentInstance.warningStrategy.set('on-submit');
      fixture.detectChanges();

      // Unsubmitted: warning hidden even when touched.
      fixture.componentInstance.contactForm.password().markAsTouched();
      fixture.detectChanges();
      expect(screen.queryByRole('status')).toBeFalsy();

      // After submit, warning surfaces.
      fixture.componentInstance.submittedStatus.set('submitted');
      fixture.detectChanges();

      const status = await screen.findByRole('status');
      expect(status.textContent).toContain('Consider 8+ characters');
    });

    it('keeps warnings visible while errors stay hidden under on-submit', async () => {
      // The practical use case: error strategy is `on-submit` (strict form),
      // but warnings should still guide the user immediately. With default
      // `warningStrategy`, this should work transparently.
      const { fixture } = await render(WarningStrategyHost);
      fixture.componentInstance.strategy.set('on-submit');
      fixture.componentInstance.warningStrategy.set(undefined);
      fixture.detectChanges();

      // Warning visible even before submit.
      const status = screen.getByRole('status');
      expect(status.textContent).toContain('Consider 8+ characters');

      // Errors still gated by submit.
      expect(screen.queryByRole('alert')).toBeFalsy();
    });
  });
});
