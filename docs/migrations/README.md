# Versioned migration guides

Every published toolkit version must add `v<version>.md` in this directory
before it is released. The guide is the authoritative upgrade path from the
immediately preceding version to that release.

| From           | To             | Guide                              |
| -------------- | -------------- | ---------------------------------- |
| `v1.0.0-rc.10` | `v1.0.0-rc.11` | [Upgrade guide](./v1.0.0-rc.11.md) |
| `v1.0.0-rc.11` | `v1.0.0-rc.12` | [Upgrade guide](./v1.0.0-rc.12.md) |
| `v1.0.0-rc.12` | `v1.0.0-rc.13` | [Upgrade guide](./v1.0.0-rc.13.md) |

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

GitHub release notes must link to the matching guide. Generated changelogs
summarize changes, but do not replace migration instructions.

`docs/MIGRATING_BETA_TO_V1.md` remains the cumulative guide for beta users
upgrading to the current v1 API.
