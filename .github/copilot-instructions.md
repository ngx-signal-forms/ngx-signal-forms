---
description: 'Shared agent instructions for ngx-signal-forms'
applyTo: '**'
---

# Shared Agent Instructions

This repository uses shared agent configuration to avoid per-assistant drift.

- Bootstrap and action routes: `AGENTS.md`
- Task-specific standards and source pointers: `CODING_STANDARDS.md`
- Reusable guidance and behavior: `.agents/skills/**`

If additional assistant-specific files exist, keep them as thin delegates to `AGENTS.md` rather than duplicating rules.
