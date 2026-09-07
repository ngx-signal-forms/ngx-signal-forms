# Best practices

How to use `@ngx-signal-forms/toolkit` the way it's designed to be used. Each
practice below states what to do, what to avoid, and why — with links to the
guide that goes deeper. The [root README](../README.md#guides) carries
the one-line version of this list.

Angular owns the model, validation, and submit lifecycle. The toolkit adds
presentation and accessibility, plus an explicit warning-aware submission
policy. Presentation settings resolve through their own documented chains.

---

## 1. Configure at the highest tier that's true

Each setting has its own chain, most specific first:

| Setting                                      | Resolution                                                                                        |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Error timing                                 | Field `strategy` → form `errorStrategy` → provider `defaultErrorStrategy` → `on-touch`            |
| Warning timing                               | Field `warningStrategy` → form `warningStrategy` → provider `defaultWarningStrategy` → `on-touch` |
| Submitted status                             | Explicit status → `ngxSignalForm` context → unsubmitted fallback                                  |
| Wrapper appearance, orientation, and markers | Component input → provider config → built-in default                                              |
| Control kind                                 | Explicit kind → DOM inference                                                                     |
| Control layout and ARIA mode                 | Explicit values → resolved kind's preset → no resolved value                                      |
| Error/hint renderer                          | Nearest renderer provider → inherited provider → built-in renderer                                |

Component-scoped providers inherit app defaults per key. `ngxSignalForm`
carries error strategy, warning strategy, and submitted status, not appearance
or renderers. Low-level visibility factories accept `configDefault` explicitly;
check their contracts rather than assuming every helper injects config.

**Do**

- Set org-wide defaults once in `app.config.ts` with
  `provideNgxSignalFormsConfig()`.
- Use the `…ForComponent` providers for feature-level exceptions — override
  the one key that differs and inherit the rest.
- Reserve field-level inputs (`appearance`, `strategy`, …) for genuine
  one-field exceptions.

**Don't**

- Repeat `appearance="outline"` on every wrapper in the app — that's the
  app-wide tier's job, and per-field repetition is what the cascade exists to
  remove.
- Re-provide the full config in a component when you mean to change one key.
  The merge is per-key (nullish `??`), so a partial override is the intended
  usage.

**Why** — the setting's chain makes its value predictable, and an explicit input
is an exception worth noticing. Explicit falsy values are respected:
`requiredMarker: ''` clears the marker, while omitting the key inherits it.

See [how settings resolve](../README.md#how-settings-resolve-the-cascade) and
[per-component overrides](../packages/toolkit/README.md#configuration).

---

## 2. Keep Angular as the single source of truth

**Do**

- Own the model, validation, and submission with Angular's `form()`,
  `schema()`, validators, and `submit()` — exactly as you would without the
  toolkit.
- Keep presentation separate from validation and choose submission policy explicitly.
- Use `warningError()` only for advice the user may legitimately ignore;
  anything that must hold before saving is a regular (blocking) error.

**Don't**

- Move blocking rules into warnings to "soften" the UX. Ordinary Angular
  `submit()` rejects `warn:` errors too, because they make the form invalid.
  `submitWithWarnings()` permits them after checking for blocking errors. See
  [when a warning is the wrong tool](./WARNINGS_SUPPORT.md#when-a-warning-is-the-wrong-tool).
- Treat the warning helper's microtask yield as waiting for async validation.
  It marks descendants touched, yields once, checks blocking errors in
  `errorSummary()`, then delegates with `ignoreValidators: 'all'`. Pending
  validators do not block it. Enforce any stricter pending policy in the submit
  path, not only on the button.
- Bypass Angular validators without that blocking-error gate, or invoke the
  helper inside an already-running `submission.action`.

**Why** — presentation leaves Angular's state intact, but choosing warning-aware
submission changes eligibility. Removing that helper can change whether a form
submits. Its callback settling means the action completed, not that pending
validators finished or a server independently accepted the data.

See [Angular vs toolkit](./ANGULAR_VS_TOOLKIT.md).

---

## 3. Start native, and let inference work before adding API

The zero-API path is the designed default: field identity comes from the
control's `id`, the control kind is inferred from the DOM, and auto-ARIA wires
`aria-invalid` / `aria-required` / `aria-describedby` on its own.

**Do**

- Give every bound control a stable `id` — it doubles as the field name for
  all ARIA id generation. (Or set `fieldName` on the wrapper when the control
  can't expose one.)
- Stay on plain `[formRoot]` and the default `'on-touch'` strategy until you
  actually need `'on-submit'` timing or submitted-status tracking — only then
  add `ngxSignalForm`.
- Keep native HTML semantics (`type="email"`, `autocomplete`) on
  real controls; a native `input[type="checkbox"][role="switch"]` is
  recognized as a switch without an explicit semantics directive. Put required
  constraints in the Angular schema so `[formField]` owns state synchronization.

**Don't**

- Add control overrides to ordinary native fields without a reason. Explicit
  checkbox/radio opt-in and a native control inside a library-owned ARIA system
  are valid exceptions.
- Skip the `id`: missing identity degrades gracefully (no crash) but silently
  costs you the `aria-describedby` linkage in production.

**Why** — every directive you don't write is one that can't be misconfigured.
The explicit APIs are an escape hatch for custom controls, not a baseline
requirement.

See [custom controls](./CUSTOM_CONTROLS.md) — including
[when to read it at all](./CUSTOM_CONTROLS.md#when-to-read-this-guide).

---

## 4. Pick the right surface — and exactly one ARIA owner

**Do**

- Default to `ngx-form-field-wrapper` — it's the 90% path (layout, label,
  errors, hints, counts, ARIA in one component).
- Use `ngx-form-fieldset` only when validation belongs to a group as a whole
  (cross-field rules, section summaries).
- Drop to `/assistive` for standalone feedback pieces in your own layout, and
  `/headless` when you own every element.
- When a widget (Material, PrimeNG, a custom composite) already manages its
  own ARIA, hand it ownership explicitly with
  `ngxSignalFormControlAria="manual"` — the wrapper still contributes the
  label, errors, and field identity.

**Don't**

- Layer toolkit auto-ARIA on top of a component library's internal control
  markup — two systems writing `aria-describedby` produce duplicate or
  conflicting announcements.
- Import the toolkit only in the parent form component when a custom control
  declares the `[formField]` host inside its _own_ template — standalone
  imports are template-local, and the miss is silent. See
  [the most common gotcha](./CUSTOM_CONTROLS.md#standalone-imports-are-template-local-the-most-common-gotcha).
- Forget `focus()` on a custom control — without it, `focusFirstInvalid()`
  and error-summary links silently skip the field.

**Why** — each surface is a deliberate trade of convenience against control,
and accessibility wiring must have a single writer per attribute to stay
coherent for assistive tech.

See [which part do I need](../README.md#which-part-of-the-toolkit-do-i-need)
and [custom wrappers](./CUSTOM_WRAPPERS.md) for third-party design systems.

---

## 5. Layer validation deliberately

**Do**

- Start with Angular validators, including conditional, cross-field, and async
  checks. These capabilities alone do not require another library.
- Reuse an existing contract through `validateStandardSchema()` when useful.
- Choose Vest for an existing suite or when its grouped business-policy rules
  are easier to read and maintain. It can also supply advisory guidance via
  `validateVest(path, suite, { includeWarnings: true })` (or
  `validateVestWarnings()`).

**Don't**

- Add Angular validators, Zod, and Vest to every form by default, or duplicate
  the same rule across libraries.

**Why** — layering is optional. Add a library for a specific reuse or readability
benefit, not because the form has an async check or several dependent fields.

See [validation strategies](./VALIDATION_STRATEGY.md).

---

## Quick checklist

For a new form, or a review of an existing one:

- [ ] Every bound control has a stable `id` (or the wrapper has `fieldName`)
- [ ] App-wide defaults set once via `provideNgxSignalFormsConfig()`; no
      repeated per-field inputs that all say the same thing
- [ ] Plain `[formRoot]` unless `'on-submit'` timing or submitted status is
      actually needed
- [ ] Blocking rules are errors; warnings are reserved for ignorable advice
- [ ] One ARIA owner per control — auto by default, `manual` for widgets that
      bring their own
- [ ] Custom controls implement `focus()` and are tested with
      `focusFirstInvalid()`
- [ ] Auto-ARIA is imported in the component whose template declares the
      `[formField]` host
