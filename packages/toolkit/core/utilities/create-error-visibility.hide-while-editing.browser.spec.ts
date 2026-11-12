import { ApplicationRef, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  FormField,
  email,
  form,
  required,
  schema,
} from '@angular/forms/signals';
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';
import { NgxFormFieldError } from '@ngx-signal-forms/toolkit/assistive';
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';
import { render } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';

/**
 * `on-touch` must not re-reveal an error on every keystroke after the first
 * blur: each reveal re-inserts the message into the `role="alert"` region and
 * interrupts the screen reader. While the user edits a touched control its
 * error is hidden; leaving the control or submitting re-checks it.
 * `aria-invalid` follows the same visibility, so both are asserted together.
 */
@Component({
  selector: 'ngx-test-hold-while-focused',
  imports: [FormField, NgxSignalFormToolkit, NgxFormField],
  template: `
    <form [formRoot]="testForm" ngxSignalForm errorStrategy="on-touch">
      <ngx-form-field-wrapper [formField]="testForm.email">
        <label for="email">Email</label>
        <input id="email" type="email" [formField]="testForm.email" />
      </ngx-form-field-wrapper>
      <label for="name">Name</label>
      <input id="name" [formField]="testForm.name" />
      <button type="submit">Send</button>
    </form>
  `,
})
class HoldWhileFocusedHost {
  readonly #model = signal({ email: '', name: '' });
  readonly testForm = form(
    this.#model,
    schema((path) => {
      required(path.email, { message: 'Email is required' });
      email(path.email, { message: 'Enter a valid email' });
    }),
    { submission: { action: () => Promise.resolve(null) } },
  );
}

/** Renders its error message only after `showError` is set. */
@Component({
  selector: 'ngx-test-late-error',
  imports: [FormField, NgxSignalFormToolkit, NgxFormFieldError],
  template: `
    <form [formRoot]="testForm" ngxSignalForm errorStrategy="on-touch">
      <label for="late-email">Email</label>
      <input
        id="late-email"
        [formField]="testForm.email"
        (keydown)="revealError()"
      />
      @if (showError()) {
        <ngx-form-field-error
          [formField]="testForm.email"
          fieldName="late-email"
        />
      }
    </form>
  `,
})
class LateErrorHost {
  readonly showError = signal(false);
  readonly #model = signal({ email: '' });
  readonly testForm = form(
    this.#model,
    schema((path) => {
      required(path.email, { message: 'Email is required' });
    }),
  );

  protected revealError(): void {
    this.showError.set(true);
  }
}

async function stable(): Promise<void> {
  await TestBed.inject(ApplicationRef).whenStable();
}

function alertText(): string {
  return (
    document
      .querySelector('ngx-form-field-wrapper [role="alert"]')
      ?.textContent?.trim() ?? ''
  );
}

describe('createErrorVisibility on-touch — hide while editing', () => {
  it('hides the error while the user edits and re-checks it on blur', async () => {
    await render(HoldWhileFocusedHost);
    const emailInput = page.getByRole('textbox', { name: 'Email' });

    await userEvent.click(emailInput);
    await userEvent.tab();
    await stable();
    expect(alertText()).toContain('Email is required');
    await expect.element(emailInput).toHaveAttribute('aria-invalid', 'true');

    // Typing hides the error, even while the value is still invalid.
    await userEvent.click(emailInput);
    await userEvent.type(emailInput, 'a@');
    await stable();
    expect(alertText()).toBe('');
    await expect.element(emailInput).toHaveAttribute('aria-invalid', 'false');

    // Leaving the field re-checks the value and shows the current error.
    await userEvent.tab();
    await stable();
    expect(alertText()).toContain('Enter a valid email');
    await expect.element(emailInput).toHaveAttribute('aria-invalid', 'true');
  });

  it('keeps a visible error visible when the field regains focus', async () => {
    await render(HoldWhileFocusedHost);
    const emailInput = page.getByRole('textbox', { name: 'Email' });

    await userEvent.click(emailInput);
    await userEvent.tab();
    await userEvent.click(emailInput);
    await stable();

    expect(alertText()).toContain('Email is required');
    await expect.element(emailInput).toHaveAttribute('aria-invalid', 'true');
  });

  it('shows the error when Enter submits while the field keeps focus', async () => {
    await render(HoldWhileFocusedHost);
    const emailInput = page.getByRole('textbox', { name: 'Email' });

    await userEvent.click(emailInput);
    await userEvent.type(emailInput, 'not-an-email');
    await stable();
    expect(alertText()).toBe('');

    await userEvent.keyboard('{Enter}');
    await stable();

    expect(document.activeElement?.id).toBe('email');
    expect(alertText()).toContain('Enter a valid email');
    await expect.element(emailInput).toHaveAttribute('aria-invalid', 'true');
  });

  it('shows an error rendered while its touched control already has focus', async () => {
    await render(LateErrorHost);
    const emailInput = page.getByRole('textbox', { name: 'Email' });

    await userEvent.click(emailInput);
    await userEvent.tab();
    await userEvent.click(emailInput);
    await userEvent.keyboard('{Escape}');
    await stable();

    expect(document.activeElement?.id).toBe('late-email');
    expect(document.querySelector('[role="alert"]')).toHaveTextContent(
      'Error: Email is required',
    );
  });
});
