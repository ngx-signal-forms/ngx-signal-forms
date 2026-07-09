---
description: 'GitHub Copilot instructions for ngx-signal-forms'
applyTo: '**'
---

# ngx-signal-forms Copilot Instructions

## LLM Output

- Adhere to TypeScript strict mode and Angular 21+ standards.
- Do not make up code or APIs — use real libraries and check documentation (context7) if unsure.
- Be concise and to the point. Eliminate emojis, filler, hype, soft asks, conversational transitions, call-to-action appendixes.
- List unresolved questions or ambiguities at the end of your response, if any.
- Provide an implementation plan and request approval before large changes.

## Stack

- **Framework**: Angular 21.1+ — signals, standalone components, zoneless, `OnPush`. Use the `angular-developer` skill for Angular guidance.
- **Forms**: Angular Signal Forms (`@angular/forms/signals`) — see the `angular-developer` skill's `references/signal-forms.md` for the full API, pitfalls, and build-error recovery.
- **Forms enhancement**: `@ngx-signal-forms/toolkit` — use the `ngx-signal-forms` skill; rules in [ngx-signal-forms-toolkit.instructions.md](./instructions/ngx-signal-forms-toolkit.instructions.md).
- **Testing**: Vitest (unit, `vitest` skill), Playwright (E2E).
- **Styling**: Tailwind CSS 4.x. Prefer `:host{}` over wrapper divs; utility classes over inline styles.
- **A11y**: WCAG 2.2 AA — see [a11y.instructions.md](./instructions/a11y.instructions.md).
- **Commits**: Conventional Commits — see [commit.instructions.md](./instructions/commit.instructions.md).

## Repo-Specific Rules

- Use ES `#` private fields instead of TypeScript `private`.
- Kebab-case filenames, single quotes, no `any` (use `unknown`).
- No Reactive Forms (`FormBuilder`, `formControlName`) and no `FormsModule` — Signal Forms only.
- Toolkit forms: `<form [formRoot]="form">`; vanilla Signal Forms: `(submit)` handler with `preventDefault()` + `novalidate`.
- Style on state attributes (`[aria-invalid="true"]`), not `.ng-invalid` classes.
- Toolkit manages `aria-invalid`/`aria-required`/`aria-describedby` — never add them manually to managed controls.

## Project Structure

| Project                                          | Purpose                                         |
| ------------------------------------------------ | ----------------------------------------------- |
| `packages/toolkit`                               | The library (6 entry points, see toolkit rules) |
| `packages/demo-shared`                           | Shared demo utilities                           |
| `libs/debugger`, `libs/spartan`                  | Dev-only debugger UI, spartan helpers           |
| `apps/demo` (+`-e2e`)                            | Main demo app and E2E suite                     |
| `apps/demo-{material,primeng,spartan}` (+`-e2e`) | CSS-framework integration demos                 |

## Developer Commands

| Command                          | Description                         |
| -------------------------------- | ----------------------------------- |
| `pnpm nx test toolkit`           | Run toolkit unit tests              |
| `pnpm nx run toolkit:post-build` | Build publish-ready toolkit library |
| `pnpm nx serve demo`             | Start demo app (dev server)         |
| `pnpm nx e2e demo-e2e`           | Run E2E tests                       |
| `pnpm nx run-many -t test`       | Run all tests                       |
| `pnpm nx run-many -t lint`       | Lint all projects                   |

## Testing

- Prefer the `#runTests` tool in VS Code over terminal commands.
- E2E specs live in `apps/*-e2e/src/**` (not `tests/`); run via `pnpm nx e2e <project>-e2e`. Use role-based locators and web-first assertions.

### Snapshot Baselines

Committed snapshots are part of the test contract:

- Playwright aria snapshots: inline `toMatchAriaSnapshot` templates in specs
- Playwright screenshots: `apps/demo-e2e/src/__screenshots__/chromium/{darwin,linux}/**`

Update baselines intentionally in the same PR as the change; CI does not update them automatically. Use the `update-snapshots.yml` workflow to refresh baselines in CI (`playwright`, `vitest`, or `all`).
