import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormField, form, required, schema } from '@angular/forms/signals';
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';
import { render } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
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
      changeDetection: ChangeDetectionStrategy.OnPush,
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
    // announcement is delivered) but be hidden + empty.
    const alertEl = container.querySelector('[role="alert"]');
    expect(alertEl).toBeTruthy();
    expect(alertEl?.hasAttribute('hidden')).toBe(true);
    expect(alertEl?.getAttribute('aria-hidden')).toBe('true');
    expect(alertEl?.textContent?.trim()).toBe('');
  });

  it('inserts content into the existing alert region after touch', async () => {
    @Component({
      selector: 'test-first-insertion',
      imports: [FormField, NgxSignalFormToolkit, NgxFormFieldError],
      changeDetection: ChangeDetectionStrategy.OnPush,
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
    expect(alertBefore?.hasAttribute('hidden')).toBe(true);

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
      changeDetection: ChangeDetectionStrategy.OnPush,
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
        schema(() => undefined),
      );
    }

    const { container } = await render(TestComponent);

    const statusEl = container.querySelector('[role="status"]');
    expect(statusEl).toBeTruthy();
    expect(statusEl?.hasAttribute('hidden')).toBe(true);
    expect(statusEl?.getAttribute('aria-hidden')).toBe('true');
    expect(statusEl?.textContent?.trim()).toBe('');
  });
});
