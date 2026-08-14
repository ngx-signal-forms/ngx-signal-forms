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
npm install --save-dev axe-core@^4.5.0
```

## Import

```typescript
import {
  createA11yValidator,
  expectNoA11yViolations,
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
AA defaults, e.g. to waive a rule for a fixture that intentionally renders
unstyled controls. All keys are honored (`rules`, `resultTypes`, …) except
`runOnly`: the WCAG 2.2 AA tag set is the hard-fail baseline and is not
overridable. `runOnly` is omitted from this parameter's type, so passing it
in an object literal is a compile error — and because TypeScript only
enforces that omission on fresh literals, a `runOnly` smuggled in through a
value widened to `axe.RunOptions` is overridden at runtime as well; the
baseline always wins:

```typescript
await expectNoA11yViolations(container, {
  rules: { 'color-contrast': { enabled: false } },
});
```

> [!WARNING]
> Keep waivers narrow and fixture-specific. If you disable a rule broadly,
> you can accidentally hide regressions in production-facing components.

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

## Utilities

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
