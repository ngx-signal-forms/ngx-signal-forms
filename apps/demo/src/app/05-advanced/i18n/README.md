# i18n: Runtime Language Switch

## Intent

Proves, end to end, that `provideErrorMessages()`/`provideFieldLabels()` can drive a
**runtime** language switch: validators emit plain `{ kind }` errors, a registry
resolves display text per the _current_ language, and flipping a language signal
updates already-rendered errors and labels — no reload, no re-submit.

This is **not** an `@angular/localize` (`$localize`) demo, and it does not try to be.
See [Angular's own i18n guide](https://angular.dev/guide/i18n): `$localize` messages
_"are only processed once, when the tagged string is first encountered"_, and Angular's
supported model is one build per locale (`ng build --localize`, per-locale `subPath`).
There is no supported way to switch language in a running Angular app with
`$localize` — switching language is a navigation to a different bundle, not a state
change. So a runtime switch is inherently third-party (Transloco, ngx-translate, …) or
hand-rolled. This demo hand-rolls the smallest possible version — a `signal<DemoLang>`
plus a lookup map — specifically so the toolkit contract is visible with nothing
vendor-specific in front of it. **No new dependency was added.**

### When each approach is appropriate

|                  | Runtime switch (this demo)                                                           | Build-time i18n (`$localize`)                                                           |
| ---------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| Language change  | In-app state change, no navigation                                                   | New bundle load / navigation                                                            |
| Mechanism        | Reactive language source (library or bare signal) + function-valued registry entries | `ng build --localize`, one bundle per locale                                            |
| Best for         | In-app language menu, user preference toggle, SaaS with a persisted locale setting   | Marketing sites, apps where locale is fixed per deployment/session                      |
| Registry entries | Every entry must be a **function** that reads the reactive signal                    | Entries can be plain **strings** — `$localize` output is already resolved by build time |

## The contract this demo proves (library-agnostic)

This is the same contract documented on `ErrorMessageRegistry` and
`provideFieldLabels()` in `packages/toolkit/core/providers/`, and in
[`docs/WARNINGS_SUPPORT.md`](../../../../../../docs/WARNINGS_SUPPORT.md) — it holds
identically whether the reactive source is a bare signal (as here), Transloco, or
ngx-translate:

> A registry **string** value is captured once, at injection time, and frozen for the
> lifetime of the injector — it can never change afterward, including on a language
> switch.
>
> A registry **function** value is invoked on every render, and re-renders on a
> language change **only if it reads a reactive signal during that call**. Calling
> `translate.instant(...)` (or equivalent) alone reads nothing reactive — you must
> also read the language signal.

Every entry in this demo's `provideErrorMessages()` and `provideFieldLabels()` — see
[`i18n.form.ts`](i18n.form.ts) — is a function that calls `langService.lang()` before
looking anything up. That is the entire mechanism; nothing else makes the switch work.

## Toolkit features showcased

- `provideErrorMessages(() => …)` — every entry (`required`, `email`, `minLength`) is
  a function reading `I18nDemoLanguageService.lang()`.
- `provideFieldLabels(() => …)` — the factory runs once and returns a resolver
  function; that resolver reads the same signal on every call, so the error summary's
  field labels also translate live.
- A **parameterised** message: `minLength` receives `{ minLength }` from the built-in
  validator error and interpolates it into the translated sentence, so the numeric
  param stays correct across every language.
- `<ngx-form-field-error-summary>` — demonstrates `provideFieldLabels()` outside a
  single field's own error text (the summary lists both fields by translated name).

## Document `lang` vs. region `lang` (WCAG 2.2 SC 3.1.2 — Language of Parts)

The demo app's `<html lang="en">` never changes — this page does not implement
`$localize`'s per-locale bundling, so there is no mechanism (or reason) to touch the
document-level language. What _does_ change is the content inside the switcher/form
region, so that region carries its own `[attr.lang]="langService.lang()"` — see the
wrapping `<div>` in [`i18n.form.ts`](i18n.form.ts). This is exactly the case SC 3.1.2
describes: a passage in a _different_ language from the page's default needs its own
`lang` attribute so assistive technology can switch pronunciation for that passage,
without requiring (or permitting) the whole document to claim a language it isn't
written in outside that region.

Two details worth calling out because they're easy to get subtly wrong:

- **Scope, not the whole page.** The `[attr.lang]` binding sits on a `<div>` wrapping
  only the switcher, the form's labels/inputs, its errors, and the error summary — not
  on the outer container that also holds this page's hardcoded-English heading and
  intro paragraph. Wrapping _those_ too would have marked permanently-English text
  with `lang="nl"`/`lang="ja"`, which is its own SC 3.1.2 violation in the other
  direction.
- **The switcher's own labels are exempt from the ambient language.** "English",
  "Nederlands", and "日本語" are language _names_, each written in the language they
  name — not translated UI copy that follows the current selection. Each switcher
  button therefore carries `[attr.lang]="lang"` (its own code), overriding the
  ambient `[attr.lang]="langService.lang()"` from the wrapping `<div>` for that one
  button.
- **Submit/Reset/"Saving..." are translated too**, via `UI_STRINGS` in
  [`i18n.translations.ts`](i18n.translations.ts) — precisely so nothing under the
  region-scoped `lang` attribute is left in English while that attribute claims
  otherwise.

## Form model

- Signal model: `signal<I18nDemoModel>({ fullName: '', email: '' })`.
- Schema: `form(model, i18nDemoSchema)` — see [`i18n.validations.ts`](i18n.validations.ts).
  No validator sets an explicit `{ message }`; every validator emits only its `kind`,
  so the registry is what supplies display text.

### Validation rules

- `fullName` — required; `minLength(3)`.
- `email` — required; `email` format.

There are no warnings in this demo.

## Announcement behavior (observed, not assumed)

A language switch is a **silent** content change from the user's point of view — no
new error appears, no field becomes invalid, only the _text_ of an already-visible
error changes. Whether assistive technology re-announces that is worth checking
rather than assuming, so this was traced through the actual rendering code
(`packages/toolkit/assistive/form-field-error.ts` and
`packages/toolkit/headless/src/lib/create-error-message-signal.ts`) and confirmed in
the browser rather than guessed:

- The error container carries an implicit live region — **`role="alert"`**
  (assertive) for errors, `role="status"` (polite) for warnings — applied to a
  `<div>` that is **always present in the DOM**, never itself wrapped in `@if`. Only
  its _inner_ content (`@if (errorContainerVisible())`) is conditional. This is
  deliberate: an unconditional container is what lets the very first error announce
  at all (a `role="alert"` element that's inserted along with its content doesn't
  reliably announce in every AT/browser combination — an already-present container
  whose content changes does).
- Each individual message is rendered via
  ``@for (error of resolvedErrors(); track `${error.kind}:${$index}`)`` —
  **keyed by error `kind`, not by message text**. A language switch changes
  the `message` string but not the `kind`, so the `@for` block reuses the
  _same_ `<p>`/`<li>` DOM node and only patches its text content in place.
- Net effect: a language switch is a **text-content mutation inside a persistent,
  never-destroyed live-region container** — exactly the case ARIA live regions are
  built to detect. Verified directly in a running instance of this demo: a
  `MutationObserver` was attached to the field-level `role="alert"` node's parent
  (`childList: true, subtree: true, characterData: true`), the language switcher was
  clicked, and the only recorded mutation was `type: "characterData"` with
  `oldValue: " This field is required. "` — zero `addedNodes`/`removedNodes`. A
  marker property (`fieldAlert.__marker`) set on the node _before_ the click was
  still present _after_ the click, confirming the same DOM node persisted; only its
  `textContent` changed, to `" Dit veld is verplicht. "`.
- Caveat this demo does **not** claim: DOM-mutation observation confirms the browser
  fires the accessibility events a screen reader listens for. It does not confirm any
  specific screen reader's actual announcement behavior (NVDA/JAWS/VoiceOver differ in
  how they queue/interrupt live-region updates) — that requires a manual AT pass, which
  is outside what this repo's automated suite can verify.

