# Toolkit rc.13 review

Date: 2026-09-03
Scope: `packages/toolkit` (`@ngx-signal-forms/toolkit` 1.0.0-rc.12 → rc.13)
Base commit: `ef670877` on `main`
Installed: Angular 22.1.3, TypeScript 6.0.2, vest 6.3.2, axe-core 4.13.0

Line numbers below are correct at the base commit. Treat them as dated evidence, not as the spec. The tickets are the spec.

## Verdict

| Question                | Answer                                                                                        |
| ----------------------- | --------------------------------------------------------------------------------------------- |
| Is the library correct? | Mostly. Four defects to fix before rc.13.                                                     |
| Are the docs correct?   | Largely. No removed API is presented as valid. Skill files hold examples that do not compile. |
| Ready for rc.13?        | After the four fixes. Packaging, `@internal` stripping and the release bump are correct.      |

## Tickets

| Issue | Title                                                                                  | Blocked by |
| ----- | -------------------------------------------------------------------------------------- | ---------- |
| #432  | Add a warning-visibility seam in core                                                  | none       |
| #433  | Vest: a superseded run must not leave a field pending forever                          | none       |
| #434  | `focusFirstInvalid()` must report success only when focus moved                        | none       |
| #435  | Hints inside one form-field wrapper must have unique ids                               | none       |
| #436  | Auto-ARIA keeps the host id as field name and preserves author describedby on the host | none       |
| #437  | Submit helpers follow Angular `submit()` semantics and return a result                 | none       |
| #438  | Toolkit hygiene: OnPush, SSR-safe DOM guards, and source cleanup                       | none       |
| #439  | Headless factories time warnings by the warning cascade                                | #432       |
| #440  | Standalone error component reads headless resolved errors                              | #432, #439 |
| #441  | Toolkit docs match the code for rc.13                                                  | #436, #439 |

Decisions taken when the tickets were cut: fix the warning cascade in code rather than amend ADR-0007; revert the auto-ARIA field-name source to the host id.

## Baseline

Command: `pnpm nx run-many -t lint test build post-build -p toolkit`. Browser specs were not run in this pass.

| Check                    | Result          | Note                                                                                                                                          |
| ------------------------ | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| oxlint (type-aware)      | pass            | 843 warning lines, all in spec files                                                                                                          |
| Vitest jsdom             | pass            | 84 files, 1541 tests                                                                                                                          |
| ng-packagr build         | pass, 1 warning | NG8113: `NgxFormFieldError` in the wrapper's `imports` but only rendered through `NgComponentOutlet` (`form-field/form-field-wrapper.ts:184`) |
| post-build strip scripts | pass            | `./core` absent from published `exports`; `@internal` members absent from shipped `.d.ts`                                                     |
| Release bump             | patch           | `fix:` commits `ef670877` and `6801f8fa` touch the toolkit since `v1.0.0-rc.12`                                                               |

## Fix before rc.13

### Vest: a superseded run can leave a field `pending()` forever (#433)

`vest/src/vest-run-coordinator.ts:575-633`, `vest/src/vest-adapter.ts:703-747`.

`awaitVestRunSettlement` races the run's promise against the next `ALL_RUNNING_TESTS_FINISHED` bus event, but never checks `suite.get().isPending()` first. The sibling `waitForSuiteIdle` at line 493 does. A run whose promise was superseded by a later `only()` run never settles, and once the suite is idle no further bus event arrives.

Trigger: a cache hit. `request()` returns a fresh handle with a fresh `settled` closure (line 946), and the `validateAsync` params callback builds a new payload object each time. Angular's `resource` compares params by identity, so a re-evaluation that does not change the value (a `hidden` or `disabled` toggle) reloads the resource and re-awaits the dead promise. `submitWithWarnings` then never resolves.

Evidence: reproduced at the coordinator level in Node against vest 6.3.2. The Angular trigger path was reasoned from the code, not reproduced end to end.

### `focusFirstInvalid()` reports success after a no-op focus (#434)

`core/utilities/focus-first-invalid.ts:70-77`.

Angular's `focusBoundControl()` is `this.getBindingForFocus()?.focus(options)` (`@angular/forms/fesm2022/_validation_errors-chunk.mjs:1369-1371`). It silently does nothing when no binding exposes `focus`. The helper checks only that the method exists, which is always true on a real `FieldState`, calls it, and returns `true`. The dev warning at lines 85-92 can never fire.

### Two hints in one wrapper share the same DOM id (#435)

`assistive/hint.ts:210`, `form-field/form-field-wrapper.ts:875`.

