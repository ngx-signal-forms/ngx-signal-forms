# ADR-0012: The Error Summary Announces Alone After a Submit

## Status

Accepted

## Date

2026-09-24

## Context

Issue [#522](https://github.com/ngx-signal-forms/ngx-signal-forms/issues/522), a follow-up to [#500](https://github.com/ngx-signal-forms/ngx-signal-forms/issues/500).

Each `NgxFormFieldError` renders its blocking errors in a `role="alert"` region. `NgxFormFieldErrorSummary` is a `role="alert"` region too, and it takes focus after a failed submit. So one submit that reveals N field errors fires N + 1 assertive announcements in the same moment. NVDA and JAWS then cut speech off, stack it, or read each error twice. The summary already lists every error, so the field announcements add noise and no information.

The fix must not break two things:

- **The always-mounted live region.** A screen reader announces content that is inserted into a live region that already exists. A region that is created together with its content can miss its first announcement (the NVDA + Chrome case). `NgxFormFieldError` keeps its `role="alert"` element mounted and empty for this reason.
- **`aria-describedby` tracks what is rendered.** The control still points at `${fieldName}-error`, so that element must exist and hold the message whenever errors show (see CONTEXT.md).

## Decision

### 1. A submit-revealed error renders outside the live region

`NgxFormFieldError` gets a second, non-live error container. It has the same classes, the same messages (one shared `ng-template`), and it takes the `${fieldName}-error` id while it shows. It renders before the `role="alert"` element, which stays mounted and empty.

The errors go into this quiet container when both of these are true:

1. They appear or change in the render that follows a submit attempt.
2. An `NgxFormFieldErrorSummary` of the same form shows errors.

The quiet state ends when the errors change or hide. The next error the user causes by editing then goes into the always-mounted `role="alert"` region, which is an insertion into an existing live region, so it announces. The summary is unchanged: it announces and takes focus as before.

We move the content, not the role. Removing `role="alert"` for one render and adding it back later changes the element's role while it holds content. Browsers rebuild the accessibility node on a role change, and some screen reader and browser pairs announce an alert that gets its role while it has content. That is the announcement we want to prevent. A non-live sibling has no such edge case: content in an element that is not a live region never announces.

### 2. Detecting "revealed by a submit"

`NgxSignalForm` already listens to the form's native `submit` event. It now also calls `NgxSubmitAnnouncements.notifySubmitAttempt()`, which sets a flag and clears it in `afterNextRender`. So the flag is true for exactly the render that the submit causes.

`NgxFormFieldError.errorsQuiet` is a `linkedSignal` over the visible flag and the joined error kinds and messages. When the errors appear or change, it samples the submit flag and the summary state, untracked. When they stay the same, it keeps its previous value. A fresh component has no previous value and counts as "appeared". This matters because `NgxFormFieldWrapper` mounts its error slot only while messages show, so a wrapped field's error component is created in the submit render itself.

A comparison against the previous submit count would not work for that case: a component created in the submit render has no earlier count to compare against. The render-scoped flag covers mounted and freshly created components the same way.

### 3. The channel is per form, not global

`NgxSubmitAnnouncements` is provided by `NgxSignalForm`, next to the field-visibility registry. The summary registers its "shows errors" signal there, and field errors inject it optionally. Two forms on one page do not affect each other. A summary outside the `<form>`, or a form without `ngxSignalForm`, has no channel, and its field errors announce as before. The service is `@internal`: it lives in `/core` and is not on the root barrel.

### 4. Opt-out through config

`NgxSignalFormsConfig.errorSummaryAnnouncesAlone` defaults to `true`. `false` restores the old behaviour: every field error announces on submit.

### Scope

Only blocking errors in `NgxFormFieldError` (which also serves the wrapper and `NgxFormFieldset`) and only `NgxFormFieldErrorSummary` take part. Warnings (`role="status"`, polite) and `NgxHeadlessErrorSummary` are out of scope. A headless summary renders its own markup, so the toolkit cannot know whether it announces.

## Consequences

- With a summary, a submit makes one announcement. The field errors stay visible and stay in each control's accessible description.
- Without a summary, or with the switch off, the element markup is unchanged. Angular adds one empty anchor comment for the new `@if`, and the shared `ng-template` adds anchor comments inside the error region. Comments are not in the accessibility tree and never announce. The browser spec compares markup with comments removed.
- Tests that find a field error by `[role="alert"]` after a submit on a form with a summary must now find it by its `${fieldName}-error` id or by its text.
- A programmatic `submit(form)` that does not fire a native `submit` event does not open the window. Its errors announce as before.
- Errors that arrive after the submit render (for example from async validation) announce through the field. The summary announces them too, because its content changes.

## Alternatives Considered

**Toggle `role="alert"` off for the submit render.** Rejected for the role-change reason in §1.

**Wrap submit-revealed content in a nested `aria-live="off"` element inside the alert.** Rejected. The insertion still lands inside the `role="alert"` subtree, and screen readers do not agree on how nested politeness overrides an assertive ancestor.

**Mount the field live regions only after the summary has spoken.** Rejected. It gives up the always-mounted live region, which first-insertion reliability depends on.

**Let the summary drop its own `role="alert"` and rely on focus alone.** Rejected. It changes the summary, which #522 keeps as is, and focus alone does not help a user whose screen reader ignores programmatic focus moves.

**A global service.** #522 rules it out, and it would let one form's summary silence another form.

## Related

- [ADR-0006](0006-one-cascade-seam.md) and [ADR-0007](0007-warning-display-timing-cascade.md) — the visibility cascades. This ADR changes where visible errors render, not when they show.
- [ADR-0010](0010-field-identity-shadows-registries-per-channel.md) — `aria-describedby` follows the published visibility, which is unchanged here.
- Issues [#522](https://github.com/ngx-signal-forms/ngx-signal-forms/issues/522), [#500](https://github.com/ngx-signal-forms/ngx-signal-forms/issues/500), [#497](https://github.com/ngx-signal-forms/ngx-signal-forms/issues/497), [#498](https://github.com/ngx-signal-forms/ngx-signal-forms/issues/498).
