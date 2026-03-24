---
name: angular-browser-mode
description: Angular-specific guidance for Vitest Browser Mode, Angular Testing Library, and provider-backed interactions
---

# Angular Browser Mode

Use this reference when working on Angular component or directive tests that benefit from a real browser.

## Default choice

For Angular UI tests, prefer **Vitest Browser Mode** over jsdom or happy-dom whenever the behavior involves:

- user interaction
- focus management
- overlays, visibility, or pointer behavior
- accessibility state
- async rendering that is easier to express through retriable locators

## Full Browser Mode vs partial-browser migration

### Full Browser Mode

Prefer full Browser Mode for new or refactored Angular UI tests.

Typical stack:

- `TestBed.createComponent(...)` for component-class creation
- `vitest/browser` for `page`, `userEvent`, and `expect.element`
- Playwright provider via `@vitest/browser-playwright`

Example:

```ts
import { TestBed } from '@angular/core/testing';
import { expect, test } from 'vitest';
import { page } from 'vitest/browser';

test('submits the form', async () => {
  TestBed.createComponent(MyComponent);

  await page.getByRole('textbox', { name: /email/i }).fill('test@example.com');
  await page.getByRole('button', { name: /submit/i }).click();

  await expect.element(page.getByRole('status')).toHaveTextContent(/saved/i);
});
```

Why this is preferred:

- provider-backed interactions are closer to production
- actionability checks catch covered/disabled/non-interactable elements
- `expect.element` retries until the DOM settles

### Partial Browser Mode

Partial Browser Mode is acceptable while migrating an existing Angular Testing Library suite. In that style, tests still use `screen` queries and may use Testing Library interaction helpers.

This is a migration path, not the ideal end state.

## Interaction guidance

### Preferred in full Browser Mode

Use one of these:

- locator actions such as `page.getByRole(...).click()`
- `userEvent` from `vitest/browser`

```ts
import { page, userEvent } from 'vitest/browser';

await userEvent.fill(page.getByLabelText(/email/i), 'test@example.com');
await page.getByRole('button', { name: /save/i }).click();
```

### Outside full Browser Mode

If the test is still running in jsdom or a partial-browser migration setup, `@testing-library/user-event` is fine.

### Avoid by default

Do not default to `fireEvent`. It skips too much real interaction behavior and tends to produce brittle tests.

## Angular Testing Library rendering choices

### Prefer `TestBed.createComponent` for component classes

Use Angular's native `bindings` support for `input()`, `output()`, and `model()` based APIs.

```ts
import { inputBinding, outputBinding } from '@angular/core';
import { TestBed } from '@angular/core/testing';

TestBed.createComponent(MyComponent, {
  bindings: [
    inputBinding('value', () => 'hello'),
    outputBinding('saved', onSaved),
  ],
});
```

Use this for direct component tests in full Browser Mode.

### Use `render()` for inline templates or directive scenarios

Use `componentProperties` for template-string rendering.

```ts
await render(`<div [myDirective]="config"></div>`, {
  imports: [MyDirective],
  componentProperties: {
    config: { enabled: true },
  },
});
```

## Zoneless notes

Angular is moving toward zoneless-by-default testing and runtime behavior. Write tests that remain correct without relying on patched automatic change detection.

- Prefer waiting for visible state instead of manually forcing change detection.
- Use `ApplicationRef.whenStable()` or retriable browser assertions when async work is involved.
- Keep tests symmetric to production behavior.

## Browser Mode limitations to remember

- In Browser Mode, imported module namespace objects are sealed.
- `vi.spyOn(moduleExport)` can fail on ESM exports in the browser.
- Prefer `vi.mock('./module', { spy: true })` when you need to observe exported functions while keeping implementations.

## Configuration reminders

- Use a dedicated browser provider package such as `@vitest/browser-playwright`.
- Prefer Playwright for local and CI usage.
- If Angular CLI does not augment provider-specific locator types automatically, add the provider typing package to `tsconfig.spec.json`.
