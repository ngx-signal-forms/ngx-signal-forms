import { ApplicationRef, Component, signal } from '@angular/core';
import { applyEach, form, FormField } from '@angular/forms/signals';
import { TestBed } from '@angular/core/testing';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { create, enforce, group, only, test, warn } from 'vest';
import { describe, expect, it, vi } from 'vitest';
import {
  type VestResultLike,
  type VestRunnableSuite,
  VEST_ERROR_KIND_PREFIX,
  VEST_WARNING_KIND_PREFIX,
  validateVest,
  validateVestWarnings,
} from './validate-vest';
import { createVestAdapter } from './vest-adapter';

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

  it('auto-focuses the bound field via focusCurrentField with zero only() wiring', async () => {
    // `focusCurrentField` derives the Vest field name from the field this
    // validator is bound to (here `email`, from `ctx.pathKeys()`), so the
    // focused run executes only that field's test body — no hand-written
    // `only` selector required.
    const focusedFields: Array<string | readonly string[] | false> = [];
    const ranTests: string[] = [];

    const baseSuite = create((email: string, field?: string) => {
      only(field);
      test('email', 'Email is required', () => {
        ranTests.push('email');
        enforce(email).isNotBlank();
      });
      test('other', 'Other is required', () => {
        ranTests.push('other');
        enforce(email).isNotBlank();
      });
    });

    const suite = {
      ...baseSuite,
      only(field: string | readonly string[] | false) {
        focusedFields.push(field);
        return {
          run: (value: string) => {
            return baseSuite.only(field).run(value);
          },
        };
      },
    };

    @Component({
      selector: 'ngx-test-vest-autofocus',
      imports: [FormField],

      template: `<input [formField]="f.email" />`,
    })
    class TestComponent {
      readonly model = signal({ email: '' });
      readonly f = form(this.model, (path) => {
        validateVest(path.email, suite, { focusCurrentField: true });
      });
    }

    const { fixture } = await render(TestComponent);
    await TestBed.inject(ApplicationRef).whenStable();

    // The derived focus targets the bound field name only.
    expect(focusedFields).toContain('email');
    expect(focusedFields).not.toContain('other');
    // Only the focused field's test body executed.
    expect(ranTests).toContain('email');
    expect(ranTests).not.toContain('other');
    // And the focused field still surfaces its error.
    const errors = fixture.componentInstance.f.email().errors();
    expect(errors).toHaveLength(1);
    expect(errors[0]?.message).toBe('Email is required');
  });

  it('falls back to a whole-suite run when focusCurrentField is bound to the form root', async () => {
    // A root-bound validator has an empty `ctx.pathKeys()`, so the derived Vest
    // field name is `undefined` and the adapter must run the whole suite
    // (`suite.run(value)`) rather than focusing an empty field name.
    const focusedFields: Array<string | readonly string[] | false> = [];
    const fullRunValues: Array<{ email: string }> = [];
    const baseSuite = create((data: { email: string }, field?: string) => {
      only(field);
      test('email', 'Email is required', () => {
        enforce(data.email).isNotBlank();
      });
    });
    const suite = {
      ...baseSuite,
      only(field: string | readonly string[] | false) {
        focusedFields.push(field);
        return {
          run: (value: { email: string }) => baseSuite.only(field).run(value),
        };
      },
      run(value: { email: string }) {
        fullRunValues.push(value);
        return baseSuite.run(value);
      },
    };

    @Component({
      selector: 'ngx-test-vest-autofocus-root',
      imports: [FormField],

      template: `<input [formField]="f.email" />`,
    })
    class TestComponent {
      readonly model = signal({ email: '' });
      // Bound to the form root, not `path.email`.
      readonly f = form(this.model, (path) => {
        validateVest(path, suite, { focusCurrentField: true });
      });
    }

    const { fixture } = await render(TestComponent);
    await TestBed.inject(ApplicationRef).whenStable();

    // No focused run was attempted; the whole-suite `run(value)` ran instead.
    expect(focusedFields).toHaveLength(0);
    expect(fullRunValues.length).toBeGreaterThan(0);
    // The whole suite still surfaces the error on the bound field.
    const errors = fixture.componentInstance.f.email().errors();
    expect(errors).toHaveLength(1);
    expect(errors[0]?.message).toBe('Email is required');
  });

  it('derives the dotted Vest field name from a nested/array path for focusCurrentField', async () => {
    // For a validator bound to an array element's `sku` field via `applyEach`,
    // `ctx.pathKeys()` yields `['items', '0', 'sku']`, so the derived Vest
    // field name must be the dotted path `items.0.sku`.
    const focusedFields: Array<string | readonly string[] | false> = [];
    const ranTests: string[] = [];
    const baseSuite = create((sku: string, field?: string) => {
      only(field);
      test('items.0.sku', 'SKU is required', () => {
        ranTests.push('items.0.sku');
        enforce(sku).isNotBlank();
      });
      test('other', 'Other is required', () => {
        ranTests.push('other');
        enforce('').isNotBlank();
      });
    });
    const suite = {
      ...baseSuite,
      only(field: string | readonly string[] | false) {
        focusedFields.push(field);
        return {
          run: (value: string) => baseSuite.only(field).run(value),
        };
      },
    };

    @Component({
      selector: 'ngx-test-vest-autofocus-nested',
      imports: [FormField],

      template: `<input [formField]="f.items[0].sku" />`,
    })
    class TestComponent {
      readonly model = signal({ items: [{ sku: '' }] });
      // `applyEach` binds the validator to each array element's `sku` field,
      // so the bound path is `items.0.sku` for the first element.
      readonly f = form(this.model, (path) => {
        applyEach(path.items, (item) => {
          validateVest(item.sku, suite, { focusCurrentField: true });
        });
      });
    }

    const { fixture } = await render(TestComponent);
    await TestBed.inject(ApplicationRef).whenStable();

    // The derived focus is the full dotted path for the nested array field.
    expect(focusedFields).toContain('items.0.sku');
    // Only the focused field's test body executed.
    expect(ranTests).toContain('items.0.sku');
    expect(ranTests).not.toContain('other');
    // And the focused field still surfaces its error.
    const errors = fixture.componentInstance.f.items[0].sku().errors();
    expect(errors).toHaveLength(1);
    expect(errors[0]?.message).toBe('SKU is required');
  });

  it('lets an explicit only selector override focusCurrentField', async () => {
    // When both are supplied the explicit `only` selector wins, keeping
    // existing hand-wired focus working unchanged.
    const focusedFields: Array<string | readonly string[] | false> = [];
    const baseSuite = create((email: string, field?: string) => {
      only(field);
      test('email', 'Email is required', () => {
        enforce(email).isNotBlank();
      });
    });
    const suite = {
      ...baseSuite,
      only(field: string | readonly string[] | false) {
        focusedFields.push(field);
        return {
          run: (value: string) => {
            return baseSuite.only(field).run(value);
          },
        };
      },
    };

    @Component({
      selector: 'ngx-test-vest-autofocus-override',
      imports: [FormField],

      template: `<input [formField]="f.email" />`,
    })
    class TestComponent {
      readonly model = signal({ email: '' });
      readonly f = form(this.model, (path) => {
        validateVest(path.email, suite, {
          focusCurrentField: true,
          only: () => 'explicit-name',
        });
      });
    }

    await render(TestComponent);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(focusedFields).toContain('explicit-name');
    expect(focusedFields).not.toContain('email');
  });

  it('resets suite state on destroy by default (no resetOnDestroy passed)', async () => {
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
      selector: 'ngx-test-vest-reset-default',
      imports: [FormField],

      template: `<input [formField]="f.email" />`,
    })
    class TestComponent {
      readonly model = signal({ email: '' });
      readonly f = form(this.model, (path) => {
        // No resetOnDestroy option: the adapter resets on destroy by default.
        validateVest(path, suite);
      });
    }

    const { fixture } = await render(TestComponent);
    await TestBed.inject(ApplicationRef).whenStable();
    fixture.destroy();

    expect(resetCount).toBe(1);
  });

  it('lets resetOnDestroy: false opt out of reset-on-destroy', async () => {
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
      selector: 'ngx-test-vest-reset-optout',
      imports: [FormField],

      template: `<input [formField]="f.email" />`,
    })
    class TestComponent {
      readonly model = signal({ email: '' });
      readonly f = form(this.model, (path) => {
        validateVest(path, suite, { resetOnDestroy: false });
      });
    }

    const { fixture } = await render(TestComponent);
    await TestBed.inject(ApplicationRef).whenStable();
    fixture.destroy();

    expect(resetCount).toBe(0);
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

  it('does not leave an earlier focusCurrentField registration permanently pending when a later registration on the same suite supersedes its run', async () => {
    // Regression: Vest 6 only tracks ONE resolver per suite root isolate, so
    // calling `suite.run()` a second time for the SAME suite instance (here,
    // via a second `focusCurrentField` registration on a different field)
    // steals the first run's resolver. The first run's promise then never
    // settles. Without a settlement fallback that does not depend on the
    // superseded run's own resolver, `email` (the earlier registration,
    // whose resolver gets stolen by `password`'s later run) would stay
    // pending() forever even after its own async test body resolves.
    const deferred = new Map<string, () => void>();
    const awaitField = (field: string) =>
      new Promise<void>((resolve) => {
        deferred.set(field, resolve);
      });

    const suite = create(
      (data: { email: string; password: string }, field?: string) => {
        only(field);
        test('email', 'Email check failed', async () => {
          await awaitField('email');
          enforce(data.email).isNotBlank();
        });
        test('password', 'Password check failed', async () => {
          await awaitField('password');
          enforce(data.password).isNotBlank();
        });
      },
    );

    @Component({
      selector: 'ngx-test-vest-superseded-run',
      imports: [FormField],

      template: `
        <input id="email" [formField]="f.email" />
        <input id="password" [formField]="f.password" />
      `,
    })
    class TestComponent {
      readonly model = signal({ email: 'a', password: 'b' });
      readonly f = form(this.model, (path) => {
        // Two focusCurrentField registrations sharing ONE suite instance —
        // the documented per-field pattern from the README.
        validateVest(path.email, suite, { focusCurrentField: true });
        validateVest(path.password, suite, { focusCurrentField: true });
      });
    }

    const { fixture } = await render(TestComponent);

    // Both focused runs are in-flight (their async test bodies are awaiting
    // `awaitField`); the `password` run supersedes the `email` run's resolver.
    // Do NOT await whenStable() here — that blocks forever while a resource
    // is deliberately parked on the gate.
    await vi.waitFor(() => {
      expect(fixture.componentInstance.f.email().pending()).toBe(true);
      expect(fixture.componentInstance.f.password().pending()).toBe(true);
    });

    deferred.get('email')?.();
    deferred.get('password')?.();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(fixture.componentInstance.f.email().pending()).toBe(false);
    expect(fixture.componentInstance.f.password().pending()).toBe(false);
  });

  it('does not throw a TDZ ReferenceError when suite.subscribe fires its callback synchronously', async () => {
    // Regression: the settlement race in `awaitVestRunSettlement` captured
    // `subscribe(...)`'s return value in a `const unsubscribe`, then called
    // `unsubscribe()` from inside the subscribe callback itself. If a suite's
    // `subscribe` implementation invokes that callback SYNCHRONOUSLY (before
    // `subscribe()` returns — e.g. because nothing was left pending by the
    // time this run's settlement race subscribed), `unsubscribe` was still in
    // its temporal dead zone, throwing a `ReferenceError` and leaving the
    // run — and the field — pending forever.
    const baseSuite = create((data: { email: string }) => {
      test('email', 'Email is required', () => {
        enforce(data.email).isNotBlank();
      });
    });

    const suite = {
      ...baseSuite,
      run(value: { email: string }) {
        // Wrap in a genuinely fresh native Promise (rather than
        // `Promise.resolve(...)`, which returns the SAME dual-shaped
        // Vest result unchanged and would keep this on the synchronous
        // path) so the adapter treats this as a raw thenable with no sync
        // `SuiteResult` — forcing it through the async settlement race
        // (and therefore through `suite.subscribe`) every time.
        return new Promise<VestResultLike>((resolve, reject) => {
          Promise.resolve(baseSuite.run(value)).then(resolve, reject);
        });
      },
      subscribe(_event: 'ALL_RUNNING_TESTS_FINISHED', callback: () => void) {
        // Real event buses typically isolate each listener's errors (so one
        // bad subscriber cannot break the emit loop for the others), which
        // is exactly what turns the TDZ `ReferenceError` into a silent,
        // permanently-unsettled run rather than a visible crash. Swallow the
        // exception here to reproduce that isolation faithfully — without
        // the guard in `awaitVestRunSettlement`, this line hides the
        // `ReferenceError` and the assertions below hang/fail.
        try {
          callback();
        } catch {
          // Intentionally swallowed — see comment above.
        }
        return () => {};
      },
    };

    @Component({
      selector: 'ngx-test-vest-sync-subscribe',
      imports: [FormField],

      template: `<input [formField]="signupForm.email" />`,
    })
    class TestComponent {
      readonly model = signal({ email: '' });
      readonly signupForm = form(this.model, (path) => {
        validateVest(path, suite);
      });
    }

    const { fixture } = await render(TestComponent);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(fixture.componentInstance.signupForm.email().pending()).toBe(false);
    const errors = fixture.componentInstance.signupForm.email().errors();
    expect(errors).toHaveLength(1);
    expect(errors[0]?.message).toBe('Email is required');
  });

  it('does not cross-attach another field’s retained Vest failure onto a focusCurrentField-bound field', async () => {
    // Regression: `mapVestValidationResult` used to map the WHOLE
    // `getErrors()`/`getWarnings()` map regardless of which field the
    // validator was bound to. Vest is stateful — fields excluded by `only()`
    // retain their previous failures — so once BOTH fields have failed at
    // least once, each focusCurrentField-bound validator's fallback
    // resolution attached the OTHER field's retained message onto its own
    // bound field.
    const suite = create(
      (data: { email: string; password: string }, field?: string) => {
        only(field);
        test('email', 'Email is required', () => {
          enforce(data.email).isNotBlank();
        });
        test('password', 'Password is required', () => {
          enforce(data.password).isNotBlank();
        });
      },
    );

    @Component({
      selector: 'ngx-test-vest-no-cross-attach',
      imports: [FormField],

      template: `
        <input id="email" [formField]="f.email" />
        <input id="password" [formField]="f.password" />
      `,
    })
    class TestComponent {
      readonly model = signal({ email: '', password: '' });
      readonly f = form(this.model, (path) => {
        validateVest(path.email, suite, { focusCurrentField: true });
        validateVest(path.password, suite, { focusCurrentField: true });
      });
    }

    const { fixture } = await render(TestComponent);
    await TestBed.inject(ApplicationRef).whenStable();

    // Trigger the password field's focused run too, so both fields now have
    // a retained failure in the suite's stateful result.
    fixture.componentInstance.model.set({ email: '', password: '' });
    await TestBed.inject(ApplicationRef).whenStable();

    const emailErrors = fixture.componentInstance.f.email().errors();
    const passwordErrors = fixture.componentInstance.f.password().errors();

    expect(emailErrors.some((e) => e.message === 'Password is required')).toBe(
      false,
    );
    expect(passwordErrors.some((e) => e.message === 'Email is required')).toBe(
      false,
    );
    expect(emailErrors.some((e) => e.message === 'Email is required')).toBe(
      true,
    );
    expect(
      passwordErrors.some((e) => e.message === 'Password is required'),
    ).toBe(true);
  });

  it('does not let a sync Vest warning suppress a blocking async Vest error on the same field', async () => {
    // Regression: Angular skips a `validateAsync` resource whenever the
    // bound node's `syncValid()` is false, and toolkit warnings are ordinary
    // `ValidationError`s (`warn:vest:*`). A sync `warn()` result surfaced by
    // the adapter's `validateTree` pass therefore made `syncValid()` false
    // and silently prevented the async phase (and any blocking async Vest
    // error, e.g. a "username already taken" check) from ever running.
    let releaseAsyncCheck: (() => void) | undefined;
    const asyncCheckGate = new Promise<void>((resolve) => {
      releaseAsyncCheck = resolve;
    });

    const suite = create((data: { username: string }) => {
      test('username', 'Usernames should be lowercase', () => {
        warn();
        enforce(data.username).matches(/^[a-z]+$/);
      });
      test('username', 'Username is already taken', async () => {
        await asyncCheckGate;
        enforce(data.username.toLowerCase() !== 'admin').isTruthy();
      });
    });

    @Component({
      selector: 'ngx-test-vest-warning-does-not-block-async',
      imports: [FormField],

      template: `<input id="username" [formField]="f.username" />`,
    })
    class TestComponent {
      readonly model = signal({ username: 'ADMIN' });
      readonly f = form(this.model, (path) => {
        validateVest(path, suite, { includeWarnings: true });
      });
    }

    const { fixture } = await render(TestComponent);

    // The sync warning (uppercase 'ADMIN' fails the lowercase check) must not
    // prevent the async blocking check from being scheduled. Do NOT await
    // whenStable() here — that blocks forever while the resource is
    // deliberately parked on `asyncCheckGate`.
    await vi.waitFor(() => {
      expect(fixture.componentInstance.f.username().pending()).toBe(true);
    });

    releaseAsyncCheck?.();
    await TestBed.inject(ApplicationRef).whenStable();

    const errors = fixture.componentInstance.f.username().errors();
    expect(errors.some((e) => e.message === 'Username is already taken')).toBe(
      true,
    );
  });

  it('resolves a genuine async Vest test() body to an error and then to valid once the value clears', async () => {
    // A plain, non-regression example of Vest's real async test support
    // (a `test(name, message, async () => {...})` body, not a consumer
    // Promise wrapped around `suite.run()`). Simulates a debounced
    // "is this username taken?" lookup.
    const takenUsernames = new Set(['admin', 'root']);
    let releaseLookup: (() => void) | undefined;
    let lookupGate = new Promise<void>((resolve) => {
      releaseLookup = resolve;
    });

    const suite = create((data: { username: string }) => {
      test('username', 'Username is taken', async () => {
        await lookupGate;
        enforce(takenUsernames.has(data.username.toLowerCase())).isFalsy();
      });
    });

    @Component({
      selector: 'ngx-test-vest-real-async',
      imports: [FormField],

      template: `<input id="username" [formField]="f.username" />`,
    })
    class TestComponent {
      readonly model = signal({ username: 'admin' });
      readonly f = form(this.model, (path) => {
        validateVest(path, suite);
      });
    }

    const { fixture } = await render(TestComponent);

    // Do NOT await whenStable() here — that blocks forever while the async
    // test body is parked on `lookupGate`.
    await vi.waitFor(() => {
      expect(fixture.componentInstance.f.username().pending()).toBe(true);
    });

    releaseLookup?.();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(fixture.componentInstance.f.username().pending()).toBe(false);
    const takenErrors = fixture.componentInstance.f.username().errors();
    expect(takenErrors).toHaveLength(1);
    expect(takenErrors[0]?.message).toBe('Username is taken');

    // Re-arm the gate for the second (available-username) run.
    lookupGate = new Promise<void>((resolve) => {
      releaseLookup = resolve;
    });
    fixture.componentInstance.model.set({ username: 'available-name' });

    await vi.waitFor(() => {
      expect(fixture.componentInstance.f.username().pending()).toBe(true);
    });

    releaseLookup?.();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(fixture.componentInstance.f.username().pending()).toBe(false);
    expect(fixture.componentInstance.f.username().errors()).toHaveLength(0);
  });

  it('isolates two concurrently-pending field trees sharing the same suite instance (#214)', async () => {
    // Multi-registration coverage for a different angle than the
    // focusCurrentField superseded-run tests above: here ONE suite constant
    // (the documented module-scope pattern) backs TWO completely separate
    // `form()` field trees — as if two independent components each imported
    // the same shared suite constant — with both runs in flight at the same
    // time.
    //
    // Fixed in #214: Vest suites created via `create()` hold exactly ONE
    // canonical accumulated result per suite *object*, not one per
    // caller/data payload (see `awaitVestRunSettlement` above — `suite.get()`
    // returns "the suite's current accumulated result", singular). When the
    // same suite instance validates two unrelated field trees concurrently,
    // letting both trees' `validateAsync` settle off that single shared
    // result let one tree observe the OTHER tree's outcome instead of its
    // own — concretely, formA's email ('first@example.com', valid) used to
    // end up reporting formB's "Email is required" failure once both runs
    // settled. The adapter now detects this exact overlap (two DIFFERENT
    // field trees with a concurrently PENDING, UNFOCUSED run against the
    // same suite instance) and defers the later-arriving registration's
    // ACTUAL `suite.run()` call until the suite is idle (see
    // `deferVestRunUntilIdle`), so the two runs never overlap and neither can
    // observe or corrupt the other's in-flight state. This test asserts BOTH
    // the "never permanently pending" guarantee (unchanged from the original
    // wave-3 fix) AND full result isolation: formA must report ITS OWN
    // (valid) outcome, not formB's failure.
    let releaseFirst: (() => void) | undefined;
    const firstGate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    let releaseSecond: (() => void) | undefined;
    const secondGate = new Promise<void>((resolve) => {
      releaseSecond = resolve;
    });

    const sharedSuite = create((data: { email: string }) => {
      test('email', 'Email is required', async () => {
        // Route each run to its own gate by value so the two concurrent
        // field trees settle independently rather than racing one shared
        // gate.
        await (data.email === 'first@example.com' ? firstGate : secondGate);
        enforce(data.email).isNotBlank();
      });
    });

    @Component({
      selector: 'ngx-test-vest-shared-suite-two-trees',
      imports: [FormField],

      template: `
        <input id="email-a" [formField]="formA.email" />
        <input id="email-b" [formField]="formB.email" />
      `,
    })
    class TestComponent {
      readonly modelA = signal({ email: 'first@example.com' });
      readonly formA = form(this.modelA, (path) => {
        validateVest(path, sharedSuite);
      });

      readonly modelB = signal({ email: '' });
      readonly formB = form(this.modelB, (path) => {
        validateVest(path, sharedSuite);
      });
    }

    const { fixture } = await render(TestComponent);

    await vi.waitFor(() => {
      expect(fixture.componentInstance.formA.email().pending()).toBe(true);
      expect(fixture.componentInstance.formB.email().pending()).toBe(true);
    });

    // Settle the second tree first to prove resolution order doesn't affect
    // whether BOTH registrations eventually settle.
    releaseSecond?.();
    releaseFirst?.();
    await TestBed.inject(ApplicationRef).whenStable();

    // Guarantee #1 (wave-3, unchanged): neither registration is left pending
    // forever (the exact failure mode `awaitVestRunSettlement`'s settlement
    // race exists to prevent).
    expect(fixture.componentInstance.formA.email().pending()).toBe(false);
    expect(fixture.componentInstance.formB.email().pending()).toBe(false);

    // Guarantee #2 (#214, new): each tree reports ONLY its own outcome.
    // formB's blank email fails...
    const formBErrors = fixture.componentInstance.formB.email().errors();
    expect(formBErrors).toHaveLength(1);
    expect(formBErrors[0]?.message).toBe('Email is required');

    // ...and formA's valid, non-blank email must NOT pick up formB's
    // failure -- the exact cross-contamination #214 reported.
    const formAErrors = fixture.componentInstance.formA.email().errors();
    expect(formAErrors).toHaveLength(0);
  });

  it('serializes three concurrently-pending field trees sharing a suite', async () => {
    let releaseFirst: (() => void) | undefined;
    const firstGate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    let releaseSecond: (() => void) | undefined;
    const secondGate = new Promise<void>((resolve) => {
      releaseSecond = resolve;
    });
    let releaseThird: (() => void) | undefined;
    const thirdGate = new Promise<void>((resolve) => {
      releaseThird = resolve;
    });
    const gates: Readonly<Record<string, Promise<void>>> = {
      'first@example.com': firstGate,
      'second@example.com': secondGate,
      'third@example.com': thirdGate,
    };
    const started: string[] = [];

    const sharedSuite = create((data: { email: string }) => {
      test('email', 'Email is required', async () => {
        started.push(data.email);
        await gates[data.email];
        enforce(data.email).isNotBlank();
      });
    });

    @Component({
      selector: 'ngx-test-vest-shared-suite-three-trees',
      imports: [FormField],
      template: `
        <input id="email-a" [formField]="formA.email" />
        <input id="email-b" [formField]="formB.email" />
        <input id="email-c" [formField]="formC.email" />
      `,
    })
    class TestComponent {
      readonly modelA = signal({ email: 'first@example.com' });
      readonly formA = form(this.modelA, (path) => {
        validateVest(path, sharedSuite);
      });

      readonly modelB = signal({ email: 'second@example.com' });
      readonly formB = form(this.modelB, (path) => {
        validateVest(path, sharedSuite);
      });

      readonly modelC = signal({ email: 'third@example.com' });
      readonly formC = form(this.modelC, (path) => {
        validateVest(path, sharedSuite);
      });
    }

    const { fixture } = await render(TestComponent);

    try {
      await vi.waitFor(() => {
        expect(started).toEqual(['first@example.com']);
        expect(fixture.componentInstance.formA.email().pending()).toBe(true);
        expect(fixture.componentInstance.formB.email().pending()).toBe(true);
        expect(fixture.componentInstance.formC.email().pending()).toBe(true);
      });

      releaseFirst?.();
      await vi.waitFor(() => {
        expect(started).toContain('second@example.com');
      });
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 0);
      });

      // Without a queue, both B and C resume from A's idle notification and
      // call suite.run() together. C must remain queued behind B.
      expect(started).toEqual(['first@example.com', 'second@example.com']);

      releaseSecond?.();
      await vi.waitFor(() => {
        expect(started).toEqual([
          'first@example.com',
          'second@example.com',
          'third@example.com',
        ]);
      });
      releaseThird?.();
      await TestBed.inject(ApplicationRef).whenStable();

      expect(fixture.componentInstance.formA.email().errors()).toHaveLength(0);
      expect(fixture.componentInstance.formB.email().errors()).toHaveLength(0);
      expect(fixture.componentInstance.formC.email().errors()).toHaveLength(0);
    } finally {
      releaseFirst?.();
      releaseSecond?.();
      releaseThird?.();
    }
  });

  it('keeps queued whole-suite runs FIFO across an immediate focused run', async () => {
    type RunValue = { readonly id: string };
    type VestMessages = Readonly<Record<string, readonly string[]>>;

    let pending = false;
    const started: string[] = [];
    const wholeSuiteStarts: string[] = [];
    let activeWholeSuiteRun: string | undefined;
    const listeners = new Set<() => void>();
    let activeRun:
      | {
          readonly id: string;
          readonly resolve: (result: VestResultLike) => void;
        }
      | undefined;

    function getMessages(): VestMessages;
    function getMessages(_field: string): readonly string[];
    function getMessages(_field?: string): VestMessages | readonly string[] {
      return [];
    }

    const settledResult: VestResultLike = {
      isPending: () => pending,
      getErrors: getMessages,
      getWarnings: getMessages,
    };
    const suite: VestRunnableSuite<RunValue> = {
      run(value, fieldName) {
        if (fieldName === undefined) {
          // A queued whole-suite run may only begin after its predecessor has
          // settled. Focused runs intentionally remain immediate and supersede
          // the hand-rolled suite's prior active resolver.
          expect(activeWholeSuiteRun).toBeUndefined();
          activeWholeSuiteRun = value.id;
          wholeSuiteStarts.push(value.id);
        } else {
          activeWholeSuiteRun = undefined;
        }
        started.push(value.id);
        pending = true;

        let resolveRun: (result: VestResultLike) => void = () => {};
        const runResult = Object.assign(
          new Promise<VestResultLike>((resolve) => {
            resolveRun = resolve;
          }),
          settledResult,
        );
        // Vest 6 keeps only one resolver for a suite. A later run replaces
        // this one, intentionally leaving the superseded thenable unsettled.
        activeRun = { id: value.id, resolve: resolveRun };
        return runResult;
      },
      subscribe(_event, callback) {
        listeners.add(callback);
        return () => {
          listeners.delete(callback);
        };
      },
      get: () => settledResult,
    };
    const completeActiveRun = (id: string): void => {
      expect(activeRun?.id).toBe(id);
      pending = false;
      if (activeWholeSuiteRun === id) {
        activeWholeSuiteRun = undefined;
      }
      activeRun?.resolve(settledResult);
      for (const callback of listeners) {
        callback();
      }
    };
    const adapter = createVestAdapter();
    const fieldTree = (value: RunValue) => {
      return TestBed.runInInjectionContext(() => form(signal(value), () => {}));
    };

    adapter.runVestSuite({
      suite,
      fieldTree: fieldTree({ id: 'first' }),
      value: { id: 'first' },
    });
    adapter.runVestSuite({
      suite,
      fieldTree: fieldTree({ id: 'second' }),
      value: { id: 'second' },
    });
    adapter.runVestSuite({
      suite,
      fieldTree: fieldTree({ id: 'third' }),
      value: { id: 'third' },
    });

    expect(started).toEqual(['first']);
    completeActiveRun('first');
    await vi.waitFor(() => {
      expect(started).toEqual(['first', 'second']);
    });

    // A focused run is immediate, so it supersedes the queued second run's
    // Vest thenable while the third contender is waiting behind that run.
    adapter.runVestSuite({
      suite,
      fieldTree: fieldTree({ id: 'superseding' }),
      value: { id: 'superseding' },
      focus: 'email',
    });
    expect(started).toEqual(['first', 'second', 'superseding']);

    // This whole-suite contender arrives after the immediate focused run. It
    // must remain behind both previously reserved whole-suite contenders rather
    // than treating the focused run as the queue's only boundary.
    adapter.runVestSuite({
      suite,
      fieldTree: fieldTree({ id: 'fourth' }),
      value: { id: 'fourth' },
    });
    completeActiveRun('superseding');

    await vi.waitFor(() => {
      expect(started).toEqual(['first', 'second', 'superseding', 'third']);
    });
    completeActiveRun('third');
    await vi.waitFor(() => {
      expect(started).toEqual([
        'first',
        'second',
        'superseding',
        'third',
        'fourth',
      ]);
    });
    completeActiveRun('fourth');
    expect(wholeSuiteStarts).toEqual(['first', 'second', 'third', 'fourth']);
  });

  it('isolates warnings (not just blocking errors) across two concurrently-pending field trees sharing a suite (#214)', async () => {
    // Same shared-suite-two-trees shape as the isolation test above, but
    // exercising the `includeWarnings` path together with an async blocking
    // test — the combination the adapter's warning-deferral logic
    // (`shouldDeferVestWarnings`) is most likely to get tangled up in if the
    // deferred (contested) run's snapshot/baseline bookkeeping leaked
    // between trees. formA's bio is long enough to pass the sync warning
    // check; formB's is short and must fail it. Both share a blocking async
    // `email` check gated independently per tree.
    let releaseFirst: (() => void) | undefined;
    const firstGate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    let releaseSecond: (() => void) | undefined;
    const secondGate = new Promise<void>((resolve) => {
      releaseSecond = resolve;
    });

    const sharedSuite = create((data: { email: string; bio: string }) => {
      test('email', 'Email is required', async () => {
        await (data.email === 'first@example.com' ? firstGate : secondGate);
        enforce(data.email).isNotBlank();
      });
      test('bio', 'Consider adding more detail', () => {
        warn();
        enforce(data.bio.length >= 20).isTruthy();
      });
    });

    @Component({
      selector: 'ngx-test-vest-shared-suite-two-trees-warnings',
      imports: [FormField],

      template: `
        <input id="email-a" [formField]="formA.email" />
        <input id="bio-a" [formField]="formA.bio" />
        <input id="email-b" [formField]="formB.email" />
        <input id="bio-b" [formField]="formB.bio" />
      `,
    })
    class TestComponent {
      readonly modelA = signal({
        email: 'first@example.com',
        bio: 'a sufficiently long biography',
      });
      readonly formA = form(this.modelA, (path) => {
        validateVest(path, sharedSuite, { includeWarnings: true });
      });

      readonly modelB = signal({ email: '', bio: 'short' });
      readonly formB = form(this.modelB, (path) => {
        validateVest(path, sharedSuite, { includeWarnings: true });
      });
    }

    const { fixture } = await render(TestComponent);

    await vi.waitFor(() => {
      expect(fixture.componentInstance.formA.email().pending()).toBe(true);
      expect(fixture.componentInstance.formB.email().pending()).toBe(true);
    });

    releaseSecond?.();
    releaseFirst?.();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(fixture.componentInstance.formA.email().pending()).toBe(false);
    expect(fixture.componentInstance.formB.email().pending()).toBe(false);

    // formA: valid email, long bio -- no errors, no warnings.
    expect(fixture.componentInstance.formA.email().errors()).toHaveLength(0);
    expect(fixture.componentInstance.formA.bio().errors()).toHaveLength(0);

    // formB: blank email fails, short bio warns -- and neither leaks onto
    // formA's fields (asserted above) nor is missing/duplicated on formB's.
    const formBEmailErrors = fixture.componentInstance.formB.email().errors();
    expect(formBEmailErrors).toHaveLength(1);
    expect(formBEmailErrors[0]?.message).toBe('Email is required');

    const formBBioErrors = fixture.componentInstance.formB.bio().errors();
    expect(formBBioErrors).toHaveLength(1);
    expect(formBBioErrors[0]?.message).toBe('Consider adding more detail');
    expect(formBBioErrors[0]?.kind).toMatch(/^warn:vest:/);
  });

  it('defers a sync Vest warning while an async blocking test is pending, then surfaces it together with the settled result', async () => {
    // Per the `includeWarnings` doc: "While the suite has pending async
    // tests, a sync warning is deferred (not yet surfaced) and re-emitted
    // together with the settled result once they finish." No existing spec
    // asserted this deferral-then-reemission contract directly.
    let releaseCheck: (() => void) | undefined;
    const checkGate = new Promise<void>((resolve) => {
      releaseCheck = resolve;
    });

    const suite = create((data: { email: string; bio: string }) => {
      test('email', 'Email availability check failed', async () => {
        await checkGate;
        enforce(data.email).isNotBlank();
      });
      test('bio', 'Consider adding more detail', () => {
        warn();
        enforce(data.bio.length >= 20).isTruthy();
      });
    });

    @Component({
      selector: 'ngx-test-vest-warning-deferred-async',
      imports: [FormField],

      template: `
        <input id="email" [formField]="f.email" />
        <input id="bio" [formField]="f.bio" />
      `,
    })
    class TestComponent {
      // `email` is blank (fails once the async check settles); `bio` is
      // short enough to fail the sync warning test immediately.
      readonly model = signal({ email: '', bio: 'short' });
      readonly f = form(this.model, (path) => {
        validateVest(path, suite, { includeWarnings: true });
      });
    }

    const { fixture } = await render(TestComponent);

    // While the suite is still pending, the sync `bio` warning must NOT be
    // surfaced yet even though its own test body already completed —
    // `shouldDeferVestWarnings` withholds it until the whole run settles.
    await vi.waitFor(() => {
      expect(fixture.componentInstance.f.email().pending()).toBe(true);
    });
    expect(fixture.componentInstance.f.bio().errors()).toHaveLength(0);

    releaseCheck?.();
    await TestBed.inject(ApplicationRef).whenStable();

    // Once settled, the deferred warning and the blocking async error both
    // surface together.
    expect(fixture.componentInstance.f.email().pending()).toBe(false);
    const emailErrors = fixture.componentInstance.f.email().errors();
    expect(emailErrors).toHaveLength(1);
    expect(emailErrors[0]?.message).toBe('Email availability check failed');

    const bioErrors = fixture.componentInstance.f.bio().errors();
    expect(bioErrors).toHaveLength(1);
    expect(bioErrors[0]?.message).toBe('Consider adding more detail');
    expect(bioErrors[0]?.kind).toMatch(/^warn:vest:/);
  });
});
