# Contributing

This document captures workspace-level conventions every contributor (and AI
agent) must follow when changing project layout, adding apps, or wiring CI.
For code-level conventions, see [`AGENTS.md`](../AGENTS.md), the per-package
READMEs, and ADRs in [`docs/decisions/`](./decisions).

## Project tags & module boundaries

Every Nx project declares a `tags` array in its `project.json`. Tags drive the
`@nx/enforce-module-boundaries` lint rule defined in
[`oxlint.config.ts`](../oxlint.config.ts) and protect the published toolkit
bundle from accidental contamination by demo-only code.

### Tag vocabulary

| Tag          | Meaning                                                |
| ------------ | ------------------------------------------------------ |
| `scope:lib`  | Publishable library code. Toolkit and any future libs. |
| `scope:demo` | Demo apps and demo-only support libs.                  |
| `type:lib`   | Library project (`projectType: "library"`).            |
| `type:app`   | Application project (`projectType: "application"`).    |

Each project carries one `scope:*` tag and one `type:*` tag.

### Constraints

- `scope:lib` may only depend on other `scope:lib` projects.
- `scope:demo` may depend on both `scope:lib` and `scope:demo` projects.
- `type:lib` may only depend on other `type:lib` projects.
- `type:app` may depend on both `type:lib` and `type:app` projects.

The constraint that bites hardest:

