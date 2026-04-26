import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  type Signal,
} from '@angular/core';
import {
  FormField,
  form,
  required,
  schema,
  type ValidationError,
} from '@angular/forms/signals';
import {
  generateErrorId,
  NgxSignalFormToolkit,
} from '@ngx-signal-forms/toolkit';
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

  // Regression for PR #30: when `NgxFormFieldset` (or any host) binds
  // `[errors]` without `[formField]`, the headless directive must short-circuit
  // showErrors to true so the caller's pre-aggregated error list renders.
  // Previously, the bridge slot set unconditionally in the constructor caused
  // the guard `!field() && !#bridgedFieldState()` to fall through to the
  // strategy-based path and hide the errors.
  it('direct-errors mode (no formField) renders aggregated errors', async () => {
    @Component({
      selector: 'test-direct-errors',
      imports: [NgxFormFieldError],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
        <ngx-form-field-error [errors]="aggregatedErrors" fieldName="address" />
      `,
    })
    class TestDirectErrorsComponent {
      readonly aggregatedErrors: Signal<readonly ValidationError[]> = computed(
        () => [
          { kind: 'required', message: 'Street is required' },
          { kind: 'required', message: 'City is required' },
        ],
      );
    }

    await render(TestDirectErrorsComponent);

    const alert = screen.queryByRole('alert');
    expect(alert).toBeTruthy();
    expect(alert?.textContent).toContain('Street is required');
    expect(alert?.textContent).toContain('City is required');
  });

  it('direct-errors mode renders empty state when array is empty', async () => {
    @Component({
      selector: 'test-direct-errors-empty',
      imports: [NgxFormFieldError],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
        <ngx-form-field-error [errors]="aggregatedErrors" fieldName="address" />
      `,
    })
    class TestEmptyDirectErrorsComponent {
      readonly aggregatedErrors: Signal<readonly ValidationError[]> = computed(
        () => [],
      );
    }

    const { container } = await render(TestEmptyDirectErrorsComponent);

    // Live region stays in DOM (WCAG 4.1.3) but is hidden + empty
    const alertEl = container.querySelector('[role="alert"]');
    expect(alertEl).toBeTruthy();
    expect(alertEl?.hasAttribute('hidden')).toBe(true);
    expect(alertEl?.textContent?.trim()).toBe('');
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
    // ID must be deterministic and equal to generateErrorId('email').
    expect(alertEl?.getAttribute('id')).toBe(generateErrorId('email'));
  });
});
