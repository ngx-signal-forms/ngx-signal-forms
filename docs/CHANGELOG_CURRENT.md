# Current main changelog

This document tracks unreleased changes on `main` after the latest tagged release.

- Latest tagged release: `v1.0.0-beta.6`
- Scope covered here: `v1.0.0-beta.6..HEAD`

## Summary

Current `main` is no longer equivalent to `1.0.0-beta.6`.

The most important user-facing changes since `beta.6` are:

- simplified error strategy model
- simplified toolkit configuration surface
- stricter field identity resolution for wrappers, errors, and headless helpers
- documentation alignment with the new toolkit behavior

See [Migration: beta.6 → current main](./MIGRATION_CURRENT.md) for upgrade guidance.

---

## Breaking / behavioral changes

### Error strategy model simplified

- `manual` is no longer part of `ErrorDisplayStrategy`
- supported strategies are now:
  - `immediate`
  - `on-touch`
  - `on-submit`
  - `inherit` (field-level only)

### Toolkit config surface reduced

`NgxSignalFormsConfig` is now narrower and more explicit.

Removed from the public config surface:

- `fieldNameResolver`
- `strictFieldResolution`
- `debug`

Also tightened:

- `defaultErrorStrategy` now accepts only resolved strategies (`immediate`, `on-touch`, `on-submit`)

### Field identity is now deterministic

Toolkit components no longer invent fallback field names.

You now need either:

- an explicit `fieldName`, or
- a deterministic `id` on the bound control / host element

This especially affects:

- `ngx-signal-form-field-wrapper`
- `ngx-signal-form-error`
- `ngxSignalFormHeadlessFieldName`

### Form-field appearance narrowed

- `bare` is no longer part of `FormFieldAppearance`
- current supported appearance values are `standard` and `outline`

### Internal typing cleanup exposed at the API boundary

- `ReactiveOrStatic` is now internal-only and should not be imported from the public package surface

---

## Other changes

### Documentation

- root and package README files were updated to better separate Angular-native Signal Forms behavior from toolkit-specific behavior
- examples now prefer current patterns such as deterministic field IDs and `appearance="outline"`

### Dependencies and workspace

- Angular dependencies were updated on `main`
- lockfile and formatting changes landed after `beta.6`

---

## Notes

This file describes the current unreleased state of `main`.

When the next prerelease is cut, this content should be folded into the corresponding release changelog for that version.
