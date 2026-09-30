---
title: 'Package Architecture'
---

This is a maintainer document. It describes how the repository and the
published package are built. To choose an entry point as a user, read
[Choose your level](../README.md#choose-your-level) in the root README.

## Why one package with several entry points

The repository publishes one package, `@ngx-signal-forms/toolkit`, with six
entry points: the root, `/assistive`, `/form-field`, `/headless`, `/vest`, and
`/testing`.

1. **One install** for the common case.
2. **Layered adoption**, from the styled wrapper down to state-only directives.
3. **Optional integrations stay optional.** `vest` and `axe-core` are needed
   only by `/vest` and `/testing`.
4. **Bundle control.** An app pays only for the entry points it imports.

## Internal boundary

`packages/toolkit/core` is internal. The public entry points use it, but the
post-build step removes it from the published `exports` map. An import from
`@ngx-signal-forms/toolkit/core` does not resolve in the published package.

## Package layout

A curated overview, not an exhaustive listing — it groups files by role and
calls out the ones contributors ask about most. Run `find packages/toolkit`
for the full tree.

```bash
packages/toolkit/
├── core/                               # Internal implementation (not public import path)
│   ├── directives/
│   ├── providers/
│   ├── services/                       # Field identity, visibility, control-preset registries,
│   │                                   # submit-announcements.ts, control-visibility-signal.ts
│   ├── utilities/                      # Includes warning-error.ts (public helpers via root)
│   ├── feedback-tokens.css
│   ├── tokens.ts
│   └── types.ts
├── assistive/
│   ├── character-count.ts
│   ├── form-field-error.ts
│   ├── form-field-error-summary.ts
│   ├── form-marking-legend.ts
│   ├── hint.ts
│   ├── index.ts
│   └── README.md
├── form-field/
│   ├── utilities/                      # form-field-scoped helpers (resolve-union-input.ts)
│   ├── form-field-cluster-aria.ts      # ARIA wiring for radio/checkbox clusters
│   ├── form-field-dom-snapshot.ts      # reads the wrapper's rendered DOM once per render
│   ├── form-field-dom-sync.ts          # applies the snapshot to the wrapper's own signals
│   ├── form-field-wrapper.ts
│   ├── form-field.utils.ts
│   ├── form-fieldset.ts
│   ├── index.ts
│   └── README.md
├── headless/
│   ├── src/
│   │   ├── index.ts
│   │   └── lib/
│   │       ├── build-headless-context.ts
│   │       ├── character-count-types.ts
│   │       ├── character-count.ts
│   │       ├── create-error-message-signal.ts
│   │       ├── error-state.ts
│   │       ├── error-summary-utilities.ts
│   │       ├── error-summary.ts
│   │       ├── field-name.ts
│   │       ├── field-optionality.ts
│   │       ├── field-state-utilities.ts
│   │       ├── fieldset.ts
│   │       ├── notification.ts
│   │       └── utilities.ts
│   ├── ng-package.json
│   └── README.md
├── vest/
│   ├── src/
│   │   ├── index.ts
│   │   ├── validate-vest.ts
│   │   ├── vest-adapter.ts             # createVestAdapter() + VestSuiteAdapter contract
│   │   ├── vest-result-mapper.ts       # maps a Vest run result to ValidationError[]
│   │   └── vest-run-coordinator.ts     # cache, contention detection, FIFO queue, settlement (ADR-0009)
│   ├── ng-package.json
│   └── README.md
├── scripts/
│   ├── check-published-package.mjs     # guards the public API + tarball against api-reports/
│   ├── documentation-starter.mjs       # extracts the README's marked TypeScript starter so
│   │                                   # check-documentation-starter.mjs can typecheck it
│   ├── generate-readme.mjs             # rewrites the relative links of every shipped README for npm
│   ├── size-report.mjs                 # reports brotli bundle size per entry against budgets
│   ├── strip-internal-exports.mjs      # post-build: hides /core from the exports map
│   └── strip-internal-members.mjs      # post-build: strips @internal class/interface members
├── api-reports/                        # committed baseline .d.ts + tarball-manifest.json (#514)
├── testing/
│   ├── a11y.ts                         # axe-core a11y test helpers
│   ├── a11y-internal.ts                # internal-only defaults (e.g. incomplete: 'warn')
│   ├── index.ts
│   ├── ng-package.json                 # published secondary entry point (/testing)
│   └── README.md
├── index.ts
├── README.md
└── package.json
```

Only the six public entry points ship to npm. `core/` exists in source
but is not in the published exports map, and `docs/` (repo root) is not part
of the package at all.

Every entry point's README ships: ng-packagr's `copyAssets` copies each
entry's `README.md` into its own output folder, and
`packages/toolkit/api-reports/tarball-manifest.json` lists all six
(`README.md`, `assistive/README.md`, `form-field/README.md`,
`headless/README.md`, `testing/README.md`, `vest/README.md`).
`scripts/generate-readme.mjs` rewrites all six during `toolkit:build`. The
root one comes from the **repo-root** `README.md` (not
`packages/toolkit/README.md`). Each secondary one comes from its own source
folder, after ng-packagr has copied it. Relative links become absolute GitHub
URLs pinned to the commit being published. A link stays relative when its
target also ships in the package (for example `../form-field/README.md`), so
it resolves on npm too. Repo-only targets such as `../../../docs/TESTING.md`
or `../form-field/THEMING.md` get the absolute URL. The source READMEs keep
their relative links. `check-published-package.mjs` fails if any packed
README still links to a file that is not in the tarball.

## Dependency graph

```text
@angular/core (peer)
@angular/common (peer)
@angular/forms/signals (peer)
vest >=6.3.0 <7.0.0 (optional peer for /vest)
axe-core >=4.13.0 <5 (optional peer for /testing)
        ↓
@ngx-signal-forms/toolkit
├── root (core public API)
├── /assistive
├── /form-field
├── /headless
├── /vest
└── /testing
```

The [package manifest](../packages/toolkit/package.json) is the source of
truth for peer ranges.

## Internal-only debugger

The form debugger is not part of the published package. It lives in
`packages/demo/debugger`, and demo code imports it through the
`@ngx-signal-forms/debugger` path alias.

## Publishing notes

- The package follows semantic versioning from `1.0.0`. Releases before
  that are release candidates (`1.0.0-rc.*`), and an RC can still break.
- `core/` stays internal even though it exists in source.
- Release and publish steps are in [Contributing](./CONTRIBUTING.md#release).
