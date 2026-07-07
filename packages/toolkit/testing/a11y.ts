import axe from 'axe-core';

/**
 * axe-core tag set that maps to **WCAG 2.2 Level AA** conformance.
 *
 * WCAG is additive across versions: 2.2 AA requires every Level A and AA
 * success criterion from 2.0, 2.1, and 2.2. axe-core exposes one tag per
 * version/level, so the full 2.2 AA surface is the union below. (axe groups
 * the two new 2.2 Level A criteria — Consistent Help, Redundant Entry — under
 * the `wcag22aa` tag, so no separate `wcag22a` tag is needed.)
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
 *   that intentionally render unstyled controls.
 */
export async function expectNoA11yViolations(
  context: axe.ElementContext = document.body,
  options: axe.RunOptions = {},
): Promise<void> {
  const results = await axe.run(context, {
    runOnly: { type: 'tag', values: [...WCAG_22_AA_TAGS] },
    resultTypes: ['violations'],
    ...options,
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
    `Found ${results.violations.length} WCAG 2.2 AA accessibility violation(s):\n${report}`,
  );
}
