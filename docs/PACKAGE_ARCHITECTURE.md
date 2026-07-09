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
- `@ngx-signal-forms/toolkit/assistive` — styled error/notification/hint/counter/summary UI
- `@ngx-signal-forms/toolkit/form-field` — prebuilt wrapper + fieldset UI
- `@ngx-signal-forms/toolkit/headless` — renderless directives and utility functions
- `@ngx-signal-forms/toolkit/vest` — Vest helper adapters
- `@ngx-signal-forms/toolkit/testing` — axe-core a11y assertion helpers for consumer test suites

### Package layout

```bash
packages/toolkit/
├── core/                               # Internal implementation (not public import path)
│   ├── directives/
│   ├── providers/
│   ├── utilities/
│   ├── tokens.ts
│   └── types.ts
├── assistive/
│   ├── character-count.ts
│   ├── form-field-error.ts
│   ├── form-field-error-summary.ts
│   ├── form-field-notification.ts
│   ├── form-marking-legend.ts
│   ├── hint.ts
│   ├── warning-error.ts
│   └── index.ts
├── form-field/
│   ├── form-field-wrapper.ts
│   ├── form-field.utils.ts
│   ├── form-fieldset.ts
│   └── index.ts
├── headless/
│   ├── src/
│   │   ├── index.ts
│   │   └── lib/
│   │       ├── character-count.ts
│   │       ├── create-error-message-signal.ts
│   │       ├── error-state.ts
│   │       ├── error-summary.ts
│   │       ├── field-name.ts
│   │       ├── field-optionality.ts
│   │       ├── fieldset.ts
│   │       ├── notification.ts
│   │       └── utilities.ts
│   ├── ng-package.json
│   └── README.md
├── vest/
│   ├── src/
│   │   ├── index.ts
│   │   ├── validate-vest.ts
│   │   └── vest-adapter.ts             # createVestAdapter() + VestSuiteAdapter contract
│   ├── ng-package.json
│   └── README.md
├── scripts/
│   └── strip-internal-exports.mjs      # post-build: hides /core from the exports map
├── testing/
│   ├── a11y.ts                         # axe-core a11y test helpers
│   ├── index.ts
│   └── ng-package.json                 # published secondary entry point (/testing)
├── index.ts
├── README.md
└── package.json
```

Only the six public entry points above ship to npm. `core/` exists in source
but is not in the published exports map, and `docs/` (repo root) is not part
of the package at all — which is why the package READMEs link to GitHub with
absolute URLs.

### Import examples

```typescript
import { provideNgxSignalFormsConfig } from '@ngx-signal-forms/toolkit';
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';
import { NgxFormFieldNotification } from '@ngx-signal-forms/toolkit/assistive';
import { NgxHeadlessNotification } from '@ngx-signal-forms/toolkit/headless';
import { validateVest } from '@ngx-signal-forms/toolkit/vest';
```

### Dependency graph

```text
@angular/core (peer)
@angular/forms/signals (peer)
vest ^6 (optional peer for /vest)
        ↓
@ngx-signal-forms/toolkit
├── root (core public API)
├── /assistive
├── /form-field
├── /headless
└── /vest
```

### Internal-only debugger

The form debugger is no longer part of the published toolkit package. It now
lives in `libs/debugger` for internal/demo usage and is consumed via
`@ngx-signal-forms/debugger` path aliases inside this repository.

### Publishing notes

- Package follows semantic versioning.
- Breaking changes are released in major versions.
- `core/` remains internal even though it exists in source.
