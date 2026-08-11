import {
  ApplicationRef,
  Component,
  signal,
  type WritableSignal,
} from '@angular/core';
import {
  form,
  FormField,
  type ReadonlyFieldTree,
} from '@angular/forms/signals';
import { TestBed } from '@angular/core/testing';
import { render } from '@testing-library/angular';
import { create, enforce, test as vestTest, warn } from 'vest';
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
 * Every test builds its own Vest suite instance. The run coordinator's
 * internal caches (`runCache`, `pendingKeysBySuite`, `runQueueBySuite` -- see
 * `./vest-run-coordinator.ts`, not the adapter itself, which only owns
 * `resetOnDestroyRefCounts`) are all keyed by suite object identity, so a
 * fresh suite per test -- including the tests that exercise the module-scope
 * {@link sharedVestAdapter} singleton -- cannot leak state into another spec
 * file sharing that same singleton within one test run. The
 * `sharedVestAdapter` test additionally calls `invalidate()` on its own suite
 * once done, as an extra belt-and-braces reset.
 *
 * Tests that only need a `ReadonlyFieldTree` identity (not a rendered,
 * bound-to-the-DOM form) build one via `TestBed.runInInjectionContext(() =>
 * form(...))` directly in the test body, with no `@Component`/`render()` at
 * all -- the same pattern `validate-vest.spec.ts` already uses for
 * field-tree-only setup. Tests that DO need a real validateVest/register
 * pipeline (and so a rendered component) capture the field tree and model
 * into spec-local bindings from inside the component's constructor, rather
 * than reading them back out through `fixture.componentInstance` -- keeping
 * the assertions against the field tree's own public, observable API
 * (`errors()`, `pending()`, ...) instead of the test harness's internals.
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

      let f!: ReadonlyFieldTree<{ email: string }>;
      let model!: WritableSignal<{ email: string }>;

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

        constructor() {
          f = this.f;
          model = this.model;
        }
      }

      await render(TestComponent);
      await TestBed.inject(ApplicationRef).whenStable();
      expect(runCount).toBe(1);

      // The README's headline guarantee: a manual sharedVestAdapter call for
      // the identical (suite, fieldTree, value) tuple reuses the SAME suite
      // execution validateVest already triggered -- not a second run.
      const manual = sharedVestAdapter.runVestSuite({
        suite,
        fieldTree: f,
        value: model(),
      });

      expect(manual.fromCache).toBe(true);
      expect(runCount).toBe(1);

      sharedVestAdapter.invalidate(suite);
    });
  });

  describe('invalidate', () => {
    it('drops the cached run so a subsequent runVestSuite call for the identical tuple re-executes instead of reusing the cache', () => {
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

      // Only the field tree's identity is needed (no rendering, no DOM
      // binding) -- build it directly in the test body via an injection
      // context, matching validate-vest.spec.ts's field-tree-only setup.
      const fieldTree = TestBed.runInInjectionContext(() =>
        form(signal({ email: '' })),
      );
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

      // Only the field tree's identity is needed here too.
      const fieldTree = TestBed.runInInjectionContext(() =>
        form(signal({ email: '', username: '' })),
      );
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
      // reference -- see `toVestFocusKey` and its use in the run
      // coordinator's `request` (`./vest-run-coordinator.ts`).
      const repeat = adapter.runVestSuite({
        suite,
        fieldTree,
        value,
        focus: ['email', 'username'],
      });
      expect(repeat.fromCache).toBe(true);

      // `settled()` is the safe thing to await for a manual flow (see
      // `RunVestSuiteResult`'s doc comment), but it returns `PromiseLike<unknown>`
      // -- deliberately decoupled from the suite's own result type, see
      // `VestRunHandle.settled`. Await it for the safety guarantee, then read
      // through `runResult` (already known Vest-result-shaped here -- this
      // suite is synchronous, so there is no supersession risk) for a typed
      // result.
      await multiFocus.settled();
      const result = await Promise.resolve(multiFocus.runResult);
      expect(Object.keys(result.getErrors())).toEqual(
        expect.arrayContaining(['email', 'username']),
      );
    });
  });

  describe('settled()', () => {
    it('resolves even when a later focused run on the same suite supersedes the earlier run’s own runResult promise', async () => {
      const adapter = createVestAdapter();
      const gates: Array<() => void> = [];

      // A focused run bypasses contention/FIFO gating entirely (see
      // `isSuiteContestedByOtherKey`'s doc comment) -- two focused
      // `runVestSuite` calls on the SAME suite both call `suite.only(...).run()`
      // immediately, back to back. Per Vest 6.3.2's single-resolver-per-suite
      // behaviour (documented on `awaitVestRunSettlement`), the SECOND call
      // replaces the suite's resolver before the FIRST call's own promise ever
      // settles -- so `first.runResult` is permanently pending, and only
      // `first.settled()` (which races the run against the suite-wide
      // `ALL_RUNNING_TESTS_FINISHED` bus event) recovers its outcome.
      const suite = create((data: { email: string; username: string }) => {
        vestTest('email', 'Email is required', async () => {
          await new Promise<void>((resolve) => gates.push(resolve));
          enforce(data.email).isNotBlank();
        });
        vestTest('username', 'Username is required', async () => {
          await new Promise<void>((resolve) => gates.push(resolve));
          enforce(data.username).isNotBlank();
        });
      });

      const fieldTree = TestBed.runInInjectionContext(() =>
        form(signal({ email: '', username: '' })),
      );
      const value = { email: '', username: '' };

      const first = adapter.runVestSuite({
        suite,
        fieldTree,
        value,
        focus: 'email',
      });
      expect(first.deferred).toBe(false);

      const second = adapter.runVestSuite({
        suite,
        fieldTree,
        value,
        focus: 'username',
      });
      expect(second.deferred).toBe(false);

      // `.finally()` (not `.then()`) so a REJECTED runResult still marks
      // itself settled -- the point being tested is whether the promise
      // settles at all, not whether it resolves successfully.
      let firstRunResultSettled = false;
      void Promise.resolve(first.runResult).finally(() => {
        firstRunResultSettled = true;
      });

      let firstSettled = false;
      void Promise.resolve(first.settled()).finally(() => {
        firstSettled = true;
      });

      await vi.waitFor(() => {
        expect(gates.length).toBe(2);
      });
      gates[0]();
      gates[1]();

      await vi.waitFor(() => {
        expect(firstSettled).toBe(true);
      });

      // Give the microtask/macrotask queue a real chance to flush before
      // asserting the negative -- this is what distinguishes "genuinely never
      // settles" from "just hasn't settled yet".
      await new Promise((resolve) => setTimeout(resolve, 20));
      expect(firstRunResultSettled).toBe(false);
    });
  });

  describe('contention detection / FIFO run queue', () => {
    /**
     * Resolves the async test body's `await` gate at `index`, waiting for it
     * to be registered first. A bare `gates[index]?.()` silently no-ops when
     * the gate has not been pushed yet (e.g. because a preceding contender
     * hasn't actually started its deferred run), which converts a real
     * scheduling regression into an indefinite hang somewhere later in the
     * test instead of a fast, attributable failure right here.
     */
    async function releaseGate(
      gates: readonly (() => void)[],
      index: number,
    ): Promise<void> {
      await vi.waitFor(() => {
        expect(gates[index]).toBeDefined();
      });
      gates[index]();
    }

    it('serializes three concurrently-pending unfocused runs on one suite across three field trees, in strict FIFO order, executing the suite exactly once per tree', async () => {
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

      // Three independent field trees on the SAME suite -- only their
      // identity matters here, so build them directly rather than rendering
      // a component.
      const fieldTreeA = TestBed.runInInjectionContext(() =>
        form(signal({ value: 'a' })),
      );
      const fieldTreeB = TestBed.runInInjectionContext(() =>
        form(signal({ value: 'b' })),
      );
      const fieldTreeC = TestBed.runInInjectionContext(() =>
        form(signal({ value: 'c' })),
      );

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

      // Tree C: a THIRD field tree requested while BOTH A and B are still
      // pending on the same suite -- also contested, and must queue behind
      // B specifically (FIFO), not race it or skip ahead.
      const resultC = adapter.runVestSuite({
        suite,
        fieldTree: fieldTreeC,
        value: { value: 'c' },
      });
      expect(resultC.fromCache).toBe(false);
      expect(runCallOrder).toEqual(['run:a']);

      // Let A's async test settle -> the suite goes idle -> B's deferred run
      // starts automatically. C must NOT start yet -- it is queued behind B.
      await releaseGate(gates, 0);
      await resultA.settled();

      await vi.waitFor(() => {
        expect(runCallOrder).toEqual(['run:a', 'run:b']);
      });

      // Let B's async test settle -> the suite goes idle again -> C's
      // deferred run starts only now, strictly after B.
      await releaseGate(gates, 1);
      await resultB.settled();

      await vi.waitFor(() => {
        expect(runCallOrder).toEqual(['run:a', 'run:b', 'run:c']);
      });

      // Clean up C's now-started async test so nothing dangles past the test.
      await releaseGate(gates, 2);
      await resultC.settled();

      // FIFO + single-execution: each tree's suite.run() fired exactly once,
      // strictly in request order -- A, then B (only after A settled), then
      // C (only after B settled) -- never together, never out of order.
      expect(runCallOrder).toEqual(['run:a', 'run:b', 'run:c']);
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

      let f!: ReadonlyFieldTree<{ email: string }>;

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

        constructor() {
          f = this.f;
        }
      }

      await render(TestComponent);
      await TestBed.inject(ApplicationRef).whenStable();

      // Assert through the field tree's own observable `errors()` contract
      // (captured from the component's constructor above), not by reaching
      // into the test harness's `fixture.componentInstance`.
      const [error] = f.email().errors();
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

  describe('kind sanitiser: same-segment message collision', () => {
    it('gives two distinct messages that fold to the same normalized segment distinct kinds via the lossy-normalization hash suffix', async () => {
      // 'Too long!' and 'Too long?' both strip their case/punctuation down to
      // the same normalized segment ('too-long') — but normalization is
      // LOSSY for both (the sanitized string differs from the original), so
      // `normalizeWarningKindSegment` now appends an `fnv1a4Hex` suffix of
      // each ORIGINAL message. The two originals differ, so their hashes
      // differ, so the two kinds are already distinct at occurrence 0 —
      // no fold-collision reaches the occurrence counter at all. See issue
      // #219 / #260 (character-folding collision hardening).
      //
      // Both `vestTest`s use `warn()`: Vest's default (blocking) error mode
      // only surfaces the FIRST failing test per field, so two colliding
      // blocking messages on one field can never both appear at once.
      // `warn()` mode accumulates every failing test's message per field.
      const suite = create((data: { email: string }) => {
        vestTest('email', 'Too long!', () => {
          warn();
          enforce(data.email).longerThan(10);
        });
        vestTest('email', 'Too long?', () => {
          warn();
          enforce(data.email).longerThan(10);
        });
      });

      let f!: ReadonlyFieldTree<{ email: string }>;

      @Component({
        selector: 'ngx-test-adapter-kind-collision',
        imports: [FormField],

        template: `<input [formField]="f.email" />`,
      })
      class TestComponent {
        readonly model = signal({ email: '' });
        readonly f = form(this.model, (path) => {
          validateVest(path, suite, { includeWarnings: true });
        });

        constructor() {
          f = this.f;
        }
      }

      await render(TestComponent);
      await TestBed.inject(ApplicationRef).whenStable();

      const errors = f.email().errors();
      expect(errors).toHaveLength(2);

      const kinds = errors.map((error) => error.kind);
      // Both share the same field + folded-message prefix, each carrying its
      // own DISTINCT hash suffix (derived from the two different original
      // messages) ...
      for (const kind of kinds) {
        expect(kind).toMatch(/^warn:vest:email:too-long-[0-9a-f]{4}:\d$/u);
      }
      // ... and both land at occurrence 0, because the hash suffix alone
      // already keeps the two kinds apart — no fold-collision reaches the
      // occurrence counter.
      expect(new Set(kinds).size).toBe(2);
      expect(kinds[0]).toMatch(/:0$/u);
      expect(kinds[1]).toMatch(/:0$/u);
    });

    it('assigns distinct occurrence indices to two occurrences of the exact same message on one field', async () => {
      // Two `vestTest`s sharing the exact same, already-clean message
      // ('too-long', no folding needed) normalize identically and are
      // non-lossy, so no hash suffix is appended to either. The occurrence
      // index is the ONLY thing that can keep their kinds apart. See issue
      // #323.
      const suite = create((data: { email: string }) => {
        vestTest('email', 'too-long', () => {
          warn();
          enforce(data.email).longerThan(10);
        });
        vestTest('email', 'too-long', () => {
          warn();
          enforce(data.email).longerThan(100);
        });
      });

      let f!: ReadonlyFieldTree<{ email: string }>;

      @Component({
        selector: 'ngx-test-adapter-kind-collision-identical',
        imports: [FormField],

        template: `<input [formField]="f.email" />`,
      })
      class TestComponent {
        readonly model = signal({ email: '' });
        readonly f = form(this.model, (path) => {
          validateVest(path, suite, { includeWarnings: true });
        });

        constructor() {
          f = this.f;
        }
      }

      await render(TestComponent);
      await TestBed.inject(ApplicationRef).whenStable();

      const errors = f.email().errors();
      expect(errors).toHaveLength(2);

      const kinds = errors.map((error) => error.kind);
      for (const kind of kinds) {
        expect(kind).toMatch(/^warn:vest:email:too-long:\d$/u);
      }
      expect(new Set(kinds)).toEqual(
        new Set(['warn:vest:email:too-long:0', 'warn:vest:email:too-long:1']),
      );
    });

    // NOTE (issue #219 / #260): the previous version of this describe block
    // had a test pairing a punctuation-only message (`'!!!'`) with the
    // literal message `'warning'` to exercise `createVestValidationKind`'s
    // `|| 'warning'` fallback colliding with a genuine `'warning'` message.
    // That scenario no longer applies: `normalizeWarningKindSegment` now
    // hashes ANY lossily-normalized input — including one that folds to
    // nothing — so `'!!!'` now gets its own hash-suffixed segment instead of
    // falling back to the bare `'warning'` literal (see the fold-to-empty
    // test right below, and the fold-collision test further down, for the
    // replacement coverage of that code path). The `'field'`/`'warning'`
    // fallback literals in `createVestValidationKind` are only reachable by
    // a truly empty (`''`) raw fieldPath/message now, and Vest itself
    // silently drops a `test(fieldName, '', ...)` call (it registers no
    // error/warning at all — verified empirically against vest@6.3.2), so
    // that fallback is defensive-only and not exercisable through the
    // public `validateVest` surface. It remains covered structurally:
    // `normalizeWarningKindSegment('')` returns `''` unchanged (non-lossy,
    // since `''` sanitizes to itself), which is exactly the input the
    // `|| 'field'`/`|| 'warning'` fallback exists to catch.

    it('gives a punctuation-only message a bare hash segment, with no leading hyphen', async () => {
      // '!!!' folds to '' (every character is stripped by the sanitize
      // regex), which is lossy (`'' !== '!!!'`), so `normalizeWarningKindSegment`
      // appends a hash suffix. The folded segment being EMPTY is the edge
      // case a naive `${truncated}-${hash}` join gets wrong: it would
      // reintroduce a leading hyphen (`-a1b2`) that the trim step earlier in
      // the same function just stripped, producing an invalid CSS-identifier
      // start and an ugly kind (`warn:vest:email:-a1b2:0`). The fix returns
      // the bare hash instead, so the segment is exactly 4 hex digits with
      // no leading hyphen.
      const suite = create((data: { email: string }) => {
        vestTest('email', '!!!', () => {
          warn();
          enforce(data.email).longerThan(10);
        });
      });

      let f!: ReadonlyFieldTree<{ email: string }>;

      @Component({
        selector: 'ngx-test-adapter-kind-fold-to-empty',
        imports: [FormField],

        template: `<input [formField]="f.email" />`,
      })
      class TestComponent {
        readonly model = signal({ email: '' });
        readonly f = form(this.model, (path) => {
          validateVest(path, suite, { includeWarnings: true });
        });

        constructor() {
          f = this.f;
        }
      }

      await render(TestComponent);
      await TestBed.inject(ApplicationRef).whenStable();

      const [error] = f.email().errors();
      expect(error).toBeDefined();
      expect(error?.kind).toMatch(/^warn:vest:email:[0-9a-f]{4}:0$/u);
    });

    it('gives two messages that fold to the same normalized segment ("user.email" vs "user_email") distinct kinds', async () => {
      // Both 'user.email' and 'user_email' fold '.' / '_' to '-', producing
      // the identical normalized segment 'user-email'. `normalizeWarningKindSegment`
      // is applied the same way to field-path AND message segments, so this
      // exercises the exact character-folding collision issue #219 / #260
      // targets (the concrete field-path scenario just names it). Both
      // inputs are lossily normalized (the sanitized string differs from the
      // original), so each gets its own `fnv1a4Hex` hash suffix of its
      // original (distinct) text, keeping the two kinds apart without
      // relying on occurrence indices.
      const suite = create((data: { email: string }) => {
        vestTest('email', 'user.email', () => {
          warn();
          enforce(data.email).isNotBlank();
        });
        vestTest('email', 'user_email', () => {
          warn();
          enforce(data.email).isNotBlank();
        });
      });

      let f!: ReadonlyFieldTree<{ email: string }>;

      @Component({
        selector: 'ngx-test-adapter-kind-fold-collision',
        imports: [FormField],

        template: `<input [formField]="f.email" />`,
      })
      class TestComponent {
        readonly model = signal({ email: '' });
        readonly f = form(this.model, (path) => {
          validateVest(path, suite, { includeWarnings: true });
        });

        constructor() {
          f = this.f;
        }
      }

      await render(TestComponent);
      await TestBed.inject(ApplicationRef).whenStable();

      const errors = f.email().errors();
      expect(errors).toHaveLength(2);

      const kinds = errors.map((error) => error.kind);
      for (const kind of kinds) {
        expect(kind).toMatch(/^warn:vest:email:user-email-[0-9a-f]{4}:0$/u);
      }
      expect(new Set(kinds).size).toBe(2);
    });
  });
});
