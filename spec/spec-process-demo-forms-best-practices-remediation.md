---
title: Demo Forms Best-Practices Remediation
version: 1.0
date_created: 2026-08-14
last_updated: 2026-08-14
owner: ngx-signal-forms
tags:
  - process
  - design
  - app
  - demo
---

# Introduction

This specification defines how to remediate findings from the 2026-08-14 review of `apps/demo` forms against Angular 22.1 Signal Forms and `@ngx-signal-forms/toolkit` usage rules. The goal is a single, reviewable demo-app pass that makes every showcased form use the current form contract, keep onboarding copy true to the live form, and keep Display Controls plus Form State & Validation consistent.

This document is written for a later implementation agent. It is self-contained. It does not require the original review conversation.

## 1. Purpose & Scope

**Purpose:** Specify what must be fixed, what must not be changed, where work belongs (demo vs toolkit), and how to accept the work.

**Intended audience:** Implementation agents and human reviewers working in `ngx-signal-forms`.

**In scope:**

- `apps/demo` form pages, page chrome, educational cards, and demo-only shared UI that those pages depend on.
- Demo-local custom controls under `apps/demo/src/app/shared/controls/`.
- Spec-driven GitHub issues only for items explicitly marked out of this pass.

**Out of scope:**

- Public toolkit API changes in `packages/toolkit`.
- Debugger feature work in `libs/debugger` beyond wiring an existing debugger into a demo page that already uses it elsewhere.
- Mass deletion of `changeDetection: ChangeDetectionStrategy.OnPush` across the demo (allowed only when already editing that file for another required change).
- Visual redesign of Display Controls.
- Creating a worktree or implementation branch as part of writing this spec.

**Assumptions:**

- Angular Signal Forms remains the source of truth: `form()`, `[formField]`, and field-state signals are not replaced by toolkit abstractions.
- Toolkit wrappers, assistive components, and auto-ARIA already work with `form[formRoot]` alone under default `'on-touch'` timing.
- `ngxSignalForm` is added only when the form needs `'on-submit'`, `submittedStatus`, shared form context, or a form-level strategy override.
- Educational cards do not need identical titles across pages. Each page may keep a page-specific title. The two-card layout stays: overview card + learning/try-it card.

## 2. Definitions

| Term                        | Definition                                                                                                                                        |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Demo form page**          | A routed page under `apps/demo/src/app/` that showcases a live form.                                                                              |
| **Form contract**           | `form[formRoot]` plus Angular `form(..., { submission })` for submit lifecycle. Add `ngxSignalForm` only when shared toolkit context is required. |
| **Display Controls**        | Right-rail / slide-over panel registered with `ngxPageControls` (`ngx-display-controls-card`).                                                    |
| **Form State & Validation** | `ngx-signal-form-debugger` panel bound to the live `formTree`.                                                                                    |
| **Overview card**           | First educational card rendered by `ngx-example-cards` (`demonstrated` input).                                                                    |
| **Learning card**           | Second educational card (`learning` input), including try-this steps.                                                                             |
| **Quoted message**          | Any validation string wrapped in quotes or `<em>` / `<code>` in educational copy.                                                                 |
| **Warning**                 | Non-blocking validation error whose `kind` starts with `warn:`.                                                                                   |
| **Auto-ARIA**               | `NgxSignalFormAutoAria` management of `aria-invalid`, `aria-required`, and `aria-describedby` on toolkit-managed controls.                        |
| **Manual ARIA mode**        | Explicit `ngxSignalFormControlAria="manual"` or equivalent control-semantics `ariaMode: 'manual'`.                                                |
| **This pass**               | The single implementation PR described by this specification.                                                                                     |
| **Follow-up issue**         | A GitHub issue for work that must not land in this pass.                                                                                          |

## 3. Requirements, Constraints & Guidelines

### Decision (must follow)

