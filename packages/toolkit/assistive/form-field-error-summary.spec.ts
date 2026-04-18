import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  email as signalEmail,
  form,
  FormField,
  required,
  schema,
} from '@angular/forms/signals';
import type { SubmittedStatus } from '@ngx-signal-forms/toolkit';
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { NgxFormFieldErrorSummary } from './form-field-error-summary';

describe('NgxFormFieldErrorSummary', () => {
  it('renders entries through the composed headless directive inputs', async () => {
    @Component({
      selector: 'ngx-test-error-summary-immediate',
      imports: [FormField, NgxFormFieldErrorSummary],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
        <input
          id="email"
          data-testid="email-input"
          [formField]="contactForm.email"
        />
        <ngx-form-field-error-summary
          [formTree]="contactForm"
          strategy="immediate"
          summaryLabel="Fix these issues"
        />
      `,
    })
    class TestComponent {
      readonly #model = signal({ email: '' });
      readonly contactForm = form(
        this.#model,
        schema((path) => {
          required(path.email, { message: 'Email is required' });
        }),
      );
    }

    const user = userEvent.setup();
    await render(TestComponent);

    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByText('Fix these issues')).toBeTruthy();

    const entry = screen.getByRole('button', {
      name: /email\s*:\s*Email is required/iu,
    });
    expect(entry).toBeTruthy();

    await user.click(entry);
    expect(document.activeElement).toBe(screen.getByTestId('email-input'));
  });

  it('respects submittedStatus passed through the composed public API', async () => {
    @Component({
      selector: 'ngx-test-error-summary-submit',
      imports: [FormField, NgxFormFieldErrorSummary],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
        <input id="email" [formField]="contactForm.email" />
        <ngx-form-field-error-summary
          [formTree]="contactForm"
          strategy="on-submit"
          [submittedStatus]="submittedStatus()"
        />
      `,
    })
    class TestComponent {
      readonly #model = signal({ email: '' });
      readonly contactForm = form(
        this.#model,
        schema((path) => {
          required(path.email, { message: 'Email is required' });
        }),
      );
      readonly submittedStatus = signal<SubmittedStatus>('unsubmitted');
    }

    const { fixture } = await render(TestComponent);

    expect(screen.queryByRole('alert')).toBeFalsy();

    fixture.componentInstance.submittedStatus.set('submitted');
    fixture.detectChanges();

    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(
      screen.getByRole('button', {
        name: /email\s*:\s*Email is required/iu,
      }),
    ).toBeTruthy();
  });

  it('defaults to the on-touch strategy when none is provided', async () => {
    @Component({
      selector: 'ngx-test-error-summary-default',
      imports: [FormField, NgxFormFieldErrorSummary],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
        <input id="email" [formField]="contactForm.email" />
        <ngx-form-field-error-summary [formTree]="contactForm" />
      `,
    })
    class TestComponent {
      readonly #model = signal({ email: '' });
      readonly contactForm = form(
        this.#model,
        schema((path) => {
          required(path.email, { message: 'Email is required' });
        }),
      );
    }

    const { fixture } = await render(TestComponent);

    // Default strategy is on-touch → no entries until a field is touched.
    expect(screen.queryByRole('alert')).toBeFalsy();

    fixture.componentInstance.contactForm.email().markAsTouched();
    fixture.detectChanges();

    expect(await screen.findByRole('alert')).toBeTruthy();
  });

  it('aggregates errors from multiple invalid fields', async () => {
    @Component({
      selector: 'ngx-test-error-summary-multi',
      imports: [FormField, NgxFormFieldErrorSummary],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
        <input id="email" [formField]="contactForm.email" />
        <input id="name" [formField]="contactForm.name" />
        <ngx-form-field-error-summary
          [formTree]="contactForm"
          strategy="immediate"
        />
      `,
    })
    class TestComponent {
      readonly #model = signal({ email: '', name: '' });
      readonly contactForm = form(
        this.#model,
        schema((path) => {
          required(path.email, { message: 'Email is required' });
          signalEmail(path.email, { message: 'Must be a valid email' });
          required(path.name, { message: 'Name is required' });
        }),
      );
    }

    await render(TestComponent);

    const buttons = screen.getAllByRole('button');
    // Two distinct fields → at least one entry per field. Duplicate
    // kind+fieldName pairs are deduplicated by the headless directive's
    // dedup logic so we just check ">=2" rather than "exactly N".
    expect(buttons.length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/Email is required/iu)).toBeTruthy();
    expect(screen.getByText(/Name is required/iu)).toBeTruthy();
  });

  it('renders nothing when the form is valid', async () => {
    @Component({
      selector: 'ngx-test-error-summary-empty',
      imports: [FormField, NgxFormFieldErrorSummary],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
        <input id="email" [formField]="contactForm.email" />
        <ngx-form-field-error-summary
          [formTree]="contactForm"
          strategy="immediate"
        />
      `,
    })
    class TestComponent {
      readonly #model = signal({ email: 'valid@example.com' });
      readonly contactForm = form(
        this.#model,
        schema((path) => {
          required(path.email, { message: 'Email is required' });
        }),
      );
    }

    await render(TestComponent);

    expect(screen.queryByRole('alert')).toBeFalsy();
    expect(screen.queryAllByRole('button').length).toBe(0);
  });

  it('focuses the bound control when an entry is activated via keyboard', async () => {
    @Component({
      selector: 'ngx-test-error-summary-keyboard',
      imports: [FormField, NgxFormFieldErrorSummary],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
        <input
          id="email"
          data-testid="email-input"
          [formField]="contactForm.email"
        />
        <ngx-form-field-error-summary
          [formTree]="contactForm"
          strategy="immediate"
        />
      `,
    })
    class TestComponent {
      readonly #model = signal({ email: '' });
      readonly contactForm = form(
        this.#model,
        schema((path) => {
          required(path.email, { message: 'Email is required' });
        }),
      );
    }

    const user = userEvent.setup();
    await render(TestComponent);

    const entry = screen.getByRole('button', {
      name: /Email is required/iu,
    });

    // Tab to the entry button, then Enter activates it (native button
    // behaviour; we rely on the browser's click synthesis on Enter/Space).
    entry.focus();
    await user.keyboard('{Enter}');
    expect(document.activeElement).toBe(screen.getByTestId('email-input'));

    // Re-focus and try Space — also synthesises a click on native buttons.
    entry.focus();
    await user.keyboard(' ');
    expect(document.activeElement).toBe(screen.getByTestId('email-input'));
  });

  it('moves focus to the summary host the first time entries appear (WCAG 2.4.3 + 3.3.1)', async () => {
    /**
     * GOV.UK / WAI error-summary pattern: when the summary surfaces, focus
     * should move to it programmatically so screen reader users hear the
     * announcement and arrive at the summary instead of being stranded
     * wherever they were before submit. Subsequent entry-list mutations
     * must NOT steal focus a second time.
     */
    @Component({
      selector: 'ngx-test-error-summary-autofocus',
      imports: [FormField, NgxFormFieldErrorSummaryComponent],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
        <input id="email" [formField]="contactForm.email" />
        <ngx-form-field-error-summary
          [formTree]="contactForm"
          strategy="on-submit"
          [submittedStatus]="submittedStatus()"
        />
      `,
    })
    class TestComponent {
      readonly #model = signal({ email: '' });
      readonly contactForm = form(
        this.#model,
        schema((path) => {
          required(path.email, { message: 'Email is required' });
        }),
      );
      readonly submittedStatus = signal<SubmittedStatus>('unsubmitted');
    }

    const { fixture } = await render(TestComponent);

    // Before submit there are no entries, so the summary is hidden and
    // focus is wherever the test framework left it (typically <body>).
    expect(screen.queryByRole('alert')).toBeFalsy();

    // Submit triggers the on-submit strategy → entries appear → host
    // should receive focus on the next render pass.
    fixture.componentInstance.submittedStatus.set('submitted');
    fixture.detectChanges();
    await fixture.whenStable();

    const summaryHost = await screen.findByRole('alert');
    // The role="alert" lives on a child div inside the focus-target host.
    // Walk up to the ngx-form-field-error-summary element — that is what
    // carries `tabindex="-1"` and receives the programmatic focus call.
    const focusTarget = summaryHost.closest('ngx-form-field-error-summary');
    expect(focusTarget).toBeInstanceOf(HTMLElement);
    expect(focusTarget?.getAttribute('tabindex')).toBe('-1');
    expect(document.activeElement).toBe(focusTarget);
  });

  it('does not focus the summary when [autoFocus]="false"', async () => {
    @Component({
      selector: 'ngx-test-error-summary-no-autofocus',
      imports: [FormField, NgxFormFieldErrorSummaryComponent],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
        <input
          id="email"
          data-testid="email-input"
          [formField]="contactForm.email"
        />
        <ngx-form-field-error-summary
          [formTree]="contactForm"
          strategy="on-submit"
          [autoFocus]="false"
          [submittedStatus]="submittedStatus()"
        />
      `,
    })
    class TestComponent {
      readonly #model = signal({ email: '' });
      readonly contactForm = form(
        this.#model,
        schema((path) => {
          required(path.email, { message: 'Email is required' });
        }),
      );
      readonly submittedStatus = signal<SubmittedStatus>('unsubmitted');
    }

    const { fixture } = await render(TestComponent);

    // Move focus to a known, non-summary element so we can detect theft.
    const input = screen.getByTestId('email-input');
    input.focus();
    expect(document.activeElement).toBe(input);

    fixture.componentInstance.submittedStatus.set('submitted');
    fixture.detectChanges();
    await fixture.whenStable();

    // Summary is visible but focus must remain on the input.
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(document.activeElement).toBe(input);
  });

  it('exposes role="alert" without redundant aria-live/aria-atomic', async () => {
    @Component({
      selector: 'ngx-test-error-summary-aria',
      imports: [FormField, NgxFormFieldErrorSummary],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
        <input id="email" [formField]="contactForm.email" />
        <ngx-form-field-error-summary
          [formTree]="contactForm"
          strategy="immediate"
        />
      `,
    })
    class TestComponent {
      readonly #model = signal({ email: '' });
      readonly contactForm = form(
        this.#model,
        schema((path) => {
          required(path.email, { message: 'Email is required' });
        }),
      );
    }

    await render(TestComponent);

    const alert = screen.getByRole('alert');
    expect(alert.getAttribute('role')).toBe('alert');
    expect(alert.hasAttribute('aria-live')).toBe(false);
    expect(alert.hasAttribute('aria-atomic')).toBe(false);
  });
});
