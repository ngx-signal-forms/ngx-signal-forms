# Skills and Plugins Inventory

Generated: 2026-04-10

## Scope

This document lists the **current installed state** for both **Copilot** and **Claude**:

1. **Global / user-level**
2. **Local / repository-level**

It also includes the **repo links** and the **install commands** for moving generic items to global scope.

## Source Repositories

| Source                              | Repo                                                    |
| ----------------------------------- | ------------------------------------------------------- |
| Current workspace skills source     | <https://github.com/ngx-signal-forms/ngx-signal-forms>  |
| Claude Nx plugin marketplace        | <https://github.com/nrwl/nx-ai-agents-config>           |
| Claude official plugins marketplace | <https://github.com/anthropics/claude-plugins-official> |

## Copilot - Current State

### Global

| Type    | Current state  | Location              |
| ------- | -------------- | --------------------- |
| Plugins | None installed | `copilot plugin list` |
| Skills  | None installed | `~/.copilot/skills`   |

### Local / repository

Copilot currently uses **repository-local skills** from:

- `.github/skills/*`

Current local skills:

| Skill                   | Type               | Recommended scope | Source repo                                                                                             |
| ----------------------- | ------------------ | ----------------- | ------------------------------------------------------------------------------------------------------- |
| accessibility-a11y      | generic            | global            | <https://github.com/ngx-signal-forms/ngx-signal-forms/tree/main/.github/skills/accessibility-a11y>      |
| angular-developer       | generic            | global            | <https://github.com/ngx-signal-forms/ngx-signal-forms/tree/main/.github/skills/angular-developer>       |
| chrome-devtools         | generic            | global            | <https://github.com/ngx-signal-forms/ngx-signal-forms/tree/main/.github/skills/chrome-devtools>         |
| create-readme           | generic            | global            | <https://github.com/ngx-signal-forms/ngx-signal-forms/tree/main/.github/skills/create-readme>           |
| frontend-design         | generic            | global            | <https://github.com/ngx-signal-forms/ngx-signal-forms/tree/main/.github/skills/frontend-design>         |
| git-commit              | generic            | global            | <https://github.com/ngx-signal-forms/ngx-signal-forms/tree/main/.github/skills/git-commit>              |
| link-workspace-packages | generic            | global            | <https://github.com/ngx-signal-forms/ngx-signal-forms/tree/main/.github/skills/link-workspace-packages> |
| monitor-ci              | generic            | global            | <https://github.com/ngx-signal-forms/ngx-signal-forms/tree/main/.github/skills/monitor-ci>              |
| ngx-signal-forms        | workspace-specific | keep local        | <https://github.com/ngx-signal-forms/ngx-signal-forms/tree/main/.github/skills/ngx-signal-forms>        |
| nx-generate             | workspace-specific | keep local        | <https://github.com/ngx-signal-forms/ngx-signal-forms/tree/main/.github/skills/nx-generate>             |
| nx-import               | workspace-specific | keep local        | <https://github.com/ngx-signal-forms/ngx-signal-forms/tree/main/.github/skills/nx-import>               |
| nx-plugins              | workspace-specific | keep local        | <https://github.com/ngx-signal-forms/ngx-signal-forms/tree/main/.github/skills/nx-plugins>              |
| nx-run-tasks            | workspace-specific | keep local        | <https://github.com/ngx-signal-forms/ngx-signal-forms/tree/main/.github/skills/nx-run-tasks>            |
| nx-workspace            | workspace-specific | keep local        | <https://github.com/ngx-signal-forms/ngx-signal-forms/tree/main/.github/skills/nx-workspace>            |
| playwright-cli          | generic            | global            | <https://github.com/ngx-signal-forms/ngx-signal-forms/tree/main/.github/skills/playwright-cli>          |
| playwright              | generic            | global            | <https://github.com/ngx-signal-forms/ngx-signal-forms/tree/main/.github/skills/playwright>              |
| pr-toolkit              | generic            | global            | <https://github.com/ngx-signal-forms/ngx-signal-forms/tree/main/.github/skills/pr-toolkit>              |
| refactor                | generic            | global            | <https://github.com/ngx-signal-forms/ngx-signal-forms/tree/main/.github/skills/refactor>                |
| skill-creator           | generic            | global            | <https://github.com/ngx-signal-forms/ngx-signal-forms/tree/main/.github/skills/skill-creator>           |
| typescript              | generic            | global            | <https://github.com/ngx-signal-forms/ngx-signal-forms/tree/main/.github/skills/typescript>              |
| vitest                  | generic            | global            | <https://github.com/ngx-signal-forms/ngx-signal-forms/tree/main/.github/skills/vitest>                  |
| web-design-guidelines   | generic            | global            | <https://github.com/ngx-signal-forms/ngx-signal-forms/tree/main/.github/skills/web-design-guidelines>   |
| web-design-reviewer     | generic            | global            | <https://github.com/ngx-signal-forms/ngx-signal-forms/tree/main/.github/skills/web-design-reviewer>     |

