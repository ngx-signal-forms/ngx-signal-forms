import { Component, signal } from '@angular/core';
import {
  FormField,
  form,
  required,
  schema,
  validate,
} from '@angular/forms/signals';
import { render } from '@testing-library/angular';
import { page, userEvent } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import {
  NgxSignalFormToolkit,
  provideNgxSignalFormsConfigForComponent,
} from '@ngx-signal-forms/toolkit';
import { NgxFormFieldError } from '@ngx-signal-forms/toolkit/assistive';
import { NgxFormFieldWrapper } from './form-field-wrapper';

/**
 * Issue #264: Warning display timing with separate warning cascade.
 * Tests that warnings follow their own display strategy, independent of errors.
 */
describe('NgxFormFieldWrapper — warning display timing (issue #264)', () => {
  @Component({
    selector: 'ngx-test-warning-immediate',
    imports: [NgxFormFieldWrapper, NgxFormFieldError, FormField],
    template: `
      <ngx-form-field-wrapper
        appearance="outline"
        [formField]="field.username"
        fieldName="username"
      >
        <label for="username">Username</label>
        <input id="username" [formField]="field.username" />
      </ngx-form-field-wrapper>
    `,
  })
  class WarningImmediateComponent {
    // Field with only warnings - warnings should show immediately due to defaultWarningStrategy
    protected readonly field = form(
      signal({ username: '' }),
      schema((path) => {
        validate(path.username, (ctx) => {
          const value = ctx.value();
          if (value && value.length > 0 && value.length < 3) {
            return {
              kind: 'warn:too-short',
              message: 'Consider 3+ characters',
            };
          }
          return null;
        });
      }),
    );
  }

  @Component({
    selector: 'ngx-test-warning-on-touch',
    imports: [NgxFormFieldWrapper, NgxFormFieldError, FormField],
    template: `
      <ngx-form-field-wrapper
        appearance="outline"
        [formField]="field.email"
        fieldName="email"
      >
        <label for="email">Email</label>
        <input id="email" [formField]="field.email" />
      </ngx-form-field-wrapper>
    `,
    providers: [
      provideNgxSignalFormsConfigForComponent({
        defaultWarningStrategy: 'on-touch',
      }),
    ],
  })
  class WarningOnTouchComponent {
    // Field with only warnings - warnings should NOT show until touched
    protected readonly field = form(
      signal({ email: '' }),
      schema((path) => {
        validate(path.email, (ctx) => {
          const value = ctx.value();
          if (value && value.length > 0 && !value.includes('@')) {
            return {
              kind: 'warn:missing-at',
              message: 'Email should include @',
            };
          }
          return null;
        });
      }),
    );
  }

  @Component({
    selector: 'ngx-test-warning-on-submit',
    imports: [
      NgxFormFieldWrapper,
      NgxFormFieldError,
      FormField,
      NgxSignalFormToolkit,
    ],
    template: `
      <form [formRoot]="form" ngxSignalForm errorStrategy="on-submit">
        <ngx-form-field-wrapper
          appearance="outline"
          [formField]="form.email"
          fieldName="email"
        >
          <label for="email">Email</label>
          <input id="email" [formField]="form.email" />
        </ngx-form-field-wrapper>
        <button type="submit">Submit</button>
      </form>
    `,
    providers: [
      provideNgxSignalFormsConfigForComponent({
        defaultWarningStrategy: 'on-submit',
      }),
    ],
  })
  class WarningOnSubmitComponent {
    protected readonly form = form(
      signal({ email: '' }),
      schema((path) => {
        validate(path.email, (ctx) => {
          const value = ctx.value();
          if (value && value.length > 0 && !value.includes('@')) {
            return {
              kind: 'warn:missing-at',
              message: 'Email should include @',
            };
          }
          return null;
        });
      }),
    );
  }

  @Component({
    selector: 'ngx-test-explicit-warning-strategy',
    imports: [NgxFormFieldWrapper, NgxFormFieldError, FormField],
    template: `
      <ngx-form-field-wrapper
        appearance="outline"
        [formField]="field.password"
        fieldName="password"
        warningStrategy="immediate"
      >
        <label for="password">Password</label>
        <input id="password" [formField]="field.password" />
      </ngx-form-field-wrapper>
    `,
  })
  class ExplicitWarningStrategyComponent {
    // Explicit warningStrategy on wrapper overrides config default
    protected readonly field = form(
      signal({ password: '' }),
      schema((path) => {
        validate(path.password, (ctx) => {
          const value = ctx.value();
          if (value && value.length > 0 && value.length < 8) {
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

  @Component({
    selector: 'ngx-test-warnings-with-blocking-errors',
    imports: [NgxFormFieldWrapper, NgxFormFieldError, FormField],
    template: `
      <ngx-form-field-wrapper
        appearance="outline"
        [formField]="field.confirm"
        fieldName="confirm"
      >
        <label for="confirm">Confirm Password</label>
        <input id="confirm" [formField]="field.confirm" />
      </ngx-form-field-wrapper>
    `,
    providers: [
      provideNgxSignalFormsConfigForComponent({
        defaultWarningStrategy: 'immediate',
      }),
    ],
  })
  class WarningsWithBlockingErrorsComponent {
    // Field with both blocking errors and warnings
    // Warnings should NOT show when there are blocking errors
    protected readonly field = form(
      signal({ confirm: '' }),
      schema((path) => {
        required(path.confirm, { message: 'Confirm is required' });
        validate(path.confirm, (ctx) => {
          const value = ctx.value();
          // Return both a blocking error and a warning for short values
          if (value && value.length > 0 && value.length < 8) {
            // Return both blocking error and warning as an array
            return [
              { kind: 'too-short', message: 'Password too short' },
              { kind: 'warn:weak-password', message: 'Consider 8+ characters' },
            ];
          }
          return null;
        });
      }),
    );
  }

  it('shows warnings immediately when defaultWarningStrategy is immediate', async () => {
    const { container } = await render(WarningImmediateComponent, {
      componentProviders: [
        provideNgxSignalFormsConfigForComponent({
          defaultWarningStrategy: 'immediate',
        }),
      ],
    });

    const input = page.getByRole('textbox', { name: 'Username' });

    // Type a short value that triggers a warning
    await userEvent.type(input, 'ab');

    // Warning should be visible immediately
    const status = container.querySelector('[role="status"]');
    expect(status?.getAttribute('id')).toBe('username-warning');
    expect(status?.textContent).toContain('Consider 3+ characters');
  });

  it('hides warnings when defaultWarningStrategy is on-touch and field is untouched', async () => {
    const { container } = await render(WarningOnTouchComponent);

    const input = page.getByRole('textbox', { name: 'Email' });

    // Type a value that triggers a warning but don't blur
    await userEvent.type(input, 'test');

    // Warning should NOT be visible because field hasn't been touched
    const status = container.querySelector('[role="status"]');
    expect(status?.getAttribute('id')).not.toBe('email-warning');
  });

  it('shows warnings when defaultWarningStrategy is on-touch after blur', async () => {
    const { container } = await render(WarningOnTouchComponent);

    const input = page.getByRole('textbox', { name: 'Email' });

    // Type a value that triggers a warning
    await userEvent.type(input, 'test');

    // Blur the field
    await userEvent.tab();

    // Warning should now be visible
    const status = container.querySelector('[role="status"]');
    expect(status?.getAttribute('id')).toBe('email-warning');
    expect(status?.textContent).toContain('Email should include @');
  });

  it('hides warnings when defaultWarningStrategy is on-submit and form not submitted', async () => {
    const { container } = await render(WarningOnSubmitComponent);

    const input = page.getByRole('textbox', { name: 'Email' });

    // Type a value that triggers a warning
    await userEvent.type(input, 'test');

    // Warning should NOT be visible because form hasn't been submitted
    const status = container.querySelector('[role="status"]');
    expect(status?.getAttribute('id')).not.toBe('email-warning');
  });

  it('shows warnings when defaultWarningStrategy is on-submit after form submission', async () => {
    const { container } = await render(WarningOnSubmitComponent);

    const input = page.getByRole('textbox', { name: 'Email' });
    const submitButton = page.getByRole('button', { name: 'Submit' });

    // Type a value that triggers a warning
    await userEvent.type(input, 'test');

    // Submit the form
    await userEvent.click(submitButton);

    // Warning should now be visible
    const status = container.querySelector('[role="status"]');
    expect(status?.getAttribute('id')).toBe('email-warning');
    expect(status?.textContent).toContain('Email should include @');
  });

  it('shows warnings immediately when explicit warningStrategy is set on wrapper', async () => {
    const { container } = await render(ExplicitWarningStrategyComponent, {
      componentProviders: [
        provideNgxSignalFormsConfigForComponent({
          defaultWarningStrategy: 'on-touch',
        }),
      ],
    });

    const input = page.getByRole('textbox', { name: 'Password' });

    // Type a short password that triggers a warning
    await userEvent.type(input, 'abc');

    // Warning should be visible immediately due to explicit warningStrategy="immediate"
    const status = container.querySelector('[role="status"]');
    expect(status?.getAttribute('id')).toBe('password-warning');
    expect(status?.textContent).toContain('Consider 8+ characters');
  });

  it('hides warnings when there are blocking errors present', async () => {
    const { container } = await render(WarningsWithBlockingErrorsComponent);

    const input = page.getByRole('textbox', { name: 'Confirm Password' });

    // Touch and blur without typing anything - triggers required error
    await userEvent.click(input);
    await userEvent.tab();

    // Required error should be visible (on-touch is the default for blocking errors)
    const alert = container.querySelector('[role="alert"]');
    expect(alert?.getAttribute('id')).toBe('confirm-error');

    // Warning should NOT be visible when there are blocking errors
    const status = container.querySelector('[role="status"]');
    expect(status?.getAttribute('id')).not.toBe('confirm-warning');

    // Now type a value that triggers a warning
    await userEvent.type(input, 'abc');

    // Required error is still present, so warning should still be hidden
    expect(
      container.querySelector('[role="status"]')?.getAttribute('id'),
    ).not.toBe('confirm-warning');
  });
});
