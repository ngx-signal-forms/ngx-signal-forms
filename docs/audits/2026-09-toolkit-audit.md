# Toolkit audit — September 2026

Scope: `packages/toolkit` (`@ngx-signal-forms/toolkit` 1.0.0-rc.15), plus the
CI, release, and publish workflows that ship it. The audit covers security,
performance, accessibility, architecture, maintainability, scalability,
documentation, testing, and automation.

Method: five parallel read-only reviews, one per group of dimensions. Each
review read `CONTEXT.md` and the ADRs first and respects settled decisions.
Every finding cites code. The top findings were checked again by hand.
No tests ran: `node_modules` was not installed in the audit environment, so
coverage numbers are not included.

## Summary

The toolkit is in good health. Layering has no cycles, type hygiene is clean
(0 non-null assertions, 1 documented `any`), there are no XSS sinks, all
components are OnPush, all workflow actions are pinned to a SHA, and symbol
drift in the current docs is very low.

The real risks sit in five places:

1. **Accessibility in the CSS layer** — dark-mode colour mismatch and missing
   focus indicators. The ARIA logic itself is strong.
2. **Release supply chain** — any `v*` tag publishes to npm with provenance,
   without tests, without an environment gate.
3. **Render-hook cost** — up to four `afterEveryRender` callbacks per field,
   with a DOM-query "cache" that does not skip the query.
4. **The cascade seam leaks** — the reference wrappers (and two in-package
   surfaces) inline the strategy cascade that ADR-0006/0007 centralised.
5. **Unenforced gates** — coverage thresholds, commit conventions, and the
   demo a11y job exist but never fail CI.

## Priority list

| #   | Finding                                                             | Dimension     | Severity | Effort |
| --- | ------------------------------------------------------------------- | ------------- | -------- | ------ |
| 1   | Dark-mode trigger differs between wrapper and feedback components   | A11y          | High     | M      |
| 2   | `appearance="plain"` removes every focus indicator                  | A11y          | High     | S      |
| 3   | Publish runs on any `v*` tag: no tests, no environment, OIDC exposed | Security / CI | High     | M      |
| 4   | Coverage thresholds never run in CI                                 | Testing       | High     | S      |
| 5   | Reference wrappers inline the cascade; Material times warnings wrong | Architecture  | High     | S      |
| 6   | DOM snapshot "cache" still runs every query                         | Performance   | Medium   | S      |
| 7   | Focus ring on invalid/warning fields is 1.4–1.5:1                   | A11y          | Medium   | S      |
| 8   | Default input border is 1.55:1                                      | A11y          | Medium   | S      |
| 9   | Release PAT is live while `nx release` runs third-party code        | Security / CI | Medium   | M      |
| 10  | Wrapper and auto-aria bypass `createWarningVisibility()`            | Architecture  | Medium   | S      |
| 11  | No commit-message / PR-title enforcement                            | Automation    | Medium   | S      |
| 12  | No public-API or tarball guard (api-extractor, publint, attw)       | Testing       | Medium   | M      |
| 13  | Visibility probe in the write phase causes layout thrash            | Performance   | Medium   | S      |
| 14  | Only one Node / Angular / peer version is tested                    | Testing       | Medium   | M      |
| 15  | `NgxFormFieldWrapper` is 1393 lines, ~35 computeds                  | Maintainability | Medium | M      |
| 16  | Control-kind literals spread outside the capability table           | Scalability   | Medium   | S      |
| 17  | Migration docs still read as pre-rc.13 / unreleased rc.15           | Docs          | Medium   | S      |

Lower-severity items are listed per section below.

---

## 1. Accessibility (WCAG 2.2 AA)

### 1.1 Dark-mode colour mismatch — High, SC 1.4.3

- The wrapper switches theme on the `.dark` class with `:host-context`
  (`form-field/form-field-wrapper.css:146-178`). It forces light tokens when
  the OS is dark and `.dark` is absent.
- `NgxFormFieldError` switches only on `prefers-color-scheme`
  (`assistive/form-field-error.css:122-127`).
