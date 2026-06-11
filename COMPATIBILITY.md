# Compatibility

This document describes the compatibility contract for
`@ngx-signal-forms/toolkit`.

## Current package contract

- Package: `@ngx-signal-forms/toolkit`
- Current peer dependencies:
  - `@angular/core >=22.0.0 <23.0.0`
  - `@angular/forms >=22.0.0 <23.0.0`
  - `vest >=6.0.0 <6.3.0 || >=6.3.1` (optional)

## Angular compatibility

| Toolkit line | Angular range      | Status    | Notes                                                   |
| ------------ | ------------------ | --------- | ------------------------------------------------------- |
| `1.x`        | `>=22.0.0 <23.0.0` | Supported | Current peer dependency range for the published package |

The `<23.0.0` ceiling is intentional. Angular Signal Forms is still experimental
upstream, so major Angular releases may change the API in ways the toolkit must
validate before republishing, rather than being silently allowed via an open peer
range.

## Angular Signal Forms status

Angular currently marks Signal Forms as **experimental** upstream.

That means:

- Angular may still change the upstream Signal Forms API outside the normal
  stability expectations that apply to stable Angular APIs.
- Toolkit releases will treat upstream Angular Signal Forms changes as
  compatibility constraints, even when the toolkit's own public API does not
  change.
- Consumers should pin Angular upgrades carefully and run their own validation
  suite before adopting new Angular minors or majors.

## Vest compatibility

The Vest adapter is optional and only required when importing
`@ngx-signal-forms/toolkit/vest`.

| Vest version    | Status        | Notes                                           |
| --------------- | ------------- | ----------------------------------------------- |
| `6.0.0 - 6.2.x` | Supported     | Standard Schema-compatible                      |
| `6.3.0`         | Not supported | Excluded because of an upstream packaging issue |
| `>=6.3.1`       | Supported     | Supported by the current peer range             |

## Runtime and tooling baseline

The toolkit's `engines.node` matches the Angular 22 toolchain used in this repo:
`^20.19.0 || ^22.12.0 || >=24.0.0`. Consumers should use an active LTS Node
version compatible with Angular 22 and their package manager/tooling stack.

The repository currently validates and publishes with the following Node
versions:

| Use case         | Version used in automation |
| ---------------- | -------------------------- |
| CI workflow      | Node 22 (maintenance LTS)  |
| Publish workflow | Node 24 (active LTS)       |

## Browser support

The toolkit targets the **last 2 major versions of the four main evergreen browsers**, matching Angular's own browser support policy. This is codified in [`.browserslistrc`](./.browserslistrc) at the repo root and consumed by ng-packagr (autoprefixer) during library builds.

| Browser | Support policy  | Runtime minimum for full visual fidelity    |
| ------- | --------------- | ------------------------------------------- |
| Chrome  | Last 2 versions | 112+ (CSS nesting, `color-mix()`, `:has()`) |
| Edge    | Last 2 versions | 112+ (same Chromium engine as Chrome)       |
| Firefox | Last 2 versions | 121+ (`:has()` landed in Firefox 121)       |
| Safari  | Last 2 versions | 16.5+ (CSS nesting landed in Safari 16.5)   |

The **runtime minimum** is the oldest version where all CSS features used by the toolkit resolve correctly. Older evergreen builds may render a flattened approximation (design tokens still resolve; nested selectors, hover/invalid overrides, and the outline appearance degrade). See the [theming guide](./packages/toolkit/form-field/THEMING.md#browser-support) for the per-feature breakdown.

The demo and end-to-end suite validate behavior through Playwright's Chromium project. Run `npx browserslist` in the repo root to see the current resolved browser list.
