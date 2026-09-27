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
declare const WCAG_22_AA_TAGS: readonly ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
type WCAG_22_AA_TAG = (typeof WCAG_22_AA_TAGS)[number];
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
type IncompleteResultMode = 'ignore' | 'warn' | 'fail';
/**
 * `axe.RunOptions` (minus the non-overridable `runOnly`) plus the toolkit's
 * own {@link IncompleteResultMode} switch. `incomplete` is a toolkit-level
 * option, not an axe one — it is read by {@link runA11yCheck} and stripped
 * out before the remaining options reach `axe.run`.
 */
type A11yCheckOptions = Omit<axe.RunOptions, 'runOnly'> & {
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
declare function expectNoA11yViolations(context?: axe.ElementContext, options?: A11yCheckOptions): Promise<void>;
/**
 * Shape shared by {@link expectNoA11yViolations} and the validator returned
 * by {@link createA11yValidator} — a `context`/`options` pair (mirroring
 * `axe.run`'s own signature) that resolves on a clean scan and throws a
 * formatted report otherwise.
 */
type A11yValidator = (context?: axe.ElementContext, options?: A11yCheckOptions) => Promise<void>;
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
declare function createA11yValidator(options?: {
    tags?: readonly WCAG_22_AA_TAG[];
}): A11yValidator;
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
 * an outline that a real Tab press would show.
 *
 * The precondition below is stricter than "either pseudo-class matches":
 * when `element` **is** `document.activeElement`, only `:focus-visible` is
 * accepted — `:focus-within` also matches an element on itself (not just its
 * ancestors), so accepting it here for the direct target would let a
 * genuine `:focus-visible` miss (a real, catchable bug) slip through as a
 * false pass. `:focus-within` is checked only when `element` is *not* the
 * active element itself, for the documented ancestor-container case.
 *
 * @param element The element expected to carry the focus indicator — either
 *   the focused control itself (must be `:focus-visible`), or a
 *   `:focus-within` ancestor that renders the ring instead (see
 *   `form-field-wrapper.state-focus-outline.browser.spec.ts`).
 */
declare function expectVisibleFocusIndicator(element: Element): void;
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
declare function findAlertContaining(container: ParentNode, text: string): HTMLElement | undefined;

export { WCAG_22_AA_TAGS, createA11yValidator, expectNoA11yViolations, expectVisibleFocusIndicator, findAlertContaining };
export type { A11yCheckOptions, A11yValidator, IncompleteResultMode, WCAG_22_AA_TAG };
