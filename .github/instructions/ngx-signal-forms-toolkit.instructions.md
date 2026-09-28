---
description: '@ngx-signal-forms/toolkit - non-negotiable usage rules'
applyTo: '{apps}/**/*.{ts,html,scss,css}'
---

# @ngx-signal-forms/toolkit

Enhancement layer on top of Angular Signal Forms. For API detail, entry points, and examples, use the `ngx-signal-forms` skill (`.agents/skills/ngx-signal-forms/SKILL.md`) — it routes to sub-skills per entry point and holds the full public API reference. If the skill file is unavailable, do not infer API signatures. Instead, ask the user to provide the relevant entry-point documentation before generating code.

## Entry Points

| Entry point                            | Purpose                                                    |
| -------------------------------------- | ---------------------------------------------------------- |
| `@ngx-signal-forms/toolkit`            | Core: `[formRoot]`, auto-ARIA, strategies, utilities       |
| `@ngx-signal-forms/toolkit/form-field` | Styled wrapper, fieldset grouping, field appearances       |
| `@ngx-signal-forms/toolkit/assistive`  | Standalone errors, grouped notifications, hints, summaries |
| `@ngx-signal-forms/toolkit/headless`   | Renderless state, notification, and summary directives     |
| `@ngx-signal-forms/toolkit/vest`       | Vest validation adapter (optional)                         |
| `@ngx-signal-forms/toolkit/testing`    | axe-core WCAG 2.2 AA test harness for specs (optional)     |
| `@ngx-signal-forms/debugger`           | Dev-only form-tree inspection panel (demo/dev only)        |

## Non-Negotiable Rules

Follow the **Non-Negotiable Rules** in [`.agents/skills/ngx-signal-forms/SKILL.md`](../../.agents/skills/ngx-signal-forms/SKILL.md). They are not repeated here: two copies drift, and the skill's copy is the one kept current.

Repo-wide conventions live in [`AGENTS.md`](../../AGENTS.md).
