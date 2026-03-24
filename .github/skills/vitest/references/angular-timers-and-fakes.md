---
name: angular-timers-and-fakes
description: Angular-specific guidance for fake timers, debounce tests, fast-forward mode, and reusable fakes in Vitest
---

# Angular Timers and Fakes

Use this reference when Angular tests involve debounce, delayed UI updates, polling, or service replacement.

## Prefer fakes over mocks for app-owned services

For dependencies you own, prefer reusable fakes over ad-hoc spying stubs.

Why:

- lower cognitive load per test
- better type safety
- better consistency across related methods and state
- less coupling to implementation details

Good fake characteristics:

- implements the real interface or a focused subset of it
- exposes minimal helper methods such as `configure()` or `getState()`
- throws on unsupported calls instead of returning `undefined`
- is reused across suites instead of redefined inline repeatedly

## Pick the right timer strategy

### 1. Dynamic timing configuration

Prefer this when you can inject timing values through Angular providers or config.

Use it when timing is **not** the behavior under test and you want to avoid interfering with Angular's own scheduling.

Typical pattern:

- set debounce to `0` for instant behavior
- set debounce to a very large value when testing "still pending" states

This is often the safest and most composable approach.

### 2. Fake timers in fast-forward mode

Use this when timing is not the point of the test, but you still need timers out of the way.

```ts
import { onTestFinished, vi } from 'vitest';

function setUpFastForwardTimers() {
  vi.useFakeTimers().setTimerTickMode('nextTimerAsync');
  onTestFinished(() => vi.useRealTimers());
}
```

Use this to make debounce and delay-heavy tests fast without coupling them to exact durations.

### 3. Fake timers in manual mode

Use this only when the timing itself is what you are testing.

```ts
vi.useFakeTimers();
// create component after timers are installed
await vi.runAllTimersAsync();
await vi.advanceTimersByTimeAsync(290);
```

Use async timer APIs:

- `vi.runAllTimersAsync()`
- `vi.advanceTimersByTimeAsync()`
- `vi.advanceTimersToNextTimerAsync()` when appropriate

Avoid sync timer APIs unless you are testing scheduling internals.

## Fake timer rules

- Install fake timers **before** component creation.
- Restore real timers with `onTestFinished(() => vi.useRealTimers())`.
- Do not switch between real and fake timers in the middle of a test unless you truly understand the consequences.
- Approximate edges instead of asserting exact milliseconds. Nested timers can add extra delay.

## Angular-specific stability rules

Manual fake timers pause Angular scheduling too. That means:

- `whenStable()` can hang if Angular timers never advance
- DOM updates may not happen until timers are flushed

If you use manual fake timers and create a component, flush Angular's pending timers first:

```ts
vi.useFakeTimers();
TestBed.createComponent(MyComponent);
await vi.runAllTimersAsync();
```

## Signals, resources, and HTTP

For async Angular primitives:

- prefer assertions on visible UI or public signal state
- use `ApplicationRef.whenStable()` after async work when needed
- use `HttpTestingController` for `HttpClient` and `httpResource` tests

Example setup order for HTTP tests:

```ts
TestBed.configureTestingModule({
  providers: [provideHttpClient(), provideHttpClientTesting()],
});
```

Provide `provideHttpClient()` before `provideHttpClientTesting()`.

## Decision shortcuts

### The delay itself matters

Use manual fake timers.

### The delay is irrelevant and just slows tests down

Use dynamic timing config first; otherwise use fast-forward timers.

### The dependency is yours and has behavior/state

Write or reuse a fake.

### The dependency is a boundary you do not own

Mock or stub at that boundary.
