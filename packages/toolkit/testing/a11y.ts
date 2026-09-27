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
 * How {@link expectNoA11yViolations} and {@link createA11yValidator} treat
 * axe `incomplete` results — checks axe could not resolve to a pass or a
 * fail on its own, most often `color-contrast` over a background it cannot
 * reduce to one flat color.
 *
 * - `'ignore'` (the default): incomplete results are not inspected at all.
 *   This is the toolkit's pre-#501 behavior — a bare `expectNoA11yViolations`
 *   call for an external consumer sees no change.
 * - `'warn'`: every incomplete result is logged via `console.warn` for manual
 *   review, but never fails the scan.
 * - `'fail'`: same logging as `'warn'`, and additionally throws if any
 *   `color-contrast` result is incomplete. Every other rule's incomplete
 *   results are still only logged — see {@link logIncompleteResults}'s own
 *   doc for why `color-contrast` specifically is not turned into a blanket
 *   hard-fail here.
 */
export type IncompleteResultMode = 'ignore' | 'warn' | 'fail';

/**
 * `axe.RunOptions` (minus the non-overridable `runOnly`) plus the toolkit's
 * own {@link IncompleteResultMode} switch. `incomplete` is a toolkit-level
 * option, not an axe one — it is read by {@link runA11yCheck} and stripped
 * out before the remaining options reach `axe.run`.
 */
export type A11yCheckOptions = Omit<axe.RunOptions, 'runOnly'> & {
  incomplete?: IncompleteResultMode;
};

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
 *   `incomplete` (see {@link IncompleteResultMode}) defaults to `'ignore'` —
 *   axe `incomplete` results are neither logged nor checked unless a caller
 *   opts in.
 */