- **DEC-001**: Do not implement this pass until a human accepts this specification.
- **DEC-002**: This pass is **demo-only**. Do not change `packages/toolkit` public behavior, exports, or CSS contracts.
- **DEC-003**: Ship **one implementation PR** for all in-pass demo work. Do not open one GitHub issue per in-pass item.
- **DEC-004**: Open **separate GitHub issues** only for items in section 3.4.
- **DEC-005**: After acceptance, implementation happens on a **new git worktree and branch**. Do not commit this spec on `feature/setup-pullfrog` unless the human explicitly asks.

### Toolkit vs demo

- **REQ-001**: Treat the 2026-08-14 findings as **consumer-usage defects** in `apps/demo`, not toolkit defects.
- **REQ-002**: Do not add toolkit APIs, warnings, or migrations to “force” demo pages onto `[formRoot]`. The preferred contract is already documented.
- **GUD-001**: A later toolkit issue may add a **dev-mode usage warning** when a demo-like form uses `(submit)` + `novalidate` while importing toolkit submission helpers. That is follow-up, not this pass.

### Form contract

- **REQ-003**: [warning-support.form.ts](apps/demo/src/app/02-toolkit-core/warning-support/warning-support.form.ts) MUST use `form[formRoot]`.
- **REQ-004**: Warning Support MUST use Angular `form(..., { submission })` or an equivalent `[formRoot]`-compatible submit path. Remove the standalone `novalidate` + `(submit)="handleSubmit($event)"` host form.
- **REQ-005**: Warning Support MUST keep `submitWithWarnings()` semantics: warnings do not block submit; blocking errors do.
- **REQ-006**: Warning Support MUST derive in-flight submit UI from `passwordForm().submitting()` (or the `[formRoot]` submission signal). Delete the local `isSubmitting` signal if it only duplicates that state.
- **REQ-007**: [trip-step.ts](apps/demo/src/app/05-advanced/advanced-wizard/components/trip-step.ts) MUST wrap destination/activity fields in `form[formRoot]="tripForm"`.
- **REQ-008**: Traveler step MAY keep `form[formRoot]` without `ngxSignalForm` if it only needs default `'on-touch'` timing. Add `ngxSignalForm` only if the step needs form-level strategy, `submittedStatus`, or inherited `'on-submit'`.
- **REQ-009**: Do not introduce `(ngSubmit)` anywhere.

### Accessibility and ARIA

- **REQ-010**: Remove author-owned `aria-describedby` from native inputs in [error-display-modes.form.ts](apps/demo/src/app/02-toolkit-core/error-display-modes/error-display-modes.form.ts) unless that control is explicitly in manual ARIA mode.
- **REQ-011**: Keep hint and character-count elements. Give them stable `id`s. Let auto-ARIA compose `aria-describedby`.
- **REQ-012**: Headless pages ([error-message-signal](apps/demo/src/app/03-headless/error-message-signal), [fieldset-utilities](apps/demo/src/app/03-headless/fieldset-utilities)) MAY keep manual `aria-invalid` / `aria-describedby`. That is the headless contract.
- **REQ-013**: Custom rating and legacy datepicker MAY keep manual ARIA. They already opt out correctly.

### Success and error presentation

- **REQ-014**: Replace `alert('Thank you for your feedback!')` in Error Display Modes with an in-page `role="status"` success message consistent with Warning Support / Server Integration.
- **REQ-015**: Do not use `window.alert` for form success or failure on any demo form page.

### Educational copy

- **REQ-016**: Quoted validation messages in `*.content.ts` MUST equal the live schema / component message strings.
- **REQ-017**: Field lists in overview cards MUST name only fields that exist on that page.
- **REQ-018**: Try-this steps MUST be executable against the current form without inventing UI that is not on the page.
- **REQ-019**: Page-specific overview/learning titles MAY remain. Do not rename every card to “What You'll See (Toolkit Onboarding)” / “Interactive Testing Guide”.
- **REQ-020**: Your First Form copy that claims native `required` and `autocomplete` MUST either add those attributes or stop claiming them. Prefer adding `autocomplete` where semantically correct. Do not add HTML `required` if it fights Signal Forms / toolkit error timing; if omitted, the copy must say Signal Forms owns requiredness.
- **REQ-021**: Error Display Modes copy MUST NOT call the rating control “stars” unless the control is the star rating widget. It is a number input.
- **REQ-022**: Error Display Modes copy MUST NOT claim “cross-field validation” unless a sibling `valueOf` / `validateTree` rule exists. Conditional `required` is allowed to be described as conditional validation.
- **REQ-023**: Error Display Modes try-this MUST quote the live improvement messages:
  - empty/required: `Please help us understand what could be improved`
  - too short: `Please provide at least 10 characters of feedback`