- Hint, character count, and marking legend have no dark variant
  (`assistive/hint.ts:108`, `assistive/character-count.ts:290-324`,
  `assistive/form-marking-legend.ts:76`).

Result: a light app on a dark OS renders error text `#fca5a5` on white
(**1.90:1**) and warnings `#fcd34d` (**1.44:1**). A `.dark` app renders hints
at 1.29:1. This is the common "no dark mode, OS is dark" case.

**Fix:** one theme trigger. The wrapper sets the public
`--ngx-signal-form-error-color` / `-warning-color` and the hint and count
colours from its own resolved tokens, so descendants follow it. Add a browser
a11y spec that emulates `colorScheme: 'dark'` with and without `.dark`.

### 1.2 `appearance="plain"` has no focus indicator — High, SC 2.4.7

The textual reset sets `outline: none; box-shadow: none` on the input for all
appearances (`form-field-wrapper.css:700-712`). Plain then clears the
container's `:focus-within` border and shadow
(`form-field-wrapper.selection.css:376-384`). Nothing restores focus.

**Fix:** give plain a `:focus-visible` outline, or exclude it from the input
reset. Add a browser spec that tabs in and checks the computed style.

### 1.3 Other a11y findings

| Finding | SC | Evidence | Fix |
| --- | --- | --- | --- |
| Focus ring on invalid / warning fields is a 25 % tint (1.53:1 / 1.40:1) | 1.4.11, 2.4.7 | `form-field-wrapper.css:970-990` | Solid 2px outline with offset on `:focus-within` |
| Default border `rgba(50,65,85,.25)` is 1.55:1 | 1.4.11 | `form-field-wrapper.css:77` | Default to ≥3:1, e.g. `#8a94a3` |
| Hints hidden visually while an error shows, still read by AT | 3.3.2 | `form-field-wrapper.ts:377-379`, `:1382-1389` | Decide: keep hints visible (GOV.UK pattern) or make hiding opt-in |
| Error vs warning differ by colour only | 1.4.1 | `assistive/form-field-error.ts:186-247` | Visually hidden "Error:" / "Warning:" prefix, configurable |
| `aria-required` on role-less custom hosts (locked in by a test) | 4.1.2 | `core/directives/auto-aria.ts:453-466`, `auto-aria.spec.ts:669-688` | Skip when no supporting role; dev warning |
| Submit fires N `role="alert"` + summary alert + summary focus | 4.1.3 | `form-field-error.ts:173`, `form-field-error-summary.ts:93,280` | Option to silence field alerts when a summary is present, or document |
| Error summary has no heading or accessible name; host not `display:block` | 1.3.1, 2.4.6 | `form-field-error-summary.ts:69,97` | Heading label + `aria-labelledby` |
| Character count not in `aria-describedby`; `liveAnnounce` off by default | 1.3.1 | `character-count.ts:340-344,417` | Register it like a hint |
| Horizontal layout never stacks (fixed `8rem` label) | 1.4.10 | `form-field-wrapper.selection.css:414-422` | Container query fallback |
| axe `resultTypes: ['violations']` drops "incomplete" contrast results | process | `testing/a11y.ts` | Fail or report on incomplete in toolkit specs |

**Test gaps:** no a11y browser spec for `select`, `textarea`, single
checkbox/switch, `plain`, horizontal layout, dark mode, forced colours, or
focus visibility. Summary focus movement is checked only in jsdom.

**Verified correct:** live-region roles and pre-mounting, per-channel
`aria-describedby` (ADR-0010), describedby order, id uniqueness, required
marker hidden from AT, group roles, character-count announcement throttling,
light-mode text contrast (all ≥4.5:1), `forced-colors`,
`prefers-reduced-motion`, `prefers-contrast`, target sizes.

---

## 2. Security

No XSS sinks in the shipped code. Messages render through `{{ }}` only. Registry
and label lookups use `Object.hasOwn`. Vest path traversal is read-only. No
observers or listeners leak. SSR access to `document` is guarded.

