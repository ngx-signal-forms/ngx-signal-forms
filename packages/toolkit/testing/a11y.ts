import axe from 'axe-core';

/**
 * axe-core tag set that maps to **WCAG 2.2 Level AA** conformance.
 *
 * WCAG is additive across versions: 2.2 AA requires every Level A and AA
 * success criterion from 2.0, 2.1, and 2.2. axe-core exposes one tag per
 * version/level, so the full 2.2 AA surface is the union below. There is no
 * separate `wcag22a` tag because axe-core has no automated rule for either
 * new 2.2 Level A criterion (Consistent Help, Redundant Entry) — both are
 * non-automatable and must be verified manually. Automated scanning with this
 * tag set therefore covers only a subset of full WCAG 2.2 AA conformance.
 *
 * @see https://www.w3.org/TR/WCAG22/
 * @see https://github.com/dequelabs/axe-core/blob/develop/doc/API.md#axe-core-tags
 */
export const WCAG_22_AA_TAGS = [
  'wcag2a',
  'wcag2aa',
  'wcag21a',
  'wcag21aa',
  'wcag22aa',
] as const;

export type WCAG_22_AA_TAG = (typeof WCAG_22_AA_TAGS)[number];

/**
 * Runs an axe-core audit against `context` and throws when any WCAG 2.2 AA
 * violation is found.
 *
 * Toolkit components are published primitives, so accessibility violations in
 * them are bugs: this helper is a **hard fail** by design. Use it inside Vitest
 * browser-mode specs after rendering a component fixture — one call per
 * rendered fixture is enough; it scans the whole subtree.
 *
 * @param context Element (or axe context spec) to scan. Defaults to the whole
 *   document body so a bare `await expectNoA11yViolations()` covers the render.
 * @param options Extra axe `RunOptions` merged over the WCAG 2.2 AA defaults —
 *   e.g. `{ rules: { 'color-contrast': { enabled: false } } }` for fixtures
 *   that intentionally render unstyled controls. The WCAG 2.2 AA `runOnly`
 *   tag set is the hard-fail baseline and is not overridable: `runOnly` is
 *   omitted from this parameter's type, so passing a literal with `runOnly`
 *   is a compile error, and the baseline always wins at runtime even for an
 *   `axe.RunOptions`-typed value carrying a `runOnly` (see implementation).
 */
export async function expectNoA11yViolations(
  context: axe.ElementContext = document.body,
  options: Omit<axe.RunOptions, 'runOnly'> = {},
): Promise<void> {
  return runA11yCheck(
    WCAG_22_AA_TAGS,
    context,
    options,
    (count) => `Found ${count} WCAG 2.2 AA accessibility violation(s):`,
  );
}

/**
 * Shape shared by {@link expectNoA11yViolations} and the validator returned
 * by {@link createA11yValidator} — a `context`/`options` pair (mirroring
 * `axe.run`'s own signature) that resolves on a clean scan and throws a
 * formatted report otherwise.
 */
export type A11yValidator = (
  context?: axe.ElementContext,
  options?: Omit<axe.RunOptions, 'runOnly'>,
) => Promise<void>;

