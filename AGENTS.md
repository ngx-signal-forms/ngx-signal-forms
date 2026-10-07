# Agent instructions

Start here. Keep provider files as thin delegates; shared rules live here,
in [coding standards](CODING_STANDARDS.md), and in `.agents/skills/**`.

## Startup

- Scaffolding: invoke `nx-generate` before exploration or Nx tools. Otherwise,
  invoke `nx-workspace` before workspace exploration.
- Editing or reviewing: read the applicable [coding standards](CODING_STANDARDS.md)
  sections and their triggered sources before editing or judging code.

## Action routes

- Writing prose: read [Writing](CODING_STANDARDS.md#writing).
- Creating commits or PR titles: read [Commits](CODING_STANDARDS.md#commits).
- Executing Nx tasks, using Nx plugins, or changing Nx configuration: read [Nx workflow](CODING_STANDARDS.md#nx-workflow).
- Handling issues, PRDs, or pull requests: read [issue tracker](docs/agents/issue-tracker.md).
- Running sandboxed commands, managing worktrees, or pushing: read [sandbox guidance](docs/agents/sandbox.md).
