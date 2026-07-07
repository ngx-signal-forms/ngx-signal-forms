import { ApplicationRef, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  disabled,
  form,
  FormField,
  hidden,
  required,
  schema,
  validate,
} from '@angular/forms/signals';
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { NgxHeadlessErrorSummary } from './error-summary';

describe('NgxHeadlessErrorSummary', () => {
  describe('basic error summary', () => {
    it('should expose hasErrors as true when form has errors', async () => {
      @Component({
        selector: 'ngx-test-summary-errors',
        imports: [FormField, NgxHeadlessErrorSummary],

        template: `
          <div>
            <input id="email" [formField]="contactForm.email" />
            <div
              ngxHeadlessErrorSummary
              #summary="errorSummary"
              [formTree]="contactForm"
              strategy="immediate"
            >
              @if (summary.hasErrors()) {
                <span data-testid="has-errors">Has Errors</span>
              }
            </div>
          </div>
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

      await render(TestComponent);

      expect(screen.getByTestId('has-errors')).toBeTruthy();
    });

    it('should expose hasErrors as false when form is valid', async () => {
      @Component({
        selector: 'ngx-test-summary-valid',
        imports: [FormField, NgxHeadlessErrorSummary],

        template: `
          <div>
            <input id="email" [formField]="contactForm.email" />
            <div
              ngxHeadlessErrorSummary
              #summary="errorSummary"
              [formTree]="contactForm"
              strategy="immediate"
            >
              @if (summary.hasErrors()) {
                <span data-testid="has-errors">Has Errors</span>
              } @else {
                <span data-testid="no-errors">No Errors</span>
              }
            </div>
          </div>
        `,
      })
      class TestComponent {
        readonly #model = signal({ email: 'test@example.com' });
        readonly contactForm = form(
          this.#model,
          schema((path) => {
            required(path.email, { message: 'Email is required' });
          }),
        );
      }

      await render(TestComponent);

      expect(screen.getByTestId('no-errors')).toBeTruthy();
    });

    it('should render error entries with messages', async () => {
      @Component({
        selector: 'ngx-test-summary-entries',
        imports: [FormField, NgxHeadlessErrorSummary],

        template: `
          <div>
            <input id="email" [formField]="contactForm.email" />
            <input id="name" [formField]="contactForm.name" />
            <div
              ngxHeadlessErrorSummary
              #summary="errorSummary"
              [formTree]="contactForm"
              strategy="immediate"
            >
              @for (
                entry of summary.entries();
                track entry.kind + entry.fieldName
              ) {
                <span [attr.data-testid]="'error-' + entry.kind">{{
                  entry.message
                }}</span>
              }
            </div>
          </div>
        `,
      })
      class TestComponent {
        readonly #model = signal({ email: '', name: '' });
        readonly contactForm = form(
          this.#model,
          schema((path) => {
            required(path.email, { message: 'Email is required' });
            required(path.name, { message: 'Name is required' });
          }),
        );
      }

      await render(TestComponent);

      const emailError = screen.getByText('Email is required');
      expect(emailError).toBeTruthy();

      const nameError = screen.getByText('Name is required');
      expect(nameError).toBeTruthy();
    });

    it('keeps a separate entry per field when two fields share kind and the framework-default (message-less) error', async () => {
      // Both fields fail `required()` with no custom `message`, so
      // `ValidationError.message` is `undefined` for both — a message-blind
      // dedupe key (`kind::message`) collapses them to a single entry and
      // silently drops the second field from the summary (WCAG 3.3.1).
      @Component({
        selector: 'ngx-test-summary-shared-key',
        imports: [FormField, NgxHeadlessErrorSummary],

        template: `
          <div>
            <input id="email" [formField]="contactForm.email" />
            <input id="name" [formField]="contactForm.name" />
            <div
              ngxHeadlessErrorSummary
              #summary="errorSummary"
              [formTree]="contactForm"
              strategy="immediate"
            >
              <span data-testid="entry-count">{{
                summary.entries().length
              }}</span>
              @for (
                entry of summary.entries();
                track entry.kind + entry.fieldName
              ) {
                <span [attr.data-testid]="'field-' + entry.fieldName"></span>
              }
            </div>
          </div>
        `,
      })
      class TestComponent {
        readonly #model = signal({ email: '', name: '' });
        readonly contactForm = form(
          this.#model,
          schema((path) => {
            required(path.email);
            required(path.name);
          }),
        );
      }

      await render(TestComponent);

      expect(screen.getByTestId('entry-count')).toHaveTextContent('2');
      expect(screen.queryByTestId('field-Email')).toBeTruthy();
      expect(screen.queryByTestId('field-Name')).toBeTruthy();
    });
  });

  describe('strategy-aware visibility', () => {
    it('should not show summary with on-touch strategy when untouched', async () => {
      @Component({
        selector: 'ngx-test-summary-on-touch',
        imports: [FormField, NgxHeadlessErrorSummary],

        template: `
          <div>
            <input id="email" [formField]="contactForm.email" />
            <div
              ngxHeadlessErrorSummary
              #summary="errorSummary"
              [formTree]="contactForm"
              strategy="on-touch"
            >
              @if (summary.shouldShow()) {
                <span data-testid="visible-summary">Visible</span>
              } @else {
                <span data-testid="hidden-summary">Hidden</span>
              }
            </div>
          </div>
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

      await render(TestComponent);

      expect(screen.getByTestId('hidden-summary')).toBeTruthy();
    });

    it('should show summary with on-touch strategy after field is touched', async () => {
      @Component({
        selector: 'ngx-test-summary-after-touch',
        imports: [FormField, NgxHeadlessErrorSummary],

        template: `
          <div>
            <input
              id="email"
              data-testid="email-input"
              [formField]="contactForm.email"
            />
            <div
              ngxHeadlessErrorSummary
              #summary="errorSummary"
              [formTree]="contactForm"
              strategy="on-touch"
            >
              @if (summary.shouldShow()) {
                <span data-testid="visible-summary">Visible</span>
              } @else {
                <span data-testid="hidden-summary">Hidden</span>
              }
            </div>
          </div>
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

      const user = userEvent.setup();
      await render(TestComponent);

      const input = screen.getByTestId('email-input');
      await user.click(input);
      await user.tab();

      expect(screen.getByTestId('visible-summary')).toBeTruthy();
    });
  });

  describe('shouldShowWarnings', () => {
    it('gates a warnings-only form independently of shouldShow', async () => {
      // A warnings-only form never has blocking errors, so `hasErrors()` is
      // permanently `false` and `shouldShow()` (strategy && hasErrors) can
      // never gate `warningEntries()`. `shouldShowWarnings` (strategy &&
      // hasWarnings) is the dedicated gate consumers must use instead.
      @Component({
        selector: 'ngx-test-summary-should-show-warnings',
        imports: [FormField, NgxHeadlessErrorSummary],

        template: `
          <div>
            <input id="street" [formField]="addressForm.street" />
            <div
              ngxHeadlessErrorSummary
              #summary="errorSummary"
              [formTree]="addressForm"
              strategy="immediate"
            >
              <span data-testid="should-show">{{ summary.shouldShow() }}</span>
              <span data-testid="should-show-warnings">{{
                summary.shouldShowWarnings()
              }}</span>
              <span data-testid="warning-count">{{
                summary.warningEntries().length
              }}</span>
            </div>
          </div>
        `,
      })
      class TestComponent {
        readonly #model = signal({ street: '' });
        readonly addressForm = form(
          this.#model,
          schema((path) => {
            validate(path.street, (ctx) =>
              ctx.value()
                ? null
                : { kind: 'warn:street-optional', message: 'Optional' },
            );
          }),
        );
      }

      const { fixture } = await render(TestComponent);

      fixture.componentInstance.addressForm.street().markAsTouched();
      fixture.detectChanges();
      await TestBed.inject(ApplicationRef).whenStable();

      expect(screen.getByTestId('warning-count')).toHaveTextContent('1');
      expect(screen.getByTestId('should-show')).toHaveTextContent('false');
      expect(screen.getByTestId('should-show-warnings')).toHaveTextContent(
        'true',
      );
    });
  });

  describe('focus capability', () => {
    it('should expose focus method on error entries', async () => {
      @Component({
        selector: 'ngx-test-summary-focus',
        imports: [FormField, NgxHeadlessErrorSummary],

        template: `
          <div>
            <input
              id="email"
              data-testid="email-input"
              [formField]="contactForm.email"
            />
            <div
              ngxHeadlessErrorSummary
              #summary="errorSummary"
              [formTree]="contactForm"
              strategy="immediate"
            >
              @for (
                entry of summary.entries();
                track entry.kind + entry.fieldName
              ) {
                <button
                  type="button"
                  [attr.data-testid]="'focus-' + entry.kind"
                  (click)="entry.focus()"
                >
                  {{ entry.message }}
                </button>
              }
            </div>
          </div>
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

      const user = userEvent.setup();
      await render(TestComponent);

      const button = screen.getByTestId('focus-required');
      expect(button).toBeTruthy();

      await user.click(button);
      expect(document.activeElement).toBe(screen.getByTestId('email-input'));
    });
  });

  describe('non-interactive fields (hidden/disabled)', () => {
    it('should omit entries for hidden fields from the summary', async () => {
      @Component({
        selector: 'ngx-test-summary-hidden',
        imports: [FormField, NgxHeadlessErrorSummary],

        template: `
          <div>
            <input id="email" [formField]="contactForm.email" />
            <input id="secret" [formField]="contactForm.secret" />
            <div
              ngxHeadlessErrorSummary
              #summary="errorSummary"
              [formTree]="contactForm"
              strategy="immediate"
            >
              @for (
                entry of summary.entries();
                track entry.kind + entry.fieldName
              ) {
                <span [attr.data-testid]="'entry-' + entry.kind">{{
                  entry.message
                }}</span>
              }
            </div>
          </div>
        `,
      })
      class TestComponent {
        readonly #model = signal({ email: '', secret: '' });
        readonly contactForm = form(
          this.#model,
          schema((path) => {
            required(path.email, { message: 'Email is required' });
            required(path.secret, { message: 'Secret is required' });
            hidden(path.secret, () => true);
          }),
        );
      }

      await render(TestComponent);

      expect(screen.queryByText('Email is required')).toBeTruthy();
      expect(screen.queryByText('Secret is required')).toBeNull();
    });

    it('should omit entries for disabled fields from the summary', async () => {
      @Component({
        selector: 'ngx-test-summary-disabled',
        imports: [FormField, NgxHeadlessErrorSummary],

        template: `
          <div>
            <input id="email" [formField]="contactForm.email" />
            <input id="token" [formField]="contactForm.token" />
            <div
              ngxHeadlessErrorSummary
              #summary="errorSummary"
              [formTree]="contactForm"
              strategy="immediate"
            >
              @for (
                entry of summary.entries();
                track entry.kind + entry.fieldName
              ) {
                <span [attr.data-testid]="'entry-' + entry.kind">{{
                  entry.message
                }}</span>
              }
            </div>
          </div>
        `,
      })
      class TestComponent {
        readonly #model = signal({ email: '', token: '' });
        readonly contactForm = form(
          this.#model,
          schema((path) => {
            required(path.email, { message: 'Email is required' });
            required(path.token, { message: 'Token is required' });
            disabled(path.token, () => true);
          }),
        );
      }

      await render(TestComponent);

      expect(screen.queryByText('Email is required')).toBeTruthy();
      expect(screen.queryByText('Token is required')).toBeNull();
    });
  });
});