Without an explicit id every hint falls back to `${fieldName}-hint`. The wrapper accepts many hints via `contentChildren`, so two hints for `email` both render `id="email-hint"`. `aria-describedby` reaches only the first. The multiple-hints spec at `hint.spec.ts:258` runs outside a wrapper and does not catch this.

### Three headless surfaces time warnings by the error cascade (#432, #439)

`headless/src/lib/utilities.ts:359` (`createErrorState` returns `shouldShowWarnings: showErrorsSignal`), `utilities.ts:771` (`createErrorSummaryEntries` gates on `showErrors()`), `create-error-message-signal.ts:275` (`includeWarnings: 'only'` gated by the error cascade). None accepts `warningStrategy`. `NgxFormFieldErrorSummary` inherits this via `hostDirectives`.

ADR-0007 lines 160-162 list "make warnings inherit the error strategy" as rejected and call it the defect from #264. `utilities.spec.ts:692-760` pins the aliasing as a contract. `CONTEXT.md:99-101` claims the warning channel is consolidated on every surface.

Related: three warning predicates exist inside headless. `error-state.ts:357` is presence-gated `shouldShowWarnings()`; `fieldset.ts:295` is `invalid()`-gated `createShowErrorsComputed()`; summary and the factories use the error cascade.

## Should fix

### Package-wide (#438)

- No component sets `ChangeDetectionStrategy.OnPush`. All seven toolkit components run default change detection.
- `form-field/form-field-wrapper.ts:184`: unused `NgxFormFieldError` import (NG8113).
- `core/utilities/walk-field-tree.ts:33,59,84`: `InvalidFieldTreeError`, `isFieldTreeLike`, `walkFieldTreeEntries` tagged `@public` but absent from the root barrel.
- `core/utilities/humanize-field-path.ts:66`, `resolve-bound-control-from-bindings.ts:56`: `@packageInternal` is not a tag the strip scripts or the public API policy recognise.
- `core/directives/ngx-signal-form.ts:236`, `core/utilities/show-errors.ts:110`, `field-interactivity.ts:23`: comments cite "Angular 21.2".

### core

- #436: `core/directives/auto-aria.ts:581-584` (from `ef670877`) derives the field name from the inner `[role="combobox"][id]` element instead of the host. `docs/migrations/v1.0.0-rc.13.md:81-85` documents the attribute relocation only.
- #436: `auto-aria.ts:610-612` strips the three managed attributes from the host whenever the target differs, so an author-written `aria-describedby` on the host is deleted silently.
- #437: `core/utilities/submission-helpers.ts:244-277` and `:192` block on `pending()`. Angular 22.1 `submit()` defaults to `ignoreValidators: 'pending'`. The helper returns `Promise<void>`.
- #438: `core/utilities/find-bound-control.ts:37` matches `[ng-reflect-form-field]`, which only exists behind `provideNgReflectAttributes()`. The comment at lines 13-15 says "dev builds only".
- #438: `find-bound-control.ts:53`, `resolve-bound-control-from-bindings.ts:76`, `control-semantics.ts:171-213` use bare `instanceof HTMLElement` and friends.
- #438: `core/utilities/schema/required-from-standard-schema.ts:113-115` discards an async `validate()` promise.

### form-field (#438)

- `form-field-wrapper.ts:1201-1211` casts `#fieldState()` to `{ required?: () => boolean }`. Angular 22.1 types `FieldState.required` as `Signal<boolean>` (`@angular/forms/types/_structure-chunk.d.ts:1275`).
- `form-field-wrapper.ts:600-616`: the `appearance="stacked"` diagnostic says it resolves to `standard`, but the fallback is `#config.defaultFormFieldAppearance`.
- `form-field-wrapper.ts:1290-1295`: comment says auto-aria reads the identity's visibility; ADR-0011 §4 says auto-aria self-probes.

### assistive (#440)

- `assistive/form-field-error.ts:251`: `styleUrls: ['../form-field/feedback-tokens.css', …]` reaches into another entry point by relative path.
- `form-field-error.ts:347-361, 516-557`: second visibility cascade through `createErrorMessageSignal` with a synthetic field state (`touched: () => true`) and a pinned `'immediate'` strategy in override mode, although the host `NgxHeadlessErrorState` exposes un-gated `resolvedErrors` / `resolvedWarnings` (`headless/src/lib/error-state.ts:332,342`).
- `form-field-error.ts:15`: unused `ResolvedErrorDisplayStrategy` import.

### headless (#438)

