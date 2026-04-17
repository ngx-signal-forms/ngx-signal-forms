# Compatibility

This document describes the compatibility contract for
`@ngx-signal-forms/toolkit`.

## Current package contract

- Package: `@ngx-signal-forms/toolkit`
- Current peer dependencies:
  - `@angular/core >=21.2.0 <22.0.0`
  - `@angular/forms >=21.2.0 <22.0.0`
  - `vest >=6.0.0 <6.3.0 || >=6.3.1` (optional)

## Angular compatibility

| Toolkit line | Angular range      | Status    | Notes                                                          |
| ------------ | ------------------ | --------- | -------------------------------------------------------------- |
| `1.x`        | `>=21.2.0 <22.0.0` | Supported | Current peer dependency range; Angular 22 support ships in 2.x |

The `<22.0.0` ceiling is intentional. Angular Signal Forms is still experimental
upstream, so major Angular releases may change the API in ways the toolkit must
validate before republishing. Angular 22 compatibility will ship in a future
toolkit line once validated, rather than being silently allowed via an open peer
range.

## Angular Signal Forms status

Angular currently marks Signal Forms as **experimental** in Angular 21.x.

That means:

- Angular may still change the upstream Signal Forms API outside the normal
  stability expectations that apply to stable Angular APIs.
- Toolkit releases will treat upstream Angular Signal Forms changes as
  compatibility constraints, even when the toolkit's own public API does not
  change.
- Consumers should pin Angular upgrades carefully and run their own validation
  suite before adopting new Angular minors.

## Vest compatibility

The Vest adapter is optional and only required when importing
`@ngx-signal-forms/toolkit/vest`.

| Vest version    | Status        | Notes                                           |
| --------------- | ------------- | ----------------------------------------------- |
| `6.0.0 - 6.2.x` | Supported     | Standard Schema-compatible                      |
| `6.3.0`         | Not supported | Excluded because of an upstream packaging issue |
| `>=6.3.1`       | Supported     | Supported by the current peer range             |

## Runtime and tooling baseline

The toolkit's `engines.node` matches Angular 21's supported range:
`^20.19.0 || ^22.12.0 || >=24.0.0`. Consumers should use an active LTS Node
version compatible with Angular 21 and their package manager/tooling stack.

The repository currently validates and publishes with the following Node
versions:

| Use case         | Version used in automation |
| ---------------- | -------------------------- |
| CI workflow      | Node 22 (maintenance LTS)  |
| Publish workflow | Node 24 (active LTS)       |

## Browser expectations

The demo and end-to-end suite validate evergreen browser behavior through
Playwright's Chromium project. Consumers should align browser support with
Angular's current browser support guidance for Angular 21.
