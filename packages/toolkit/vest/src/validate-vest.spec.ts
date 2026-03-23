import {
  ApplicationRef,
  ChangeDetectionStrategy,
  Component,
  signal,
} from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { TestBed } from '@angular/core/testing';
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';
import { NgxSignalFormErrorComponent } from '@ngx-signal-forms/toolkit/assistive';
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { create, enforce, test, warn } from 'vest';
import { describe, expect, it } from 'vitest';
import { validateVest, validateVestWarnings } from './validate-vest';

describe('validateVest', () => {
  it('shows Vest validation errors through ngx-signal-form-error', async () => {
    const suite = create((data: { email: string }) => {
      test('email', 'Email is required', () => {
        enforce(data.email).isNotBlank();
      });
    });

    @Component({
      selector: 'ngx-test-vest-error',
      imports: [FormField, NgxSignalFormToolkit, NgxSignalFormErrorComponent],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
        <form [formRoot]="signupForm" [errorStrategy]="'immediate'">
          <label for="email">Email</label>
          <input id="email" [formField]="signupForm.email" />
          <ngx-signal-form-error [formField]="signupForm.email" fieldName="email" />
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
    await TestBed.inject(ApplicationRef).whenStable();

    expect(screen.getByRole('alert')).toHaveTextContent('Email is required');
  });

  it('works with ngx-signal-form-field-wrapper for nested subtrees', async () => {
    const suite = create((data: { city: string }) => {
      test('city', 'City is required', () => {
        enforce(data.city).isNotBlank();
      });
    });

    @Component({
      selector: 'ngx-test-vest-form-field',
      imports: [FormField, NgxSignalFormToolkit, NgxFormField],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
        <form [formRoot]="profileForm" [errorStrategy]="'immediate'">
          <ngx-signal-form-field-wrapper [formField]="profileForm.profile.city">
            <label for="city">City</label>
            <input id="city" [formField]="profileForm.profile.city" />
          </ngx-signal-form-field-wrapper>
        </form>
      `,
    })
    class TestComponent {
      readonly #model = signal({
        profile: {
          city: '',
        },
      });

      protected readonly profileForm = form(this.#model, (path) => {
        validateVest(path.profile, suite);
      });
    }

    const { container } = await render(TestComponent);
    await TestBed.inject(ApplicationRef).whenStable();

    const wrapper = container.querySelector('ngx-signal-form-field-wrapper');
    expect(wrapper).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('City is required');
  });

  it('surfaces Vest warnings through ngx-signal-form-error when enabled', async () => {
    const suite = create((data: { password: string }) => {
      test('password', 'Consider using 12+ characters', () => {
        warn();
        enforce(data.password.trim().length >= 12).isTruthy();
      });
    });

    @Component({
      selector: 'ngx-test-vest-warning',
      imports: [FormField, NgxSignalFormToolkit, NgxSignalFormErrorComponent],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
        <form [formRoot]="signupForm" [errorStrategy]="'immediate'">
          <label for="password">Password</label>
          <input id="password" [formField]="signupForm.password" />
          <ngx-signal-form-error
            [formField]="signupForm.password"
            fieldName="password"
          />
        </form>
      `,
    })
    class TestComponent {
      readonly #model = signal({ password: 'short' });
      protected readonly signupForm = form(this.#model, (path) => {
        validateVest(path, suite, { includeWarnings: true });
      });
    }

    await render(TestComponent);

    const user = userEvent.setup();
    const input = screen.getByRole('textbox', { name: 'Password' });
    await user.click(input);
    await user.tab();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(screen.getByRole('status')).toHaveTextContent(
      'Consider using 12+ characters',
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
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
      imports: [FormField, NgxSignalFormToolkit, NgxSignalFormErrorComponent],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
        <form [formRoot]="signupForm" [errorStrategy]="'immediate'">
          <label for="password">Password</label>
          <input id="password" [formField]="signupForm.password" />
          <ngx-signal-form-error
            [formField]="signupForm.password"
            fieldName="password"
          />
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
    expect(screen.getByRole('alert')).toHaveTextContent('Password is required');
  });

  it('keeps wrapper fields in warning state without marking them invalid', async () => {
    const suite = create((data: { companyName: string }) => {
      test(
        'companyName',
        'Longer names are easier for teammates to recognize',
        () => {
          warn();
          enforce(data.companyName.trim().length >= 5).isTruthy();
        },
      );
    });

    @Component({
      selector: 'ngx-test-vest-form-field-warning',
      imports: [FormField, NgxSignalFormToolkit, NgxFormField],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
        <form [formRoot]="profileForm" [errorStrategy]="'immediate'">
          <ngx-signal-form-field-wrapper [formField]="profileForm.profile.companyName">
            <label for="company-name">Company name</label>
            <input id="company-name" [formField]="profileForm.profile.companyName" />
          </ngx-signal-form-field-wrapper>
        </form>
      `,
    })
    class TestComponent {
      readonly #model = signal({
        profile: {
          companyName: 'Ac',
        },
      });

      protected readonly profileForm = form(this.#model, (path) => {
        validateVest(path.profile, suite, { includeWarnings: true });
      });
    }

    const { container } = await render(TestComponent);

    const user = userEvent.setup();
    const input = screen.getByRole('textbox', { name: 'Company name' });
    await user.click(input);
    await user.tab();
    await TestBed.inject(ApplicationRef).whenStable();

    const wrapper = container.querySelector('ngx-signal-form-field-wrapper');
    expect(wrapper).toHaveAttribute('aria-invalid', 'false');
    expect(wrapper).toHaveClass('ngx-signal-form-field-wrapper--warning');
    expect(screen.getByRole('status')).toHaveTextContent(
      'Longer names are easier for teammates to recognize',
    );
  });

  it('does not surface warnings when includeWarnings is not set', async () => {
    const suite = create((data: { username: string }) => {
      test('username', 'Username is required', () => {
        enforce(data.username).isNotBlank();
      });
      test('username', 'Consider a longer username', () => {
        warn();
        enforce(data.username.trim().length >= 8).isTruthy();
      });
    });

    @Component({
      selector: 'ngx-test-vest-no-warnings',
      imports: [FormField, NgxSignalFormToolkit, NgxSignalFormErrorComponent],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
        <form [formRoot]="loginForm" [errorStrategy]="'immediate'">
          <label for="username">Username</label>
          <input id="username" [formField]="loginForm.username" />
          <ngx-signal-form-error
            [formField]="loginForm.username"
            fieldName="username"
          />
        </form>
      `,
    })
    class TestComponent {
      readonly #model = signal({ username: 'ab' });
      protected readonly loginForm = form(this.#model, (path) => {
        validateVest(path, suite);
      });
    }

    await render(TestComponent);

    const user = userEvent.setup();
    const input = screen.getByRole('textbox', { name: 'Username' });
    await user.click(input);
    await user.tab();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('silently suppresses warnings when suite.run() rejects', async () => {
    const blockingSuite = create((data: { amount: string }) => {
      test('amount', 'Amount is required', () => {
        enforce(data.amount).isNotBlank();
      });
    });

    const failingWarningSuite = {
      ...blockingSuite,
      run: () => Promise.reject(new Error('Suite crashed')),
    };

    @Component({
      selector: 'ngx-test-vest-run-error',
      imports: [FormField, NgxSignalFormToolkit, NgxSignalFormErrorComponent],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
        <form [formRoot]="paymentForm" [errorStrategy]="'immediate'">
          <label for="amount">Amount</label>
          <input id="amount" [formField]="paymentForm.amount" />
          <ngx-signal-form-error [formField]="paymentForm.amount" fieldName="amount" />
        </form>
      `,
    })
    class TestComponent {
      readonly #model = signal({ amount: '' });
      protected readonly paymentForm = form(this.#model, (path) => {
        validateVest(path, blockingSuite);
        validateVestWarnings(path, failingWarningSuite);
      });
    }

    await render(TestComponent);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(screen.getByRole('alert')).toHaveTextContent('Amount is required');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('falls back to root field tree for warnings on non-existent paths', async () => {
    const suite = create((data: { notifications: boolean }) => {
      test(
        'missingField',
        'This targets a field that does not exist in the model',
        () => {
          warn();
          enforce(data.notifications).isTruthy();
        },
      );
    });

    @Component({
      selector: 'ngx-test-vest-missing-path',
      imports: [FormField, NgxSignalFormToolkit, NgxSignalFormErrorComponent],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
        <form [formRoot]="settingsForm" [errorStrategy]="'immediate'">
          <label for="notifications">Notifications</label>
          <input
            type="checkbox"
            id="notifications"
            [formField]="settingsForm.settings.notifications"
          />
          <ngx-signal-form-error
            [formField]="settingsForm.settings"
            fieldName="settings"
          />
        </form>
      `,
    })
    class TestComponent {
      readonly #model = signal({ settings: { notifications: false } });
      protected readonly settingsForm = form(this.#model, (path) => {
        validateVest(path.settings, suite, { includeWarnings: true });
      });
    }

    await render(TestComponent);

    const user = userEvent.setup();
    const checkbox = screen.getByRole('checkbox', { name: 'Notifications' });
    await user.click(checkbox);
    await user.click(checkbox);
    await user.tab();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(screen.getByRole('status')).toHaveTextContent(
      'This targets a field that does not exist in the model',
    );
  });

  it('handles root-level array warnings from getWarnings()', async () => {
    const suite = create((data: { bio: string }) => {
      test('bio', 'Bio should be longer', () => {
        warn();
        enforce(data.bio.trim().length >= 20).isTruthy();
      });
    });

    @Component({
      selector: 'ngx-test-vest-root-warnings',
      imports: [FormField, NgxSignalFormToolkit, NgxSignalFormErrorComponent],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
        <form [formRoot]="profileForm" [errorStrategy]="'immediate'">
          <label for="bio">Bio</label>
          <textarea id="bio" [formField]="profileForm.bio"></textarea>
          <ngx-signal-form-error [formField]="profileForm.bio" fieldName="bio" />
        </form>
      `,
    })
    class TestComponent {
      readonly #model = signal({ bio: 'Hi' });
      protected readonly profileForm = form(this.#model, (path) => {
        validateVest(path, suite, { includeWarnings: true });
      });
    }

    await render(TestComponent);

    const user = userEvent.setup();
    const textarea = screen.getByRole('textbox', { name: 'Bio' });
    await user.click(textarea);
    await user.tab();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(screen.getByRole('status')).toHaveTextContent(
      'Bio should be longer',
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