> **`scope:lib` cannot depend on `scope:demo`.** A demo import inside the
> toolkit fails lint, which fails CI. This guardrail exists because the
> reference demo apps (Material, PrimeNG, Spartan — see #40) will pull in
> design-system packages the toolkit must never ship with.

### Adding a new project

1. Create the project (Nx generator or manual).
2. Edit its `project.json` and add the appropriate `scope:*` + `type:*` tags.
3. Run `pnpm nx run-many -t lint` to confirm boundaries hold.

## Demo app bundle size

There is currently no automated bundle-size budget for any `apps/demo-*` app.
The toolkit package itself is covered — see
[Published package guardrails](#published-package-guardrails) below.

`apps/demo-material`, `apps/demo-primeng`, and `apps/demo-spartan` are the
existing reference demo apps (tracked by #40). Their `build` targets use
`nx:run-commands` wrapping `vite build --mode production` rather than the
Angular CLI application builder, so the builder's
`configurations.production.budgets` option has no effect in this workspace —
adding one to a demo app's `project.json` would be silently ignored.

If you want to add bundle-size guardrails for a demo app, it needs to be a
Vite-based mechanism (e.g. a `rollup-plugin-visualizer` report or a custom
size-check script), not an Angular CLI budgets block.

## Published package guardrails

Three CI checks guard the toolkit's PUBLISHED package (`dist/packages/toolkit`,
after `toolkit:post-build` runs the `@internal`/`/core` strip scripts) —
`packages/toolkit/scripts/packaging.spec.ts` only reads checked-in source and
never opens `dist/`, so none of this overlaps with it:

1. **Public API surface + tarball contents** —
   `pnpm nx run toolkit:check-published-package` (script at
   [`packages/toolkit/scripts/check-published-package.mjs`](../packages/toolkit/scripts/check-published-package.mjs))
   diffs every built `.d.ts` in `dist/packages/toolkit/types/` — every entry in
   the published `exports` map, plus the build-time-only `/core` entry under
   the name `core.internal` (it ships no `exports` entry, but every published
   entry imports its types via a relative specifier, so a breaking change
   there — see #551 — can slip past a guard that only reads published
   entries) — and the file list `npm pack` would publish, against the
   committed baseline in
   [`packages/toolkit/api-reports/`](../packages/toolkit/api-reports). A
   surface or tarball-structure change without a baseline update fails CI
   with a capped diff and the exact command to run.

   To update the baseline after an intentional change: review the failing
   diff, then run

   ```sh
   pnpm nx run toolkit:post-build
   pnpm run check:toolkit-published-package -- --update
   ```

   and commit the updated files under `packages/toolkit/api-reports/`.

2. **Package shape** — `pnpm nx run toolkit:check-package-shape` runs
   [`publint`](https://publint.dev) and
   [`@arethetypeswrong/cli`](https://arethetypeswrong.github.io) (`--profile
esm-only`, since the toolkit ships no CommonJS entry) against the built
   package, catching a broken `exports` map, a `types` condition pointing at
   the wrong file, or a subpath that resolves to nothing.

3. **Bundle size budget** — `pnpm nx run toolkit:check-size` runs
   [`size-limit`](https://github.com/ai/size-limit) against the FESM output of
   each entry point, configured in
   [`packages/toolkit/.size-limit.cjs`](../packages/toolkit/.size-limit.cjs),
   and prints the result as a Markdown table
   ([`packages/toolkit/scripts/size-report.mjs`](../packages/toolkit/scripts/size-report.mjs))
   that `ci.yml` also appends to the job summary, so a size change is visible
   on the PR. Each budget is the entry's built (brotli) size plus roughly 25%
   headroom; the config file's header comment has the exact steps to raise a
   budget after an intentional size increase.

None of these three are `lint`, `test`, or `build` targets, so `nx affected -t
lint test build` never runs them on its own — `ci.yml` and `release.yml` call
them directly instead, unaffected by what changed.

## Toolkit isolation guarantees

Two CI mechanisms keep the toolkit publishable and design-system-free:

1. **Static check** — `pnpm check:toolkit-peer-deps` (script at
   [`tools/scripts/check-toolkit-peer-deps.mjs`](../tools/scripts/check-toolkit-peer-deps.mjs))
   asserts `packages/toolkit/package.json` declares no `@angular/material`,
   `primeng`, `primeicons`, or `@spartan-ng/*` entries in `dependencies` or
   `peerDependencies`.
2. **Pruned build** — the `toolkit-isolation` job in
   [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) runs
   `pnpm install --frozen-lockfile --filter "@ngx-signal-forms/toolkit..."`
   followed by `pnpm nx run toolkit:post-build`. The filter excludes demo apps from
   the install graph, so even if a demo declares a design-system dep, the
   toolkit build proves it can compile without that dep present.

If either check fails, the right fix is almost never to relax the check —
move the offending dep into the demo app that needs it.

## Commit messages and PR titles

Commit subjects follow [Conventional Commits](https://www.conventionalcommits.org/).
`nx release` reads the subject to pick the version bump, and the subject
lands verbatim in the GitHub release notes (see [`AGENTS.md`](../AGENTS.md)).

A `commit-msg` git hook checks every commit with
[commitlint](https://commitlint.js.org/), configured in
[`commitlint.config.cjs`](../commitlint.config.cjs):

- The type must be one of the [Conventional Commits](https://www.conventionalcommits.org/)
  types (`feat`, `fix`, `docs`, `refactor`, and so on).
- Every `@word` in the subject must be backticked — write `` `@group` ``,
  not `@group`. A bare `@word` renders as a GitHub mention of a stranger's
  account. This rule lives in
  [`tools/commitlint/no-bare-mention.cjs`](../tools/commitlint/no-bare-mention.cjs),
  strips code spans before checking, and does not flag an email's local part
  (`me@example.com`).

`commitlint.config.cjs` turns off `footer-max-line-length`,
`body-max-line-length`, `header-max-length`, and `subject-case` from
`@commitlint/config-conventional` — history already has long single-line
`BREAKING CHANGE:` footers and bodies, subjects over 100 characters, and one
non-lower-case subject, and rewriting old commits to fit is not worth it.

`pnpm install` installs the hook through `simple-git-hooks` (see
[`tools/simple-git-hooks-worktree.cjs`](../tools/simple-git-hooks-worktree.cjs),
which points the hook at the shared `.git/hooks` directory so it also runs in
git worktrees). If a commit fails the check, fix the subject and commit
again — the hook does not rewrite the message for you. In a worktree that
predates this hook (no `commitlint` installed, no `commitlint.config.cjs`),
the hook prints a warning and skips the check instead of blocking the
commit — run `pnpm install` to pick up the check there too.

A squash merge uses the PR title as the commit subject, so the `PR Title`
workflow ([`.github/workflows/pr-title.yml`](../.github/workflows/pr-title.yml))
runs the same commitlint check against every PR title, except for Dependabot
PRs (their titles can contain a bare `@word` from a package name, and
`build` commits do not reach the changelog anyway).

As a second guard, `tools/release/project-changelog-renderer.ts` escapes a
bare `@word` in the change-list line (`formatChange`) and the
breaking-change line and explanation (`formatBreakingChangeBase`,
`extractBreakingChangeExplanation`) it renders for each commit. It does not
touch `renderAuthors`, whose ` @username` is a deliberate GitHub mention.
