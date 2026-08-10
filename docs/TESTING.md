# Unit-testing a form component

This guide shows how to unit-test a component built with Angular Signal
Forms' `form()` and the toolkit's error-rendering components — set a field
value, mark it touched, and assert the rendered error text, `aria-invalid`,
`aria-describedby`, and live-region markup. It also covers triggering submit
and asserting `on-submit`-strategy behavior.

The condensed version of this pattern lives in the [use-case FAQ, "How do I
unit-test a form component…"](./FAQ.md#how-do-i-unit-test-a-form-component-set-value-touch-assert-rendered-error--aria-invalid-in-vitesttestbed).
This guide is the full walkthrough that answer links to.

## When to read this guide

Read this if your project uses Vitest (this repo's test runner) and you want
to unit-test a component that renders a Signal Forms field — asserting that
an invalid field shows the right error message, carries the right ARIA
attributes, and that submitting the form behaves correctly.

This guide does not cover:

- **Accessibility conformance scans.** For an automated WCAG 2.2 AA audit of
  a rendered fixture, use `expectNoA11yViolations()` from
  [`@ngx-signal-forms/toolkit/testing`](../packages/toolkit/testing/README.md)
  in a Vitest **browser-mode** spec (`*.a11y.browser.spec.ts` in this repo).
  This guide's specs run in jsdom instead — assertions target specific
  attributes and text, not a full accessibility tree scan. See
  [ADR-0004](./decisions/0004-wcag22-testing-strategy.md) for why the two run
  in different modes.
- **End-to-end tests.** Playwright specs (`*.e2e.spec.ts`) drive a real
  browser and are out of scope here.

## The runnable example

The example below is not inlined from a copy — it is the real spec, kept
runnable so it cannot drift from what the guide describes:

**[`apps/demo/src/app/01-getting-started/your-first-form/your-first-form.spec.ts`](../apps/demo/src/app/01-getting-started/your-first-form/your-first-form.spec.ts)**

It tests
[`YourFirstFormComponent`](../apps/demo/src/app/01-getting-started/your-first-form/your-first-form.form.ts),
the toolkit's own "hello world" contact form, and runs as part of the demo
app's normal test target:

```bash
pnpm nx test demo
```

## Setup: TestBed + a component using `form()` and the wrapper

Render the component the same way `@testing-library/angular`'s `render()`
does under the hood — through `TestBed` — and provide the same toolkit
configuration your app bootstraps with (`main.ts`), so strategy defaults
match:

```typescript
import { provideZonelessChangeDetection } from '@angular/core';
import { provideNgxSignalFormsConfig } from '@ngx-signal-forms/toolkit';
import { render, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

async function setup() {
  return render(YourFirstFormComponent, {
    providers: [
      provideZonelessChangeDetection(),
      provideNgxSignalFormsConfig({
        defaultErrorStrategy: 'on-touch',
        autoAria: true,
      }),
    ],
  });
}
```

`@testing-library/angular`, `@testing-library/dom`, and
`@testing-library/user-event` are already workspace dependencies (see
`package.json`'s `testing-library` catalog group) — no extra install is
needed inside this repo. In your own project, install them as dev
dependencies alongside Vitest.

## Drive controls through native events, not signal writes

Write to the field through the DOM — click, type, tab — not by writing
`model.set(...)` or calling the field's signals directly. A direct signal
write changes the value but never marks the field `touched`, so an
`'on-touch'` (the toolkit default) or `'on-submit'` strategy would never
reveal the error your test is trying to observe:

```typescript
const user = userEvent.setup();
await setup();

const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;

// Focus in, then tab out — this is what flips the field's `touched` signal.
await user.click(nameInput);
await user.tab();
```

## Flush effects before asserting

The toolkit's ARIA attributes and error visibility are written from
`afterEveryRender` and `effect()` callbacks, not synchronously on the event
that triggered them. Under zoneless change detection (the default in this
repo's demos), a `userEvent` interaction schedules that work but does not
wait for it. Use `screen.findByText(...)` (which polls) for text, and wrap
attribute reads in `waitFor(...)`:

```typescript
const errorText = await screen.findByText(/name is required/i);
expect(errorText).toBeInTheDocument();

await waitFor(() => {
  expect(nameInput.getAttribute('aria-invalid')).toBe('true');
});
```

## Asserting the id/ARIA contract

The toolkit's error id, `aria-invalid`, and `aria-describedby` wiring is a
stable, documented contract:

- Error containers use the id `{fieldName}-error` (warnings use
  `{fieldName}-warning`).
- The bound control carries `aria-invalid="true"` and an `aria-describedby`
  that includes that id, once the error should be visible under the active
  strategy. `aria-describedby` is a space-separated id list — the toolkit may
  compose it from preserved ids, hints, and the error/warning ids together —
  so assert membership rather than an exact string match.
- Blocking errors render inside a `role="alert"` element (see
  [`NgxFormFieldError`](../packages/toolkit/assistive/form-field-error.ts)) —
  an implicit assertive live region, so no error is missed even on its first
  appearance.

```typescript
const describedBy = nameInput.getAttribute('aria-describedby');
expect(describedBy).not.toBeNull();
expect(describedBy?.split(/\s+/)).toContain('contact-name-error');

const errorContainer = document.querySelector('#contact-name-error');
expect(errorContainer).toHaveAttribute('role', 'alert');
expect(errorContainer).toContainElement(errorText);
```

`{fieldName}` is whichever field name resolves for the control — the
element's own `id` when using `NgxFormFieldError` directly (as in the
example spec), or the wrapper's resolved field name when using
`ngx-form-field-wrapper`. See
[`docs/CUSTOM_WRAPPERS.md`](./CUSTOM_WRAPPERS.md) if you're testing a custom
wrapper instead of the built-in one.

## Triggering submit and asserting `on-submit`-strategy behavior

Click the submit button through `userEvent`, the same as any other control —
Angular's own `submit()` (invoked internally by the form's `submission`
config) marks every field touched, which is what reveals every field's
error at once under any of the toolkit's strategies:

```typescript
const submitButton = screen.getByRole('button', { name: /send message/i });
await user.click(submitButton);

expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
```

To assert a form's declarative `submission.action` actually ran (rather than
being blocked by validation), fill every field with valid data first, submit,
and assert on the resulting state change. A pending label the component
renders while its action is in flight (`contactForm().submitting()`, in the
example) is a reliable, fast signal that the action started — prefer it over
awaiting the action's own delay in the test, which only makes the spec slower
without proving anything more. The example spec's last test does this against
`YourFirstFormComponent`'s async `submission.action`.

## Related documentation

- [Use-case FAQ — unit-testing a form component](./FAQ.md#how-do-i-unit-test-a-form-component-set-value-touch-assert-rendered-error--aria-invalid-in-vitesttestbed) — the condensed version of this guide
- [`packages/toolkit/testing/README.md`](../packages/toolkit/testing/README.md) — `expectNoA11yViolations()` for WCAG 2.2 AA conformance scans (browser-mode specs)
- [ADR-0004](./decisions/0004-wcag22-testing-strategy.md) — why conformance scans run in browser mode and everything else in jsdom
- [`docs/BEST_PRACTICES.md`](./BEST_PRACTICES.md) — the toolkit's five best practices
- [`docs/CUSTOM_WRAPPERS.md`](./CUSTOM_WRAPPERS.md) — testing considerations when the id/ARIA contract is produced by a custom wrapper instead of the built-in one
