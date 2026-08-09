import { ApplicationRef, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormField, form, required, schema } from '@angular/forms/signals';
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';
import { render } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { NgxFormMarkingLegend } from './form-marking-legend';
import { expectNoA11yViolations } from '@ngx-signal-forms/toolkit/testing';

/**
 * WCAG 2.2 AA conformance gate for `NgxFormMarkingLegend`.
 *
 * Rendered the way it ships — once, ahead of the fields it explains — next
 * to a real required field carrying the marker it describes. The legend
 * renders identical markup (a plain `<p>`) across marking modes, so one
 * fixture with a resolvable required field covers its accessible output.
 */
describe('NgxFormMarkingLegend — WCAG 2.2 AA conformance', () => {
  it('the legend paired with a required field has no violations', async () => {
    @Component({
      selector: 'ngx-test-a11y-marking-legend',
      imports: [
        FormField,
        NgxSignalFormToolkit,
        NgxFormField,
        NgxFormMarkingLegend,
      ],
      template: `
        <form [formRoot]="testForm" ngxSignalForm>
          <ngx-form-marking-legend
            [formTree]="testForm"
            showMarkerWhen="required"
          />
          <ngx-form-field-wrapper
            [formField]="testForm.email"
            fieldName="email"
          >
            <label for="email">Email address</label>
            <input id="email" type="email" [formField]="testForm.email" />
          </ngx-form-field-wrapper>
        </form>
      `,
    })
    class TestComponent {
      readonly #model = signal({ email: '' });
      readonly testForm = form(
        this.#model,
        schema((path) => {
          required(path.email, { message: 'Email is required' });
        }),
      );
    }

    const { container } = await render(TestComponent);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(container.querySelector('.ngx-form-marking-legend')).toBeTruthy();
    await expectNoA11yViolations(container);
  });
});
