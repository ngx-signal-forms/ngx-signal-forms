# Implement: Demo Forms Best-Practices Remediation

Copy everything below the line into a **new agent session**.

---

Implement [spec/spec-process-demo-forms-best-practices-remediation.md](spec/spec-process-demo-forms-best-practices-remediation.md).

The spec is accepted. Treat every `REQ-*`, `CON-*`, `AC-*`, and section 4 contract as binding. Do not re-litigate demo vs toolkit. Do not expand scope.

## Skills (read before editing)

- `using-git-worktrees` — isolate first
- `ngx-signal-forms` — then only the surface you touch (`core`, `form-field`, `assistive`)
- `angular-developer` / `references/signal-forms.md` — `[formRoot]`, `form(..., { submission })`, field-state calls
- `.github/instructions/ngx-signal-forms-toolkit.instructions.md` — non-negotiable toolkit rules
- `nx-run-tasks` — run tests through `pnpm nx …`

## Steps

### 1. Isolate

Create a new worktree and branch from current `main` (or the latest integration branch the human names). Do **not** commit on `feature/setup-pullfrog`.

Suggested branch: `fix/demo-forms-best-practices`

Done when: `git branch --show-current` is the new branch and the working tree is that worktree.

### 2. Read the spec, then the live files

Read the spec end to end. Then read only the files listed in spec section 4.6 before editing them.

Done when: you can name the three contract defects (Warning Support host, Error Display Modes manual `aria-describedby`, wizard trip step missing `[formRoot]`) from the current source, not from memory.

### 3. Implement this pass only

Apply every in-pass `REQ-*`. Order:

1. Warning Support `[formRoot]` + `submitWithWarnings` without double-submit (spec 4.1 and the “do not double-submit” note)
2. Wizard trip step `form[formRoot]="tripForm"` (spec 4.2)
3. Error Display Modes: drop author `aria-describedby` on native inputs; replace `alert()` with `role="status"`
4. Educational copy sync (`REQ-016`–`REQ-026`) — quote live schema strings only
5. i18n debugger in split layout (`REQ-027`)
6. Example cards: stable heading id + in-app `routerLink` (`REQ-032`, `REQ-033`)
7. Remove or un-export `productFeedbackValidationSuite` (`REQ-031`)
8. Nav “Has display controls” badges match `ngxPageControls` (`REQ-030`)
9. Update demo / demo-e2e tests that break because of the above

Keep `packages/toolkit` untouched (`AC-013`).

Done when: `git diff --stat` shows `apps/demo`, `apps/demo-e2e`, and tests only.

### 4. Verify

Run, via Nx:

- `pnpm nx test demo` (or the focused demo specs you touched)
- focused Playwright for touched routes: warning-support, error-display-modes, complex-forms, advanced-wizard, i18n

Then do the six manual checks in spec section 6.

Done when: automated tests you ran are green, and each `AC-001`–`AC-013` is either covered by a test or recorded as a manual check in the PR notes.

### 5. Follow-ups (only if still open)

Create GitHub issues **only** for spec section 3.4. Do not file issues for in-pass items.

Done when: 3.4 issues exist or you state why each item is still not worth tracking.

### 6. Stop

Do not open the PR unless the human asks. Leave a short summary: files changed, AC status, remaining 3.4 issues.

## Guardrails

- Angular Signal Forms stays the source of truth (`form()`, `[formField]`, field-state signals).
- Add `ngxSignalForm` only for `'on-submit'`, `submittedStatus`, shared context, or a form-level strategy override.
- Headless pages and opted-out custom controls keep their own ARIA.
- Do not rename every card to “What You'll See (Toolkit Onboarding)”.
- Do not sweep `ChangeDetectionStrategy.OnPush` unless you are already editing that file.
- Do not invent boilerplate percentages.
- If `submitWithWarnings` and `form(..., { submission })` conflict, keep warning-bypass behavior and add a unit test for the warning-success path.
