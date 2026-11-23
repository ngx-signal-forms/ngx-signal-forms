# Toolkit migrations

Migrates an existing `@ngx-signal-forms/toolkit` integration between released versions.
Read [sources.md](../references/sources.md) first.
Release-specific migration guides live online, not inside this skill: read published guides from the [Docs7 migration index](https://ngx-signal-forms-ngx-signal-forms.docs7.io/docs/migrations) or the repository's [migration index](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/docs/migrations/README.md) on `main` when Docs7 lags a recent or pending release.
Offline work can proceed only for changes backed by available evidence; report missing guides and leave the migration incomplete rather than guessing.

## Workflow

### 1. Pin source and target versions

Read the consumer's `package.json` and lockfile for the installed `@ngx-signal-forms/toolkit` version and identify the requested target version.
Verify npm registry publication separately before updating dependency versions; a git tag or `main` guide for a pending release supports planning only.

**Done:** installed version, target version, and registry availability are verified.

### 2. Load every crossed release guide

Load the [migration index](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/docs/migrations/README.md) and **every** version hop between source and target, not only the final release guide:

- From beta (`1.0.0-beta.10` through `rc.15`): start with the [cumulative beta-to-v1 guide](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/docs/MIGRATING_BETA_TO_V1.md) and [CSS token migrations](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/docs/MIGRATING_CSS_VARS.md), then apply each subsequent hop.
- Between release candidates (for example `rc.11` -> `rc.17`): read every intervening `docs/migrations/v1.0.0-rc.<n>.md` guide (including behavior-only hops such as [v1.0.0-rc.17.md](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/docs/migrations/v1.0.0-rc.17.md)).
- Check current public CSS tokens and `color-scheme` dark-mode rules in [THEMING.md](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/packages/toolkit/form-field/THEMING.md).

**Done:** every crossed release guide is loaded and its required changes are listed.

### 3. Apply changes by owning surface

Read [core](../core/guide.md), [form-field](../form-field/guide.md), [assistive](../assistive/guide.md), [headless](../headless/guide.md), or [vest](../vest/guide.md) only for entry points touched by the crossed guides.
Use [pitfalls.md#removed-and-non-public-apis](../references/pitfalls.md#removed-and-non-public-apis) as a quick lookup for renamed or removed symbols.
Update peer ranges (`@angular/*`, `vest`, `axe-core`), imports, types, templates, styles, and tests.

**Done:** every migration item is applied or confirmed inapplicable to the consumer.

### 4. Prove the target integration

Use the crossed guides as an exhaustive checklist:

- Search the consumer codebase for every removed or renamed public symbol, config key, and CSS custom property named in the crossed guides.
- Check behavior-only changes that a TypeScript build will not catch: `color-scheme` dark mode, `on-touch` edit-hiding in tests, submit-only error-summary announcements, visually hidden `Error:` / `Warning:` prefixes, animation tokens, focus outlines, and ARIA snapshots.
- Run the consumer's build, type-check, and relevant unit or browser tests (use [testing/guide.md](../testing/guide.md) for changed interactions).

**Done:** every crossed-guide item is recorded as applied, verified unchanged, or inapplicable, no removed symbol remains, and target checks pass.
