---
description: Testing toolkit surface. Use when adding axe-core WCAG 2.2 AA assertions to a Vitest browser-mode specification.
---

# Toolkit Testing

Implements the `@ngx-signal-forms/toolkit/testing` entry point.

Read `../references/api.md` for the full export list and exact signatures.

`axe-core` is an **optional peer dependency** — it is only required when you
import from this entry point. Install it as a devDependency alongside your test
runner.

## Principle

Toolkit components are published primitives, so accessibility violations in them
are bugs. `expectNoA11yViolations` runs axe-core against a rendered fixture and
**hard-fails (throws)** on any WCAG 2.2 AA violation — it is an assertion, not a
report. Use it inside Vitest browser-mode specs after rendering a component
fixture. One call per fixture scans the whole DOM subtree.

## API

```typescript
import {
  createA11yValidator,
  expectNoA11yViolations,
  findAlertContaining,
  WCAG_22_AA_TAGS, // ['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']
  type A11yValidator,
  type WCAG_22_AA_TAG,
} from '@ngx-signal-forms/toolkit/testing';
```

- `expectNoA11yViolations(context?, options?)` — `context` defaults to
  `document.body`, so a bare `await expectNoA11yViolations()` covers the whole
  render. `options` is `Omit<axe.RunOptions, 'runOnly'>` merged over the
  defaults — use it to disable rules that don't apply to a fixture (e.g.
  `color-contrast` for intentionally unstyled controls). The WCAG 2.2 AA
  `runOnly` tag set is the hard-fail baseline and is **not overridable**:
  passing `runOnly` in a fresh literal is a compile error, and the baseline
  wins at runtime even when a pre-typed `axe.RunOptions` value smuggles one
  through. `resultTypes` stays caller-overridable.
- `createA11yValidator(options?: { tags?: readonly WCAG_22_AA_TAG[] })` —
  returns an `A11yValidator` (same `(context?, options?) => Promise<void>`
  shape as `expectNoA11yViolations`) scoped to a caller-chosen tag subset.
  Reach for this in a custom wrapper that legitimately only needs part of
  the WCAG 2.2 AA tag set checked at a given call site — the toolkit's own
  specs keep using `expectNoA11yViolations`'s hard-coded baseline. `tags` is
  typed to `WCAG_22_AA_TAG`, so an invented or typo'd tag is a compile
  error, not a silently-empty scan; omitted, it defaults to the full
  `WCAG_22_AA_TAGS` baseline. `tags: []` type-checks (the type has no
  minimum length) but throws synchronously at creation time instead of
  returning a validator that would silently pass every scan. The returned
  validator keeps the same non-overridable `runOnly` guarantee as
  `expectNoA11yViolations`.
- `WCAG_22_AA_TAGS` — the axe tag set the harness runs. There is no `wcag22a`
  tag: the two new 2.2 Level A criteria are non-automatable, so automated
  scanning covers only a subset of full 2.2 AA conformance.
- `findAlertContaining(container, text)` — finds the `[role="alert"]` element
  whose text includes `text`. Toolkit surfaces mount several live regions at
  once (some mounted-but-empty per the WCAG 4.1.3 first-insertion pattern), so
  a bare `getByRole('alert')` is ambiguous — narrow to the region carrying the
  expected message before asserting on it or scanning.

## Workflow

1. Render the component fixture (Angular `TestBed` + `ComponentFixture`) in a
   Vitest browser-mode spec, and drive it into the state you want to audit.
2. `await expectNoA11yViolations()` — or pass a specific element/context to
   scope the scan to a subtree.
3. Merge axe `RunOptions` only when a fixture legitimately can't satisfy a rule.

## Example

```typescript
import { TestBed } from '@angular/core/testing';
import { expectNoA11yViolations } from '@ngx-signal-forms/toolkit/testing';
import { MyFieldComponent } from './my-field.component';

it('has no WCAG 2.2 AA violations when showing an error', async () => {
  const fixture = TestBed.createComponent(MyFieldComponent);
  fixture.componentRef.setInput('touched', true);
  await fixture.whenStable();

  // Unstyled test host has no theme, so contrast checks don't apply.
  await expectNoA11yViolations(fixture.nativeElement, {
    rules: { 'color-contrast': { enabled: false } },
  });
});
```

## Error Handling

- If the import fails to resolve `axe-core`: add `axe-core` as a devDependency —
  it is an optional peer dep, not bundled.
- If a scan flags `color-contrast` on a bare test host: disable that rule via
  `options` rather than styling the fixture.
- If passing `runOnly` in `options` fails to compile: that is the guard working
  — the WCAG 2.2 AA tag set is a fixed baseline. Narrow the `context` or
  disable individual `rules` instead.
- If the assertion passes but you expected coverage of a 2.2 Level A criterion
  (Consistent Help, Redundant Entry): those are non-automatable — verify them
  manually.
