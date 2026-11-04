---
name: ngrx-toolkit
description: 'NgRx Toolkit integration and migration: withResource, withEntityResources, withMutations, devtools, persistence, reset/history, and other Toolkit extensions. Use for new SignalStore reads/writes when Toolkit is installed, or when adopting @ngrx-toolkit/core.'
---

# NgRx Toolkit

## Workflow

1. Read the target application's dependency declarations, lockfile, and [version gates](../ngrx-signals/references/testing-and-version-gates.md). In a monorepo, inspect the owning workspace package and its dependency resolution, not the skill directory. Establish whether Toolkit is installed, its compatible Angular/NgRx versions, and which package owns each proposed import. With no project, state the reference baseline as an assumption rather than claiming Toolkit is installed.
2. Apply the selection policy below. Finish with a read/write design that fits the task and the project's dependencies.
3. Read only the matching references. Check current APIs through Context7; use installed declarations and the [tagged audit](references/toolkit-v22-audit.md) when indexed examples disagree. Treat audit findings as version-specific evidence.
4. Implement the changed transitions with explicit concurrency, error handling, and success reconciliation. For each selected extension, follow its reference's lifecycle and generated-member contracts.
5. Run the affected type checks and transition tests. Report executed checks separately from proposed checks or source review.

## Selection policy

For new SignalStore-backed reads and writes, prefer compatible, installed Toolkit adapters over hand-written integration. This is this skill's default, not an upstream requirement. Honor explicit user scope and target-project instructions. Preserve an existing working RxJS, entity, or native-resource design unless the task calls for migration. Toolkit composes with native `signalStore`, `withState`, and `withComputed`; it does not replace them.

| Task                                                                    | Preferred choice with Toolkit installed                                                                          |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Expose an Angular resource as store state and status                    | `withResource`, singular; accepts one resource or a named dictionary                                             |
| Expose a resource-backed array with id lookups                          | `withEntityResources`; a plain rendered list only needs `withResource`                                           |
| Execute backend commands with store status                              | `withMutations` with `httpMutation` for HTTP or `rxMutation` for an Observable operation                         |
| Add persistence, history, devtools, or another cross-cutting capability | Select the matching extension from the [catalog](references/toolkit-extensions.md) before building an equivalent |

Skill availability is not package availability. If Toolkit is absent, keep native Angular/NgRx APIs unless the user requests adoption. If versions conflict, choose supported native APIs or plan an explicit dependency upgrade before introducing Toolkit imports.

Keep component-local resources local when store integration adds no value. Native NgRx `extendResource` policies remain appropriate for loading/error behavior, even with Toolkit installed. For a core-only task, stay with native APIs. When both layers are used, follow their [policy interaction](../ngrx-signals/references/resource-extensions.md#combining-with-toolkit).

## Reference router

The Toolkit-only extension catalog and audit live locally in `references/`. Cross-library references remain in the sibling `ngrx-signals/references/` directory, with one authoritative copy of each reference. Read the target reference directly rather than restarting the other skill's workflow. For external installation, publication, or missing sibling references, read the [paired distribution guide](references/distribution.md). If the companion is absent, report the incomplete installation; continue only with available, verified guidance rather than guessing missing contracts.

| Branch                                                                                                        | Read                                                                                                                                                                                                            |
| ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Resource adapters, generated members, snapshots, narrowing, mutation outcomes, concurrency, or reconciliation | [Resources and mutations](../ngrx-signals/references/resources-and-mutations.md)                                                                                                                                |
| Package rename, peer compatibility, deprecated APIs, or a version upgrade                                     | [Version gates](../ngrx-signals/references/testing-and-version-gates.md); consult the [audit](references/toolkit-v22-audit.md#migration-and-replacement-guidance) for replacement details                       |
| Devtools, storage/SSR, reset, undo/redo, immutable state, call state, or data services                        | [Extension catalog](references/toolkit-extensions.md)                                                                                                                                                           |
| Conditional implementations or replacing `withFeatureFactory`                                                 | [Custom features](../ngrx-signals/references/custom-features.md)                                                                                                                                                |
| Store feature order, state ownership boundaries, or reactive method cleanup                                   | [Store and reactivity](../ngrx-signals/references/store-and-reactivity.md)                                                                                                                                      |
| Signal Forms or a failed save that must appear on a form                                                      | [Forms bridge](../ngrx-signals/references/signal-forms-bridge.md)                                                                                                                                               |
| Generated request/response schemas or form-to-request mapping                                                 | [Contracts](../ngrx-signals/references/contracts.md)                                                                                                                                                            |
| A focused search, detail editor, or save flow                                                                 | [Recipes](../ngrx-signals/references/recipes.md)                                                                                                                                                                |
| Search, selection, lookups, and an editor combined                                                            | [Combined recipe](../ngrx-signals/references/recipes-combined.md)                                                                                                                                               |
| A save response racing newer edits or selection                                                               | [Captured-command and response guards](../ngrx-signals/references/recipes-combined.md#store-search-selection-lookup-data-draft-and-submit-save); adapt that section without adding the recipe's unrelated flows |
| Native Events coordination or replacing `withRedux`                                                           | [Events](../ngrx-signals/references/events-and-coordination.md)                                                                                                                                                 |
| Native NgRx loading/error policies or scoped resource defaults                                                | [Resource extensions](../ngrx-signals/references/resource-extensions.md)                                                                                                                                        |

## Completion criteria

Each changed operation has a supported import, an owner, a visible failure path, and tests for its changed transitions. For mutations, verify success, error, and aborted outcomes against the resource/mutation reference. For storage, reset, or history, verify the lifecycle behavior requested by the task. For advice without executable code, name the required checks and explicitly mark them unrun.