- **REQ-024**: Warning Support try-this MUST quote the live warning strings, including:
  - `Consider using 6+ characters for better security`
  - `Consider using 12+ characters for better security`
  - `Consider mixing uppercase, lowercase, numbers, and special characters`
- **REQ-025**: Complex Forms MUST remove the contradictory boilerplate percentages (`67%` vs `33%`, and `~320` / `~280` lines). Replace with a qualitative statement or one verified measurement. Do not invent a new percentage.
- **REQ-026**: Complex Forms MAY mention contacts CRUD in try-this, but MUST NOT claim contacts CRUD if the controls are removed. Current form has contacts; keep the feature claim.

### Display Controls and debugger

- **REQ-027**: [i18n.page.ts](apps/demo/src/app/05-advanced/i18n/i18n.page.ts) MUST render `ngx-signal-form-debugger` bound to the live form tree, using the same split-layout pattern as other advanced pages.
- **REQ-028**: Error Message Signal and Single-Model Wizard MAY omit Display Controls. If omitted, do not add empty rail chrome.
- **REQ-029**: Fieldset Appearance already embeds a debugger in the form component. Keep one visible debugger. Do not add a second copy on the page wrapper.
- **REQ-030**: Nav “Has display controls” badges MUST match pages that actually register `ngxPageControls`. If a page has controls, the nav item must advertise them. If it does not, it must not.

### Cleanup allowed in this pass

- **REQ-031**: Delete unused `productFeedbackValidationSuite` or stop exporting it. Do not leave a second unused schema that disagrees with the live form.
- **REQ-032**: [example-cards.ts](apps/demo/src/app/ui/example-cards/example-cards.ts) MUST stop using `Math.random()` for `demonstratedHeadingId`. Use a stable id (static suffix, incremental counter, or `crypto.randomUUID()` only if generated once per class field initialization is insufficiently stable for tests — prefer a deterministic string such as `example-cards-demonstrated`).
- **REQ-033**: [example-cards.html](apps/demo/src/app/ui/example-cards/example-cards.html) next-step links MUST use Angular `routerLink` (or `RouterLink`) for in-app paths. Keep external URLs as `href`.
- **REQ-034**: When already editing a file, remove `standalone: true` from [badge-icon.ts](apps/demo/src/app/ui/badge/badge-icon.ts) if that file is touched. Do not open a dedicated cleanup-only PR for OnPush/standalone.
- **GUD-002**: `Date | null` on the legacy datepicker adapter MAY remain. That empty-date contract is justified.
- **GUD-003**: `monthlyBudget: number | null` in brand-theming MAY remain if `0` would incorrectly trigger or hide the warning demo. If `0` preserves the demo (empty/unset vs over-budget warning), prefer `0` and `number`.

### Constraints

- **CON-001**: Do not change toolkit CSS custom properties, wrapper inputs, or error-strategy semantics to make a demo page look correct.
- **CON-002**: Do not add `aria-invalid`, `aria-required`, or `aria-describedby` to toolkit-managed native controls.
- **CON-003**: Do not use removed toolkit APIs (`computeShowErrors`, `canSubmit`, `injectFormConfig`, `manual` strategy, `stacked` appearance, `bare` appearance).
- **CON-004**: Do not initialize new Signal Forms models with `null` unless the control is an optional date/adapter empty state.
- **CON-005**: Keep WCAG 2.2 AA. Success banners use `role="status"`. Blocking errors stay `role="alert"`. Warnings stay `role="status"`.
- **CON-006**: Do not rewrite educational tone into marketing copy. Keep short, testable steps.

