import { signal } from '@angular/core';
import { FormField } from '@angular/forms/signals';
import {
  NgxSignalFormAutoAria,
  NgxSignalFormControlSemanticsDirective,
} from '@ngx-signal-forms/toolkit';
import { render } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { NgxFormField } from './index';
import { NgxFormFieldWrapper } from './form-field-wrapper';

/**
 * Stability + behavior contract for the `NgxFormField` convenience bundle.
 *
 * Regression coverage for the finding that `NgxFormField` included
 * `NgxSignalFormAutoAria` but not `NgxSignalFormControlSemanticsDirective` —
 * the very directive the wrapper's own dev-mode "could not infer a control
 * kind" warning instructs authors to use via `ngxSignalFormControl="..."`.
 * A consumer importing only `NgxFormField` (not the full
 * `NgxSignalFormToolkit`) and following that instruction got: the warning
 * kept firing (kind stayed unresolved), and worse,
 * `ngxSignalFormControlAria="manual"` was silently ignored while
 * `NgxSignalFormAutoAria` kept managing ARIA anyway via its CSS attribute
 * selector — actively overriding what the author opted out of.
 */
describe('NgxFormField bundle', () => {
  it('includes NgxSignalFormAutoAria and NgxSignalFormControlSemanticsDirective', () => {
    expect(NgxFormField).toContain(NgxSignalFormAutoAria);
    expect(NgxFormField).toContain(NgxSignalFormControlSemanticsDirective);
  });

  it('includes NgxFormFieldWrapper', () => {
    expect(NgxFormField).toContain(NgxFormFieldWrapper);
  });

  it('resolves ngxSignalFormControl semantics when only NgxFormField is imported (no NgxSignalFormToolkit)', async () => {
    const invalidField = signal({
      invalid: () => true,
      touched: () => true,
      required: () => false,
      errors: () => [{ kind: 'required', message: 'Email updates required' }],
    });

    const { container } = await render(
      `<ngx-form-field-wrapper [formField]="field">
        <label for="emailUpdates">Email updates</label>
        <input
          id="emailUpdates"
          type="checkbox"
          ngxSignalFormControl="switch"
        />
      </ngx-form-field-wrapper>`,
      {
        // `FormField` is Angular's own directive — required so `[formField]`
        // provides the `FORM_FIELD` token `NgxSignalFormAutoAria` (part of
        // the bundle) injects. `NgxFormField` is the only toolkit import:
        // not `NgxSignalFormControlSemanticsDirective` directly, and not
        // `NgxSignalFormToolkit`. Before the fix, the `ngxSignalFormControl`
        // attribute was inert here — the directive that reads it and writes
        // the `data-ngx-signal-form-control-*` attributes was never
        // declared, so the wrapper's control-kind resolution never saw it
        // and fell back to `kind: null`.
        imports: [FormField, NgxFormField],
        componentProperties: { field: invalidField },
      },
    );

    const wrapper = container.querySelector('ngx-form-field-wrapper');
    expect(wrapper).toHaveAttribute(
      'data-ngx-signal-form-control-kind',
      'switch',
    );
  });
});
