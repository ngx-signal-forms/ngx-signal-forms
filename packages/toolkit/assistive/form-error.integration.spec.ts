import { Component, signal } from '@angular/core';
import { FormField, form, required, schema } from '@angular/forms/signals';
import { NgxSignalFormDirective } from '@ngx-signal-forms/toolkit/core';
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
        <form [ngxSignalForm]="contactForm" [errorStrategy]="errorStrategy">
          <input id="email" [formField]="contactForm.email" />
          <ngx-signal-form-error
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
});
