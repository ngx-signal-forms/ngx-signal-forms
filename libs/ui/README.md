# ui-helm

Spartan's `@spartan-ng/helm` UI components, scaffolded into the workspace
via the Spartan CLI (`nx g @spartan-ng/cli:ui …`). Spartan ships with a
copy-the-source distribution model (à la shadcn/ui): the helm components
are installed _into_ your repo so you own them and can theme them
locally. The files under `libs/ui/{checkbox,icon,input,label,select,utils}`
are the output of that CLI step — not custom reimplementations.

## Upstream fidelity is the default

We keep these files **identical to the Spartan CLI output**. Two reasons:

- The CLI is the supported way to refresh helm. Local divergences turn
  every regenerate into a manual merge.
- `apps/demo-spartan` — the consumer of this lib — only needs the
  CLI's stock surface to make its toolkit-integration point.

PR review suggestions that target `libs/ui/*` are typically declined for
this reason, even when they identify real issues — fixes belong upstream
in `@spartan-ng/ui`, then come back through `nx g @spartan-ng/cli:ui …`.

## Consumed in-tree only

This library is not built or published. Apps consume it through the
`@spartan-ng/helm/*` tsconfig path aliases declared in
`tsconfig.base.json`, which point directly at each secondary
entrypoint's `src/index.ts`. The build target, `package.json`
peerDependencies, and `ng-package.json` files are leftover Spartan-CLI
scaffolding for a hypothetical future publish path; if/when the lib
becomes a real package, the executor (`@nx/angular:ng-packagr-lite` →
`@nx/angular:package`) and peerDeps need to be revisited at that point.
