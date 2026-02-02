import { ComponentRef, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { form, required, schema } from '@angular/forms/signals';
import { NGX_SIGNAL_FORM_CONTEXT } from '@ngx-signal-forms/toolkit/core';
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

  const model = signal<TestData>({ name: '', email: '' });
  let testForm: ReturnType<typeof form<TestData>>;

  beforeEach(async () => {
    // Reset model for each test
    model.set({ name: '', email: '' });

    await TestBed.configureTestingModule({
      imports: [SignalFormDebuggerComponent],
      providers: [
        {
          provide: NGX_SIGNAL_FORM_CONTEXT,
          useValue: {
            submittedStatus: signal('unsubmitted'),
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
        '.ngx-debugger__header ngx-debugger-badge',
      );
      expect(topBadge?.textContent).toContain('Invalid');

      const statusBadges = Array.from(
        debuggerEl.querySelectorAll(
          '.ngx-debugger__status-badges ngx-debugger-badge',
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
        '.ngx-debugger__header ngx-debugger-badge',
      );
      expect(topBadge?.textContent).toContain('Valid');

      const statusBadges = Array.from(
        debuggerEl.querySelectorAll(
          '.ngx-debugger__status-badges ngx-debugger-badge',
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
});
