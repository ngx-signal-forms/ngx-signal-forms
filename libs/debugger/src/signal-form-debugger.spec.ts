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
import { NgxSignalFormDebugger } from './signal-form-debugger';

describe('NgxSignalFormDebugger', () => {
  interface TestData {
    name: string;
    email: string;
  }

  let fixture: ComponentFixture<NgxSignalFormDebugger>;
  let component: NgxSignalFormDebugger;
  let componentRef: ComponentRef<NgxSignalFormDebugger>;
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
      imports: [NgxSignalFormDebugger],
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

    fixture = TestBed.createComponent(NgxSignalFormDebugger);
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
      const localFixture = TestBed.createComponent(NgxSignalFormDebugger);
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
      const localFixture = TestBed.createComponent(NgxSignalFormDebugger);
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
      const localFixture = TestBed.createComponent(NgxSignalFormDebugger);
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
    let warnFixture: ComponentFixture<NgxSignalFormDebugger>;
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

      warnFixture = TestBed.createComponent(NgxSignalFormDebugger);
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

    it('should report Valid (not Invalid) for forms with only warn:* errors', () => {
      // Angular's native `invalid()` is `true` for ANY error, including
      // warn-only ones. The debugger must derive Valid/Invalid from
      // blocking-error counts instead, so a form whose sole error is
      // `warn:weak-password` reads as Valid throughout the panel.
      const topBadge = warnEl.querySelector(
        '.ngx-debugger__header ngx-signal-form-debugger-badge',
      );
      expect(topBadge?.textContent).toContain('Valid');
      expect(topBadge?.textContent).not.toContain('Invalid');

      const statusBadges = Array.from(
        warnEl.querySelectorAll(
          '.ngx-debugger__status-badges ngx-signal-form-debugger-badge',
        ),
      );
      // Valid, Invalid, Dirty, Pending, Status
      expect(statusBadges[0].getAttribute('data-appearance')).toBe('success'); // Valid
      expect(statusBadges[1].getAttribute('data-appearance')).toBe('neutral'); // Invalid inactive

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
      const localFixture = TestBed.createComponent(NgxSignalFormDebugger);
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
      const localFixture = TestBed.createComponent(NgxSignalFormDebugger);
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

      const localFixture = TestBed.createComponent(NgxSignalFormDebugger);
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

      const localFixture = TestBed.createComponent(NgxSignalFormDebugger);
      const localEl: HTMLElement = localFixture.nativeElement;
      localFixture.componentRef.setInput('formTree', usersForm);
      localFixture.componentRef.setInput('errorStrategy', 'immediate');
      localFixture.detectChanges();

      const errorList = localEl.querySelector('.ngx-debugger__error-list');
      expect(errorList?.textContent).toContain('At least one user is required');
    });
  });

  describe('Production availability', () => {
    it('renders when formTree is usable', () => {
      const localFixture = TestBed.createComponent(NgxSignalFormDebugger);
      const localEl: HTMLElement = localFixture.nativeElement;
      localFixture.componentRef.setInput('formTree', testForm);
      localFixture.detectChanges();

      expect(localEl.querySelector('.ngx-debugger')).not.toBeNull();
    });
  });

  describe('Malformed formTree inputs', () => {
    it('treats a non-state-like function as unusable and renders nothing', () => {
      const localFixture = TestBed.createComponent(NgxSignalFormDebugger);
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

    it('treats a partially-conforming FieldState stub as unusable and renders nothing', () => {
      const localFixture = TestBed.createComponent(NgxSignalFormDebugger);
      const localEl: HTMLElement = localFixture.nativeElement;

      // Satisfies the OLD (narrower) guard — fieldTree/value/touched/
      // invalid/errors are all functions — but is missing valid/dirty/
      // pending, which the component calls unconditionally during change
      // detection. Before the fix this stub passed `isFieldStateLike` and
      // then threw a TypeError the first time `dirty()` or `pending()` was
      // invoked. The guard must now reject it up front, the same way it
      // rejects a fully-malformed input.
      const partialStub: Record<string, unknown> = {
        value: () => ({ name: '', email: '' }),
        touched: () => false,
        invalid: () => false,
        errors: () => [],
      };
      partialStub['fieldTree'] = () => partialStub;
      const malformed = partialStub as unknown as ReturnType<
        typeof form<TestData>
      >;

      localFixture.componentRef.setInput('formTree', malformed);

      expect(() => {
        localFixture.detectChanges();
      }).not.toThrow();
      expect(localEl.querySelector('.ngx-debugger')).toBeNull();
    });

    it('treats a partially-stubbed FieldTree as unusable and renders nothing', () => {
      const localFixture = TestBed.createComponent(NgxSignalFormDebugger);
      const localEl: HTMLElement = localFixture.nativeElement;

      // Satisfies the toolkit's `isFieldTree` contract (a callable whose
      // state exposes value/touched/errors/errorSummary/submitting/
      // markAsTouched with a matching `fieldTree` back-reference) but is
      // missing valid/invalid/dirty/pending, which the debugger calls
      // unconditionally on the resolved root state. The component's
      // supplementary root-state check must reject it gracefully instead
      // of throwing a TypeError during change detection.
      const partialState: Record<string, unknown> = {
        value: () => ({ name: '', email: '' }),
        touched: () => false,
        errors: () => [],
        errorSummary: () => [],
        submitting: () => false,
        markAsTouched: () => undefined,
      };
      const partialTree = (): Record<string, unknown> => partialState;
      partialState['fieldTree'] = partialTree;
      const malformed = partialTree as unknown as ReturnType<
        typeof form<TestData>
      >;

      localFixture.componentRef.setInput('formTree', malformed);

      expect(() => {
        localFixture.detectChanges();
      }).not.toThrow();
      expect(localEl.querySelector('.ngx-debugger')).toBeNull();
    });
  });

  describe('FieldState input with descendant-only blocking errors', () => {
    interface NestedData {
      user: { name: string };
    }

    let warnSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      // Passing a FieldState (instead of the FieldTree function) triggers
      // the expected dev-mode traversal warning; silence it so this spec's
      // output stays focused on the validity assertion.
      warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      warnSpy.mockRestore();
    });

    it('reports Invalid when the only blocking error sits on a child field', () => {
      const nestedModel = signal<NestedData>({ user: { name: '' } });
      const nestedForm = TestBed.runInInjectionContext(() =>
        form(
          nestedModel,
          schema<NestedData>((path) => {
            required(path.user.name, { message: 'Name is required' });
          }),
        ),
      );

      const localFixture = TestBed.createComponent(NgxSignalFormDebugger);
      const localEl: HTMLElement = localFixture.nativeElement;
      // Pass the resolved FieldState — its own `errors()` is empty (the
      // required error lives on `user.name`), so a validity check based on
      // root `errors()` would misreport Valid. `errorSummary()` aggregates
      // descendant errors and must drive the Invalid verdict.
      localFixture.componentRef.setInput('formTree', nestedForm());
      localFixture.componentRef.setInput('errorStrategy', 'immediate');
      localFixture.detectChanges();

      const topBadge = localEl.querySelector(
        '.ngx-debugger__header ngx-signal-form-debugger-badge',
      );
      expect(topBadge?.textContent).toContain('Invalid');

      const statusBadges = Array.from(
        localEl.querySelectorAll(
          '.ngx-debugger__status-badges ngx-signal-form-debugger-badge',
        ),
      );
      // Valid, Invalid, Dirty, Pending, Status
      expect(statusBadges[0].getAttribute('data-appearance')).toBe('neutral'); // Valid inactive
      expect(statusBadges[1].getAttribute('data-appearance')).toBe('danger'); // Invalid
    });
  });
});
