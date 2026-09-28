# @ngx-signal-forms/toolkit/testing

> WCAG 2.2 AA accessibility test harness for `@ngx-signal-forms/toolkit`.

## Why this entry point exists

The toolkit's ARIA wiring, live-region roles, and error-display markup are
checked against the WCAG 2.2 AA axe-core ruleset as a hard-fail gate in the
toolkit's own test suite (see [Accessibility](../../../README.md#accessibility)
in the root README). This entry point publishes the same assertion helper so
you can run the identical check against your own forms and custom wrappers.

It has no dependency on the rest of the toolkit's public API — import it
directly wherever you render a fixture in a test.

## Install

`axe-core` is an optional peer dependency of `@ngx-signal-forms/toolkit`; it
is only required if you import from this entry point.

```bash
npm install --save-dev axe-core@^4.13.0
```

## Import

```typescript
import {
  createA11yValidator,
  expectNoA11yViolations,
  expectVisibleFocusIndicator,
  findAlertContaining,
  WCAG_22_AA_TAGS,
} from '@ngx-signal-forms/toolkit/testing';
```

## Usage

`expectNoA11yViolations` runs an axe-core audit against an element (or the
whole `document.body` by default) and throws when any WCAG 2.2 AA violation
is found. Call it once per rendered fixture in a Vitest browser-mode spec —
it scans the whole subtree:

```typescript
import { expectNoA11yViolations } from '@ngx-signal-forms/toolkit/testing';

it('has no accessibility violations', async () => {
  const { container } = await render(MyFormComponent);

  await expectNoA11yViolations(container);
});
```

Pass extra axe `RunOptions` as a second argument to merge over the WCAG 2.2
AA defaults. All keys are honored (`rules`, `resultTypes`, …) except
`runOnly`: the WCAG 2.2 AA tag set is the hard-fail baseline and is not
overridable. `runOnly` is omitted from this parameter's type, so passing it
in an object literal is a compile error — and because TypeScript only
enforces that omission on fresh literals, a `runOnly` smuggled in through a
value widened to `axe.RunOptions` is overridden at runtime as well; the
baseline always wins:

Apply the intended theme and keep applicable rules enabled, including contrast.
An unstyled fixture is not a reason to disable contrast. Any narrow waiver must
explain why the rule is outside that fixture's scope and name the representative
themed browser check that covers it without the waiver.

Also verify keyboard operation, visible focus, summary focus destinations, and
error/warning transitions. Live-region hosts must precede their first message;
verify announcements with a screen reader. Axe alone is not full WCAG evidence.

## Scoping the tag baseline: `createA11yValidator(options?)`

`expectNoA11yViolations` is deliberately locked to the full WCAG 2.2 AA tag
set — that's the right call for the toolkit's own components, which are
published primitives where any violation is a bug. A custom wrapper you're
building doesn't always have that same all-or-nothing constraint: a fixture
might only need a narrower rule subset checked at a given call site. Use
`createA11yValidator` to build a validator scoped to your own tag subset,
without giving up the same non-overridable `runOnly` guarantee:

```typescript
import { createA11yValidator } from '@ngx-signal-forms/toolkit/testing';

// Scoped to Level A only — narrower than the toolkit's own baseline.
const expectNoLevelAViolations = createA11yValidator({
  tags: ['wcag2a', 'wcag21a'],
});

it('has no WCAG 2.2 Level A violations', async () => {
  const { container } = await render(MyCustomWrapper);

  await expectNoLevelAViolations(container);
});
```

The validator `createA11yValidator` returns has the exact same call shape as
`expectNoA11yViolations` — `(context?, options?)` — so it's a drop-in
replacement anywhere you'd use the default helper. `tags` accepts only
`WCAG_22_AA_TAG` values (the same union `WCAG_22_AA_TAGS` is drawn from), so
a typo'd or invented tag is a compile error rather than a silently-empty
scan; there's no escape hatch to widen it to an arbitrary `string[]`. An
empty array (`tags: []`) does type-check — the type has no minimum length —
but `createA11yValidator` throws synchronously at creation time instead of
handing back a validator that would silently pass every scan. Omit `tags`
(or call `createA11yValidator()` with no arguments) to get a validator that
behaves exactly like `expectNoA11yViolations` — the full baseline is the
default, not a special case.

