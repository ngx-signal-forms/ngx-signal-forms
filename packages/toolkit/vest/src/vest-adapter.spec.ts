import { ApplicationRef, Component, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { TestBed } from '@angular/core/testing';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { create, enforce, test as vestTest, warn } from 'vest';
import { describe, expect, it, vi } from 'vitest';
import { createVestAdapter } from './vest-adapter';

describe('createVestAdapter', () => {
  it('shares one suite run across two register calls on the same path/value', async () => {
    const adapter = createVestAdapter();

    const baseSuite = create((data: { email: string }) => {
      vestTest('email', 'Email is required', () => {
        enforce(data.email).isNotBlank();
      });
      vestTest('email', 'Consider a longer email', () => {
        warn();
        enforce(data.email.length >= 12).isTruthy();
      });
    });

    let runCount = 0;
    const suite = {
      ...baseSuite,
      run(value: { email: string }) {
        runCount += 1;
        return baseSuite.run(value);
      },
    };

    @Component({
      selector: 'ngx-test-adapter-shared',
      imports: [FormField],

      template: `<input [formField]="f.email" />`,
    })
    class TestComponent {
      readonly model = signal({ email: '' });
      readonly f = form(this.model, (path) => {
        // Two registrations on the same path: one blocking, one warning-only.
        adapter.register(path, suite, { includeErrors: true });
        adapter.register(path, suite, {
          includeErrors: false,
          includeWarnings: true,
        });
      });
    }

    await render(TestComponent);
    await TestBed.inject(ApplicationRef).whenStable();

    // Both register calls must resolve to a single shared suite execution.
    expect(runCount).toBe(1);
  });

  it('emits only the async delta (sync snapshot subtracted) on completion', async () => {
    const adapter = createVestAdapter();

    // Sync result already reports the email error; the async run resolves the
    // SAME result. Without delta subtraction the field would surface the error
    // twice (sync pass + async pass).
    const baseSuite = create((data: { email: string }) => {
      vestTest('email', 'Email is required', () => {
        enforce(data.email).isNotBlank();
      });
    });

    const asyncSuite = {
      ...baseSuite,
      run(value: { email: string }) {
        const syncResult = baseSuite.run(value);
        // Dual-shaped: synchronous SuiteResult AND a thenable resolving to it.
        return Object.assign(Promise.resolve(syncResult), syncResult);
      },
    };

    @Component({
      selector: 'ngx-test-adapter-delta',
      imports: [FormField],

      template: `<input [formField]="f.email" />`,
    })
    class TestComponent {
      readonly model = signal({ email: '' });
      readonly f = form(this.model, (path) => {
        adapter.register(path, asyncSuite);
      });
    }

    const { fixture } = await render(TestComponent);
    await TestBed.inject(ApplicationRef).whenStable();
    await Promise.resolve();
    await TestBed.inject(ApplicationRef).whenStable();

    const errors = fixture.componentInstance.f.email().errors();
    // The async completion must subtract the sync snapshot: exactly one error.
    expect(errors).toHaveLength(1);
    expect(errors[0]?.message).toBe('Email is required');
  });

  it('logs in dev and never flips invalid when a warning-only adapter run rejects', async () => {
    const adapter = createVestAdapter();
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const rejectedRun = Promise.reject(new Error('Warning suite crashed'));
    void rejectedRun.catch(() => {});

    const warningShape = create((data: { amount: string }) => {
      vestTest('amount', 'Looks suspicious', () => {
        warn();
        enforce(data.amount).isNotBlank();
      });
    });
    const failingWarningSuite = {
      ...warningShape,
      run: () => rejectedRun,
    };

    @Component({
      selector: 'ngx-test-adapter-warn-reject',
      imports: [FormField],

      template: `<input [formField]="f.amount" />`,
    })
    class TestComponent {
      // Valid initial value so no sibling sync error gates the async run.
      readonly model = signal({ amount: 'ok-value' });
      readonly f = form(this.model, (path) => {
        adapter.register(path, failingWarningSuite, {
          includeErrors: false,
          includeWarnings: true,
        });
      });
    }

    const { fixture } = await render(TestComponent);
    const user = userEvent.setup();
    await user.click(screen.getByRole('textbox'));
    await user.tab();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(fixture.componentInstance.f.amount().errors()).toHaveLength(0);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        '[ngx-signal-forms] Vest async validation failed',
      ),
      expect.any(Error),
    );

    consoleErrorSpy.mockRestore();
  });

  it('synthesizes vest:internal-error when a blocking adapter run rejects', async () => {
    const adapter = createVestAdapter();
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const crashingSuite = {
      ...create((_data: { email: string }) => {
        vestTest('email', 'never reached', () => {
          /* sync pass pending; async run rejects */
        });
      }),
      run: () => {
        const rejected = Promise.reject(new Error('Async validator blew up'));
        void rejected.catch(() => {});
        return rejected;
      },
    };

    @Component({
      selector: 'ngx-test-adapter-block-reject',
      imports: [FormField],

      template: `<input [formField]="f.email" />`,
    })
    class TestComponent {
      readonly model = signal({ email: '' });
      readonly f = form(this.model, (path) => {
        adapter.register(path, crashingSuite, { includeErrors: true });
      });
    }

    const { fixture } = await render(TestComponent);
    const user = userEvent.setup();
    await user.click(screen.getByRole('textbox'));
    await user.type(screen.getByRole('textbox'), 'x');
    await user.tab();
    await TestBed.inject(ApplicationRef).whenStable();
    await Promise.resolve();
    await Promise.resolve();
    await TestBed.inject(ApplicationRef).whenStable();

    const rootErrors = fixture.componentInstance.f().errors();
    const emailErrors = fixture.componentInstance.f.email().errors();
    const allErrors = [...rootErrors, ...emailErrors];
    expect(allErrors.some((e) => e.kind === 'vest:internal-error')).toBe(true);
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('runVestSuite returns the cached run for identical (suite, fieldTree, value, focus) and a fresh run when value/focus changes', async () => {
    const adapter = createVestAdapter();

    let runCount = 0;
    const baseSuite = create((data: { email: string }) => {
      vestTest('email', 'Email is required', () => {
        enforce(data.email).isNotBlank();
      });
    });
    const suite = {
      ...baseSuite,
      run(value: { email: string }) {
        runCount += 1;
        return baseSuite.run(value);
      },
    };

    @Component({
      selector: 'ngx-test-adapter-runvestsuite',
      imports: [FormField],

      template: `<input [formField]="f.email" />`,
    })
    class TestComponent {
      readonly model = signal({ email: '' });
      readonly f = form(this.model);
    }

    const { fixture } = await render(TestComponent);
    const fieldTree = fixture.componentInstance.f.email;

    const valueA = { email: '' };
    const first = adapter.runVestSuite({ suite, fieldTree, value: valueA });
    expect(first.fromCache).toBe(false);
    expect(runCount).toBe(1);

    // Identical tuple -> cached, no extra run.
    const second = adapter.runVestSuite({ suite, fieldTree, value: valueA });
    expect(second.fromCache).toBe(true);
    expect(second.runResult).toBe(first.runResult);
    expect(runCount).toBe(1);

    // New value reference -> fresh run.
    const third = adapter.runVestSuite({
      suite,
      fieldTree,
      value: { email: '' },
    });
    expect(third.fromCache).toBe(false);
    expect(runCount).toBe(2);

    // Same value reference but a different focus key -> fresh run. The wrapped
    // suite only overrides `run` (not `only`), so a focused run does not bump
    // `runCount`; assert cache-miss semantics via `fromCache` instead.
    const valueB = { email: 'x' };
    const fourth = adapter.runVestSuite({ suite, fieldTree, value: valueB });
    expect(fourth.fromCache).toBe(false);
    expect(runCount).toBe(3);
    const fifth = adapter.runVestSuite({
      suite,
      fieldTree,
      value: valueB,
      focus: 'email',
    });
    // Different focus key for the same value -> cache miss (fresh run).
    expect(fifth.fromCache).toBe(false);
    // Re-running the identical focused tuple now hits the cache.
    const sixth = adapter.runVestSuite({
      suite,
      fieldTree,
      value: valueB,
      focus: 'email',
    });
    expect(sixth.fromCache).toBe(true);
  });
});
