# Contributing

This document captures workspace-level conventions every contributor (and AI
agent) must follow when changing project layout, adding apps, or wiring CI.
For code-level conventions, see [`AGENTS.md`](../AGENTS.md), the per-package
READMEs, and ADRs in [`docs/decisions/`](./decisions).

## Project tags & module boundaries

Every Nx project declares a `tags` array in its `project.json`. Tags drive the
`@nx/enforce-module-boundaries` lint rule defined in
[`oxlint.config.ts`](../oxlint.config.ts) and protect the published toolkit
bundle from accidental contamination by demo-only code.

### Tag vocabulary

| Tag          | Meaning                                                |
| ------------ | ------------------------------------------------------ |
| `scope:lib`  | Publishable library code. Toolkit and any future libs. |
| `scope:demo` | Demo apps and demo-only support libs.                  |
| `type:lib`   | Library project (`projectType: "library"`).            |
| `type:app`   | Application project (`projectType: "application"`).    |

Each project carries one `scope:*` tag and one `type:*` tag.

### Constraints

- `scope:lib` may only depend on other `scope:lib` projects.
- `scope:demo` may depend on both `scope:lib` and `scope:demo` projects.
- `type:lib` may only depend on other `type:lib` projects.
- `type:app` may depend on both `type:lib` and `type:app` projects.

The constraint that bites hardest:

> **`scope:lib` cannot depend on `scope:demo`.** A demo import inside the
> toolkit fails lint, which fails CI. This guardrail exists because the
> reference demo apps (Material, PrimeNG, Spartan — see #40) will pull in
> design-system packages the toolkit must never ship with.

### Adding a new project

1. Create the project (Nx generator or manual).
2. Edit its `project.json` and add the appropriate `scope:*` + `type:*` tags.
3. Run `pnpm nx run-many -t lint` to confirm boundaries hold.

## Demo app budgets

> **The toolkit's own size budget lives in `packages/toolkit/ng-package.json`
> and `packages/toolkit/tsconfig.lib.prod.json`. Do not change it when adding
> a demo app.** Each demo app gets its own `budgets` block.

When adding a new demo app under `apps/demo-*` (e.g. `apps/demo-material`,
`apps/demo-primeng`, `apps/demo-spartan` per #40), declare its budgets in the
app's own configuration so the demo's design-system bundle size doesn't
distort the toolkit's perf signal. Use this template inside the app's build
target configuration in `apps/demo-<name>/project.json`:

```jsonc
{
  "targets": {
    "build": {
      "configurations": {
        "production": {
          // ...other production options...
          "budgets": [
            {
              "type": "initial",
              "maximumWarning": "1mb",
              "maximumError": "2mb",
            },
            {
              "type": "anyComponentStyle",
              "maximumWarning": "8kb",
              "maximumError": "16kb",
            },
          ],
        },
      },
    },
  },
}
```

Tune the thresholds per design system. Material apps will run hotter than
Spartan apps; that's expected. Set the warning at the steady-state size and
the error 30-50% higher to leave room for new examples.

## Toolkit isolation guarantees

Two CI mechanisms keep the toolkit publishable and design-system-free:

1. **Static check** — `pnpm check:toolkit-peer-deps` (script at
   [`tools/scripts/check-toolkit-peer-deps.mjs`](../tools/scripts/check-toolkit-peer-deps.mjs))
   asserts `packages/toolkit/package.json` declares no `@angular/material`,
   `primeng`, `primeicons`, or `@spartan-ng/*` entries in `dependencies` or
   `peerDependencies`.
2. **Pruned build** — the `toolkit-isolation` job in
   [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) runs
   `pnpm install --frozen-lockfile --filter "@ngx-signal-forms/toolkit..."`
   followed by `pnpm nx build toolkit`. The filter excludes demo apps from
   the install graph, so even if a demo declares a design-system dep, the
   toolkit build proves it can compile without that dep present.

If either check fails, the right fix is almost never to relax the check —
move the offending dep into the demo app that needs it.
