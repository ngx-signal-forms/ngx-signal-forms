import {
  ApplicationRef,
  ChangeDetectionStrategy,
  Component,
  signal,
} from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { TestBed } from '@angular/core/testing';
import { render, screen } from '@testing-library/angular';
import { create, enforce, test } from 'vest';
import { describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { validateVest } from './validate-vest';

describe('validateVest browser mode', () => {
  it('runs a validateVest interaction through Vitest Browser Mode', async () => {
    const suite = create((data: { email: string }) => {
      test('email', 'Email is required', () => {
        enforce(data.email).isNotBlank();
      });
    });

    @Component({
      selector: 'ngx-test-vest-browser-mode',
      imports: [FormField],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
        <form novalidate>
          <label for="email">Email</label>
          <input id="email" [formField]="signupForm.email" />
          @if (signupForm.email().touched() && signupForm.email().invalid()) {
            <p role="alert">{{ signupForm.email().errors()[0].message }}</p>
          }
        </form>
      `,
    })
    class TestComponent {
      readonly #model = signal({ email: '' });
      protected readonly signupForm = form(this.#model, (path) => {
        validateVest(path, suite);
      });
    }

    await render(TestComponent);

    const input = screen.getByRole('textbox', { name: 'Email' });
    await page.getByRole('textbox', { name: 'Email' }).click();
    await userEvent.tab();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(input).toHaveValue('');
    await expect
      .element(page.getByRole('alert'))
      .toHaveTextContent('Email is required');
  });
});
