# Changelog

## `@ngx-signal-forms/toolkit` `1.0.0-beta.6` (2026-03-18)

This release refines the toolkit, reorganizes the demo/docs surface, and streamlines the workspace tooling after the Angular `21.2` alignment introduced in `beta.5`.

---

## Breaking Changes

None.

There are no documented public API removals or required consumer migrations in this release.

---

## Changed

### Toolkit

- Added a `bare` form-field appearance mode.
- Improved form-field behavior, including the outlined label clickability fix.
- Improved hint projection behavior in form-field components.
- Tightened internal type safety and reduced nullish handling in toolkit internals.
- Removed unnecessary toolchain peer dependencies from the published toolkit package.

### Demo app

- Simplified and reorganized demo content.
- Removed deprecated advanced demo pages and outdated example routes.
- Updated demo forms and supporting content to better reflect the Angular `21.2` toolkit patterns.

### Documentation

- Reorganized older beta release docs into `docs/archive/`.
- Updated references to archived migration and changelog files.
- Refreshed documentation to match Angular `21.2` parity and current toolkit guidance.

### Tooling and tests

- Migrated workspace linting and formatting to OXC-based tooling.
- Removed Jest in favor of the Vitest and Playwright setup used by the workspace.
- Improved E2E test locators, route coverage, and debugger-related tests.

---

## Migration Notes

No dedicated `MIGRATION_BETA6.md` guide is required.

If you are upgrading from `beta.5`, no package-level breaking migration steps are required based on the published `beta.6` release scope.

You may still want to review the following if they affect your usage:

- form-field appearance options if you want to adopt the new `bare` mode
- demo route changes if you deep-linked into demo pages during development
- workspace tooling changes if you work inside the repository itself

---

## Release scope

This changelog reflects the changes in:

- `v1.0.0-beta.5..v1.0.0-beta.6`

It does **not** include newer commits currently on `main` after the `v1.0.0-beta.6` tag.
