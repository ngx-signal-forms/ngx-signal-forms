# Demo redesign plan (post library v1.1)

**Status:** Proposed
**Scope:** `apps/demo` UI/UX + selective changes in `packages/toolkit/debugger`
**Constraint:** Must not block library v1.1. Lands as a demo-only refresh after v1.1 is tagged.

## Context

A design review of the running demo (`http://localhost:4200`) in both themes against the exported surface of `packages/toolkit/*` identified structural, visual, and pedagogical gaps. See the review thread for full diagnosis. This plan carves the remaining work into shippable milestones so each can land independently.

## What already landed with v1.1

These small wins are merged under the v1.1 polish pass (see commit history for exact refs):

- **Skip link focus ring** — `apps/demo/src/app/app.html`. Added `focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-purple-400 dark:focus:ring-offset-gray-950` so the skip-to-main link is visibly focused in both themes.
- **Sidebar external-link icons** — standardized the mixed `📘 / GH / TK / 🜁` set to uniform monospace monograms `NG GH TK BS` with `aria-label` preserved for screen readers. Avoids depending on an icon library for v1.1.
- **Debugger footer removed** — deleted the duplicated `Angular Signal Forms Debugger · Live updating` strip from `packages/toolkit/debugger/signal-form-debugger.component.{html,scss}`. Also removed the now-unused `ngx-debugger-pulse` keyframe and the four `__footer*` / `__live-*` class blocks. All 710 toolkit tests continue to pass.

Intentionally deferred from the "small wins" list because they depend on decisions made in M1/M6:

- Emoji-based `icon: '🎯'` convention across 21 `*.content.ts` files — harmonize only after the aesthetic direction is chosen.
- Theme toggle cycle (light / system / dark) — the current cycle is correct; UX tightening belongs with the shell redesign.

## Milestones

Each milestone is independently shippable and independently valuable. Order matters only where called out.

### M1 — Design tokens and dark-mode surface tiers

**Problem.** Every card uses the same `bg-gray-800 / border-gray-700` pair, so hierarchy collapses in dark mode. The debugger's accordion groupings in particular lose their boundary.

**Change.** Introduce CSS custom properties in `apps/demo/src/styles.scss` and stop reaching for Tailwind's raw `gray-*` / `indigo-*` ramps in components:

```scss
:root {
  --demo-surface-1: #ffffff;
  --demo-surface-2: #f7f7f9;
  --demo-surface-3: #efeff3;
  --demo-border-subtle: rgb(0 0 0 / 0.06);
  --demo-border-strong: rgb(0 0 0 / 0.12);
  --demo-text-primary: #111;
  --demo-text-muted: #555;
  --demo-accent: #6d28d9;
}
.dark {
  --demo-surface-1: #0a0d14;
  --demo-surface-2: #121621;
  --demo-surface-3: #1b2030;
  --demo-border-subtle: rgb(255 255 255 / 0.06);
  --demo-border-strong: rgb(255 255 255 / 0.14);
  --demo-text-primary: #eaeaea;
  --demo-text-muted: #9aa0ad;
  --demo-accent: #a78bfa;
}
```

Expose these as Tailwind arbitrary-value classes (`bg-[--demo-surface-2]`) or as a thin wrapper utility.

**Files touched.**

- `apps/demo/src/styles.scss` — token definitions.
- `apps/demo/src/app/**/*.page.html` (or inline templates) — search-and-replace stock Tailwind grays with token classes.
- `packages/toolkit/debugger/signal-form-debugger.scss` — the debugger already consumes its own `--ngx-debugger-*` vars, so it needs its light/dark overrides retuned to use the three-tier system, not more gray.

**Success criteria.**

- Card / input / page surfaces are visibly distinct in dark mode at 4.5:1 or better against text.
- Error and warning pills switch to tinted backgrounds (≤25% alpha) rather than saturated fills — verified against `toolkit-core/warning-support` and `your-first-form`.
- No remaining `text-gray-*` / `bg-gray-*` / `border-gray-*` classes in demo pages (grep gate).

**Effort.** ~1 day. Low risk — purely cosmetic, no behavior change, no library API churn.

---

### M2 — Page shell: segmented control + collapsible tabs