## 4. Interfaces & Data Contracts

### 4.1 Warning Support form host

Current (forbidden after this pass):

```html
<form class="form-container" novalidate (submit)="handleSubmit($event)"></form>
```

Required shape:

```html
<form
  [formRoot]="passwordForm"
  ngxSignalForm
  [errorStrategy]="errorDisplayMode()"
  class="form-container"
></form>
```

Submit action MUST still call `submitWithWarnings(passwordForm, ...)` from the `form()` `submission.action`, or from a submit option that `[formRoot]` invokes. If `submitWithWarnings` cannot live inside `submission.action` without changing toolkit behavior, keep a thin action wrapper. Do not go back to raw `(submit)`.

### 4.2 Wizard trip step host

Required shape around the destination list:

```html
<form [formRoot]="tripForm" class="trip-step">
  <!-- existing destination fieldsets and [formField] bindings -->
</form>
```

Add `ngxSignalForm` only if the wizard step needs inherited submit timing. Default `'on-touch'` MAY omit it.

### 4.3 Error Display Modes success

Replace `alert(...)` with an in-page status region, for example:

```html
@if (successMessage()) {
<div role="status" aria-live="polite">{{ successMessage() }}</div>
}
```

### 4.4 Educational card contract

`ngx-example-cards` continues to accept:

| Input          | Role                                 |
| -------------- | ------------------------------------ |
| `demonstrated` | Overview of what the live form shows |
| `learning`     | Try-this steps + next route          |

Quoted strings in those objects are part of the page contract and must match runtime messages.

### 4.5 i18n debugger wiring

Follow the existing advanced-page pattern:

```html
<ngx-split-layout>
  <ngx-i18n-demo ... left />
  <div right>
    <ngx-signal-form-debugger [formTree]="formRef.demoForm" />
  </div>
</ngx-split-layout>
```

Use the actual public form field name on `I18nDemoComponent`.

### 4.6 Files this pass may edit

| Area                | Files                                                                                                                       |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Warning Support     | `apps/demo/src/app/02-toolkit-core/warning-support/warning-support.form.ts`, `warning-support.content.ts`, specs if present |
| Error Display Modes | `error-display-modes.form.ts`, `error-display-modes.content.ts`, `error-display-modes.validations.ts`, `index.ts`           |
| Your First Form     | `your-first-form.form.ts`, `your-first-form.content.ts`                                                                     |
| Complex Forms       | `complex-forms.content.ts`                                                                                                  |
| Advanced wizard     | `apps/demo/src/app/05-advanced/advanced-wizard/components/trip-step.ts`                                                     |
| i18n                | `i18n.page.ts` and template fragments in that file                                                                          |
| Example cards       | `apps/demo/src/app/ui/example-cards/example-cards.ts`, `example-cards.html`                                                 |
| Nav badges          | nav config that sets “Has display controls”                                                                                 |
| Tests               | demo unit specs and `apps/demo-e2e` specs that assert old copy, submit handlers, or missing debugger                        |

Do not edit `packages/toolkit/**` in this pass.

## 5. Acceptance Criteria

