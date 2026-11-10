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
- Codex, GitHub Copilot, and Mistral Vibe read this directory directly.
  Vibe loads project skills only in trusted folders.
- Claude Code reads the same skills through `.claude/skills`. Keep this
  symlink; it does not duplicate the skills.
- Claude Code loads `AGENTS.md` natively from v2.1.277. Use v2.1.281 or later
  for broader session support. Do not add a `CLAUDE.md` delegate.
  Keep native AGENTS support enabled. In `/config`, use the default
  `claude-md-or-agents-md` mode with no `CLAUDE.md`, `.claude/CLAUDE.md`, or
  `CLAUDE.local.md` in the working directory or its ancestors. Those files
  prevent the default AGENTS fallback. See the
  [Claude instruction-loading guide](https://code.claude.com/docs/en/memory#agents-md).
- `nx configure-ai-agents` creates provider configuration and can restore
  duplicate skills or the Claude plugin. Review its output before accepting it.
- Keep vendored skills byte-identical to upstream; `oxfmt` skips them.
  `skills-lock.json` tracks `angular-developer` and `accessibility-a11y`
  (update: `npx skills update -p -y`). `nx configure-ai-agents` owns and
  overwrites the Nx skills (`nx-*`, `monitor-ci`, `link-workspace-packages`).
  Put a workspace rule for a vendored skill in `.agents/overrides/` and send
  skill corrections upstream.
- MCP connections are separate from skill discovery. The shared `.mcp.json`
  configures Claude Code; other clients need their own MCP connection if they
  do not already get it from Nx Console.

## Startup

- Editing or reviewing: read the applicable [coding standards](CODING_STANDARDS.md)
  sections and their triggered sources before editing or judging code.
- Code that uses this library: load the `ngx-signal-forms` skill first.

## Action routes

- Writing prose: read [Writing](CODING_STANDARDS.md#writing).
- Creating commits or PR titles: read [Commits](CODING_STANDARDS.md#commits).
- Executing Nx tasks, using Nx plugins, or changing Nx configuration: read [Nx workflow](CODING_STANDARDS.md#nx-workflow).
- Following an Nx skill (`nx-*`, `monitor-ci`, `link-workspace-packages`): read [Nx skill overrides](.agents/overrides/nx.md) first. It wins over the skill text.
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