| Finding | Severity | Evidence | Fix |
| --- | --- | --- | --- |
| Publish job: `id-token: write` for the whole job, which also runs `pnpm install` and the full build; no `environment:`; any `v*` tag triggers it; no check that the tag is on `main` | High | `.github/workflows/publish.yml:5-8,22-24,132,157` | Split into `build` (read-only, uploads dist) and `publish` (`id-token` only, no install, `environment: npm-publish` with reviewers). Verify tag is reachable from `origin/main`. Add a tag ruleset. |
| Release PAT written to `.git/config` and env before `nx release` runs plugins from `node_modules`; the comment claiming otherwise is wrong | Medium | `.github/workflows/release.yml:69-73,308-312` | Run `nx release` with push disabled, then a separate step that only runs `git push` with the token. Prefer a GitHub App token. |
| `${{ … }}` interpolated into `run:` (validated today, fragile) | Low | `release.yml:245,290,297,309` | Pass through `env:` |
| Dependabot auto-merge gates on `github.actor` | Low | `dependabot-auto-merge.yml:23` | Use `github.event.pull_request.user.login` |
| Field names with internal whitespace make `aria-describedby` point at other ids | Low | `core/utilities/field-resolution.ts:22-31,154` | Reject or normalise whitespace; dev warning |
| Path walk uses `in` instead of `Object.hasOwn` (reaches `constructor`) | Low | `core/utilities/inject-field-control.ts:98-103` | Use `Object.hasOwn` like the rest of the code |
| `axe-core` peer has no upper bound | Low | `packages/toolkit/package.json` | `>=4.5.0 <5` |

---

## 3. Performance

| Finding | Severity | Evidence | Fix |
| --- | --- | --- | --- |
| DOM snapshot computes `probedControl` (8-branch selector ×2) plus two more queries on every render, even on a cache hit | Medium | `form-field/form-field-dom-snapshot.ts:111-145`, called from `form-field-wrapper.ts:1224` | Return early on `nativeControl` / cache hit; cache `mainSlot` and `label` |
| `checkVisibility()` runs in the `write` phase after `setAttribute` → forced style recalc per wrapper | Medium | `form-field-wrapper.ts:1338,1379`; `core/services/field-identity.ts:50-68,216-224` | Move to `earlyRead`; write `data-signal-field` only on change |
| `NgxFormFieldError` keeps an unphased `afterEveryRender` in production for a dev-only warning | Low | `assistive/form-field-error.ts:381-389` | Register only in dev mode; destroy after first result (as `form-marking-legend.ts:118` does) |
| Up to 4 global render hooks per field (wrapper, auto-aria, visibility signal, error) | Low now, Medium at 200+ fields | see above, `control-visibility-signal.ts:51` | Fix the three above; later, one per-form render scheduler |

`scripts/change-detection.spec.ts` guards OnPush but not render-hook cost.
Add a spec that counts `querySelector` calls per tick on a mounted wrapper.

**Verified fine:** O(n) summary / fieldset aggregation, `sideEffects: false`,
`vest` and `axe-core` imported only from their own entry points, auto-aria
probes in `earlyRead` and skips unchanged writes.

---

## 4. Architecture, maintainability, scalability

Layering is one-way: `core` ← root ← `headless` ← `assistive` ← `form-field`.
`vest` and `testing` are independent. `@internal` / `@public` tags are
balanced. Comment density is high but carries rationale.

### 4.1 The cascade seam leaks — High

- All three reference wrappers hand-compose `resolveErrorDisplayStrategy` →
  `createShowErrorsComputed`, which ADR-0006 bans:
  `apps/demo-material/src/app/wrapper/mat-form-field-wrapper.ts:159-199`,
  `apps/demo-primeng/src/app/form-field/prime-form-field.ts:307,346`,
  `apps/demo-spartan/src/app/wrapper/spartan-form-field.ts:392,432`.
- Material times warnings with the **error** strategy and ignores
  `warningStrategy` (`mat-form-field-wrapper.ts:212`). This is the defect
  ADR-0007 fixed. Wrapper authors copy these files (ADR-0002).
- In-package, `form-field-wrapper.ts:1102-1119` and
  `core/directives/auto-aria.ts:309-335` re-inline the warning cascade instead
  of calling `createWarningVisibility()`. CONTEXT.md says every
  warning-bearing surface routes through it.

### 4.2 Other findings