- **AC-001**: Given Warning Support, When the page loads, Then the live form element has `[formRoot]` and no host `(submit)` handler.
- **AC-002**: Given Warning Support with username `abc`, a valid email, and password `Short123`, When the user submits, Then the username/password warnings remain visible and submission succeeds.
- **AC-003**: Given Warning Support with empty required fields, When the user submits, Then blocking errors appear and submission does not succeed.
- **AC-004**: Given the wizard Trip Details step, When destinations are rendered, Then those controls live inside `form[formRoot]="tripForm"`.
- **AC-005**: Given Error Display Modes, When a valid submit completes, Then an in-page status message appears and `window.alert` is not called.
- **AC-006**: Given Error Display Modes native name/email/product/rating/feedback inputs, When auto-ARIA is enabled, Then the template does not set `aria-describedby` on those controls.
- **AC-007**: Given Your First Form educational copy, When a user follows the on-touch try-this steps, Then every quoted error matches the rendered alert text.
- **AC-008**: Given Complex Forms educational copy, When a reader looks for boilerplate percentages, Then no `67%`, `33%`, `320 lines`, or `280 lines` claim remains.
- **AC-009**: Given the i18n demo page, When the page renders at `lg` split layout, Then Form State & Validation is visible and bound to the i18n form tree.
- **AC-010**: Given an in-app next-step link on any example card, When activated, Then Angular routing handles navigation (no full document load via raw `href` to an in-app path).
- **AC-011**: Given `ngx-example-cards`, When two instances render, Then their demonstrated heading ids are deterministic and unique enough for `aria-labelledby` (no `Math.random()`).
- **AC-012**: Given `productFeedbackValidationSuite`, When the Error Display Modes barrel is inspected, Then that unused suite is gone or no longer exported.
- **AC-013**: Given this pass, When `git diff` is reviewed, Then `packages/toolkit` has no changes.

## 6. Test Automation Strategy

- **Test Levels**:
  - Unit: Warning Support submit path; Error Display Modes success banner; example-cards heading id and `routerLink`.
  - Component/integration: existing demo specs that break because of template contract changes.
  - E2E: update `apps/demo-e2e` only where selectors or copy assertions fail.
- **Frameworks**: Vitest for demo unit tests; Playwright for `demo-e2e`.
- **Commands** (after implementation, via Nx):
  - `pnpm nx test demo`
  - focused e2e for touched routes (`warning-support`, `error-display-modes`, `complex-forms`, `advanced-wizard`, `i18n`) rather than the full suite first
- **Test Data**: reuse existing demo fixtures and try-this values from this spec.
- **CI/CD**: standard demo test + lint jobs. No new pipeline.
- **Coverage**: no new coverage threshold. New behavior must have at least one automated assertion.
- **Manual verification** (implementation agent, after code):
  1. `/getting-started/your-first-form` — blur empty name, type `A`, type `Ab`, invalid email.
  2. `/toolkit-core/error-display-modes` — submit empty form, set rating `3`, confirm improvement field, submit success without `alert`.
  3. `/toolkit-core/warning-support` — short username warning, submit-with-warnings.
  4. `/form-field-wrapper/complex-forms` — first name `A`.
  5. `/advanced-scenarios/advanced-wizard` — trip step fields still validate.
  6. `/advanced-scenarios/i18n` — debugger visible; language switch still updates errors.

## 7. Rationale & Context

The review found no toolkit runtime bug that blocked demo forms from showing errors, warnings, Display Controls, or debugger state. Failures were usage and documentation drift:

- Warning Support still demonstrates an older submit host, which teaches the wrong Angular 22.1 contract.
- The wizard trip step omits `form[formRoot]`, so submit timing and native form semantics are inconsistent with the traveler step and other demos.
- Educational cards quote shortened or stale messages. That is a docs-in-the-product bug: users follow the card and think the toolkit is wrong.
- i18n already has Display Controls but dropped the debugger, breaking the catalog’s inspection pattern.
- Example-card `[href]` causes full navigations and contributes to view-transition `InvalidStateError` noise.

Fixing these in the toolkit would hide consumer mistakes and risk false positives for apps that intentionally use headless or custom submit hosts. The demo is the reference implementation; it must show the current contract.

Redundant `OnPush` and `standalone: true` are style nits. Sweeping them in this pass would drown the behavioral diff.

## 8. Dependencies & External Integrations

### External Systems

- **EXT-001**: GitHub issue tracker — used only for follow-up issues in section 3.4.

### Third-Party Services

- None.

### Infrastructure Dependencies

- **INF-001**: Existing demo Vite/Nx serve target for manual verification.
- **INF-002**: Existing Vitest and Playwright projects for `demo` and `demo-e2e`.

### Data Dependencies

- **DAT-001**: Live validation message strings in each page’s `*.validations.ts` / inline schema. Copy must be copied from those sources, not paraphrased.

### Technology Platform Dependencies

