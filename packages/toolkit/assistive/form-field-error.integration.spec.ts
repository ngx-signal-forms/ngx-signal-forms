import { Component, signal } from '@angular/core';
import { FormField, form, required, schema } from '@angular/forms/signals';
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';
import { NgxFormFieldWrapper } from '@ngx-signal-forms/toolkit/form-field';
import { render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { NgxFormFieldError } from './form-field-error';

/**
 * Integration test: render NgxFormFieldError with a real Signal Form
 * and assert that errors are NOT shown initially when using 'on-touch' strategy.
 */
describe('NgxFormFieldError (integration)', () => {
  it('does not show errors on initial render with on-touch strategy', async () => {
    // Define a test component to ensure DI context for Signal Forms
    @Component({
      selector: 'test-form-error',
      imports: [FormField, NgxSignalFormToolkit, NgxFormFieldError],
      template: `
        <form
          [formRoot]="contactForm"
          ngxSignalForm
          [errorStrategy]="errorStrategy"
        >
          <input id="email" [formField]="contactForm.email" />
          <ngx-form-field-error
            [formField]="contactForm.email"
            fieldName="email"
          />
        </form>
      `,
    })
    class TestFormErrorComponent {
      readonly model = signal({ email: '' });
      readonly errorStrategy = 'on-touch';
      readonly contactForm = form(
        this.model,
        schema((path) => {
          required(path.email, { message: 'Email is required' });
        }),
      );
    }

    await render(TestFormErrorComponent);

    const alert = screen.queryByRole('alert');
    expect(alert).toBeFalsy();
  });

  /**
   * Regression test for the published-package token split bug.
   *
   * **What this test covers:** Angular DI correctly resolves `NGX_SIGNAL_FORM_FIELD_CONTEXT`
   * from the parent wrapper so that `ngx-form-field-error` inherits the field name without
   * an explicit `fieldName` input when the form context comes from the public root entry point.
   *
   * **Why this matters:** The toolkit intentionally exposes a single shared public entry point
   * for these core runtime symbols. Secondary entry points consume that root module so packaged
   * builds share the same token instances instead of duplicating them behind `./core`.
   */
  it('inherits fieldName from parent ngx-form-field-wrapper without explicit fieldName input', async () => {
    @Component({
      selector: 'test-wrapper-context',
      imports: [FormField, NgxSignalFormToolkit, NgxFormFieldWrapper],
      template: `
        <form [formRoot]="contactForm" ngxSignalForm errorStrategy="immediate">
          <ngx-form-field-wrapper [formField]="contactForm.email">
            <label for="email">Email</label>
            <input id="email" [formField]="contactForm.email" />
          </ngx-form-field-wrapper>
        </form>
      `,
    })
    class TestWrapperContextComponent {
      readonly model = signal({ email: '' });
      readonly contactForm = form(
        this.model,
        schema((path) => {
          required(path.email, { message: 'Email is required' });
        }),
      );
    }

    await render(TestWrapperContextComponent);

    /// The wrapper uses 'immediate' strategy, so the error should be visible right away
    const alert = screen.queryByRole('alert');
    expect(alert).toBeTruthy();
    expect(alert?.textContent).toContain('Email is required');
  });
});
