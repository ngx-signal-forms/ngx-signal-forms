# Agent instructions

Start here. Keep provider files as thin delegates; shared rules live here,
in [coding standards](CODING_STANDARDS.md), and in `.agents/skills/`
(`.claude/skills` is a symlink to it).

## Ownership

This codebase is yours to shape and keep improving: follow the boy scout rule
and leave code you touch or reuse simpler than you found it, changing working
code only when that removes real complexity or a real defect.

## Shared skills

- Keep all workspace skills in `.agents/skills/`. Do not copy them into
  provider folders or install the Nx Claude plugin alongside them.
- Codex, GitHub Copilot, Mistral Vibe, and Gemini CLI read this directory
  directly. Vibe loads project skills only in trusted folders. Gemini CLI
  reads `AGENTS.md` through `context.fileName` in `.gemini/settings.json`.
- Claude Code reads the same skills through `.claude/skills`. Keep this
  symlink; it does not duplicate the skills.
- Claude Code reads `AGENTS.md` natively. Do not add a `CLAUDE.md` delegate.
  In the default `claude-md-or-agents-md` mode, a `CLAUDE.md`,
  `.claude/CLAUDE.md`, or `CLAUDE.local.md` in the working directory or any
  directory above it makes Claude Code skip `AGENTS.md`; `~/.claude/CLAUDE.md`
  does not count. If you keep such a
  file, set **Project instructions** in `/config` to `claude-md-and-agents-md`.
  See the
  [Claude instruction-loading guide](https://code.claude.com/docs/en/memory#agents-md).
- `nx configure-ai-agents` creates provider configuration and can restore
  duplicate skills or the Claude plugin. Review its output before accepting it:
  delete `.github/skills/`, and change its `npx nx mcp` entries to
  `pnpm exec nx mcp`.
- Keep vendored skills byte-identical to upstream; `oxfmt` skips them.
  `skills-lock.json` tracks the skills installed with `npx skills`
  (update: `npx skills update -p -y`). `nx configure-ai-agents` owns and
  overwrites the Nx skills (`nx-*`, `monitor-ci`, `link-workspace-packages`).
  Put a workspace rule for a vendored skill in `.agents/overrides/` and send
  skill corrections upstream.
- MCP connections are separate from skill discovery. `.mcp.json` configures
  Claude Code, `.codex/config.toml` configures Codex in a trusted project,
  `.gemini/settings.json` configures Gemini CLI, and `.vscode/mcp.json`
  configures Copilot in VS Code, which gets `nx-mcp` from Nx Console. Keep
  their server lists in sync. Vibe needs its own MCP setup.

## Startup

- Editing or reviewing: read the applicable [coding standards](CODING_STANDARDS.md)
  sections and their triggered sources before editing or judging code.
- For toolkit use or demo-app changes, load the `ngx-signal-forms` skill before
  making changes. This includes consumers and examples that import
  `@ngx-signal-forms/toolkit`. This rule alone does not require the skill for
  work only on the toolkit implementation or unrelated packages.

## Test runs

- After a change, run only the affected tests with Vitest's experimental
  `--since-last-run` flag: `pnpm nx run-many -t test --skip-nx-cache -- --since-last-run`.
  The first run per Vitest config runs everything and records the files each
  test loaded; later runs run only tests whose files changed since their last
  run, plus tests that failed. No Git needed, so it works in worktrees and
  containers. Keep `--skip-nx-cache` before `--` so Nx does not replay a
  cached full run instead of running Vitest. Details in
  [Run only affected tests](docs/TESTING.md#run-only-affected-tests).
- Before you finish, run the whole suite once without the flag:
  `pnpm test:all`, plus `pnpm test:browser` for the toolkit browser specs.

## Action routes

- Writing prose: read [Writing](CODING_STANDARDS.md#writing).
- Creating commits or PR titles: read [Commits](CODING_STANDARDS.md#commits).
- Executing Nx tasks, using Nx plugins, or changing Nx configuration: read [Nx workflow](CODING_STANDARDS.md#nx-workflow).
- Following an Nx skill (`nx-*`, `monitor-ci`, `link-workspace-packages`):
  1. Read [Nx skill overrides](.agents/overrides/nx.md). It wins over the skill text.
  2. Invoke the specific skill: `nx-generate` for scaffolding or `nx-workspace`
     for workspace exploration.
  3. Then explore the workspace or call MCP tools.
- Handling issues, PRDs, or pull requests: read [issue tracker](docs/agents/issue-tracker.md).
- Running sandboxed commands, managing worktrees, or pushing: read [sandbox guidance](docs/agents/sandbox.md).

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

## General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->
