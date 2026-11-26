---
title: 'Versioned migration guides'
sidebarTitle: 'Overview'
---

A toolkit release with breaking changes must add `v<version>.md` in this directory before release. The guide covers the upgrade from the preceding release.

| From                                    | To       | Guide                        |
| --------------------------------------- | -------- | ---------------------------- |
| `v1.0.0-beta.10` or a release candidate | `v1.0.0` | [Upgrade guide](./v1.0.0.md) |

> **Add the guide before you cut the release, not after.** A guide written
> against a version number that is never published strands its content: readers
> upgrading from the last _published_ version never reach it, because the hop it
> documents does not exist. If work lands after a guide is drafted but before
> that version ships, fold the new entries into the pending guide rather than
> starting the next one.

Each guide starts with an `Upgrade from v<previous-version>` section:

- List every removed or renamed public API, changed peer dependency, and
  consumer-visible behavior change.
- Show a before/after snippet when a code change is required.
- State explicitly when no consumer migration is needed.
- Separate additions and bug fixes from required migration work.

When a guide exists, the GitHub release notes link to it. Generated
changelogs summarize changes, but do not replace migration instructions.
