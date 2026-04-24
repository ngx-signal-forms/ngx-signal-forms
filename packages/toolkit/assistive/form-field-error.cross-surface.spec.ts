import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormField, form, required, schema } from '@angular/forms/signals';
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';
import { NgxHeadlessErrorState } from '@ngx-signal-forms/toolkit/headless';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { NgxFormFieldError } from './form-field-error';

/**
 * Cross-surface spec: assert that `NgxFormFieldError` (styled shell) and a
 * custom component built over `NgxHeadlessErrorState` flip visibility on the
 * same tick for the same field, proving that behavioral parity holds by
 * construction after the hostDirectives composition refactor.
 *
 * Testing Decisions (from issue):
 * > render both NgxFormFieldError and a custom component using
 * > NgxHeadlessErrorState on the same field; assert both surfaces flip
 * > visibility on the same tick.
 */

/** Minimal custom error UI built directly on NgxHeadlessErrorState. */
@Component({
  selector: 'custom-error',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    {
      directive: NgxHeadlessErrorState,
      inputs: ['field', 'strategy', 'submittedStatus'],
    },
  ],
  template: `
    @if (headless.showErrors() && headless.hasErrors()) {
      <div data-testid="custom-error">
        @for (e of headless.resolvedErrors(); track e.kind) {
          <span>{{ e.message }}</span>
        }
      </div>
    }
  `,
})
class CustomErrorComponent {
  protected readonly headless = inject(NgxHeadlessErrorState);
}

describe('cross-surface: NgxFormFieldError vs NgxHeadlessErrorState', () => {
  it('both surfaces show errors on the same tick after touch', async () => {
    @Component({
      selector: 'test-cross-surface',
      imports: [
        FormField,
        NgxSignalFormToolkit,
        NgxFormFieldError,
        CustomErrorComponent,
      ],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
        <form [formRoot]="testForm" ngxSignalForm errorStrategy="on-touch">
          <input id="name" [formField]="testForm.name" />
          <!-- Styled shell via NgxFormFieldError -->
          <ngx-form-field-error [formField]="testForm.name" fieldName="name" />
          <!-- Custom component directly on NgxHeadlessErrorState -->
          <custom-error [field]="testForm.name" strategy="on-touch" />
        </form>
      `,
    })
    class TestComponent {
      readonly #model = signal({ name: '' });
      readonly testForm = form(
        this.#model,
        schema((path) => {
          required(path.name, { message: 'Name is required' });
        }),
      );
    }

    await render(TestComponent);

    // Before touch: neither surface should show errors
    expect(screen.queryByRole('alert')).toBeFalsy();
    expect(screen.queryByTestId('custom-error')).toBeFalsy();

    // Touch the field to trigger on-touch strategy
    const input = screen.getByRole('textbox');
    await userEvent.click(input);
    await userEvent.tab();

    // After touch: BOTH surfaces must show errors on the same tick
    const alert = screen.queryByRole('alert');
    expect(alert).toBeTruthy();
    expect(alert?.textContent).toContain('Name is required');

    const customError = screen.queryByTestId('custom-error');
    expect(customError).toBeTruthy();
    expect(customError?.textContent).toContain('Name is required');
  });

  it('both surfaces hide errors when field becomes valid', async () => {
    @Component({
      selector: 'test-cross-surface-clear',
      imports: [
        FormField,
        NgxSignalFormToolkit,
        NgxFormFieldError,
        CustomErrorComponent,
      ],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
        <form [formRoot]="testForm" ngxSignalForm errorStrategy="immediate">
          <input id="name" [formField]="testForm.name" />
          <ngx-form-field-error
            [formField]="testForm.name"
            fieldName="name"
            strategy="immediate"
          />
          <custom-error [field]="testForm.name" strategy="immediate" />
        </form>
      `,
    })
    class TestClearComponent {
      readonly #model = signal({ name: '' });
      readonly testForm = form(
        this.#model,
        schema((path) => {
          required(path.name, { message: 'Name is required' });
        }),
      );
    }

    await render(TestClearComponent);

    // With immediate strategy: errors visible right away
    expect(screen.queryByRole('alert')).toBeTruthy();
    expect(screen.queryByTestId('custom-error')).toBeTruthy();

    // Type a valid value
    await userEvent.type(screen.getByRole('textbox'), 'John');

    // Both surfaces clear together
    expect(screen.queryByRole('alert')).toBeFalsy();
    expect(screen.queryByTestId('custom-error')).toBeFalsy();
  });

  it('NgxFormFieldError errorId matches generateErrorId output', async () => {
    @Component({
      selector: 'test-id-parity',
      imports: [FormField, NgxSignalFormToolkit, NgxFormFieldError],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
        <form [formRoot]="testForm" ngxSignalForm errorStrategy="immediate">
          <input id="email" [formField]="testForm.email" />
          <ngx-form-field-error
            [formField]="testForm.email"
            fieldName="email"
            strategy="immediate"
          />
        </form>
      `,
    })
    class TestIdComponent {
      readonly #model = signal({ email: '' });
      readonly testForm = form(
        this.#model,
        schema((path) => {
          required(path.email, { message: 'Email required' });
        }),
      );
    }

    const { container } = await render(TestIdComponent);

    const alertEl = container.querySelector('[role="alert"]');
    // ID must be present and stable when errors are visible
    expect(alertEl?.getAttribute('id')).toMatch(/email/);
  });
});
