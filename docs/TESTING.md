# Unit-testing a form component

This guide shows how to unit-test a component that uses Angular Signal Forms'
`form()` and the toolkit's error components. You set a field value, touch the
field, and check the error text, `aria-invalid`, `aria-describedby`, and the
live region. It also covers submit.

## When to read this guide

Read it when you test a form component with Vitest and
`@testing-library/angular`, and you want to check that an invalid field shows
the right message and ARIA attributes.

Use something else for:

- **Accessibility scans.** For an axe-core WCAG 2.2 AA scan of a rendered
  fixture, use `expectNoA11yViolations()` from
  [`@ngx-signal-forms/toolkit/testing`](../packages/toolkit/testing/README.md)
  in a Vitest browser-mode spec. The specs in this guide run in jsdom and check
  single attributes and text, not a full scan.
- **End-to-end tests.** Playwright tests that drive a real browser are out of
  scope.

## Setup

Install `@testing-library/angular`, `@testing-library/dom`,
`@testing-library/user-event`, and `@testing-library/jest-dom` as dev
dependencies. Register the jest-dom matchers (`toBeInTheDocument()`,
`toHaveAttribute()`, and others) in your Vitest setup file:

```typescript
// test-setup.ts
import '@testing-library/jest-dom/vitest';
```

Render the component with the same toolkit configuration your app uses, so the
error timing matches:

```typescript
import { provideZonelessChangeDetection } from '@angular/core';
import { provideNgxSignalFormsConfig } from '@ngx-signal-forms/toolkit';
import { render, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

async function setup() {
  return render(YourFirstFormComponent, {
    providers: [
      provideZonelessChangeDetection(),
      provideNgxSignalFormsConfig({ defaultErrorStrategy: 'on-touch' }),
    ],
  });
}
```

## Drive controls through DOM events

Change the field through the DOM: click, type, and tab. Do not call
`model.set(...)` or write the field's signals. A signal write changes the
value but does not mark the field touched. With `on-touch` (the default) or
`on-submit` timing, the error then never shows.

```typescript
const user = userEvent.setup();
await setup();

const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;

// Focus the field, then tab away. This marks the field touched.
await user.click(nameInput);
await user.tab();
```

## Wait before you assert

The toolkit writes ARIA attributes and error visibility after Angular renders,
not during the event. With zoneless change detection, `userEvent` does not wait
for that work. Use `screen.findByText(...)`, which retries, for text. Wrap
attribute checks in `waitFor(...)`:

```typescript
const errorText = await screen.findByText(/name is required/i);
expect(errorText).toBeInTheDocument();

await waitFor(() => {
  expect(nameInput.getAttribute('aria-invalid')).toBe('true');
});
```

## Check the ID and ARIA contract

These IDs and attributes are stable, so tests can rely on them:

- The error container has the ID `{fieldName}-error`. The warning container
  has `{fieldName}-warning`.
- When the error is visible, the control has `aria-invalid="true"` and an
  `aria-describedby` that contains the error ID. `aria-describedby` is a
  space-separated list that can also hold hint IDs and your own IDs, so check
  that it contains the ID. Do not compare the whole string.
- Blocking errors render in a `role="alert"` element. Warnings render in a
  `role="status"` element.

```typescript
const describedBy = nameInput.getAttribute('aria-describedby');
expect(describedBy?.split(/\s+/)).toContain('contact-name-error');

const errorContainer = document.querySelector('#contact-name-error');
expect(errorContainer).toHaveAttribute('role', 'alert');
expect(errorContainer).toContainElement(errorText);
```

`{fieldName}` is the control's `id` when you use `ngx-form-field-error`
without a wrapper, as in this example. Inside `ngx-form-field-wrapper`, it is
the wrapper's `fieldName` input, or the control's `id` when you leave the
input out. For a custom wrapper, see [custom wrappers](./CUSTOM_WRAPPERS.md).

## Test submit

Click the submit button with `userEvent`. Angular's `submit()` marks every
field touched, so every field's error shows, whatever the timing:

```typescript
const submitButton = screen.getByRole('button', { name: /send message/i });
await user.click(submitButton);

expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
```

To check that the submission action ran, fill every field with valid data,
submit, and check the result. If the component shows a pending label while
`submitting()` is `true`, check for that label. It proves the action started,
and the test does not have to wait for the action to finish.

## Related documentation

- [`/testing` reference](../packages/toolkit/testing/README.md): `expectNoA11yViolations()` and `createA11yValidator()` for WCAG 2.2 AA scans
- [Custom wrappers](./CUSTOM_WRAPPERS.md): the ID contract when your own wrapper renders the errors
- [Best practices](./BEST_PRACTICES.md)

## For maintainers

The examples come from a runnable spec,
[`your-first-form.spec.ts`](../apps/demo/src/app/01-getting-started/your-first-form/your-first-form.spec.ts),
which tests
[`YourFirstFormComponent`](../apps/demo/src/app/01-getting-started/your-first-form/your-first-form.form.ts).
Run it with `pnpm nx test demo`. Keep this guide and the spec in sync.
[ADR-0004](./decisions/0004-wcag22-testing-strategy.md) explains why axe scans
run in browser mode and the other specs run in jsdom.