**Problem.** Every demo page has the same four-block scroll (hero → info card → config card → form → teaching block). The form is buried below ~60% of vertical space. Info weight competes with interactive weight.

**Change.** Introduce a shared `<demo-page>` layout component that all pages opt into. It provides:

1. **Header row** — single-line title + subtitle, no card.
2. **Inline config strip** — a pinned segmented control directly above the form for the per-page setting (error-display mode, warning mode, etc.). Replaces the "Validation timing controls" card that currently takes ~250px.
3. **Form + Inspector rail** — two-column on ≥`lg`, form-first on mobile. Inspector is the existing debugger panel, right-aligned.
4. **Tabs below the form** — `Overview · Toolkit APIs · Try it · Source`. Default-collapsed. The current "What you'll see" / "Toolkit features used here" / "Interactive Testing Guide" content migrates into these tabs instead of rendering as stacked cards above the form.

**Files touched.**

- New: `apps/demo/src/app/ui/demo-page/demo-page.ts` + template + styles.
- New: `apps/demo/src/app/ui/segmented-control/segmented-control.ts`.
- Refactor each `*.page.ts` to consume `<demo-page>` and pass content via slots or a typed `content` input. The existing `*.content.ts` files already carry the structured copy — extend the shape with per-tab keys rather than the current flat list.

**Success criteria.**

- On a 1440×900 viewport, the form is fully visible above the fold on every demo page.
- Existing content is reachable — nothing deleted, only relocated into tabs.
- The segmented control is keyboard-operable with visible focus, `role="radiogroup"` semantics, and respects `prefers-reduced-motion`.

**Effort.** 2–3 days. Medium risk — touches every demo page. Migrate incrementally: land the shared component first with one page on it, then roll out the remaining 20.

**Depends on:** M1 (so tokens are in place before mass template edits).

---

### M3 — Promote the debugger to a global Inspector

**Problem.** The debugger currently renders inside every page. That's honest documentation but visually it stops feeling like a _feature_ and becomes chrome.

**Change.** Add a global "Inspector" toggle button in the demo header. The debugger becomes a floating right rail that can be opened/closed on any page. It still binds to the currently-rendered form via the existing context.

This is a **demo-app change**, not a library change. The `SignalFormDebugger` component itself keeps its current signature; the demo decides where to mount it.

**Files touched.**

- `apps/demo/src/app/ui/inspector-panel/` (new) — wraps `ngx-signal-form-debugger` in a slide-in panel with an open/close state persisted in `localStorage`.
- `apps/demo/src/app/app.html` — header button + panel slot.
- Every demo page template — remove the inline `<ngx-signal-form-debugger>` placement (if still present after M2 moved it to the Inspector rail).

**Success criteria.**

- Debugger visibility is a user preference, not a per-page decision.
- `toolkit-core/error-display-modes` and `warning-support` still work with the inspector closed (i.e. nothing in those pages _requires_ the debugger to be visible to teach the concept).

**Effort.** Half a day. Low risk.

**Depends on:** M2 (the new shell has a natural slot for the inspector rail).

---

### M4 — Dedicated showcase pages for under-demoed toolkit surfaces

**Problem.** The following exported APIs have no dedicated page today, so visitors scanning the nav cannot find them:

| Toolkit entry                          | Missing showcase                                                                |
| -------------------------------------- | ------------------------------------------------------------------------------- |
| `@ngx-signal-forms/toolkit/assistive`  | `NgxFormFieldErrorSummary`, `NgxFormFieldCharacterCount`                        |
| `@ngx-signal-forms/toolkit/headless`   | `NgxHeadlessErrorState`, `NgxHeadlessCharacterCount`, `NgxHeadlessErrorSummary` |
| `@ngx-signal-forms/toolkit/form-field` | Side-by-side "before the wrapper / after the wrapper" template diff             |

**Change.** Add three new demo pages, each behind an existing category:

1. **`/toolkit-core/error-summary-and-anchors`** — renders a `NgxFormFieldErrorSummary` above a form with six fields, clicking a summary item scrolls + focuses the offending field via the existing focus-first-invalid machinery. Explicitly demonstrates the WCAG 2.2 error-identification payoff.
2. **`/toolkit-core/character-count-and-hints`** — a textarea with the character-count component, showing `aria-describedby` wiring in the Inspector tree. Second example uses the headless directive to recreate the counter from scratch in ≤30 lines.
3. **`/form-field-wrapper/before-and-after`** — tabbed view comparing the raw toolkit-context template against the `NgxSignalFormFieldWrapper` version of the same form. Auto-generated line count and LOC diff at the top.

Also consolidate:

- Merge `/advanced-scenarios/vest-validation` and `/advanced-scenarios/zod-vest-validation` into one page with two tabs. They are closely related and splitting them fragments the `/vest` showcase.

**Files touched.**

- `apps/demo/src/app/02-toolkit-core/error-summary-and-anchors/` (new).
- `apps/demo/src/app/02-toolkit-core/character-count-and-hints/` (new).
- `apps/demo/src/app/04-form-field-wrapper/before-and-after/` (new).
- `apps/demo/src/app/05-advanced/vest-validation/` — absorb zod-vest as a tab.
- `packages/demo-shared/src/lib/routes.metadata.ts` — add new entries, remove split.
- Delete `apps/demo/src/app/05-advanced/zod-vest-validation/` only after the merge is verified.

**Success criteria.**

- Every `packages/toolkit/*` secondary entry point has at least one page where its exports are explicitly named in the "Toolkit APIs" tab.
- Grep gate: each exported component from `/assistive` appears in at least one template under `apps/demo/src/app/`.

**Effort.** 2 days.

**Depends on:** M2 (new pages author against the `<demo-page>` shell).

---

### M5 — "Try it & Debug it" tab with runnable tests

**Problem.** The current "Interactive Testing Guide" is a manual checklist. It doesn't teach how to _test_ or _debug_ these forms in a real project.

**Change.** For each demo page, the `Try it` tab in the new shell gains two sub-sections:

1. **Vitest snippet** — a copy-pasteable test rendering the same page component and asserting on validation timing. Use `@testing-library/angular` + `@testing-library/user-event`, matching what `packages/toolkit` already uses for its jsdom suite. Include a "Open in StackBlitz" link that seeds a fresh workspace with the snippet preloaded.
2. **Debug annotations** — a labelled screenshot of the inspector tree for this page, with callouts pointing to which node represents which field, how to read the strategy pill, and how to enable `provideNgxSignalFormsConfig({ debug: true })` for extra diagnostics. Link to `/advanced-scenarios/global-configuration` for the full config surface.

**Files touched.**

- `apps/demo/src/app/ui/try-it-tab/try-it-tab.ts` (new).
- Per-page content files gain a `tryIt: { test: string; stackblitzSeed: string; debugNotes: DebugNote[] }` field.
- `apps/demo/src/assets/inspector-annotations/` (new) — one annotated PNG per page, or render annotations as CSS overlays on the live inspector tree.

**Success criteria.**

- Every demo page has a runnable Vitest snippet that actually passes against the current toolkit version (verified by a `pnpm nx run demo:test:snippets` script that evals each snippet against its page component).
- The StackBlitz seed opens a scratch Angular app with `@ngx-signal-forms/toolkit` preinstalled and the selected form ready to edit.

**Effort.** 2–3 days, dominated by the per-page test authoring. Can be parallelized across contributors.

**Depends on:** M2, M4 (new pages need test entries too).

---

### M6 — Commit to a visual identity (optional but high impact)

**Problem.** The current demo reads as generic Tailwind docs. Purple gradients on near-white / near-black are the baseline "AI-generated UI" look.

**Change.** Pick ONE of these two directions and execute it with conviction. Do not blend.

**Option A — editorial / technical-paper.**

- Display font: _Fraunces_ or _GT Sectra_ (loaded from a local subset, not Google Fonts hotlink).
- Body: _Söhne_ or _IBM Plex Sans_.
- Code: _Berkeley Mono_ or _JetBrains Mono_.
- Palette: ivory `#F7F4ED` / ink `#111` light; deep navy `#0B1020` / warm-white `#EAE6DC` dark.
- One cobalt accent `#2962FF`, one coral error `#E4572E`, one mustard warning `#E9B44C`. No gradients.
- 1px hairline rules replace shadows and pill fills.