- `headless/src/lib/error-summary.ts:154-158`, `create-error-message-signal.ts:245-250`: conditional spread guards `defaultErrorStrategy`, which `buildHeadlessContext()` always supplies (`build-headless-context.ts:63-65`).
- `headless/src/lib/utilities.ts:80-81`: local `ReadSignal` / `ReactiveOrStatic` duplicates of the core types.
- `utilities.ts:505`: `createCharacterCount.hasLimit` is `computed(() => true)`.

### vest (#433, #438)

- `vest/src/vest-adapter.ts:703-747`: new payload object per recomputation even on a cache hit.
- `vest/src/vest-run-coordinator.ts:28-30, 49`: comments place `VestFailureMessages` and `toVestValidationEntries` in the adapter; both live in `vest-result-mapper.ts`.

### packaging (#438)

- `core/ng-package.json:2`, `testing/ng-package.json:2`: `$schema` points at `ng-package.schema.json` instead of `ng-entrypoint.schema.json`. ng-packagr ignores `$schema`; editor validation only.

## Documentation drift (#441)

### Examples that are wrong or do not compile

| Where                                                   | Doc says                                                        | Code fact                                                                |
| ------------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `.agents/skills/ngx-signal-forms/headless/SKILL.md:239` | `createCharacterCount({ field })`, "maxLength auto-detected"    | `maxLength` is required (`utilities.ts:374`)                             |
| `headless/SKILL.md:214`                                 | `ngxHeadlessFieldName [field]="form.email"`                     | no `field` input (`field-name.ts:104`)                                   |
| `headless/SKILL.md:38,137,141,168`                      | `errorState.errorId` without call                               | `errorId` is a `Signal` (`error-state.ts:253`)                           |
| `headless/SKILL.md:80`                                  | `summary.shouldShow() && hasWarnings()`                         | public API is `shouldShowWarnings()`                                     |
| `headless/SKILL.md:94`                                  | notification `errors` required                                  | optional (`notification.ts:111`)                                         |
| `form-field/SKILL.md:24,181`                            | add `placeholder=" "` for the floating label animation          | no animation exists (`form-field-wrapper.css:751-785`)                   |
| `assistive/SKILL.md:152` vs `:33-38`                    | grouped output to `NgxFormFieldset` / to `presentation="panel"` | contradictory in one file                                                |
| `docs/CUSTOM_WRAPPERS.md:25`                            | suppress auto-ARIA via `ariaMode="manual"`                      | attribute is `ngxSignalFormControlAria="manual"`                         |
| `docs/migrations/v1.0.0-rc.13.md:81-85`                 | auto-ARIA writes on the inner combobox                          | field-name source change not mentioned (superseded by the #436 decision) |

### Rule sources disagree

`.github/instructions/ngx-signal-forms-toolkit.instructions.md:31` rule 8 lists eight removed APIs. `.agents/skills/ngx-signal-forms/SKILL.md:55` rule 8 lists those plus `NgxFormFieldNotification`, `toHintDescriptors`, `createErrorRendererInputs`, `resolveUnionInput`.

### JSDoc vs README

- `core/tokens.ts:139-142` calls `NGX_SIGNAL_FORM_ARIA_MODE` internal; `packages/toolkit/README.md:661` lists it as a public DI token and the root barrel exports it.
- `core/directives/auto-aria.ts:71-76` omits `aria-required` from the "Adds" list.
- `form-field-wrapper.ts:361-362` `fieldName` JSDoc omits the `[role="combobox"][id]` match; `form-field/README.md:205` has it.
- `form-field-wrapper.ts:419` `@default 'on-touch'` vs README:120 / `api.md:566` "Inherited".
- `form-field/README.md:118` types `strategy` without `| null` (`:407`).
- `form-field/README.md:135` `:has()` baseline vs `THEMING.md:48-52` native-nesting baseline (Chrome 112, Safari 16.5).
- `assistive/README.md:52-55` says the character count is auto-associated with the control; nothing references its id.
- `assistive/index.ts:5-6` mentions "layout containers"; none exported.
- `assistive/README.md:96` types `title` as `string`; code is `string | null | undefined` (`form-field-error.ts:323`).
- `assistive/form-field-error.ts:55-58` claims all error-state logic lives in the headless directive.
- `headless/README.md:110-118` omits `warningStrategy` (`error-state.ts:166`); `README.md:198` types notification `errors` as `Signal`, code is `ReactiveOrStatic`.
- `headless/src/lib/utilities.ts:293-303` vs `core/utilities/error-strategies.ts:93-95` and ADR-0007 on whether a warn-only field is `invalid()`. `utilities.spec.ts:726` shows Angular does mark it invalid; the core comment and ADR wording are the ones to correct.
- `core/utilities/submission-helpers.ts:229-232` mentions `(ngSubmit)` and an `'always'` strategy; neither exists.
- `core/utilities/show-errors.ts:39` says `submit()` calls `markAllAsTouched()`; Angular 22.1 calls `markAsTouched()` per node.
- `core/utilities/schema/required-from-standard-schema.ts:157` example imports from `@ngx-signal-forms/toolkit/core`.
- `vest/README.md:388-390` says the adapter awaits the run thenable; code awaits the bus race (`vest-adapter.ts:981`), which `README.md:289-303` calls unsafe.
- `validate-vest.ts:127-130` says `run(value, fieldName)` is preferred; code prefers `only` (`vest-run-coordinator.ts:447-460`).
- `.agents/skills/ngx-signal-forms/references/api.md:865-885` omits `VestFieldPath` and `VestResultLike`.
- `CONTEXT.md:3-5` still opens with a "TODO: Fill this in" banner.

### Public symbols no doc mentions

All are option or reader types whose factory functions are documented: `ResolvableValidationError`, `ResolveErrorMessageOptions`, `AriaDescribedByFieldNameReader`, `AriaDescribedByPreservedIdsReader`, `AriaRequiredFieldState`, `BoundControlElementReader`, `CreateAriaDescribedByBridgeOptions`, `CreateAriaDescribedBySignalOptions`, `CreateFieldNameResolverOptions`, `CreateHintIdsSignalOptions`, `HintIdsFieldNameReader`, `HintIdsIdentityLike`, `HintIdsRegistryLike`, `HintIdsSignal`, `LabelForReader`, `NgxCharacterCountAnnouncementInfo`, `NgxCharacterCountAnnouncementState`, `VestFieldPath`. The other 215 exports appear in at least one document.

## Verified correct

- Public API hygiene: every root-barrel symbol resolves through `core/index.ts`; no `@internal` symbol is listed. The built `dist` has no `./core` export and no internal members in the shipped `.d.ts`. No secondary entry re-exports core wholesale; no TypeScript import crosses entry points by relative path.
- Angular Signal Forms usage: no private or underscore Angular members. No `instanceof` on Angular error classes; message resolution keys on `kind` and the exhaustiveness guard covers all eleven `NgValidationError` kinds in 22.1.3.
- One cascade seam for errors: all five error-visibility sites call `createErrorVisibility`; the fieldset's parallel `resolvedStrategy` matches CONTEXT.md. The core warning cascade is the independent four-tier resolver ADR-0007 describes.
- Per-channel visibility and identity: auto-ARIA resolves the error and warning channels independently from the published identity value, then the registry, then ambient context (ADR-0010). The wrapper composes `NgxFieldIdentityProvider` as a host directive and publishes name, element, strategies, visibility and hints in the documented order (ADR-0011).
- Effects and DOM: no `effect()` in headless or form-field. DOM work sits in `afterEveryRender` phases; no bare `window` or `document` at construction. All hooks register in injection context.
- Accessibility: errors `role="alert"`, warnings `role="status"`; ids bound only while visible; warnings suppressed while an error shows; selection rows meet the 24px target; the error summary focuses once per transition with an opt-out.
- Vest adapter: Vest 6 public API only; type-only `vest` import; `warn:vest:` and `vest:` kinds; first-segment misses silent and typo tails throw in dev (ADR-0008); ref-counted `suite.reset()` on last destroy.
- Testing entry: the axe tag set maps to 70 rules; `runOnly` cannot be overridden; axe-core cannot reach the main bundle.
- Strictness: `strict`, `noImplicitOverride`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` on; prod build uses partial compilation.
- Docs: no document presents a removed API, a renamed token, or `/core` as importable. All relative links in `docs/**`, ADRs, READMEs, skills and instructions resolve. Demo-map paths exist after the `48337b9c` move.

## Method and limits

Eight read-only agents ran in parallel with a shared brief: core directives and providers, core utilities, form-field, assistive, headless, vest, testing plus packaging, and a documentation audit. Each had the repo standards (AGENTS.md, CONTEXT.md, the instruction files, the skill tree, ADRs 0001-0011), an Angular 22 and TypeScript checklist, and the Fowler smell baseline. The aggregator re-read the source for every finding ranked as blocking.

Limits: browser specs were not executed. The Vest hang was reproduced at the coordinator level in Node, not through an Angular form.
