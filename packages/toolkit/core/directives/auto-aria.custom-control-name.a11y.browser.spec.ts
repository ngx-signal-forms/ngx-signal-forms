import {
  ApplicationRef,
  Component,
  Directive,
  input as signalInput,
  signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FORM_FIELD } from '@angular/forms/signals';
import { expectNoA11yViolations } from '@ngx-signal-forms/toolkit/testing';
import { render } from '@testing-library/angular';
import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { NgxFormFieldError } from '../../assistive/form-field-error';
import { NgxSignalFormAutoAria } from './auto-aria';

/**
 * WCAG 2.2 AA conformance gate for a field-shaped custom control: `id="city"`
 * sits on the `[formField]` host, while Angular Aria Combobox puts
 * `role="combobox"` (and its own, different `id`) on an inner descendant.
 *
 * Managed ARIA attributes relocate to the inner combobox (see
 * `NgxSignalFormAutoAria#ariaTarget`'s doc), but the field *name* must stay
 * the host id — otherwise a sibling `<ngx-form-field-error fieldName="city">`
 * and auto-ARIA generate different ids, and the combobox's
 * `aria-describedby` points at an id nothing renders (axe
 * `aria-valid-attr-value`).
 */
@Directive({
  selector: '[formField]',
  providers: [{ provide: FORM_FIELD, useExisting: MockFormFieldDirective }],
})
class MockFormFieldDirective {
  readonly field = signalInput<unknown>(undefined, { alias: 'formField' });
  readonly state = signal<unknown>(undefined);
}

function createMockControl(
  invalid = false,
  touched = false,
  errors: unknown[] = [],
) {
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

  return signal(() => fieldState);
}

describe('NgxSignalFormAutoAria — field-shaped custom control naming (WCAG 2.2 AA)', () => {
  it('names the field from the host id and links a sibling error component through the inner combobox with no dangling reference', async () => {
    @Component({
      selector: 'ngx-test-custom-control-name',
      imports: [
        MockFormFieldDirective,
        NgxSignalFormAutoAria,
        NgxFormFieldError,
      ],
      template: `
        <label for="city-input">City</label>
        <div id="city" [formField]="cityControl()">
          <input id="city-input" role="combobox" aria-expanded="false" />
        </div>
        <ngx-form-field-error [formField]="cityControl()" fieldName="city" />
      `,
    })
    class TestComponent {
      readonly cityControl = createMockControl(true, true, [
        { kind: 'required', message: 'City is required' },
      ]);
    }

    const { container } = await render(TestComponent);
    await TestBed.inject(ApplicationRef).whenStable();

    const combobox = page.getByRole('combobox');
    await expect
      .element(combobox)
      .toHaveAttribute('aria-describedby', 'city-error');

    await expectNoA11yViolations(container);
  });
});
