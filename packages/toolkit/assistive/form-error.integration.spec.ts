import { Component, signal } from '@angular/core';
import { FormField, form, required, schema } from '@angular/forms/signals';
import { NgxSignalFormDirective } from '@ngx-signal-forms/toolkit/core';
import { NgxSignalFormFieldWrapperComponent } from '@ngx-signal-forms/toolkit/form-field';
import { render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { NgxSignalFormErrorComponent } from './form-error.component';

/**
 * Integration test: render NgxSignalFormErrorComponent with a real Signal Form
 * and assert that errors are NOT shown initially when using 'on-touch' strategy.
 */
describe('NgxSignalFormErrorComponent (integration)', () => {
  it('does not show errors on initial render with on-touch strategy', async () => {
    // Define a test component to ensure DI context for Signal Forms
    @Component({
      selector: 'test-form-error',
      imports: [FormField, NgxSignalFormDirective, NgxSignalFormErrorComponent],
      template: `
        <form [formRoot]="contactForm" [errorStrategy]="errorStrategy">
          <input id="email" [formField]="contactForm.email" />
          <ngx-signal-form-error [formField]="contactForm.email" fieldName="email" />
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
   * Regression test for the published-package token split bug (beta.8):
   *
   * When `form-field-wrapper` and `form-error` were imported from different entry
   * points (`@ngx-signal-forms/toolkit` vs `@ngx-signal-forms/toolkit/core`), the
   * bundled FESM artifacts contained two separate `NGX_SIGNAL_FORM_FIELD_CONTEXT`
   * token instances. The wrapper provided one instance while the error component
   * injected the other, so Angular DI could never match them and the error component
   * fell back to throwing "requires an explicit fieldName".
   *
   * After the fix all secondary entry points (form-field, assistive, headless) import
   * `NGX_SIGNAL_FORM_FIELD_CONTEXT` exclusively from `@ngx-signal-forms/toolkit/core`,
   * guaranteeing a single token identity at runtime.
   */
  it('inherits fieldName from parent ngx-signal-form-field-wrapper without explicit fieldName input', async () => {
    @Component({
      selector: 'test-wrapper-context',
      imports: [
        FormField,
        NgxSignalFormDirective,
        NgxSignalFormFieldWrapperComponent,
        NgxSignalFormErrorComponent,
      ],
      template: `
        <form [formRoot]="contactForm" errorStrategy="immediate">
          <ngx-signal-form-field-wrapper [formField]="contactForm.email">
            <label for="email">Email</label>
            <input id="email" [formField]="contactForm.email" />
          </ngx-signal-form-field-wrapper>
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
