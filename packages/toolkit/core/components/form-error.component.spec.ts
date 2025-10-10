import { describe, it, expect } from 'vitest';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NgxSignalFormErrorComponent } from './form-error.component';

/**
 * Helper to create mock field state for testing
 */
const createMockFieldState = (
  invalid = false,
  touched = false,
  errors: Array<{ kind: string; message: string }> = [],
) => {
  return signal({
    invalid: () => invalid,
    touched: () => touched,
    errors: () => errors,
  });
};

describe('NgxSignalFormErrorComponent', () => {
  describe('error rendering', () => {
    it('should render errors when field is invalid and touched (on-touch strategy)', () => {
      const fieldState = createMockFieldState(true, true, [
        { kind: 'required', message: 'This field is required' },
      ]);
      const hasSubmitted = signal(false);

      @Component({
        template: `
          <ngx-signal-form-error
            [field]="fieldState"
            [fieldName]="'email'"
            [strategy]="'on-touch'"
            [hasSubmitted]="hasSubmitted"
          />
        `,
        imports: [NgxSignalFormErrorComponent],
      })
      class TestComponent {
        fieldState = fieldState;
        hasSubmitted = hasSubmitted;
      }

      const fixture = TestBed.createComponent(TestComponent);
      fixture.detectChanges();

      const alert = fixture.nativeElement.querySelector('[role="alert"]');
      expect(alert).toBeTruthy();
      expect(alert?.textContent).toContain('This field is required');
    });

    it('should not render errors when field is valid', () => {
      const fieldState = createMockFieldState(false, true, []);
      const hasSubmitted = signal(false);

      @Component({
        template: `
          <ngx-signal-form-error
            [field]="fieldState"
            [fieldName]="'email'"
            [strategy]="'on-touch'"
            [hasSubmitted]="hasSubmitted"
          />
        `,
        imports: [NgxSignalFormErrorComponent],
      })
      class TestComponent {
        fieldState = fieldState;
        hasSubmitted = hasSubmitted;
      }

      const fixture = TestBed.createComponent(TestComponent);
      fixture.detectChanges();

      const alert = fixture.nativeElement.querySelector('[role="alert"]');
      expect(alert).toBeFalsy();
    });

    it('should not render errors when field is invalid but not touched (on-touch strategy)', () => {
      const fieldState = createMockFieldState(true, false, [
        { kind: 'required', message: 'This field is required' },
      ]);
      const hasSubmitted = signal(false);

      @Component({
        template: `
          <ngx-signal-form-error
            [field]="fieldState"
            [fieldName]="'email'"
            [strategy]="'on-touch'"
            [hasSubmitted]="hasSubmitted"
          />
        `,
        imports: [NgxSignalFormErrorComponent],
      })
      class TestComponent {
        fieldState = fieldState;
        hasSubmitted = hasSubmitted;
      }

      const fixture = TestBed.createComponent(TestComponent);
      fixture.detectChanges();

      const alert = fixture.nativeElement.querySelector('[role="alert"]');
      expect(alert).toBeFalsy();
    });

    it('should render multiple errors', () => {
      const fieldState = createMockFieldState(true, true, [
        { kind: 'required', message: 'This field is required' },
        { kind: 'email', message: 'Must be a valid email' },
      ]);
      const hasSubmitted = signal(false);

      @Component({
        template: `
          <ngx-signal-form-error
            [field]="fieldState"
            [fieldName]="'email'"
            [strategy]="'on-touch'"
            [hasSubmitted]="hasSubmitted"
          />
        `,
        imports: [NgxSignalFormErrorComponent],
      })
      class TestComponent {
        fieldState = fieldState;
        hasSubmitted = hasSubmitted;
      }

      const fixture = TestBed.createComponent(TestComponent);
      fixture.detectChanges();

      const messages = fixture.nativeElement.querySelectorAll(
        '.ngx-signal-form-error__message',
      );
      expect(messages.length).toBe(2);
      expect(messages[0]?.textContent?.trim()).toBe('This field is required');
      expect(messages[1]?.textContent?.trim()).toBe('Must be a valid email');
    });
  });

  describe('strategy switching', () => {
    it('should show errors immediately with immediate strategy', () => {
      const fieldState = createMockFieldState(true, false, [
        { kind: 'required', message: 'This field is required' },
      ]);
      const hasSubmitted = signal(false);

      @Component({
        template: `
          <ngx-signal-form-error
            [field]="fieldState"
            [fieldName]="'email'"
            [strategy]="'immediate'"
            [hasSubmitted]="hasSubmitted"
          />
        `,
        imports: [NgxSignalFormErrorComponent],
      })
      class TestComponent {
        fieldState = fieldState;
        hasSubmitted = hasSubmitted;
      }

      const fixture = TestBed.createComponent(TestComponent);
      fixture.detectChanges();

      const alert = fixture.nativeElement.querySelector('[role="alert"]');
      expect(alert).toBeTruthy();
      expect(alert?.textContent).toContain('This field is required');
    });

    it('should only show errors after submit with on-submit strategy', () => {
      const fieldState = createMockFieldState(true, true, [
        { kind: 'required', message: 'This field is required' },
      ]);
      const hasSubmitted = signal(false);

      @Component({
        template: `
          <ngx-signal-form-error
            [field]="fieldState"
            [fieldName]="'email'"
            [strategy]="'on-submit'"
            [hasSubmitted]="hasSubmitted"
          />
        `,
        imports: [NgxSignalFormErrorComponent],
      })
      class TestComponent {
        fieldState = fieldState;
        hasSubmitted = hasSubmitted;
      }

      const fixture = TestBed.createComponent(TestComponent);
      fixture.detectChanges();

      let alert = fixture.nativeElement.querySelector('[role="alert"]');
      expect(alert).toBeFalsy();

      // After submission
      hasSubmitted.set(true);
      fixture.detectChanges();

      alert = fixture.nativeElement.querySelector('[role="alert"]');
      expect(alert).toBeTruthy();
    });

    it('should never show errors with manual strategy', () => {
      const fieldState = createMockFieldState(true, true, [
        { kind: 'required', message: 'This field is required' },
      ]);
      const hasSubmitted = signal(true);

      @Component({
        template: `
          <ngx-signal-form-error
            [field]="fieldState"
            [fieldName]="'email'"
            [strategy]="'manual'"
            [hasSubmitted]="hasSubmitted"
          />
        `,
        imports: [NgxSignalFormErrorComponent],
      })
      class TestComponent {
        fieldState = fieldState;
        hasSubmitted = hasSubmitted;
      }

      const fixture = TestBed.createComponent(TestComponent);
      fixture.detectChanges();

      const alert = fixture.nativeElement.querySelector('[role="alert"]');
      expect(alert).toBeFalsy();
    });

    it('should show errors after submit even if not touched (on-touch strategy)', () => {
      const fieldState = createMockFieldState(true, false, [
        { kind: 'required', message: 'This field is required' },
      ]);
      const hasSubmitted = signal(true);

      @Component({
        template: `
          <ngx-signal-form-error
            [field]="fieldState"
            [fieldName]="'email'"
            [strategy]="'on-touch'"
            [hasSubmitted]="hasSubmitted"
          />
        `,
        imports: [NgxSignalFormErrorComponent],
      })
      class TestComponent {
        fieldState = fieldState;
        hasSubmitted = hasSubmitted;
      }

      const fixture = TestBed.createComponent(TestComponent);
      fixture.detectChanges();

      const alert = fixture.nativeElement.querySelector('[role="alert"]');
      expect(alert).toBeTruthy();
    });
  });

  describe('WCAG compliance', () => {
    it('should have role="alert" for screen reader announcements', () => {
      const fieldState = createMockFieldState(true, true, [
        { kind: 'required', message: 'This field is required' },
      ]);
      const hasSubmitted = signal(false);

      @Component({
        template: `
          <ngx-signal-form-error
            [field]="fieldState"
            [fieldName]="'email'"
            [strategy]="'on-touch'"
            [hasSubmitted]="hasSubmitted"
          />
        `,
        imports: [NgxSignalFormErrorComponent],
      })
      class TestComponent {
        fieldState = fieldState;
        hasSubmitted = hasSubmitted;
      }

      const fixture = TestBed.createComponent(TestComponent);
      fixture.detectChanges();

      const alert = fixture.nativeElement.querySelector('[role="alert"]');
      expect(alert).toBeTruthy();
      expect(alert?.getAttribute('role')).toBe('alert');
    });

    it('should have aria-live="polite" for live region updates', () => {
      const fieldState = createMockFieldState(true, true, [
        { kind: 'required', message: 'This field is required' },
      ]);
      const hasSubmitted = signal(false);

      @Component({
        template: `
          <ngx-signal-form-error
            [field]="fieldState"
            [fieldName]="'email'"
            [strategy]="'on-touch'"
            [hasSubmitted]="hasSubmitted"
          />
        `,
        imports: [NgxSignalFormErrorComponent],
      })
      class TestComponent {
        fieldState = fieldState;
        hasSubmitted = hasSubmitted;
      }

      const fixture = TestBed.createComponent(TestComponent);
      fixture.detectChanges();

      const alert = fixture.nativeElement.querySelector('[role="alert"]');
      expect(alert?.getAttribute('aria-live')).toBe('polite');
    });

    it('should have correct error ID for aria-describedby linking', () => {
      const fieldState = createMockFieldState(true, true, [
        { kind: 'required', message: 'This field is required' },
      ]);
      const hasSubmitted = signal(false);

      @Component({
        template: `
          <ngx-signal-form-error
            [field]="fieldState"
            [fieldName]="'email'"
            [strategy]="'on-touch'"
            [hasSubmitted]="hasSubmitted"
          />
        `,
        imports: [NgxSignalFormErrorComponent],
      })
      class TestComponent {
        fieldState = fieldState;
        hasSubmitted = hasSubmitted;
      }

      const fixture = TestBed.createComponent(TestComponent);
      fixture.detectChanges();

      const alert = fixture.nativeElement.querySelector('[role="alert"]');
      expect(alert?.getAttribute('id')).toBe('email-error');
    });

    it('should generate correct error ID for nested fields', () => {
      const fieldState = createMockFieldState(true, true, [
        { kind: 'required', message: 'This field is required' },
      ]);
      const hasSubmitted = signal(false);

      @Component({
        template: `
          <ngx-signal-form-error
            [field]="fieldState"
            [fieldName]="'user.profile.email'"
            [strategy]="'on-touch'"
            [hasSubmitted]="hasSubmitted"
          />
        `,
        imports: [NgxSignalFormErrorComponent],
      })
      class TestComponent {
        fieldState = fieldState;
        hasSubmitted = hasSubmitted;
      }

      const fixture = TestBed.createComponent(TestComponent);
      fixture.detectChanges();

      const alert = fixture.nativeElement.querySelector('[role="alert"]');
      expect(alert?.getAttribute('id')).toBe('user.profile.email-error');
    });
  });

  describe('edge cases', () => {
    it('should handle null field state gracefully', () => {
      const fieldState = signal(null);
      const hasSubmitted = signal(false);

      @Component({
        template: `
          <ngx-signal-form-error
            [field]="fieldState"
            [fieldName]="'email'"
            [strategy]="'on-touch'"
            [hasSubmitted]="hasSubmitted"
          />
        `,
        imports: [NgxSignalFormErrorComponent],
      })
      class TestComponent {
        fieldState = fieldState;
        hasSubmitted = hasSubmitted;
      }

      const fixture = TestBed.createComponent(TestComponent);
      fixture.detectChanges();

      const alert = fixture.nativeElement.querySelector('[role="alert"]');
      expect(alert).toBeFalsy();
    });

    it('should handle field state without errors method', () => {
      const fieldState = signal({
        invalid: () => true,
        touched: () => true,
      });
      const hasSubmitted = signal(false);

      @Component({
        template: `
          <ngx-signal-form-error
            [field]="fieldState"
            [fieldName]="'email'"
            [strategy]="'on-touch'"
            [hasSubmitted]="hasSubmitted"
          />
        `,
        imports: [NgxSignalFormErrorComponent],
      })
      class TestComponent {
        fieldState = fieldState;
        hasSubmitted = hasSubmitted;
      }

      const fixture = TestBed.createComponent(TestComponent);
      fixture.detectChanges();

      const alert = fixture.nativeElement.querySelector('[role="alert"]');
      expect(alert).toBeFalsy();
    });

    it('should handle empty errors array', () => {
      const fieldState = createMockFieldState(false, true, []);
      const hasSubmitted = signal(false);

      @Component({
        template: `
          <ngx-signal-form-error
            [field]="fieldState"
            [fieldName]="'email'"
            [strategy]="'on-touch'"
            [hasSubmitted]="hasSubmitted"
          />
        `,
        imports: [NgxSignalFormErrorComponent],
      })
      class TestComponent {
        fieldState = fieldState;
        hasSubmitted = hasSubmitted;
      }

      const fixture = TestBed.createComponent(TestComponent);
      fixture.detectChanges();

      const alert = fixture.nativeElement.querySelector('[role="alert"]');
      expect(alert).toBeFalsy();
    });
  });
});