export async function expectNoA11yViolations(
  context: axe.ElementContext = document.body,
  options: A11yCheckOptions = {},
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
  options?: A11yCheckOptions,
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
 * returns keeps the same `A11yCheckOptions` shape as
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

/**
 * axe rules whose `incomplete` result {@link runA11yCheck} treats as a hard
 * failure under `incomplete: 'fail'`, on top of ordinary `violations`.
 *
 * `color-contrast` is the one rule where "incomplete" usually means axe found
 * a genuine contrast problem it could not finish computing (for example a
 * background axe cannot resolve to a single color) rather than an
 * environment limitation — see {@link logIncompleteResults} for why it is
 * still not the toolkit's own default.
 */
const FAILING_INCOMPLETE_RULES = new Set(['color-contrast']);

async function runA11yCheck(
  tags: readonly WCAG_22_AA_TAG[],
  context: axe.ElementContext,
  options: A11yCheckOptions,
  describeViolations: (count: number) => string,
): Promise<void> {
  const { incomplete: incompleteMode = 'ignore', ...axeOptions } = options;
  const runOnly: axe.RunOnly = { type: 'tag', values: [...tags] };

  const results = await axe.run(context, {
    // `resultTypes` before `...axeOptions` so callers can still override it.
    resultTypes: ['violations'],
    ...axeOptions,
    // `runOnly` last: TypeScript's excess-property check only rejects
    // `runOnly` on fresh object literals, so a caller could still widen a
    // value to `axe.RunOptions` and smuggle `runOnly` through `options`
    // (e.g. `const opts: axe.RunOptions = { runOnly: {...} }`). Applying
    // the tag baseline after the spread makes it win at runtime regardless,
    // so the guarantee holds even when the type-level guard (the `Omit`
    // above) is bypassed this way.
    runOnly,
  });

  const failingIncomplete: axe.Result[] = [];
  if (incompleteMode !== 'ignore') {
    // A second, `incomplete`-only pass, run separately from (not merged
    // into) the `violations` pass above: axe's own aggregation keys off
    // which `resultTypes` were requested for a *given* run, so folding
    // `incomplete` into the same `resultTypes` array as `violations`
    // changed what that same run reported as a `violation` in local
    // testing. Running `incomplete` as its own pass keeps the `violations`
    // pass byte-for-byte identical to the `'ignore'` (pre-#501) behavior,
    // while still surfacing what axe could not resolve.
    const incompleteResults = await axe.run(context, {
      ...axeOptions,
      resultTypes: ['incomplete'],
      runOnly,
    });

    logIncompleteResults(incompleteResults.incomplete);

    if (incompleteMode === 'fail') {
      failingIncomplete.push(
        ...incompleteResults.incomplete.filter((result) =>
          FAILING_INCOMPLETE_RULES.has(result.id),
        ),
      );
    }
  }

  const failures = [...results.violations, ...failingIncomplete];
  if (failures.length === 0) {
    return;
  }

  const report = failures
    .map((failure) => {
      const nodes = failure.nodes
        .map((node) => `      - ${node.target.join(' ')}`)
        .join('\n');
      return [
        `  • [${failure.impact ?? 'n/a'}] ${failure.id}: ${failure.help}`,
        `    ${failure.helpUrl}`,
        nodes,
      ].join('\n');
    })
    .join('\n');

  throw new Error(`${describeViolations(failures.length)}\n${report}`);
}

/**
 * Logs every `incomplete` result axe could not resolve on its own. axe marks
 * a check `incomplete` — rather than pass or fail — when it needs a human to
 * confirm the result, most commonly `color-contrast` over a background it
 * cannot resolve to one color.
 *
 * `color-contrast` incomplete results are not turned into a hard failure by
 * default (see {@link IncompleteResultMode}), even though that is the rule
 * most likely to hide a real WCAG 1.4.3 violation: every toolkit textual
 * control paints a **transparent** `background-color`
 * (`form-field-wrapper.css`, "Transparent - container has background") so
 * its content-box border can show through, and axe's static contrast
 * algorithm cannot always trace a transparent-background element back to the
 * flat color it actually renders over — the same alpha-channel limitation
 * `form-field-wrapper.state-focus-outline.browser.spec.ts` already works
 * around with its own manual `blendOverSurface`/`contrastRatio` math instead
 * of axe. Trying `color-contrast` incomplete as a hard failure across the
 * whole toolkit suite surfaced exactly one case (the outlined, invalid email
 * field, a fixture already covered — and passing — by the dedicated
 * contrast math in that other spec): a false positive from the transparency,
 * not a new defect. Logging keeps every incomplete result visible for manual
 * review without failing a scan on a case axe itself cannot confirm.
 */
function logIncompleteResults(incomplete: readonly axe.Result[]): void {
  if (incomplete.length === 0) {
    return;
  }

  const report = incomplete
    .map((result) => {
      const nodes = result.nodes
        .map((node) => `      - ${node.target.join(' ')}`)
        .join('\n');
      return [`  • ${result.id}: ${result.help}`, nodes].join('\n');
    })
    .join('\n');

  console.warn(
    `[ngx-signal-forms] axe reported ${incomplete.length} incomplete result(s) it could not resolve on its own — review manually:\n${report}`,
  );
}

/** A parsed `rgb()`/`rgba()` color's alpha channel, or `1` if unspecified. */
function colorAlpha(color: string): number {
  const match = /rgba?\((?:[^,]+,){3}\s*([\d.]+)\s*\)/u.exec(color);
  return match?.[1] === undefined ? 1 : Number(match[1]);
}

/**
 * Splits a CSS value list on commas that are not nested inside parentheses
 * — e.g. splitting `box-shadow`'s multiple layers without breaking apart a
 * `rgba(0, 0, 0, 0.5)` color's own internal commas.
 */
function splitTopLevelCommas(value: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  for (const char of value) {
    if (char === '(') depth += 1;
    if (char === ')') depth -= 1;
    if (char === ',' && depth === 0) {
      parts.push(current);
      current = '';
      continue;
    }
    current += char;
  }
  parts.push(current);
  return parts;
}

/** Whether `styles` paints a non-transparent, non-zero-width outline. */
function hasVisibleOutline(styles: CSSStyleDeclaration): boolean {
  if (styles.outlineStyle === 'none' || styles.outlineWidth === '0px') {
    return false;
  }
  return colorAlpha(styles.outlineColor) > 0;
}

/**
 * Whether a computed `box-shadow` value paints at least one visible layer —
 * non-transparent, and with a nonzero blur or spread radius (a `0 0 0 0`
 * shadow, sometimes used as an animatable placeholder, paints nothing).
 */
function hasVisibleBoxShadow(boxShadow: string): boolean {
  if (boxShadow === 'none') {
    return false;
  }

  return splitTopLevelCommas(boxShadow).some((layer) => {
    const colorMatch = /rgba?\([^)]*\)|hsla?\([^)]*\)/u.exec(layer);
    const alpha = colorMatch ? colorAlpha(colorMatch[0]) : 1;
    if (alpha <= 0) {
      return false;
    }

    const lengths = layer
      .replace(colorMatch?.[0] ?? '', '')
      .replaceAll(/inset/giu, '')
      .trim()
      .split(/\s+/u)
      .filter((token) => token.length > 0)
      .map((token) => Number.parseFloat(token));
    // Computed order is offsetX, offsetY, blurRadius, spreadRadius.
    const [, , blurRadius = 0, spreadRadius = 0] = lengths;
    return blurRadius > 0 || spreadRadius > 0;
  });
}

