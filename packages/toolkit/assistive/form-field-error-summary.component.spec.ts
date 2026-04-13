import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { form, FormField, required, schema } from '@angular/forms/signals';
import type { SubmittedStatus } from '@ngx-signal-forms/toolkit';
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { NgxFormFieldErrorSummaryComponent } from './form-field-error-summary.component';

describe('NgxFormFieldErrorSummaryComponent', () => {
  it('renders entries through the composed headless directive inputs', async () => {
    @Component({
      selector: 'ngx-test-error-summary-immediate',
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
});
