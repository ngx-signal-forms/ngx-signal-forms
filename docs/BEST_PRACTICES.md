# Best practices

How to use `@ngx-signal-forms/toolkit` the way it's designed to be used. Each
practice below states what to do, what to avoid, and why — with links to the
guide that goes deeper. The [root README](../README.md#best-practices) carries
the one-line version of this list.

These aren't arbitrary style rules: each one follows from the toolkit's two
design commitments — it is **additive** (Angular owns the form model,
validation, and submit lifecycle; the toolkit only adds presentation and
accessibility) and **cascade-driven** (every presentation setting resolves
through one precedence chain).

---

## 1. Configure at the highest tier that's true

The settings cascade resolves every presentation option — error strategy,
appearance, orientation, markers, control presets, renderers — through one
chain, most specific wins:

```text
field / component input
  ?? form context (ngxSignalForm)
  ?? component-scoped provider (…ForComponent)
  ?? app-wide provider (provideNgxSignalForms…)
  ?? built-in default
```

The `ngxSignalForm` tier carries only the form-owned settings — error strategy
and submitted status. Appearance, orientation, markers, presets, and renderers
skip it and resolve `input ?? provider config ?? default`.

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

**Why** — one precedence rule everywhere means any setting can be predicted by
walking the chain, and a reader of your template knows that an explicit input
is an exception worth noticing. Explicit falsy values are respected:
`requiredMarker: ''` clears the marker, while omitting the key inherits it.

See [how settings resolve](../README.md#how-settings-resolve-the-cascade) and
[per-component overrides](../README.md#per-component-overrides).

---

## 2. Keep Angular as the single source of truth

**Do**

- Own the model, validation, and submission with Angular's `form()`,
  `schema()`, validators, and `submit()` — exactly as you would without the
  toolkit.
- Treat every toolkit API as presentation or accessibility around that core.
- Use `warningError()` only for advice the user may legitimately ignore;
  anything that must hold before saving is a regular (blocking) error.

**Don't**

- Move blocking rules into warnings to "soften" the UX — warnings never block
  `submit()`, so an ignored warning ships to your API. See
  [when a warning is the wrong tool](./WARNINGS_SUPPORT.md#when-a-warning-is-the-wrong-tool).
- Hand-roll submit gating that `submitWithWarnings()` /
  `canSubmitWithWarnings()` already implement (touch-all, settle, re-entrancy
  guard).

**Why** — because the toolkit is additive, adopting or removing it never
changes what your form _does_, only how it presents. That's also your test:
if deleting a toolkit API would change the submitted data, it's being used on
the wrong side of the boundary.

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
- Keep native HTML semantics (`type="email"`, `required`, `autocomplete`) on
  real controls; a native `input[type="checkbox"][role="switch"]` is
  recognized as a switch with no directives at all.

**Don't**

- Add `ngxSignalFormControl` or `ngxSignalFormControlAria="manual"` to native
  `<input>` / `<textarea>` / `<select>` — those APIs exist for the cases
  inference can't reach (custom and third-party widgets).
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

- Keep small, field-local rules in Angular validators (`required`, `email`,
  `minLength`, …).
- Put shared contract/shape rules in Zod / OpenAPI Standard Schema via
  `validateStandardSchema()`.
- Express conditional business policy in Vest via `validateVest()`, and
  advisory `warn()` guidance via
  `validateVest(path, suite, { includeWarnings: true })` (or
  `validateVestWarnings()`).

**Don't**

- Over-centralize: piling business policy into Angular validators gets
  verbose fast, and pushing simple `required` checks into Vest adds
  abstraction for nothing.

**Why** — the three layers are complementary, and each rule reads best in the
layer built for it. They register side by side in the same schema callback.

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
