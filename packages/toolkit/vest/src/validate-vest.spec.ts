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
import { create, enforce, group, only, test, warn } from 'vest';
import { describe, expect, it, vi } from 'vitest';
import {
  VEST_ERROR_KIND_PREFIX,
  VEST_WARNING_KIND_PREFIX,
  validateVest,
  validateVestWarnings,
} from './validate-vest';

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

  it('does not synthesize errors when a warning-only suite rejects', async () => {
    // A crashed warning suite logs a dev-mode error (spied here so the
    // assertion stays tight) but must not flip the field into an error
    // state — warnings are best-effort guidance and a broken warning
    // bridge should not block form submission.
    //
    // Uses a valid initial value so the field has no sync errors from other
    // validators; Angular Signal Forms skips async validators when another
    // validator on the same path already produces sync errors, so the
    // rejected-warning-run path only fires when the field is otherwise clean.
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const rejectedRun = Promise.reject(new Error('Suite crashed'));
    void rejectedRun.catch(() => {});

    const warningSuiteShape = create((data: { amount: string }) => {
      test('amount', 'Looks suspicious', () => {
        warn();
        enforce(data.amount).isNotBlank();
      });
    });
    const failingWarningSuite = {
      ...warningSuiteShape,
      run: () => rejectedRun,
    };

    @Component({
      selector: 'ngx-test-vest-warning-error',
      imports: [FormField],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
        <form novalidate>
          <label for="amount">Amount</label>
          <input id="amount" [formField]="paymentForm.amount" />
        </form>
      `,
    })
    class TestComponent {
      readonly #model = signal({ amount: 'ok-value' });
      readonly paymentForm = form(this.#model, (path) => {
        validateVestWarnings(path, failingWarningSuite);
      });
    }

    const { fixture } = await render(TestComponent);

    const user = userEvent.setup();
    await user.click(screen.getByRole('textbox', { name: 'Amount' }));
    await user.tab();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(
      fixture.componentInstance.paymentForm.amount().errors(),
    ).toHaveLength(0);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        '[ngx-signal-forms] Vest async validation failed',
      ),
      expect.any(Error),
    );

    consoleErrorSpy.mockRestore();
  });

  it('surfaces a synthetic blocking error when the blocking suite rejects', async () => {
    // Regression guard: previously `onError: () => []` silently swallowed
    // every async crash, so a thrown `enforce`, a broken async predicate,
    // or a rejected Promise caused the field to report valid with no
    // diagnostic. `validateVest` now maps crashes to a synthetic
    // `vest:internal-error` so the form stays invalid and tooling can
    // surface the failure.
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const crashingSuite = {
      ...create((_data: { email: string }) => {
        test('email', 'never reached', () => {
          /* no-op — the sync pass is pending, the async run rejects */
        });
      }),
      run: () => {
        const rejected = Promise.reject(new Error('Async validator blew up'));
        // Prevent unhandled-rejection noise in the test runner.
        void rejected.catch(() => {});
        return rejected;
      },
    };

    @Component({
      selector: 'ngx-test-vest-blocking-crash',
      imports: [FormField],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
        <form novalidate>
          <label for="crash-email">Email</label>
          <input id="crash-email" [formField]="f.email" />
        </form>
      `,
    })
    class TestComponent {
      readonly model = signal({ email: '' });
      readonly f = form(this.model, (path) => {
        validateVest(path, crashingSuite);
      });
    }

    const { fixture } = await render(TestComponent);

    const user = userEvent.setup();
    await user.click(screen.getByRole('textbox', { name: 'Email' }));
    await user.type(screen.getByRole('textbox', { name: 'Email' }), 'x');
    await user.tab();
    await TestBed.inject(ApplicationRef).whenStable();
    // Allow the rejected async resource to flush onError into the field tree.
    await Promise.resolve();
    await Promise.resolve();
    await TestBed.inject(ApplicationRef).whenStable();

    // The synthetic error is emitted at the validator's root fieldTree.
    // Aggregate from the root to cover either attribution.
    const rootErrors = fixture.componentInstance.f().errors();
    const emailErrors = fixture.componentInstance.f.email().errors();
    const allErrors = [...rootErrors, ...emailErrors];
    expect(allErrors.some((e) => e.kind === 'vest:internal-error')).toBe(true);
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  // Synchronous `model.set(...)` calls are collapsed by Angular's signal
  // scheduler before any effect runs, so this test does NOT exercise
  // in-flight cancellation — it only verifies that the surfaced errors
  // reflect the model's final value after a burst of updates. Coverage for
  // true "stale async runs never reach errors()" cancellation belongs in a
  // Promise-based async suite; tracked for a follow-up.
  it("surfaces the latest value's result after a burst of synchronous updates", async () => {
    const baseSuite = create((data: { username: string }) => {
      test('username', 'Username must be at least 3 characters', () => {
        enforce(data.username.length >= 3).isTruthy();
      });
    });

    @Component({
      selector: 'ngx-test-vest-rapid',
      imports: [FormField],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
        <form novalidate>
          <input [formField]="signupForm.username" />
        </form>
      `,
    })
    class TestComponent {
      readonly model = signal({ username: '' });
      readonly signupForm = form(this.model, (path) => {
        validateVest(path, baseSuite);
      });
    }

    const { fixture } = await render(TestComponent);
    const component = fixture.componentInstance;

    // Trigger three rapid changes.
    component.model.set({ username: 'a' });
    component.model.set({ username: 'ab' });
    component.model.set({ username: 'validName' });
    await TestBed.inject(ApplicationRef).whenStable();

    // Only the latest value's result should drive the surfaced errors.
    expect(component.signupForm.username().errors()).toHaveLength(0);

    // Now flip back to an invalid value and confirm the latest result surfaces.
    component.model.set({ username: 'a' });
    await TestBed.inject(ApplicationRef).whenStable();
    expect(component.signupForm.username().errors()).toHaveLength(1);
    expect(component.signupForm.username().errors()[0]?.message).toBe(
      'Username must be at least 3 characters',
    );
  });

  it('maps nested-path Vest failures onto the nested field', async () => {
    const suite = create((data: { user: { email: string } }) => {
      test('user.email', 'Email is required', () => {
        enforce(data.user.email).isNotBlank();
      });
    });

    @Component({
      selector: 'ngx-test-vest-nested',
      imports: [FormField],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
        <form novalidate>
          <label for="email">Email</label>
          <input id="email" [formField]="signupForm.user.email" />
        </form>
      `,
    })
    class TestComponent {
      readonly model = signal({ user: { email: '' } });
      readonly signupForm = form(this.model, (path) => {
        validateVest(path, suite);
      });
    }

    const { fixture } = await render(TestComponent);
    await TestBed.inject(ApplicationRef).whenStable();

    const nestedErrors = fixture.componentInstance.signupForm.user
      .email()
      .errors();
    expect(nestedErrors).toHaveLength(1);
    expect(nestedErrors[0]?.message).toBe('Email is required');
  });

  it('maps array-index Vest failures onto the indexed field', async () => {
    const suite = create((data: { items: Array<{ sku: string }> }) => {
      data.items.forEach((item, index) => {
        test(`items.${index}.sku`, 'SKU is required', () => {
          enforce(item.sku).isNotBlank();
        });
      });
    });

    @Component({
      selector: 'ngx-test-vest-array',
      imports: [FormField],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
        <form novalidate>
          <label for="sku0">SKU</label>
          <input id="sku0" [formField]="orderForm.items[0].sku" />
        </form>
      `,
    })
    class TestComponent {
      readonly model = signal({ items: [{ sku: '' }] });
      readonly orderForm = form(this.model, (path) => {
        validateVest(path, suite);
      });
    }

    const { fixture } = await render(TestComponent);
    await TestBed.inject(ApplicationRef).whenStable();

    const skuErrors = fixture.componentInstance.orderForm.items[0]
      .sku()
      .errors();
    expect(skuErrors).toHaveLength(1);
    expect(skuErrors[0]?.message).toBe('SKU is required');
  });

  it('surfaces warnings and errors together from the same Vest run', async () => {
    // Use distinct fields so Vest does not short-circuit on the blocking
    // failure before the warning test body runs.
    const suite = create((data: { email: string; password: string }) => {
      test('email', 'Email is required', () => {
        enforce(data.email).isNotBlank();
      });
      test('password', 'Consider using 12+ characters', () => {
        warn();
        enforce(data.password.trim().length >= 12).isTruthy();
      });
    });

    @Component({
      selector: 'ngx-test-vest-mixed',
      imports: [FormField],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
        <form novalidate>
          <input [formField]="signupForm.email" />
          <input [formField]="signupForm.password" />
        </form>
      `,
    })
    class TestComponent {
      readonly model = signal({ email: '', password: 'short' });
      readonly signupForm = form(this.model, (path) => {
        validateVest(path, suite, { includeWarnings: true });
      });
    }

    const { fixture } = await render(TestComponent);
    await TestBed.inject(ApplicationRef).whenStable();

    const emailErrors = fixture.componentInstance.signupForm.email().errors();
    const passwordErrors = fixture.componentInstance.signupForm
      .password()
      .errors();
    expect(emailErrors).toHaveLength(1);
    expect(emailErrors[0]?.kind.startsWith(VEST_ERROR_KIND_PREFIX)).toBe(true);
    expect(passwordErrors).toHaveLength(1);
    expect(passwordErrors[0]?.kind.startsWith(VEST_WARNING_KIND_PREFIX)).toBe(
      true,
    );
  });

  it('propagates Vest group() failures onto the correct field', async () => {
    const suite = create((data: { email: string }) => {
      group('signUp', () => {
        test('email', 'Email is required', () => {
          enforce(data.email).isNotBlank();
        });
      });
    });

    @Component({
      selector: 'ngx-test-vest-group',
      imports: [FormField],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
        <form novalidate>
          <label for="email">Email</label>
          <input id="email" [formField]="signupForm.email" />
        </form>
      `,
    })
    class TestComponent {
      readonly model = signal({ email: '' });
      readonly signupForm = form(this.model, (path) => {
        validateVest(path, suite);
      });
    }

    const { fixture } = await render(TestComponent);
    await TestBed.inject(ApplicationRef).whenStable();

    const errors = fixture.componentInstance.signupForm.email().errors();
    expect(errors).toHaveLength(1);
    expect(errors[0]?.message).toBe('Email is required');
  });

  it('resets suite state on destroy when resetOnDestroy is enabled', async () => {
    const baseSuite = create((data: { email: string }) => {
      test('email', 'Email is required', () => {
        enforce(data.email).isNotBlank();
      });
    });

    let resetCount = 0;
    const suite = {
      ...baseSuite,
      reset: () => {
        resetCount += 1;
        baseSuite.reset();
      },
    };

    @Component({
      selector: 'ngx-test-vest-reset',
      imports: [FormField],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
        <form novalidate>
          <label for="email">Email</label>
          <input id="email" [formField]="signupForm.email" />
        </form>
      `,
    })
    class TestComponent {
      readonly model = signal({ email: '' });
      readonly signupForm = form(this.model, (path) => {
        validateVest(path, suite, { resetOnDestroy: true });
      });
    }

    const { fixture } = await render(TestComponent);
    await TestBed.inject(ApplicationRef).whenStable();
    fixture.destroy();

    expect(resetCount).toBe(1);
  });

  it('does not leak suite state across mounts when resetOnDestroy is set', async () => {
    const emailCalls: string[] = [];
    const baseSuite = create((data: { email: string }) => {
      test('email', 'Email is required', () => {
        emailCalls.push(data.email);
        enforce(data.email).isNotBlank();
      });
    });

    @Component({
      selector: 'ngx-test-vest-leak',
      imports: [FormField],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
        <form novalidate>
          <label for="email">Email</label>
          <input id="email" [formField]="signupForm.email" />
        </form>
      `,
    })
    class TestComponent {
      readonly model = signal({ email: '' });
      readonly signupForm = form(this.model, (path) => {
        validateVest(path, baseSuite, { resetOnDestroy: true });
      });
    }

    const first = await render(TestComponent);
    await TestBed.inject(ApplicationRef).whenStable();
    first.fixture.destroy();
    TestBed.resetTestingModule();

    const callsAfterFirst = emailCalls.length;
    const second = await render(TestComponent);
    await TestBed.inject(ApplicationRef).whenStable();

    // Second mount should have re-executed the suite (fresh run on mount).
    expect(emailCalls.length).toBeGreaterThan(callsAfterFirst);
    // And the new instance must observe required-email failure, not
    // accidentally-valid leftover state.
    expect(
      second.fixture.componentInstance.signupForm.email().errors(),
    ).toHaveLength(1);
  });

  it('drives async validation when suite.run() returns a Promise directly', async () => {
    const baseSuite = create((data: { email: string }) => {
      test('email', 'Email is required', () => {
        enforce(data.email).isNotBlank();
      });
    });

    const asyncSuite = {
      ...baseSuite,
      run(value: { email: string }) {
        return Promise.resolve(baseSuite.run(value));
      },
    };

    @Component({
      selector: 'ngx-test-vest-async-promise',
      imports: [FormField],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
        <form novalidate>
          <label for="email">Email</label>
          <input id="email" [formField]="signupForm.email" />
        </form>
      `,
    })
    class TestComponent {
      readonly model = signal({ email: '' });
      readonly signupForm = form(this.model, (path) => {
        validateVest(path, asyncSuite);
      });
    }

    const { fixture } = await render(TestComponent);
    await TestBed.inject(ApplicationRef).whenStable();

    const errors = fixture.componentInstance.signupForm.email().errors();
    expect(errors).toHaveLength(1);
    expect(errors[0]?.message).toBe('Email is required');
  });

  it('surfaces synchronous errors on the initial read without awaiting whenStable()', async () => {
    // Guards against a regression where the cache entry gated `initialResult`
    // on `!isThenable(runResult)`. Vest 6's `suite.run()` returns a
    // dual-shaped object (sync `SuiteResult` *and* thenable), so that guard
    // always skipped the sync path and forced every run through `validateAsync`.
    const suite = create((data: { email: string }) => {
      test('email', 'Email is required', () => {
        enforce(data.email).isNotBlank();
      });
    });

    @Component({
      selector: 'ngx-test-vest-sync-initial',
      imports: [FormField],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `<input [formField]="signupForm.email" />`,
    })
    class TestComponent {
      readonly model = signal({ email: '' });
      readonly signupForm = form(this.model, (path) => {
        validateVest(path, suite);
      });
    }

    const { fixture } = await render(TestComponent);

    // No `await whenStable()` — sync Vest results must surface immediately
    // via the `validateTree` pass; deferring to the async pipeline would
    // yield an empty `errors()` list on this read.
    const errors = fixture.componentInstance.signupForm.email().errors();
    expect(errors).toHaveLength(1);
    expect(errors[0]?.message).toBe('Email is required');
  });

  it('runs fewer tests in only() mode than in full-suite mode', async () => {
    // Build two suites with identical structure; one is driven via `only`
    // mode and the other runs the whole suite every time.
    const runCount = { full: 0, focused: 0 };
    const fullSuite = create((data: { email: string; name: string }) => {
      test('email', 'Email is required', () => {
        runCount.full += 1;
        enforce(data.email).isNotBlank();
      });
      test('name', 'Name is required', () => {
        runCount.full += 1;
        enforce(data.name).isNotBlank();
      });
    });

    const focusedSuite = create(
      (data: { email: string; name: string }, field?: string) => {
        only(field);
        test('email', 'Email is required', () => {
          runCount.focused += 1;
          enforce(data.email).isNotBlank();
        });
        test('name', 'Name is required', () => {
          runCount.focused += 1;
          enforce(data.name).isNotBlank();
        });
      },
    );

    @Component({
      selector: 'ngx-test-vest-full',
      imports: [FormField],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `<input [formField]="f.email" />`,
    })
    class FullComponent {
      readonly model = signal({ email: '', name: '' });
      readonly f = form(this.model, (path) => {
        validateVest(path, fullSuite);
      });
    }

    @Component({
      selector: 'ngx-test-vest-only',
      imports: [FormField],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `<input [formField]="f.email" />`,
    })
    class FocusedComponent {
      readonly model = signal({ email: '', name: '' });
      readonly f = form(this.model, (path) => {
        validateVest(path, focusedSuite, { only: () => 'email' });
      });
    }

    await render(FullComponent);
    await TestBed.inject(ApplicationRef).whenStable();
    TestBed.resetTestingModule();
    await render(FocusedComponent);
    await TestBed.inject(ApplicationRef).whenStable();

    // Focused-mode must execute strictly fewer test bodies than full-mode.
    expect(runCount.focused).toBeLessThan(runCount.full);
    expect(runCount.focused).toBeGreaterThan(0);
  });

  it('invokes suite.only(fieldName) when the suite exposes the shorthand API', async () => {
    const baseSuite = create((data: { email: string }) => {
      test('email', 'Email is required', () => {
        enforce(data.email).isNotBlank();
      });
    });

    let onlyCalls = 0;
    let onlyRunCalls = 0;
    let fallbackRunCalls = 0;
    const suite = {
      ...baseSuite,
      only(field: string | readonly string[] | false) {
        onlyCalls += 1;
        return {
          run: (value: { email: string }) => {
            onlyRunCalls += 1;
            return baseSuite.only(field).run(value);
          },
        };
      },
      run(value: { email: string }) {
        fallbackRunCalls += 1;
        return baseSuite.run(value);
      },
    };

    @Component({
      selector: 'ngx-test-vest-only-shorthand',
      imports: [FormField],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `<input [formField]="f.email" />`,
    })
    class TestComponent {
      readonly model = signal({ email: '' });
      readonly f = form(this.model, (path) => {
        validateVest(path, suite, { only: () => 'email' });
      });
    }

    await render(TestComponent);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(onlyCalls).toBeGreaterThan(0);
    expect(onlyRunCalls).toBeGreaterThan(0);
    // The shorthand path must be preferred over the full-suite fallback.
    // A regression in executeVestRun that always calls `suite.run(value,
    // fieldName)` would still pass without this assertion.
    expect(fallbackRunCalls).toBe(0);
  });

  it('produces distinct kinds for two messages sharing the first 48 chars', async () => {
    // Use distinct fields so both tests run (Vest short-circuits per field on
    // a blocking failure); we only care that long messages with the same
    // 48-char prefix hash to different kinds.
    const longPrefix = 'a'.repeat(48);
    const messageA = `${longPrefix}-alpha is required to continue signup`;
    const messageB = `${longPrefix}-bravo is required to continue signup`;

    const suite = create((data: { alpha: string; bravo: string }) => {
      test('alpha', messageA, () => {
        enforce(data.alpha).isNotBlank();
      });
      test('bravo', messageB, () => {
        enforce(data.bravo).isNotBlank();
      });
    });

    @Component({
      selector: 'ngx-test-vest-collision',
      imports: [FormField],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
        <input [formField]="f.alpha" />
        <input [formField]="f.bravo" />
      `,
    })
    class TestComponent {
      readonly model = signal({ alpha: '', bravo: '' });
      readonly f = form(this.model, (path) => {
        validateVest(path, suite);
      });
    }

    const { fixture } = await render(TestComponent);
    await TestBed.inject(ApplicationRef).whenStable();

    const alphaErrors = fixture.componentInstance.f.alpha().errors();
    const bravoErrors = fixture.componentInstance.f.bravo().errors();
    expect(alphaErrors).toHaveLength(1);
    expect(bravoErrors).toHaveLength(1);
    expect(alphaErrors[0]?.kind).not.toBe(bravoErrors[0]?.kind);
  });
});
