---
title: 'Contributing'
---

This is the entry point for work on the repository. Code and agent rules live
in [`AGENTS.md`](../AGENTS.md). Repository layout and packaging live in
[Package architecture](./PACKAGE_ARCHITECTURE.md).

## Issues and pull requests

For now, only repository collaborators can open pull requests. To report a bug
or ask for a feature, open an
[issue](https://github.com/ngx-signal-forms/ngx-signal-forms/issues/new/choose).
For questions and ideas, use
[Discussions](https://github.com/ngx-signal-forms/ngx-signal-forms/discussions).
For a security problem, follow the [security policy](../SECURITY.md).

## Setup

1. Use the Node version in [`.node-version`](../.node-version).
2. Install the pnpm version named in `packageManager` in the root
   `package.json`.
3. Run `pnpm install`. This also installs the `commit-msg` hook.

Run every task through Nx with `pnpm nx …`.

## Common commands

| Task                          | Command                                                       |
| ----------------------------- | ------------------------------------------------------------- |
| Serve the demo app            | `pnpm nx serve demo` (or `pnpm start`)                        |
| Toolkit unit tests (jsdom)    | `pnpm nx test toolkit`                                        |
| Toolkit browser tests         | `pnpm nx run toolkit:test-browser`                            |
| Lint the toolkit              | `pnpm nx lint toolkit`                                        |
| Build the publishable toolkit | `pnpm nx build toolkit`                                       |
| Format                        | `pnpm format` (check only: `pnpm format:check`)               |
| Coverage                      | `pnpm nx run workspace:coverage`                              |
| Demo end-to-end tests         | `pnpm nx run demo-e2e:e2e-demo-app`                           |
| Demo accessibility scan       | `pnpm nx run demo-e2e:a11y`                                   |
| What CI runs for the toolkit  | `pnpm nx run-many -t lint test test-browser build -p toolkit` |

The toolkit build has two cached steps. `toolkit:build-ng-packagr` runs
ng-packagr into `dist/packages/toolkit-ng-packagr`. `toolkit:build` copies
that into `dist/packages/toolkit`, writes the npm README, copies `LICENSE`,
and strips the `@internal` members and the `./core` export. Only
`toolkit:build` writes `dist/packages/toolkit`, so a cache hit always
restores the finished package.

## Documentation starter check

The quick start in the root [`README.md`](../README.md) sits between
`documentation-starter:start` and `documentation-starter:end` markers. CI
compiles that block and runs its submission action:

```sh
pnpm nx run toolkit:check-documentation-starter
```

Run it after you change the quick start.

## Where docs live

Explain each topic in one file. Elsewhere, write one sentence and a link.

| Topic                                                    | File                                                                                    |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Benefits, install, quick start, which entry point to use | [`README.md`](../README.md) (published to npm)                                          |
| What Angular owns and what the toolkit owns              | [`ANGULAR_VS_TOOLKIT.md`](./ANGULAR_VS_TOOLKIT.md)                                      |
| Config keys and defaults                                 | [`packages/toolkit/README.md`](../packages/toolkit/README.md#configuration)             |
| Error and warning timing, warning submission, messages   | [`WARNINGS_SUPPORT.md`](./WARNINGS_SUPPORT.md)                                          |
| Custom controls                                          | [`CUSTOM_CONTROLS.md`](./CUSTOM_CONTROLS.md)                                            |
| Custom wrappers                                          | [`CUSTOM_WRAPPERS.md`](./CUSTOM_WRAPPERS.md)                                            |
| Fieldsets, arrays, error summaries                       | [`COMPLEX_NESTED_FORMS.md`](./COMPLEX_NESTED_FORMS.md)                                  |
| Inputs of each entry point                               | The README in each entry point folder under [`packages/toolkit/`](../packages/toolkit/) |
| CSS tokens                                               | [`THEMING.md`](../packages/toolkit/form-field/THEMING.md)                               |
| Bootstrap, Tailwind, Material CSS                        | [`CSS_FRAMEWORK_INTEGRATION.md`](./CSS_FRAMEWORK_INTEGRATION.md)                        |
| Component tests                                          | [`TESTING.md`](./TESTING.md)                                                            |
| Changes between versions                                 | [`migrations/`](./migrations/README.md)                                                 |
| Domain terms                                             | [`CONTEXT.md`](../CONTEXT.md)                                                           |

User docs describe the current state only. Put history in `migrations/`.
Put maintainer notes in a `## For maintainers` section at the end of a file,
or in this file.

## Docs site

The docs site on Docs7 is built from these markdown files. `docs.json` at the
repo root lists the pages. Write links as normal relative links to `.md`
files, so they work on GitHub. On each push to `main`,
[`build-docs7-site.mjs`](../tools/scripts/build-docs7-site.mjs) rewrites the
links for the site and pushes the result to the `docs7` branch. Docs7
deploys that branch.

The build fails on a link to a missing file or heading. CI runs it on every
pull request. To check the build and preview the site locally:

```sh
pnpm nx run workspace:check-docs7-site
npx @upstash/docs7 dev dist/docs7
```

To add a page, add it to `docs.json` and give the file `title` and
`sidebarTitle` frontmatter in place of the `#` heading.

## Architecture decisions

ADRs live in [`docs/decisions/`](./decisions/). Add one when you make a
decision that is hard to reverse or that a reader would question.

## Project tags and module boundaries

Every Nx project has one `scope:*` tag and one `type:*` tag in its
`project.json`. The `@nx/enforce-module-boundaries` rule in
[`oxlint.config.ts`](../oxlint.config.ts) reads them.

| Tag          | Meaning                           | May depend on             |
| ------------ | --------------------------------- | ------------------------- |
| `scope:lib`  | Publishable library code          | `scope:lib`               |
| `scope:demo` | Demo apps and demo-only libraries | `scope:lib`, `scope:demo` |
| `type:lib`   | Library project                   | `type:lib`                |
| `type:app`   | Application project               | `type:lib`, `type:app`    |

The toolkit (`scope:lib`) must not import demo code. The Material, PrimeNG,
and Spartan demos pull in design-system packages that the toolkit must never
ship with. When you add a project, add both tags and run
`pnpm nx run-many -t lint`.

## Published package guardrails

These checks run against the built package in `dist/packages/toolkit`, after
`toolkit:build`. CI and the release workflow call them directly, so
`nx affected` does not skip them.

1. **Public API and tarball contents.**
   `pnpm nx run toolkit:check-published-package` compares each built `.d.ts`
   (including the internal `/core` types as `core.internal`) and the `npm pack`
   file list with the baseline in
   [`packages/toolkit/api-reports/`](../packages/toolkit/api-reports). After
   an intended change, review the diff and update the baseline. The check
   sorts the members of literal unions (`'a' | 'b'`), so a cached and a clean
   build give the same baseline. Build first: `toolkit:build` runs every step
   that shapes the published package:

   ```sh
   pnpm nx build toolkit
   pnpm run check:toolkit-published-package -- --update
   ```

2. **Package shape.** `pnpm nx run toolkit:check-package-shape` runs
   [publint](https://publint.dev) and
   [Are the Types Wrong](https://arethetypeswrong.github.io) (ESM only).
3. **Bundle size.** `pnpm nx run toolkit:check-size` runs
   [size-limit](https://github.com/ai/size-limit) per entry point. The
   budgets and the steps to raise one are in
   [`packages/toolkit/.size-limit.cjs`](../packages/toolkit/.size-limit.cjs).

The demo apps have no size budget. Their `build` targets wrap
`vite build`, so an Angular CLI `budgets` block has no effect.

## Toolkit isolation guarantees

Two CI checks keep design-system packages out of the toolkit:

1. `pnpm check:toolkit-peer-deps` fails when
   `packages/toolkit/package.json` lists `@angular/material`, `primeng`,
   `primeicons`, `@spartan-ng/*`, `@primeuix/*`, `@primeng/*`, or
   `@angular/cdk`.
2. The `toolkit-isolation` job in
   [`ci.yml`](../.github/workflows/ci.yml) installs only the toolkit's
   dependency graph and builds it.

`pnpm nx lint toolkit` also fails on any toolkit source import of those
packages (`bannedExternalImports` in `oxlint.config.ts`).
Declare a design-system package in the `package.json` of the demo project
that imports it, never in the root `package.json`.

If one fails, move the dependency into the demo app that needs it. Do not
relax the check.

## Commit messages and PR titles

Use [Conventional Commits](https://www.conventionalcommits.org/). `nx release`
reads the subject to pick the version bump, and the subject goes into the
GitHub release notes as written.

- Put every `@word` in backticks. A bare `@word` becomes a GitHub mention.
- The `commit-msg` hook runs commitlint with
  [`commitlint.config.cjs`](../commitlint.config.cjs). The hook does not
  change your message. Fix it and commit again.
- A squash merge uses the PR title as the subject. The
  [`PR Title`](../.github/workflows/pr-title.yml) workflow checks every PR
  title, except Dependabot PRs.
- The release notes renderer (`tools/release/project-changelog-renderer.ts`)
  also escapes a bare `@word`.

## Release

1. Run the **Release** workflow
   ([`release.yml`](../.github/workflows/release.yml)) from the Actions tab.
   Pick the bump (`prerelease` with `rc` for a release candidate). Use
   **Dry run** first to preview. The workflow runs the checks, then
   `nx release` versions, tags, and creates the GitHub release. It does not
   publish.
2. The new `v*` tag starts the **Publish** workflow
   ([`publish.yml`](../.github/workflows/publish.yml)). It fails unless the
   tagged commit is on `main`. A `build` job builds the package and uploads
   it. A `publish` job then waits for approval on the `npm-publish`
   environment. It installs nothing and publishes the uploaded package to npm
   through trusted publishing (OIDC), with the dist-tag taken from the
   version. A dry run skips the approval.

Release notes are the GitHub releases. There is no `CHANGELOG.md`.
