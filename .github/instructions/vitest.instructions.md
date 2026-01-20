---
applyTo: 'packages/**/*.{spec,test}.{ts,tsx,js,jsx}'
---

# Unit and Component Test Instructions (Angular + Vitest)

## General Guidelines

- Write all tests in TypeScript.
- Use **Vitest 4+** as the test runner.
- Make sure to properly use Angular 21 Signal Forms functionality in tests.
- Do not make up tests for non-existent APIs or features.
- Prefer user-facing behavior over implementation details.
- Treat Vest.js as a third-party dependency: never assert its internal state, execution order, or helpers—validate only the observable behavior surfaced through our public APIs.
- Use strict typing and modern Angular best practices.
- Prefer reusable, type-safe fakes over ad-hoc mocks (see [Fake It Till You Mock It](https://cookbook.marmicode.io/angular/testing/fake-it-till-you-mock-it)).
  - Share a single fake per dependency and keep it beside the real service (or under `tests/mocks/`) so suites reuse the same behavior contract.
  - Make fakes explicit: throw whenever a test hits an unsupported method or field instead of returning `undefined`.
- Always await `TestBed.inject(ApplicationRef).whenStable()` for async Angular tests.
- Write tests for actual, user-visible behavior only. Do not invent tests for APIs or code that do not exist.
- Always start with analysis of the current code and, documentation, and intent.
  - Based on that scaffold the tests and add pseudo-code/docs for the expected behavior, with WHAT and WHY.
  - Start with the happy and simple paths, then add edge cases and error handling.
  - Start with `test.todo()` or `test.fixme()` for complex tests that need more time to implement.
- To run tests, prefer using the `#runTests` tool over the terminal
  - If that does not work, use the command line:
    ```bash
    pnpm nx test <project-name> | filter file-or-test-name
    ```

## Test Organization & Structure

### File Organization

- Use `describe` blocks to group related tests and improve readability.
- Follow the Arrange-Act-Assert pattern for clarity and maintainability.
- Use `beforeEach` and `afterEach` hooks to set up and clean up test environments.
- Leverage `test.concurrent` for running independent tests in parallel to speed up execution.

## Test Coverage

- Ensure all new features have corresponding tests.
- Maintain high code coverage with **Vitest 4+**.
- Enable code coverage with `--coverage` to ensure all critical paths are tested.
- **Coverage Configuration (Vitest 4):**
  - `coverage.all` and `coverage.extensions` are removed in Vitest 4
  - Define `coverage.include` explicitly to specify which files to cover
  - Use `coverage.exclude` for patterns to exclude from coverage
  - If `coverage.include` is not set, only files loaded during test run are included
  - V8 coverage provider now uses AST-based remapping for more accurate results
  - `coverage.ignoreEmptyLines` is removed (lines without runtime code are automatically excluded)
  - `coverage.ignoreClassMethods` is now supported by V8 provider
- Assert error paths and loading states, not just happy paths.

**Example coverage configuration:**

```typescript
export default defineConfig({
  test: {
    coverage: {
      // Include covered and uncovered files matching this pattern
      include: ['packages/**/src/**/*.{js,jsx,ts,tsx}'],

      // Exclude patterns (no need for node_modules or config files)
      exclude: ['**/test-setup.ts', '**/*.spec.ts'],

      // Provider-specific options
      provider: 'v8', // or 'istanbul'
    },
  },
});
```

### Pragmatic Testing Strategy

- Aim for the "widest narrow" tests: fast, isolated, and low cognitive load, while still exercising end-to-end behavior through our public API surface (Honeycomb model).
- Bias toward tests that strengthen the earliest safety nets (fast feedback) before leaning on wide/e2e checks.
- When tests feel brittle or overly setup-heavy, consider narrowing the System Under Test or introducing purposeful fakes instead of piling on assertions.
- Use risk and cost to decide what deserves a test—focus on regressions we expect our library to catch rather than duplicating coverage that belongs to Vest itself.

## Unit Testing (Vitest Node)

- Use for pure functions, utilities, and services without Angular dependencies.
- No Angular TestBed or DOM required.
- Use direct function calls and assertions.
- Use `vi.mock()` for mocking dependencies.
- Prefer fakes over mocks/stubs for services you own (see [Fake It Till You Mock It](https://cookbook.marmicode.io/angular/testing/fake-it-till-you-mock-it)).
- Fakes should expose minimal configuration/state helpers, stay type-safe, maintain internal state, and throw on unhandled calls to guard against stale expectations.
- Assert behavior through the fake's public state instead of relying on `toHaveBeenCalled*` whenever possible.
- Minimize the number of test doubles per test; only mock at the boundary of the SUT.

### Designing Fakes (Marmicode playbook)

- Define or derive the shared interface first so the fake mirrors the real contract.
- Implement only the methods the test actually exercises; any unexpected call must throw (fail fast over silent `undefined`).
- Provide light-weight helpers such as `configure` or `getState` so assertions focus on observable outcomes, not interaction trivia.
- Reuse the same fake across suites—export it once rather than recreating ad-hoc stubs in each spec file.

### Mocking Improvements (Vitest 4)

**Constructor Support:**

Vitest 4 properly supports spying on constructors with `vi.spyOn` and `vi.fn`:

```typescript
const cart = {
  Apples: class Apples {
    getApples() {
      return 42;
    }
  },
};

const Spy = vi
  .spyOn(cart, 'Apples')
  // Use function keyword or class keyword for constructor mocks
  .mockImplementation(function () {
    this.getApples = () => 0;
  })
  // OR use class syntax
  .mockImplementation(
    class MockApples {
      getApples() {
        return 0;
      }
    },
  );

const mock = new Spy();
```

**Note:** Arrow functions will throw `[<anonymous> is not a constructor]` error when used with constructors.

**Mocking Behavior Changes:**

- `vi.fn().getMockName()` now returns `vi.fn()` by default instead of `spy`
- `vi.restoreAllMocks` no longer resets the state of spies, only restores spies created manually with `vi.spyOn`
- Calling `vi.spyOn` on a mock now returns the same mock
- Automocked instance methods are properly isolated but share state with the prototype
- Automocked methods cannot be restored with `.mockRestore()` (automocked modules with `spy: true` still work)
- Automocked getters no longer call the original getter (return `undefined` by default)
- `vi.fn(implementation).mockReset()` now correctly returns the mock implementation in `.getMockImplementation()`
- `vi.fn().mock.invocationCallOrder` now starts with `1` (like Jest) instead of `0`

## Component Testing (Vitest Browser + Angular Testing Library)

- Use Vitest Browser UI for all component tests whenever possible.
- **Browser Mode is stable in Vitest 4** (no longer experimental).
- Always use `render()` from Angular Testing Library.
- Use role-based queries (`getByRole`, `findByRole`, etc.) for DOM assertions.
- **For user interactions, ALWAYS use `userEvent` from `@testing-library/user-event`** (NOT `fireEvent`).
  - `userEvent` simulates realistic user interactions with all necessary event sequences
  - `fireEvent` only dispatches raw DOM events and misses browser behavior
  - Never use `fireEvent` - it bypasses important accessibility and interactability checks
- **Vitest 4 Browser Provider:** Import browser providers from dedicated packages:
  - `import { playwright } from '@vitest/browser-playwright'`
  - `import { webdriverio } from '@vitest/browser-webdriverio'`
  - `import { preview } from '@vitest/browser-preview'`
  - The `@vitest/browser` package is no longer needed and can be removed
- **Context imports updated:** Use `vitest/browser` instead of `@vitest/browser/context`:
  - `import { page } from 'vitest/browser'` (new)
  - `import { page } from '@vitest/browser/context'` (deprecated, will be removed in future release)
- Prefer fakes for service dependencies; use Angular's DI to provide them.
- Always test user-facing behavior, not implementation details.
- For async operations, always `await TestBed.inject(ApplicationRef).whenStable()` after triggering effects/signals.
- When creating a Test Component, use Template Driven Forms.
- Run tests in headless mode for CI pipelines and Browser UI for debugging.
- **Always use `userEvent` from `@testing-library/user-event`, NEVER `fireEvent`** - see "User Interactions with userEvent" section below.
- **Debugging improvements in Vitest 4:**
  - Use `--inspect` flag to connect to Chrome DevTools manually (playwright/webdriverio)
  - VS Code extension supports "Debug Test" button for browser tests
  - Vitest automatically disables `trackUnhandledErrors` option when debugging

### Choosing Between Bindings API and componentProperties

**Angular Testing Library v18.1.0+ and Angular v20.1+** introduced the new `bindings` API with `inputBinding`, `outputBinding`, and `twoWayBinding`. Choose the appropriate approach based on what you're rendering:

#### Component-Based Rendering (Use `bindings`)

When rendering **component classes directly**, use the `bindings` property:

```typescript
import { inputBinding, outputBinding, twoWayBinding } from '@angular/core';
import { signal } from '@angular/core';

// Rendering a component class
await render(MyFormComponent, {
  bindings: [
    inputBinding('initialData', signal({ name: 'John' })),
    outputBinding('dataSubmit', vi.fn()),
  ],
});
```

**When to use:**

- Testing standalone components with defined `input()` or `@Input()` properties
- Testing components with `output()` or `@Output()` properties
- Testing components with `model()` two-way bindings
- Need type-safe, signal-based property binding

**Deprecation notice:** `componentInputs`, `inputs`, `componentOutputs`, and `on` are deprecated. Use `bindings` instead for component-based rendering.

#### Template-Based Rendering (Use `componentProperties`)

When rendering **template strings** (e.g., testing directives in HTML context), use `componentProperties`:

```typescript
// Rendering an inline template string
await render(
  `<form [myDirective]="config">
    <input [value]="data" />
  </form>`,
  {
    imports: [MyDirective],
    componentProperties: {
      config: { enabled: true },
      data: 'test value',
    },
  },
);
```

**When to use:**

- Testing directives in realistic HTML contexts
- Template strings need access to variables
- Testing HTML structures with multiple components/directives
- Directive behavior testing (preferred approach)

**Note:** `componentProperties` is **NOT deprecated** and remains the correct choice for template-based rendering.

### Bindings API Examples (Component-Based Rendering)

**Setting Input Properties:**

```typescript
import { inputBinding } from '@angular/core';

// With signal (preferred for reactivity)
const nameSignal = signal('John');
await render(GreetingComponent, {
  bindings: [inputBinding('name', nameSignal)],
});

// With inline function
await render(GreetingComponent, {
  bindings: [inputBinding('age', () => 25)],
});

// With aliased input (use alias name, not property name)
await render(GreetingComponent, {
  bindings: [inputBinding('greetingAlias', signal('Hello'))],
});

// Update signal after rendering
nameSignal.set('Jane');
fixture.detectChanges(); // Or use findBy queries for auto-retry
```

**Testing Output Properties:**

```typescript
import { outputBinding } from '@angular/core';
import { vi } from 'vitest';

const onClickSpy = vi.fn();
await render(ButtonComponent, {
  bindings: [outputBinding('clicked', onClickSpy)],
});

// Trigger action that emits the output
await userEvent.click(screen.getByRole('button'));

// Assert output was emitted with correct value
expect(onClickSpy).toHaveBeenCalledWith(expectedValue);
```

**Two-Way Bindings:**

```typescript
import { twoWayBinding } from '@angular/core';

// For model() properties - MUST use writable signal
const valueSignal = signal('initial');
await render(InputComponent, {
  bindings: [twoWayBinding('value', valueSignal)],
});

// Verify two-way sync works
expect(valueSignal()).toBe('initial');
await userEvent.type(screen.getByRole('textbox'), 'updated');
expect(valueSignal()).toBe('updated');
```

### componentProperties Examples (Template-Based Rendering)

**Testing Directives:**

```typescript
// Template-based rendering for directive testing
await render(
  `<form [ngxSignalForm]="form" [errorStrategy]="strategy">
    <input type="text" />
  </form>`,
  {
    imports: [ngxSignalFormDirective],
    componentProperties: {
      form: createMockForm(),
      strategy: 'immediate' as ErrorDisplayStrategy,
    },
  },
);

// Dynamic updates with rerender
await rerender({
  componentProperties: {
    form: createMockForm(),
    strategy: 'on-touch',
  },
});
```

**Testing Complex HTML Structures:**

```typescript
await render(
  `<div class="container">
    <ngx-header [user]="currentUser" />
    <ngx-content [items]="data" (itemClick)="onItemClick($event)" />
  </div>`,
  {
    imports: [HeaderComponent, ContentComponent],
    componentProperties: {
      currentUser: { name: 'John', role: 'admin' },
      data: [{ id: 1, label: 'Item 1' }],
      onItemClick: vi.fn(),
    },
  },
);
```

### Testing Library Best Practices

- **Avoid Implementation Details**: Never access `fixture.debugElement`, `injector.get()`, or internal component/directive properties in tests.
- **Use DOM-Focused Assertions**: Test what users see and interact with, not internal state or method return values.
- **Prefer Accessible Queries**: Use `screen.getByRole()`, `screen.getByLabelText()`, `screen.getByText()` for better accessibility testing. Fall back to `screen.getByTestId()` when semantic queries aren't sufficient.
- **Use Standard Vitest Assertions**: Use `expect(element).toHaveAttribute()` for DOM assertions. Do NOT use `expect.element()` - this is Vitest Browser mode syntax only.
- **Add Test IDs Sparingly**: Use `data-testid` attributes only when semantic queries (role, label, text) aren't sufficient for reliable element querying.
- **Test Attribute Behavior**: Verify directive behavior through DOM attributes (e.g., `toHaveAttribute('validateRootForm', 'false')`) rather than directive properties.
- **Focus on User Experience**: Test form validation states (`toBeValid()`, `toBeInvalid()`), element visibility (`toBeInTheDocument()`), and accessibility attributes.
- **Choose Correct Rendering Approach**:
  - Component classes → Use `bindings: [inputBinding(), outputBinding(), twoWayBinding()]`
  - Template strings → Use `componentProperties: { ... }`
  - **Note**: `componentProperties` is NOT deprecated for template-based rendering
- **New Vitest 4 Matchers:**
  - `expect.assert()` - Narrowing type assertions (alternative to Chai's assert)
  - `expect.schemaMatching()` - Validate against Standard Schema v1 (Zod, Valibot, ArkType)
  - `expect.element().toBeInViewport()` - Check if element is in viewport (Browser Mode)
  - `expect.element().toMatchScreenshot()` - Visual regression testing (Browser Mode)

### User Interactions with userEvent

**ALWAYS use `userEvent` from `@testing-library/user-event` - NEVER use `fireEvent`**

`userEvent` simulates realistic user interactions with proper event sequences and accessibility checks, while `fireEvent` only dispatches raw DOM events and misses browser behavior.

**Setup pattern:**

```typescript
import { render, screen } from '@angular/core/testing';
import { userEvent } from '@testing-library/user-event';

test('user can type and submit', async () => {
  const user = userEvent.setup(); // ✅ Setup user instance
  await render(MyComponent);

  // Use user instance for all interactions
  const input = screen.getByRole('textbox', { name: /email/i });
  await user.type(input, 'test@example.com'); // ✅ Correct
  await user.click(screen.getByRole('button', { name: /submit/i }));

  // ❌ WRONG - Never use fireEvent
  // fireEvent.click(button);
  // fireEvent.change(input, { target: { value: 'test' } });
});
```

**Common userEvent methods (all use async/await):**

```typescript
const user = userEvent.setup();

// Text input
await user.type(element, 'text to type');
await user.clear(element); // Clear text field

// Clicking
await user.click(element);
await user.dblClick(element);

// Keyboard
await user.keyboard('{Enter}'); // Type Enter key
await user.keyboard('{Control>}a{/Control}'); // Ctrl+A

// Selection
await user.selectOptions(selectElement, 'option value');
await user.deselectOptions(selectElement, 'option value');

// Hovering
await user.hover(element);
await user.unhover(element);

// File upload
await user.upload(inputElement, file);

// Tab navigation
await user.tab(); // Tab to next element
await user.tab({ shift: true }); // Shift+Tab to previous
```

**Why NOT to use `fireEvent`:**

- ❌ Doesn't trigger all necessary event sequences
- ❌ Skips accessibility checks (allows clicking disabled elements, etc.)
- ❌ Doesn't simulate realistic browser behavior
- ❌ May miss bugs that users would catch
- ✅ `userEvent` does all of the above

## Testing Strategies & Tips

### Visual Regression Testing (Vitest 4+)

Vitest 4 adds support for visual regression testing in Browser Mode:

```typescript
import { expect, test } from 'vitest';
import { page } from 'vitest/browser';

test('hero section looks correct', async () => {
  // Capture and compare screenshot
  await expect(page.getByTestId('hero')).toMatchScreenshot('hero-section');
});

test('element is in viewport', async () => {
  // Check if element is visible in viewport
  await expect.element(page.getByText('Welcome')).toBeInViewport();

  // Check if 50% of element is in viewport
  await expect.element(page.getByText('To')).toBeInViewport({ ratio: 0.5 });
});
```

**Playwright Traces Support:**

Enable tracing with `--browser.trace=on` or in config:

```typescript
export default defineConfig({
  test: {
    browser: {
      trace: 'on-first-retry', // 'off', 'on', 'on-all-retries', 'retain-on-failure'
    },
  },
});
```

Traces are available in HTML reporter and can be opened with Playwright Trace Viewer.

### Schema Validation in Tests

Use `expect.schemaMatching()` for validating against Standard Schema v1 libraries:

```typescript
import { expect, test } from 'vitest';
import { z } from 'zod';
import * as v from 'valibot';
import { type } from 'arktype';

test('email validation', () => {
  const user = { email: 'john@example.com' };

  // Using Zod
  expect(user).toEqual({
    email: expect.schemaMatching(z.string().email()),
  });

  // Using Valibot
  expect(user).toEqual({
    email: expect.schemaMatching(v.pipe(v.string(), v.email())),
  });

  // Using ArkType
  expect(user).toEqual({
    email: expect.schemaMatching(type('string.email')),
  });
});
```

### Type Narrowing with expect.assert()

Use `expect.assert()` for type narrowing in tests:

```typescript
interface Cat {
  __type: 'Cat';
  mew(): void;
}
interface Dog {
  __type: 'Dog';
  bark(): void;
}
type Animal = Cat | Dog;

const animal: Animal = { __type: 'Dog', bark: () => {} };

expect.assert(animal.__type === 'Dog');
// TypeScript now knows animal is Dog type
expect(animal.bark()).toBeUndefined();
```

### Quick Decision Matrix - Rendering Approach

| Test Scenario                            | Rendering Method | API to Use                        | Example                                                               |
| ---------------------------------------- | ---------------- | --------------------------------- | --------------------------------------------------------------------- |
| Testing a component class                | Component-based  | `bindings` with `inputBinding()`  | `await render(MyComponent, { bindings: [...] })`                      |
| Testing a directive in template          | Template-based   | `componentProperties`             | `await render('<div [myDir]="val">', { componentProperties: {...} })` |
| Testing multiple components in HTML      | Template-based   | `componentProperties`             | `await render('<ngx-a [x]="y" />', { componentProperties: {...} })`   |
| Component with `@Input()` decorators     | Component-based  | `bindings` with `inputBinding()`  | Works with both decorators and signal inputs                          |
| Component with `output()` or `@Output()` | Component-based  | `bindings` with `outputBinding()` | `outputBinding('click', vi.fn())`                                     |
| Component with `model()` (two-way)       | Component-based  | `bindings` with `twoWayBinding()` | `twoWayBinding('value', signal(''))`                                  |

### Quick Decision Matrix - Test Approach

| Test Scenario                  | Approach         | Tools                                |
| ------------------------------ | ---------------- | ------------------------------------ |
| Component + Service dependency | Fake the service | `render()` + Fake implementation     |
| Service with HTTP calls        | Mock HTTP        | `TestBed` + `HttpTestingController`  |
| Component with `httpResource`  | Mock HTTP        | `render()` + `HttpTestingController` |
| Pure functions/utils           | Direct call      | No setup needed                      |
| Async signals/effects          | Use polling      | `expect.poll()` + `whenStable()`     |

### HttpResource

- Use `HttpTestingController` to mock HTTP requests in tests.
- For components using `httpResource`, always test loading, error, and success states.
- Use MSW for browser-based integration/component tests if mocking at the network level.

### Async/Signals

- Use `expect.poll()` for polling async signal values.
- Always await `whenStable()` after triggering async changes.

### Evaluate Test Value

- Track when a test produces false positives or misses regressions; adjust or remove low-value cases instead of letting them linger.
- Prefer adding focused narrow tests where recurring bugs slip past wider safety nets.
- Keep qualitative measures (team confidence, feedback speed) in mind—optimize instructions and suites for fast iteration rather than chasing coverage numbers alone.