/**
 * Asserts that `element` is the current keyboard focus target (or a
 * `:focus-within` ancestor of it) and that its computed style paints a
 * visible focus indicator — a non-transparent, nonzero-width `outline`, or a
 * `box-shadow` layer with a nonzero blur/spread and a non-transparent color
 * — and throws a descriptive error otherwise.
 *
 * This is a presence check only: it confirms *something* renders, not that
 * it is legible. It does not measure contrast, so it does not stand in for
 * WCAG 1.4.11 (Non-text Contrast) coverage — see
 * `form-field-wrapper.state-focus-outline.browser.spec.ts`'s manual
 * `blendOverSurface`/`contrastRatio` math for a fixture that also proves the
 * indicator clears the 3:1 floor against its background. No axe rule
 * performs either check, because axe only ever scans the resting
 * (unfocused) DOM.
 *
 * Caller is responsible for moving focus first, with a real keyboard
 * interaction (`await userEvent.tab()` from `vitest/browser`) rather than
 * `element.focus()` — Chromium's `:focus-visible` heuristic only matches
 * keyboard-driven focus, so a programmatic `.focus()` call can under-report
 * an outline that a real Tab press would show. The `:focus-visible` /
 * `:focus-within` check below fails loudly if that convention isn't
 * followed, rather than silently asserting on a resting, unfocused style.
 *
 * @param element The element expected to carry the focus indicator — either
 *   the focused control itself (`:focus-visible`), or a `:focus-within`
 *   ancestor that renders the ring instead (see
 *   `form-field-wrapper.state-focus-outline.browser.spec.ts`).
 */
export function expectVisibleFocusIndicator(element: Element): void {
  if (!element.matches(':focus-visible, :focus-within')) {
    throw new Error(
      `Expected <${element.tagName.toLowerCase()}> to be the current :focus-visible element (or a :focus-within ancestor of it), but it was neither. Move focus with a real keyboard interaction (e.g. await userEvent.tab()) before calling expectVisibleFocusIndicator.`,
    );
  }

  const styles = getComputedStyle(element);
  if (!hasVisibleOutline(styles) && !hasVisibleBoxShadow(styles.boxShadow)) {
    throw new Error(
      `Expected a visible focus indicator (a non-transparent outline, or a box-shadow with a nonzero blur/spread and a non-transparent color) on <${element.tagName.toLowerCase()}>, but found neither.`,
    );
  }
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
