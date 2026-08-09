import { ApplicationRef, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormField, form } from '@angular/forms/signals';
import { render } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { NgxFormFieldHint } from './hint';
import { expectNoA11yViolations } from '@ngx-signal-forms/toolkit/testing';

/**
 * WCAG 2.2 AA conformance gate for `NgxFormFieldHint`.
 *
 * Rendered directly beside its labelled control (its documented "Basic hint
 * text" usage) rather than through `NgxFormFieldWrapper` — the wrapper's own
 * a11y spec already covers the wrapper-composed case. `aria-describedby`
 * linking is wired manually here since there is no wrapper to auto-manage
 * it, matching how the class doc's standalone example is written.
 */
describe('NgxFormFieldHint — WCAG 2.2 AA conformance', () => {
  it('a hint linked to its control has no violations', async () => {
    @Component({
      selector: 'ngx-test-a11y-hint',
      imports: [FormField, NgxFormFieldHint],
      template: `
        <label for="phone">Phone number</label>
        <input
          id="phone"
          type="tel"
          [formField]="testForm.phone"
          aria-describedby="phone-hint"
        />
        <ngx-form-field-hint id="phone-hint">
          Format: 123-456-7890
        </ngx-form-field-hint>
      `,
    })
    class TestComponent {
      readonly #model = signal({ phone: '' });
      readonly testForm = form(this.#model);
    }

    const { container } = await render(TestComponent);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(container.querySelector('#phone-hint')?.textContent).toContain(
      'Format: 123-456-7890',
    );
    await expectNoA11yViolations(container);
  });
});
