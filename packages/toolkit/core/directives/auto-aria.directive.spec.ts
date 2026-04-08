import {
  ApplicationRef,
  Component,
  computed,
  Directive,
  input as signalInput,
  signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FORM_FIELD } from '@angular/forms/signals';
import { NgxSignalFormControlSemanticsDirective } from '../index';
import { NgxFormFieldHintComponent } from '@ngx-signal-forms/toolkit/assistive';
import { render } from '@testing-library/angular';
import { describe, expect, it, vi } from 'vitest';
import { NgxSignalFormAutoAriaDirective } from './auto-aria.directive';

/**
 * Mock FormField directive for tests.
 * Provides FORM_FIELD token so NgxSignalFormAutoAriaDirective can inject it,
 * without using Angular's real FormField (which requires real Signal Forms fields).
 */
@Directive({
  selector: '[formField]',
  providers: [{ provide: FORM_FIELD, useExisting: MockFormFieldDirective }],
})
class MockFormFieldDirective {
  readonly field = signalInput<unknown>(undefined, { alias: 'formField' });
  readonly state = computed(() => {
    const f = this.field();
    return typeof f === 'function' ? f() : undefined;
  });
}

/**
 * Test suite for NgxSignalFormAutoAriaDirective.
 *
 * Tests cover:
 * - Initialization with different element types (input, textarea, select)
 * - Field name resolution from element attributes (id, name, formControlName, ariaLabel)
 * - ARIA attribute computation based on field state (valid/invalid, touched/untouched)
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
    const fieldState = {
      invalid: signal(invalid),
      touched: signal(touched),
      errors: signal(errors),
      valid: signal(!invalid),
      dirty: signal(touched),
      value: signal(''),
      required: signal(false),
      focusBoundControl: vi.fn(),
    };
    // Control signal returns a function (signal) that returns the field state object
    return signal(() => fieldState);
  };

  describe('Initialization and Field Name Resolution', () => {
    it('should initialize with id attribute as field name', async () => {
      @Component({
        template: '<input id="email" [formField]="emailControl()" />',
        imports: [MockFormFieldDirective, NgxSignalFormAutoAriaDirective],
      })
      class TestComponent {
        emailControl = createMockControl();
      }

      const { container } = await render(TestComponent);

      const input = container.querySelector('input');
      expect(input?.getAttribute('aria-invalid')).toBe('false');
    });

    it('should initialize with name attribute as field name', async () => {
      @Component({
        template: '<input name="username" [formField]="usernameControl()" />',
        imports: [MockFormFieldDirective, NgxSignalFormAutoAriaDirective],
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
        imports: [MockFormFieldDirective, NgxSignalFormAutoAriaDirective],
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
        imports: [MockFormFieldDirective, NgxSignalFormAutoAriaDirective],
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
        imports: [MockFormFieldDirective, NgxSignalFormAutoAriaDirective],
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
        imports: [MockFormFieldDirective, NgxSignalFormAutoAriaDirective],
      })
      class TestComponent {
        agreeControl = createMockControl();
      }

      const { container } = await render(TestComponent);

      const input = container.querySelector('input');
      expect(input?.hasAttribute('aria-invalid')).toBe(false);
    });

    it('should apply to checkbox switches with role="switch"', async () => {
      @Component({
        template:
          '<input type="checkbox" role="switch" id="emailUpdates" [formField]="switchControl()" />',
        imports: [MockFormFieldDirective, NgxSignalFormAutoAriaDirective],
      })
      class TestComponent {
        switchControl = createMockControl(true, true, [
          { kind: 'required', message: 'Switch is required' },
        ]);
      }

      const { container } = await render(TestComponent);

      const input = container.querySelector('input');
      expect(input?.getAttribute('aria-invalid')).toBe('true');
      expect(input?.getAttribute('aria-describedby')).toBe(
        'emailUpdates-error',
      );
    });

    it('should resolve aria-describedby after a dynamically bound switch id is rendered', async () => {
      @Component({
        template:
          '<input type="checkbox" role="switch" [id]="fieldId" [formField]="switchControl()" />',
        imports: [MockFormFieldDirective, NgxSignalFormAutoAriaDirective],
      })
      class TestComponent {
        readonly fieldId = 'emailUpdates';

        switchControl = createMockControl(true, true, [
          { kind: 'required', message: 'Switch is required' },
        ]);
      }

      const { container } = await render(TestComponent);

      await TestBed.inject(ApplicationRef).whenStable();

      const input = container.querySelector('input');
      expect(input?.getAttribute('aria-invalid')).toBe('true');
      expect(input?.getAttribute('aria-describedby')).toBe(
        'emailUpdates-error',
      );
    });

    it('should apply explicit switch semantics to checkbox inputs without role="switch"', async () => {
      @Component({
        template:
          '<input type="checkbox" id="emailUpdates" ngxSignalFormControl="switch" [formField]="switchControl()" />',
        imports: [
          MockFormFieldDirective,
          NgxSignalFormAutoAriaDirective,
          NgxSignalFormControlSemanticsDirective,
        ],
      })
      class TestComponent {
        switchControl = createMockControl(true, true, [
          { kind: 'required', message: 'Switch is required' },
        ]);
      }

      const { container } = await render(TestComponent);

      const input = container.querySelector('input');
      expect(input?.getAttribute('aria-invalid')).toBe('true');
      expect(input?.getAttribute('aria-describedby')).toBe(
        'emailUpdates-error',
      );
    });

    it('should preserve consumer-owned aria attributes in manual semantics mode', async () => {
      @Component({
        template:
          '<input type="checkbox" id="emailUpdates" aria-describedby="emailUpdates-hint" aria-invalid="mixed" aria-required="true" ngxSignalFormControl="switch" ngxSignalFormControlAria="manual" [formField]="switchControl()" />',
        imports: [
          MockFormFieldDirective,
          NgxSignalFormAutoAriaDirective,
          NgxSignalFormControlSemanticsDirective,
        ],
      })
      class TestComponent {
        switchControl = createMockControl(true, true, [
          { kind: 'required', message: 'Switch is required' },
        ]);
      }

      const { container } = await render(TestComponent);

      const input = container.querySelector('input');
      expect(input?.getAttribute('aria-describedby')).toBe('emailUpdates-hint');
      expect(input?.getAttribute('aria-invalid')).toBe('mixed');
      expect(input?.getAttribute('aria-required')).toBe('true');
    });

    it('should preserve dynamically updated aria attributes in manual semantics mode', async () => {
      @Component({
        template:
          '<input type="checkbox" id="emailUpdates" [attr.aria-describedby]="describedBy()" [attr.aria-invalid]="ariaInvalid()" [attr.aria-required]="ariaRequired()" ngxSignalFormControl="switch" ngxSignalFormControlAria="manual" [formField]="switchControl()" />',
        imports: [
          MockFormFieldDirective,
          NgxSignalFormAutoAriaDirective,
          NgxSignalFormControlSemanticsDirective,
        ],
      })
      class TestComponent {
        readonly describedBy = signal('emailUpdates-hint');
        readonly ariaInvalid = signal('mixed');
        readonly ariaRequired = signal('true');

        switchControl = createMockControl(true, true, [
          { kind: 'required', message: 'Switch is required' },
        ]);
      }

      const { container, fixture } = await render(TestComponent);

      await TestBed.inject(ApplicationRef).whenStable();

      const input = container.querySelector('input');
      expect(input?.getAttribute('aria-describedby')).toBe('emailUpdates-hint');
      expect(input?.getAttribute('aria-invalid')).toBe('mixed');
      expect(input?.getAttribute('aria-required')).toBe('true');

      fixture.componentInstance.describedBy.set('emailUpdates-details');
      fixture.componentInstance.ariaInvalid.set('false');
      fixture.componentInstance.ariaRequired.set('false');
      fixture.detectChanges();
      await TestBed.inject(ApplicationRef).whenStable();

      expect(input?.getAttribute('aria-describedby')).toBe(
        'emailUpdates-details',
      );
      expect(input?.getAttribute('aria-invalid')).toBe('false');
      expect(input?.getAttribute('aria-required')).toBe('false');
    });

    it('should apply switch ARIA when both role="switch" and ngxSignalFormControl="switch" are present', async () => {
      @Component({
        template:
          '<input type="checkbox" role="switch" id="emailUpdates" ngxSignalFormControl="switch" [formField]="switchControl()" />',
        imports: [
          MockFormFieldDirective,
          NgxSignalFormAutoAriaDirective,
          NgxSignalFormControlSemanticsDirective,
        ],
      })
      class TestComponent {
        switchControl = createMockControl(true, true, [
          { kind: 'required', message: 'Switch is required' },
        ]);
      }

      const { container } = await render(TestComponent);

      const input = container.querySelector('input');
      expect(input?.getAttribute('aria-invalid')).toBe('true');
      expect(input?.getAttribute('aria-describedby')).toBe(
        'emailUpdates-error',
      );
    });

    it('should NOT apply when ngxSignalFormAutoAriaDisabled is present', async () => {
      @Component({
        template:
          '<input id="custom" [formField]="customControl()" ngxSignalFormAutoAriaDisabled />',
        imports: [MockFormFieldDirective, NgxSignalFormAutoAriaDirective],
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
        imports: [MockFormFieldDirective, NgxSignalFormAutoAriaDirective],
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
        imports: [MockFormFieldDirective, NgxSignalFormAutoAriaDirective],
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
        imports: [MockFormFieldDirective, NgxSignalFormAutoAriaDirective],
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
        imports: [MockFormFieldDirective, NgxSignalFormAutoAriaDirective],
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
        required: signal(false),
        focusBoundControl: vi.fn(),
      }));
      fixture.detectChanges();

      expect(input?.getAttribute('aria-invalid')).toBe('true');
    });
  });

  describe('ARIA DescribedBy Attribute', () => {
    it('should NOT set aria-describedby when control is valid', async () => {
      @Component({
        template: '<input id="email" [formField]="emailControl()" />',
        imports: [MockFormFieldDirective, NgxSignalFormAutoAriaDirective],
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
        imports: [MockFormFieldDirective, NgxSignalFormAutoAriaDirective],
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
        imports: [
          MockFormFieldDirective,
          NgxSignalFormAutoAriaDirective,
          NgxFormFieldHintComponent,
        ],
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
        imports: [
          MockFormFieldDirective,
          NgxSignalFormAutoAriaDirective,
          NgxFormFieldHintComponent,
        ],
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
        imports: [MockFormFieldDirective, NgxSignalFormAutoAriaDirective],
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
        imports: [MockFormFieldDirective, NgxSignalFormAutoAriaDirective],
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
        imports: [MockFormFieldDirective, NgxSignalFormAutoAriaDirective],
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
        required: signal(false),
        focusBoundControl: vi.fn(),
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
        required: signal(false),
        focusBoundControl: vi.fn(),
      }));
      fixture.detectChanges();

      expect(input?.hasAttribute('aria-describedby')).toBe(false);
    });

    it('should replace stale managed ids when the control id changes', async () => {
      @Component({
        template: '<input [id]="fieldId()" [formField]="emailControl()" />',
        imports: [MockFormFieldDirective, NgxSignalFormAutoAriaDirective],
      })
      class TestComponent {
        readonly fieldId = signal('email');

        emailControl = createMockControl(true, true, [
          { kind: 'required', message: 'Email is required' },
        ]);
      }

      const { container, fixture } = await render(TestComponent);

      await TestBed.inject(ApplicationRef).whenStable();

      const input = container.querySelector('input');
      expect(input?.getAttribute('aria-describedby')).toBe('email-error');

      fixture.componentInstance.fieldId.set('contactEmail');
      fixture.detectChanges();
      await TestBed.inject(ApplicationRef).whenStable();

      expect(input?.getAttribute('aria-describedby')).toBe(
        'contactEmail-error',
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle null control gracefully', async () => {
      @Component({
        template: '<input id="email" [formField]="emailControl()" />',
        imports: [MockFormFieldDirective, NgxSignalFormAutoAriaDirective],
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
        imports: [MockFormFieldDirective, NgxSignalFormAutoAriaDirective],
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
          required: signal(false),
          focusBoundControl: vi.fn(),
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
        imports: [MockFormFieldDirective, NgxSignalFormAutoAriaDirective],
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
