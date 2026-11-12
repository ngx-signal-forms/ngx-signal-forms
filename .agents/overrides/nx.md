# Nx skill overrides

The Nx skills in `.agents/skills` (`nx-*`, `monitor-ci`,
`link-workspace-packages`) are unedited upstream copies. This file holds the
rules of this workspace. Where a rule here differs from a skill, this file
wins.

## All Nx skills

Run every `nx` command in a skill as `pnpm nx`. This uses the pinned Nx
version of the workspace.

## Updating Nx skills

Do not use `pnpm nx configure-ai-agents` for shared-only updates. Its
`--agents` option selects providers, not destinations. The current command
has no skills-only or output-directory option. `--no-interactive` removes
input prompts but can still configure the detected agent and update other
configured agents.

Use the upstream
[Nx AI agents configuration](https://github.com/nrwl/nx-ai-agents-config)
instead. Download it to a temporary checkout under `$TMPDIR`. Copy only
`generated/.agents/skills/` into this workspace's `.agents/skills/`.
Keep those files byte-identical to upstream and preserve the other workspace
skills. Do not copy the generated provider directories, commands, subagents,
or MCP configuration. Remove the temporary checkout after the update.

Decline provider setup/update prompts. The installed Nx CLI and workspace
schema have no persistent shared-only provider allowlist. Do not use
`.gitignore` as an installation control: it hides files but does not prevent
Nx from writing them.

Nx does not save the initial provider selection as a workspace setting.
It infers configuration from existing rules and each provider's MCP setup.
Shared `AGENTS.md` can therefore make an unused provider appear partially
configured. Removing provider files does not remove it from the setup prompt.
For a future `pnpm nx init`, pass `--aiAgents=none` to skip agent setup for
that invocation. This is not a persistent opt-out for `configure-ai-agents`.

Keep sandbox grants separate from skill installation. The existing
`.claude/settings.json` grants Nx socket access without enabling the Nx
Claude plugin. Copilot CLI reads sandbox policy from user-level settings,
not from a committed workspace file. See the
[Nx sandbox guide](https://nx.dev/docs/kb/nx-sandbox-unix-sockets).

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
