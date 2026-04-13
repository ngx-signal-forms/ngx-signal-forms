import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { form, FormField, required, schema } from '@angular/forms/signals';
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { NgxHeadlessErrorSummaryDirective } from './error-summary.directive';

describe('NgxHeadlessErrorSummaryDirective', () => {
  describe('basic error summary', () => {
    it('should expose hasErrors as true when form has errors', async () => {
      @Component({
        selector: 'ngx-test-summary-errors',
        imports: [FormField, NgxHeadlessErrorSummaryDirective],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <div>
            <input id="email" [formField]="contactForm.email" />
            <div
              ngxSignalFormHeadlessErrorSummary
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
        imports: [FormField, NgxHeadlessErrorSummaryDirective],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <div>
            <input id="email" [formField]="contactForm.email" />
            <div
              ngxSignalFormHeadlessErrorSummary
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
        imports: [FormField, NgxHeadlessErrorSummaryDirective],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <div>
            <input id="email" [formField]="contactForm.email" />
            <input id="name" [formField]="contactForm.name" />
            <div
              ngxSignalFormHeadlessErrorSummary
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
  });

  describe('strategy-aware visibility', () => {
    it('should not show summary with on-touch strategy when untouched', async () => {
      @Component({
        selector: 'ngx-test-summary-on-touch',
        imports: [FormField, NgxHeadlessErrorSummaryDirective],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <div>
            <input id="email" [formField]="contactForm.email" />
            <div
              ngxSignalFormHeadlessErrorSummary
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
        imports: [FormField, NgxHeadlessErrorSummaryDirective],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <div>
            <input
              id="email"
              data-testid="email-input"
              [formField]="contactForm.email"
            />
            <div
              ngxSignalFormHeadlessErrorSummary
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

  describe('focus capability', () => {
    it('should expose focus method on error entries', async () => {
      @Component({
        selector: 'ngx-test-summary-focus',
        imports: [FormField, NgxHeadlessErrorSummaryDirective],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <div>
            <input
              id="email"
              data-testid="email-input"
              [formField]="contactForm.email"
            />
            <div
              ngxSignalFormHeadlessErrorSummary
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
});
