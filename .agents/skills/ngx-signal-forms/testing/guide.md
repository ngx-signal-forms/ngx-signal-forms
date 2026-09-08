# Toolkit Testing

Implements the `@ngx-signal-forms/toolkit/testing` entry point.

Use the [source index](../references/api.md) for public exports and signatures.

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
  defaults. Keep all applicable rules enabled, including `color-contrast`.
  The WCAG 2.2 AA
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
3. Use the full `WCAG_22_AA_TAGS` baseline. Fix failures rather than narrowing
   tags or disabling contrast to get a passing test.
4. An intentional fixture-specific rule exclusion must explain why the rule
   is outside that fixture's scope and name the representative themed
   browser test that covers it without the exclusion. An unstyled fixture
   alone is not a reason to skip contrast. Apply the real theme when colors
   are part of the component's behavior.
5. Test keyboard operation, visible focus, summary-to-control focus, and
   error/warning transitions in addition to axe. Check live-region hosts
   before message updates, then verify announcement behavior with a screen
   reader. An axe pass is not full WCAG conformance.

## Submission checks

For changed submission behavior, use the consumer's existing test runner and
service mocks. Test accepted and invalid attempts, pending refusal with a later
deliberate retry, rejected saves, and overlapping attempts. Assert callback
counts, `submitting()` cleanup, submit-only feedback, and the actual invalid
focus destination. Pending refusal is not automatic wait-and-retry.

For warning-aware flows, include clean, warning-only, descendant-blocking, and
pending states. Assert `Promise<boolean>` outcomes and rejection separately.
Check independent error/warning timing and mounted live-region hosts. See the
[core contract](../core/guide.md#warning-helpers).

## Browser-state checks

Choose the checks for the changed behavior, not only an initial axe scan:

- Inspect the actual element carrying `aria-invalid`, including relocated inner
  inputs/comboboxes. Assert its value before collapse, while hidden, and after
  reopening with changed validation state. A laid-out wrapper is not evidence
  that its inner control is visible.
- For a radio cluster, hide one option while a sibling remains visible. The
  hidden option must lose `aria-invalid`; visible siblings keep the correct
  value. Then hide the whole group and reopen it. Assert each actual carrier,
  not only the group host or a cached identity visibility flag.
- Check every `aria-describedby` token against an existing unique DOM ID.
  Exercise error-only, warning-only, and mixed states with different strategies.
- Assert live-region hosts exist before content appears. Update empty → warning
  → blocking → clear without recreating the hosts. Verify actual announcements
  with a screen reader; DOM assertions alone are not announcement evidence.
- Drive custom controls with the keyboard, verify visible focus, move between
  composite parts, then leave the control. Check summary focus destinations.
- Apply the real supported themes for contrast, focus, and feedback checks.
  Keep the full axe baseline; an unstyled fixture is not a reason to disable it.

## Done

The changed interaction has state-transition assertions and a themed browser
axe result with its scope recorded. Keyboard/focus evidence and live-region
checks accompany it. Report missing browser or screen-reader checks explicitly;
an axe pass is not full WCAG evidence.

## Example fixture

```typescript
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { form, FormField, required } from '@angular/forms/signals';
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';
import { expectNoA11yViolations } from '@ngx-signal-forms/toolkit/testing';
import { it } from 'vitest';

@Component({
  selector: 'test-field',
  imports: [FormField, NgxFormField],
  styles: `
    :host {
      display: block;
      color: #111827;
      background: #ffffff;
      padding: 1rem;
    }
  `,
  template: `
    <ngx-form-field-wrapper [formField]="profileForm.name">
      <label for="name">Name</label>
      <input id="name" [formField]="profileForm.name" />
    </ngx-form-field-wrapper>
  `,
})
class TestField {
  readonly profileForm = form(signal({ name: '' }), (path) => {
    required(path.name, { message: 'Name is required' });
  });
}

it('has no WCAG 2.2 AA violations when showing an error', async () => {
  TestBed.configureTestingModule({ imports: [TestField] });
  const fixture = TestBed.createComponent(TestField);
  fixture.detectChanges();
  fixture.componentInstance.profileForm.name().markAsTouched();
  fixture.detectChanges();
  await fixture.whenStable();

  await expectNoA11yViolations(fixture.nativeElement);
});
```

## Error Handling

- If the import fails to resolve `axe-core`: add `axe-core` as a devDependency —
  it is an optional peer dep, not bundled.
- If a scan flags `color-contrast`: inspect foreground and background colors
  under the intended theme and fix them. Keep representative light/dark
  browser coverage when both themes are supported.
- If passing `runOnly` in `options` fails to compile: that is the guard working
  — the WCAG 2.2 AA tag set is a fixed baseline. Scope `context` only to the
  component under test; do not bypass a failing rule by changing scan scope.
- If the assertion passes but you expected coverage of a 2.2 Level A criterion
  (Consistent Help, Redundant Entry): those are non-automatable — verify them
  manually.
