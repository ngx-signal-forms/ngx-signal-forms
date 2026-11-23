# Accessibility statement

This statement covers `@ngx-signal-forms/toolkit`, its demo apps, and this
repository's documentation. It tells you what the toolkit does for
accessibility, what we test, what we know does not work yet, and how to tell
us about a barrier.

## Why accessibility matters here

Accessible form feedback is the reason the toolkit exists. Angular owns form
state, validation, and submission. The toolkit adds the feedback layer on top:
when an error shows, how a screen reader hears it, and where focus goes after
a failed submit. A bug in that layer becomes a barrier in every app that uses
the toolkit. So we treat an accessibility bug as a bug, not as a feature
request.

## Goal and conformance

Our target is [WCAG 2.2 Level AA](https://www.w3.org/TR/WCAG22/).

A target is not a conformance claim. Nobody has evaluated the toolkit against
WCAG 2.2 AA with a stated scope, date, method, and evaluator. Until someone
does, we do not claim conformance.

The toolkit also cannot make your app conform. It renders part of a form.
Your app owns the labels, the page structure, the content, and the finished
experience, so test your app with real users and assistive technology.

## What the toolkit does

The rendered components in `/form-field` and `/assistive` do these things for
you:

- Auto-ARIA writes `aria-invalid`, `aria-required`, and `aria-describedby` on
  each `[formField]` control. `aria-describedby` points only at messages that
  are on screen
  ([domain invariants](docs/agents/domain-invariants.md#aria-and-field-identity)).
  Auto-ARIA skips standard checkboxes and radios, because in a group the
  wrapper puts this ARIA on the group container. To opt one in, add
  `ngxSignalFormControl="checkbox"` or `ngxSignalFormControl="radio-group"`.
  A checkbox with `role="switch"` is in by default
  ([auto-ARIA eligibility](docs/CUSTOM_CONTROLS.md#inferred-kind-vs-auto-aria-eligibility)).
- Message timing keeps an error hidden while the user types in a touched
  field. The toolkit checks the field again when focus moves or the form
  submits, so a screen reader announces the error once, not on each keystroke.
- Errors render in a `role="alert"` region and warnings in a `role="status"`
  region. The regions stay mounted while empty, so the first announcement is
  not lost. One exception: when an error summary shows, the errors that a
  submit reveals render outside the alert region, because the summary
  announces them (see the summary below).
- Each message starts with a visually hidden "Error:" or "Warning:" prefix,
  so colour is not the only cue
  ([`form-field-error.ts`](packages/toolkit/assistive/form-field-error.ts)).
- After a failed submit, `focusFirstInvalid()` and `createOnInvalidHandler()`
  move focus to the first invalid field.
- `NgxFormFieldErrorSummary` has a heading and links to each invalid field.
  With the `on-submit` strategy, it takes focus after a failed submit.
  `[autoFocus]="false"` turns this off. With `on-touch` or `immediate`, it
  does not take focus, so the user is not moved while they fill in the form.
  Inside a form with `ngxSignalForm`, a summary that shows is the only thing
  that announces after a submit, so the user does not hear every error twice.
  Without `ngxSignalForm`, or with `errorSummaryAnnouncesAlone: false`, each
  field error announces too
  ([ADR-0012](docs/decisions/0012-error-summary-announces-alone.md)).
- Hints stay visible while an error shows, so format instructions do not
  disappear when the user needs them
  ([ADR-0015](docs/decisions/0015-hints-stay-visible-while-an-error-shows.md)).
- The default styles give checkbox and radio rows a 32px target and error
  summary links a 24px minimum target. They support `forced-colors`,
  `prefers-contrast: more`, `prefers-reduced-motion`, and light and dark
  colour schemes ([theming](packages/toolkit/form-field/THEMING.md)).

The `/headless` directives render no markup. If you use them, you own the
markup and its accessibility.

## Supported environments

The toolkit supports the last two major versions of Chrome, Edge, Firefox,
and Safari. Some CSS features need a newer version for full visual fidelity
([compatibility](docs/COMPATIBILITY.md#browser-support)).

This is what CI tests. On a pull request, CI runs only the projects that the
change affects (`nx affected`). On `main`, it scans every demo app.

| What                                 | How                                                                                                                                  | Browsers          | A pull request fails when                               |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ | ----------------- | ------------------------------------------------------- |
| Toolkit components                   | Vitest browser specs: axe-core with WCAG 2.2 AA rules, plus focus, accessible names, forced colours, reduced motion, and target size | Chromium          | any violation is found                                  |
| Main demo (`demo-e2e`)               | Playwright axe-core scan of every demo route as it loads                                                                             | Chromium, Firefox | a violation is found that is not in that app's baseline |
| Material, PrimeNG, and Spartan demos | Playwright axe-core scan of the home route (`/`) only                                                                                | Chromium, Firefox | a violation is found that is not in that app's baseline |

See [ADR-0004](docs/decisions/0004-wcag22-testing-strategy.md) and
[ADR-0013](docs/decisions/0013-block-pr-on-new-demo-a11y-violations.md) for
why the setup works this way. All four demo baselines are empty today
(`apps/*-e2e/a11y-baseline.json`).

What we do not test:

- Safari and other WebKit browsers. CI does not run them.
- Mobile browsers and touch input.
- Screen readers. Some designs respond to known NVDA and JAWS behaviour
  (ADR-0012), but this repository has no record of a full manual test pass
  with NVDA, JAWS, VoiceOver, TalkBack, or Narrator.
- Voice control, switch access, and screen magnifiers.
- The WCAG criteria that axe-core cannot check, such as Consistent Help and
  Redundant Entry ([`a11y.ts`](packages/toolkit/testing/a11y.ts)). A clean
  axe scan covers only part of WCAG 2.2 AA.

## Known limitations

- **Focus can land on a warning.** After a failed submit,
  `focusFirstInvalid()` can focus a field that has only a warning, when that
  field comes before a field with a blocking error. Keyboard and screen reader
  users then land on a field that does not block the submit. Until the fix
  ships, your app can focus the first blocking field itself and use
  `isBlockingError()` to skip warnings. Tracked in
  [#785](https://github.com/ngx-signal-forms/ngx-signal-forms/issues/785).
- **No save-status announcement.** The toolkit has no component that
  announces autosave states such as "Saving" and "Saved". Your app must build
  its own live region. Keep it mounted, and change its text instead of
  inserting a new region. Tracked in
  [#267](https://github.com/ngx-signal-forms/ngx-signal-forms/issues/267).
- **Native invalid styles do not match toolkit timing.** `:invalid` and
  `:user-invalid` do not follow the toolkit's message timing, and they do not
  see schema errors, server errors, or warnings. If your styles use them, a
  sighted user and a screen reader user can get different feedback. Style
  `[aria-invalid='true']` instead
  ([CSS integration](docs/CSS_FRAMEWORK_INTEGRATION.md)).
- **Older browsers get flatter styles.** Below the runtime minimum, default
  colours and the outline appearance degrade, and contrast can drop. Use a
  supported browser version.
- **Demo scans check the first render only.** The demo scan loads each route
  and does not fill in or submit forms. The toolkit browser specs check error
  and warning states, but the demo pages in those states have no automated
  scan.
- **Most themed demo pages have no scan.** The Material, PrimeNG, and Spartan
  demos scan only their home route. Their other pages have no automated scan.
- **Third-party controls.** The Angular Material, PrimeNG, and Spartan demos
  use those libraries' controls. Those libraries own the accessibility of
  their controls.

## Report an accessibility barrier

[Open an accessibility issue](https://github.com/ngx-signal-forms/ngx-signal-forms/issues/new?template=accessibility.yml).
Only one field is required: tell us what you tried to do and what went wrong.

You do not have to tell us about a disability. You do not have to send
screenshots, recordings, or code. If you can, these details help us find the
problem:

- the task you tried to do
- the page, demo route, or component
- your browser and operating system
- the assistive technology you use, and its version

If the issue form does not work for you, start a
[discussion](https://github.com/ngx-signal-forms/ngx-signal-forms/discussions)
in plain text. If the barrier is also a security problem, follow the
[security policy](SECURITY.md) instead.

## Severity levels

A severity level tells us how much a barrier stops a user from finishing a
task. A maintainer sets the level during triage. You can suggest one in the
issue form, but you do not have to.

| Level    | Label           | Effect on the user                                       | Example                                                                       |
| -------- | --------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Critical | `a11y:critical` | Cannot finish a core task, and has no workaround.        | A screen reader user cannot find out why the form did not submit.             |
| Serious  | `a11y:serious`  | Can finish the task only with a workaround or with help. | After a failed submit, focus lands on a field that does not block the submit. |
| Moderate | `a11y:moderate` | Can finish the task, but it takes extra effort.          | A screen reader reads the same error twice.                                   |
| Minor    | `a11y:minor`    | Can finish the task. The problem is small and rare.      | A demo page reads out a decorative icon.                                      |

The four names are the same as the axe-core impact levels, but they do not
mean the same thing. axe-core rates a rule. We rate what happens to a person.
A scan result can get a different level after triage.

## What happens after you report

1. The issue gets the `a11y` and `needs-triage` labels.
2. A maintainer reads it during triage. We confirm the problem and set a
   severity label, or we add `needs-info` and ask you a question.
3. We write the effect on users and any workaround in the issue. If the
   problem stays open after a release, we add it to
   [known limitations](#known-limitations).
4. The pull request with the fix links to the issue. Before we close the
   issue, we ask whether you want to check the fix.

We post in the issue when its status changes. If a fix depends on Angular or
on a third-party library, we say so and link the issue in that project.

We do not promise a fixed response time.

CI also opens an issue with the `a11y` label when a scan on `main` finds a
new demo violation.

## For contributors and coding agents

Code in `apps` and `packages` must meet WCAG 2.2 AA
([coding standards](CODING_STANDARDS.md)). For each change:

- Add or update a `*.a11y.browser.spec.ts` that calls
  `expectNoA11yViolations()` when you add a toolkit component or a new
  rendered configuration.
- Test focus, accessible names, computed styles, and media queries in a
  browser spec. jsdom has no accessibility tree
  ([testing guide](docs/TESTING.md#toolkit-specs-jsdom-or-browser)).
- Run `pnpm nx run toolkit:test-browser` and `pnpm a11y` before you open a
  pull request. `pnpm a11y` scans all four demos. To scan only the demo you
  changed, run `pnpm nx run <app>-e2e:a11y`, for example
  `pnpm nx run demo-material-e2e:a11y`.
- Do not add a violation to a demo baseline only to make CI pass. To accept
  one, first scan that demo, then run `pnpm a11y:baseline`. The baseline
  script writes only the demos that have scan results. Explain in the pull
  request why the violation is acceptable.
- Check by hand what axe-core cannot see. Write in the pull request what you
  checked, and with which browser and assistive technology.

For a change to interactive UI, do one keyboard-only pass:

- Tab and Shift+Tab reach every control in a logical order.
- Focus is always visible, and focus never gets stuck.
- Enter, Space, and the arrow keys work where a user expects them to.
- After a failed submit, focus lands on the first blocking error or on the
  error summary.

For a new component, or a change to what a component announces, do a short
screen reader check:

- Each control has a name that matches its visible label.
- The error or warning is read once, at the right time, with its prefix.
- A hint and a visible error are read as the control's description.
- An error summary is read once after a submit, and its links move focus to
  the right field.

Follow these form patterns:

- Use native HTML elements before ARIA roles.
- Give each control a visible label that is linked with `for` and `id`. Do
  not use a placeholder as a label.
- Keep `type`, `autocomplete`, and `inputmode` on native controls.
- Do not disable the submit button to block validation. Let the submit run,
  then move focus to the first error or to the error summary.
- Do not announce an error on each keystroke.
- Keep a visible `:focus-visible` indicator with at least 3:1 contrast.
- Do not change the role of a live region while it has content. Keep the
  region mounted and change its text.

For documentation and demo content:

- Use headings in order, and do not skip a level.
- Write link text that says where the link goes. Do not write "click here".
- Give each informative image alt text, and give each diagram a text
  alternative near it.
- Give each table a header row.
- Do not use colour as the only way to show meaning.
- Check that demo pages work at 200% zoom and in a narrow window.

Coding agents: [AGENTS.md](AGENTS.md) routes accessibility work to the
`accessibility-a11y` and `ngx-signal-forms` skills. Follow them. Do not write
that code conforms to WCAG, or that a manual test happened, unless a person
did that test.

## Ownership and maintenance

The maintainer, `@the-ult`, owns accessibility for this project. The owner:

- triages accessibility issues and sets their severity
- keeps the known limitations and the test setup in this statement current
- reviews changes to the demo baselines

We update this statement when a known limitation opens or closes and when the
test setup changes.

Last reviewed: 2026-11-23.

## Feedback

To suggest a change to this statement or to our practices, open a pull
request or an [accessibility issue](https://github.com/ngx-signal-forms/ngx-signal-forms/issues/new?template=accessibility.yml).
