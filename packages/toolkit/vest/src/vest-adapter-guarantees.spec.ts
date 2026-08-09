import { ApplicationRef, Component, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { TestBed } from '@angular/core/testing';
import { render } from '@testing-library/angular';
import { create, enforce, test as vestTest } from 'vest';
import { describe, expect, it, vi } from 'vitest';
import { validateVest } from './validate-vest';
import { createVestAdapter, sharedVestAdapter } from './vest-adapter';

/**
 * Covers exported-interface guarantees that {@link ./vest-adapter.spec.ts} and
 * {@link ./validate-vest.spec.ts} do not reach: the {@link sharedVestAdapter}
 * singleton, {@link VestSuiteAdapter.invalidate}, the adapter-level
 * `resetOnDestroy` default, a multi-name `readonly string[]` focus, the
 * contention/FIFO run queue, and the `kind` sanitiser's truncation-plus-hash
 * branch. See issue #294.
 *
 * Every test builds its own Vest suite instance. The adapter's internal
 * caches (`runCache`, `pendingTreesBySuite`, `runQueueBySuite`) are all keyed
 * by suite object identity, so a fresh suite per test -- including the tests
 * that exercise the module-scope {@link sharedVestAdapter} singleton --
 * cannot leak state into another spec file sharing that same singleton
 * within one test run. The `sharedVestAdapter` test additionally calls
 * `invalidate()` on its own suite once done, as an extra belt-and-braces
 * reset.
 */
describe('VestSuiteAdapter — exported-interface guarantees', () => {
  describe('sharedVestAdapter', () => {
    it('shares one suite execution between a validateVest registration and a direct sharedVestAdapter.runVestSuite call on the same (suite, fieldTree, value)', async () => {
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
        selector: 'ngx-test-shared-adapter-singleton',
        imports: [FormField],

        template: `<input [formField]="f.email" />`,
      })
      class TestComponent {
        readonly model = signal({ email: '' });
        readonly f = form(this.model, (path) => {
          // Registered through the built-in validateVest(), which is wired
          // onto sharedVestAdapter -- not a private, factory-built adapter.
          validateVest(path, suite);
        });
      }

      const { fixture } = await render(TestComponent);
      await TestBed.inject(ApplicationRef).whenStable();
      expect(runCount).toBe(1);

      // The README's headline guarantee: a manual sharedVestAdapter call for
      // the identical (suite, fieldTree, value) tuple reuses the SAME suite
      // execution validateVest already triggered -- not a second run.
      const manual = sharedVestAdapter.runVestSuite({
        suite,
        fieldTree: fixture.componentInstance.f,
        value: fixture.componentInstance.model(),
      });

      expect(manual.fromCache).toBe(true);
      expect(runCount).toBe(1);

      sharedVestAdapter.invalidate(suite);
    });
  });

  describe('invalidate', () => {
    it('drops the cached run so a subsequent runVestSuite call for the identical tuple re-executes instead of reusing the cache', async () => {
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
        selector: 'ngx-test-adapter-invalidate',
        imports: [FormField],

        template: `<input [formField]="f.email" />`,
      })
      class TestComponent {
        readonly model = signal({ email: '' });
        readonly f = form(this.model);
      }

      const { fixture } = await render(TestComponent);
      const fieldTree = fixture.componentInstance.f;
      const value = { email: '' };

      const first = adapter.runVestSuite({ suite, fieldTree, value });
      expect(first.fromCache).toBe(false);
      expect(runCount).toBe(1);

      const second = adapter.runVestSuite({ suite, fieldTree, value });
      expect(second.fromCache).toBe(true);
      expect(runCount).toBe(1);

      adapter.invalidate(suite);

      // Same (suite, fieldTree, value) tuple as `second` -- without
      // `invalidate`, this would be a cache hit. It must re-execute.
      const third = adapter.runVestSuite({ suite, fieldTree, value });
      expect(third.fromCache).toBe(false);
      expect(runCount).toBe(2);
    });
  });

  describe('adapter-level resetOnDestroy default', () => {
    it('applies the adapter-level default when a registration passes no override, and a per-registration override beats it', async () => {
      const adapter = createVestAdapter({ resetOnDestroy: false });

      const makeSuite = () => {
        const base = create((data: { email: string }) => {
          vestTest('email', 'Email is required', () => {
            enforce(data.email).isNotBlank();
          });
        });
        let resetCount = 0;
        return {
          suite: {
            ...base,
            reset: () => {
              resetCount += 1;
              base.reset();
            },
          },
          getResetCount: () => resetCount,
        };
      };

      const defaultCase = makeSuite();
      const overrideCase = makeSuite();

      @Component({
        selector: 'ngx-test-adapter-reset-default',
        imports: [FormField],

        template: `<input [formField]="f.email" />`,
      })
      class DefaultComponent {
        readonly model = signal({ email: '' });
        // No resetOnDestroy override -- the adapter-level default (false)
        // must apply.
        readonly f = form(this.model, (path) => {
          adapter.register(path, defaultCase.suite);
        });
      }

      @Component({
        selector: 'ngx-test-adapter-reset-override',
        imports: [FormField],

        template: `<input [formField]="f.email" />`,
      })
      class OverrideComponent {
        readonly model = signal({ email: '' });
        // Per-registration override beats the adapter-level false default.
        readonly f = form(this.model, (path) => {
          adapter.register(path, overrideCase.suite, {
            resetOnDestroy: true,
          });
        });
      }

      const defaultRender = await render(DefaultComponent);
      await TestBed.inject(ApplicationRef).whenStable();
      defaultRender.fixture.destroy();
      expect(defaultCase.getResetCount()).toBe(0);

      TestBed.resetTestingModule();

      const overrideRender = await render(OverrideComponent);
      await TestBed.inject(ApplicationRef).whenStable();
      overrideRender.fixture.destroy();
      expect(overrideCase.getResetCount()).toBe(1);
    });
  });

  describe('multi-name (readonly string[]) focus', () => {
    it('threads a readonly string[] focus through suite.only() and keys the run cache distinctly from a single-name focus', async () => {
      const adapter = createVestAdapter();
      const baseSuite = create((data: { email: string; username: string }) => {
        vestTest('email', 'Email is required', () => {
          enforce(data.email).isNotBlank();
        });
        vestTest('username', 'Username is required', () => {
          enforce(data.username).isNotBlank();
        });
      });

      const onlyArgs: Array<string | readonly string[]> = [];
      const suite = {
        ...baseSuite,
        only(field: string | readonly string[]) {
          onlyArgs.push(field);
          const target = typeof field === 'string' ? field : [...field];
          return {
            run: (value: { email: string; username: string }) =>
              baseSuite.only(target).run(value),
          };
        },
      };

      @Component({
        selector: 'ngx-test-adapter-multi-focus',
        imports: [FormField],

        template: `<input [formField]="f.email" />`,
      })
      class TestComponent {
        readonly model = signal({ email: '', username: '' });
        readonly f = form(this.model);
      }

      const { fixture } = await render(TestComponent);
      const fieldTree = fixture.componentInstance.f;
      const value = { email: '', username: '' };

      const singleFocus = adapter.runVestSuite({
        suite,
        fieldTree,
        value,
        focus: 'email',
      });
      expect(singleFocus.fromCache).toBe(false);

      const names: readonly string[] = ['email', 'username'];
      const multiFocus = adapter.runVestSuite({
        suite,
        fieldTree,
        value,
        focus: names,
      });
      // Distinct cache key from the single-name focus above: a cache miss,
      // not a reuse of the single-name run.
      expect(multiFocus.fromCache).toBe(false);
      expect(onlyArgs.at(-1)).toEqual(['email', 'username']);

      // A different array INSTANCE with the same names hits the cache: the
      // focus cache key is content-derived (the joined names), not the array
      // reference -- see the `focusKey` computation in `getOrCreateVestRun`.
      const repeat = adapter.runVestSuite({
        suite,
        fieldTree,
        value,
        focus: ['email', 'username'],
      });
      expect(repeat.fromCache).toBe(true);

      const result = await Promise.resolve(multiFocus.runResult);
      expect(Object.keys(result.getErrors())).toEqual(
        expect.arrayContaining(['email', 'username']),
      );
    });
  });

  describe('contention detection / FIFO run queue', () => {
    it('serializes two concurrently-pending unfocused runs on one suite across two field trees, in FIFO order, executing the suite exactly once per tree', async () => {
      const adapter = createVestAdapter();
      const runCallOrder: string[] = [];
      const gates: Array<() => void> = [];

      const baseSuite = create((data: { value: string }) => {
        vestTest('value', 'Value is required', async () => {
          await new Promise<void>((resolve) => {
            gates.push(resolve);
          });
          enforce(data.value).isNotBlank();
        });
      });

      const suite = {
        ...baseSuite,
        run(value: { value: string }) {
          runCallOrder.push(`run:${value.value}`);
          return baseSuite.run(value);
        },
      };

      @Component({
        selector: 'ngx-test-adapter-contention',
        imports: [FormField],

        template: `
          <input [formField]="formA.value" />
          <input [formField]="formB.value" />
        `,
      })
      class TestComponent {
        readonly modelA = signal({ value: 'a' });
        readonly modelB = signal({ value: 'b' });
        readonly formA = form(this.modelA);
        readonly formB = form(this.modelB);
      }

      const { fixture } = await render(TestComponent);
      const fieldTreeA = fixture.componentInstance.formA;
      const fieldTreeB = fixture.componentInstance.formB;

      // Tree A: uncontested (nothing else pending on this suite yet) -- runs
      // immediately.
      const resultA = adapter.runVestSuite({
        suite,
        fieldTree: fieldTreeA,
        value: { value: 'a' },
      });
      expect(resultA.fromCache).toBe(false);
      expect(runCallOrder).toEqual(['run:a']);

      // Tree B: a DIFFERENT field tree, same suite, still unfocused, while
      // A's unfocused run is pending on that suite -- contested. B's run
      // must be DEFERRED, not started, until the suite is idle again.
      const resultB = adapter.runVestSuite({
        suite,
        fieldTree: fieldTreeB,
        value: { value: 'b' },
      });
      expect(resultB.fromCache).toBe(false);
      expect(runCallOrder).toEqual(['run:a']);

      // Let A's async test settle -> the suite goes idle -> B's deferred run
      // starts automatically.
      gates[0]?.();
      await Promise.resolve(resultA.runResult);

      await vi.waitFor(() => {
        expect(runCallOrder).toEqual(['run:a', 'run:b']);
      });

      // Clean up B's now-started async test so nothing dangles past the test.
      gates[1]?.();
      await Promise.resolve(resultB.runResult);

      // FIFO + single-execution: each tree's suite.run() fired exactly once,
      // and B's call happened strictly after A's settled -- never together.
      expect(runCallOrder).toEqual(['run:a', 'run:b']);
    });
  });

  describe('kind sanitiser: truncation + hash suffix', () => {
    it('appends a truncation-plus-hash suffix to the kind when a Vest message exceeds the segment length limit', async () => {
      const longMessage = 'a'.repeat(60);
      const suite = create((data: { email: string }) => {
        vestTest('email', longMessage, () => {
          enforce(data.email).isNotBlank();
        });
      });

      @Component({
        selector: 'ngx-test-adapter-kind-truncation',
        imports: [FormField],

        template: `<input [formField]="f.email" />`,
      })
      class TestComponent {
        readonly model = signal({ email: '' });
        readonly f = form(this.model, (path) => {
          validateVest(path, suite);
        });
      }

      const { fixture } = await render(TestComponent);
      await TestBed.inject(ApplicationRef).whenStable();

      const [error] = fixture.componentInstance.f.email().errors();
      expect(error).toBeDefined();

      // kind = `vest:${normalizedField}:${normalizedMessage}:${occurrence}`
      const parts = error?.kind.split(':') ?? [];
      expect(parts[0]).toBe('vest');
      expect(parts[1]).toBe('email');
      // Truncated to the 48-char segment max, plus a '-' and a 4-hex-char
      // FNV-1a hash suffix of the ORIGINAL (untruncated) message -- see
      // `normalizeWarningKindSegment` / `VEST_KIND_SEGMENT_MAX_LEN`.
      expect(parts[2]).toMatch(/^a{48}-[0-9a-f]{4}$/u);
      expect(parts[3]).toBe('0');
    });
  });
});
