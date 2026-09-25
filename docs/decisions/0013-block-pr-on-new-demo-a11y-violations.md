# ADR-0013: The Demo `a11y` Job Blocks Pull Requests on New Violations

## Status

Accepted. Supersedes the non-blocking PR clause of [ADR-0004](0004-wcag22-testing-strategy.md).

## Date

2026-09-25

## Context

Issue [#517](https://github.com/ngx-signal-forms/ngx-signal-forms/issues/517).

ADR-0004 made the demo `a11y` job non-blocking (`continue-on-error: true`) because the demo apps show the toolkit through third-party UI layers (PrimeNG, Spartan, Material), and those layers could carry violations outside the toolkit's control. At the time, `demo-e2e`'s baseline held 5 known `color-contrast` violations from demo scaffolding.

That reasoning no longer matches the repository:

- All four `apps/*-e2e/a11y-baseline.json` files now list zero violations. ADR-0004's "5 known violations" claim is stale.
- Because the job is non-blocking, a PR that introduces a real new violation still shows a green check. The report is easy to miss.
- The baseline file already gives a maintainer a reviewed way to accept a violation: add it to the baseline in a diff. A non-blocking CI job on top of that mechanism only hides regressions; it does not add safety.

`tools/scripts/a11y-report-violations.mjs --check` already computes "new violations" as anything present in the scan but absent from the baseline. Nothing about that computation depends on the job being non-blocking.

## Decision

**The PR `--check` step blocks the job.** `.github/workflows/ci.yml`'s `a11y` job drops its job-level `continue-on-error`. On a pull request, a violation not already in the target app's baseline fails the job. A violation the baseline covers still passes.

**The baseline stays the accepted-violation mechanism.** A maintainer who wants to accept a violation (third-party, scaffolding, or otherwise) adds it to `apps/<app>/a11y-baseline.json` in a reviewed diff (`pnpm a11y:baseline` regenerates the file locally). This is unchanged from ADR-0004.

**The main branch step stays non-blocking.** The "Open issues for new violations (push)" step keeps `continue-on-error: true`, so a `gh` outage cannot fail the main branch build. It also now creates the `needs-triage` label (`--force`), not just `a11y`, before opening any issue — `gh issue create` fails if a listed label does not exist.

**A failed issue search fails loudly.** `a11y-report-violations.mjs`'s `issueExists` used to catch a failed `gh issue list` and return `false`, which read as "no issue found" and could create a duplicate issue. It now lets the error propagate, so a broken search stops issue creation instead of silently creating one anyway.

**Making the check a required status check is a repository ruleset change**, made outside this repository's files (GitHub branch protection / rulesets UI or API). This ADR does not perform that change; a maintainer must add the `a11y` job as a required check.

## Alternatives considered

**Keep the job non-blocking, rely on the auto-opened issues.** Rejected: an issue opened after merge to `main` is slower feedback than a failing PR check, and the whole point of catching a violation before merge is to fix it before merge.

**Fail the whole job, including the scan and setup steps, only on `main`.** Rejected: a required check must be blocking on the event it protects — pull requests — not on the branch it protects after the fact.

**Silently skip issue creation when the search fails, instead of failing loudly.** Rejected: skipping without a nonzero exit code hides the failure from the job's status, the same problem this ADR is fixing everywhere else in this job.

## Consequences

- A PR that adds a violation not in the baseline now fails CI. To land it, the author either fixes the violation or adds it to the baseline in the same PR.
- `a11y-report-violations.mjs`'s `issueExists` and `main` are now named exports, guarded from running on import, so `tools/scripts/a11y-report-violations.spec.mjs` (`node --test`, wired to the `check-a11y-report-violations` Nx target) can exercise the failure path without a real `gh` CLI.
- The `a11y` job creates both `a11y` and `needs-triage` labels (`--force`) before it opens an issue on `main`.
- ADR-0004's non-blocking PR clause and "5 known violations" claim are superseded by this ADR; see the note added there.
- A maintainer still needs to mark the `a11y` job a required check in the repository's ruleset — this repository's files cannot do that.
