---
title: 'Unit-testing a form component'
sidebarTitle: 'Testing'
---

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
interactive field touched, so the error of each interactive field shows,
whatever the timing. Hidden, disabled, and readonly fields stay untouched:

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

### Toolkit specs: jsdom or browser

The toolkit has two Vitest projects. `pnpm nx test toolkit` runs `*.spec.ts`
in jsdom. `pnpm nx run toolkit:test-browser` runs `*.browser.spec.ts` in
Chromium. jsdom builds the DOM but does not render it. It has no layout, does
not apply component stylesheets, does not evaluate media queries, and has no
accessibility tree.

Write a `*.browser.spec.ts` when an assertion depends on one of these. The
example specs are under `packages/toolkit/`.

| The assertion depends on                                                     | Example spec                                                          |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Layout: `getBoundingClientRect()`, `checkVisibility()`, target size          | `form-field/form-field-wrapper.selection-target-size.browser.spec.ts` |
| Computed CSS: custom properties, `light-dark()`, `:has()`, container queries | `form-field/form-field-wrapper.assistive.browser.spec.ts`             |
| Where focus lands after toolkit code moves it                                | `assistive/form-field-error-summary.a11y.browser.spec.ts`             |
| `:focus-visible` styles                                                      | `form-field/form-field-wrapper.state-focus-outline.browser.spec.ts`   |
| Media emulation: color scheme, forced colors, reduced motion                 | `form-field/form-field-wrapper.color-scheme.a11y.browser.spec.ts`     |
| The accessibility tree: an accessible name or description, an axe scan       | `form-field/form-field-wrapper.a11y.browser.spec.ts`                  |

Everything else stays in jsdom. That includes signals, error strategies, DI,
ARIA attribute values and ids, rendered text, classes, data attributes and
dev-mode warnings. Both projects use `@testing-library/angular`.

Three cases need care:

- **Stylesheet source.** Do not match a regex against a `.css` file or an
  injected `<style>` in place of a computed style. The regex still passes
  when a more specific rule wins, a selector stops matching, or a token
  resolves to another value. Read the computed value in a browser spec.
- **Visibility.** jsdom has no `checkVisibility()`, so
  `isElementCssVisible()` reports every control as visible. A jsdom spec can
  check `aria-invalid` on a visible control. Test a hidden or collapsed
  control in a browser spec.
- **Accessible names.** `getByRole('button', { name })` is fine in jsdom to
  find an element. When the name is the thing under test, use a browser spec.

jsdom, an ARIA attribute value:

```typescript
expect(input).toHaveAttribute('aria-describedby', 'email-hint email-error');
```

Browser, a computed color that jsdom cannot resolve:

```typescript
await expect
  .poll(() => getComputedStyle(content).borderTopColor)
  .toBe('rgb(161, 98, 7)');
```

### Run one spec

Fieldset visual checks compare focused form, control-group, and notification
screenshots in light and dark themes. Normal CI compares committed Linux
baselines and never updates them. Use the **Update Snapshots** workflow on the
feature branch with scope `playwright` and `playwright_filter` set to
`src/forms/04-form-field-wrapper/fieldset-appearance.spec.ts` to regenerate
only this suite. Review the image changes before merging. Local macOS
screenshots use separate baselines; do not use them as Linux baselines.

Put the file filter after `--`. Vitest does not know `--testFile`.

| Project               | Command                                                                                    |
| --------------------- | ------------------------------------------------------------------------------------------ |
| Toolkit, jsdom        | `pnpm nx test toolkit -- core/utilities/error-strategies.spec.ts`                          |
| Toolkit, browser      | `pnpm nx run toolkit:test-browser -- form-field/form-field-wrapper`                        |
| Demo                  | `pnpm nx test demo -- wizard.schemas`                                                      |
| Demo, other timezones | `pnpm nx run demo:test-timezones`                                                          |
| Demo end-to-end       | `pnpm nx e2e demo-e2e -- src/forms/05-advanced/advanced-wizard.spec.ts --project=chromium` |

- The toolkit filter is relative to `packages/toolkit`, the demo filter to
  `apps/demo`.
- To use installed Chrome instead of Playwright's bundled Chromium, prefix
  toolkit browser or demo e2e commands with `PLAYWRIGHT_BROWSER_CHANNEL=chrome`.
- The demo has no `typecheck` target, and its specs are not type-checked.
  `pnpm nx build demo` type-checks the app code.
- The demo end-to-end tests use a dev server on port 4600 that is already
  running, or start one.
- `demo:test-timezones` runs the `05-advanced` specs in Auckland and New York
  time. Every other run and CI use UTC, which hides off-by-one-day bugs.
  Date logic in the demo uses `Temporal.PlainDate`. CI runs this target when
  the demo changes.
- To prove a new test fails without the fix, change the code's behavior
  (for example, make a check always return `true`). Do not delete the code:
  the build then fails for a reason that has nothing to do with the test.

`check-published-package.spec.ts` starts `npm pack`. Under a full parallel
run it can pass the default timeout, so those blocks allow 30 seconds. If it
still fails, run the spec alone before you debug it.
