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
  expectNoA11yViolations,
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
unstyled controls:

```typescript
await expectNoA11yViolations(container, {
  rules: { 'color-contrast': { enabled: false } },
});
```

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

- [Toolkit core](../README.md) — error strategies, ARIA, configuration
- [Root README — Accessibility](../../../README.md#accessibility) — what the toolkit verifies in CI and what remains your responsibility

## License

MIT © [ngx-signal-forms](https://github.com/ngx-signal-forms/ngx-signal-forms)