## Strong suites

- The only demo in this repo end to end proving a **runtime** language switch, as
  opposed to documenting the contract in prose.
- Shows the parameterised-message case (`minLength`) alongside plain string kinds
  (`required`, `email`), so the "translate + interpolate a validator param" pattern
  isn't left as an exercise for the reader.
- Traces (and tests) the live-region mechanics rather than asserting them.

## Key files

- [i18n.language.ts](i18n.language.ts) — `I18nDemoLanguageService`, the toy reactive
  language source (`signal<DemoLang>`).
- [i18n.translations.ts](i18n.translations.ts) — lookup maps for error messages and
  field labels, one entry per language.
- [i18n.model.ts](i18n.model.ts) — form model.
- [i18n.validations.ts](i18n.validations.ts) — schema; validators emit `kind` only.
- [i18n.form.ts](i18n.form.ts) — form component; `provideErrorMessages()` and
  `provideFieldLabels()` providers, language switcher UI.
- [i18n.page.ts](i18n.page.ts) — page wrapper.

## How to test

1. Run the demo and navigate to `/advanced-scenarios/i18n`.
2. Tab into **Full name** and back out empty — the required error appears in English.
3. Click **Nederlands** — the same error re-renders in Dutch immediately, with no
   reload and no re-submit.
4. Type one character into **Full name** — the parameterised `minLength` message
   appears; switch language again and confirm the number (`3`) stays correct while
   the sentence translates.
5. Submit the empty form — the error summary lists both fields by their translated
   label, not the raw `fullName`/`email` field path; switch language with the summary
   open and confirm it relabels in place.

## Related

- [docs/WARNINGS_SUPPORT.md](../../../../../../docs/WARNINGS_SUPPORT.md) — the
  translation-factory example and the string-vs-function contract in prose.
- [docs/FAQ.md](../../../../../../docs/FAQ.md) — "How do I translate error messages
  and field labels with Transloco/`$localize`?"
- [Global Configuration](../global-configuration/README.md) — component-scoped
  `provideErrorMessages()`/`provideFieldLabels()` overrides in a non-i18n context.
