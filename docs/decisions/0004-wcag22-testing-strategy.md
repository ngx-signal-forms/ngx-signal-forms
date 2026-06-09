# ADR 0004 — WCAG 2.2 AA Testing Strategy

**Status:** Accepted

## Context

ngx-signal-forms/toolkit is a published Angular library. Its consumers depend on toolkit components being WCAG-compliant by design. The demo apps (demo, demo-material, demo-primeng, demo-spartan) showcase the toolkit against third-party UI layers (Angular Material, PrimeNG, Spartan) and may carry violations originating from those layers or from demo scaffolding, not from the toolkit itself.

Two distinct goals:

1. Guarantee toolkit components satisfy WCAG 2.2 AA.
2. Track and improve WCAG compliance of the demo apps incrementally without blocking day-to-day development.

## Decision

**Toolkit (Vitest browser mode) → hard fail.** A dedicated conformance spec (`packages/toolkit/form-field/form-field-wrapper.a11y.browser.spec.ts`) renders the toolkit primitives in their intended, correctly-wired configuration and calls a shared `expectNoA11yViolations()` helper (`packages/toolkit/testing/a11y.ts`, backed by `axe-core`) scoped to the rendered subtree. A violation fails the test immediately. This runs on every PR via the existing `test-browser` Nx target (Chromium only — cross-browser differences at component level are caught by the e2e layer). A dedicated spec is used rather than retrofitting axe onto the existing behavioral `.browser.spec.ts` files, which deliberately use minimal/labelless markup to isolate one behavior and would produce violations that are fixture artifacts, not toolkit bugs.

**Demo apps (Playwright `a11y` target) → baseline + auto-issue.** Each e2e app has a dedicated `accessibility.spec.ts` and a versioned `a11y-baseline.json`. The scan records violations to `dist/.a11y/<app>/` without asserting (it never hard fails). A separate, non-blocking CI job (`a11y`, parallel to `main`, `continue-on-error: true`) runs the scan in Chromium and Firefox, then `tools/scripts/a11y-report-violations.mjs` diffs the results against each baseline. On pull requests it reports new violations (`--check`, for visibility only); on push to `main` it opens a deduped GitHub issue per new violation (labelled `a11y`, `needs-triage`). Baselines are updated deliberately by a maintainer via `pnpm a11y:baseline`, keeping the file diff an explicit, reviewable record rather than an auto-commit from CI. Violation identity is keyed on `route::ruleId::target` with Angular's build-specific encapsulation hashes stripped, so the baseline is stable across builds.

**Browser matrix:** The Playwright **a11y scan** runs on Chromium + Firefox (Desktop). The functional `e2e`/`e2e-ci` suites stay Chromium-only — they include Chromium-calibrated visual screenshot baselines (macOS→Linux tolerances), and the functional gate is blocking, so adding Firefox there would require a parallel Firefox baseline set and risk blocking PRs on untriaged Firefox behavior. Scoping Firefox to the non-blocking a11y scan delivers genuine cross-engine accessibility coverage without that risk. WebKit deferred — higher flake cost, Firefox already covers the most common Safari divergences. Vitest browser mode remains Chromium-only.

## Alternatives considered

**Hard fail for demo apps too.** Rejected: violations from PrimeNG/Spartan/Material are outside the toolkit's control and would require suppression lists that accumulate silently, or block unrelated PRs.

**Nightly-only a11y job.** Rejected: violations would surface up to 24h late. A parallel non-blocking job gives same-PR feedback without extending the critical path.

**WebKit in the Playwright matrix.** Deferred: WebKit is the slowest Playwright engine, most prone to flake, and Safari-specific ARIA deviations are rare for form controls. Revisit if Safari-specific WCAG bugs are reported.

**Firefox in the functional `e2e` matrix.** Deferred: the functional suite is the blocking gate and carries Chromium-calibrated visual baselines. Adding Firefox there is a separate hardening effort (Firefox baselines + a triage pass), tracked independently.

**Auto-committing baseline updates from CI.** Rejected: would require CI to push to `main`. Keeping baseline updates a deliberate `pnpm a11y:baseline` action makes accepting a violation an explicit, reviewable change.

## Consequences

- `@axe-core/playwright` and `axe-core` added to the workspace dependency catalog (new `axe` catalog); `axe-core` is a toolkit devDependency only (never shipped).
- Each of the 4 e2e apps gains an `a11y` Nx target, a `playwright.a11y.config.ts`, an `accessibility.spec.ts`, and an `a11y-baseline.json`. The shared scan helper lives at `tools/a11y/scan.ts` (path alias `@ngx-signal-forms/a11y-testing`).
- A new parallel, non-blocking CI job runs the a11y scan; it does not block PR merge.
- New WCAG violations in demo apps appear as deduped GitHub issues within one push-to-main CI run.
- The toolkit's dedicated conformance spec runs in `test-browser`; any new toolkit component that fails WCAG 2.2 AA blocks its PR immediately.
- `demo-e2e`'s baseline is seeded with 5 known `color-contrast` violations on demo scaffolding; the 3 themed apps start with empty baselines (their first main-run scan opens issues for what they find).
