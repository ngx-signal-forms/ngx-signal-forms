---
title: '@ngx-signal-forms/toolkit/testing'
sidebarTitle: 'testing'
---

Accessibility assertions for component tests. The helpers run
[axe-core](https://github.com/dequelabs/axe-core) with the WCAG 2.2 AA rule
set and fail the test on any violation. The toolkit tests its own components
with the same helpers.

## When to use it

Use it to check your forms, custom controls, and custom wrappers in Vitest
browser-mode or other DOM tests. Call it after you render a fixture.

It does not test behavior such as rendered messages or submit handling. For
that, see [testing form components](/docs/TESTING). An axe scan is
also not full WCAG evidence. Still test keyboard use, visible focus, and
screen reader announcements.

The helpers do not depend on the rest of the toolkit. You can use them on any
Angular component.

## Install

`axe-core` is an optional peer dependency (`>=4.13.0 <5`). Install it only
when you use `/testing`:

```bash
npm install --save-dev axe-core
```

## Import

```typescript
import {
  createA11yValidator,
  expectNoA11yViolations,
  expectVisibleFocusIndicator,
  WCAG_22_AA_TAGS,
} from '@ngx-signal-forms/toolkit/testing';
```

## Quick start

`expectNoA11yViolations` scans an element and its children. Without an
argument, it scans `document.body`. Call it once per rendered fixture:

```typescript
import { expectNoA11yViolations } from '@ngx-signal-forms/toolkit/testing';

it('has no accessibility violations', async () => {
  const { container } = await render(MyFormComponent);

  await expectNoA11yViolations(container);
});
```

Scan each state that matters, for example after a failed submit, when
errors and warnings show.

## API reference

| Export                                       | Kind     | Use it to                                                                                    |
| -------------------------------------------- | -------- | -------------------------------------------------------------------------------------------- |
| `expectNoA11yViolations(context?, options?)` | Function | Run axe with the WCAG 2.2 AA tags. Rejects when axe finds a violation.                       |
| `createA11yValidator(options?)`              | Function | Build a validator like `expectNoA11yViolations` with a smaller tag set.                      |
| `expectVisibleFocusIndicator(element)`       | Function | Assert that the focused element shows a visible focus indicator.                             |
| `WCAG_22_AA_TAGS`                            | Constant | The axe tags that `expectNoA11yViolations` uses.                                             |
| `WCAG_22_AA_TAG`                             | Type     | One tag from `WCAG_22_AA_TAGS`.                                                              |
| `A11yCheckOptions`                           | Type     | axe `RunOptions` without `runOnly`, plus `incomplete`.                                       |
| `A11yValidator`                              | Type     | The function type of `expectNoA11yViolations` and of a created validator.                    |
| `IncompleteResultMode`                       | Type     | `'ignore' \| 'warn' \| 'fail'`. See [incomplete results](#reporting-axe-incomplete-results). |

### Options

The second argument takes axe `RunOptions`, such as `rules` or
`resultTypes`, and merges them over the defaults. You cannot change the tag
set: `runOnly` is not in the type, and the helper ignores it at runtime.

```typescript
await expectNoA11yViolations(container, {
  resultTypes: ['violations'],
});
```

Apply your real theme in the fixture and keep contrast rules on. If you turn
off a rule, write down why the fixture does not need it and which themed test
covers it.

## Scoping the tag baseline: `createA11yValidator(options?)`

Use `createA11yValidator` when a fixture needs a smaller set of WCAG tags. The
returned validator has the same call signature as `expectNoA11yViolations`:

```typescript
import { createA11yValidator } from '@ngx-signal-forms/toolkit/testing';

const expectNoLevelAViolations = createA11yValidator({
  tags: ['wcag2a', 'wcag21a'],
});

it('has no WCAG Level A violations', async () => {
  const { container } = await render(MyCustomWrapper);

  await expectNoLevelAViolations(container);
});
```

- `tags` accepts only values from `WCAG_22_AA_TAGS`. A typo is a compile
  error.
- An empty array throws when you create the validator. An empty tag set would
  pass every scan.
- Without `tags`, the validator uses the full WCAG 2.2 AA set.
- With `tags`, the failure message names the scoped tags that ran. Without
  `tags`, it names the WCAG 2.2 AA baseline.

<a id="reporting-axe-incomplete-results"></a>

## Reporting axe `incomplete` results

axe reports a check as `incomplete` when a person must confirm it. This
happens most often with `color-contrast` over a background that axe cannot
compute. Both helpers accept an `incomplete` option:

```typescript
await expectNoA11yViolations(container, { incomplete: 'warn' });
```

| Value                | Effect                                                                                    |
| -------------------- | ----------------------------------------------------------------------------------------- |
| `'ignore'` (default) | The helper does not read incomplete results.                                              |
| `'warn'`             | The helper logs each incomplete result with `console.warn`. The scan passes.              |
| `'fail'`             | The helper logs like `'warn'`. It also fails when a `color-contrast` check is incomplete. |

Toolkit controls use a transparent background, so axe often cannot compute
their contrast. That is why `'fail'` can report a false positive. Confirm a
failure with a manual contrast check before you change your styles.

## Utilities

### `expectVisibleFocusIndicator(element)`

Asserts that `element` has keyboard focus, or contains the focused element,
and shows a visible focus indicator. This checks WCAG 2.2 SC 2.4.7 (Focus
Visible). axe cannot check it, because axe scans the page without focus.

Move focus with the keyboard first. A call to `element.focus()` does not
always match `:focus-visible` in Chromium:

```typescript
import { expectVisibleFocusIndicator } from '@ngx-signal-forms/toolkit/testing';
import { userEvent } from 'vitest/browser';

await userEvent.click(anchor); // a focusable element before the target
await userEvent.tab();

expectVisibleFocusIndicator(document.activeElement!);
```

The rules:

- If `element` is the focused element, it must match `:focus-visible`.
- If `element` is a container, it must match `:focus-within`.
- It must have an `outline` with a width and a visible color, or a
  `box-shadow` with a blur or spread and a visible color.

The helper checks that an indicator exists. It does not measure contrast, so
it does not cover WCAG 1.4.11 (Non-text Contrast).

## `WCAG_22_AA_TAGS`

The axe tags that `expectNoA11yViolations` uses:

```typescript
export const WCAG_22_AA_TAGS = [
  'wcag2a',
  'wcag2aa',
  'wcag21a',
  'wcag21aa',
  'wcag22aa',
] as const;
```

WCAG 2.2 AA includes every A and AA criterion from 2.0 and 2.1, so the set
lists each version. There is no `wcag22a` tag: axe has no automated rule for
the two new Level A criteria (Consistent Help, Redundant Entry). Check those
by hand.

## Related documentation

- [Testing form components](/docs/TESTING): rendered errors, ARIA attributes, and submit handling
- [Accessibility](/README#accessibility): what the toolkit wires and what you still own

## For maintainers

- The toolkit's own specs call these helpers with `incomplete: 'warn'` through
  `testing/a11y-internal.ts`. The public default stays `'ignore'`.
- `form-field-wrapper.state-focus-outline.browser.spec.ts` pairs
  `expectVisibleFocusIndicator` with manual contrast math for the 3:1 check.
- Test strategy: [ADR-0004](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/77ce2f7de996cc397982199d1b3822dedb259b29/docs/decisions/0004-wcag22-testing-strategy.md).
