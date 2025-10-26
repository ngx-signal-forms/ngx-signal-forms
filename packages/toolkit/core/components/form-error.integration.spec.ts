import { Component, signal } from '@angular/core';
import { Field, form, required, schema } from '@angular/forms/signals';
import { render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { NgxSignalFormDirective } from '../directives/ngx-signal-form.directive';
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
      imports: [
        Field,
        NgxSignalFormDirective,
        NgxSignalFormErrorComponent,
      ],
      template: `
        template: `
          <form
            [ngxSignalForm]="contactForm"
            [errorStrategy]="errorStrategy"
          >
            <input id="email" [field]="contactForm.email" />
            <ngx-signal-form-error
              [field]="contactForm.email"
              fieldName="email"
            />
          </form>
        `,
      `,
    })
    class TestFormErrorComponent {
      readonly model = signal({ name: '' });
      readonly contactForm = form(
        this.model,
        schema((path) => {
          required(path.name, { message: 'Name is required' });
        }),
      );
    }

    await render(TestFormErrorComponent);

    const alert = screen.queryByRole('alert');
    expect(alert).toBeFalsy();
  });
});