### Copilot global install commands

These generic skills are **not published as Copilot plugins** in this environment, so the practical global install method is copying them into `~/.copilot/skills`.

Run these from the repo root, or set `REPO` to the repo path:

```bash
REPO="${REPO:-$(pwd)}"

SKILLS=(
  accessibility-a11y
  angular-developer
  chrome-devtools
  create-readme
  frontend-design
  git-commit
  link-workspace-packages
  monitor-ci
  playwright-cli
  playwright
  pr-toolkit
  refactor
  skill-creator
  typescript
  vitest
  web-design-guidelines
  web-design-reviewer
)

mkdir -p "$HOME/.copilot/skills"
for skill in "${SKILLS[@]}"; do
  rsync -a "$REPO/.github/skills/$skill/" "$HOME/.copilot/skills/$skill/"
done
```

## Claude - Current State

### Global

#### Installed plugins

| Plugin                          | Version | Scope | Status  | Source repo                                             | Install command                                                    |
| ------------------------------- | ------- | ----- | ------- | ------------------------------------------------------- | ------------------------------------------------------------------ |
| `figma@claude-plugins-official` | `2.1.3` | user  | enabled | <https://github.com/anthropics/claude-plugins-official> | `claude plugin install figma@claude-plugins-official --scope user` |

#### Installed standalone skills

| Skill          | Location                        | Source repo                     | Install command                                         |
| -------------- | ------------------------------- | ------------------------------- | ------------------------------------------------------- |
| `context7-mcp` | `~/.claude/skills/context7-mcp` | Not embedded in installed files | Copy skill folder into `~/.claude/skills/context7-mcp/` |
| `find-docs`    | `~/.claude/skills/find-docs`    | Not embedded in installed files | Copy skill folder into `~/.claude/skills/find-docs/`    |

### Local / repository

Claude currently has **repository-local config**:

| Item                    | Current state                  | Source repo                                   | Notes                                                                                          |
| ----------------------- | ------------------------------ | --------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `.claude/settings.json` | enables `nx@nx-claude-plugins` | <https://github.com/nrwl/nx-ai-agents-config> | shared team config; the Nx marketplace/plugin is workspace-specific, so this file is committed |

Current local Claude config:

```json
{
  "extraKnownMarketplaces": {
    "nx-claude-plugins": {
      "source": {
        "source": "github",
        "repo": "nrwl/nx-ai-agents-config"
      }
    }
  },
  "enabledPlugins": {
    "nx@nx-claude-plugins": true
  }
}
```

### Claude global install commands

#### 1. Install generic standalone skills globally

Run these from the repo root, or set `REPO` to the repo path:

```bash
REPO="${REPO:-$(pwd)}"

SKILLS=(
  accessibility-a11y
  angular-developer
  chrome-devtools
  create-readme
  frontend-design
  git-commit
  link-workspace-packages
  monitor-ci
  playwright-cli
  playwright
  pr-toolkit
  refactor
  skill-creator
  typescript
  vitest
  web-design-guidelines
  web-design-reviewer
)

mkdir -p "$HOME/.claude/skills"
for skill in "${SKILLS[@]}"; do
  rsync -a "$REPO/.github/skills/$skill/" "$HOME/.claude/skills/$skill/"
done
```

#### 2. Install the Nx plugin globally for Claude

```bash
claude plugin marketplace add nrwl/nx-ai-agents-config --scope user
claude plugin install nx@nx-claude-plugins --scope user
```

Repo:

- <https://github.com/nrwl/nx-ai-agents-config>

#### 3. Install the Figma plugin globally for Claude

```bash
claude plugin install figma@claude-plugins-official --scope user
```

Repo:

- <https://github.com/anthropics/claude-plugins-official>

## Recommended End State

### Keep local in this repository

#### Copilot

- `ngx-signal-forms`
- `nx-generate`
- `nx-import`
- `nx-plugins`
- `nx-run-tasks`
- `nx-workspace`

#### Claude

- `CLAUDE.md`
- `.claude/settings.json` (shared-team config; enables the workspace-specific Nx marketplace/plugin)

### Remove from this repository after global install

#### Copilot

- all generic `.github/skills/*` listed above

#### Claude

- _(none — generic skills are loaded from `~/.claude/skills` by each contributor; only workspace-specific Claude config stays in the repo)_

## Verification Commands

```bash
# Copilot
copilot plugin list
find "$HOME/.copilot/skills" -maxdepth 2 -name SKILL.md | sort

# Claude
claude plugin list
find "$HOME/.claude/skills" -maxdepth 2 -name SKILL.md | sort
```
