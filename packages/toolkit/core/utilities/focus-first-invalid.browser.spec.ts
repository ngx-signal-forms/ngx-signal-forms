import { ApplicationRef, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  FormField,
  FormRoot,
  form,
  required,
  validate,
} from '@angular/forms/signals';
import { render } from '@testing-library/angular';
import { userEvent } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { focusFirstInvalid } from './focus-first-invalid';
import { createOnInvalidHandler } from './on-invalid-handler';
import { warningError } from './warning-error';

describe('focusFirstInvalid — browser focus behavior (#785)', () => {
  it('skips a warning-only field and focuses the first field with a blocking error on failed submit', async () => {
    @Component({
      selector: 'ngx-test-focus-first-invalid-warnings',
      imports: [FormField, FormRoot],
      template: `
        <form [formRoot]="testForm">
          <label for="nickname">Nickname</label>
          <input id="nickname" type="text" [formField]="testForm.nickname" />

          <label for="email">Email</label>
          <input id="email" type="email" [formField]="testForm.email" />

          <button type="submit">Submit</button>
        </form>
      `,
    })
    class TestComponent {
      readonly #model = signal({ nickname: 'ab', email: '' });
      readonly testForm = form(
        this.#model,
        (path) => {
          validate(path.nickname, ({ value }) =>
            value().length < 5
              ? warningError('short', 'Consider a longer nickname')
              : null,
          );
          required(path.email, { message: 'Email is required' });
        },
        {
          submission: {
            action: async () => undefined,
            onInvalid: createOnInvalidHandler(),
          },
        },
      );
    }

    const { container } = await render(TestComponent);
    await TestBed.inject(ApplicationRef).whenStable();

    const submitButton = container.querySelector<HTMLButtonElement>(
      'button[type="submit"]',
    )!;
    const emailInput = container.querySelector<HTMLInputElement>('#email')!;

    await userEvent.click(submitButton);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(document.activeElement).toBe(emailInput);
  });

  it('leaves focus untouched and returns false when the form has only warnings', async () => {
    @Component({
      selector: 'ngx-test-focus-first-invalid-warnings-only',
      imports: [FormField],
      template: `
        <label for="nickname">Nickname</label>
        <input id="nickname" type="text" [formField]="testForm.nickname" />
        <button id="anchor" type="button">Anchor</button>
      `,
    })
    class TestComponent {
      readonly #model = signal({ nickname: 'ab' });
      readonly testForm = form(this.#model, (path) => {
        validate(path.nickname, ({ value }) =>
          value().length < 5
            ? warningError('short', 'Consider a longer nickname')
            : null,
        );
      });
    }

    const { container, fixture } = await render(TestComponent);
    await TestBed.inject(ApplicationRef).whenStable();

    const anchor = container.querySelector<HTMLButtonElement>('#anchor')!;
    anchor.focus();
    expect(document.activeElement).toBe(anchor);

    expect(focusFirstInvalid(fixture.componentInstance.testForm)).toBe(false);
    expect(document.activeElement).toBe(anchor);
  });
});
