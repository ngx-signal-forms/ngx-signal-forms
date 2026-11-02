# Eval results

## Correctness and portability recheck: 2026-09-08

- Rechecked APIs through three Context7 queries covering Toolkit, NgRx resource extensions, and Angular linked signals, then primary guides and Toolkit `v22.0.1` source. Corrected named mutation error declaration/runtime differences, the observed-value cache's first-error/loading risks, source snapshot claims, and synchronous request-factory failure guidance.
- Updated recipes to validate request bodies before mutation invocation. The combined editor now keeps a stable session baseline, advances it on successful saves while retaining newer edits, and refuses dirty selection changes without confirmation. Scoped Toolkit-specific rules so native forms and existing RxJS flows remain valid. Replaced the debounce test's incorrect immediate HTTP expectation with a synchronous boundary fixture and separate timer guidance.
- The API/design evaluation set now contains 18 scenarios. All 26 definitions across both skills parsed and passed required-field/unique-id checks. The final structural pass covered 17 Markdown files, 89 local links and anchors, code fences, and both frontmatters. A separate uniqueness check confirmed catalog/audit ownership. All checked links stay within the paired bundle.
- The [Toolkit results](../../ngrx-toolkit/evals/RESULTS.md) record eight passing routing desk-review scenarios. This did not exercise automatic discovery in an external host or run full application generation.
- Editor diagnostics reported no errors. Recipe edits received extracted logic/structural checks, not Angular compilation or runtime tests. No current application dependencies were installed. Concrete Toolkit entity typing, request-factory exception settlement, concurrency, and editor resource transitions still need target-project tests. Publication licensing and packaged-artifact testing remain uncompleted release prerequisites.

## v22 documentation update: 2026-09-08

The evaluation set now contains 15 scenarios. The six additions cover native resource extensions, dynamic deep signals and feature contracts, aligned v22 migration, Toolkit generated members, save races, and storage/history/devtools. Existing assertions now permit native resource integration and imperative methods where Toolkit or reactive methods are unnecessary.

Checks performed in this update:

- Context7 queries for NgRx and Toolkit, followed by primary guides and tagged source where the index lagged. Version gates record the targets and source discrepancies.
- JSON parsing, unique ids and required fields for all 15 scenarios.
- Markdown fence balance and local file-link checks across all 14 Markdown files.
- Editor diagnostics: none reported.
- A fresh-agent desk review of scenarios 10–15 and manual review of its findings. This checked guidance coverage, not generated solutions or runtime behavior. Some findings incorrectly rejected documented signal-object narrowing or overlooked existing snapshot/save guards; those were rejected. The useful routing gap was closed by linking concurrency guidance to the captured-command example.

No application dependencies were installed, no current snippets were compiled, and no runtime tests or full 15-prompt generation run were performed. Several recipes deliberately reference application-specific contracts and services. The source audit is not a substitute for compiling them in their target project. Full generation, type checks, and runtime tests remain required before claiming a current pass rate.

## Historical runs: before the v22 update

The following records describe two earlier iterations against the original nine prompts, each with a fresh agent told to report friction and API doubts. Their architecture scores do not validate the v22 revision above.

## Iteration 2 (after the API-verification pass)

**9/9 produced the architecture the expected output describes.** No agent invented a wrong design. Every finding was trust or completeness.

Recurring, in frequency order:

| Finding                                                                                | Agents | Outcome                               |
| -------------------------------------------------------------------------------------- | ------ | ------------------------------------- |
| `@Service()` distrusted as non-existent; two would have reverted it to `@Injectable()` | 5      | Version-gate row asserting it is real |
| Workflow step 1 unsatisfiable with no `package.json`                                   | 5      | Explicit no-project fallback          |
| `toSubmitResult` / `toPatchTicketRequest` called but never given a home                | 2      | Named file locations                  |
| Owner table said `signalMethod` writes state; reducers write directly                  | 1      | Reducer added as a writer             |

That iteration treated snake_case field mapping as a silent failure. This historical claim is superseded by the later adapter review; use the current contract guidance and verify actual form paths. Other findings were missing array-row guidance, `submit()`'s boolean contract, and two contradictions between files the router opens together.

## Iteration 3 (after those fixes)

`@Service()` doubt measurably softened — from "almost certainly `@Injectable()`" to "followed the skill, would verify before shipping", with the Angular 21 fallback stated correctly. The gate worked.

New defects found, several **introduced by iteration 2's own fixes**:

- A constraint on `EntityState` silently fails for named collections (`withEntities({ collection })` produces `NamedEntityState`). Verified by compiling; documented with two ways out.
- The canonical mutation example swallowed an error with `console.error` while the same file's checklist forbade it.
- `toDomain` was called twice and defined never, and could not work at the shown arity.
- A save with no form had no error path — `toSubmitResult` returns `TreeValidationResult`.
- The abort message contradicted the abort mechanism added in the same iteration.
- The line-items example hand-wrote rules that the new "do not duplicate contract rules" section forbade.
- The router had no cell for `exhaustOp`, `aborted`, double-click, or concurrency.
- 11 test items with zero worked examples; three agents guessed the effect-flush API. It is `TestBed.tick()`.

## What is deliberately not absorbed

Friction that is not this skill's job, and would trade focus for bulk:

- TestBed mechanics beyond the flush, and template-binding basics — general Angular knowledge.
- "No package was installed so I could not check the `.d.ts`" — an artifact of running evals with no project, not a defect.

## Historical method

The earlier record reports checks against `@angular/core@22.1.0`, `@angular/forms@22.1.0`, `@ngrx/signals@21.1.1`, and `@angular-architects/ngrx-toolkit@21.0.1`, including compilation of patterns. It rejected a claim that a feature generic resolved to `unknown` and removed an unnecessary `?? ""` on a debounced string. That nullability result applies to the string input used there: `debounced<T>` adds no undefined, but T can itself include undefined. These old checks were not rerun as part of the current source audit.

Run all current scenarios after a substantial revision, recording generated-output review, compilation, and runtime results separately.