| Finding | Severity | Evidence | Fix |
| --- | --- | --- | --- |
| `NgxFormFieldWrapper`: 1393 lines (735 code), 10 inputs, ~35 computeds, 150-line write phase, several pure pass-through computeds | Medium | `form-field/form-field-wrapper.ts` | Extract into deepening modules A, B, D below; target ~400 code lines |
| Control-kind knowledge outside the capability table; 4 one-line predicate wrappers; kind literals in 7 files | Medium | `form-field.utils.ts:147-181`, `form-field-wrapper.ts:727-729,1269`, `form-field-cluster-aria.ts:107` | Add `forcesVertical`, `clusterRole` to the table; one `capabilitiesFor(kind)` |
| Character count split across three layers; `hasLimit` is `computed(() => true)`; a signal graph built inside a `computed`; two identical result types; a `linkedSignal` that is a plain `computed` | Medium | `headless/src/lib/utilities.ts:476-548`, `assistive/character-count.ts:170-208,246` | One `createCharacterCount` with optional validator fallback |
| 11 root exports for one strategy concept; two resolvers with identical bodies | Medium | `core/utilities/resolve-strategy.ts:16-71` | One private generic resolver; mark building blocks "advanced" |
| Unused exports: `combineShowErrors`, `getDefaultValidationMessage`, `isFormFieldAppearance`, `isFormFieldOrientation`, `readNgxSignalFormControlSemantics`, `resolveWarningStrategy`, `NgxHeadlessNotification`, `summarizeFieldOptionality` | Low | grep across `packages/` and `apps/` | Review before 1.0 final; removing after 1.0 is a major |
| Same symbol exported from two entry points (`createUniqueId`, `readDirectErrors`, `ErrorMessageRegistry`, `NgxFieldIdentityProvider`, `NgxFormFieldErrorPlacement`) | Low | barrels | Pick one home before 1.0 final |
| Deprecated `NgxFormFieldErrorListStyle` still exported | Low | `assistive/form-field-error.ts:26` | Remove before 1.0 final |
| `headless/src/lib/utilities.ts` is an 816-line grab-bag of five concerns | Low | — | Move each `createX` next to its directive |
| `effect()` used only to keep a `linkedSignal` live, plus a sync effect | Low | `core/utilities/submission-helpers.ts:95-111` | Restate as one `linkedSignal` |
| `inject(NGX_SIGNAL_FORMS_CONFIG, {optional:true}) ?? DEFAULT` on a token with a root factory | Low | `auto-aria.ts:286`, `build-headless-context.ts:63` | Drop the dead fallback |
| `'warn:vest:'` hard-coded in vest instead of a shared constant | Low | `vest/src/vest-result-mapper.ts:47` | Export the `warn:` prefix constant from core |

### 4.3 Deepening opportunities

**A. Field presentation state** (fixes 4.1 and most of the wrapper size).
One factory owns the error and warning channel. It wraps
`createErrorVisibility` and `createWarningVisibility`, so ADR-0006/0007 hold.

```ts
const p = createFieldPresentation(fieldState, {
  strategy?, warningStrategy?, hidden?, identity?,
});
// p.errors, p.warnings, p.showErrors, p.showWarnings,
// p.effectiveStrategy, p.effectiveWarningStrategy, p.renderMessageSlot
```

**B. Control capabilities** — one table-driven interface replaces the
predicates and scattered literals.

```ts
capabilitiesFor(kind): { textual; supportsOutline; selectionGroup;
  paddedContent; forcesVertical; clusterRole: 'radiogroup' | 'group' | null }
```

**C. One character-count model** — `createCharacterCount({ field, maxLength?,
useValidatorMaxLength?, thresholds? })`; assistive keeps only formatting.

**D. Wrapper DOM sync** — a pure `applyWrapperDomSnapshot(snapshot, state,
identity, hints)` makes the 150-line write phase testable without rendering.

**E. Strategy resolver** — one private `resolveCascade<T>()`; the public names
stay as aliases until the next major.

---

## 5. Testing

