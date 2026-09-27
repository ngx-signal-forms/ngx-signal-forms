# Package Architecture

> **Audience:** contributors and the architecture-curious. If you're choosing
> which entry point to import as a _user_ of the toolkit, start with the
> [toolkit README](../packages/toolkit/README.md#entry-points) instead — this
> document describes how the repository is organized, not how to pick an API.

This document combines two documentation views:

- **Explanation**: why the package is split into entry points.
- **Reference**: what exists and where.

---

## Explanation

### Architecture intent

The repository publishes one package, `@ngx-signal-forms/toolkit`, with
multiple public entry points. The split keeps adoption simple for most users
while preserving tree-shaking and opt-in advanced surfaces.

### Why one package with multiple entry points

1. **Single install path** for common usage (`npm install @ngx-signal-forms/toolkit`).
2. **Layered adoption** from core behavior to styled UI to headless primitives.
3. **No forced runtime coupling** for optional integrations (Vest).
4. **Bundle control** by importing only the entry points a consumer needs.

### Role of each entry point

See the [toolkit README's entry-point table](../packages/toolkit/README.md#entry-points)
for what each entry point is for and which one to pick — that table is the
single maintained copy.

### Internal boundary

`packages/toolkit/core` is intentionally **internal**. It powers public entry
points but is stripped from the published exports map. The practical
consequence for consumers: `import … from '@ngx-signal-forms/toolkit/core'`
fails to resolve against the published package, and anything reached that way
in a source checkout carries no stability guarantee — import from the
documented public entry points only.

---

## Reference

### Public entry points

- `@ngx-signal-forms/toolkit` — core directives, providers, utilities
- `@ngx-signal-forms/toolkit/assistive` — styled error/hint/counter/summary UI
- `@ngx-signal-forms/toolkit/form-field` — prebuilt wrapper + fieldset UI
- `@ngx-signal-forms/toolkit/headless` — renderless directives and utility functions
- `@ngx-signal-forms/toolkit/vest` — Vest helper adapters
- `@ngx-signal-forms/toolkit/testing` — axe-core a11y assertion helpers for consumer test suites

### Package layout

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
│   ├── generate-readme.mjs             # rewrites the root README's relative links for npm
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

Only the six public entry points above ship to npm. `core/` exists in source
but is not in the published exports map, and `docs/` (repo root) is not part
of the package at all.

Every entry point's README ships: ng-packagr's `copyAssets` copies each
entry's `README.md` into its own output folder, and
`packages/toolkit/api-reports/tarball-manifest.json` lists all six
(`README.md`, `assistive/README.md`, `form-field/README.md`,
`headless/README.md`, `testing/README.md`, `vest/README.md`). Only the root
one gets rewritten: `scripts/generate-readme.mjs` reads the **repo-root**
`README.md` (not `packages/toolkit/README.md`), rewrites its relative links
to absolute GitHub URLs pinned to the commit being published, and writes the
result to `dist/packages/toolkit/README.md` during `post-build`. The five
secondary READMEs ship as-is, with their relative links unrewritten — a link
to a repo-only file (e.g. `../../CONTEXT.md`) resolves on GitHub but not on
npm. See [issue #568](https://github.com/ngx-signal-forms/ngx-signal-forms/issues/568)
for the follow-up to rewrite them too.

### Import examples

```typescript
import { provideNgxSignalFormsConfig } from '@ngx-signal-forms/toolkit';
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';
import { NgxFormFieldError } from '@ngx-signal-forms/toolkit/assistive';
import { NgxHeadlessNotification } from '@ngx-signal-forms/toolkit/headless';
import { validateVest } from '@ngx-signal-forms/toolkit/vest';
```

### Dependency graph

```text
@angular/core (peer)
@angular/common (peer)
@angular/forms/signals (peer)
vest ^6 (optional peer for /vest)
axe-core (optional peer for /testing; range in package.json)
        ↓
@ngx-signal-forms/toolkit
├── root (core public API)
├── /assistive
├── /form-field
├── /headless
├── /vest
└── /testing
```

### Internal-only debugger

The [package manifest](../packages/toolkit/package.json) is the source of
truth for peer version ranges.

The form debugger is no longer part of the published toolkit package. It now
lives in `packages/demo/debugger` for internal/demo usage and is consumed via
`@ngx-signal-forms/debugger` path aliases inside this repository.

### Publishing notes

- Package follows semantic versioning once it reaches `1.0.0`. Today it is
  pre-1.0 (`1.0.0-rc.*`), and v1.0.0 has never shipped — every release to
  date is a release candidate, so an RC can still break (see ADR-0007's
  "Consequences" section for an example).
- `core/` remains internal even though it exists in source.
