import { ComponentRef, type WritableSignal, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { form, required, schema, validate } from '@angular/forms/signals';
import { NGX_SIGNAL_FORM_CONTEXT } from '@ngx-signal-forms/toolkit';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SignalFormDebuggerComponent } from './signal-form-debugger.component';

describe('SignalFormDebuggerComponent', () => {
  interface TestData {
    name: string;
    email: string;
  }

  let fixture: ComponentFixture<SignalFormDebuggerComponent>;
  let component: SignalFormDebuggerComponent;
  let componentRef: ComponentRef<SignalFormDebuggerComponent>;
  let debuggerEl: HTMLElement;

  const model = signal({ name: '', email: '' });
  let testForm: ReturnType<typeof form<TestData>>;
  let submittedStatus: WritableSignal<
    'unsubmitted' | 'submitting' | 'submitted'
  >;

  beforeEach(async () => {
    // Reset model for each test
    model.set({ name: '', email: '' });
    submittedStatus = signal<'unsubmitted' | 'submitting' | 'submitted'>(
      'unsubmitted',
    );

    await TestBed.configureTestingModule({
      imports: [SignalFormDebuggerComponent],
      providers: [
        {
          provide: NGX_SIGNAL_FORM_CONTEXT,
          useValue: { submittedStatus },
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

    fixture = TestBed.createComponent(SignalFormDebuggerComponent);
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

  describe('Warnings display', () => {
    interface WarnData {
      password: string;
    }

    let warnModel: WritableSignal<WarnData>;
    let warnForm: ReturnType<typeof form<WarnData>>;
    let warnFixture: ComponentFixture<SignalFormDebuggerComponent>;
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

      warnFixture = TestBed.createComponent(SignalFormDebuggerComponent);
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
      const localFixture = TestBed.createComponent(SignalFormDebuggerComponent);
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
  });
});
