import { Component, input, signal } from '@angular/core';
import {
  FormField,
  FormRoot,
  form,
  required,
  validate,
} from '@angular/forms/signals';
import {
  type FormFieldAppearance,
  NgxSignalFormToolkit,
  warningError,
} from '@ngx-signal-forms/toolkit';
import { render } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { NgxFormFieldHint } from '@ngx-signal-forms/toolkit/assistive';
import { NgxFormFieldWrapper } from './form-field-wrapper';
import { NgxFormFieldset } from './form-fieldset';

const fieldState = (invalid: boolean) => ({
  invalid: () => invalid,
  valid: () => !invalid,
  touched: () => true,
  dirty: () => false,
  pending: () => false,
  errors: () => (invalid ? [{ kind: 'required', message: 'Required' }] : []),
  errorSummary: () =>
    invalid ? [{ kind: 'required', message: 'Required' }] : [],
});

@Component({
  imports: [
    FormField,
    FormRoot,
    NgxSignalFormToolkit,
    NgxFormFieldWrapper,
    NgxFormFieldHint,
  ],
  template: `
    <form
      [formRoot]="testForm"
      ngxSignalForm
      errorStrategy="immediate"
      warningStrategy="immediate"
    >
      @if (selection(); as kind) {
        <ngx-form-field-wrapper
          [formField]="testForm.choice"
          appearance="outline"
        >
          <label for="choice">Choice</label>
          <input
            id="choice"
            type="checkbox"
            [attr.role]="kind === 'switch' ? 'switch' : null"
            [formField]="testForm.choice"
          />
          <ngx-form-field-hint>Hint</ngx-form-field-hint>
        </ngx-form-field-wrapper>
      } @else {
        <ngx-form-field-wrapper
          [formField]="testForm.text"
          [appearance]="appearance()"
        >
          <label for="text">Text</label>
          <input id="text" [formField]="testForm.text" />
          <ngx-form-field-hint>Hint</ngx-form-field-hint>
        </ngx-form-field-wrapper>
      }
    </form>
  `,
})
class FeedbackHost {
  readonly selection = input<'checkbox' | 'switch'>();
  readonly appearance = input<FormFieldAppearance>('standard');
  readonly testForm = form(signal({ choice: false, text: '' }), (path) => {
    validate(path.choice, () =>
      this.selection() === 'switch'
        ? warningError('choice', 'Select this if possible')
        : { kind: 'required', message: 'Required' },
    );
    required(path.text, { message: 'Required' });
  });
}

describe('feedback spacing', () => {
  it('collapses an empty top message slot and restores its configured margin', async () => {
    const field = signal(fieldState(false));
    const emptyField = signal(fieldState(false));
    const { container, fixture } = await render(
      `
        <ngx-form-fieldset
          id="outer"
          [field]="field"
          errorPlacement="top"
          style="--ngx-signal-form-fieldset-message-margin-bottom: 23px; --ngx-signal-form-fieldset-transition-spacing: none"
        >
          <ngx-form-fieldset id="inner" [field]="emptyField" errorPlacement="top">
            Content
          </ngx-form-fieldset>
        </ngx-form-fieldset>
      `,
      {
        imports: [NgxFormFieldset],
        componentProperties: { field, emptyField },
      },
    );
    const slot = container.querySelector<HTMLElement>(
      '#outer > .ngx-signal-form-fieldset__surface > .ngx-signal-form-fieldset__messages',
    )!;
    const innerSlot = container.querySelector<HTMLElement>(
      '#inner .ngx-signal-form-fieldset__messages',
    )!;
    expect(getComputedStyle(slot).marginTop).toBe('0px');
    expect(getComputedStyle(slot).marginBottom).toBe('0px');
    field.set(fieldState(true));
    fixture.detectChanges();
    await expect.poll(() => getComputedStyle(slot).marginBottom).toBe('23px');
    expect(getComputedStyle(innerSlot).marginBottom).toBe('0px');
  });

  it('applies fieldset padding tokens to plain grouped messages', async () => {
    const field = signal(fieldState(true));
    const { container } = await render(
      `<ngx-form-fieldset [field]="field" feedbackAppearance="plain" style="--ngx-signal-form-fieldset-message-padding-inline-start: 13px; --ngx-signal-form-fieldset-message-padding-inline-end: 17px"><div>Content</div></ngx-form-fieldset>`,
      { imports: [NgxFormFieldset], componentProperties: { field } },
    );
    const error = container.querySelector<HTMLElement>(
      '.ngx-form-field-error--error',
    )!;
    expect(error.textContent).toContain('Required');
    expect(getComputedStyle(error).paddingInlineStart).toBe('13px');
    expect(getComputedStyle(error).paddingInlineEnd).toBe('17px');
  });

  it.each([
    { selection: 'checkbox', role: 'alert', message: 'Required' },
    { selection: 'switch', role: 'status', message: 'Select this if possible' },
  ] as const)(
    'aligns inline feedback with the hint in a $selection row',
    async ({ selection, role, message }) => {
      const rendered = await render(FeedbackHost, {
        inputs: { selection },
      });
      const hint = rendered.container.querySelector('ngx-form-field-hint')!;
      const feedback = rendered.getByRole(role);
      expect(feedback.textContent).toContain(message);
      expect(getComputedStyle(hint).paddingInlineStart).toBe('8px');
      expect(getComputedStyle(feedback).paddingInlineStart).toBe(
        getComputedStyle(hint).paddingInlineStart,
      );
      expect(getComputedStyle(feedback).paddingInlineEnd).toBe(
        getComputedStyle(hint).paddingInlineEnd,
      );
    },
  );

  it.each(['standard', 'outline', 'plain'] as const)(
    'keeps inline errors flush in a %s text field',
    async (appearance) => {
      const rendered = await render(FeedbackHost, {
        inputs: { appearance },
      });
      const feedback = rendered.getByRole('alert');
      expect(feedback.textContent).toContain('Required');
      expect(getComputedStyle(feedback).paddingInlineStart).toBe('0px');
      expect(getComputedStyle(feedback).paddingInlineEnd).toBe('0px');
    },
  );
});
