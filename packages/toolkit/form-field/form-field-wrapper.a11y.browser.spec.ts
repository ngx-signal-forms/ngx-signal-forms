import { ApplicationRef, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormField, form, required, schema } from '@angular/forms/signals';
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';
import { render } from '@testing-library/angular';
import { page, userEvent } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { NgxFormField } from './index';
import { expectNoA11yViolations } from '@ngx-signal-forms/toolkit/testing';

/**
 * WCAG 2.2 AA conformance gate for the form-field wrapper composition.
 *
 * Unlike the behavioral browser specs (which use intentionally minimal markup
 * to isolate one behavior), these fixtures exercise the toolkit primitives the
 * way consumers are meant to wire them — a labelled control inside the wrapper,
 * which auto-manages ARIA and renders its own error live region. axe scans are
 * scoped to the rendered subtree so document-level authoring rules
 * (html-has-lang, landmark-one-main, page-has-heading-one) — the host page's
 * responsibility, not the toolkit's — do not fire. Any violation here is a real
 * toolkit accessibility bug, so this spec is a hard failure by design.
 */
describe('form-field wrapper — WCAG 2.2 AA conformance', () => {
  it('a labelled text field in its initial valid state has no violations', async () => {
    @Component({
      selector: 'ngx-test-a11y-valid',

      imports: [FormField, NgxSignalFormToolkit, NgxFormField],
      template: `
        <form [formRoot]="testForm" ngxSignalForm errorStrategy="on-touch">
          <ngx-form-field-wrapper
            [formField]="testForm.email"
            fieldName="email"
          >
            <label for="email">Email address</label>
            <input id="email" type="email" [formField]="testForm.email" />
            <ngx-form-field-hint id="email-hint">
              We only use this to reply to you.
            </ngx-form-field-hint>
          </ngx-form-field-wrapper>
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
    await TestBed.inject(ApplicationRef).whenStable();

    await expect
      .element(page.getByRole('textbox', { name: 'Email address' }))
      .toBeVisible();
    await expectNoA11yViolations(container);
  });

  it('a labelled text field showing a required error has no violations', async () => {
    @Component({
      selector: 'ngx-test-a11y-error',

      imports: [FormField, NgxSignalFormToolkit, NgxFormField],
      template: `
        <form [formRoot]="testForm" ngxSignalForm errorStrategy="on-touch">
          <ngx-form-field-wrapper [formField]="testForm.name" fieldName="name">
            <label for="name">Full name</label>
            <input id="name" type="text" [formField]="testForm.name" />
          </ngx-form-field-wrapper>
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

    // Touch + blur so the on-touch strategy reveals the error live region.
    await userEvent.click(page.getByRole('textbox', { name: 'Full name' }));
    await userEvent.tab();
    await TestBed.inject(ApplicationRef).whenStable();

    await expect
      .element(page.getByRole('alert'))
      .toHaveTextContent('Name is required');
    await expectNoA11yViolations(container);
  });
});