Pyramid is healthy: 117 toolkit specs (≈91 jsdom, 26 browser of which 9 a11y,
3 integration, 6 build-script), 55 Playwright e2e specs. No `.only`, `.skip`,
or `todo` anywhere. No snapshot overuse.

| Finding | Severity | Evidence | Fix |
| --- | --- | --- | --- |
| Coverage thresholds (80/75/80/80) never run in CI; the uploaded coverage path is never written | High | `vitest.coverage.config.mts:72-77`, `.github/workflows/ci.yml:143` | Add a CI step running `workspace:coverage`; fix the path |
| Release gate uses `nx affected` with the remote cache; skips the README starter and isolation checks | Medium | `release.yml:215` | `nx run-many -t lint test test-browser build -p toolkit` + both checks |
| No public-API or tarball check; `packaging.spec.ts` never inspects `dist/` | Medium | `scripts/packaging.spec.ts` | api-extractor report + `publint` + `attw --pack` after post-build |
| Only Node 24, Angular 22.1.5, vest 6.3.2, axe-core 4.13 tested; ranges claim Node 22/26, Angular 22.0, axe 4.5, vest 6.0 | Medium | `.node-version`, `pnpm-workspace.yaml`, `package.json` | Scheduled matrix job at min and max of each range |
| No bundle-size budget | Low–Medium | — | `size-limit` per entry point |
| Real `setTimeout` waits (50 ms, 20 ms) and a Playwright `waitForTimeout(300)` | Low | `ngx-signal-form.spec.ts:247,304,373`, `vest-adapter-guarantees.spec.ts:373`, `advanced-wizard.spec.ts:537` | Fake timers / web-first assertions |
| `createMockFieldTree` hand-written in 6 specs | Low | `submission-helpers*.spec.ts`, `focus-first-invalid.spec.ts:550`, … | Shared helper, or real `form()` |
| Stale `packages/toolkit/vite.config.mts` (includes deleted `debugger/`) | Low | — | Delete |
| `destroyAfterEach: false` in browser setup | Low | `test-setup.browser.ts` | Re-enable or document |
| No explicit `vitest/no-focused-tests` lint rule | Low | `oxlint.config.ts` | Add it |

Files with no direct spec worth one: `core/utilities/dev-warn-once.ts`,
`core/utilities/character-count-length.ts` (public),
`form-field/form-field-cluster-aria.ts`,
`headless/src/lib/error-summary-utilities.ts`,
`form-field/form-field-dom-snapshot.ts` (the cache bug in §3 went unseen).

---

## 6. Automation

| Finding | Severity | Evidence | Fix |
| --- | --- | --- | --- |
| No commitlint, no `commit-msg` hook, no PR-title check. The subject drives versioning and release notes. A non-conventional subject is already in history ("Docs/documentation audit (#456)") | Medium | `package.json` (`simple-git-hooks` pre-commit only) | commitlint hook + PR-title workflow; reject un-backticked `@word`, or escape `@` in `tools/release/project-changelog-renderer.ts` (which has no spec) |
| Demo a11y job has `continue-on-error: true` though all four baselines are empty; ADR-0004 still says 5 seeded violations; failed issue search creates duplicates; `needs-triage` label not ensured | Low–Medium | `ci.yml:280`, `apps/*-e2e/a11y-baseline.json`, `a11y-report-violations.mjs:168-172` | Make the check blocking; fail closed; update ADR-0004 |
| Auto-merge comment says to require a "CI" check that no job reports | Low | `dependabot-auto-merge.yml:12` | Add one aggregating `ci-success` job and require it |
| Timeout comment mismatch (35 vs 15 min); e2e shards run on docs-only PRs; SHA pins lack `# vX` comments; `copilot-setup-steps.yml` has no timeout | Low | `release.yml:60-62`, `ci.yml:31` | Align; gate shards on affected |

**Verified fine:** SHA-pinned actions, least-privilege permissions,
concurrency cancel, `persist-credentials: false`, no `pull_request_target`,
lifecycle scripts restricted by `allowBuilds`, provenance on publish.

---

## 7. Documentation and public API

Symbol, input, and token drift in the current docs is very low. All 188 CSS
tokens were compared against `THEMING.md`. No `@public` `/core` symbol is
missing from the root barrel.

