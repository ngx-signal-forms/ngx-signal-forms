import { Component, signal } from '@angular/core';
import { form, FormField, required, schema } from '@angular/forms/signals';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import {
  NgxSignalFormAutoAria,
  provideFormFieldErrorRenderer,
} from '@ngx-signal-forms/toolkit';
import { describe, expect, it } from 'vitest';
import { NgxPrimeFormBundle, PrimeFieldErrorComponent } from '../form-field';

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
 * 4. the wrapper falls back to `NgxFormFieldError` when no error renderer
 *    is registered (renderer-token contract)
 * 5. tier-3 field-name resolution: when `fieldName` input is omitted, the
 *    wrapper resolves to the bound control's `id` attribute
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
  imports: [FormField, NgxSignalFormAutoAria, NgxPrimeFormBundle],
  template: `
    <prime-form-field
      [ngxPrimeFormField]="testForm.email"
      fieldName="profile-email"
    >
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

@Component({
  selector: 'host-no-renderer',
  standalone: true,
  imports: [FormField, NgxSignalFormAutoAria, NgxPrimeFormBundle],
  template: `
    <prime-form-field
      [ngxPrimeFormField]="testForm.email"
      fieldName="profile-email"
    >
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
class HostNoRendererCmp {
  readonly testForm = form(signal<FormModel>({ email: '' }), formSchema);
}

@Component({
  selector: 'host-implicit-name',
  standalone: true,
  imports: [FormField, NgxSignalFormAutoAria, NgxPrimeFormBundle],
  template: `
    <!--
      No fieldName input — the wrapper must resolve via tier-3 (the bound
      control's id attribute), exercising createFieldNameResolver.
    -->
    <prime-form-field [ngxPrimeFormField]="testForm.email">
      <label for="profile-email-implicit">Email</label>
      <input
        id="profile-email-implicit"
        type="email"
        [formField]="testForm.email"
        ngxSignalFormControl="input-like"
      />
    </prime-form-field>
  `,
})
class HostImplicitNameCmp {
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

  it('falls back to NgxFormFieldError when no renderer is registered', async () => {
    await render(HostNoRendererCmp);

    const input = screen.getByLabelText(/email/i);
    if (!(input instanceof HTMLInputElement)) {
      throw new Error('Expected an <input> element for the email control.');
    }
    await userEvent.click(input);
    await userEvent.tab();

    // The Prime renderer is NOT registered; the wrapper must fall back to
    // the toolkit's `NgxFormFieldError` (rendered as `<ngx-form-field-error>`
    // host with role="alert" descendants). The Prime-specific testid must
    // therefore be absent.
    expect(screen.queryByTestId('prime-error')).toBeNull();

    // The toolkit fallback still emits a {fieldName}-error id linked through
    // aria-describedby, so the seam stays correct without any renderer.
    const describedBy = input.getAttribute('aria-describedby');
    expect(describedBy?.split(/\s+/)).toContain('profile-email-error');
  });

  it('resolves field name from the bound control id (tier-3) when input is omitted', async () => {
    await render(HostImplicitNameCmp, {
      providers: [
        provideFormFieldErrorRenderer({ component: PrimeFieldErrorComponent }),
      ],
    });

    const input = screen.getByLabelText(/email/i);
    if (!(input instanceof HTMLInputElement)) {
      throw new Error('Expected an <input> element for the email control.');
    }
    await userEvent.click(input);
    await userEvent.tab();

    const errorEl = await screen.findByTestId('prime-error');
    // The wrapper resolved field name from the bound input's id attribute,
    // so the rendered error id and the aria-describedby target both use
    // the implicit name.
    expect(errorEl.id).toBe('profile-email-implicit-error');
    const describedBy = input.getAttribute('aria-describedby');
    expect(describedBy?.split(/\s+/)).toContain('profile-email-implicit-error');
  });
});