**Option B — engineering / terminal.**

- Body and display: _Geist_, _Geist Mono_ for code and labels.
- Near-black `#0A0A0A` dark, bone `#FAFAF9` light.
- Single electric-green accent `#00E5A0`, used only for state changes and focus rings.
- Square or 4px corners. 2% grid-paper background texture. Pills become bracketed tags: `[invalid]`, `[touched]`.

**Files touched.**

- `apps/demo/src/styles.scss` — font-face declarations, CSS-var overrides.
- `apps/demo/public/fonts/` (new) — subset WOFF2 files with a license manifest.
- `apps/demo/src/app/app.html` — drop the `brand-gradient` utility in favor of a single accent.
- All `*.content.ts` emoji icons — either replace with lucide glyphs (Option A) or with bracketed tag labels (Option B).

**Success criteria.**

- The demo is recognizable from a single screenshot.
- Lighthouse performance budget holds: added fonts add ≤50 KB over the wire on the first paint path.

**Effort.** 2–3 days for the design pass + font licensing check.

**Depends on:** M1 (tokens already parameterize the stack), M2 (shell already references tokens, not raw colors).

**Explicitly optional for v1.2.** If the team prefers to ship M1–M5 as a v1.2 demo refresh and save M6 for a named v1.3 "visual identity" release, that is fine — the earlier milestones stand on their own.

---

## Cross-cutting: deferred small wins bundled with M1/M6

- Replace the 21 `icon: '🎯'` / `icon: '⚠️'` page-content convention with either (a) lucide glyphs when M6 lands with a lucide-angular dep, or (b) bracketed tag labels under Option B. Pick one, apply everywhere, land in the same PR as M6.
- Theme toggle UX — consider showing the _next_ state in the aria-label ("Switch to dark mode") instead of the current one ("Change theme: light"). Also consider rendering as a segmented three-button control so state is visible at a glance. Bundle with M2.

## Out of scope for this plan

- Any change to the public API of `packages/toolkit/*` beyond the v1.1 polish pass.
- Renaming existing toolkit entry points.
- Migrating from Tailwind to another CSS system.
- Replacing the Vite/Nx demo build with a docs generator like Nextra or Docusaurus. That is a separate discussion about what the demo _is_ — interactive playground or a docs site — and this plan assumes it stays a playground.

## Ordering and suggested ship cadence

A low-risk path that delivers visible wins quickly:

1. **Library v1.1 first.** Nothing in this plan blocks it. The debugger footer removal is the only toolkit change needed here, and it already landed.
2. **Demo v1.2 = M1 + M2 + M3.** Tokens, new shell, global inspector. Ships as one release because M2 depends on M1 and M3 fits naturally in M2's shell slot. ~1 week of focused work.
3. **Demo v1.3 = M4 + M5.** New showcase pages and runnable tests. Can be parallelized. ~1 week.
4. **Demo v1.4 (optional) = M6.** Visual identity. A distinct, named release so it's obvious to the community.

## Risk register

| Risk                                                                    | Mitigation                                                                                                                                         |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| M2 refactor regresses a page                                            | Migrate one page at a time behind a feature-flag route; keep both shells alive until all 21 are converted.                                         |
| M6 font licensing                                                       | Only ship fonts with an explicit webfont license; document each in `apps/demo/public/fonts/LICENSE.md`.                                            |
| StackBlitz seeds (M5) break when toolkit version bumps                  | Pin snippets to a specific toolkit major and regenerate on each release via a CI job.                                                              |
| Demo-specific tokens drift from toolkit-internal tokens in the debugger | M1 explicitly retunes `--ngx-debugger-*` to consume the demo's three-tier surface system; document the contract in `docs/PACKAGE_ARCHITECTURE.md`. |

## Appendix: files landed as part of small-win pass

- `apps/demo/src/app/app.html` — skip-link focus ring + sidebar monograms.
- `packages/toolkit/debugger/signal-form-debugger.html` — footer removed.
- `packages/toolkit/debugger/signal-form-debugger.scss` — footer classes and `ngx-debugger-pulse` keyframe removed.