- **PLT-001**: Angular 22.1 Signal Forms (`form`, `FormField`, `[formRoot]`, `submission`).
- **PLT-002**: `@ngx-signal-forms/toolkit` current public surfaces (`NgxSignalFormToolkit`, `NgxFormField`, assistive/headless/vest as already used).
- **PLT-003**: `@ngx-signal-forms/debugger` for Form State & Validation.

### Compliance Dependencies

- **COM-001**: WCAG 2.2 AA for any new success/error UI.

## 9. Examples & Edge Cases

### Copy sync rule

```ts
// validations
minLength(path.name, 2, { message: 'Name must be at least 2 characters' });

// content — required
('2. Type "A" → Error: "Name must be at least 2 characters"');

// content — forbidden
('2. Type "A" → Error: "min 2 characters"');
```

### Auto-ARIA vs hints

```html
<!-- forbidden on toolkit-managed native input -->
<input id="name" [formField]="form.name" aria-describedby="name-hint" />

<!-- required -->
<input id="name" [formField]="form.name" />
<div id="name-hint" class="form-hint">
  We use this to personalize our response
</div>
```

### Warning Support submit

```ts
// required idea — submitting() comes from the form, not a parallel signal
readonly passwordForm = form(this.#formModel, passwordFormSchema, {
  submission: {
    action: async () => {
      await submitWithWarnings(this.passwordForm, async () => {
        /* existing success banner */
      });
    },
    onInvalid: createOnInvalidHandler(),
  },
});
```

If `submitWithWarnings` already marks touched/submitted internally, do not double-submit. Preserve current warning-bypass behavior. If the two APIs conflict, prefer a `[formRoot]` form whose action calls the existing `submitWithWarnings` body, and add a unit test for the warning-success path.

### Edge cases

- Outline appearance keeps orientation vertical; do not enable Horizontal for outline in copy or tests.
- Headless pages must not be “fixed” by stripping manual ARIA.
- Optional date adapter empty value may stay `null`.
- Do not add Display Controls to Error Message Signal just for symmetry.

## 10. Validation Criteria

This specification is satisfied when:

1. A human has accepted DEC-001 through DEC-005.
2. Implementation changes are limited to `apps/demo` (and demo-e2e/tests as needed).
3. Every REQ in section 3 that is labeled this pass is implemented or explicitly waived in the PR description.
4. Every AC in section 5 has a test or a recorded manual check in the PR.
5. Follow-up issues in section 3.4 exist before the PR is marked ready, if those items are still open.
6. No toolkit file is modified.

## 11. Related Specifications / Further Reading

- [AGENTS.md](../AGENTS.md)
- [docs/ANGULAR_VS_TOOLKIT.md](../docs/ANGULAR_VS_TOOLKIT.md)
- [docs/WARNINGS_SUPPORT.md](../docs/WARNINGS_SUPPORT.md)
- [docs/TESTING.md](../docs/TESTING.md)
- Toolkit usage rules: `.github/instructions/ngx-signal-forms-toolkit.instructions.md`
- Skill router: `.agents/skills/ngx-signal-forms/SKILL.md`

## 3.4 Follow-up issues (not this pass)

Create separate GitHub issues after spec acceptance. Do not implement them in the demo PR.

| Issue                                                                                                    | Why separate                                          |
| -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Optional toolkit dev-mode warning when `(submit)` + `novalidate` is used with toolkit submission helpers | Product behavior change; needs API/docs review        |
| Catalog-wide removal of redundant `ChangeDetectionStrategy.OnPush`                                       | Large noisy diff; Angular 22 default only             |
| Investigate view-transition `InvalidStateError` after `routerLink` migration                             | May remain after demo href fix; shell/animation issue |
| Nav badge audit if any page still mismatches after REQ-030                                               | Only if leftover after this pass                      |
| Brand-theming `monthlyBudget: number \| null` cleanup                                                    | Product-neutral; do only if `0` is proven equivalent  |

Do **not** file issues for in-pass items (Warning Support `[formRoot]`, trip-step form host, copy sync, i18n debugger, unused suite, example-cards id/`routerLink`).
