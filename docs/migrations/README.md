# Versioned migration guides

Every published toolkit version must add `v<version>.md` in this directory
before it is released. The guide is the authoritative upgrade path from the
immediately preceding version to that release.

| From           | To             | Guide                              |
| -------------- | -------------- | ---------------------------------- |
| `v1.0.0-rc.10` | `v1.0.0-rc.11` | [Upgrade guide](./v1.0.0-rc.11.md) |

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