| Finding | Severity | Evidence | Fix |
| --- | --- | --- | --- |
| Beta→v1 guide says "upcoming rc.13", misses rc.15 `--ngx-form-field-margin` | High | `docs/MIGRATING_BETA_TO_V1.md:4-17` | Update header; link rc.14/rc.15 CSS changes |
| Migration index calls rc.15 unreleased; rc.15 guide keeps 3 template comments | Medium | `docs/migrations/README.md:3-5`, `docs/migrations/v1.0.0-rc.15.md:22,106,135` | Update; delete comments |
| CSS migration guide misses the three rc.15 default changes | Medium | `docs/MIGRATING_CSS_VARS.md:3` | Add rc.15 section |
| Two of three token-default changes shipped without `!` (`c38f6da`, `1043754`); CONTEXT.md says a default change is breaking | Low | `git log` | Note in the release body; use `!` from now on |
| Broken anchor `#labels-standard-layout` | Low | `packages/toolkit/form-field/THEMING.md:933` | `#labels-standard-and-plain-layout` |
| Broken relative links in `spec/*.md` (missing `../`) | Low | `spec/spec-process-demo-forms-best-practices-remediation.md:82-133` | Fix prefixes |
| Headless README points consumers at `@internal` `NGX_ERROR_MESSAGES` | Low | `packages/toolkit/headless/README.md:268,301` | Refer to `provideErrorMessages()` |
| Comments mention a `debugger` entry point that moved | Low | `packages/toolkit/index.ts:8`, `scripts/strip-internal-exports.mjs:6`, `strip-internal-members.mjs:22-23` | Update |
| `PACKAGE_ARCHITECTURE.md` layout tree and README-linking claims are stale; "breaking changes only in majors" is false for the RC line | Low | `docs/PACKAGE_ARCHITECTURE.md:58-158` | Refresh |
| `--ngx-signal-form-error-padding-inline-end` undocumented; `THEMING.md:108` wrong about which components load `feedback-tokens.css` | Low | `assistive/form-field-error.css:45-46` | Document as coordination hook; fix sentence |
| 8 non-public `/core` exports lack `@internal` tags | Low | `find-bound-control.ts:40,54`, `field-visibility-registry.ts:32`, `field-resolution.ts:276`, `walk-field-tree.ts:86`, … | Tag them |
| No JSDoc on `resolveErrorDisplayStrategy`, `resolveValidationErrorMessage`, `getDefaultValidationMessage`; ~41 of ~104 runtime exports have `@example` | Low | `resolve-strategy.ts:16`, `resolve-error-message.ts:124,156` | Add; prioritise providers and `create*` factories |
| `CONTEXT.md` keeps two "Populate with…" placeholders; says `SEVERITY` is absent from "pinned 22.0.0" while the catalog pins 22.1.5 | Low | `CONTEXT.md:14,94` | Delete; re-check `SEVERITY` in 22.1 |
| `package.json` lacks `homepage` / `bugs`; no pointer to GitHub Releases as changelog | Low | `packages/toolkit/package.json` | Add |
| Long sentences against the STE rule (e.g. 61 over 35 words in `MIGRATING_BETA_TO_V1.md`, 39 in `THEMING.md`) | Low | — | Split on next edit; `WARNINGS_SUPPORT.md` is the model |

---

## Suggested order of work

1. **Before 1.0 final (release blockers):** a11y 1.1 and 1.2, focus ring and
   border contrast, publish-workflow split and tag gate, coverage in CI,
   Material wrapper warning timing, decide the fate of unused and duplicate
   exports (removing them after 1.0 is a major).
2. **Quick wins (each S):** DOM-snapshot early return, visibility probe to
   `earlyRead`, dev-only error hook, `Object.hasOwn`, whitespace in field
   names, commitlint, migration-doc refresh, broken links, `@internal` tags.
3. **Refactors (M):** deepening A (field presentation) then D (DOM sync) to
   shrink the wrapper; B (capabilities); C (character count).
4. **Hardening (M):** API-extractor + publint + attw, version matrix,
   `size-limit`, blocking demo a11y job, release PAT isolation.
