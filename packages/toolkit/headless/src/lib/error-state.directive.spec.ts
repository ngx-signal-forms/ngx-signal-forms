import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import type { SubmittedStatus } from '@angular/forms/signals';
import { form, FormField, required, schema } from '@angular/forms/signals';
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { NgxHeadlessErrorStateDirective } from './error-state.directive';

describe('NgxHeadlessErrorStateDirective', () => {
  describe('error state signals', () => {
    it('should expose hasErrors signal as true when field has errors', async () => {
      @Component({
        selector: 'ngx-test-has-errors',
        imports: [FormField, NgxHeadlessErrorStateDirective],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <div>
            <input id="email" [formField]="contactForm.email" />
            <div
              ngxSignalFormHeadlessErrorState
              #errorState="errorState"
              [field]="contactForm.email"
              fieldName="email"
              [strategy]="'immediate'"
            >
              @if (errorState.hasErrors()) {
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

      const hasErrors = screen.getByTestId('has-errors');
      expect(hasErrors).toBeTruthy();
    });

    it('should expose hasErrors signal as false when field is valid', async () => {
      @Component({
        selector: 'ngx-test-no-errors',
        imports: [FormField, NgxHeadlessErrorStateDirective],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <div>
            <input id="email" [formField]="contactForm.email" />
            <div
              ngxSignalFormHeadlessErrorState
              #errorState="errorState"
              [field]="contactForm.email"
              fieldName="email"
              [strategy]="'immediate'"
            >
              @if (!errorState.hasErrors()) {
                <span data-testid="no-errors">No Errors</span>
              }
            </div>
          </div>
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
      }

      await render(TestComponent);

      const noErrors = screen.getByTestId('no-errors');
      expect(noErrors).toBeTruthy();
    });

    it('should expose showErrors signal based on strategy', async () => {
      @Component({
        selector: 'ngx-test-show-errors',
        imports: [FormField, NgxHeadlessErrorStateDirective],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <div>
            <input id="email" [formField]="contactForm.email" />
            <div
              ngxSignalFormHeadlessErrorState
              #errorState="errorState"
              [field]="contactForm.email"
              fieldName="email"
              [strategy]="'on-touch'"
            >
              @if (errorState.showErrors()) {
                <span data-testid="show-errors">Show Errors</span>
              } @else {
                <span data-testid="hide-errors">Hide Errors</span>
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

      const { fixture } = await render(TestComponent);

      // Initially, field is untouched - should hide errors
      expect(screen.getByTestId('hide-errors')).toBeTruthy();

      // Touch the field
      fixture.componentInstance.contactForm.email().markAsTouched();
      fixture.detectChanges();

      // Now errors should be shown
      expect(screen.getByTestId('show-errors')).toBeTruthy();
    });

    it('should expose errors signal with validation errors', async () => {
      @Component({
        selector: 'ngx-test-errors-array',
        imports: [FormField, NgxHeadlessErrorStateDirective],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <div>
            <input id="email" [formField]="contactForm.email" />
            <div
              ngxSignalFormHeadlessErrorState
              #errorState="errorState"
              [field]="contactForm.email"
              fieldName="email"
              [strategy]="'immediate'"
            >
              @for (error of errorState.errors(); track error.kind) {
                <span [attr.data-testid]="'error-' + error.kind">{{
                  error.kind
                }}</span>
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

      const error = screen.getByTestId('error-required');
      expect(error).toBeTruthy();
    });

    it('should expose resolvedErrors with messages', async () => {
      @Component({
        selector: 'ngx-test-resolved-errors',
        imports: [FormField, NgxHeadlessErrorStateDirective],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <div>
            <input id="email" [formField]="contactForm.email" />
            <div
              ngxSignalFormHeadlessErrorState
              #errorState="errorState"
              [field]="contactForm.email"
              fieldName="email"
              [strategy]="'immediate'"
            >
              @for (error of errorState.resolvedErrors(); track error.kind) {
                <span data-testid="error-message">{{ error.message }}</span>
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

      const error = screen.getByTestId('error-message');
      expect(error.textContent).toContain('Email is required');
    });

    it('should generate correct errorId and warningId', async () => {
      @Component({
        selector: 'ngx-test-error-ids',
        imports: [FormField, NgxHeadlessErrorStateDirective],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <div>
            <input id="email" [formField]="contactForm.email" />
            <div
              ngxSignalFormHeadlessErrorState
              #errorState="errorState"
              [field]="contactForm.email"
              fieldName="email"
              [strategy]="'immediate'"
            >
              <span data-testid="error-id">{{ errorState.errorId() }}</span>
              <span data-testid="warning-id">{{ errorState.warningId() }}</span>
            </div>
          </div>
        `,
      })
      class TestComponent {
        readonly #model = signal({ email: '' });
        readonly contactForm = form(this.#model);
      }

      await render(TestComponent);

      expect(screen.getByTestId('error-id').textContent).toBe('email-error');
      expect(screen.getByTestId('warning-id').textContent).toBe(
        'email-warning',
      );
    });
  });

  describe('strategy behavior', () => {
    it('should show errors immediately with immediate strategy', async () => {
      @Component({
        selector: 'ngx-test-immediate',
        imports: [FormField, NgxHeadlessErrorStateDirective],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <div>
            <input id="email" [formField]="contactForm.email" />
            <div
              ngxSignalFormHeadlessErrorState
              #errorState="errorState"
              [field]="contactForm.email"
              fieldName="email"
              [strategy]="'immediate'"
            >
              @if (errorState.showErrors()) {
                <span data-testid="show-errors">Show Errors</span>
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

      // Should show immediately without touching
      expect(screen.getByTestId('show-errors')).toBeTruthy();
    });

    it('should show errors only after submit with on-submit strategy', async () => {
      @Component({
        selector: 'ngx-test-on-submit',
        imports: [FormField, NgxHeadlessErrorStateDirective],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <div>
            <input id="email" [formField]="contactForm.email" />
            <div
              ngxSignalFormHeadlessErrorState
              #errorState="errorState"
              [field]="contactForm.email"
              fieldName="email"
              [strategy]="'on-submit'"
              [submittedStatus]="submittedStatus()"
            >
              @if (errorState.showErrors()) {
                <span data-testid="show-errors">Show Errors</span>
              } @else {
                <span data-testid="hide-errors">Hide Errors</span>
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
        readonly submittedStatus = signal<SubmittedStatus>('unsubmitted');
      }

      const { fixture } = await render(TestComponent);

      // Initially hidden
      expect(screen.getByTestId('hide-errors')).toBeTruthy();

      // After submit
      fixture.componentInstance.submittedStatus.set('submitted');
      fixture.detectChanges();

      expect(screen.getByTestId('show-errors')).toBeTruthy();
    });

    it('should never show errors with manual strategy', async () => {
      @Component({
        selector: 'ngx-test-manual',
        imports: [FormField, NgxHeadlessErrorStateDirective],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <div>
            <input id="email" [formField]="contactForm.email" />
            <div
              ngxSignalFormHeadlessErrorState
              #errorState="errorState"
              [field]="contactForm.email"
              fieldName="email"
              [strategy]="'manual'"
            >
              @if (errorState.showErrors()) {
                <span data-testid="show-errors">Show Errors</span>
              } @else {
                <span data-testid="hide-errors">Hide Errors</span>
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

      const { fixture } = await render(TestComponent);

      // Initially hidden
      expect(screen.getByTestId('hide-errors')).toBeTruthy();

      // Touch the field
      fixture.componentInstance.contactForm.email().markAsTouched();
      fixture.detectChanges();

      // Still hidden with manual strategy
      expect(screen.getByTestId('hide-errors')).toBeTruthy();
    });
  });

  describe('custom template rendering', () => {
    it('should allow custom error template rendering', async () => {
      @Component({
        selector: 'ngx-test-custom-template',
        imports: [FormField, NgxHeadlessErrorStateDirective],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <div>
            <input id="email" [formField]="contactForm.email" />
            <div
              ngxSignalFormHeadlessErrorState
              #errorState="errorState"
              [field]="contactForm.email"
              fieldName="email"
              [strategy]="'immediate'"
            >
              @if (errorState.showErrors() && errorState.hasErrors()) {
                <div
                  class="custom-error-container"
                  role="alert"
                  [id]="errorState.errorId()"
                >
                  @for (
                    error of errorState.resolvedErrors();
                    track error.kind
                  ) {
                    <div class="custom-error-item">
                      <span class="error-icon">⚠️</span>
                      <span class="error-text">{{ error.message }}</span>
                    </div>
                  }
                </div>
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

      const alert = screen.getByRole('alert');
      expect(alert).toBeTruthy();
      expect(alert.textContent).toContain('⚠️');
      expect(alert.textContent).toContain('Email is required');
    });
  });

  describe('interaction with user events', () => {
    it('should update showErrors when user touches and blurs field', async () => {
      @Component({
        selector: 'ngx-test-user-interaction',
        imports: [FormField, NgxHeadlessErrorStateDirective],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <div>
            <input id="email" [formField]="contactForm.email" />
            <div
              ngxSignalFormHeadlessErrorState
              #errorState="errorState"
              [field]="contactForm.email"
              fieldName="email"
              [strategy]="'on-touch'"
            >
              @if (errorState.showErrors()) {
                <span data-testid="show-errors">Show Errors</span>
              } @else {
                <span data-testid="hide-errors">Hide Errors</span>
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
      const user = userEvent.setup();

      // Initially hidden
      expect(screen.getByTestId('hide-errors')).toBeTruthy();

      // User focuses and blurs
      const input = screen.getByRole('textbox');
      await user.click(input);
      await user.tab();

      // Now errors should be shown
      expect(screen.getByTestId('show-errors')).toBeTruthy();
    });
  });
});
