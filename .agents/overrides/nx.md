# Nx skill overrides

The Nx skills in `.agents/skills` (`nx-*`, `monitor-ci`,
`link-workspace-packages`) are unedited upstream copies. This file holds the
rules of this workspace. Where a rule here differs from a skill, this file
wins.

## link-workspace-packages

Internal projects resolve through `paths` in `tsconfig.base.json`
(`@ngx-signal-forms/*`, `@spartan-ng/helm/*`). No project declares a
`workspace:` dependency. For an internal import that does not resolve, add or
correct the path alias.

## nx-generate

A library for npm needs `--publishable --importPath=<package-name>`.
`--bundler` alone gives a buildable library.

## nx-plugins and nx-import

- Get the maintainer's approval before you add a plugin or accept one that
  `nx import` offers. A new package must pass the supply-chain settings in
  `pnpm-workspace.yaml`.
- Lint runs on oxlint through `@nx/oxlint`. ESLint is installed only as a peer
  of the oxlint JS plugins. Keep its catalog version and leave `@nx/eslint`
  out.
- `@nx/vitest` infers `test` targets, and only for the paths in its `include`
  list in `nx.json`. Add the path of an imported Vite project to that list.

## nx-workspace

For diagnosis, run `pnpm nx sync:check`. `pnpm nx sync` changes workspace
files, so ask the maintainer first.

## monitor-ci

- When `ci-poll-decide.mjs` returns the code `error`, count the poll as one
  without progress. Stop when the `--timeout` time has passed, or after 13
  such polls in a row. The script does not stop by itself in this case.
- When `cycle-check` returns `limitReached`, still report a terminal result
  (success, cancelled, or timed out). Stop only before an action that starts a
  new cycle.
