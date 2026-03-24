---
name: vitest
description: Vitest testing guidance for unit and component tests with modern mocking, Browser Mode, assertions, and configuration. Use when writing or refactoring Vitest tests, setting up Angular or TypeScript test config, improving reliability/coverage, debugging flaky tests, migrating tests to Vitest Browser Mode, or choosing between page locators, Angular Testing Library, fake timers, and fakes.
---

# Vitest Testing Guidance

Apply this skill when creating or updating tests so they remain deterministic, maintainable, and user-focused.

## Core Principles

1. Prefer behavior-focused tests over implementation details.
2. Use TypeScript for all tests.
3. Keep tests isolated; avoid shared mutable state.
4. Prefer fakes for app-owned services; mock only hard boundaries.
5. Use async-safe assertions (`await expect(...).resolves/rejects`, `expect.poll`).
6. Use accessible, user-facing queries for component tests.
7. For Angular UI tests, prefer Vitest Browser Mode over emulated DOM environments whenever practical.

## Workspace-Specific Rules (Angular + ngx-vest-forms)

- Prefer Vitest Browser Mode for Angular component tests. Use `TestBed.createComponent(...)` for component-class tests and Angular Testing Library `render()` for inline-template or directive-oriented scenarios.
- Prefer role/label/text queries before `data-testid`.
- Always await `TestBed.inject(ApplicationRef).whenStable()` after async effects/signals unless the test is fully expressed through retriable browser locators.
- For ngx-vest-forms tests, validate user-visible outcomes (errors, validity state, accessibility attrs), not directive internals.
- Start complex work with `test.todo()`/`test.fixme()` and then iterate.
- Do not invent tests for APIs/features that do not exist.

## Angular Testing Defaults

### Component tests

- Default to **full Browser Mode** for interactive Angular component tests.
- Prefer `TestBed.createComponent(...)` for direct component-class tests.
- Use `page` or `userEvent` from `vitest/browser` for provider-backed interactions.
- Use `expect.element(...)` for retriable browser assertions.
- Use `@testing-library/angular` when you need template-based composition, inline HTML, or directive-focused rendering.

### Angular Testing Library vs Browser Mode

- **Full Browser Mode:** best for realistic interaction, actionability checks, and flaky UI issues.
- **Partial Browser Mode / migration mode:** acceptable when tests still use `screen` queries and Testing Library interaction helpers.
- **Node/jsdom tests:** reserve for narrow component tests that genuinely do not benefit from a real browser.

### Interaction rule of thumb

- In full Browser Mode, prefer:
  - `await page.getByRole(...).click()`
  - `await userEvent.fill(page.getByLabelText(...), 'value')`
- Use `@testing-library/user-event` only outside full Browser Mode.
- Avoid `fireEvent` unless you truly need a low-level synthetic event.

## Time, Async, and Stability

- If time-based behavior is the thing under test, use fake timers in **manual** mode and advance time with async timer APIs.
- If time is merely in the way, prefer either:
  - dynamic timing configuration through DI, or
  - Vitest fake timers with `vi.setTimerTickMode('nextTimerAsync')`.
- Install fake timers **before** creating the component.
- Restore real timers with `onTestFinished(() => vi.useRealTimers())`.
- Approximate boundary times instead of asserting exact millisecond edges.

## Authoring Checklist

- Structure tests with Arrange-Act-Assert.
- Group by behavior using `describe`.
- Keep assertions meaningful and explicit.
- Assert error/loading paths, not only happy paths.
- For concurrent tests/suites, use scoped context `expect` where needed.
- Prefer `expect.element(...)` style assertions in browser/component tests.
- For Angular signal outputs, bindings, or `httpResource`, test visible effects and public outputs rather than internal scheduling details.

## Mocking Guidelines (Vitest Best Practices)

- Prefer module mocks with dynamic import form for type-safe transformations:
  - `vi.mock(import('./module'), () => ({ ... }))`
- Use partial mocks when needed:
  - `vi.mock(import('./module'), async (importOriginal) => ({ ...(await importOriginal()), overridden: vi.fn() }))`
- Use `vi.mocked()` for typed mocked values.
- Use MSW for API/network boundaries in UI/component/integration-like tests.
- Prefer `clearMocks: true` and `restoreMocks: true` in config to reduce test pollution.
- In Browser Mode, remember that module namespace exports are sealed; prefer `vi.mock('./module', { spy: true })` instead of `vi.spyOn(importedModule, 'method')`.

## Async and Reliability

- Use `await expect(Promise.resolve(...)).resolves...` / `rejects...`.
- Use `expect.poll()` for eventually consistent state.
- Use `expect.assertions()` / `expect.hasAssertions()` when callbacks or async branches could silently skip assertions.
- In Browser Mode, prefer `expect.element(...)` over ad-hoc polling for DOM state.

## Suggested Config Baseline

Use these defaults unless project constraints require otherwise:

- `clearMocks: true`
- `restoreMocks: true`
- `coverage` enabled in CI runs
- For Angular UI tests, favor Browser Mode with Playwright provider
- Split Node and Browser tests into separate projects/configs when the suite mixes both strategies

## Execution Flow

1. Understand feature intent and existing test patterns.
2. Choose the narrowest test that still exercises the behavior you care about.
3. For Angular UI, decide between full Browser Mode, partial-browser migration, or Node/jsdom.
4. Add/adjust tests for visible behavior first.
5. Add edge/error/loading cases.
6. Run focused tests, then broader suite.
7. Refine flaky sections (async waits, shared state, over-mocking, timer misuse).

## References

- [Core Config](references/core-config.md)
- [Test API](references/core-test-api.md)
- [Expect API](references/core-expect.md)
- [Mocking](references/features-mocking.md)
- [Coverage](references/features-coverage.md)
- [Concurrency](references/features-concurrency.md)
- [Angular Browser Mode](./references/angular-browser-mode.md)
- [Angular Timers and Fakes](./references/angular-timers-and-fakes.md)
