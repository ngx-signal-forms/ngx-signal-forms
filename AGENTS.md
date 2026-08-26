# Agent instructions for ngx-signal-forms

Canonical instructions for every assistant. `CLAUDE.md` and `.github/copilot-instructions.md` are thin delegates — add rules here, never there.

## Writing

- **Write in Simplified Technical English** -- use short sentences, active voice, one meaning per word, cut clutter, keep it warm and human.

## Commits

Conventional Commits. The subject line drives `nx release` versioning **and lands verbatim in the GitHub release notes**, so it is public prose.

- `feat:` bumps minor, `fix:` bumps patch, `!` or a `BREAKING CHANGE:` footer bumps major.
- Backtick any `@word` in a subject — write `` `@group` ``, not `@group`. GitHub renders a bare `@word` in release notes as a user mention and links a stranger's account.
- Author commits as `Arjen <4863062+the-ult@users.noreply.github.com>`. `.mailmap` folds the older spellings into it.

## Where the rules live

| Topic                           | Read                                                                                                       |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Toolkit usage (non-negotiable)  | `.github/instructions/ngx-signal-forms-toolkit.instructions.md` + the `ngx-signal-forms` skill             |
| Angular / Signal Forms          | `angular-developer` skill (`references/signal-forms.md`)                                                   |
| A11y (WCAG 2.2 AA)              | `.github/instructions/a11y.instructions.md`                                                                |
| Domain vocabulary and decisions | `CONTEXT.md` at the repo root, ADRs at `docs/decisions/` (this repo's convention, not `docs/adr/`)         |
| Issues and PRDs                 | GitHub issues at `ngx-signal-forms/ngx-signal-forms` via the `gh` CLI — see `docs/agents/issue-tracker.md` |

Triage labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`.

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
