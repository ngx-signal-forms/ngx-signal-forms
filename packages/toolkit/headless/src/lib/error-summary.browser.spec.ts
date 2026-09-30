import { Component, signal } from '@angular/core';
import { form, FormField, required, schema } from '@angular/forms/signals';
import { render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { NgxHeadlessErrorSummary } from './error-summary';

describe('NgxHeadlessErrorSummary — focus capability (browser)', () => {
  // A summary entry must move focus to the invalid field (WCAG 3.3.1).
  // jsdom lets focus land on elements a real browser refuses, so check it here.
  it('should expose focus method on error entries', async () => {
    @Component({
      selector: 'ngx-test-summary-focus',
      imports: [FormField, NgxHeadlessErrorSummary],

      template: `
        <div>
          <input
            id="email"
            data-testid="email-input"
            [formField]="contactForm.email"
          />
          <div
            ngxHeadlessErrorSummary
            #summary="errorSummary"
            [formTree]="contactForm"
            strategy="immediate"
          >
            @for (
              entry of summary.entries();
              track entry.kind + entry.fieldName
            ) {
              <button
                type="button"
                [attr.data-testid]="'focus-' + entry.kind"
                (click)="entry.focus()"
              >
                {{ entry.message }}
              </button>
            }
          </div>
        </div>
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

    const button = screen.getByTestId('focus-required');
    expect(button).toBeTruthy();

    await userEvent.click(button);
    expect(document.activeElement).toBe(screen.getByTestId('email-input'));
  });
});
