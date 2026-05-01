import { Component, signal } from '@angular/core';
import { form, FormField, required, schema } from '@angular/forms/signals';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import {
  NgxSignalFormAutoAria,
  NgxSignalFormControlSemanticsDirective,
  provideFormFieldErrorRenderer,
} from '@ngx-signal-forms/toolkit';
import { describe, expect, it } from 'vitest';
import { PrimeFormFieldComponent } from '../form-field/prime-form-field';
import { PrimeFieldErrorComponent } from '../form-field/prime-field-error';

/**
 * Smoke spec for the PrimeNG reference wrapper.
 *
 * Asserts the toolkit-seam acceptance criteria from issue #49 in a Prime-shaped
 * form tree (without booting PrimeNG itself — a plain `<input>` is enough to
 * verify the seam, and avoids pulling Prime's full theme/CSS into a Node-side
 * test environment):
 *
 * 1. when the field is invalid, the Prime-flavoured error element renders
 *    (the `data-testid="prime-error"` host emitted by `PrimeFieldErrorComponent`)
 * 2. `aria-invalid='true'` is wired on the bound control by `NgxSignalFormAutoAria`
 * 3. `aria-describedby` on the bound control points at the rendered error element
 *    (the `{fieldName}-error` ID convention)
 *
 * The test deliberately uses a real `form()` schema so the renderer receives
 * live `FieldTree` state — the same path consumers exercise in production.
 */

interface FormModel {
  email: string;
}

const formSchema = schema<FormModel>((path) => {
  required(path.email, { message: 'Email is required' });
});

@Component({
  selector: 'host-cmp',
  standalone: true,
  imports: [
    FormField,
    NgxSignalFormAutoAria,
    NgxSignalFormControlSemanticsDirective,
    PrimeFormFieldComponent,
  ],
  template: `
    <prime-form-field [formField]="testForm.email" fieldName="profile-email">
      <label for="profile-email">Email</label>
      <input
        id="profile-email"
        type="email"
        [formField]="testForm.email"
        ngxSignalFormControl="input-like"
      />
    </prime-form-field>
  `,
})
class HostCmp {
  readonly testForm = form(signal<FormModel>({ email: '' }), formSchema);
}

describe('demo-primeng smoke spec', () => {
  it('renders the Prime error idiom and wires ARIA when the field is invalid', async () => {
    await render(HostCmp, {
      providers: [
        provideFormFieldErrorRenderer({ component: PrimeFieldErrorComponent }),
      ],
    });

    const input = screen.getByLabelText(/email/i);
    if (!(input instanceof HTMLInputElement)) {
      throw new Error('Expected an <input> element for the email control.');
    }

    // Touch the field so the on-touch / immediate strategy lights up. Using
    // `immediate` in the schema would also work, but a tab away from the
    // control is closer to what consumers experience in the running demo.
    await userEvent.click(input);
    await userEvent.tab();

    // (1) the Prime error element renders. PrimeFieldErrorComponent emits
    //     `<small class="p-error" data-testid="prime-error">…</small>`.
    const errorEl = await screen.findByTestId('prime-error');
    expect(errorEl).toBeInTheDocument();
    expect(errorEl.tagName).toBe('SMALL');
    expect(errorEl.classList.contains('p-error')).toBe(true);
    expect(errorEl.textContent).toContain('Email is required');

    // (2) auto-aria writes aria-invalid="true" on the bound control
    expect(input.getAttribute('aria-invalid')).toBe('true');

    // (3) aria-describedby points at the rendered error element. The
    //     {fieldName}-error convention is owned by the toolkit, so the
    //     error element's id must be `profile-email-error`.
    const describedBy = input.getAttribute('aria-describedby');
    expect(describedBy).not.toBeNull();
    expect(describedBy?.split(/\s+/)).toContain('profile-email-error');
    expect(errorEl.id).toBe('profile-email-error');
  });
});
