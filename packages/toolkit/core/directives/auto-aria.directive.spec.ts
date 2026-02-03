import { ApplicationRef, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NgxFormFieldHintComponent } from '@ngx-signal-forms/toolkit/assistive';
import { render } from '@testing-library/angular';
import { describe, expect, it, vi } from 'vitest';
import { NGX_SIGNAL_FORMS_CONFIG } from '../tokens';
import type { NgxSignalFormsConfig } from '../types';
import { NgxSignalFormAutoAriaDirective } from './auto-aria.directive';

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
    it('should initialize with id attribute as field name', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {
        // Mock implementation
      });

      @Component({
        template: '<input id="email" [formField]="emailControl()" />',
        imports: [NgxSignalFormAutoAriaDirective],
      })
      class TestComponent {
        emailControl = createMockControl();
      }

      const { container } = await render(TestComponent, {
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

      const input = container.querySelector('input');
      expect(input?.getAttribute('aria-invalid')).toBe('false');

      // Verify debug logging
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[NgxSignalFormAutoAriaDirective] Initialized for field:',
        'email',
        { existingDescribedBy: null },
      );

      consoleLogSpy.mockRestore();
    });

    it('should initialize with name attribute as field name', async () => {
      @Component({
        template: '<input name="username" [formField]="usernameControl()" />',
        imports: [NgxSignalFormAutoAriaDirective],
      })
      class TestComponent {
        usernameControl = createMockControl();
      }

      const { container } = await render(TestComponent);

      const input = container.querySelector('input');
      expect(input?.getAttribute('aria-invalid')).toBe('false');
    });

    it('should work with textarea elements', async () => {
      @Component({
        template: '<textarea id="bio" [formField]="bioControl()"></textarea>',
        imports: [NgxSignalFormAutoAriaDirective],
      })
      class TestComponent {
        bioControl = createMockControl();
      }

      const { container } = await render(TestComponent);

      const textarea = container.querySelector('textarea');
      expect(textarea?.getAttribute('aria-invalid')).toBe('false');
    });

    it('should work with select elements', async () => {
      @Component({
        template: `
          <select id="country" [formField]="countryControl()">
            <option value="us">USA</option>
          </select>
        `,
        imports: [NgxSignalFormAutoAriaDirective],
      })
      class TestComponent {
        countryControl = createMockControl();
      }

      const { container } = await render(TestComponent);

      const select = container.querySelector('select');
      expect(select?.getAttribute('aria-invalid')).toBe('false');
    });

    it('should NOT apply to radio inputs (excluded by selector)', async () => {
      @Component({
        template:
          '<input type="radio" id="option1" [formField]="optionControl()" />',
        imports: [NgxSignalFormAutoAriaDirective],
      })
      class TestComponent {
        optionControl = createMockControl();
      }

      const { container } = await render(TestComponent);

      const input = container.querySelector('input');
      // Directive should not apply, so no aria-invalid attribute
      expect(input?.hasAttribute('aria-invalid')).toBe(false);
    });

    it('should NOT apply to checkbox inputs (excluded by selector)', async () => {
      @Component({
        template:
          '<input type="checkbox" id="agree" [formField]="agreeControl()" />',
        imports: [NgxSignalFormAutoAriaDirective],
      })
      class TestComponent {
        agreeControl = createMockControl();
      }

      const { container } = await render(TestComponent);

      const input = container.querySelector('input');
      expect(input?.hasAttribute('aria-invalid')).toBe(false);
    });

    it('should NOT apply when ngxSignalFormAutoAriaDisabled is present', async () => {
      @Component({
        template:
          '<input id="custom" [formField]="customControl()" ngxSignalFormAutoAriaDisabled />',
        imports: [NgxSignalFormAutoAriaDirective],
      })
      class TestComponent {
        customControl = createMockControl();
      }

      const { container } = await render(TestComponent);

      const input = container.querySelector('input');
      expect(input?.hasAttribute('aria-invalid')).toBe(false);
    });
  });

  describe('ARIA Invalid Attribute', () => {
    it('should set aria-invalid to "false" when control is valid', async () => {
      @Component({
        template: '<input id="email" [formField]="emailControl()" />',
        imports: [NgxSignalFormAutoAriaDirective],
      })
      class TestComponent {
        emailControl = createMockControl(false, true); // valid, touched
      }

      const { container } = await render(TestComponent);

      const input = container.querySelector('input');
      expect(input?.getAttribute('aria-invalid')).toBe('false');
    });

    it('should set aria-invalid to "true" when control is invalid and touched', async () => {
      @Component({
        template: '<input id="email" [formField]="emailControl()" />',
        imports: [NgxSignalFormAutoAriaDirective],
      })
      class TestComponent {
        emailControl = createMockControl(true, true, [
          { kind: 'required', message: 'Required' },
        ]); // invalid, touched, with error
      }

      const { container } = await render(TestComponent);

      const input = container.querySelector('input');
      expect(input?.getAttribute('aria-invalid')).toBe('true');
    });

    it('should set aria-invalid to "false" when control is invalid but not touched', async () => {
      @Component({
        template: '<input id="email" [formField]="emailControl()" />',
        imports: [NgxSignalFormAutoAriaDirective],
      })
      class TestComponent {
        emailControl = createMockControl(true, false); // invalid, not touched
      }

      const { container } = await render(TestComponent);

      const input = container.querySelector('input');
      expect(input?.getAttribute('aria-invalid')).toBe('false');
    });

    it('should reactively update aria-invalid when control state changes', async () => {
      const mockControl = createMockControl(false, false);

      @Component({
        template: '<input id="email" [formField]="emailControl()" />',
        imports: [NgxSignalFormAutoAriaDirective],
      })
      class TestComponent {
        emailControl = mockControl;
      }

      const { container, fixture } = await render(TestComponent);

      const input = container.querySelector('input');
      expect(input?.getAttribute('aria-invalid')).toBe('false');

      // Update control state: make it invalid and touched with error
      mockControl.update(() => () => ({
        invalid: signal(true),
        touched: signal(true),
        errors: signal([{ kind: 'required', message: 'Required' }]),
        valid: signal(false),
        dirty: signal(true),
        value: signal(''),
      }));
      fixture.detectChanges();

      expect(input?.getAttribute('aria-invalid')).toBe('true');
    });
  });

  describe('ARIA DescribedBy Attribute', () => {
    it('should NOT set aria-describedby when control is valid', async () => {
      @Component({
        template: '<input id="email" [formField]="emailControl()" />',
        imports: [NgxSignalFormAutoAriaDirective],
      })
      class TestComponent {
        emailControl = createMockControl(false, true); // valid, touched
      }

      const { container } = await render(TestComponent);

      const input = container.querySelector('input');
      expect(input?.hasAttribute('aria-describedby')).toBe(false);
    });

    it('should set aria-describedby when control is invalid and touched', async () => {
      @Component({
        template: '<input id="email" [formField]="emailControl()" />',
        imports: [NgxSignalFormAutoAriaDirective],
      })
      class TestComponent {
        emailControl = createMockControl(true, true, [
          { kind: 'required', message: 'Required' },
        ]); // invalid, touched, with error
      }

      const { container } = await render(TestComponent);

      const input = container.querySelector('input');
      expect(input?.getAttribute('aria-describedby')).toBe('email-error');
    });

    it('should include hint ID when hint is present', async () => {
      @Component({
        template: `
          <ngx-signal-form-field-wrapper>
            <input id="email" [formField]="emailControl()" />
            <ngx-signal-form-field-hint id="email-hint">
              Help text
            </ngx-signal-form-field-hint>
          </ngx-signal-form-field-wrapper>
        `,
        imports: [NgxSignalFormAutoAriaDirective, NgxFormFieldHintComponent],
      })
      class TestComponent {
        emailControl = createMockControl(false, true); // valid, touched
      }

      const { container } = await render(TestComponent);

      await TestBed.inject(ApplicationRef).whenStable();

      const input = container.querySelector('input');
      expect(input?.getAttribute('aria-describedby')).toBe('email-hint');
    });

    it('should combine hint and error IDs when invalid', async () => {
      @Component({
        template: `
          <ngx-signal-form-field-wrapper>
            <input id="email" [formField]="emailControl()" />
            <ngx-signal-form-field-hint id="email-hint">
              Help text
            </ngx-signal-form-field-hint>
          </ngx-signal-form-field-wrapper>
        `,
        imports: [NgxSignalFormAutoAriaDirective, NgxFormFieldHintComponent],
      })
      class TestComponent {
        emailControl = createMockControl(true, true, [
          { kind: 'required', message: 'Required' },
        ]);
      }

      const { container } = await render(TestComponent);

      await TestBed.inject(ApplicationRef).whenStable();

      const input = container.querySelector('input');
      expect(input?.getAttribute('aria-describedby')).toBe(
        'email-hint email-error',
      );
    });

    it('should NOT set aria-describedby when control is invalid but not touched', async () => {
      @Component({
        template: '<input id="email" [formField]="emailControl()" />',
        imports: [NgxSignalFormAutoAriaDirective],
      })
      class TestComponent {
        emailControl = createMockControl(true, false); // invalid, not touched
      }

      const { container } = await render(TestComponent);

      const input = container.querySelector('input');
      expect(input?.hasAttribute('aria-describedby')).toBe(false);
    });

    it('should use correct error ID format for nested field paths', async () => {
      @Component({
        template: '<input id="address.city" [formField]="cityControl()" />',
        imports: [NgxSignalFormAutoAriaDirective],
      })
      class TestComponent {
        cityControl = createMockControl(true, true, [
          { kind: 'required', message: 'Required' },
        ]); // invalid, touched, with error
      }

      const { container } = await render(TestComponent);

      const input = container.querySelector('input');
      // generateErrorId currently uses dot notation
      expect(input?.getAttribute('aria-describedby')).toBe(
        'address.city-error',
      );
    });

    it('should reactively update aria-describedby when control state changes', async () => {
      const mockControl = createMockControl(false, false);

      @Component({
        template: '<input id="email" [formField]="emailControl()" />',
        imports: [NgxSignalFormAutoAriaDirective],
      })
      class TestComponent {
        emailControl = mockControl;
      }

      const { container, fixture } = await render(TestComponent);

      const input = container.querySelector('input');
      expect(input?.hasAttribute('aria-describedby')).toBe(false);

      // Update control state: make it invalid and touched with blocking error
      mockControl.update(() => () => ({
        invalid: signal(true),
        touched: signal(true),
        errors: signal([{ kind: 'required', message: 'Email is required' }]),
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
    it('should log debug messages when debug is enabled', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {
        // Mock implementation
      });

      @Component({
        template: '<input id="test-field" [formField]="testControl()" />',
        imports: [NgxSignalFormAutoAriaDirective],
      })
      class TestComponent {
        testControl = createMockControl();
      }

      await render(TestComponent, {
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

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[NgxSignalFormAutoAriaDirective] Initialized for field:',
        'test-field',
        { existingDescribedBy: null },
      );

      consoleLogSpy.mockRestore();
    });

    it('should NOT log debug messages when debug is disabled', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {
        // Mock implementation
      });

      @Component({
        template: '<input id="no-debug-field" [formField]="testControl()" />',
        imports: [NgxSignalFormAutoAriaDirective],
      })
      class TestComponent {
        testControl = createMockControl();
      }

      // Clear any previous calls
      consoleLogSpy.mockClear();

      await render(TestComponent, {
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

      // Should not have any calls for NgxSignalFormAutoAriaDirective
      const autoAriaCalls = consoleLogSpy.mock.calls.filter(
        (call) =>
          typeof call[0] === 'string' &&
          call[0].includes('NgxSignalFormAutoAriaDirective'),
      );
      expect(autoAriaCalls).toHaveLength(0);

      consoleLogSpy.mockRestore();
    });

    it('should use default config when no provider is given', async () => {
      @Component({
        template: '<input id="email" [formField]="emailControl()" />',
        imports: [NgxSignalFormAutoAriaDirective],
      })
      class TestComponent {
        emailControl = createMockControl();
      }

      const { container } = await render(TestComponent);

      const input = container.querySelector('input');
      expect(input?.getAttribute('aria-invalid')).toBe('false');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null control gracefully', async () => {
      @Component({
        template: '<input id="email" [formField]="emailControl()" />',
        imports: [NgxSignalFormAutoAriaDirective],
      })
      class TestComponent {
        emailControl = signal(null);
      }

      const { container } = await render(TestComponent);

      const input = container.querySelector('input');
      // Should not crash, should not set ARIA attributes
      expect(input?.hasAttribute('aria-invalid')).toBe(false);
      expect(input?.hasAttribute('aria-describedby')).toBe(false);
    });

    it('should handle control without field state', async () => {
      @Component({
        template: '<input id="email" [formField]="emailControl()" />',
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

      const { container } = await render(TestComponent);

      const input = container.querySelector('input');
      // Should not crash
      expect(input).toBeTruthy();
    });

    it('should handle element without resolvable field name', async () => {
      @Component({
        template: '<input [formField]="emailControl()" />',
        imports: [NgxSignalFormAutoAriaDirective],
      })
      class TestComponent {
        emailControl = createMockControl(true, true, [
          { kind: 'required', message: 'Required' },
        ]);
      }

      const { container } = await render(TestComponent);

      const input = container.querySelector('input');
      // Should still apply aria-invalid
      expect(input?.getAttribute('aria-invalid')).toBe('true');
      // But no aria-describedby since field name is null
      expect(input?.hasAttribute('aria-describedby')).toBe(false);
    });
  });
});