## Reporting axe `incomplete` results

axe marks a check `incomplete` — rather than pass or fail — when it needs a
human to confirm the result, most often `color-contrast` over a background it
cannot resolve to one flat color. `expectNoA11yViolations` and
`createA11yValidator`'s returned validator accept an `incomplete` option:

```typescript
await expectNoA11yViolations(container, { incomplete: 'warn' });
```

- `'ignore'` (the default): incomplete results are not inspected at all — a
  bare call behaves exactly as it did before this option existed.
- `'warn'`: every incomplete result is logged via `console.warn` for manual
  review, without failing the scan.
- `'fail'`: same logging, and additionally throws if any `color-contrast`
  result is incomplete. Every other rule's incomplete results are still only
  logged.

`color-contrast` incomplete results are never turned into a hard failure by
this package's own default, even though that is the rule most likely to hide
a real WCAG 1.4.3 violation: every toolkit textual control paints a
**transparent** `background-color` so its border can show through, and axe's
static contrast algorithm cannot always trace a transparent-background
element back to the color it actually renders over. Trying `'fail'` across
the toolkit's own suite surfaced exactly one case — the outlined, invalid
email field — and it was a false positive, not a real defect: the toolkit's
own specs already prove that field's contrast is compliant, with manual
color-blending math, for exactly this reason.

## Utilities

### `expectVisibleFocusIndicator(element)`

Asserts that `element` is the current keyboard focus target (or a
`:focus-within` ancestor of it) and that its computed style paints a visible
focus indicator — WCAG 2.2 SC 2.4.7 (Focus Visible). No axe rule performs
this check: axe only scans the resting, unfocused DOM. Move focus with a real
keyboard interaction first:

```typescript
import { expectVisibleFocusIndicator } from '@ngx-signal-forms/toolkit/testing';
import { userEvent } from 'vitest/browser';

await userEvent.click(anchor); // a preceding, focusable element
await userEvent.tab();

expectVisibleFocusIndicator(document.activeElement!);
```

This is a **presence** check only — it confirms an outline or box-shadow
renders with a non-transparent color and a nonzero width/blur/spread, not
that it is legible against its background. It does not measure contrast, so
it is not a substitute for WCAG 1.4.11 (Non-text Contrast) coverage; the
toolkit's own specs pair it with manual contrast math where a fixture needs
to prove its focus indicator also clears the 3:1 floor.

### `findAlertContaining(container, text)`

Finds the first `[role="alert"]` element whose text contains the given
string. Useful for asserting that the expected error message is on screen
_before_ running the a11y scan, so a missing error fails with a clear
assertion instead of a silent pass:

```typescript
const errorAlert = findAlertContaining(container, 'Email is required');
expect(errorAlert).toBeTruthy();

await expectNoA11yViolations(container);
```

Returns the matching `HTMLElement`, or `undefined` when no alert contains
the text.

## `WCAG_22_AA_TAGS`

The axe-core tag set `expectNoA11yViolations` scans with by default:

```typescript
export const WCAG_22_AA_TAGS = [
  'wcag2a',
  'wcag2aa',
  'wcag21a',
  'wcag21aa',
  'wcag22aa',
] as const;
```

WCAG is additive across versions, so the full 2.2 AA surface is the union of
every prior level/version tag — there is no separate `wcag22a` tag because
axe-core has no automated rule for either new 2.2 Level A criterion
(Consistent Help, Redundant Entry); both must be verified manually. Automated
scanning with this tag set therefore covers only a subset of full WCAG 2.2 AA
conformance — see [Accessibility](../../../README.md#accessibility) in the
root README for what the toolkit's own automation does and does not cover.

## Related documentation

- [Unit-testing a form component](../../../docs/TESTING.md) — TestBed/Vitest setup for the rest of a form component's behavior: rendered errors, `aria-invalid`/`aria-describedby`, and submit handling. This entry point covers only the WCAG conformance scan.
- [Toolkit core](../README.md) — error strategies, ARIA, configuration
- [Root README — Accessibility](../../../README.md#accessibility) — what the toolkit verifies in CI and what remains your responsibility
