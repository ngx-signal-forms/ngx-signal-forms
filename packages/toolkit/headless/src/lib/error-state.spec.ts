import {
  ApplicationRef,
  Component,
  computed,
  inject,
  Injector,
  isSignal,
  signal,
  viewChild,
  type Signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  form,
  FormField,
  required,
  schema,
  validate,
  type ValidationError,
} from '@angular/forms/signals';
import {
  provideNgxSignalFormsConfig,
  warningError,
  type ErrorReadableState,
  type SubmittedStatus,
} from '@ngx-signal-forms/toolkit';
import { NGX_SIGNAL_FORM_CONTEXT } from '@ngx-signal-forms/toolkit/core';
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { createErrorState, NgxHeadlessErrorState } from './error-state';

describe('NgxHeadlessErrorState', () => {
  describe('error state signals', () => {
    it('should expose hasErrors signal as true when field has errors', async () => {
      @Component({
        selector: 'ngx-test-has-errors',
        imports: [FormField, NgxHeadlessErrorState],

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
              @if (errorState.shouldShowErrors()) {
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
      expect(isSignal(state.shouldShowErrors)).toBe(true);
      expect(isSignal(state.shouldShowWarnings)).toBe(true);
      expect(isSignal(state.errorId)).toBe(true);
      expect(isSignal(state.warningId)).toBe(true);
    });

    it('should generate correct errorId and warningId', async () => {
      @Component({
        selector: 'ngx-test-error-ids',
        imports: [FormField, NgxHeadlessErrorState],

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
              @if (errorState.shouldShowErrors()) {
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
              @if (errorState.shouldShowErrors()) {
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

    it('honors NGX_SIGNAL_FORMS_CONFIG.defaultErrorStrategy outside a form context, matching NgxHeadlessFieldset', async () => {
      @Component({
        selector: 'ngx-test-config-default-strategy',
        imports: [FormField, NgxHeadlessErrorState],

        template: `
          <div>
            <input id="email" [formField]="contactForm.email" />
            <div
              ngxHeadlessErrorState
              #errorState="errorState"
              [field]="contactForm.email"
              fieldName="email"
            >
              @if (errorState.shouldShowErrors()) {
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

      await render(TestComponent, {
        providers: [
          provideNgxSignalFormsConfig({ defaultErrorStrategy: 'immediate' }),
        ],
      });

      // No [ngxSignalForm] host and no explicit `strategy` input — the
      // component-provided global config default ('immediate') should
      // still surface errors without touch, the same way
      // NgxHeadlessFieldset.resolvedStrategy already does.
      expect(screen.getByTestId('show-errors')).toBeTruthy();
    });
  });

  describe('custom template rendering', () => {
    it('should allow custom error template rendering', async () => {
      @Component({
        selector: 'ngx-test-custom-template',
        imports: [FormField, NgxHeadlessErrorState],

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
              @if (errorState.shouldShowErrors() && errorState.hasErrors()) {
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
              @if (errorState.shouldShowErrors()) {
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
            @if (errorState.shouldShowErrors()) {
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

        hostDirectives: [
          { directive: NgxHeadlessErrorState, inputs: ['strategy'] },
        ],
        template: `
          @if (headless.shouldShowErrors()) {
            <span data-testid="bridge-show">Show</span>
          } @else {
            <span data-testid="bridge-hide">Hide</span>
          }
        `,
      })
      class BridgedHostComponent {
        protected readonly headless = inject(NgxHeadlessErrorState);
        // `Partial<ErrorReadableState>` picks `touched`/`invalid` off Angular's
        // `FieldState`, so both are branded `Signal`s. Bare closures compiled
        // only because nothing checked this bridge.
        readonly hostField = signal<Partial<ErrorReadableState> | null>(null);

        constructor() {
          // Mirror what NgxFormFieldError does: bridge a signal of field state
          // (not a FieldTree) into the headless directive in the constructor.
          this.headless.connectFieldState(computed(() => this.hostField()));
        }
      }

      @Component({
        selector: 'ngx-test-bridge',
        imports: [BridgedHostComponent],

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
        .hostField.set({ touched: signal(false), invalid: signal(true) });
      fixture.detectChanges();
      expect(screen.getByTestId('bridge-hide')).toBeTruthy();

      // Touch the bridged field — strategy now permits visibility.
      fixture.componentInstance
        .host()
        .hostField.set({ touched: signal(true), invalid: signal(true) });
      fixture.detectChanges();
      expect(screen.getByTestId('bridge-show')).toBeTruthy();
    });
  });

  describe('warning visibility seam', () => {
    it('holds warnings back while a blocking error is visible on the same field', async () => {
      @Component({
        selector: 'ngx-test-warning-suppression',
        imports: [FormField, NgxHeadlessErrorState],

        template: `
          <div>
            <input id="password" [formField]="signupForm.password" />
            <div
              ngxHeadlessErrorState
              #errorState="errorState"
              [field]="signupForm.password"
              fieldName="password"
              strategy="immediate"
              warningStrategy="immediate"
            >
              <span data-testid="has-errors">
                {{ errorState.hasErrors() }}
              </span>
              <span data-testid="show-warnings">
                {{ errorState.shouldShowWarnings() }}
              </span>
            </div>
          </div>
        `,
      })
      class TestComponent {
        readonly model = signal({ password: 'abcd' });
        readonly signupForm = form(
          this.model,
          schema((path) => {
            validate(path.password, (ctx) =>
              ctx.value().length < 5
                ? { kind: 'minLength', message: 'At least 5 characters' }
                : null,
            );
            validate(path.password, (ctx) =>
              ctx.value().length < 12
                ? warningError('weak-password', 'Use 12+ characters')
                : null,
            );
          }),
        );
      }

      const { fixture } = await render(TestComponent);

      // 'abcd' trips both validators. The blocking error is visible, so the
      // warning region stays closed even under `warningStrategy="immediate"`.
      expect(screen.getByTestId('has-errors')).toHaveTextContent('true');
      expect(screen.getByTestId('show-warnings')).toHaveTextContent('false');

      // A longer-but-still-weak value clears the blocking error and leaves
      // only the warning.
      fixture.componentInstance.model.set({ password: 'abcdefg' });
      fixture.detectChanges();
      await TestBed.inject(ApplicationRef).whenStable();

      expect(screen.getByTestId('has-errors')).toHaveTextContent('false');
      expect(screen.getByTestId('show-warnings')).toHaveTextContent('true');
    });
  });

  // ============================================================================
  // Warning display cascade (ADR-0007, issue #439)
  // ============================================================================

  describe('warning display cascade (createErrorState)', () => {
    // `createErrorState()` used to alias `shouldShowWarnings: showErrorsSignal`,
    // which made an ambient `'on-submit'` error strategy hold warnings back
    // until submit — the rejected "warnings inherit the error strategy"
    // alternative in ADR-0007. Warnings now run their own cascade.
    //
    // The first test stays a *contract* against Angular: it pins the reason
    // the split cannot key off `invalid()`.

    function buildWarningOnlyForm() {
      const model = signal({ password: 'short' });
      return TestBed.runInInjectionContext(() =>
        form(
          model,
          schema((path) => {
            validate(path.password, (ctx) => {
              return ctx.value().length < 12
                ? {
                    kind: 'warn:weak-password',
                    message: 'Consider a stronger password',
                  }
                : null;
            });
          }),
        ),
      );
    }

    it('Angular marks a warning-only field as invalid()', () => {
      const passwordForm = buildWarningOnlyForm();
      const passwordState = passwordForm.password();

      // Contract: Angular does not distinguish warnings from errors, so the
      // toolkit gates warnings on `warn:` presence, not on `invalid()`.
      expect(passwordState.errors().length).toBeGreaterThan(0);
      expect(passwordState.invalid()).toBe(true);
    });

    it('surfaces warning-only fields after touch', () => {
      const passwordForm = buildWarningOnlyForm();

      const errorState = TestBed.runInInjectionContext(() =>
        createErrorState({
          field: passwordForm.password,
          fieldName: 'password',
        }),
      );

      expect(errorState.shouldShowWarnings()).toBe(false);

      passwordForm.password().markAsTouched();

      expect(errorState.hasWarnings()).toBe(true);
      expect(errorState.hasErrors()).toBe(false);
      expect(errorState.shouldShowWarnings()).toBe(true);
    });

    it('shows the warning on touch while an on-submit form context still hides errors', () => {
      const submittedStatus = signal<
        'unsubmitted' | 'submitting' | 'submitted'
      >('unsubmitted');

      TestBed.configureTestingModule({
        providers: [
          {
            provide: NGX_SIGNAL_FORM_CONTEXT,
            useValue: {
              errorStrategy: signal('on-submit'),
              // The context publishes both channels; only the error one is
              // set here, which is exactly the shape that used to hold
              // warnings back until submit.
              warningStrategy: signal(undefined),
              submittedStatus,
              form: {},
            },
          },
        ],
      });

      const passwordForm = buildWarningOnlyForm();
      const errorState = TestBed.runInInjectionContext(() =>
        createErrorState({
          field: passwordForm.password,
          fieldName: 'password',
        }),
      );

      passwordForm.password().markAsTouched();

      // The error channel waits for submit; the warning channel does not.
      expect(errorState.shouldShowErrors()).toBe(false);
      expect(errorState.shouldShowWarnings()).toBe(true);
    });

    it('falls back to defaultWarningStrategy, never to defaultErrorStrategy', () => {
      TestBed.configureTestingModule({
        providers: [
          provideNgxSignalFormsConfig({
            defaultErrorStrategy: 'immediate',
            defaultWarningStrategy: 'on-submit',
          }),
        ],
      });

      const passwordForm = buildWarningOnlyForm();
      const errorState = TestBed.runInInjectionContext(() =>
        createErrorState({
          field: passwordForm.password,
          fieldName: 'password',
        }),
      );

      passwordForm.password().markAsTouched();

      // `'immediate'` governs blocking errors only; warnings wait for submit.
      expect(errorState.hasWarnings()).toBe(true);
      expect(errorState.shouldShowWarnings()).toBe(false);
    });

    it('lets the warningStrategy option override the config default', () => {
      TestBed.configureTestingModule({
        providers: [
          provideNgxSignalFormsConfig({ defaultWarningStrategy: 'on-submit' }),
        ],
      });

      const passwordForm = buildWarningOnlyForm();
      const errorState = TestBed.runInInjectionContext(() =>
        createErrorState({
          field: passwordForm.password,
          fieldName: 'password',
          warningStrategy: 'immediate',
        }),
      );

      expect(errorState.shouldShowWarnings()).toBe(true);
    });

    it('hides the warning while a blocking error on the same field is visible', () => {
      const model = signal({ password: '' });
      const passwordForm = TestBed.runInInjectionContext(() =>
        form(
          model,
          schema((path) => {
            validate(path.password, (ctx) =>
              ctx.value() ? null : { kind: 'required', message: 'Required' },
            );
            validate(path.password, (ctx) =>
              ctx.value().length < 12
                ? { kind: 'warn:weak-password', message: 'Too weak' }
                : null,
            );
          }),
        ),
      );

      const errorState = TestBed.runInInjectionContext(() =>
        createErrorState({
          field: passwordForm.password,
          fieldName: 'password',
        }),
      );

      passwordForm.password().markAsTouched();

      expect(errorState.shouldShowErrors()).toBe(true);
      expect(errorState.hasWarnings()).toBe(true);
      expect(errorState.shouldShowWarnings()).toBe(false);
    });
  });

  // ============================================================================
  // createErrorState — form context inheritance (regression for Bug 2 / #73)
  // ============================================================================

  describe('createErrorState — on-submit strategy inherited from form context', () => {
    // Regression for Bug 2 (issue #73): createErrorState was not calling
    // injectFormContext(), so it always fell back to 'on-touch' even inside an
    // on-submit form. The fix captures formContext at factory call time and
    // passes it to resolveStrategyFromContext / resolveSubmittedStatusFromContext.

    it('hides errors before submission when the form context uses on-submit strategy', () => {
      const submittedStatus = signal<
        'unsubmitted' | 'submitting' | 'submitted'
      >('unsubmitted');

      TestBed.configureTestingModule({
        providers: [
          {
            provide: NGX_SIGNAL_FORM_CONTEXT,
            useValue: {
              errorStrategy: signal('on-submit'),
              submittedStatus,
              form: {},
            },
          },
        ],
      });

      const model = signal({ email: '' });
      const emailForm = TestBed.runInInjectionContext(() =>
        form(
          model,
          schema((path) => {
            validate(path.email, (ctx) =>
              ctx.value() ? null : { kind: 'required', message: 'Required' },
            );
          }),
        ),
      );

      const errorState = TestBed.runInInjectionContext(() =>
        createErrorState({
          field: emailForm.email,
          fieldName: 'email',
        }),
      );

      // on-submit strategy: field is invalid and touched, but errors are hidden
      // until the form has been submitted.
      emailForm.email().markAsTouched();
      expect(errorState.hasErrors()).toBe(true);
      expect(errorState.shouldShowErrors()).toBe(false);

      // After submission the errors become visible.
      submittedStatus.set('submitted');
      expect(errorState.shouldShowErrors()).toBe(true);
    });

    it('falls back to on-touch when no form context is present', () => {
      // Callers outside a form boundary (tests, standalone) must still work.
      const model = signal({ email: '' });
      const emailForm = TestBed.runInInjectionContext(() =>
        form(
          model,
          schema((path) => {
            validate(path.email, (ctx) =>
              ctx.value() ? null : { kind: 'required', message: 'Required' },
            );
          }),
        ),
      );

      const errorState = TestBed.runInInjectionContext(() =>
        createErrorState({
          field: emailForm.email,
          fieldName: 'email',
        }),
      );

      // Before touch: hidden.
      expect(errorState.shouldShowErrors()).toBe(false);

      // After touch: visible (on-touch fallback).
      emailForm.email().markAsTouched();
      expect(errorState.hasErrors()).toBe(true);
      expect(errorState.shouldShowErrors()).toBe(true);
    });
  });

  // ============================================================================
  // createErrorState — global config default cascade (symmetry with
  // NgxHeadlessFieldset.resolvedStrategy)
  // ============================================================================

  describe('createErrorState — honors NGX_SIGNAL_FORMS_CONFIG.defaultErrorStrategy', () => {
    it('uses the global config default when no strategy input or form context is present', () => {
      TestBed.configureTestingModule({
        providers: [
          provideNgxSignalFormsConfig({ defaultErrorStrategy: 'immediate' }),
        ],
      });

      const model = signal({ email: '' });
      const emailForm = TestBed.runInInjectionContext(() =>
        form(
          model,
          schema((path) => {
            validate(path.email, (ctx) =>
              ctx.value() ? null : { kind: 'required', message: 'Required' },
            );
          }),
        ),
      );

      const errorState = TestBed.runInInjectionContext(() =>
        createErrorState({
          field: emailForm.email,
          fieldName: 'email',
        }),
      );

      // 'immediate' from the global config: errors show without touch.
      expect(errorState.hasErrors()).toBe(true);
      expect(errorState.shouldShowErrors()).toBe(true);
    });
  });

  // ============================================================================
  // createErrorState — injector option (parity with createErrorVisibility /
  // createErrorMessageSignal)
  // ============================================================================

  describe('createErrorState — injector option', () => {
    it('accepts an explicit injector without requiring an ambient injection context', () => {
      const model = signal({ email: '' });
      const emailForm = TestBed.runInInjectionContext(() =>
        form(
          model,
          schema((path) => {
            validate(path.email, (ctx) =>
              ctx.value() ? null : { kind: 'required', message: 'Required' },
            );
          }),
        ),
      );

      const injector = TestBed.inject(Injector);

      // Called directly, with no runInInjectionContext wrapper — would throw
      // NG0203 without the injector option.
      const errorState = createErrorState({
        field: emailForm.email,
        fieldName: 'email',
        injector,
      });

      emailForm.email().markAsTouched();
      expect(errorState.hasErrors()).toBe(true);
      expect(errorState.shouldShowErrors()).toBe(true);
    });
  });
});
