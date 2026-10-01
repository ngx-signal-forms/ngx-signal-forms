# Nx AI agent files

`nx configure-ai-agents` writes Nx skills, subagents and MCP config into this
workspace. We keep **one** copy of the skills, in `.agents/skills/`.

## There is no setting for the output folder

Nx has no `nx.json` key and no environment variable for this. The only knob is
the `--agents` list, and the folders follow from it
(`nx/src/ai/set-up-ai-agents/set-up-ai-agents.ts`):

| Agent      | Writes                                                                                                                          |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `codex`    | `.agents/` (shared skills), `.codex/config.toml`, `.codex/agents/`, `AGENTS.md`                                                 |
| `cursor`   | `.agents/` (shared skills), `.cursor/`, `AGENTS.md`                                                                             |
| `gemini`   | `.agents/` (shared skills), `.gemini/settings.json`, `.gemini/`, `AGENTS.md` or `GEMINI.md`                                     |
| `copilot`  | `.github/` — a **full second copy** of the skills in `.github/skills/`, plus `.github/agents/`, `.github/prompts/`, `AGENTS.md` |
| `opencode` | `.opencode/` — a **full second copy** in `.opencode/skills/`, plus `.opencode/agents/`, `opencode.json`, `AGENTS.md`            |
| `claude`   | `CLAUDE.md`, `.claude/settings.json`, and the Nx Claude plugin — no workspace skill copy                                        |

Read that table carefully: **no agent list gives you `.agents/skills/` on its
own.** `codex`, `cursor` and `gemini` are the only agents that fill the shared
folder, and each one also writes its own directory. `claude` provides skills
through its plugin instead of writing `.agents/skills/`.

So "only `.agents/skills`" is not something you can configure through
`nx configure-ai-agents`.

## What we do

Nx documents a separate, supported command for installing only the skills:

```sh
npx skills add nrwl/nx-ai-agents-config
```

We make its destination explicit and non-interactive in `package.json`:

```sh
pnpm dlx skills@latest add nrwl/nx-ai-agents-config \
  --agent universal \
  --skill '*' \
  --copy \
  --yes
```

Run it through the short package script:

```sh
pnpm ai:agents
```

`universal` maps to the project path `.agents/skills/`. `--copy` keeps the
committed skills as regular files instead of links. `--skill '*'` installs all
skills from the Nx package. The Skills CLI records their source in
`skills-lock.json`.

The command updates only the seven skills in the Nx package. It does not rewrite
custom skills or touch `AGENTS.md`, `CLAUDE.md`, `.claude/`, `.codex/`,
`.cursor/`, `.gemini/`, `.github/`, `.opencode/` or `opencode.json`.

`CLAUDE.md` and `.github/copilot-instructions.md` remain thin, hand-maintained
delegates to `AGENTS.md`. Claude Code reads the skills through the symlinks in
`.claude/skills/`.

Never run bare `nx configure-ai-agents`. Its default is _all six agents_, which
writes every agent-specific configuration and creates extra skill copies.

Nx can still print "Your AI agent configuration is outdated" after a task run.
Answer it with `pnpm ai:agents`, never with the bare command.
