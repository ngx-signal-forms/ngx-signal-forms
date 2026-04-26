import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  isSignal,
  signal,
  viewChild,
  type Signal,
} from '@angular/core';
import {
  form,
  FormField,
  required,
  schema,
  type ValidationError,
} from '@angular/forms/signals';
import type { SubmittedStatus } from '@ngx-signal-forms/toolkit';
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { NgxHeadlessErrorState } from './error-state';

describe('NgxHeadlessErrorState', () => {
  describe('error state signals', () => {
    it('should expose hasErrors signal as true when field has errors', async () => {
      @Component({
        selector: 'ngx-test-has-errors',
        imports: [FormField, NgxHeadlessErrorState],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <div>
            <input id="email" [formField]="contactForm.email" />
            <div
              ngxHeadlessErrorState
              #errorState="errorState"
              [field]="contactForm.email"
              fieldName="email"
              strategy="immediate"
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
        imports: [FormField, NgxHeadlessErrorState],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <div>
            <input id="email" [formField]="contactForm.email" />
            <div
              ngxHeadlessErrorState
              #errorState="errorState"
              [field]="contactForm.email"
              fieldName="email"
              strategy="immediate"
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
        imports: [FormField, NgxHeadlessErrorState],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <div>
            <input id="email" [formField]="contactForm.email" />
            <div
              ngxHeadlessErrorState
              #errorState="errorState"
              [field]="contactForm.email"
              fieldName="email"
              strategy="on-touch"
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
        imports: [FormField, NgxHeadlessErrorState],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <div>
            <input id="email" [formField]="contactForm.email" />
            <div
              ngxHeadlessErrorState
              #errorState="errorState"
              [field]="contactForm.email"
              fieldName="email"
              strategy="immediate"
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
        imports: [FormField, NgxHeadlessErrorState],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <div>
            <input id="email" [formField]="contactForm.email" />
            <div
              ngxHeadlessErrorState
              #errorState="errorState"
              [field]="contactForm.email"
              fieldName="email"
              strategy="immediate"
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

    it('should expose state members as real `Signal<T>` instances (preserves Angular brand)', async () => {
      @Component({
        selector: 'ngx-test-signal-brand',
        imports: [FormField, NgxHeadlessErrorState],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <div>
            <input id="email" [formField]="contactForm.email" />
            <div
              ngxHeadlessErrorState
              #errorState="errorState"
              [field]="contactForm.email"
              fieldName="email"
              strategy="immediate"
            ></div>
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
        readonly state = viewChild.required(NgxHeadlessErrorState);
      }

      const { fixture } = await render(TestComponent);
      const state = fixture.componentInstance.state();

      // Brand-level checks: each declared `Signal<T>` member must satisfy
      // Angular's `isSignal()` reflection. A plain `() => T` function would
      // fail this check and break consumers using `toObservable()` etc.
      expect(isSignal(state.hasErrors)).toBe(true);
      expect(isSignal(state.hasWarnings)).toBe(true);
      expect(isSignal(state.errors)).toBe(true);
      expect(isSignal(state.warnings)).toBe(true);
      expect(isSignal(state.resolvedErrors)).toBe(true);
      expect(isSignal(state.resolvedWarnings)).toBe(true);
      expect(isSignal(state.showErrors)).toBe(true);
      expect(isSignal(state.showWarnings)).toBe(true);
      expect(isSignal(state.errorId)).toBe(true);
      expect(isSignal(state.warningId)).toBe(true);
    });

    it('should generate correct errorId and warningId', async () => {
      @Component({
        selector: 'ngx-test-error-ids',
        imports: [FormField, NgxHeadlessErrorState],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <div>
            <input id="email" [formField]="contactForm.email" />
            <div
              ngxHeadlessErrorState
              #errorState="errorState"
              [field]="contactForm.email"
              fieldName="email"
              strategy="immediate"
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
        imports: [FormField, NgxHeadlessErrorState],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <div>
            <input id="email" [formField]="contactForm.email" />
            <div
              ngxHeadlessErrorState
              #errorState="errorState"
              [field]="contactForm.email"
              fieldName="email"
              strategy="immediate"
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
        imports: [FormField, NgxHeadlessErrorState],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <div>
            <input id="email" [formField]="contactForm.email" />
            <div
              ngxHeadlessErrorState
              #errorState="errorState"
              [field]="contactForm.email"
              fieldName="email"
              strategy="on-submit"
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
  });

  describe('custom template rendering', () => {
    it('should allow custom error template rendering', async () => {
      @Component({
        selector: 'ngx-test-custom-template',
        imports: [FormField, NgxHeadlessErrorState],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <div>
            <input id="email" [formField]="contactForm.email" />
            <div
              ngxHeadlessErrorState
              #errorState="errorState"
              [field]="contactForm.email"
              fieldName="email"
              strategy="immediate"
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
        imports: [FormField, NgxHeadlessErrorState],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <div>
            <input id="email" [formField]="contactForm.email" />
            <div
              ngxHeadlessErrorState
              #errorState="errorState"
              [field]="contactForm.email"
              fieldName="email"
              strategy="on-touch"
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

  describe('errorsOverride (direct-errors mode)', () => {
    it('replaces field-derived errors with the override signal', async () => {
      @Component({
        selector: 'ngx-test-errors-override',
        imports: [NgxHeadlessErrorState],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <div
            ngxHeadlessErrorState
            #errorState="errorState"
            [errorsOverride]="overrideErrors"
            fieldName="address"
          >
            @for (error of errorState.resolvedErrors(); track error.kind) {
              <span data-testid="override-error">{{ error.message }}</span>
            }
            @if (errorState.showErrors()) {
              <span data-testid="show">Show</span>
            }
          </div>
        `,
      })
      class TestComponent {
        readonly overrideErrors: Signal<readonly ValidationError[]> = computed(
          () => [
            { kind: 'required', message: 'Street is required' },
            { kind: 'required', message: 'City is required' },
          ],
        );
      }

      await render(TestComponent);

      // showErrors short-circuits to true in direct-errors mode (caller
      // controls visibility via the override signal contents).
      expect(screen.getByTestId('show')).toBeTruthy();

      const messages = screen.getAllByTestId('override-error');
      expect(messages.map((el) => el.textContent)).toEqual([
        'Street is required',
        'City is required',
      ]);
    });

    it('treats an explicit empty array as "no errors to display"', async () => {
      @Component({
        selector: 'ngx-test-errors-override-empty',
        imports: [NgxHeadlessErrorState],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <div
            ngxHeadlessErrorState
            #errorState="errorState"
            [errorsOverride]="empty"
            fieldName="address"
          >
            @if (errorState.hasErrors()) {
              <span data-testid="has-errors">Has Errors</span>
            } @else {
              <span data-testid="no-errors">No Errors</span>
            }
          </div>
        `,
      })
      class TestComponent {
        readonly empty: Signal<readonly ValidationError[]> = computed(() => []);
      }

      await render(TestComponent);

      expect(screen.getByTestId('no-errors')).toBeTruthy();
    });
  });

  describe('connectFieldState() bridge', () => {
    it('drives showErrors from a host-bridged field state when [field] is omitted', async () => {
      @Component({
        selector: 'ngx-bridged-host',
        changeDetection: ChangeDetectionStrategy.OnPush,
        hostDirectives: [
          { directive: NgxHeadlessErrorState, inputs: ['strategy'] },
        ],
        template: `
          @if (headless.showErrors()) {
            <span data-testid="bridge-show">Show</span>
          } @else {
            <span data-testid="bridge-hide">Hide</span>
          }
        `,
      })
      class BridgedHostComponent {
        protected readonly headless = inject(NgxHeadlessErrorState);
        readonly hostField = signal<{
          touched: () => boolean;
          invalid: () => boolean;
        } | null>(null);

        constructor() {
          // Mirror what NgxFormFieldError does: bridge a signal of field state
          // (not a FieldTree) into the headless directive in the constructor.
          this.headless.connectFieldState(computed(() => this.hostField()));
        }
      }

      @Component({
        selector: 'ngx-test-bridge',
        imports: [BridgedHostComponent],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `<ngx-bridged-host strategy="on-touch" />`,
      })
      class TestComponent {
        readonly host = viewChild.required(BridgedHostComponent);
      }

      const { fixture } = await render(TestComponent);

      // No bridged value yet — showErrors short-circuits to true (host
      // controls visibility via its own template conditions).
      expect(screen.getByTestId('bridge-show')).toBeTruthy();

      // Bridge an untouched + invalid field — on-touch strategy should hide.
      fixture.componentInstance
        .host()
        .hostField.set({ touched: () => false, invalid: () => true });
      fixture.detectChanges();
      expect(screen.getByTestId('bridge-hide')).toBeTruthy();

      // Touch the bridged field — strategy now permits visibility.
      fixture.componentInstance
        .host()
        .hostField.set({ touched: () => true, invalid: () => true });
      fixture.detectChanges();
      expect(screen.getByTestId('bridge-show')).toBeTruthy();
    });
  });
});
