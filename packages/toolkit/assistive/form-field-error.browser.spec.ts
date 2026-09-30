import { Component, signal } from '@angular/core';
import {
  FormField,
  form,
  required,
  schema,
  validate,
} from '@angular/forms/signals';
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';
import { render } from '@testing-library/angular';
import { userEvent } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { NgxFormFieldError } from './form-field-error';

/**
 * WCAG 4.1.3 (Status Messages) — the `role="alert"` live region must already
 * exist in the DOM when its content first appears, otherwise NVDA + Chrome
 * (and other AT/browser combinations) silently miss the very first
 * announcement. After the `hostDirectives` composition refactor this
 * behavior must still hold: the alert/status containers stay rendered while
 * empty and only their *content* toggles.
 */
describe('NgxFormFieldError — WCAG 4.1.3 live-region first-insertion', () => {
  it('alert container is present in DOM before the first error appears', async () => {
    @Component({
      selector: 'test-empty-live-region',
      imports: [FormField, NgxSignalFormToolkit, NgxFormFieldError],

      template: `
        <form [formRoot]="testForm" ngxSignalForm errorStrategy="on-touch">
          <input id="name" [formField]="testForm.name" />
          <ngx-form-field-error [formField]="testForm.name" fieldName="name" />
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

    const { container } = await render(TestComponent);

    // Before any interaction: the alert region must exist (so the first
    // announcement is delivered) but be empty. `aria-hidden`/`[hidden]` are
    // intentionally never toggled — see the class-level docs.
    const alertEl = container.querySelector('[role="alert"]');
    expect(alertEl).toBeTruthy();
    expect(alertEl?.hasAttribute('hidden')).toBe(false);
    expect(alertEl?.hasAttribute('aria-hidden')).toBe(false);
    expect(alertEl?.textContent?.trim()).toBe('');
  });

  it('inserts content into the existing alert region after touch', async () => {
    @Component({
      selector: 'test-first-insertion',
      imports: [FormField, NgxSignalFormToolkit, NgxFormFieldError],

      template: `
        <form [formRoot]="testForm" ngxSignalForm errorStrategy="on-touch">
          <input id="email" [formField]="testForm.email" />
          <ngx-form-field-error
            [formField]="testForm.email"
            fieldName="email"
          />
        </form>
      `,
    })
    class TestComponent {
      readonly #model = signal({ email: '' });
      readonly testForm = form(
        this.#model,
        schema((path) => {
          required(path.email, { message: 'Email is required' });
        }),
      );
    }

    const { container } = await render(TestComponent);

    const alertBefore = container.querySelector('[role="alert"]');
    expect(alertBefore).toBeTruthy();
    expect(alertBefore?.hasAttribute('hidden')).toBe(false);

    // Touch + blur to satisfy the on-touch strategy.
    const input = container.querySelector<HTMLInputElement>('input#email')!;
    await userEvent.click(input);
    await userEvent.tab();

    // Same DOM node must now expose its content (the live region was NOT
    // newly inserted — that's the WCAG 4.1.3 guarantee).
    const alertAfter = container.querySelector('[role="alert"]');
    expect(alertAfter).toBe(alertBefore);
    expect(alertAfter?.hasAttribute('hidden')).toBe(false);
    expect(alertAfter?.getAttribute('aria-hidden')).toBeNull();
    expect(alertAfter?.textContent).toContain('Email is required');
  });

  it('status (warning) container follows the same empty-region pattern', async () => {
    @Component({
      selector: 'test-status-region',
      imports: [FormField, NgxSignalFormToolkit, NgxFormFieldError],

      template: `
        <form [formRoot]="testForm" ngxSignalForm errorStrategy="on-touch">
          <input id="pwd" [formField]="testForm.pwd" />
          <ngx-form-field-error [formField]="testForm.pwd" fieldName="pwd" />
        </form>
      `,
    })
    class TestComponent {
      readonly #model = signal({ pwd: '' });
      readonly testForm = form(
        this.#model,
        schema((path) => {
          validate(path.pwd, (ctx) => {
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

    const { container } = await render(TestComponent);

    // Before any value: status region must exist (so the first
    // announcement is delivered) but be empty.
    const statusBefore = container.querySelector('[role="status"]');
    expect(statusBefore).toBeTruthy();
    expect(statusBefore?.hasAttribute('hidden')).toBe(false);
    expect(statusBefore?.hasAttribute('aria-hidden')).toBe(false);
    expect(statusBefore?.textContent?.trim()).toBe('');

    // Type a short password to trigger the `warn:weak-password` warning, then
    // blur: warnings default to 'on-touch', so the judgement only lands once
    // the user has committed the value.
    const input = container.querySelector<HTMLInputElement>('input#pwd')!;
    await userEvent.click(input);
    await userEvent.type(input, 'abc');
    await userEvent.tab();

    // Same DOM node must now expose its content (the live region was NOT
    // newly inserted — that's the WCAG 4.1.3 guarantee for status too).
    const statusAfter = container.querySelector('[role="status"]');
    expect(statusAfter).toBe(statusBefore);
    expect(statusAfter?.hasAttribute('hidden')).toBe(false);
    expect(statusAfter?.getAttribute('aria-hidden')).toBeNull();
    expect(statusAfter?.textContent).toContain('Consider 8+ characters');
  });
});

/**
 * Theme defaults. The error and warning text colors are #db1818 (5.05:1) and
 * #a16207 (4.92:1) on white, which meets WCAG 1.4.3 (4.5:1) for normal text.
 * The panel background is the soft red #fdebeb. A consumer who sets none of
 * the public tokens gets these values, and a consumer who sets a token gets
 * theirs. jsdom applies no component stylesheet, so a browser reads the
 * result.
 */
describe('NgxFormFieldError — theme defaults and token overrides', () => {
  const renderMessages = async (
    presentation: 'inline' | 'panel' = 'inline',
  ) => {
    const errors = signal([{ kind: 'required', message: 'Name is required' }]);
    const warnings = signal([
      { kind: 'warn:po-box', message: 'PO boxes may delay delivery' },
    ]);

    const { container } = await render(
      `<ngx-form-field-error
        id="errors"
        [errors]="errors"
        fieldName="name"
        presentation="${presentation}"
      />
      <ngx-form-field-error
        id="warnings"
        [errors]="warnings"
        fieldName="address"
        strategy="on-submit"
        submittedStatus="unsubmitted"
        presentation="${presentation}"
      />`,
      {
        imports: [NgxFormFieldError],
        componentProperties: { errors, warnings },
      },
    );

    const pick = (selector: string): HTMLElement => {
      const el = container.querySelector<HTMLElement>(selector);
      if (el === null) {
        throw new Error(`Expected ${selector} to render.`);
      }
      return el;
    };

    return {
      errorHost: pick('ngx-form-field-error#errors'),
      warningHost: pick('ngx-form-field-error#warnings'),
      errorMessage: pick('.ngx-form-field-error__message--error'),
      warningMessage: pick('.ngx-form-field-error__message--warning'),
      errorBox: pick('#errors .ngx-form-field-error--error'),
    };
  };

  it('draws an error message in the AA-compliant red by default', async () => {
    const { errorMessage } = await renderMessages();

    expect(getComputedStyle(errorMessage).color).toBe('rgb(219, 24, 24)');
  });

  it('draws a warning message in the AA-compliant amber by default', async () => {
    const { warningMessage } = await renderMessages();

    expect(getComputedStyle(warningMessage).color).toBe('rgb(161, 98, 7)');
  });

  it('draws an error message in the public error color token when one is set', async () => {
    const { errorHost, errorMessage } = await renderMessages();

    errorHost.style.setProperty(
      '--ngx-signal-form-error-color',
      'rgb(1, 2, 3)',
    );

    expect(getComputedStyle(errorMessage).color).toBe('rgb(1, 2, 3)');
  });

  it('draws a warning message in the public warning color token when one is set', async () => {
    const { warningHost, warningMessage } = await renderMessages();

    warningHost.style.setProperty(
      '--ngx-signal-form-warning-color',
      'rgb(4, 5, 6)',
    );

    expect(getComputedStyle(warningMessage).color).toBe('rgb(4, 5, 6)');
  });

  it('draws the panel error background in soft red by default', async () => {
    const { errorBox } = await renderMessages('panel');

    // Poll: the panel card can transition its background after it mounts.
    await expect
      .poll(() => getComputedStyle(errorBox).backgroundColor)
      .toBe('rgb(253, 235, 235)');
  });

  it('draws the panel error background in the public panel token when one is set', async () => {
    const { errorHost, errorBox } = await renderMessages('panel');

    errorHost.style.setProperty(
      '--ngx-signal-form-error-panel-bg',
      'rgb(7, 8, 9)',
    );

    await expect
      .poll(() => getComputedStyle(errorBox).backgroundColor)
      .toBe('rgb(7, 8, 9)');
  });
});
