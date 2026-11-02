# Toolkit skill validation

## Correctness and external-project recheck, 2026-09-08

An independent agent read both entry points and the relevant references, then answered all eight routing prompts. All assertions passed in this desk review. The original five decisions below still hold; the additional cases produced these decisions:

| Scenario                                               | Observed decision                                                                                                                                                    |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Paired installation in an external monorepo            | Check the consuming application's resolved dependencies, prefer Toolkit read/write adapters, and retain native SignalStore composition                               |
| Only Toolkit skill installed, npm package present      | Report the missing Signals companion and incomplete references, not a missing npm dependency; require host access and licensing/provenance checks before publication |
| Toolkit installed but explicit core-only project scope | Honor project scope, use native command contracts, and introduce no Toolkit imports                                                                                  |

The [distribution guide](../references/distribution.md) now defines the paired installation contract and release checks. Automatic invocation is not guaranteed. This was a routing desk review using the local files, not a test of discovery in a freshly installed external host.

Current source review corrected mutation error types, previous-value caching, snapshot assumptions, and request-factory failure guidance. The final cross-skill structural check passed for 17 Markdown files, 89 local links and anchors, both frontmatters, balanced fences, and all 26 evaluation definitions. A separate uniqueness check confirmed reference ownership. Editor diagnostics reported no errors. These checks do not certify Angular compilation, Toolkit runtime behavior, or all generated code. Publication licensing and testing an unpacked release artifact remain pending.

Checked 2026-09-08 after creating the sibling skill and the `ngrx-signals` handoff.

## Routing desk review

A fresh agent read both entry points, answered the five evaluation prompts with implementation decisions, and read the named reference targets. This was a routing review, not generated application code.

| Scenario                               | Observed decision                                                                                                         |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Compatible Toolkit installed           | Preferred `withResource`, `withEntityResources`, and `withMutations` for their respective roles                           |
| Skill present, package absent          | Kept the core-only design without adding Toolkit                                                                          |
| Working RxJS and component-local flows | Preserved those flows for the scoped error fix                                                                            |
| Toolkit adoption on v21                | Checked compatibility, corrected `withResources` to `withResource`, and required a compatible package or explicit upgrade |
| Direct lifecycle-extension task        | Reached shared version/catalog references without restarting the Signals workflow                                         |

The review found that narrow save-race tasks needed a section-level pointer. The final router links directly to the captured-command guards. Core-only reads also route directly to native integration and resource policies rather than Toolkit-heavy recipes.

## Checks and limits

- Context7 confirmed adapter names, roles, and the v22 package name. Existing tagged-source guidance remains authoritative for documented discrepancies.
- Manual file review checked both skill frontmatters, the five evaluation definitions, and the edited sibling links. Editor diagnostics reported no errors.
- Shared reference targets were read during the desk review. At that time, all reference guidance lived under `ngrx-signals/references`. The relocation status below records the later ownership change; the sibling skills must still be kept together.
- The scripted structural check was blocked before execution. It is not recorded as passed.
- No compiler, runtime, or full generated-code evaluation ran. The existing fifteen API scenarios remain in `ngrx-signals/evals/evals.json`; these five scenarios test selection and routing rather than duplicate them.

## Reference relocation, 2026-09-08

- Added the Toolkit catalog and audit under `ngrx-toolkit/references/`, normalized their skill pointers, and updated the catalog's cross-library links. Updated the five Signals incoming links and Toolkit's four catalog/audit links, preserving anchors. Cross-library references remain under `ngrx-signals/references/`.
- Read the affected files and manually reviewed the pointer and ownership changes. System `grep` searched both directories for catalog/audit references and location claims.
- SHA-256 checks confirmed that both destination files match the original content after only the intended pointer and ownership changes. The same check confirmed that untouched documentation and evaluation files, including historical NgRx results, match their baselines. Editor diagnostics reported no errors before this results update.
- After renewed user approval, the editor deleted both originals from `ngrx-signals/references/`. Directory listings and a uniqueness assertion confirmed that only the Toolkit-owned copies remain. The relocation is complete.
- The final read-only structural check passed across both skills: 16 Markdown files with valid local links, anchors, and fences; both skill frontmatters; and all 20 evaluation definitions. Earlier attempts were blocked or stopped before completion; this successful run supersedes those incomplete checks. No API research, compiler, runtime, or generated-code evaluation ran for this relocation.
