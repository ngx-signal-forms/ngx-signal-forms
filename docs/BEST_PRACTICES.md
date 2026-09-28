# Best practices

How to use `@ngx-signal-forms/toolkit` as it is designed. Each practice says
what to do, what to avoid, and why, and links to the guide that explains more.

Angular owns the model, validation, and submission. The toolkit adds when
feedback shows, ARIA, and field UI.

---

## 1. Set defaults once, at the widest scope

**Do**

- Set app-wide defaults once in `app.config.ts` with
  `provideNgxSignalFormsConfig()`.
- For a feature that differs, use a `…ForComponent` provider and set only the
  key that differs. The other keys come from the app configuration.
- Use field inputs (`appearance`, `strategy`, …) only for a real one-field
  exception.

**Don't**

- Repeat `appearance="outline"` on every wrapper. Set
  `defaultFormFieldAppearance` once instead.
- Copy the full configuration into a component to change one key. Component
  providers merge per key.

**Why**: a default set once gives predictable results, and an explicit input
stands out as an exception. An explicit empty value counts:
`requiredMarker: ''` removes the marker, while leaving the key out keeps the
inherited marker.

See [configuration](../packages/toolkit/README.md#configuration) for every key
and default, and
[timing and configuration](./WARNINGS_SUPPORT.md#timing-and-configuration) for
which setting wins.

---

## 2. Keep Angular as the single source of truth

**Do**

- Own the model, validation, and submission with Angular's `form()`,
  `schema()`, validators, and `submit()`, as you would without the toolkit.
- Use `warningError()` only for advice the user may ignore. A rule that must
  hold before saving is a normal, blocking error.

**Don't**

- Turn blocking rules into warnings to soften the UX. Angular's `submit()`
  also rejects warnings, because they make the form invalid. To let warnings
  through, use one of the warning-aware submit paths in
  [warnings](./WARNINGS_SUPPORT.md#form-submission-behavior).
- Skip Angular's validators (`ignoreValidators: 'all'`) without checking for
  blocking errors yourself. That also lets real errors through.

**Why**: the toolkit changes only how feedback looks, so your form works the
same without it. The one exception is a warning-aware submit path, which you
choose on purpose.

See [Angular and toolkit ownership](./ANGULAR_VS_TOOLKIT.md).

---

## 3. Start with native HTML and add API only when you need it

With no extra attributes, the toolkit takes the field name from the control's
`id`, infers the control kind from the element, and writes `aria-invalid`,
`aria-required`, and `aria-describedby`.

**Do**

- Give every bound control a stable `id`. The toolkit builds all ARIA IDs from
  it. If the control cannot have one, set `fieldName` on the wrapper.
- Start with `[formRoot]` alone. Add `ngxSignalForm` when you need `on-submit`
  timing, a form-wide strategy, or an error summary. The rules for when you
  need it are in the
  [root README](../README.md#when-errors-show).
- Keep native HTML semantics (`type="email"`, `autocomplete`) on real controls.
  Put required rules in the Angular schema.

**Don't**

- Add control attributes to ordinary native fields without a reason. See
  [control kinds](./CUSTOM_CONTROLS.md#inferred-kind-vs-auto-aria-eligibility)
  for the cases that need one.
- Leave out the `id`. The form still works, but the control loses its
  `aria-describedby` link to the error, without a visible failure.

**Why**: an attribute you do not write cannot be set wrong. The explicit APIs
are for custom controls.

See [custom controls](./CUSTOM_CONTROLS.md#when-to-read-this-guide).

---

## 4. Let one party write ARIA on each control

**Do**

- Start with `ngx-form-field-wrapper`. Use `ngx-form-fieldset` when a rule
  belongs to a group of fields. To pick a different level, see
  [choose your level](../README.md#choose-your-level).
- When a widget (Material, PrimeNG, your own component) writes its own ARIA,
  add `ngxSignalFormControlAria="manual"` to it. The wrapper still shows the
  label and errors.

**Don't**

- Let the toolkit and a component library both write `aria-describedby` on one
  control. Screen readers then announce duplicate or conflicting text.
- Import the toolkit only in the parent form when a custom control has the
  `[formField]` host in its own template. Standalone imports apply only to the
  template of the component that imports them, and nothing warns you. See
  [standalone imports](./CUSTOM_CONTROLS.md#standalone-imports-are-template-local-the-most-common-gotcha).
- Leave out `focus()` on a custom control. Without it, `focusFirstInvalid()`
  and error-summary links skip the field.

**Why**: assistive technology needs one consistent value per attribute.

See [custom controls](./CUSTOM_CONTROLS.md) and
[custom wrappers](./CUSTOM_WRAPPERS.md).

---

## 5. Add validation libraries only for a reason

**Do**

- Start with Angular validators. They handle conditional, cross-field, and
  async rules without another library.
- Use `validateStandardSchema()` to reuse a schema you already have, such as
  Zod.
- Use Vest for an existing suite, or when grouped business rules are easier to
  read as Vest tests. `validateVest(path, suite, { includeWarnings: true })`
  also gives you warnings.

**Don't**

- Add Angular validators, Zod, and Vest to every form by default, or write the
  same rule in two libraries.

**Why**: each library adds a dependency. Add one for a specific reuse or
readability gain.

See [validation choices](./VALIDATION_STRATEGY.md).

---

## Quick checklist

For a new form, or a review of an existing one:

- [ ] Every bound control has a stable `id` (or the wrapper has `fieldName`)
- [ ] App-wide defaults are set once with `provideNgxSignalFormsConfig()`
- [ ] `ngxSignalForm` is on the form if it uses `on-submit` timing, a form-wide
      strategy, or an error summary
- [ ] Blocking rules are errors; warnings are only for advice the user may ignore
- [ ] One party writes ARIA on each control: the toolkit by default, `manual`
      for widgets that write their own
- [ ] Custom controls have a `focus()` method, tested with `focusFirstInvalid()`
- [ ] The component whose template has the `[formField]` host imports auto-ARIA
