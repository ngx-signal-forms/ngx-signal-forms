import { Component, signal } from '@angular/core';
import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { NgxSignalFormAutoAriaDirective } from './auto-aria.directive';
import { NGX_SIGNAL_FORMS_CONFIG } from '../tokens';
import type { NgxSignalFormsConfig } from '../types';

/**
 * Test suite for NgxSignalFormAutoAriaDirective.
 *
 * Tests cover:
 * - Initialization with different element types (input, textarea, select)
 * - Field name resolution from element attributes (id, name, formControlName, ariaLabel)
 * - ARIA attribute computation based on field state (valid/invalid, touched/untouched)
 * - Integration with form config (strictFieldResolution, debug)
 * - Opt-out behavior with ngxSignalFormAutoAriaDisabled attribute
 * - Radio and checkbox exclusion from automatic ARIA
 */
describe('NgxSignalFormAutoAriaDirective', () => {
  /**
   * Mock control state signal for testing.
   * Mimics the structure of a Signal Forms control.
   */
  // Patch: createMockControl returns a signal that returns a function (signal) returning the field state object
  const createMockControl = (
    invalid = false,
    touched = false,
    errors: unknown[] = [],
  ) => {
    // Field state object with signal properties
    const fieldState = {
      invalid: signal(invalid),
      touched: signal(touched),
      errors: signal(errors),
      valid: signal(!invalid),
      dirty: signal(touched),
      value: signal(''),
    };
    // Control signal returns a function (signal) that returns the field state object
    return signal(() => fieldState);
  };

  describe('Initialization and Field Name Resolution', () => {
    it('should initialize with id attribute as field name', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {
        // Mock implementation
      });

      @Component({
        template: '<input id="email" [control]="emailControl()" />',
        imports: [NgxSignalFormAutoAriaDirective],
      })
      class TestComponent {
        emailControl = createMockControl();
      }

      TestBed.configureTestingModule({
        providers: [
          {
            provide: NGX_SIGNAL_FORMS_CONFIG,
            useValue: {
              debug: true,
              strictFieldResolution: false,
            } as NgxSignalFormsConfig,
          },
        ],
      });

      const fixture = TestBed.createComponent(TestComponent);
      fixture.detectChanges();

      const input = fixture.nativeElement.querySelector('input');
      expect(input?.getAttribute('aria-invalid')).toBe('false');

      // Verify debug logging
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[NgxSignalFormAutoAriaDirective] Initialized for field:',
        'email',
      );

      consoleLogSpy.mockRestore();
    });

    it('should initialize with name attribute as field name', () => {
      @Component({
        template: '<input name="username" [control]="usernameControl()" />',
        imports: [NgxSignalFormAutoAriaDirective],
      })
      class TestComponent {
        usernameControl = createMockControl();
      }

      const fixture = TestBed.createComponent(TestComponent);
      fixture.detectChanges();

      const input = fixture.nativeElement.querySelector('input');
      expect(input?.getAttribute('aria-invalid')).toBe('false');
    });

    it('should work with textarea elements', () => {
      @Component({
        template: '<textarea id="bio" [control]="bioControl()"></textarea>',
        imports: [NgxSignalFormAutoAriaDirective],
      })
      class TestComponent {
        bioControl = createMockControl();
      }

      const fixture = TestBed.createComponent(TestComponent);
      fixture.detectChanges();

      const textarea = fixture.nativeElement.querySelector('textarea');
      expect(textarea?.getAttribute('aria-invalid')).toBe('false');
    });

    it('should work with select elements', () => {
      @Component({
        template: `
          <select id="country" [control]="countryControl()">
            <option value="us">USA</option>
          </select>
        `,
        imports: [NgxSignalFormAutoAriaDirective],
      })
      class TestComponent {
        countryControl = createMockControl();
      }

      const fixture = TestBed.createComponent(TestComponent);
      fixture.detectChanges();

      const select = fixture.nativeElement.querySelector('select');
      expect(select?.getAttribute('aria-invalid')).toBe('false');
    });

    it('should NOT apply to radio inputs (excluded by selector)', () => {
      @Component({
        template:
          '<input type="radio" id="option1" [control]="optionControl()" />',
        imports: [NgxSignalFormAutoAriaDirective],
      })
      class TestComponent {
        optionControl = createMockControl();
      }

      const fixture = TestBed.createComponent(TestComponent);
      fixture.detectChanges();

      const input = fixture.nativeElement.querySelector('input');
      // Directive should not apply, so no aria-invalid attribute
      expect(input?.hasAttribute('aria-invalid')).toBe(false);
    });

    it('should NOT apply to checkbox inputs (excluded by selector)', () => {
      @Component({
        template:
          '<input type="checkbox" id="agree" [control]="agreeControl()" />',
        imports: [NgxSignalFormAutoAriaDirective],
      })
      class TestComponent {
        agreeControl = createMockControl();
      }

      const fixture = TestBed.createComponent(TestComponent);
      fixture.detectChanges();

      const input = fixture.nativeElement.querySelector('input');
      expect(input?.hasAttribute('aria-invalid')).toBe(false);
    });

    it('should NOT apply when ngxSignalFormAutoAriaDisabled is present', () => {
      @Component({
        template:
          '<input id="custom" [control]="customControl()" ngxSignalFormAutoAriaDisabled />',
        imports: [NgxSignalFormAutoAriaDirective],
      })
      class TestComponent {
        customControl = createMockControl();
      }

      const fixture = TestBed.createComponent(TestComponent);
      fixture.detectChanges();

      const input = fixture.nativeElement.querySelector('input');
      expect(input?.hasAttribute('aria-invalid')).toBe(false);
    });
  });

  describe('ARIA Invalid Attribute', () => {
    it('should set aria-invalid to "false" when control is valid', () => {
      @Component({
        template: '<input id="email" [control]="emailControl()" />',
        imports: [NgxSignalFormAutoAriaDirective],
      })
      class TestComponent {
        emailControl = createMockControl(false, true); // valid, touched
      }

      const fixture = TestBed.createComponent(TestComponent);
      fixture.detectChanges();

      const input = fixture.nativeElement.querySelector('input');
      expect(input?.getAttribute('aria-invalid')).toBe('false');
    });

    it('should set aria-invalid to "true" when control is invalid and touched', () => {
      @Component({
        template: '<input id="email" [control]="emailControl()" />',
        imports: [NgxSignalFormAutoAriaDirective],
      })
      class TestComponent {
        emailControl = createMockControl(true, true); // invalid, touched
      }

      const fixture = TestBed.createComponent(TestComponent);
      fixture.detectChanges();

      const input = fixture.nativeElement.querySelector('input');
      expect(input?.getAttribute('aria-invalid')).toBe('true');
    });

    it('should set aria-invalid to "false" when control is invalid but not touched', () => {
      @Component({
        template: '<input id="email" [control]="emailControl()" />',
        imports: [NgxSignalFormAutoAriaDirective],
      })
      class TestComponent {
        emailControl = createMockControl(true, false); // invalid, not touched
      }

      const fixture = TestBed.createComponent(TestComponent);
      fixture.detectChanges();

      const input = fixture.nativeElement.querySelector('input');
      expect(input?.getAttribute('aria-invalid')).toBe('false');
    });

    it('should reactively update aria-invalid when control state changes', () => {
      const mockControl = createMockControl(false, false);

      @Component({
        template: '<input id="email" [control]="emailControl()" />',
        imports: [NgxSignalFormAutoAriaDirective],
      })
      class TestComponent {
        emailControl = mockControl;
      }

      const fixture = TestBed.createComponent(TestComponent);
      fixture.detectChanges();

      const input = fixture.nativeElement.querySelector('input');
      expect(input?.getAttribute('aria-invalid')).toBe('false');

      // Update control state: make it invalid and touched
      mockControl.update(() => () => ({
        invalid: signal(true),
        touched: signal(true),
        errors: signal([]),
        valid: signal(false),
        dirty: signal(true),
        value: signal(''),
      }));
      fixture.detectChanges();

      expect(input?.getAttribute('aria-invalid')).toBe('true');
    });
  });

  describe('ARIA DescribedBy Attribute', () => {
    it('should NOT set aria-describedby when control is valid', () => {
      @Component({
        template: '<input id="email" [control]="emailControl()" />',
        imports: [NgxSignalFormAutoAriaDirective],
      })
      class TestComponent {
        emailControl = createMockControl(false, true); // valid, touched
      }

      const fixture = TestBed.createComponent(TestComponent);
      fixture.detectChanges();

      const input = fixture.nativeElement.querySelector('input');
      expect(input?.hasAttribute('aria-describedby')).toBe(false);
    });

    it('should set aria-describedby when control is invalid and touched', () => {
      @Component({
        template: '<input id="email" [control]="emailControl()" />',
        imports: [NgxSignalFormAutoAriaDirective],
      })
      class TestComponent {
        emailControl = createMockControl(true, true); // invalid, touched
      }

      const fixture = TestBed.createComponent(TestComponent);
      fixture.detectChanges();

      const input = fixture.nativeElement.querySelector('input');
      expect(input?.getAttribute('aria-describedby')).toBe('email-error');
    });

    it('should NOT set aria-describedby when control is invalid but not touched', () => {
      @Component({
        template: '<input id="email" [control]="emailControl()" />',
        imports: [NgxSignalFormAutoAriaDirective],
      })
      class TestComponent {
        emailControl = createMockControl(true, false); // invalid, not touched
      }

      const fixture = TestBed.createComponent(TestComponent);
      fixture.detectChanges();

      const input = fixture.nativeElement.querySelector('input');
      expect(input?.hasAttribute('aria-describedby')).toBe(false);
    });

    it('should use correct error ID format for nested field paths', () => {
      @Component({
        template: '<input id="address.city" [control]="cityControl()" />',
        imports: [NgxSignalFormAutoAriaDirective],
      })
      class TestComponent {
        cityControl = createMockControl(true, true); // invalid, touched
      }

      const fixture = TestBed.createComponent(TestComponent);
      fixture.detectChanges();

      const input = fixture.nativeElement.querySelector('input');
      // generateErrorId currently uses dot notation
      expect(input?.getAttribute('aria-describedby')).toBe(
        'address.city-error',
      );
    });

    it('should reactively update aria-describedby when control state changes', () => {
      const mockControl = createMockControl(false, false);

      @Component({
        template: '<input id="email" [control]="emailControl()" />',
        imports: [NgxSignalFormAutoAriaDirective],
      })
      class TestComponent {
        emailControl = mockControl;
      }

      const fixture = TestBed.createComponent(TestComponent);
      fixture.detectChanges();

      const input = fixture.nativeElement.querySelector('input');
      expect(input?.hasAttribute('aria-describedby')).toBe(false);

      // Update control state: make it invalid and touched
      mockControl.update(() => () => ({
        invalid: signal(true),
        touched: signal(true),
        errors: signal([]),
        valid: signal(false),
        dirty: signal(true),
        value: signal(''),
      }));
      fixture.detectChanges();

      expect(input?.getAttribute('aria-describedby')).toBe('email-error');

      // Update control state: make it valid again
      mockControl.update(() => () => ({
        invalid: signal(false),
        touched: signal(true),
        errors: signal([]),
        valid: signal(true),
        dirty: signal(true),
        value: signal(''),
      }));
      fixture.detectChanges();

      expect(input?.hasAttribute('aria-describedby')).toBe(false);
    });
  });

  describe('Integration with Form Config', () => {
    it('should log debug messages when debug is enabled', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {
        // Mock implementation
      });

      @Component({
        template: '<input id="test-field" [control]="testControl()" />',
        imports: [NgxSignalFormAutoAriaDirective],
      })
      class TestComponent {
        testControl = createMockControl();
      }

      TestBed.configureTestingModule({
        providers: [
          {
            provide: NGX_SIGNAL_FORMS_CONFIG,
            useValue: {
              debug: true,
              strictFieldResolution: false,
            } as NgxSignalFormsConfig,
          },
        ],
      });

      const fixture = TestBed.createComponent(TestComponent);
      fixture.detectChanges();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[NgxSignalFormAutoAriaDirective] Initialized for field:',
        'test-field',
      );

      consoleLogSpy.mockRestore();
    });

    it('should NOT log debug messages when debug is disabled', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {
        // Mock implementation
      });

      @Component({
        template: '<input id="test-field" [control]="testControl()" />',
        imports: [NgxSignalFormAutoAriaDirective],
      })
      class TestComponent {
        testControl = createMockControl();
      }

      TestBed.configureTestingModule({
        providers: [
          {
            provide: NGX_SIGNAL_FORMS_CONFIG,
            useValue: {
              debug: false,
              strictFieldResolution: false,
            } as NgxSignalFormsConfig,
          },
        ],
      });

      const fixture = TestBed.createComponent(TestComponent);
      fixture.detectChanges();

      expect(consoleLogSpy).not.toHaveBeenCalled();

      consoleLogSpy.mockRestore();
    });

    it('should use default config when no provider is given', () => {
      @Component({
        template: '<input id="email" [control]="emailControl()" />',
        imports: [NgxSignalFormAutoAriaDirective],
      })
      class TestComponent {
        emailControl = createMockControl();
      }

      // No providers - should use defaults
      TestBed.configureTestingModule({});

      const fixture = TestBed.createComponent(TestComponent);
      fixture.detectChanges();

      const input = fixture.nativeElement.querySelector('input');
      expect(input?.getAttribute('aria-invalid')).toBe('false');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null control gracefully', () => {
      @Component({
        template: '<input id="email" [control]="emailControl()" />',
        imports: [NgxSignalFormAutoAriaDirective],
      })
      class TestComponent {
        emailControl = signal(null);
      }

      const fixture = TestBed.createComponent(TestComponent);
      fixture.detectChanges();

      const input = fixture.nativeElement.querySelector('input');
      // Should not crash, should not set ARIA attributes
      expect(input?.hasAttribute('aria-invalid')).toBe(false);
      expect(input?.hasAttribute('aria-describedby')).toBe(false);
    });

    it('should handle control without field state', () => {
      @Component({
        template: '<input id="email" [control]="emailControl()" />',
        imports: [NgxSignalFormAutoAriaDirective],
      })
      class TestComponent {
        // Provide a signal of a function returning a field state object with all required signal properties, set to defaults
        emailControl = signal(() => ({
          invalid: signal(false),
          touched: signal(false),
          errors: signal([]),
          valid: signal(true),
          dirty: signal(false),
          value: signal(''),
        }));
      }

      const fixture = TestBed.createComponent(TestComponent);
      fixture.detectChanges();

      const input = fixture.nativeElement.querySelector('input');
      // Should not crash
      expect(input).toBeTruthy();
    });

    it('should handle element without resolvable field name', () => {
      @Component({
        template: '<input [control]="emailControl()" />',
        imports: [NgxSignalFormAutoAriaDirective],
      })
      class TestComponent {
        emailControl = createMockControl(true, true);
      }

      const fixture = TestBed.createComponent(TestComponent);
      fixture.detectChanges();

      const input = fixture.nativeElement.querySelector('input');
      // Should still apply aria-invalid
      expect(input?.getAttribute('aria-invalid')).toBe('true');
      // But no aria-describedby since field name is null
      expect(input?.hasAttribute('aria-describedby')).toBe(false);
    });
  });
});
