import {
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
  validate,
  type ValidationError,
} from '@angular/forms/signals';
import {
  generateErrorId,
  NgxSignalFormToolkit,
  provideNgxSignalFormsConfig,
} from '@ngx-signal-forms/toolkit';
import { NgxHeadlessErrorState } from '@ngx-signal-forms/toolkit/headless';
import {
  NgxFormFieldWrapper,
  NgxFormFieldset,
} from '@ngx-signal-forms/toolkit/form-field';
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

  hostDirectives: [
    {
      directive: NgxHeadlessErrorState,
      inputs: ['field', 'strategy', 'submittedStatus'],
    },
  ],
  template: `
    @if (headless.shouldShowErrors() && headless.hasErrors()) {
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

    // Before touch: neither surface should show errors. The alert shell
    // stays mounted (WCAG 4.1.3) but must be empty.
    expect(screen.queryByRole('alert')?.textContent?.trim() ?? '').toBe('');
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

    // Both surfaces clear together. The alert shell stays mounted (WCAG
    // 4.1.3) but must be empty.
    expect(screen.queryByRole('alert')?.textContent?.trim() ?? '').toBe('');
    expect(screen.queryByTestId('custom-error')).toBeFalsy();
  });

  // Regression for PR #30: when `NgxFormFieldset` (or any host) binds
  // `[errors]` without `[formField]`, the headless directive must short-circuit
  // shouldShowErrors to true so the caller's pre-aggregated error list renders.
  // Previously, the bridge slot set unconditionally in the constructor caused
  // the guard `!field() && !#bridgedFieldState()` to fall through to the
  // strategy-based path and hide the errors.
  it('direct-errors mode (no formField) renders aggregated errors', async () => {
    @Component({
      selector: 'test-direct-errors',
      imports: [NgxFormFieldError],

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

    // Live region stays in DOM (WCAG 4.1.3) but is empty
    const alertEl = container.querySelector('[role="alert"]');
    expect(alertEl).toBeTruthy();
    expect(alertEl?.hasAttribute('hidden')).toBe(false);
    expect(alertEl?.textContent?.trim()).toBe('');
  });

  it('NgxFormFieldError errorId matches generateErrorId output', async () => {
    @Component({
      selector: 'test-id-parity',
      imports: [FormField, NgxSignalFormToolkit, NgxFormFieldError],

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

/**
 * Cross-surface anti-drift guard for issue #264: `NgxFormFieldWrapper`,
 * `NgxFormFieldset`, and `NgxFormFieldError` each used to resolve
 * `warningStrategy="inherit"` through their own copy of the cascade. With no
 * `[ngxSignalForm]` host to inherit from, that produced THREE different
 * answers (`'on-touch'` from the wrapper and fieldset, which never consulted
 * `NGX_SIGNAL_FORMS_CONFIG`, vs the configured `defaultErrorStrategy` from
 * `NgxFormFieldError`, which read the wrong config key). All three now route
 * through the shared `resolveWarningStrategyFromContext()`, so this renders
 * the SAME warned-but-valid field through all three surfaces at once and
 * asserts they agree — the regression test the issue calls out as the one
 * that would have caught the original defect.
 */
describe('cross-surface: warningStrategy="inherit" with no form context (issue #264)', () => {
  it('NgxFormFieldWrapper, NgxFormFieldset, and NgxFormFieldError all resolve the same defaultWarningStrategy', async () => {
    @Component({
      selector: 'test-warning-cascade-parity',
      imports: [
        FormField,
        NgxFormFieldWrapper,
        NgxFormFieldset,
        NgxFormFieldError,
      ],
      template: `
        <!-- No [ngxSignalForm] host anywhere in this tree: 'inherit' has
             nothing to inherit from and must fall through to
             NGX_SIGNAL_FORMS_CONFIG.defaultWarningStrategy on every surface. -->
        <ngx-form-field-wrapper
          [formField]="contactForm.password"
          fieldName="wrapper-password"
          warningStrategy="inherit"
        >
          <label for="wrapper-password">Password (wrapper)</label>
          <input id="wrapper-password" [formField]="contactForm.password" />
        </ngx-form-field-wrapper>

        <fieldset
          ngxFormFieldset
          [field]="contactForm"
          fieldsetId="fieldset-password"
          warningStrategy="inherit"
          includeNestedErrors
        >
          <legend>Password (fieldset)</legend>
        </fieldset>

        <ngx-form-field-error
          [formField]="contactForm.password"
          fieldName="standalone-password"
          warningStrategy="inherit"
        />
      `,
    })
    class WarningCascadeParityHost {
      readonly #model = signal({ password: 'weak' });
      readonly contactForm = form(
        this.#model,
        schema((path) => {
          validate(path.password, (ctx) => {
            const value = ctx.value();
            if (value.length > 0 && value.length < 8) {
              return {
                kind: 'warn:weak-password',
                message: 'Consider 8+ characters',
              };
            }
            return null;
          });
        }),
      );
    }

    await render(WarningCascadeParityHost, {
      providers: [
        provideNgxSignalFormsConfig({ defaultWarningStrategy: 'immediate' }),
      ],
    });

    // All three surfaces resolved 'inherit' -> no context -> the configured
    // 'immediate' defaultWarningStrategy, so all three show the warning right
    // away, on an untouched field, with no form context anywhere in the tree.
    const statuses = await screen.findAllByRole('status');
    const withText = statuses.filter((el) =>
      el.textContent?.includes('Consider 8+ characters'),
    );
    expect(withText).toHaveLength(3);
  });

  it("falls back to the same terminal ('on-touch') by default, with no defaultWarningStrategy configured", async () => {
    @Component({
      selector: 'test-warning-cascade-parity-default',
      imports: [
        FormField,
        NgxFormFieldWrapper,
        NgxFormFieldset,
        NgxFormFieldError,
      ],
      template: `
        <ngx-form-field-wrapper
          [formField]="contactForm.password"
          fieldName="wrapper-password"
          warningStrategy="inherit"
        >
          <label for="wrapper-password">Password (wrapper)</label>
          <input id="wrapper-password" [formField]="contactForm.password" />
        </ngx-form-field-wrapper>

        <fieldset
          ngxFormFieldset
          [field]="contactForm"
          fieldsetId="fieldset-password"
          warningStrategy="inherit"
          includeNestedErrors
        >
          <legend>Password (fieldset)</legend>
        </fieldset>

        <ngx-form-field-error
          [formField]="contactForm.password"
          fieldName="standalone-password"
          warningStrategy="inherit"
        />
      `,
    })
    class WarningCascadeParityDefaultHost {
      readonly #model = signal({ password: 'weak' });
      readonly contactForm = form(
        this.#model,
        schema((path) => {
          validate(path.password, (ctx) => {
            const value = ctx.value();
            if (value.length > 0 && value.length < 8) {
              return {
                kind: 'warn:weak-password',
                message: 'Consider 8+ characters',
              };
            }
            return null;
          });
        }),
      );
    }

    await render(WarningCascadeParityDefaultHost);

    // Untouched: the shared 'on-touch' terminal keeps every surface quiet.
    // Live regions may stay mounted empty (WCAG 4.1.3) rather than being
    // absent from the DOM, so assert on content, not element count.
    for (const status of screen.queryAllByRole('status')) {
      expect(status.textContent?.trim() ?? '').toBe('');
    }

    // Touch the wrapper's control -- Angular's FieldState is shared across
    // all three projections of the same field, so touching it once flips
    // `touched()` for every surface simultaneously.
    const input = screen.getByRole('textbox');
    await userEvent.click(input);
    await userEvent.tab();

    const statuses = await screen.findAllByRole('status');
    const withText = statuses.filter((el) =>
      el.textContent?.includes('Consider 8+ characters'),
    );
    expect(withText).toHaveLength(3);
  });
});
