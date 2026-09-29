import { Component, signal } from '@angular/core';
import { FormField, form, required, schema } from '@angular/forms/signals';
import { render } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { NgxFormFieldWrapper } from '../../form-field/form-field-wrapper';
import { NgxSignalFormToolkit } from '../../index';
import {
  provideNgxSignalFormsConfig,
  provideNgxSignalFormsConfigForComponent,
} from '../providers/config.provider';

/**
 * Issue #585: without `ngxSignalForm` there is no form context, so the
 * configured `defaultErrorStrategy` is the only timing a field has. The
 * wrapper already follows it. Auto-ARIA must follow it too, or a sighted
 * user sees an error that `aria-invalid` does not report yet (WCAG 4.1.2).
 *
 * The field is empty and `required`, so it is invalid from the first render
 * and nobody has touched it. Under `'immediate'` it must read as invalid
 * now; under the hard-coded `'on-touch'` fallback it would not.
 */
const emailForm = () =>
  form(
    signal({ email: '' }),
    schema((path) => {
      required(path.email, { message: 'Email is required' });
    }),
  );

@Component({
  selector: 'ngx-test-form-root-only',
  imports: [FormField, NgxSignalFormToolkit],
  template: `
    <form [formRoot]="emailForm">
      <label for="email">Email</label>
      <input id="email" [formField]="emailForm.email" />
    </form>
  `,
})
class FormRootOnlyHost {
  readonly emailForm = emailForm();
}

@Component({
  selector: 'ngx-test-component-config',
  imports: [FormField, NgxSignalFormToolkit],
  providers: [
    provideNgxSignalFormsConfigForComponent({
      defaultErrorStrategy: 'immediate',
    }),
  ],
  template: `
    <form [formRoot]="emailForm">
      <label for="email">Email</label>
      <input id="email" [formField]="emailForm.email" />
    </form>
  `,
})
class ComponentConfigHost {
  readonly emailForm = emailForm();
}

@Component({
  selector: 'ngx-test-wrapped-form-root-only',
  imports: [FormField, NgxFormFieldWrapper, NgxSignalFormToolkit],
  template: `
    <form [formRoot]="emailForm">
      <ngx-form-field-wrapper [formField]="emailForm.email">
        <label for="email">Email</label>
        <input id="email" [formField]="emailForm.email" />
      </ngx-form-field-wrapper>
    </form>
  `,
})
class WrappedFormRootOnlyHost {
  readonly emailForm = emailForm();
}

describe('auto-aria: config defaultErrorStrategy without ngxSignalForm', () => {
  it('follows an app-level defaultErrorStrategy before touch', async () => {
    const { container } = await render(FormRootOnlyHost, {
      providers: [
        provideNgxSignalFormsConfig({ defaultErrorStrategy: 'immediate' }),
      ],
    });

    const control = container.querySelector('input#email');
    expect(control?.getAttribute('aria-invalid')).toBe('true');
    expect(control?.getAttribute('aria-describedby') ?? '').toContain(
      'email-error',
    );
  });

  it('lets a component-level provider override the app level', async () => {
    const { container } = await render(ComponentConfigHost, {
      providers: [
        provideNgxSignalFormsConfig({ defaultErrorStrategy: 'on-touch' }),
      ],
    });

    const control = container.querySelector('input#email');
    expect(control?.getAttribute('aria-invalid')).toBe('true');
  });

  it('keeps the on-touch fallback when nothing is configured', async () => {
    const { container } = await render(FormRootOnlyHost);

    const control = container.querySelector('input#email');
    expect(control?.getAttribute('aria-invalid')).toBe('false');
  });

  it('matches the wrapper, which already shows the error', async () => {
    const { container } = await render(WrappedFormRootOnlyHost, {
      providers: [
        provideNgxSignalFormsConfig({ defaultErrorStrategy: 'immediate' }),
      ],
    });

    const control = container.querySelector('input#email');
    const errorRegion = container.querySelector('#email-error');

    expect(errorRegion?.textContent).toContain('Email is required');
    expect(control?.getAttribute('aria-invalid')).toBe('true');
  });
});
