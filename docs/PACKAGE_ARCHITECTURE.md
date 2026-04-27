# Package Architecture

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
3. **No forced runtime coupling** for optional integrations (Vest, debugger).
4. **Bundle control** by importing only the entry points a consumer needs.

### Role of each entry point

- `@ngx-signal-forms/toolkit` — core directives, providers, and utilities.
- `@ngx-signal-forms/toolkit/assistive` — styled feedback components.
- `@ngx-signal-forms/toolkit/form-field` — wrapper + fieldset components.
- `@ngx-signal-forms/toolkit/headless` — renderless state primitives.
- `@ngx-signal-forms/toolkit/vest` — optional Vest convenience helpers.
- `@ngx-signal-forms/toolkit/debugger` — development inspection UI.

### Internal boundary

`packages/toolkit/core` is intentionally **internal**. It powers public entry
points but is stripped from the published exports map; consumers should import
from documented public entry points only.

---

## Reference

### Public entry points

- `@ngx-signal-forms/toolkit` — core directives, providers, utilities
- `@ngx-signal-forms/toolkit/assistive` — styled error/notification/hint/counter/summary UI
- `@ngx-signal-forms/toolkit/form-field` — prebuilt wrapper + fieldset UI
- `@ngx-signal-forms/toolkit/headless` — renderless directives and utility functions
- `@ngx-signal-forms/toolkit/vest` — Vest helper adapters
- `@ngx-signal-forms/toolkit/debugger` — dev-only form inspector components

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
│   ├── assistive-row.ts
│   ├── character-count.ts
│   ├── form-field-error.ts
│   ├── form-field-notification.ts
│   ├── form-field-error-summary.ts
│   ├── hint.ts
│   ├── warning-error.ts
│   └── index.ts
├── form-field/
│   ├── form-field-wrapper.ts
│   ├── form-fieldset.ts
│   └── index.ts
├── headless/
│   ├── src/
│   │   ├── index.ts
│   │   └── lib/
│   │       ├── error-state.ts
│   │       ├── error-summary.ts
│   │       ├── notification.ts
│   │       ├── character-count.ts
│   │       ├── fieldset.ts
│   │       ├── field-name.ts
│   │       └── utilities.ts
│   ├── ng-package.json
│   └── README.md
├── vest/
│   ├── src/
│   │   ├── index.ts
│   │   └── validate-vest.ts
│   ├── ng-package.json
│   └── README.md
├── debugger/
│   ├── signal-form-debugger.ts
│   ├── debugger-badge.ts
│   ├── index.ts
│   └── ng-package.json
├── index.ts
├── README.md
└── package.json
```

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
├── /vest
└── /debugger
```

### Publishing notes

- Package follows semantic versioning.
- Breaking changes are released in major versions.
- `core/` remains internal even though it exists in source.
