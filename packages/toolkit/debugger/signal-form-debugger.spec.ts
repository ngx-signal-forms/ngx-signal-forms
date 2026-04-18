import { ComponentRef, type WritableSignal, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  applyEach,
  form,
  minLength,
  required,
  schema,
  validate,
} from '@angular/forms/signals';
import {
  NGX_SIGNAL_FORM_CONTEXT,
  type ResolvedErrorDisplayStrategy,
} from '@ngx-signal-forms/toolkit';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SignalFormDebugger } from './signal-form-debugger';

describe('SignalFormDebugger', () => {
  interface TestData {
    name: string;
    email: string;
  }

  let fixture: ComponentFixture<SignalFormDebugger>;
  let component: SignalFormDebugger;
  let componentRef: ComponentRef<SignalFormDebugger>;
  let debuggerEl: HTMLElement;

  const model = signal({ name: '', email: '' });
  let testForm: ReturnType<typeof form<TestData>>;
  let submittedStatus: WritableSignal<
    'unsubmitted' | 'submitting' | 'submitted'
  >;
  let contextErrorStrategy: WritableSignal<ResolvedErrorDisplayStrategy>;

  beforeEach(async () => {
    // Reset model for each test
    model.set({ name: '', email: '' });
    submittedStatus = signal<'unsubmitted' | 'submitting' | 'submitted'>(
      'unsubmitted',
    );
    contextErrorStrategy = signal<ResolvedErrorDisplayStrategy>('on-touch');

    await TestBed.configureTestingModule({
      imports: [SignalFormDebugger],
      providers: [
        {
          provide: NGX_SIGNAL_FORM_CONTEXT,
          useValue: {
            submittedStatus,
            errorStrategy: contextErrorStrategy,
          },
        },
      ],
    }).compileComponents();

    testForm = TestBed.runInInjectionContext(() =>
      form(
        model,
        schema<TestData>((path) => {
          required(path.name, { message: 'Name is required' });
          required(path.email, { message: 'Email is required' });
        }),
      ),
    );

    fixture = TestBed.createComponent(SignalFormDebugger);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
    debuggerEl = fixture.nativeElement;

    // Set required inputs
    componentRef.setInput('formTree', testForm);
    componentRef.setInput('title', 'Test Debugger');

    // Default strategy
    componentRef.setInput('errorStrategy', 'on-touch');

    fixture.detectChanges();
  });

  describe('Initialization', () => {
    it('should create and render with default title', () => {
      expect(component).toBeTruthy();
      const headerTitle = debuggerEl.querySelector('.ngx-debugger__title');
      expect(headerTitle?.textContent).toContain('Test Debugger');
    });

    it('should display initial form state', () => {
      const topBadge = debuggerEl.querySelector(
        '.ngx-debugger__header ngx-signal-form-debugger-badge',
      );
      expect(topBadge?.textContent).toContain('Invalid');

      const statusBadges = Array.from(
        debuggerEl.querySelectorAll(
          '.ngx-debugger__status-badges ngx-signal-form-debugger-badge',
        ),
      );
      // Valid, Invalid, Dirty, Pending
      expect(statusBadges[1].getAttribute('data-appearance')).toBe('danger'); // Invalid
      expect(statusBadges[2].getAttribute('data-appearance')).toBe('neutral'); // Not Dirty
    });
  });

  describe('Form State Updates', () => {
    it('should update to Valid when form uses valid data', () => {
      model.set({ name: 'John', email: 'john@example.com' });
      fixture.detectChanges();

      const topBadge = debuggerEl.querySelector(
        '.ngx-debugger__header ngx-signal-form-debugger-badge',
      );
      expect(topBadge?.textContent).toContain('Valid');

      const statusBadges = Array.from(
        debuggerEl.querySelectorAll(
          '.ngx-debugger__status-badges ngx-signal-form-debugger-badge',
        ),
      );
      expect(statusBadges[0].getAttribute('data-appearance')).toBe('success'); // Valid
    });
  });

  describe('Error Display Strategies', () => {
    it('should handle "immediate" strategy - show errors instantly', () => {
      componentRef.setInput('errorStrategy', 'immediate');
      fixture.detectChanges();

      const errorList = debuggerEl.querySelector('.ngx-debugger__error-list');
      expect(errorList).toBeTruthy();
      expect(errorList?.textContent).toContain('Name is required');

      const item = errorList?.querySelector('.ngx-debugger__error-item');
      expect(
        item?.classList.contains('ngx-debugger__error-item--visible'),
      ).toBe(true);
    });

    it('should handle "on-touch" strategy - hide errors initially', () => {
      componentRef.setInput('errorStrategy', 'on-touch');
      fixture.detectChanges();

      const errorList = debuggerEl.querySelector('.ngx-debugger__error-list');
      // Even if hidden, the component renders them with a hidden class or visually hidden
      const item = errorList?.querySelector('.ngx-debugger__error-item');
      expect(item?.classList.contains('ngx-debugger__error-item--hidden')).toBe(
        true,
      );
      expect(item?.textContent).toContain('Hidden by strategy');
    });
  });

  describe('Data Display', () => {
    it('should display JSON model', () => {
      model.set({ name: 'Alice', email: 'alice@test.com' });
      fixture.detectChanges();

      const jsonCode = debuggerEl.querySelector(
        '.ngx-debugger__json-display pre code',
      );
      expect(jsonCode?.textContent).toContain('"Alice"');
      expect(jsonCode?.textContent).toContain('"alice@test.com"');
    });
  });

  describe('Submitted status badge', () => {
    const readSubmittedStatusBadge = (): Element | null =>
      debuggerEl.querySelectorAll(
        '.ngx-debugger__status-badges ngx-signal-form-debugger-badge',
      )[4] ?? null;

    it('should render "Status: Idle" while unsubmitted', () => {
      const badge = readSubmittedStatusBadge();
      expect(badge?.textContent).toContain('Idle');
      expect(badge?.getAttribute('data-appearance')).toBe('neutral');
    });

    it('should render "Status: Submitting" while submitting', () => {
      submittedStatus.set('submitting');
      fixture.detectChanges();
      const badge = readSubmittedStatusBadge();
      expect(badge?.textContent).toContain('Submitting');
      expect(badge?.getAttribute('data-appearance')).toBe('info');
    });

    it('should render "Status: Submitted" once submitted', () => {
      submittedStatus.set('submitted');
      fixture.detectChanges();
      const badge = readSubmittedStatusBadge();
      expect(badge?.textContent).toContain('Submitted');
      expect(badge?.getAttribute('data-appearance')).toBe('success');
    });
  });

  describe('Error visibility strategy reason', () => {
    const readReason = (): string =>
      debuggerEl
        .querySelector('.ngx-debugger__strategy-reason')
        ?.textContent?.trim() ?? '';

    it('should explain the immediate strategy', () => {
      componentRef.setInput('errorStrategy', 'immediate');
      fixture.detectChanges();
      expect(readReason()).toContain('shown immediately');
    });

    it('should explain on-touch while nothing is touched or submitted', () => {
      componentRef.setInput('errorStrategy', 'on-touch');
      fixture.detectChanges();
      expect(readReason()).toContain('hidden until you touch');
    });

    it('should explain on-submit while unsubmitted', () => {
      componentRef.setInput('errorStrategy', 'on-submit');
      fixture.detectChanges();
      expect(readReason()).toContain('hidden until form submission');
    });

    it('should flip the on-submit reason once the form is submitted', () => {
      componentRef.setInput('errorStrategy', 'on-submit');
      submittedStatus.set('submitted');
      fixture.detectChanges();
      expect(readReason()).toContain('because form was submitted');
    });
  });

  describe('Strategy inheritance from form context', () => {
    it('should inherit the strategy from the form context when the input is not set', () => {
      const localFixture = TestBed.createComponent(SignalFormDebugger);
      const localEl: HTMLElement = localFixture.nativeElement;
      localFixture.componentRef.setInput('formTree', testForm);
      // Intentionally do NOT set `errorStrategy` — context provides 'on-touch'
      // above, so behaviour should match the default on-touch test.
      localFixture.detectChanges();

      const reason = localEl
        .querySelector('.ngx-debugger__strategy-reason')
        ?.textContent?.trim();
      expect(reason).toContain('hidden until you touch');
    });

    it('should react to context strategy changes when the input is not set', () => {
      const localFixture = TestBed.createComponent(SignalFormDebugger);
      const localEl: HTMLElement = localFixture.nativeElement;
      localFixture.componentRef.setInput('formTree', testForm);
      localFixture.detectChanges();

      contextErrorStrategy.set('on-submit');
      localFixture.detectChanges();

      const reason = localEl
        .querySelector('.ngx-debugger__strategy-reason')
        ?.textContent?.trim();
      expect(reason).toContain('hidden until form submission');
    });

    it('should let an explicit input override the context strategy', () => {
      const localFixture = TestBed.createComponent(SignalFormDebugger);
      const localEl: HTMLElement = localFixture.nativeElement;
      localFixture.componentRef.setInput('formTree', testForm);
      localFixture.componentRef.setInput('errorStrategy', 'immediate');
      contextErrorStrategy.set('on-submit');
      localFixture.detectChanges();

      const reason = localEl
        .querySelector('.ngx-debugger__strategy-reason')
        ?.textContent?.trim();
      expect(reason).toContain('shown immediately');
    });
  });

  describe('Warnings display', () => {
    interface WarnData {
      password: string;
    }

    let warnModel: WritableSignal<WarnData>;
    let warnForm: ReturnType<typeof form<WarnData>>;
    let warnFixture: ComponentFixture<SignalFormDebugger>;
    let warnEl: HTMLElement;

    beforeEach(() => {
      warnModel = signal({ password: 'weak' });

      warnForm = TestBed.runInInjectionContext(() =>
        form(
          warnModel,
          schema<WarnData>((path) => {
            validate(path.password, (ctx) => {
              const value = ctx.value();
              if (typeof value === 'string' && value.length < 8) {
                return {
                  kind: 'warn:weak-password',
                  message: 'Password is weak',
                };
              }
              return null;
            });
          }),
        ),
      );

      warnFixture = TestBed.createComponent(SignalFormDebugger);
      warnEl = warnFixture.nativeElement;
      warnFixture.componentRef.setInput('formTree', warnForm);
      warnFixture.componentRef.setInput('errorStrategy', 'immediate');
      warnFixture.detectChanges();
    });

    it('should surface field-level warnings under the warnings section', () => {
      const warningItems = warnEl.querySelectorAll(
        '.ngx-debugger__error-item--warning',
      );
      expect(warningItems.length).toBeGreaterThanOrEqual(1);
      expect(warningItems[0].textContent).toContain('Password is weak');
    });

    it('should show a warnings-count badge when warnings exist', () => {
      const warningBadge = warnEl.querySelector(
        'ngx-signal-form-debugger-badge[data-appearance="warning"]',
      );
      expect(warningBadge?.textContent).toMatch(/\d+\/\d+/);
    });
  });

  describe('Dev-mode diagnostics', () => {
    let warnSpy: ReturnType<typeof vi.spyOn>;

    const debuggerWarnings = (): readonly string[] => {
      const messages: string[] = [];
      for (const call of warnSpy.mock.calls) {
        const first: unknown = call[0];
        if (
          typeof first === 'string' &&
          first.includes('[NgxSignalFormDebugger]')
        ) {
          messages.push(first);
        }
      }
      return messages;
    };

    beforeEach(() => {
      warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      warnSpy.mockRestore();
    });

    it('should warn once when a FieldState is passed instead of a FieldTree', () => {
      const localFixture = TestBed.createComponent(SignalFormDebugger);
      // Passing the resolved FieldState (testForm() call result) instead of
      // the FieldTree function is the misuse the dev warning exists for —
      // the debugger can still show root-level state but cannot traverse
      // children.
      localFixture.componentRef.setInput('formTree', testForm());
      localFixture.detectChanges();

      const warnings = debuggerWarnings();
      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toContain('Pass the FieldTree function');
    });

    it('should NOT warn when a FieldTree function is passed', () => {
      // The top-level beforeEach already created the debugger with `testForm`
      // (the FieldTree function), so the warning effect should never have
      // fired for the currently-mounted component.
      expect(debuggerWarnings()).toHaveLength(0);
    });

    it('should re-warn after the formTree input is swapped to a new state', () => {
      const localFixture = TestBed.createComponent(SignalFormDebugger);
      const first = testForm();
      localFixture.componentRef.setInput('formTree', first);
      localFixture.detectChanges();
      expect(debuggerWarnings()).toHaveLength(1);

      // Same reference: the WeakSet must suppress an additional warning.
      localFixture.componentRef.setInput('formTree', first);
      localFixture.detectChanges();
      expect(debuggerWarnings()).toHaveLength(1);

      // Build a genuinely separate form, then swap to its FieldState to
      // exercise the re-warn path. The WeakSet is keyed on identity, so a
      // new reference must produce a fresh warning.
      const secondForm = TestBed.runInInjectionContext(() =>
        form(
          signal({ name: '', email: '' }),
          schema<TestData>((path) => {
            required(path.name, { message: 'Name is required' });
            required(path.email, { message: 'Email is required' });
          }),
        ),
      );
      localFixture.componentRef.setInput('formTree', secondForm());
      localFixture.detectChanges();
      expect(debuggerWarnings().length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Errors on object/array nodes (non-leaf)', () => {
    interface UsersData {
      users: Array<{ name: string }>;
    }

    it('collects errors from a validator attached to an array element (object node)', () => {
      const usersModel = signal({ users: [{ name: '' }] });
      const usersForm = TestBed.runInInjectionContext(() =>
        form(
          usersModel,
          schema<UsersData>((path) => {
            // Validate each user element directly. The validator is attached
            // to the object node at `users[<n>]` — a *non-leaf* node. The
            // old `isLeaf` guard dropped these entirely; the fix ensures they
            // surface in the debugger.
            applyEach(path.users, (userPath) => {
              validate(userPath, (ctx) => {
                const value = ctx.value();
                if (!value?.name) {
                  return {
                    kind: 'first-user-missing-name',
                    message: 'First user must have a name',
                  };
                }
                return null;
              });
            });
          }),
        ),
      );

      const localFixture = TestBed.createComponent(SignalFormDebugger);
      const localEl: HTMLElement = localFixture.nativeElement;
      localFixture.componentRef.setInput('formTree', usersForm);
      localFixture.componentRef.setInput('errorStrategy', 'immediate');
      localFixture.detectChanges();

      // The error may surface under the root-level or field-level group
      // depending on whether Angular also bubbles it to the root state.
      // Either way it MUST appear somewhere in the rendered debugger and
      // MUST NOT be silently dropped like the pre-fix `isLeaf` guard did.
      const fullText = localEl.textContent ?? '';
      expect(fullText).toContain('first-user-missing-name');
      expect(fullText).toContain('First user must have a name');
    });

    it('collects errors from a validator attached to the array itself', () => {
      const usersModel = signal<UsersData>({ users: [] });
      const usersForm = TestBed.runInInjectionContext(() =>
        form(
          usersModel,
          schema<UsersData>((path) => {
            minLength(path.users, 1, {
              message: 'At least one user is required',
            });
          }),
        ),
      );

      const localFixture = TestBed.createComponent(SignalFormDebugger);
      const localEl: HTMLElement = localFixture.nativeElement;
      localFixture.componentRef.setInput('formTree', usersForm);
      localFixture.componentRef.setInput('errorStrategy', 'immediate');
      localFixture.detectChanges();

      const errorList = localEl.querySelector('.ngx-debugger__error-list');
      expect(errorList?.textContent).toContain('At least one user is required');
    });
  });

  describe('Production render gate', () => {
    it('renders no debugger DOM when renderEnabled is false', () => {
      const localFixture = TestBed.createComponent(SignalFormDebugger);
      const localEl: HTMLElement = localFixture.nativeElement;
      localFixture.componentRef.setInput('formTree', testForm);

      // Simulate a production bundle: flip the render gate off. This mirrors
      // the behaviour of `isDevMode() === false` — the template wraps every
      // branch in `@if (renderEnabled && inputUsable())`.
      //
      // Note: the ideal approach here would be `vi.spyOn(ngCore, 'isDevMode')`,
      // but `@angular/core`'s ESM namespace is non-configurable
      // (`TypeError: Cannot redefine property: isDevMode`). A hoisted
      // `vi.mock('@angular/core', ...)` would leak into every other test in
      // this file — including the component's own `#fieldTreeWarningEffect`
      // initializer — so we opt for the minimal, explicit intrusion here.
      (
        localFixture.componentInstance as unknown as {
          renderEnabled: boolean;
        }
      ).renderEnabled = false;
      localFixture.detectChanges();

      expect(localEl.querySelector('.ngx-debugger')).toBeNull();
    });
  });

  describe('Malformed formTree inputs', () => {
    it('treats a non-state-like function as unusable and renders nothing', () => {
      const localFixture = TestBed.createComponent(SignalFormDebugger);
      const localEl: HTMLElement = localFixture.nativeElement;
      // A plain `() => 42` is callable but does NOT return a FieldState-shaped
      // object, so it must be rejected by the runtime guard.
      const malformed = (() => 42) as unknown as ReturnType<
        typeof form<TestData>
      >;
      localFixture.componentRef.setInput('formTree', malformed);
      localFixture.detectChanges();

      expect(localEl.querySelector('.ngx-debugger')).toBeNull();
    });
  });
});