/**
 * Builds a scoped {@link A11yValidator} — same call shape as
 * {@link expectNoA11yViolations}, but audited against a caller-chosen subset
 * of the WCAG 2.2 AA tag set instead of the full baseline.
 *
 * `expectNoA11yViolations` is deliberately a hard-coded, non-overridable
 * baseline (see its own doc) because toolkit components are published
 * primitives — any WCAG 2.2 AA violation in them is a bug. Consumers writing
 * a custom wrapper don't have that same all-or-nothing constraint: a fixture
 * might legitimately only need a rule subset checked at a given call site
 * (e.g. contrast already gated elsewhere). Getting that today means widening
 * to a raw `axe.RunOptions` to smuggle `runOnly` past the `Omit` guard —
 * which silently drops the baseline altogether, with no compile-time signal
 * of what is (and isn't) still covered.
 *
 * `tags` is typed as `readonly WCAG_22_AA_TAG[]` — the same union
 * {@link WCAG_22_AA_TAGS} is drawn from — not an arbitrary `string[]`, so a
 * typo'd or invented tag is a compile error rather than a silently-empty
 * scan. There is no escape hatch back to `string[]` here: the validator this
 * returns keeps the same `Omit<axe.RunOptions, 'runOnly'>` shape as
 * `expectNoA11yViolations`, so `runOnly` still can't be smuggled back in
 * through its own per-call `options` argument either.
 *
 * @param options `tags` — the axe tag subset to scan with; defaults to the
 *   full {@link WCAG_22_AA_TAGS} baseline when omitted. Omitting `tags`
 *   makes the returned validator behave exactly like
 *   `expectNoA11yViolations`, including its failure message; passing a
 *   narrower `tags` list labels the failure message with that scoped tag
 *   set instead, so a failure report never overclaims WCAG 2.2 AA coverage
 *   it didn't actually run.
 * @throws {Error} Synchronously, at creation time, if `tags` is provided but
 *   empty. An empty array is accepted by the type (`readonly
 *   WCAG_22_AA_TAG[]` has no minimum length), but would compile down to
 *   `runOnly: { type: 'tag', values: [] }`, which axe-core runs as "no
 *   tagged rules" — every scan would silently pass regardless of real
 *   violations. Failing fast here, before a validator is ever handed back to
 *   a caller, turns that silent gate-disable into an immediate, loud error
 *   instead of a validator that always resolves.
 */
export function createA11yValidator(
  options: { tags?: readonly WCAG_22_AA_TAG[] } = {},
): A11yValidator {
  if (options.tags?.length === 0) {
    throw new Error(
      '[ngx-signal-forms] createA11yValidator: tags must not be empty — omit the option to use the full WCAG 2.2 AA baseline.',
    );
  }

  const tags = options.tags ?? WCAG_22_AA_TAGS;
  const describeViolations =
    options.tags === undefined
      ? (count: number) =>
          `Found ${count} WCAG 2.2 AA accessibility violation(s):`
      : (count: number) =>
          `Found ${count} accessibility violation(s) for scoped tags ${tags.join(', ')}:`;
  return (context = document.body, runOptions = {}) =>
    runA11yCheck(tags, context, runOptions, describeViolations);
}

async function runA11yCheck(
  tags: readonly WCAG_22_AA_TAG[],
  context: axe.ElementContext,
  options: Omit<axe.RunOptions, 'runOnly'>,
  describeViolations: (count: number) => string,
): Promise<void> {
  const results = await axe.run(context, {
    // `resultTypes` before `...options` so callers can still override it.
    resultTypes: ['violations'],
    ...options,
    // `runOnly` last: TypeScript's excess-property check only rejects
    // `runOnly` on fresh object literals, so a caller could still widen a
    // value to `axe.RunOptions` and smuggle `runOnly` through `options`
    // (e.g. `const opts: axe.RunOptions = { runOnly: {...} }`). Applying
    // the tag baseline after the spread makes it win at runtime regardless,
    // so the guarantee holds even when the type-level guard (the `Omit`
    // above) is bypassed this way.
    runOnly: { type: 'tag', values: [...tags] },
  });

  if (results.violations.length === 0) {
    return;
  }

  const report = results.violations
    .map((violation) => {
      const nodes = violation.nodes
        .map((node) => `      - ${node.target.join(' ')}`)
        .join('\n');
      return [
        `  • [${violation.impact ?? 'n/a'}] ${violation.id}: ${violation.help}`,
        `    ${violation.helpUrl}`,
        nodes,
      ].join('\n');
    })
    .join('\n');

  throw new Error(
    `${describeViolations(results.violations.length)}\n${report}`,
  );
}

/**
 * Finds the `[role="alert"]` element within `container` whose text content
 * includes `text`, or `undefined` if none matches.
 *
 * Several toolkit surfaces (grouped fieldsets, error summaries) render
 * alongside per-field error regions that stay mounted-but-empty per the
 * WCAG 4.1.3 first-insertion pattern (see `expectNoA11yViolations`'s own
 * doc). A bare `getByRole('alert')` query is ambiguous whenever more than
 * one such region is present; this narrows to the one actually carrying the
 * expected message, for asserting on it before running the a11y scan.
 */
export function findAlertContaining(
  container: ParentNode,
  text: string,
): HTMLElement | undefined {
  return Array.from(
    container.querySelectorAll<HTMLElement>('[role="alert"]'),
  ).find((el) => el.textContent?.includes(text));
}
