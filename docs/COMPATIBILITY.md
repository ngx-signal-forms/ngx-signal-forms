---
title: 'Compatibility'
---

This document describes the compatibility contract for
`@ngx-signal-forms/toolkit`.

Per-version changes ship as [GitHub Releases](https://github.com/ngx-signal-forms/ngx-signal-forms/releases) — the project keeps no separate `CHANGELOG.md`.

## Current package contract

- Package: `@ngx-signal-forms/toolkit`
- Current peer dependencies:
  - `@angular/common >=22.0.0 <23.0.0`
  - `@angular/core >=22.0.0 <23.0.0`
  - `@angular/forms >=22.0.0 <23.0.0`
  - `axe-core >=4.13.0 <5` (optional)
  - `vest >=6.3.0 <7.0.0` (optional)

## Angular compatibility

| Toolkit line | Angular range      | Status    | Notes                                                   |
| ------------ | ------------------ | --------- | ------------------------------------------------------- |
| `1.x`        | `>=22.0.0 <23.0.0` | Supported | Current peer dependency range for the published package |

The `<23.0.0` ceiling is intentional. Even though Signal Forms is stable within
Angular 22, a new Angular **major** can still reshape the Signal Forms API, so the
toolkit validates each major before republishing rather than allowing it silently
through an open peer range.

## Angular Signal Forms status

Angular Signal Forms is **stable** as of Angular 22 — its core symbols carry
`@publicApi 22.0` and follow Angular's normal semver guarantees within the major.
(You may still see it called "experimental"; that reflected its pre-v22 preview,
not the shipped v22 API — `form()`, validators, `markAsTouched()`, `submit()` —
that the toolkit builds on.)

That means:

- Within `>=22.0.0 <23.0.0`, the upstream Signal Forms API is semver-protected;
  the toolkit relies on stable APIs such as `markAsTouched()` and `submit()`.
- A new Angular **major** can still change Signal Forms; toolkit releases treat
  such changes as compatibility constraints, even when the toolkit's own public
  API does not change.
- Consumers should run their own validation suite before adopting a new Angular
  **major**, but routine minors within v22 follow standard Angular stability
  expectations.

## Vest compatibility

The Vest adapter is optional and only required when importing
`@ngx-signal-forms/toolkit/vest`.

| Vest version     | Status      | Notes                                                                                                                                                                                                                                                              |
| ---------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `<6.3.0`         | Unsupported | `vest` imports named exports from `vest-utils`/`vestjs-runtime` that later releases inside `vest`'s own declared dependency range removed (for example `vest-utils@2.0.17` drops the `tinyState` export `vest` `6.1.x`/`6.2.x` import); the package fails to load. |
| `>=6.3.0 <7.0.0` | Supported   | Standard Schema-compatible. Floor raised from `6.0.0` in #515; see the [rc.16 migration guide](migrations/v1.0.0-rc.16.md).                                                                                                                                        |
| `>=7.0.0`        | Unsupported | Not yet validated; capped out of range.                                                                                                                                                                                                                            |

## Axe-core compatibility

The axe-core integration is optional and only required when importing
`@ngx-signal-forms/toolkit/testing`, which relies on the `wcag22aa` tag.

| axe-core version | Status      | Notes                                                                                                                                                                                                      |
| ---------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<4.13.0`        | Unsupported | Flags the toolkit's own a11y spec fixtures (for example `aria-prohibited-attr` for `aria-labelledby` on a role-less host); `4.13.0` is the first version that passes the toolkit's browser suite outright. |
| `>=4.13.0 <5`    | Supported   | Floor raised from `4.5.0` in #515; see the [rc.16 migration guide](migrations/v1.0.0-rc.16.md).                                                                                                            |
| `>=5.0.0`        | Unsupported | Not yet validated; capped out of range.                                                                                                                                                                    |

## Runtime and tooling baseline

The toolkit's `engines.node` matches the Angular 22 toolchain used in this repo:
`^22.22.3 || ^24.15.0 || >=26.0.0` (mirrors `@angular/core@22`'s own `engines`
field). Consumers should use an active LTS Node version compatible with
Angular 22 and their package manager/tooling stack.

The repository currently validates and publishes with the following Node
version:

| Use case               | Version used in automation                                           |
| ---------------------- | -------------------------------------------------------------------- |
| CI + Publish workflows | Node, from [`.node-version`](../.node-version) (currently `24.18.0`) |

## Compatibility matrix

A scheduled workflow (`.github/workflows/compat-matrix.yml`) tests the
toolkit against the lowest and highest version of each declared Node,
Angular and peer-dependency range, in 10 cells. It runs weekly, on
`workflow_dispatch`, and on pull requests that change `packages/toolkit/**`,
the root `package.json`, `pnpm-workspace.yaml`,
`tools/scripts/compat-matrix-override.mjs`, or the workflow itself. Each
cell that needs a non-default package version resolves it (an exact floor,
or the highest version in a declared range, via `npm view`) and writes it
into `pnpm-workspace.yaml`'s `overrides` map for that job only, using
[`compat-matrix-override.mjs`](../tools/scripts/compat-matrix-override.mjs),
then runs `toolkit:test` and `toolkit:test-browser`. Nothing is committed
back to the repository.

| Dimension | Versions tested                                                                  |
| --------- | -------------------------------------------------------------------------------- |
| Node      | `22.22.3`, `24.15.0`, `26.0.0` (each declared `engines` floor), `26.x` (current) |
| Angular   | `22.0.0` (declared floor), latest `22.x`                                         |
| axe-core  | `4.13.0` (declared floor), latest `<5`                                           |
| vest      | `6.3.0` (declared floor), latest `<7.0.0`                                        |

## Browser support

The toolkit targets the **last 2 major versions of the four main evergreen browsers**, matching Angular's own browser support policy. This is codified in [`.browserslistrc`](../.browserslistrc) at the repo root and consumed by ng-packagr (autoprefixer) during library builds.

| Browser | Support policy  | Runtime minimum for full visual fidelity     |
| ------- | --------------- | -------------------------------------------- |
| Chrome  | Last 2 versions | 123+ (`light-dark()` landed in Chrome 123)   |
| Edge    | Last 2 versions | 123+ (same Chromium engine as Chrome)        |
| Firefox | Last 2 versions | 121+ (`:has()` landed in Firefox 121)        |
| Safari  | Last 2 versions | 17.5+ (`light-dark()` landed in Safari 17.5) |

The **runtime minimum** is the oldest version where all CSS features used by the toolkit resolve correctly. Older evergreen builds may render a flattened approximation: default colors resolve as if unset without `light-dark()`, and nested selectors, hover/invalid overrides, and the outline appearance degrade. See the [theming guide](../packages/toolkit/form-field/THEMING.md#browser-support) for the per-feature breakdown.

The demo and end-to-end suite validate behavior through Playwright's Chromium project. Run `npx browserslist` in the repo root to see the current resolved browser list.
