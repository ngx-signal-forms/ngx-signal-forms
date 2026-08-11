import { ApplicationRef, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  FormField,
  form,
  required,
  schema,
  validate,
} from '@angular/forms/signals';
import type { ValidationError } from '@angular/forms/signals';
import { render } from '@testing-library/angular';
import { userEvent } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { NgxFormFieldError } from './form-field-error';
import { expectNoA11yViolations } from '@ngx-signal-forms/toolkit/testing';

/**
 * WCAG 2.2 AA conformance gate for `NgxFormFieldError` used standalone —
 * i.e. projected directly next to a plain `[formField]` input rather than
 * through `NgxFormFieldWrapper`'s renderer outlet (the class doc's
 * "Simplest Usage — no NgxSignalFormToolkit needed" example). The wrapper's
 * own a11y spec already covers the composed case, so this spec is the only
 * gate on the bare component. Scanned across all three of its accessible
 * states, since blocking errors and warnings render under different
 * implicit live-region roles (alert vs status).
 */
describe('NgxFormFieldError (standalone) — WCAG 2.2 AA conformance', () => {
  it('the initial, error-free state has no violations', async () => {
    @Component({
      selector: 'ngx-test-a11y-standalone-error-empty',
      imports: [FormField, NgxFormFieldError],
      template: `
        <form (submit)="$event.preventDefault()" novalidate>
          <label for="email">Email</label>
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
    await TestBed.inject(ApplicationRef).whenStable();

    expect(container.querySelector('[role="alert"]')?.textContent?.trim()).toBe(
      '',
    );
    await expectNoA11yViolations(container);
  });

  it('a visible blocking error has no violations', async () => {
    @Component({
      selector: 'ngx-test-a11y-standalone-error-blocking',
      imports: [FormField, NgxFormFieldError],
      template: `
        <form (submit)="$event.preventDefault()" novalidate>
          <label for="email">Email</label>
          <input id="email" [formField]="testForm.email" />
          <ngx-form-field-error
            [formField]="testForm.email"
            fieldName="email"
            strategy="immediate"
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
    await TestBed.inject(ApplicationRef).whenStable();

    expect(container.querySelector('[role="alert"]')?.textContent).toContain(
      'Email is required',
    );
    await expectNoA11yViolations(container);
  });

  it('a visible warning has no violations', async () => {
    @Component({
      selector: 'ngx-test-a11y-standalone-error-warning',
      imports: [FormField, NgxFormFieldError],
      template: `
        <form (submit)="$event.preventDefault()" novalidate>
          <label for="password">Password</label>
          <input id="password" [formField]="testForm.password" />
          <ngx-form-field-error
            [formField]="testForm.password"
            fieldName="password"
          />
        </form>
      `,
    })
    class TestComponent {
      readonly #model = signal({ password: '' });
      readonly testForm = form(
        this.#model,
        schema((path) => {
          validate(path.password, (ctx) => {
            const value = ctx.value();
            if (value.length > 0 && value.length < 8) {
              return {
                kind: 'warn:weak-password',
                message: 'Consider 8 or more characters',
              };
            }
            return null;
          });
        }),
      );
    }

    const { container } = await render(TestComponent);
    const input = container.querySelector<HTMLInputElement>('input#password')!;
    await userEvent.click(input);
    await userEvent.type(input, 'abc');
    await userEvent.tab();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(container.querySelector('[role="status"]')?.textContent).toContain(
      'Consider 8 or more characters',
    );
    await expectNoA11yViolations(container);
  });
});

/**
 * WCAG 2.2 AA conformance gate for `NgxFormFieldError` used in its grouped
 * `presentation="panel"` mode — rendered the way a custom summary block or
 * `NgxFormFieldset`'s notification-appearance branch composes it: an
 * `[errors]`-bound card outside a wrapper. Formerly covered by the deleted
 * `NgxFormFieldNotification`'s own a11y spec (folded into this component;
 * see `docs/migrations/v1.0.0-rc.12.md`). Scanned empty (both live regions
 * must already exist per WCAG 4.1.3), with blocking errors (role="alert"),
 * and, separately, with only warnings (role="status").
 */
describe('NgxFormFieldError (presentation="panel") — WCAG 2.2 AA conformance', () => {
  it('the empty panel has no violations', async () => {
    @Component({
      selector: 'ngx-test-a11y-panel-empty',
      imports: [NgxFormFieldError],
      template: `
        <ngx-form-field-error
          [errors]="errors"
          fieldName="shipping"
          presentation="panel"
        />
      `,
    })
    class TestComponent {
      readonly errors = signal<readonly ValidationError[]>([]);
    }

    const { container } = await render(TestComponent);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(container.querySelector('[role="alert"]')).toBeTruthy();
    expect(container.querySelector('[role="status"]')).toBeTruthy();
    await expectNoA11yViolations(container);
  });

  it('a populated error panel with a title has no violations', async () => {
    @Component({
      selector: 'ngx-test-a11y-panel-error',
      imports: [NgxFormFieldError],
      template: `
        <ngx-form-field-error
          [errors]="errors"
          fieldName="shipping"
          title="Shipping address errors"
          presentation="panel"
        />
      `,
    })
    class TestComponent {
      readonly errors = signal<readonly ValidationError[]>([
        { kind: 'required', message: 'Street is required' },
        { kind: 'required', message: 'City is required' },
      ]);
    }

    const { container } = await render(TestComponent);
    await TestBed.inject(ApplicationRef).whenStable();

    const alert = container.querySelector('[role="alert"]');
    expect(alert?.textContent).toContain('Street is required');
    expect(alert?.textContent).toContain('Shipping address errors');
    await expectNoA11yViolations(container);
  });

  it('a populated warning panel has no violations', async () => {
    @Component({
      selector: 'ngx-test-a11y-panel-warning',
      imports: [NgxFormFieldError],
      template: `
        <ngx-form-field-error
          [errors]="warnings"
          fieldName="shipping"
          presentation="panel"
        />
      `,
    })
    class TestComponent {
      readonly warnings = signal<readonly ValidationError[]>([
        { kind: 'warn:po-box', message: 'PO boxes may delay delivery' },
      ]);
    }

    const { container } = await render(TestComponent);
    await TestBed.inject(ApplicationRef).whenStable();

    const status = container.querySelector('[role="status"]');
    expect(status?.textContent).toContain('PO boxes may delay delivery');
    await expectNoA11yViolations(container);
  });
});
