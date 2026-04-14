import {
  ApplicationRef,
  ChangeDetectionStrategy,
  Component,
  signal,
} from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { TestBed } from '@angular/core/testing';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { create, enforce, test, warn } from 'vest';
import { describe, expect, it } from 'vitest';
import { validateVest, validateVestWarnings } from './validate-vest';

describe('validateVest', () => {
  it('maps blocking Vest failures onto a signal form field after blur', async () => {
    const suite = create((data: { email: string }) => {
      test('email', 'Email is required', () => {
        enforce(data.email).isNotBlank();
      });
    });

    @Component({
      selector: 'ngx-test-vest-error',
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

    const user = userEvent.setup();
    await user.click(screen.getByRole('textbox', { name: 'Email' }));
    await user.tab();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(screen.getByRole('alert')).toHaveTextContent('Email is required');
  });

  it('includes Vest warnings when requested', async () => {
    const suite = create((data: { password: string }) => {
      test('password', 'Consider using 12+ characters', () => {
        warn();
        enforce(data.password.trim().length >= 12).isTruthy();
      });
    });

    @Component({
      selector: 'ngx-test-vest-warning',
      imports: [FormField],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
        <form novalidate>
          <label for="password">Password</label>
          <input id="password" [formField]="signupForm.password" />
        </form>
      `,
    })
    class TestComponent {
      readonly #model = signal({ password: 'short' });
      readonly signupForm = form(this.#model, (path) => {
        validateVest(path, suite, { includeWarnings: true });
      });
    }

    const { fixture } = await render(TestComponent);

    const user = userEvent.setup();
    await user.click(screen.getByRole('textbox', { name: 'Password' }));
    await user.tab();
    await TestBed.inject(ApplicationRef).whenStable();

    const errors = fixture.componentInstance.signupForm.password().errors();
    expect(errors).toHaveLength(1);
    expect(errors[0]?.message).toBe('Consider using 12+ characters');
    expect(errors[0]?.kind).toMatch(/^warn:vest:/);
  });

  it('reuses the same Vest run for blocking errors and warnings', async () => {
    const baseSuite = create((data: { password: string }) => {
      test('password', 'Password is required', () => {
        enforce(data.password).isNotBlank();
      });

      test('password', 'Consider using 12+ characters', () => {
        warn();
        enforce(data.password.trim().length >= 12).isTruthy();
      });
    });

    let runCount = 0;
    const suite = {
      ...baseSuite,
      run(value: { password: string }) {
        runCount += 1;
        return baseSuite.run(value);
      },
    };

    @Component({
      selector: 'ngx-test-vest-shared-run',
      imports: [FormField],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
        <form novalidate>
          <label for="password">Password</label>
          <input id="password" [formField]="signupForm.password" />
        </form>
      `,
    })
    class TestComponent {
      readonly #model = signal({ password: '' });
      protected readonly signupForm = form(this.#model, (path) => {
        validateVest(path, suite, { includeWarnings: true });
      });
    }

    await render(TestComponent);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(runCount).toBe(1);
  });

  it('silently suppresses warning-only failures when the warning run rejects', async () => {
    const blockingSuite = create((data: { amount: string }) => {
      test('amount', 'Amount is required', () => {
        enforce(data.amount).isNotBlank();
      });
    });

    const rejectedRun = Promise.reject(new Error('Suite crashed'));
    void rejectedRun.catch(() => {});

    const failingWarningSuite = {
      ...blockingSuite,
      run: () => rejectedRun,
    };

    @Component({
      selector: 'ngx-test-vest-run-error',
      imports: [FormField],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
        <form novalidate>
          <label for="amount">Amount</label>
          <input id="amount" [formField]="paymentForm.amount" />
          @if (paymentForm.amount().touched() && paymentForm.amount().invalid()) {
            <p role="alert">{{ paymentForm.amount().errors()[0].message }}</p>
          }
        </form>
      `,
    })
    class TestComponent {
      readonly #model = signal({ amount: '' });
      readonly paymentForm = form(this.#model, (path) => {
        validateVest(path, blockingSuite);
        validateVestWarnings(path, failingWarningSuite);
      });
    }

    const { fixture } = await render(TestComponent);

    const user = userEvent.setup();
    await user.click(screen.getByRole('textbox', { name: 'Amount' }));
    await user.tab();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(screen.getByRole('alert')).toHaveTextContent('Amount is required');
    expect(
      fixture.componentInstance.paymentForm.amount().errors(),
    ).toHaveLength(1);
  });
});
